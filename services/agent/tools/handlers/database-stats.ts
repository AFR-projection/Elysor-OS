import { isDatabaseConfigured, sql } from "@/lib/db";
import type { ToolResult } from "@/types/tools";

export async function runDatabaseStats(): Promise<ToolResult> {
  if (!isDatabaseConfigured()) {
    return {
      success: false,
      data: null,
      summary: "Database not configured",
      error: "DATABASE_URL missing",
    };
  }

  const rows = await sql`
    SELECT
      (SELECT COUNT(*)::int FROM conversations) AS conversations,
      (SELECT COUNT(*)::int FROM messages) AS messages,
      (SELECT COUNT(*)::int FROM memories) AS memories
  `;

  const stats = rows[0] as {
    conversations: number;
    messages: number;
    memories: number;
  };

  return {
    success: true,
    data: stats,
    summary: `${stats.conversations} chats, ${stats.messages} messages, ${stats.memories} memories`,
  };
}
