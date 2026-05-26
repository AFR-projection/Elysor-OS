import type { AgentIntent, StreamPhase } from "./agent";
import type { AgentPlan } from "./plan";
import type { MessageAttachment, MessageAttachmentMeta } from "./multimodal";
import type { AgentStructuredResponse } from "@/types/ui-response";

export type MessageRole = "user" | "assistant";

export interface MessageMeta {
  modelUsed?: string;
  modelLabel?: string;
  routingReason?: string;
  intent?: AgentIntent;
  memoriesRecalled?: number;
  toolsUsed?: string[];
  structured?: AgentStructuredResponse;
  activeTool?: string;
  streamPhase?: StreamPhase;
  streamLabel?: string;
  streamBlockProgress?: { current: number; total: number };
  plan?: AgentPlan;
  team?: import("@/types/team").AgentTeamPlan;
  recommendUseAgent?: { reason: string; score: number };
  attachments?: (MessageAttachment | MessageAttachmentMeta)[];
  generatedMedia?: import("@/types/media").GeneratedMediaItem[];
  isStreaming?: boolean;
  isError?: boolean;
}

export interface LocalChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  createdAt: Date;
  meta?: MessageMeta;
}
