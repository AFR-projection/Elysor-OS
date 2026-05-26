import type {
  OpenRouterTool,
  OpenRouterWebSearchTool,
  ToolExecutionContext,
} from "@/types/tools";

/** OpenRouter server tool — search executed by OpenRouter (Exa/native auto) */
export function buildWebSearchServerTool(
  ctx: ToolExecutionContext
): OpenRouterWebSearchTool {
  const parameters: OpenRouterWebSearchTool["parameters"] = {
    engine: "auto",
    max_results: 5,
    max_total_results: 15,
    search_context_size: "medium",
  };

  if (ctx.timezone) {
    parameters.user_location = {
      type: "approximate",
      timezone: ctx.timezone,
    };
  }

  return {
    type: "openrouter:web_search",
    parameters,
  };
}

export function buildOpenRouterTools(
  ctx: ToolExecutionContext
): OpenRouterTool[] {
  return [buildWebSearchServerTool(ctx)];
}
