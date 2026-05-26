import { chatCompletion } from "@/lib/openrouter";
import { PLANNER_MODEL } from "@/lib/models";
import { buildPlannerPrompt } from "@/prompts/planner";
import { parsePlannerResponse } from "@/services/agent/plan-parser";
import { detectIntent } from "@/services/agent/intent";
import type { AgentIntent } from "@/types/agent";
import type { AgentPlan } from "@/types/plan";

export type RunPlannerInput = {
  userMessage: string;
  enabledTools: string[];
  memoryPreview?: string;
  userLanguage?: string;
};

export async function runPlanner(input: RunPlannerInput): Promise<AgentPlan> {
  const fallbackIntent = detectIntent(input.userMessage);

  if (!input.userMessage.trim()) {
    return parsePlannerResponse("", fallbackIntent);
  }

  try {
    const response = await chatCompletion(
      [
        {
          role: "system",
          content: "You output only valid JSON execution plans for PAIOS.",
        },
        {
          role: "user",
          content: buildPlannerPrompt({
            ...input,
            fallbackIntent,
          }),
        },
      ],
      {
        model: PLANNER_MODEL,
        temperature: 0.2,
        max_tokens: 800,
      }
    );

    const raw = response.choices?.[0]?.message?.content?.trim() ?? "";
    return parsePlannerResponse(raw, fallbackIntent);
  } catch (error) {
    console.warn("[planner] Failed, using fallback:", error);
    return parsePlannerResponse("", fallbackIntent);
  }
}

export function resolveIntent(
  planIntent: AgentIntent,
  regexIntent: AgentIntent,
  toolsNeeded: string[] = []
): AgentIntent {
  if (toolsNeeded.includes("web_search")) return "research";
  if (planIntent !== "general") return planIntent;
  return regexIntent;
}
