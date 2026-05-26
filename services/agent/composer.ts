import type { AgentMeta } from "@/types/agent";
import type { AgentStructuredResponse } from "@/types/ui-response";

export function composeAgentResponse(
  structured: AgentStructuredResponse,
  meta: AgentMeta
): AgentStructuredResponse {
  return {
    ...structured,
    model_used: meta.model,
    model_label: meta.modelLabel,
    tools_used: structured.tools_used ?? meta.toolsUsed ?? [],
  };
}
