import {
  chatCompletion,
  parseOpenRouterStream,
  streamChatCompletion,
} from "@/lib/openrouter";
import { FALLBACK_MODEL } from "@/lib/models";
import { getTeamRoleModel } from "@/lib/team-agents";
import { getPowerModeStructuredInstructions } from "@/lib/agent-power";
import { STRUCTURED_OUTPUT_INSTRUCTIONS } from "@/prompts/structured-output";
import { composeAgentResponse } from "@/services/agent/composer";
import { parseAgentResponse } from "@/services/agent/response-parser";
import { revealStructured } from "@/services/agent/structured-reveal";
import { ensureVipStructuredOutput } from "@/lib/chart-enrichment";
import {
  chunkTextForStream,
  StreamingTextExtractor,
} from "@/services/agent/streaming-text-extractor";
import type { AgentMeta, AgentStreamEvent } from "@/types/agent";
import type { AgentTeamPlan, TeamAgentState } from "@/types/team";

const MAX_AGENT_OUTPUT_CHARS = 2_500;
const MAX_SYNTH_INPUT_CHARS = 12_000;

const TEAM_VIP_STRUCTURED_INSTRUCTIONS = `## VIP TEAM OUTPUT (MANDATORY for 5-agent synthesis)

Output MUST be valid JSON only — the UI renders VIP charts and rich blocks.

Requirements:
- ui.type MUST be "mixed" or "dashboard" (never plain "text" alone)
- Include AT LEAST 2 chart blocks (use chartType "bar" AND "line" when data allows comparison/trend)
- Include 3–6 stat blocks with label, value, change, and trend (up/down/neutral)
- Include 1 timeline block when the answer has steps, history, or process
- Include 2–4 card blocks for key insights from each specialist angle
- Include 1 alert block (variant info or success) for the top recommendation
- text: executive summary only (2–4 sentences) — detail lives in blocks
- actions: 2–4 follow-up prompts or links when helpful`;

export function truncateForSynthesis(text: string, max = MAX_AGENT_OUTPUT_CHARS): string {
  const trimmed = text.trim();
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max)}\n\n[…dipendekkan untuk sintesis tim]`;
}

function buildTeamBrief(
  workerResults: Array<{
    worker: TeamAgentState;
    result: { text: string };
  }>
): string {
  const brief = workerResults
    .map(
      ({ worker, result }) =>
        `## ${worker.emoji} ${worker.name} (${worker.modelLabel})\nTask: ${worker.task}\n\n${truncateForSynthesis(result.text)}`
    )
    .join("\n\n---\n\n");

  if (brief.length <= MAX_SYNTH_INPUT_CHARS) return brief;
  return `${brief.slice(0, MAX_SYNTH_INPUT_CHARS)}\n\n[…input tim dipendekkan]`;
}

function buildFallbackAnswer(
  workerResults: Array<{
    worker: TeamAgentState;
    result: { text: string };
  }>
): string {
  const sections = workerResults.map(
    ({ worker, result }) =>
      `### ${worker.emoji} ${worker.name}\n${truncateForSynthesis(result.text, 1200)}`
  );
  return ["## Hasil Tim PAIOS", "", ...sections].join("\n");
}

type SynthProgressHandler = (progress: number, label?: string) => void;

async function* streamSynthesis(input: {
  synthSystem: string;
  model: string;
  onProgress?: SynthProgressHandler;
}): AsyncGenerator<string, string> {
  const stream = await streamChatCompletion(
    [
      { role: "system", content: input.synthSystem },
      {
        role: "user",
        content:
          "Synthesize the team outputs into the best final answer for the user.",
      },
    ],
    {
      model: input.model,
      temperature: 0.5,
      tool_choice: "none",
      max_tokens: 4096,
    }
  );

  if (!stream.body) {
    throw new Error("Synthesizer stream body kosong");
  }

  const extractor = new StreamingTextExtractor();
  let fullContent = "";
  let progress = 20;

  for await (const delta of parseOpenRouterStream(stream.body)) {
    fullContent += delta;
    const visible = extractor.push(delta);
    if (visible) yield visible;
    progress = Math.min(92, progress + 1);
    input.onProgress?.(progress, "Synthesizer menulis jawaban…");
  }

  return fullContent.trim();
}

async function synthesizeWithCompletion(input: {
  synthSystem: string;
  model: string;
}): Promise<string> {
  const response = await chatCompletion(
    [
      { role: "system", content: input.synthSystem },
      {
        role: "user",
        content:
          "Synthesize the team outputs into the best final answer for the user.",
      },
    ],
    {
      model: input.model,
      temperature: 0.5,
      tool_choice: "none",
      max_tokens: 4096,
    }
  );

  return response.choices?.[0]?.message?.content?.trim() ?? "";
}

