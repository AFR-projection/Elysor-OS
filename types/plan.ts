import type { AgentIntent } from "./agent";

export type PlanComplexity = "simple" | "moderate" | "complex";

export type PlanStepStatus = "pending" | "running" | "done" | "skipped";

export interface PlanStep {
  id: string;
  title: string;
  description?: string;
  tool?: string | null;
  status?: PlanStepStatus;
}

export interface AgentPlan {
  summary: string;
  intent: AgentIntent;
  complexity: PlanComplexity;
  tools_needed: string[];
  steps: PlanStep[];
  approach?: string;
}
