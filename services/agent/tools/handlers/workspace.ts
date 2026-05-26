import fs from "node:fs/promises";
import path from "node:path";
import type { ToolResult } from "@/types/tools";

const WORKSPACE_ROOT = path.join(process.cwd(), "workspace");

const SKIP_DIRS = new Set(["node_modules", ".git", ".next"]);

function safeResolve(relativePath: string): string | null {
  const normalized = relativePath.replace(/\\/g, "/").replace(/^\/+/, "");
  const resolved = path.resolve(WORKSPACE_ROOT, normalized);
  if (!resolved.startsWith(WORKSPACE_ROOT)) return null;
  return resolved;
}

async function ensureWorkspace(): Promise<void> {
  await fs.mkdir(WORKSPACE_ROOT, { recursive: true });
}

export async function workspaceList(relativePath = "."): Promise<ToolResult> {
  await ensureWorkspace();
  const target = safeResolve(relativePath);
  if (!target) {
    return {
      success: false,
      data: null,
      summary: "Invalid path",
      error: "Path escapes workspace",
    };
  }

  try {
    const entries = await fs.readdir(target, { withFileTypes: true });
    const items = entries
      .filter((e) => !SKIP_DIRS.has(e.name))
      .slice(0, 100)
      .map((e) => ({
        name: e.name,
        type: e.isDirectory() ? "directory" : "file",
      }));

    return {
      success: true,
      data: { path: relativePath || ".", items },
      summary: `${items.length} entries in workspace/${relativePath || ""}`,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "List failed";
    return { success: false, data: null, summary: message, error: message };
  }
}

export async function workspaceRead(
  relativePath: string,
  maxChars = 24_000
): Promise<ToolResult> {
  await ensureWorkspace();
  const target = safeResolve(relativePath);
  if (!target) {
    return {
      success: false,
      data: null,
      summary: "Invalid path",
      error: "Path escapes workspace",
    };
  }

  try {
    const stat = await fs.stat(target);
    if (stat.isDirectory()) {
      return {
        success: false,
        data: null,
        summary: "Path is a directory — use workspace_list",
      };
    }
    if (stat.size > 512 * 1024) {
      return {
        success: false,
        data: null,
        summary: "File too large (>512KB) — ask user to upload via chat",
      };
    }

    const content = await fs.readFile(target, "utf8");
    const truncated = content.length > maxChars;
    return {
      success: true,
      data: {
        path: relativePath,
        size: stat.size,
        truncated,
        content: content.slice(0, maxChars),
      },
      summary: `Read ${relativePath}${truncated ? " (truncated)" : ""}`,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Read failed";
    return { success: false, data: null, summary: message, error: message };
  }
}

export function getWorkspacePath(): string {
  return WORKSPACE_ROOT;
}
