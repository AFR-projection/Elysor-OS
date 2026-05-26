import { FUNCTION_TOOL_DEFINITIONS } from "@/services/agent/tools/definitions";
import { buildOpenRouterTools } from "@/services/agent/tools/openrouter-tools";
import type {
  OpenAIFunctionToolDefinition,
  OpenRouterTool,
  ToolExecutionContext,
} from "@/types/tools";

export interface AgentToolInfo {
  name: string;
  description: string;
  enabled: boolean;
  /** true = OpenRouter server tool, false = PAIOS local */
  serverSide?: boolean;
}

export const AGENT_TOOLS: AgentToolInfo[] = [
  {
    name: "get_datetime",
    description: "Authoritative current date/time",
    enabled: true,
  },
  {
    name: "memory_search",
    description: "Semantic search user memory",
    enabled: true,
  },
  {
    name: "memory_create",
    description: "Save new user memory",
    enabled: true,
  },
  {
    name: "memory_update",
    description: "Update existing memory",
    enabled: true,
  },
  {
    name: "memory_delete",
    description: "Delete obsolete memory",
    enabled: true,
  },
  {
    name: "web_search",
    description: "Live web via OpenRouter (Exa/native auto)",
    enabled: true,
    serverSide: true,
  },
  {
    name: "database_stats",
    description: "PAIOS database statistics",
    enabled: true,
  },
  {
    name: "workspace_list",
    description: "List files in PAIOS workspace folder",
    enabled: true,
  },
  {
    name: "workspace_read",
    description: "Read text files from PAIOS workspace",
    enabled: true,
  },
  {
    name: "image_generate",
    description: "Generate AI images (Flux 2 Pro / Gemini)",
    enabled: true,
  },
  {
    name: "video_generate",
    description: "Generate AI video clips (Google Veo 3.1)",
    enabled: true,
  },
  {
    name: "file_export",
    description: "Export PDF, Excel, CSV, and other downloadable files",
    enabled: true,
  },
];

export function getEnabledToolNames(): string[] {
  return AGENT_TOOLS.filter((t) => t.enabled).map((t) => t.name);
}

export function getFunctionToolDefinitions(): OpenAIFunctionToolDefinition[] {
  const enabled = new Set(getEnabledToolNames());
  return FUNCTION_TOOL_DEFINITIONS.filter((t) =>
    enabled.has(t.function.name)
  );
}

/** All tools sent to OpenRouter: local functions + server web search */
export function getOpenRouterTools(ctx: ToolExecutionContext): OpenRouterTool[] {
  const tools: OpenRouterTool[] = [...getFunctionToolDefinitions()];

  if (getEnabledToolNames().includes("web_search")) {
    tools.push(...buildOpenRouterTools(ctx));
  }

  return tools;
}

/** @deprecated use getOpenRouterTools */
export function getOpenAIToolDefinitions(): OpenAIFunctionToolDefinition[] {
  return getFunctionToolDefinitions();
}
