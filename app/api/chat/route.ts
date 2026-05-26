import { isDatabaseConfigured } from "@/lib/db";
import { resolveTimezone } from "@/lib/timezone";
import { runAgent } from "@/services/agent/orchestrator";
import {
  createConversation,
  insertMessage,
  titleFromFirstMessage,
  updateConversationTitle,
} from "@/services/conversations";
import { extractAndStoreMemories, getServerMemoryPreferences } from "@/services/memory";
import type { AgentMeta } from "@/types/agent";
import type { AgentStructuredResponse } from "@/types/ui-response";
import type { MessageAttachment } from "@/types/multimodal";
import type { OpenRouterChatMessage } from "@/types/openrouter";
import { attachmentToMeta } from "@/lib/multimodal";

export const runtime = "nodejs";
export const maxDuration = 300;

type ChatRequestBody = {
  messages: OpenRouterChatMessage[];
  attachments?: MessageAttachment[];
  timezone?: string;
  conversationId?: string | null;
};

function encodeEvent(data: unknown): string {
  return `data: ${JSON.stringify(data)}\n\n`;
}

function getMessageText(content: OpenRouterChatMessage["content"]): string {
  if (!content) return "";
  if (typeof content === "string") return content;
  return content
    .filter((p) => p.type === "text")
    .map((p) => p.text)
    .join("\n");
}

export async function POST(request: Request) {
  let body: ChatRequestBody;

  try {
    body = (await request.json()) as ChatRequestBody;
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

  if (!lastUser?.content) {
    return Response.json({ error: "No user message found" }, { status: 400 });
  }

  const userContent = getMessageText(lastUser.content).trim();
  const hasAttachments = Boolean(body.attachments?.length);

  if (!userContent && !hasAttachments) {
    return Response.json({ error: "No user message found" }, { status: 400 });
  }

  const displayContent =
    userContent ||
    (body.attachments?.[0]?.name
      ? `📎 ${body.attachments.map((a) => a.name).join(", ")}`
      : "Lampiran file");

  let conversationId = body.conversationId ?? null;
  if (isDatabaseConfigured()) {
    try {
      if (!conversationId) {
        const conv = await createConversation(
          titleFromFirstMessage(displayContent)
        );
        conversationId = conv.id;
      }

      await insertMessage({
        conversationId,
        role: "user",
        content: displayContent,
        metadata: {
          attachments: body.attachments?.map(attachmentToMeta),
        },
      });

      const userMsgCount = body.messages.filter((m) => m.role === "user").length;
      if (userMsgCount <= 1) {
        await updateConversationTitle(
          conversationId,
          titleFromFirstMessage(displayContent)
        );
      }
    } catch (error) {
      console.error("[chat] DB persist (user):", error);
    }
  }

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      let finalMeta: AgentMeta | null = null;
      let finalStructured: AgentStructuredResponse | null = null;
      let assistantContent = "";

      try {
        for await (const event of runAgent({
          messages: body.messages,
          attachments: body.attachments,
          timezone,
          conversationId: conversationId ?? undefined,
        })) {
          if (request.signal.aborted) break;
          if (event.type === "meta") {
            finalMeta = {
              ...event.meta,
              conversationId: conversationId ?? event.meta.conversationId,
            };
            controller.enqueue(
              encoder.encode(encodeEvent({ type: "meta", meta: finalMeta }))
            );
            continue;
          }

          if (event.type === "delta") {
            assistantContent += event.content;
          }

          if (event.type === "done") {
            assistantContent = event.content;
            finalMeta = event.meta;
            finalStructured = event.structured ?? null;
          }

          controller.enqueue(encoder.encode(encodeEvent(event)));
        }

        if (
          isDatabaseConfigured() &&
          conversationId &&
          assistantContent &&
          finalMeta
        ) {
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
                memoriesRecalled: finalMeta.memoriesRecalled ?? 0,
                toolsUsed: finalMeta.toolsUsed ?? [],
                structured: finalStructured,
                plan: finalMeta.plan,
                team: finalMeta.team,
                generatedMedia: finalMeta.generatedMedia ?? [],
              },
            });

            try {
              const memoryPrefs = await getServerMemoryPreferences();
              if (memoryPrefs.autoLearnFromChat) {
                const stored = await extractAndStoreMemories({
                  userMessage: displayContent,
                  assistantMessage: assistantContent,
                  conversationId,
                  sourceMessageId: savedAssistant.id,
                });
                if (stored.length > 0) {
                  controller.enqueue(
                    encoder.encode(
                      encodeEvent({
                        type: "memory",
                        stored: stored.length,
                        conversationId,
                      })
                    )
                  );
                }
              }
            } catch (err) {
              console.error("[chat] memory extract:", err);
            }
          } catch (error) {
            console.error("[chat] DB persist (assistant):", error);
          }
        }
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Stream failed";
        controller.enqueue(
          encoder.encode(encodeEvent({ type: "error", message }))
        );
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
