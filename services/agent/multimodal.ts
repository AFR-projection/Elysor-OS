import {
  buildMultimodalContent,
  needsPdfPlugin,
  summarizeAttachments,
} from "@/lib/multimodal";
import { buildAwarenessKernel } from "@/prompts/awareness";
import type { MessageAttachment } from "@/types/multimodal";
import type { OpenRouterChatMessage } from "@/types/openrouter";
import type { OpenRouterPlugin } from "@/types/openrouter";

export function mergeAttachmentsIntoMessages(
  messages: OpenRouterChatMessage[],
  attachments: MessageAttachment[]
): OpenRouterChatMessage[] {
  if (!attachments.length) return messages;

  const result = [...messages];
  for (let i = result.length - 1; i >= 0; i--) {
    if (result[i]?.role !== "user") continue;
    const raw = result[i]?.content;
    const text =
      typeof raw === "string"
        ? raw
        : Array.isArray(raw)
          ? raw
              .filter((p) => p.type === "text")
              .map((p) => p.text)
              .join("\n")
          : "";
    result[i] = {
      ...result[i]!,
      content: buildMultimodalContent(text, attachments),
    };
    break;
  }
  return result;
}

export function buildMultimodalPlugins(
  attachments: MessageAttachment[] = []
): OpenRouterPlugin[] | undefined {
  if (!needsPdfPlugin(attachments)) return undefined;
  return [{ id: "file-parser", pdf: { engine: "cloudflare-ai" } }];
}

export function buildAwarenessForTurn(input: {
  attachments?: MessageAttachment[];
  hasPlan?: boolean;
  memoryCount?: number;
}): string {
  return buildAwarenessKernel({
    hasAttachments: Boolean(input.attachments?.length),
    attachmentSummary: input.attachments?.length
      ? summarizeAttachments(input.attachments)
      : undefined,
    hasPlan: input.hasPlan,
    memoryCount: input.memoryCount,
  });
}
