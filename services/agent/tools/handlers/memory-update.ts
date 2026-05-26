import { getMemoryById, updateMemory } from "@/services/memory/repository";
import type { MemoryType } from "@/types/memory";
import type { ToolResult } from "@/types/tools";

const VALID_TYPES: MemoryType[] = [
  "preference",
  "long_term",
  "project",
  "session",
];

export async function runMemoryUpdate(args: {
  id?: string;
  type?: string;
  key?: string;
  content?: string;
  importance?: number;
  category?: string;
  pinned?: boolean;
}): Promise<ToolResult> {
  const id = args.id?.trim();
  if (!id) {
    return {
      success: false,
      data: null,
      summary: "Missing id",
      error: "id is required",
    };
  }

  const existing = await getMemoryById(id);
  if (!existing) {
    return {
      success: false,
      data: null,
      summary: "Not found",
      error: `Memory ${id} not found`,
    };
  }

  const updated = await updateMemory(id, {
    type:
      args.type && VALID_TYPES.includes(args.type as MemoryType)
        ? (args.type as MemoryType)
        : undefined,
    key: args.key?.trim().replace(/\s+/g, "_").slice(0, 80),
    content: args.content?.trim().slice(0, 500),
    importance: args.importance,
    category: args.category !== undefined ? args.category : undefined,
    pinned: args.pinned,
  });

  return {
    success: true,
    data: updated,
    summary: `Memory updated: ${updated?.key ?? id}`,
  };
}
