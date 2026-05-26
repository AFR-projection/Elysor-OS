import fs from "node:fs/promises";
import path from "node:path";
import { getWorkspacePath } from "@/services/agent/tools/handlers/workspace";
import { MEDIA_GENERATED_DIR } from "@/lib/media/constants";

export const runtime = "nodejs";

const MIME_BY_EXT: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".webm": "video/webm",
  ".mp4": "video/mp4",
  ".pdf": "application/pdf",
  ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ".csv": "text/csv; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".md": "text/markdown; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
};

function safeResolve(relativePath: string): string | null {
  const normalized = relativePath.replace(/\\/g, "/").replace(/^\/+/, "");
  if (!normalized.startsWith(`${MEDIA_GENERATED_DIR}/`)) return null;
  const resolved = path.resolve(getWorkspacePath(), normalized);
  const root = path.resolve(getWorkspacePath(), MEDIA_GENERATED_DIR);
  if (!resolved.startsWith(root)) return null;
  return resolved;
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ path: string[] }> }
) {
  const { path: segments } = await context.params;
  const relativePath = segments.join("/");
  const filePath = safeResolve(relativePath);

  if (!filePath) {
    return Response.json({ error: "Invalid path" }, { status: 400 });
  }

  try {
    const stat = await fs.stat(filePath);
    if (!stat.isFile()) {
      return Response.json({ error: "Not found" }, { status: 404 });
    }

    const buffer = await fs.readFile(filePath);
    const ext = path.extname(filePath).toLowerCase();
    const mime = MIME_BY_EXT[ext] ?? "application/octet-stream";
    const filename = path.basename(filePath);
    const isDocument = [".pdf", ".xlsx", ".csv", ".json", ".md", ".txt"].includes(ext);

    const headers: Record<string, string> = {
      "Content-Type": mime,
      "Cache-Control": "public, max-age=31536000, immutable",
    };

    if (isDocument) {
      headers["Content-Disposition"] = `attachment; filename="${filename}"`;
    }

    return new Response(buffer, { headers });
  } catch {
    return Response.json({ error: "Not found" }, { status: 404 });
  }
}
