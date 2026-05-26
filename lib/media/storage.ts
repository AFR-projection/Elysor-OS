import fs from "node:fs/promises";
import path from "node:path";
import { randomBytes } from "node:crypto";
import { getWorkspacePath } from "@/services/agent/tools/handlers/workspace";
import { MEDIA_GENERATED_DIR } from "@/lib/media/constants";

function extFromMime(mimeType: string): string {
  const map: Record<string, string> = {
    "image/png": "png",
    "image/jpeg": "jpg",
    "image/webp": "webp",
    "image/gif": "gif",
    "video/mp4": "mp4",
    "video/webm": "webm",
    "application/pdf": "pdf",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "xlsx",
    "text/csv": "csv",
    "application/json": "json",
    "text/markdown": "md",
    "text/plain": "txt",
  };
  const base = mimeType.split(";")[0]?.trim() ?? mimeType;
  return map[base] ?? map[mimeType] ?? "bin";
}

export async function saveGeneratedFile(input: {
  buffer: Buffer;
  mimeType: string;
  prefix: "image" | "video" | "document";
  filenameHint?: string;
}): Promise<{
  filename: string;
  relativePath: string;
  url: string;
  size: number;
}> {
  const dir = await ensureGeneratedDir();
  const ext = extFromMime(input.mimeType);
  const stamp = Date.now();
  const rand = randomBytes(4).toString("hex");
  const safeHint = input.filenameHint
    ?.replace(/[^\w.-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  const filename = safeHint
    ? `${safeHint}-${stamp}.${ext}`
    : `${input.prefix}-${stamp}-${rand}.${ext}`;
  const fullPath = path.join(dir, filename);
  await fs.writeFile(fullPath, input.buffer);

  const relativePath = `${MEDIA_GENERATED_DIR}/${filename}`;
  return {
    filename,
    relativePath,
    url: `/api/media/${relativePath}`,
    size: input.buffer.length,
  };
}
export async function ensureGeneratedDir(): Promise<string> {
  const dir = path.join(getWorkspacePath(), MEDIA_GENERATED_DIR);
  await fs.mkdir(dir, { recursive: true });
  return dir;
}

export async function saveGeneratedMedia(input: {
  buffer: Buffer;
  mimeType: string;
  prefix: "image" | "video";
}): Promise<{
  filename: string;
  relativePath: string;
  url: string;
  size: number;
}> {
  const dir = await ensureGeneratedDir();
  const ext = extFromMime(input.mimeType);
  const stamp = Date.now();
  const rand = randomBytes(4).toString("hex");
  const filename = `${input.prefix}-${stamp}-${rand}.${ext}`;
  const fullPath = path.join(dir, filename);
  await fs.writeFile(fullPath, input.buffer);

  const relativePath = `${MEDIA_GENERATED_DIR}/${filename}`;
  return {
    filename,
    relativePath,
    url: `/api/media/${relativePath}`,
    size: input.buffer.length,
  };
}

export function parseDataUrl(dataUrl: string): { mimeType: string; buffer: Buffer } | null {
  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) return null;
  return {
    mimeType: match[1]!,
    buffer: Buffer.from(match[2]!, "base64"),
  };
}

export async function bufferFromImageSource(source: string): Promise<{
  buffer: Buffer;
  mimeType: string;
}> {
  if (source.startsWith("data:")) {
    const parsed = parseDataUrl(source);
    if (!parsed) throw new Error("Invalid data URL");
    return parsed;
  }

  const response = await fetch(source);
  if (!response.ok) {
    throw new Error(`Failed to fetch image (${response.status})`);
  }
  const mimeType = response.headers.get("content-type") ?? "image/png";
  const buffer = Buffer.from(await response.arrayBuffer());
  return { buffer, mimeType };
}
