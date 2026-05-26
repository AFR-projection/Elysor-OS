import { createMemory } from "@/services/memory/repository";
import type { MemoryType } from "@/types/memory";
import type { ToolExecutionContext, ToolResult } from "@/types/tools";

const VALID_TYPES: MemoryType[] = [
  "preference",
  "long_term",
  "project",
  "session",
];

export async function runMemoryCreate(
  args: {
    type?: string;
    key?: string;
    content?: string;
    importance?: number;
    category?: string;
    pinned?: boolean;
  },
  ctx: ToolExecutionContext
): Promise<ToolResult> {
  const key = args.key?.trim().replace(/\s+/g, "_").slice(0, 80) ?? "";
  const content = args.content?.trim().slice(0, 500) ?? "";
  const type = VALID_TYPES.includes(args.type as MemoryType)
    ? (args.type as MemoryType)
    : "long_term";

  if (!key || !content) {
    return {
      success: false,
      data: null,
      summary: "Invalid memory",
      error: "key and content are required",
    };
  }

  const conversationId =
    type === "session" ? (ctx.conversationId ?? null) : null;

  const record = await createMemory({
    type,
    key,
    content,
    importance: args.importance,
    category: args.category ?? null,
    pinned: args.pinned ?? false,
    conversationId,
  });

  return {
    success: true,
    data: record,
    summary: `Memory saved: ${record.key}`,
  };
}
