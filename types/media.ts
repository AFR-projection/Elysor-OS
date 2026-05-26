export type GeneratedFileKind = "image" | "video" | "document";

export type GeneratedFileFormat =
  | "pdf"
  | "xlsx"
  | "csv"
  | "json"
  | "markdown"
  | "txt";

export interface GeneratedMediaItem {
  id: string;
  kind: GeneratedFileKind;
  url: string;
  name: string;
  mimeType: string;
  size: number;
  prompt?: string;
  model?: string;
  conversationId?: string;
  format?: GeneratedFileFormat;
  title?: string;
}
export function dedupeGeneratedMedia(
  items: GeneratedMediaItem[]
): GeneratedMediaItem[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
}
