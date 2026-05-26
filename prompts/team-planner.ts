import type { AgentPlan } from "@/types/plan";

export function buildTeamPlannerPrompt(input: {
  userMessage: string;
  plan: AgentPlan;
  userLanguage?: string;
}): string {
  return `You are the PAIOS multi-agent team coordinator. Split the user request into parallel specialist tasks.

Return ONLY valid JSON:
{
  "summary": "one sentence team mission in user's language",
  "agents": [
    { "role": "analyst|researcher|builder|creator", "task": "specific sub-task" }
  ]
}

Rules:
- Assign 2-4 parallel agents (NOT synthesizer — added automatically)
- analyst: strategy, compare, breakdown, pros/cons
- researcher: live facts, news, current data, web search needed
- builder: code, debug, technical implementation, export PDF/Excel/CSV files
- creator: images, design, creative content, visuals
- If user needs a report/file (PDF, Excel): researcher gathers data, analyst structures insights, builder exports file via file_export
- Each task must be distinct and runnable in parallel
- Use same language as user (${input.userLanguage ?? "auto"})
- Do NOT duplicate tasks across agents

Existing single-agent plan for context:
Summary: ${input.plan.summary}
Complexity: ${input.plan.complexity}
Tools: ${input.plan.tools_needed.join(", ") || "none"}

User message:
"""
${input.userMessage}
"""`;
}
