import type { AgentStructuredResponse } from "@/types/ui-response";
import type { AgentPlan } from "@/types/plan";
import type { GeneratedMediaItem } from "@/types/media";
import type { AgentTeamPlan } from "@/types/team";

export type AgentIntent =
  | "general"
  | "reasoning"
  | "coding"
  | "research"
  | "multimodal";

export type StreamPhase =
  | "planning"
  | "thinking"
  | "tooling"
  | "composing"
  | "streaming"
  | "rendering";

export interface ModelRoute {
  model: string;
  label: string;
  reason: string;
}

export interface RealtimeContext {
  isoDateTime: string;
  date: string;
  time: string;
  timezone: string;
  dayOfWeek: string;
  utcOffset: string;
}

export interface AgentMeta {
  intent: AgentIntent;
  model: string;
  modelLabel: string;
  routingReason: string;
  conversationId?: string;
  memoriesRecalled?: number;
  memoriesStored?: number;
  toolsUsed?: string[];
  generatedMedia?: GeneratedMediaItem[];
  plan?: AgentPlan;
  team?: AgentTeamPlan;
  recommendUseAgent?: {
    reason: string;
    score: number;
  };
}

export interface AgentStreamEventMeta {
  type: "meta";
  meta: AgentMeta;
}

export interface AgentStreamEventDelta {
  type: "delta";
  content: string;
}

export interface AgentStreamEventDone {
  type: "done";
  content: string;
  meta: AgentMeta;
  structured?: AgentStructuredResponse;
}

export interface AgentStreamEventError {
  type: "error";
  message: string;
}

export interface AgentStreamEventMemory {
  type: "memory";
  stored: number;
  conversationId?: string;
}

export interface AgentStreamEventTool {
  type: "tool";
  name: string;
  status: "running" | "done" | "error";
  summary?: string;
}

export interface AgentStreamEventPhase {
  type: "phase";
  phase: StreamPhase;
  label?: string;
}

export interface AgentStreamEventStructuredPartial {
  type: "structured_partial";
  structured: AgentStructuredResponse;
  blockProgress?: { current: number; total: number };
}

export interface AgentStreamEventPlan {
  type: "plan";
  plan: AgentPlan;
}

export interface AgentStreamEventPlanUpdate {
  type: "plan_update";
  plan: AgentPlan;
}

export interface AgentStreamEventMedia {
  type: "media";
  item: import("@/types/media").GeneratedMediaItem;
}

export interface AgentStreamEventTeamPlan {
  type: "team_plan";
  team: AgentTeamPlan;
}

export interface AgentStreamEventTeamAgentUpdate {
  type: "team_agent_update";
  agentId: string;
  agent: import("@/types/team").TeamAgentState;
}

export type AgentStreamEvent =
  | AgentStreamEventMeta
  | AgentStreamEventDelta
  | AgentStreamEventDone
  | AgentStreamEventError
  | AgentStreamEventMemory
  | AgentStreamEventTool
  | AgentStreamEventPhase
  | AgentStreamEventStructuredPartial
  | AgentStreamEventPlan
  | AgentStreamEventPlanUpdate
  | AgentStreamEventMedia
  | AgentStreamEventTeamPlan
  | AgentStreamEventTeamAgentUpdate;

export interface AgentResponse extends AgentStructuredResponse {
  intent: AgentIntent;
  routing_reason: string;
}
