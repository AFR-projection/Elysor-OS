import type { AgentIntent } from "@/types/agent";
import type {
  AgentPlan,
  PlanComplexity,
  PlanStep,
  PlanStepStatus,
} from "@/types/plan";

const VALID_INTENTS: AgentIntent[] = [
  "general",
  "reasoning",
  "coding",
  "research",
  "multimodal",
];

const VALID_COMPLEXITY: PlanComplexity[] = ["simple", "moderate", "complex"];

const VALID_TOOLS = [
  "get_datetime",
  "memory_search",
  "web_search",
  "database_stats",
  "workspace_list",
  "workspace_read",
  "image_generate",
  "video_generate",
  "file_export",
  "none",
];

function sanitizeSteps(raw: unknown): PlanStep[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter(
      (s): s is Record<string, unknown> =>
        !!s && typeof s === "object" && typeof (s as PlanStep).title === "string"
    )
    .slice(0, 8)
    .map((s, i) => ({
      id: typeof s.id === "string" ? s.id : String(i + 1),
      title: String(s.title).trim(),
      description:
        typeof s.description === "string" ? s.description.trim() : undefined,
      tool:
        typeof s.tool === "string" && s.tool !== "none"
          ? s.tool
          : s.tool === null
            ? null
            : undefined,
      status: "pending" as const,
    }))
    .filter((s) => s.title.length > 0);
}

function extractJson(raw: string): string | null {
  const trimmed = raw.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced?.[1]) return fenced[1].trim();
  if (trimmed.startsWith("{")) {
    const end = trimmed.lastIndexOf("}");
    if (end > 0) return trimmed.slice(0, end + 1);
  }
  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start >= 0 && end > start) return trimmed.slice(start, end + 1);
  return null;
}

export function parsePlannerResponse(
  raw: string,
  fallbackIntent: AgentIntent
): AgentPlan {
  const fallback: AgentPlan = {
    summary: "Menjawab permintaan langsung.",
    intent: fallbackIntent,
    complexity: "simple",
    tools_needed: [],
    steps: [
      {
        id: "1",
        title: "Susun dan kirim jawaban",
        status: "pending",
      },
    ],
  };

  const candidate = extractJson(raw);
  if (!candidate) return fallback;

  try {
    const parsed = JSON.parse(candidate) as Record<string, unknown>;
    const intent = VALID_INTENTS.includes(parsed.intent as AgentIntent)
      ? (parsed.intent as AgentIntent)
      : fallbackIntent;
    const complexity = VALID_COMPLEXITY.includes(
      parsed.complexity as PlanComplexity
    )
      ? (parsed.complexity as PlanComplexity)
      : "simple";
    const tools_needed = Array.isArray(parsed.tools_needed)
      ? parsed.tools_needed
          .filter((t): t is string => typeof t === "string")
          .filter((t) => VALID_TOOLS.includes(t) && t !== "none")
          .slice(0, 6)
      : [];
    const steps = sanitizeSteps(parsed.steps);
    const summary =
      typeof parsed.summary === "string" && parsed.summary.trim()
        ? parsed.summary.trim()
        : fallback.summary;

    return {
      summary,
      intent,
      complexity,
      tools_needed,
      steps: steps.length > 0 ? steps : fallback.steps,
      approach:
        typeof parsed.approach === "string" ? parsed.approach.trim() : undefined,
    };
  } catch {
    return fallback;
  }
}

export function formatPlanForPrompt(plan: AgentPlan): string {
  const stepsBlock = plan.steps
    .map(
      (s, i) =>
        `${i + 1}. ${s.title}${s.tool ? ` [tool: ${s.tool}]` : ""}${s.description ? ` — ${s.description}` : ""}`
    )
    .join("\n");

  return `## EXECUTION PLAN (follow this strategy)
Summary: ${plan.summary}
Complexity: ${plan.complexity}
Suggested tools: ${plan.tools_needed.length ? plan.tools_needed.join(", ") : "none required"}
${plan.approach ? `Approach: ${plan.approach}\n` : ""}Steps:
${stepsBlock}

Execute the plan: use tools where indicated, then deliver the final structured response.`;
}

export function updatePlanStepStatus(
  plan: AgentPlan,
  stepId: string,
  status: PlanStepStatus
): AgentPlan {
  return {
    ...plan,
    steps: plan.steps.map((s) =>
      s.id === stepId ? { ...s, status } : s
    ),
  };
}

export function markPlanStepByTool(
  plan: AgentPlan,
  toolName: string,
  status: PlanStepStatus
): AgentPlan {
  const idx = plan.steps.findIndex(
    (s) => s.tool === toolName && s.status !== "done" && s.status !== "skipped"
  );
  if (idx < 0) return plan;
  return updatePlanStepStatus(plan, plan.steps[idx]!.id, status);
}

export function markComposeStepRunning(plan: AgentPlan): AgentPlan {
  const composeIdx = plan.steps.findIndex(
    (s) => !s.tool && s.status === "pending"
  );
  if (composeIdx < 0) return plan;
  return updatePlanStepStatus(plan, plan.steps[composeIdx]!.id, "running");
}

export function markAllPlanStepsDone(plan: AgentPlan): AgentPlan {
  return {
    ...plan,
    steps: plan.steps.map((s) =>
      s.status === "done" || s.status === "skipped"
        ? s
        : { ...s, status: "done" as const }
    ),
  };
}
