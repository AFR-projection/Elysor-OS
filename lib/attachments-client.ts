import {
  ATTACHMENT_LIMITS,
  type AttachmentKind,
  type MessageAttachment,
} from "@/types/multimodal";
import { detectAttachmentKind } from "@/lib/multimodal";

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error(`Gagal membaca ${file.name}`));
    reader.readAsDataURL(file);
  });
}

function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error(`Gagal membaca ${file.name}`));
    reader.readAsText(file);
  });
}

function maxBytesForKind(kind: AttachmentKind): number {
  switch (kind) {
    case "image":
      return ATTACHMENT_LIMITS.maxImageBytes;
    case "video":
      return ATTACHMENT_LIMITS.maxVideoBytes;
    case "pdf":
      return ATTACHMENT_LIMITS.maxPdfBytes;
    case "text":
      return ATTACHMENT_LIMITS.maxTextBytes;
    default:
      return ATTACHMENT_LIMITS.maxTextBytes;
  }
}

export async function filesToAttachments(
  files: FileList | File[]
): Promise<MessageAttachment[]> {
  const list = Array.from(files);
  const results: MessageAttachment[] = [];
  let totalBytes = 0;

  for (const file of list.slice(0, ATTACHMENT_LIMITS.maxCount)) {
    const kind = detectAttachmentKind(file.type, file.name);
    const maxBytes = maxBytesForKind(kind);

    if (file.size > maxBytes) {
      throw new Error(
        `${file.name} terlalu besar (max ${Math.round(maxBytes / 1024 / 1024)}MB)`
      );
    }
    totalBytes += file.size;
    if (totalBytes > ATTACHMENT_LIMITS.maxTotalBytes) {
      throw new Error("Total ukuran file melebihi batas 64MB");
    }

    if (kind === "text" || kind === "other") {
      const textPreview = await readFileAsText(file);
      results.push({
        id: crypto.randomUUID(),
        name: file.name,
        mimeType: file.type || "text/plain",
        size: file.size,
        kind: kind === "other" ? "text" : kind,
        textPreview,
      });
      continue;
    }

    const dataUrl = await readFileAsDataUrl(file);
    results.push({
      id: crypto.randomUUID(),
      name: file.name,
      mimeType: file.type,
      size: file.size,
      kind,
      dataUrl,
    });
  }

  return results;
}

export const ACCEPTED_FILE_TYPES =
  "image/*,video/*,application/pdf,.txt,.md,.json,.csv,.xml,.html,.css,.js,.ts,.tsx,.jsx,.py,.yaml,.yml";
