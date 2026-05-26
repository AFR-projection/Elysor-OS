import type { AgentIntent, ModelRoute } from "@/types/agent";

/** Fast model for intent planning (cheap, low latency) */
export const PLANNER_MODEL = "google/gemini-2.0-flash-001";

/** Fallback when routed model is unavailable on OpenRouter */
export const FALLBACK_MODEL = "google/gemini-2.0-flash-001";

/** OpenRouter model IDs — verified against OpenRouter /api/v1/models */
export const MODEL_ROUTES: Record<AgentIntent, ModelRoute> = {
  general: {
    model: "google/gemini-2.0-flash-001",
    label: "Gemini 2.0 Flash",
    reason: "Fast, efficient responses for everyday conversation",
  },
  reasoning: {
    model: "anthropic/claude-sonnet-4",
    label: "Claude Sonnet 4",
    reason: "Strong multi-step reasoning and nuanced analysis",
  },
  coding: {
    model: "deepseek/deepseek-chat",
    label: "DeepSeek Chat",
    reason: "Optimized for code, debugging, and technical tasks",
  },
  research: {
    model: "openai/gpt-4o",
    label: "GPT-4o",
    reason: "Research + tool calling for live web and factual queries",
  },
  multimodal: {
    model: "google/gemini-2.5-flash",
    label: "Gemini 2.5 Flash",
    reason: "Vision + video + documents — multimodal perception",
  },
};

export function getModelRoute(intent: AgentIntent): ModelRoute {
  return MODEL_ROUTES[intent];
}

export function isModelUnavailableError(message: string): boolean {
  const lower = message.toLowerCase();
  return (
    message.includes("No endpoints found") ||
    message.includes("404") ||
    message.includes("model not found") ||
    message.includes("does not exist") ||
    message.includes("429") ||
    message.includes("402") ||
    message.includes("503") ||
    message.includes("502") ||
    lower.includes("rate limit") ||
    lower.includes("rate-limit") ||
    lower.includes("overloaded") ||
    lower.includes("insufficient") ||
    lower.includes("credit") ||
    lower.includes("provider returned error")
  );
}
