import type {
  AttachmentKind,
  MessageAttachment,
  MessageAttachmentMeta,
  OpenRouterContentPart,
} from "@/types/multimodal";

const IMAGE_MIMES = new Set([
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/bmp",
  "image/svg+xml",
]);

const VIDEO_MIMES = new Set([
  "video/mp4",
  "video/webm",
  "video/quicktime",
  "video/x-msvideo",
  "video/mpeg",
]);

const TEXT_EXTENSIONS = new Set([
  ".txt",
  ".md",
  ".json",
  ".csv",
  ".xml",
  ".html",
  ".css",
  ".js",
  ".ts",
  ".tsx",
  ".jsx",
  ".py",
  ".yaml",
  ".yml",
  ".env",
  ".log",
]);

export function detectAttachmentKind(
  mimeType: string,
  filename: string
): AttachmentKind {
  const lower = mimeType.toLowerCase();
  if (IMAGE_MIMES.has(lower) || lower.startsWith("image/")) return "image";
  if (VIDEO_MIMES.has(lower) || lower.startsWith("video/")) return "video";
  if (lower === "application/pdf") return "pdf";
  if (lower.startsWith("audio/")) return "audio";
  if (lower.startsWith("text/")) return "text";
  const ext = filename.includes(".")
    ? filename.slice(filename.lastIndexOf(".")).toLowerCase()
    : "";
  if (TEXT_EXTENSIONS.has(ext)) return "text";
  return "other";
}

export function stripDataUrl(dataUrl: string): string {
  return dataUrl.includes(",") ? dataUrl.split(",", 2)[1]! : dataUrl;
}

export function estimateDataUrlBytes(dataUrl: string): number {
  const base64 = stripDataUrl(dataUrl);
  return Math.floor((base64.length * 3) / 4);
}

export function attachmentToMeta(a: MessageAttachment): MessageAttachmentMeta {
  return {
    id: a.id,
    name: a.name,
    mimeType: a.mimeType,
    size: a.size,
    kind: a.kind,
  };
}

export function hasMultimodalAttachments(
  attachments?: MessageAttachment[]
): boolean {
  return Boolean(attachments?.some((a) => a.kind !== "text" || a.dataUrl));
}

export function summarizeAttachments(attachments: MessageAttachment[]): string {
  if (!attachments.length) return "";
  const parts = attachments.map((a) => `${a.name} (${a.kind})`);
  return `User attached ${attachments.length} file(s): ${parts.join(", ")}`;
}

/** Build OpenRouter multi-part user content (text first, then media). */
export function buildMultimodalContent(
  text: string,
  attachments: MessageAttachment[] = []
): string | OpenRouterContentPart[] {
  if (!attachments.length) return text.trim();

  const parts: OpenRouterContentPart[] = [];
  const textBlocks: string[] = [];

  if (text.trim()) textBlocks.push(text.trim());

  for (const file of attachments) {
    if (file.kind === "text" && file.textPreview) {
      textBlocks.push(
        `--- File: ${file.name} ---\n${file.textPreview.slice(0, 120_000)}`
      );
      continue;
    }

    if (!file.dataUrl) continue;

    switch (file.kind) {
      case "image":
        parts.push({
          type: "image_url",
          image_url: { url: file.dataUrl },
        });
        break;
      case "video":
        parts.push({
          type: "video_url",
          video_url: { url: file.dataUrl },
        });
        break;
      case "pdf":
        parts.push({
          type: "file",
          file: { filename: file.name, file_data: file.dataUrl },
        });
        break;
      default:
        if (file.textPreview) {
          textBlocks.push(
            `--- File: ${file.name} ---\n${file.textPreview.slice(0, 120_000)}`
          );
        }
    }
  }

  const mergedText = textBlocks.join("\n\n").trim();
  if (mergedText) {
    parts.unshift({ type: "text", text: mergedText });
  } else if (parts.length === 0) {
    return text.trim() || "Analyze the attached files.";
  }

  return parts.length === 1 && parts[0]?.type === "text"
    ? parts[0].text
    : parts;
}

export function needsPdfPlugin(
  attachments: MessageAttachment[] = []
): boolean {
  return attachments.some((a) => a.kind === "pdf");
}

export function needsVideoModel(
  attachments: MessageAttachment[] = []
): boolean {
  return attachments.some((a) => a.kind === "video");
}

export function needsVisionModel(
  attachments: MessageAttachment[] = []
): boolean {
  return attachments.some((a) =>
    ["image", "video", "pdf"].includes(a.kind)
  );
}
