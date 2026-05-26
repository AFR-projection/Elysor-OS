import { recallMemories } from "@/services/memory/recall";
import type { ToolExecutionContext, ToolResult } from "@/types/tools";

export async function runMemorySearch(
  args: { query?: string; limit?: number },
  ctx: ToolExecutionContext
): Promise<ToolResult> {
  const query = args.query?.trim() ?? "";
  if (!query) {
    return {
      success: false,
      data: [],
      summary: "Empty query",
      error: "query is required",
    };
  }

  const memories = await recallMemories(query, {
    conversationId: ctx.conversationId,
    limit: Math.min(args.limit ?? 8, 12),
  });

  return {
    success: true,
    data: memories,
    summary: `Found ${memories.length} memories for "${query}"`,
  };
}
