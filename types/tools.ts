export type LocalToolName =
  | "get_datetime"
  | "memory_search"
  | "memory_create"
  | "memory_update"
  | "memory_delete"
  | "database_stats"
  | "workspace_list"
  | "workspace_read"
  | "image_generate"
  | "video_generate"
  | "file_export";

/** Tools executed locally by PAIOS */
export type ToolName = LocalToolName | "web_search";

export interface ToolExecutionContext {
  timezone?: string;
  conversationId?: string;
  /** User-uploaded photo data URL for img2img in this turn */
  referenceImageUrl?: string;
}

import type { GeneratedMediaItem } from "@/types/media";

export interface ToolResult {
  success: boolean;
  data: unknown;
  summary: string;
  error?: string;
  media?: GeneratedMediaItem;
}

export interface OpenAIFunctionToolDefinition {
  type: "function";
  function: {
    name: LocalToolName;
    description: string;
    parameters: {
      type: "object";
      properties: Record<string, unknown>;
      required?: string[];
    };
  };
}

/** OpenRouter server-side web search — executed by OpenRouter, not PAIOS */
export interface OpenRouterWebSearchTool {
  type: "openrouter:web_search";
  parameters?: {
    engine?: "auto" | "native" | "exa" | "firecrawl" | "parallel";
    max_results?: number;
    max_total_results?: number;
    search_context_size?: "low" | "medium" | "high";
    user_location?: {
      type: "approximate";
      city?: string;
      region?: string;
      country?: string;
      timezone?: string;
    };
    allowed_domains?: string[];
    excluded_domains?: string[];
  };
}

export type OpenRouterTool =
  | OpenAIFunctionToolDefinition
  | OpenRouterWebSearchTool;

/** @deprecated use OpenAIFunctionToolDefinition */
export type OpenAIToolDefinition = OpenAIFunctionToolDefinition;

export const LOCAL_TOOL_NAMES: LocalToolName[] = [
  "get_datetime",
  "memory_search",
  "memory_create",
  "memory_update",
  "memory_delete",
  "database_stats",
  "workspace_list",
  "workspace_read",
  "image_generate",
  "video_generate",
  "file_export",
];

export function isLocalToolName(name: string): name is LocalToolName {
  return (LOCAL_TOOL_NAMES as string[]).includes(name);
}
