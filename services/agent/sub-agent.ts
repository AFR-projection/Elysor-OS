import {
  chatCompletion,
  getWebSearchRequestCount,
} from "@/lib/openrouter";
import { TEAM_AGENT_PROFILES } from "@/lib/team-agents";
import {
  executeTool,
  getOpenRouterTools,
  toolResultToMessageContent,
} from "@/services/agent/tools";
import { truncateForSynthesis } from "@/services/agent/team-synthesizer";
import type { RealtimeContext } from "@/types/agent";
import type { OpenRouterChatMessage } from "@/types/openrouter";
import type { TeamAgentState } from "@/types/team";
import { isLocalToolName, type ToolExecutionContext } from "@/types/tools";

const MAX_SUB_AGENT_ROUNDS = 3;
const MAX_SUB_AGENT_ROUNDS_FORCE = 5;
const MAX_TOOL_RESULT_CHARS = 4_000;

function truncateAgentOutput(text: string): string {
  return truncateForSynthesis(text, 2_500);
}

function truncateToolContent(content: string): string {
  if (content.length <= MAX_TOOL_RESULT_CHARS) return content;
  return `${content.slice(0, MAX_TOOL_RESULT_CHARS)}\n\n[…tool output dipendekkan]`;
}

export type SubAgentProgress = (
  patch: Partial<TeamAgentState>
) => void;

export type SubAgentResult = {
  text: string;
  toolsUsed: string[];
};

function filterToolsForAgent(
  allTools: ReturnType<typeof getOpenRouterTools>,
  role: TeamAgentState["role"]
): ReturnType<typeof getOpenRouterTools> {
  const allowed = TEAM_AGENT_PROFILES[role].tools;
  if (!allowed?.length) return [];

  return allTools.filter((tool) => {
    if (tool.type === "openrouter:web_search") {
      return allowed.includes("web_search");
    }
    if (tool.type !== "function") return false;
    return allowed.includes(tool.function.name);
  });
}

export async function runSubAgent(input: {
  agent: TeamAgentState;
  userMessage: string;
  memoryBlock?: string;
  realtime: RealtimeContext;
  toolContext: ToolExecutionContext;
  useAgentTeam?: boolean;
  onProgress: SubAgentProgress;
}): Promise<SubAgentResult> {
  const profile = TEAM_AGENT_PROFILES[input.agent.role];
  const allTools = getOpenRouterTools(input.toolContext);
  const tools = filterToolsForAgent(allTools, input.agent.role);

  input.onProgress({
    status: "running",
    progress: 12,
    statusLabel: `${profile.name} online · ${input.agent.modelLabel}`,
  });

  await new Promise((r) => setTimeout(r, 120));

  input.onProgress({
    progress: 18,
    statusLabel: `${profile.name} menganalisis task…`,
  });

  const systemPrompt = [
    `You are ${profile.name} ${profile.emoji} on the PAIOS multi-agent team.`,
    profile.description,
    "",
    `Your specific task: ${input.agent.task}`,
    "",
    "Rules:",
    "- Focus ONLY on your assigned task",
    "- Be concise but thorough (max ~600 words)",
    "- Use tools when needed for your specialty",
    "- Output plain text findings (no JSON wrapper)",
    "",
    input.memoryBlock ? `Relevant memory:\n${input.memoryBlock.slice(0, 800)}` : "",
    "",
    `Current time: ${input.realtime.isoDateTime} (${input.realtime.timezone})`,
  ]
    .filter(Boolean)
    .join("\n");

  const messages: OpenRouterChatMessage[] = [
    {
      role: "user",
      content: `User request:\n${input.userMessage}\n\nExecute your task now.`,
    },
  ];

  const toolsUsed: string[] = [];
  let finalText = "";

  const maxRounds = input.useAgentTeam
    ? MAX_SUB_AGENT_ROUNDS_FORCE
    : MAX_SUB_AGENT_ROUNDS;

  for (let round = 0; round < maxRounds; round++) {
    input.onProgress({
      progress: Math.min(20 + round * 25, 85),
      statusLabel:
        round === 0
          ? `${profile.name} berpikir…`
          : `${profile.name} · tool round ${round + 1}`,
    });

    const response = await chatCompletion(
      [{ role: "system", content: systemPrompt }, ...messages],
      {
        model: input.agent.model,
        temperature: input.agent.intent === "coding" ? 0.3 : 0.6,
        tools: tools.length > 0 ? tools : undefined,
        tool_choice: tools.length > 0 ? "auto" : undefined,
      }
    );

    const webSearchCount = getWebSearchRequestCount(response);
    if (webSearchCount > 0 && !toolsUsed.includes("web_search")) {
      toolsUsed.push("web_search");
    }

    const assistantMsg = response.choices?.[0]?.message;
    if (!assistantMsg) break;

    if (assistantMsg.content?.trim()) {
      finalText = assistantMsg.content.trim();
    }

    const localToolCalls =
      assistantMsg.tool_calls?.filter((tc) =>
        isLocalToolName(tc.function.name)
      ) ?? [];

    if (localToolCalls.length === 0) break;

    messages.push({
      role: "assistant",
      content: assistantMsg.content ?? null,
      tool_calls: localToolCalls.map((tc) => ({
        id: tc.id,
        type: "function" as const,
        function: tc.function,
      })),
    });

    for (const toolCall of localToolCalls) {
      const toolName = toolCall.function.name;
      if (!isLocalToolName(toolName)) continue;

      input.onProgress({
        statusLabel: `${profile.name} · ${toolName.replace(/_/g, " ")}…`,
      });

      const result = await executeTool(
        toolName,
        toolCall.function.arguments,
        input.toolContext
      );

      if (!toolsUsed.includes(toolName)) {
        toolsUsed.push(toolName);
      }

      messages.push({
        role: "tool",
        tool_call_id: toolCall.id,
        content: truncateToolContent(toolResultToMessageContent(result)),
      });
    }
  }

  if (!finalText.trim()) {
    finalText = `${profile.name} selesai — tidak ada output teks tambahan.`;
  }

  finalText = truncateAgentOutput(finalText);

  input.onProgress({
    status: "done",
    progress: 100,
    statusLabel: `${profile.name} selesai`,
    output: finalText,
    toolsUsed,
  });

  return { text: finalText, toolsUsed };
}
