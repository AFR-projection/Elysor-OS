import type { AgentIntent } from "@/types/agent";

export type TeamAgentRole =
  | "analyst"
  | "researcher"
  | "builder"
  | "creator"
  | "synthesizer";

export type TeamAgentStatus = "pending" | "running" | "done" | "error";

export interface TeamAgentState {
  id: string;
  role: TeamAgentRole;
  name: string;
  emoji: string;
  task: string;
  intent: AgentIntent;
  model: string;
  modelLabel: string;
  status: TeamAgentStatus;
  progress: number;
  statusLabel?: string;
  output?: string;
  toolsUsed?: string[];
  error?: string;
}

export interface AgentTeamPlan {
  summary: string;
  mode: "parallel";
  agents: TeamAgentState[];
  startedAt?: string;
}
