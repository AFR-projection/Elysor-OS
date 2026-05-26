import { randomUUID } from "node:crypto";
import type { ModelRoute } from "@/types/agent";
import type { TeamAgentRole } from "@/types/team";

export type TeamAgentProfile = {
  role: TeamAgentRole;
  name: string;
  emoji: string;
  description: string;
  tools?: string[];
};

/** Premium model per role — distinct high-quality LLMs by specialty. */
export const TEAM_ROLE_MODELS: Record<TeamAgentRole, ModelRoute> = {
  analyst: {
    model: "anthropic/claude-sonnet-4",
    label: "Claude Sonnet 4",
    reason: "Strategic analysis · trade-offs · breakdown",
  },
  researcher: {
    model: "openai/gpt-4o",
    label: "GPT-4o",
    reason: "Live research · web · factual synthesis",
  },
  builder: {
    model: "deepseek/deepseek-chat",
    label: "DeepSeek V3",
    reason: "Code · architecture · technical implementation",
  },
  creator: {
    model: "google/gemini-2.5-pro",
    label: "Gemini 2.5 Pro",
    reason: "Creative · visual · multimodal design",
  },
  synthesizer: {
    model: "anthropic/claude-sonnet-4",
    label: "Claude Sonnet 4",
    reason: "VIP synthesis · structured JARVIS output",
  },
};

export const TEAM_AGENT_PROFILES: Record<TeamAgentRole, TeamAgentProfile> = {
  analyst: {
    role: "analyst",
    name: "Analyst",
    emoji: "🧠",
    description: "Analisis strategi, breakdown masalah, trade-offs",
    tools: ["memory_search", "file_export"],
  },
  researcher: {
    role: "researcher",
    name: "Researcher",
    emoji: "🔍",
    description: "Fakta live, web search, data terbaru",
    tools: ["web_search", "memory_search"],
  },
  builder: {
    role: "builder",
    name: "Builder",
    emoji: "⚡",
    description: "Kode, debug, arsitektur teknis, export file",
    tools: ["workspace_read", "workspace_list", "get_datetime", "file_export"],
  },
  creator: {
    role: "creator",
    name: "Creator",
    emoji: "🎨",
    description: "Visual, kreatif, media, desain",
    tools: ["image_generate"],
  },
  synthesizer: {
    role: "synthesizer",
    name: "Synthesizer",
    emoji: "✨",
    description: "Gabungkan hasil tim jadi jawaban final VIP",
  },
};

export function getTeamRoleModel(role: TeamAgentRole): ModelRoute {
  return TEAM_ROLE_MODELS[role];
}

export function buildTeamAgentState(input: {
  role: TeamAgentRole;
  task: string;
  id?: string;
}): import("@/types/team").TeamAgentState {
  const profile = TEAM_AGENT_PROFILES[input.role];
  const route = getTeamRoleModel(input.role);

  return {
    id: input.id ?? `${input.role}-${randomUUID().slice(0, 8)}`,
    role: input.role,
    name: profile.name,
    emoji: profile.emoji,
    task: input.task,
    intent:
      input.role === "analyst" || input.role === "synthesizer"
        ? "reasoning"
        : input.role === "researcher"
          ? "research"
          : input.role === "builder"
            ? "coding"
            : "multimodal",
    model: route.model,
    modelLabel: route.label,
    status: "pending",
    progress: 0,
  };
}

export function describeTeamRoles(): string {
  return Object.values(TEAM_AGENT_PROFILES)
    .filter((p) => p.role !== "synthesizer")
    .map((p) => `${p.emoji} ${p.name} (${TEAM_ROLE_MODELS[p.role].label})`)
    .join(" · ");
}
