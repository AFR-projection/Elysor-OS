import { buildRealtimeContext } from "@/services/agent/context";
import type { ToolExecutionContext, ToolResult } from "@/types/tools";

export function runGetDatetime(
  args: { timezone?: string },
  ctx: ToolExecutionContext
): ToolResult {
  const tz = args.timezone ?? ctx.timezone ?? "UTC";
  const data = buildRealtimeContext(tz);

  return {
    success: true,
    data,
    summary: `${data.date} ${data.time} (${data.timezone})`,
  };
}
