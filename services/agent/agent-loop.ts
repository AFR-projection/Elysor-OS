import {
  chatCompletion,
  getWebSearchRequestCount,
  parseOpenRouterStream,
  streamChatCompletion,
} from "@/lib/openrouter";
import {
  executeTool,
  getOpenRouterTools,
  toolResultToMessageContent,
} from "@/services/agent/tools";
import { ensureVipStructuredOutput } from "@/lib/chart-enrichment";
import { composeAgentResponse } from "@/services/agent/composer";
import {
  buildFallbackFileExportArgs,
  buildImagePromptFromUser,
  buildSimpleFileExportArgs,
  buildVideoPromptFromUser,
  detectFileExportRequest,
  detectImageGenerationRequest,
  detectVideoGenerationRequest,
  resolveFileExportIntent,
  resolveVideoDuration,
  type FileExportIntent,
} from "@/services/agent/generation-intent";
import { parseAgentResponse } from "@/services/agent/response-parser";
import { revealStructured } from "@/services/agent/structured-reveal";
import {
  chunkTextForStream,
  StreamingTextExtractor,
} from "@/services/agent/streaming-text-extractor";
import type { AgentMeta, AgentStreamEvent } from "@/types/agent";
import type { AgentStructuredResponse } from "@/types/ui-response";
import type { OpenRouterChatMessage } from "@/types/openrouter";
import type { OpenRouterPlugin } from "@/types/openrouter";
import { isLocalToolName, type ToolExecutionContext } from "@/types/tools";
import { dedupeGeneratedMedia, type GeneratedMediaItem } from "@/types/media";
import { isModelUnavailableError } from "@/lib/models";
import { runFileExport } from "@/services/agent/tools/handlers/file-export";
import { runImageGenerate } from "@/services/agent/tools/handlers/image-generate";
import { runVideoGenerate } from "@/services/agent/tools/handlers/video-generate";

const MAX_TOOL_ROUNDS = 6;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getLastUserText(messages: OpenRouterChatMessage[]): string {
  const lastUser = [...messages].reverse().find((m) => m.role === "user");
  if (!lastUser?.content) return "";
  if (typeof lastUser.content === "string") return lastUser.content;
  if (Array.isArray(lastUser.content)) {
    return lastUser.content
      .filter((p) => p.type === "text")
      .map((p) => p.text)
      .join("\n");
  }
  return "";
}

function resolveEffectiveGenerationHint(
  input: AgentLoopInput,
  messages: OpenRouterChatMessage[]
): "image" | "video" | null {
  if (input.generationHint) return input.generationHint;
  const lastUserText = getLastUserText(messages);
  if (detectVideoGenerationRequest(lastUserText)) return "video";
  if (detectImageGenerationRequest(lastUserText)) return "image";
  return null;
}

function resolveEffectiveFileExportIntent(
  input: AgentLoopInput,
  messages: OpenRouterChatMessage[]
): FileExportIntent | null {
  if (input.fileExportIntent) return input.fileExportIntent;
  const lastUserText = getLastUserText(messages);
  if (!detectFileExportRequest(lastUserText)) return null;
  return resolveFileExportIntent(lastUserText, {});
}

export type AgentLoopInput = {
  systemPrompt: string;
  messages: OpenRouterChatMessage[];
  meta: AgentMeta;
  toolContext: ToolExecutionContext;
  temperature: number;
  plugins?: OpenRouterPlugin[];
  generationHint?: "image" | "video" | null;
  fileExportIntent?: FileExportIntent | null;
  preGeneratedMedia?: import("@/types/media").GeneratedMediaItem[];
  referenceImageUrl?: string;
  skipToolLoop?: boolean;
  maxToolRounds?: number;
};

function trackWebSearchUsage(
  toolsUsed: string[],
  webSearchCount: number
): boolean {
  if (webSearchCount <= 0) return false;
  if (!toolsUsed.includes("web_search")) {
    toolsUsed.push("web_search");
  }
  return true;
}

async function* streamFromOpenRouter(
  systemPrompt: string,
  workingMessages: OpenRouterChatMessage[],
  meta: AgentMeta,
  temperature: number,
  plugins?: OpenRouterPlugin[]
): AsyncGenerator<AgentStreamEvent | { kind: "full"; content: string }> {
  const stream = await streamChatCompletion(
    [{ role: "system", content: systemPrompt }, ...workingMessages],
    {
      model: meta.model,
      temperature,
      tool_choice: "none",
      plugins,
    }
  );

  const extractor = new StreamingTextExtractor();
  let fullContent = "";

  yield {
    type: "phase",
    phase: "streaming",
    label: "Menulis respons…",
  };

  for await (const delta of parseOpenRouterStream(stream.body!)) {
    fullContent += delta;
    const visible = extractor.push(delta);
    if (visible) {
      yield { type: "delta", content: visible };
    }
  }

  yield { kind: "full", content: fullContent };
}