export async function* runSynthesizer(input: {
  userMessage: string;
  workerResults: Array<{
    worker: TeamAgentState;
    result: { text: string; toolsUsed: string[] };
  }>;
  meta: AgentMeta;
  team: AgentTeamPlan;
  synthesizerId: string;
  onTeamPatch: (agentId: string, patch: Partial<TeamAgentState>) => AgentTeamPlan;
  workersCount: number;
  useAgentTeam?: boolean;
}): AsyncGenerator<AgentStreamEvent> {
  const teamBrief = buildTeamBrief(input.workerResults);
  const synthRoute = getTeamRoleModel("synthesizer");
  const models = [synthRoute.model, FALLBACK_MODEL].filter(
    (m, i, arr) => arr.indexOf(m) === i
  );

  const synthSystem = [
    "You are the PAIOS Synthesizer — merge specialist agent outputs into one excellent VIP final answer.",
    "Output MUST be valid JSON matching the structured schema below. This is mandatory for all team answers.",
    "Write in the user's language. Be direct, structured, and complete.",
    "Do not mention internal agent names unless helpful.",
    "",
    `${STRUCTURED_OUTPUT_INSTRUCTIONS}`,
    "",
    TEAM_VIP_STRUCTURED_INSTRUCTIONS,
    "",
    getPowerModeStructuredInstructions(input.useAgentTeam ? "max" : "sedang"),
    "",
    `Original user request:\n${input.userMessage}`,
    "",
    "Team specialist outputs:",
    teamBrief,
  ].join("\n");

  yield {
    type: "phase",
    phase: "composing",
    label: "Synthesizer menggabungkan hasil tim…",
  };

  let team = input.onTeamPatch(input.synthesizerId, {
    status: "running",
    progress: 12,
    statusLabel: "Menyusun jawaban final…",
  });
  yield {
    type: "team_agent_update",
    agentId: input.synthesizerId,
    agent: team.agents.find((a) => a.id === input.synthesizerId)!,
  };

  yield {
    type: "phase",
    phase: "streaming",
    label: "Synthesizer menulis jawaban…",
  };

  let fullContent = "";
  let usedModel = synthRoute.model;
  let usedLabel = `${synthRoute.label} · Team Synthesizer`;
  let lastError = "Synthesizer gagal";

  const emitSynthProgress = (progress: number, statusLabel: string) => {
    team = input.onTeamPatch(input.synthesizerId, { progress, statusLabel });
  };

  for (const model of models) {
    try {
      usedModel = model;
      usedLabel =
        model === synthRoute.model
          ? `${synthRoute.label} · Team Synthesizer`
          : `Fallback · Team Synthesizer`;

      fullContent = "";
      let tick = 0;
      const streamGen = streamSynthesis({
        synthSystem,
        model,
        onProgress: (progress, label) => {
          emitSynthProgress(progress, label ?? "Synthesizer menulis…");
        },
      });

      while (true) {
        const { value, done } = await streamGen.next();
        if (done) {
          fullContent = (value as string | undefined)?.trim() || fullContent;
          break;
        }
        yield { type: "delta", content: value };
        tick += 1;
        if (tick % 8 === 0) {
          yield {
            type: "team_agent_update",
            agentId: input.synthesizerId,
            agent: team.agents.find((a) => a.id === input.synthesizerId)!,
          };
        }
      }

      if (fullContent.trim()) break;
    } catch (streamError) {
      lastError =
        streamError instanceof Error ? streamError.message : "Stream synthesizer gagal";
      console.warn(`[team] Synthesizer stream failed (${model}):`, lastError);

      try {
        fullContent = await synthesizeWithCompletion({ synthSystem, model });
        if (fullContent) {
          const preview = parseAgentResponse(fullContent, input.meta, []).text;
          for (const part of chunkTextForStream(preview || fullContent)) {
            yield { type: "delta", content: part };
          }
          break;
        }
      } catch (completionError) {
        lastError =
          completionError instanceof Error
            ? completionError.message
            : "Completion synthesizer gagal";
        console.warn(`[team] Synthesizer completion failed (${model}):`, lastError);
      }
    }
  }

  if (!fullContent.trim()) {
    fullContent = buildFallbackAnswer(input.workerResults);
    usedModel = FALLBACK_MODEL;
    usedLabel = "Gemini 2.0 Flash · Team Fallback";
    console.warn("[team] Using stitched fallback answer:", lastError);
    for (const part of chunkTextForStream(fullContent)) {
      yield { type: "delta", content: part };
    }
  }

  team = input.onTeamPatch(input.synthesizerId, {
    status: "done",
    progress: 100,
    statusLabel: "Jawaban final siap",
    output: fullContent.slice(0, 300),
  });
  yield {
    type: "team_agent_update",
    agentId: input.synthesizerId,
    agent: team.agents.find((a) => a.id === input.synthesizerId)!,
  };

  const allToolsUsed = [
    ...new Set(input.workerResults.flatMap((r) => r.result.toolsUsed)),
  ];

  const finalMeta: AgentMeta = {
    ...input.meta,
    model: usedModel,
    modelLabel: usedLabel,
    routingReason: `Multi-agent team · ${input.workersCount} parallel specialists`,
    toolsUsed: allToolsUsed,
    plan: input.meta.plan,
    team,
  };

  const parsed = composeAgentResponse(
    ensureVipStructuredOutput(
      parseAgentResponse(fullContent, finalMeta, allToolsUsed),
      input.userMessage
    ),
    finalMeta
  );

  for await (const event of revealStructured(parsed)) {
    yield event;
  }

  yield {
    type: "done",
    content: parsed.text,
    structured: parsed,
    meta: finalMeta,
  };
}
