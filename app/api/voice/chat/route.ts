import { isDatabaseConfigured } from "@/lib/db";
import { streamSpeechFromOpenRouter } from "@/lib/openrouter-audio";
import { shouldFallbackFromOpenRouterAudio } from "@/lib/voice/audio-errors";
import { resolveTimezone } from "@/lib/timezone";
import {
  DEFAULT_VOICE_TTS_VOICE,
  VOICE_TTS_VOICES,
  type VoiceTtsVoice,
} from "@/lib/voice/constants";
import { runAgent } from "@/services/agent/orchestrator";
import {
  createConversation,
  insertMessage,
  titleFromFirstMessage,
  updateConversationTitle,
} from "@/services/conversations";
import { extractAndStoreMemories, getServerMemoryPreferences } from "@/services/memory";
import type { AgentMeta } from "@/types/agent";
import type { OpenRouterChatMessage } from "@/types/openrouter";

export const runtime = "nodejs";

function encodeEvent(data: unknown): string {
  return `data: ${JSON.stringify(data)}\n\n`;
}

type VoiceChatBody = {
  messages: OpenRouterChatMessage[];
  timezone?: string;
  conversationId?: string | null;
  voice?: VoiceTtsVoice;
  language?: string;
};

function plainText(content: OpenRouterChatMessage["content"]): string {
  if (!content) return "";
  if (typeof content === "string") return content;
  return content
    .filter((p) => p.type === "text")
    .map((p) => p.text)
    .join("\n");
}

/** Strip markdown-ish noise for natural TTS */
function speechify(text: string): string {
  return text
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/#{1,6}\s/g, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 4000);
}

export async function POST(request: Request) {
  let body: VoiceChatBody;

  try {
    body = (await request.json()) as VoiceChatBody;
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!Array.isArray(body.messages) || body.messages.length === 0) {
    return Response.json(
      { error: "messages array is required" },
      { status: 400 }
    );
  }

  const timezone = resolveTimezone(
    body.timezone ?? request.headers.get("x-timezone")
  );

  const lastUser = [...body.messages]
    .reverse()
    .find((m) => m.role === "user");

  const userText = plainText(lastUser?.content).trim();
  if (!userText) {
    return Response.json({ error: "No user message found" }, { status: 400 });
  }

  const voice =
    body.voice && VOICE_TTS_VOICES.includes(body.voice)
      ? body.voice
      : DEFAULT_VOICE_TTS_VOICE;

  let conversationId = body.conversationId ?? null;

  if (isDatabaseConfigured()) {
    try {
      if (!conversationId) {
        const conv = await createConversation(titleFromFirstMessage(userText));
        conversationId = conv.id;
      }

      await insertMessage({
        conversationId,
        role: "user",
        content: userText,
        metadata: { source: "voice" },
      });

      const userMsgCount = body.messages.filter((m) => m.role === "user").length;
      if (userMsgCount <= 1) {
        await updateConversationTitle(
          conversationId,
          titleFromFirstMessage(userText)
        );
      }
    } catch (error) {
      console.error("[voice/chat] DB persist (user):", error);
    }
  }

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      let assistantContent = "";
      let finalMeta: AgentMeta | null = null;

      const send = (payload: unknown) => {
        controller.enqueue(encoder.encode(encodeEvent(payload)));
      };

      try {
        send({ type: "user_transcript", text: userText });
        send({ type: "phase", phase: "thinking", label: "PAIOS berpikir…" });

        for await (const event of runAgent({
          messages: body.messages,
          timezone,
          conversationId: conversationId ?? undefined,
        })) {
          if (request.signal.aborted) break;

          if (event.type === "phase") {
            send({
              type: "phase",
              phase: event.phase,
              label: event.label ?? "Memproses…",
            });
          }

          if (event.type === "delta") {
            assistantContent += event.content;
            send({ type: "agent_delta", content: event.content });
          }

          if (event.type === "meta") {
            finalMeta = {
              ...event.meta,
              conversationId: conversationId ?? event.meta.conversationId,
            };
          }

          if (event.type === "done") {
            assistantContent = event.content;
            finalMeta = event.meta;
          }

          if (event.type === "error") {
            send({ type: "error", message: event.message });
            return;
          }
        }

        if (!assistantContent.trim()) {
          send({ type: "error", message: "Respons kosong dari agent." });
          return;
        }

        send({
          type: "agent_done",
          content: assistantContent,
          meta: finalMeta ?? undefined,
        });

        if (isDatabaseConfigured() && conversationId && finalMeta) {
          try {
            const savedAssistant = await insertMessage({
              conversationId,
              role: "assistant",
              content: assistantContent,
              modelUsed: finalMeta.model,
              modelLabel: finalMeta.modelLabel,
              intent: finalMeta.intent,
              routingReason: finalMeta.routingReason,
              metadata: {
                source: "voice",
                memoriesRecalled: finalMeta.memoriesRecalled ?? 0,
                toolsUsed: finalMeta.toolsUsed ?? [],
              },
            });

            try {
              const memoryPrefs = await getServerMemoryPreferences();
              if (memoryPrefs.autoLearnFromChat) {
                await extractAndStoreMemories({
                  userMessage: userText,
                  assistantMessage: assistantContent,
                  conversationId,
                  sourceMessageId: savedAssistant.id,
                });
              }
            } catch (err) {
              console.error("[voice/chat] memory extract:", err);
            }
          } catch (error) {
            console.error("[voice/chat] DB persist (assistant):", error);
          }
        }

        const speakText = speechify(assistantContent);
        send({ type: "phase", phase: "speaking", label: "PAIOS berbicara…" });

        try {
          for await (const chunk of streamSpeechFromOpenRouter(speakText, {
            voice,
            signal: request.signal,
          })) {
            if (request.signal.aborted) break;

            if (chunk.kind === "audio") {
              send({ type: "audio", data: chunk.data });
            } else {
              send({ type: "tts_transcript", content: chunk.content });
            }
          }
        } catch (ttsError) {
          const message =
            ttsError instanceof Error ? ttsError.message : "TTS gagal";
          if (shouldFallbackFromOpenRouterAudio(message)) {
            send({
              type: "tts_fallback",
              text: speakText,
              reason: message,
            });
          } else {
            throw ttsError;
          }
        }

        send({ type: "done" });
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Voice chat failed";
        console.error("[voice/chat]", message);
        send({ type: "error", message });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