/**
 * Tool loop + live token streaming with progressive structured UI reveal.
 */
export async function* runAgentLoop(
  input: AgentLoopInput
): AsyncGenerator<AgentStreamEvent> {
  const tools = getOpenRouterTools(input.toolContext);
  const toolsUsed: string[] = [];
  const generatedMedia: GeneratedMediaItem[] = [
    ...(input.preGeneratedMedia ?? []),
  ];
  const workingMessages: OpenRouterChatMessage[] = [...input.messages];
  let lastAssistantContent = "";
  let hadLocalToolCalls = (input.preGeneratedMedia?.length ?? 0) > 0;
  const effectiveHint = resolveEffectiveGenerationHint(input, workingMessages);
  const effectiveFileExport = resolveEffectiveFileExportIntent(input, workingMessages);
  const maxToolRounds = input.maxToolRounds ?? MAX_TOOL_ROUNDS;

  try {
    if (!input.skipToolLoop && tools.length > 0) {
      yield {
        type: "phase",
        phase: "tooling",
        label: "Menyiapkan tools…",
      };

      try {
        for (let round = 0; round < maxToolRounds; round++) {
          const response = await chatCompletion(
            [{ role: "system", content: input.systemPrompt }, ...workingMessages],
            {
              model: input.meta.model,
              temperature: input.temperature,
              tools,
              tool_choice: "auto",
              plugins: input.plugins,
            }
          );

          const webSearchCount = getWebSearchRequestCount(response);
          if (trackWebSearchUsage(toolsUsed, webSearchCount)) {
            yield {
              type: "tool",
              name: "web_search",
              status: "done",
              summary: `${webSearchCount} search${webSearchCount > 1 ? "es" : ""} via OpenRouter`,
            };
          }

          const choice = response.choices?.[0];
          if (!choice) break;

          const assistantMsg = choice.message;

          if (assistantMsg.content?.trim()) {
            lastAssistantContent = assistantMsg.content.trim();
          }

          const localToolCalls =
            assistantMsg.tool_calls?.filter((tc) =>
              isLocalToolName(tc.function.name)
            ) ?? [];

          if (localToolCalls.length > 0) {
            hadLocalToolCalls = true;

            workingMessages.push({
              role: "assistant",
              content: assistantMsg.content ?? null,
              tool_calls: localToolCalls.map((tc) => ({
                id: tc.id,
                type: "function" as const,
                function: tc.function,
              })),
            });

            for (const toolCall of localToolCalls) {
              const toolName = toolCall.function.name;
              if (!isLocalToolName(toolName)) continue;

              yield {
                type: "phase",
                phase: "tooling",
                label: `Menjalankan ${toolName.replace(/_/g, " ")}…`,
              };
              yield { type: "tool", name: toolName, status: "running" };

              try {
                const result = await executeTool(
                  toolName,
                  toolCall.function.arguments,
                  input.toolContext
                );

                if (!toolsUsed.includes(toolName)) {
                  toolsUsed.push(toolName);
                }

                yield {
                  type: "tool",
                  name: toolName,
                  status: result.success ? "done" : "error",
                  summary: result.summary,
                };

                if (result.media) {
                  generatedMedia.push(result.media);
                  yield { type: "media", item: result.media };
                }

                workingMessages.push({
                  role: "tool",
                  tool_call_id: toolCall.id,
                  content: toolResultToMessageContent(result),
                });
              } catch (err) {
                const message =
                  err instanceof Error ? err.message : "Tool execution failed";
                yield {
                  type: "tool",
                  name: toolName,
                  status: "error",
                  summary: message,
                };
                workingMessages.push({
                  role: "tool",
                  tool_call_id: toolCall.id,
                  content: JSON.stringify({ success: false, error: message }),
                });
              }
            }
            continue;
          }

          break;
        }
      } catch (toolLoopError) {
        const message =
          toolLoopError instanceof Error
            ? toolLoopError.message
            : "Tool loop failed";
        console.warn("[agent] Tool loop failed:", message);
        if (isModelUnavailableError(message)) {
          throw toolLoopError;
        }
      }
    }

    if (
      effectiveHint === "image" &&
      !generatedMedia.some((m) => m.kind === "image")
    ) {
      yield {
        type: "phase",
        phase: "tooling",
        label: input.referenceImageUrl
          ? "Edit gambar AI · referensi foto kamu…"
          : "Generate gambar AI · Flux 2 Pro…",
      };
      yield { type: "tool", name: "image_generate", status: "running" };

      const lastUserText = getLastUserText(workingMessages);
      const prompt = buildImagePromptFromUser(lastUserText, {
        hasReference: Boolean(input.referenceImageUrl),
      });

      const result = await runImageGenerate(
        {
          prompt: buildImagePromptFromUser(prompt, {
            hasReference: Boolean(input.referenceImageUrl),
          }),
          reference_image_url: input.referenceImageUrl,
        },
        input.toolContext
      );
      if (!toolsUsed.includes("image_generate")) {
        toolsUsed.push("image_generate");
      }
      yield {
        type: "tool",
        name: "image_generate",
        status: result.success ? "done" : "error",
        summary: result.summary,
      };
      if (result.media) {
        generatedMedia.push(result.media);
        yield { type: "media", item: result.media };
      }
      hadLocalToolCalls = true;
      lastAssistantContent = "";
    }

    if (
      effectiveHint === "video" &&
      !generatedMedia.some((m) => m.kind === "video")
    ) {
      const { duration } = resolveVideoDuration(getLastUserText(workingMessages));
      yield {
        type: "phase",
        phase: "tooling",
        label: "Generate video AI · Google Veo 3.1…",
      };
      yield { type: "tool", name: "video_generate", status: "running" };

      const prompt = buildVideoPromptFromUser(getLastUserText(workingMessages));

      const result = await runVideoGenerate({ prompt, duration }, input.toolContext);
      if (!toolsUsed.includes("video_generate")) {
        toolsUsed.push("video_generate");
      }
      yield {
        type: "tool",
        name: "video_generate",
        status: result.success ? "done" : "error",
        summary: result.summary,
      };
      if (result.media) {
        generatedMedia.push(result.media);
        yield { type: "media", item: result.media };
      }
      hadLocalToolCalls = true;
      lastAssistantContent = "";
    }

    if (
      effectiveFileExport &&
      !generatedMedia.some((m) => m.kind === "document")
    ) {
      const lastUserText = getLastUserText(workingMessages);
      yield {
        type: "phase",
        phase: "tooling",
        label: `Membuat file ${effectiveFileExport.format.toUpperCase()}…`,
      };
      yield { type: "tool", name: "file_export", status: "running" };

      const exportArgs = effectiveFileExport.simple
        ? buildSimpleFileExportArgs(lastUserText, effectiveFileExport.format)
        : buildFallbackFileExportArgs(
            lastUserText,
            effectiveFileExport.format,
            lastAssistantContent
          );

      const result = await runFileExport(exportArgs, input.toolContext);
      if (!toolsUsed.includes("file_export")) {
        toolsUsed.push("file_export");
      }
      yield {
        type: "tool",
        name: "file_export",
        status: result.success ? "done" : "error",
        summary: result.summary,
      };
      if (result.media) {
        generatedMedia.push(result.media);
        yield { type: "media", item: result.media };
      }
      hadLocalToolCalls = true;
      lastAssistantContent = "";
    }

    yield {
      type: "phase",
      phase: "composing",
      label: "Menyusun jawaban…",
    };

    let fullContent = "";
    let streamedLive = false;

    const useTextOnlyShortcut =
      Boolean(lastAssistantContent) &&
      !hadLocalToolCalls &&
      !effectiveHint &&
      !effectiveFileExport &&
      generatedMedia.length === 0;

    if (useTextOnlyShortcut) {
      fullContent = lastAssistantContent;
    } else {
      for await (const event of streamFromOpenRouter(
        input.systemPrompt,
        workingMessages,
        input.meta,
        input.temperature,
        input.plugins
      )) {
        if ("kind" in event) {
          fullContent = event.content;
          continue;
        }
        if (event.type === "delta") streamedLive = true;
        yield event;
      }

      if (!fullContent.trim() && lastAssistantContent) {
        fullContent = lastAssistantContent;
      }

      if (!fullContent.trim()) {
        const fallback = await chatCompletion(
          [{ role: "system", content: input.systemPrompt }, ...workingMessages],
          {
            model: input.meta.model,
            temperature: input.temperature,
            tool_choice: "none",
            plugins: input.plugins,
          }
        );
        fullContent =
          fallback.choices?.[0]?.message?.content?.trim() ??
          "Maaf, respons kosong. Silakan coba kirim ulang pesanmu.";
      }
    }

    const lastUserText = getLastUserText(input.messages);
    const parsed = composeAgentResponse(
      ensureVipStructuredOutput(
        parseAgentResponse(fullContent, input.meta, toolsUsed),
        lastUserText
      ),
      input.meta
    );

    if (!streamedLive && parsed.text) {
      for (const part of chunkTextForStream(parsed.text)) {
        yield { type: "delta", content: part };
        await sleep(8);
      }
    }

    for await (const event of revealStructured(parsed)) {
      yield event;
    }

    yield {
      type: "done",
      content: parsed.text,
      structured: parsed,
      meta: { ...input.meta, toolsUsed, generatedMedia: dedupeGeneratedMedia(generatedMedia) },
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown agent error";
    yield { type: "error", message };
  }
}
