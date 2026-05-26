import { resolveTimezone } from "@/lib/timezone";
import { getUseAgentRecommendation } from "@/lib/use-agent-recommendation";
import { AGENT_POWER_LABELS, applyUseAgentTeamMode, getEffectivePowerMode } from "@/lib/agent-power";
import { runAgentLoop } from "@/services/agent/agent-loop";
import { buildRealtimeContext } from "@/services/agent/context";
import { detectIntent } from "@/services/agent/intent";
import {
  buildImagePromptFromUser,
  buildSimpleFileExportArgs,
  buildVideoPromptFromUser,
  buildFallbackFileExportArgs,
  formatGeneratedMediaBlock,
  formatGenerationFailureBlock,
  getReferenceImageFromAttachments,
  resolveFileExportIntent,
  resolveMediaGenerationHint,
  resolveVideoDuration,
} from "@/services/agent/generation-intent";
import {
  buildAwarenessForTurn,
  buildMultimodalPlugins,
  mergeAttachmentsIntoMessages,
} from "@/services/agent/multimodal";
import { buildAgentMeta } from "@/services/agent/model-router";
import {
  formatPlanForPrompt,
  markAllPlanStepsDone,
  markComposeStepRunning,
  markPlanStepByTool,
} from "@/services/agent/plan-parser";
import { resolveIntent, runPlanner } from "@/services/agent/planner";
import { runTeamAgent } from "@/services/agent/team-coordinator";
import { shouldActivateTeamMode } from "@/services/agent/team-planner";
import {
  buildInstantPlan,
  classifyTurn,
  compactPlanLine,
} from "@/services/agent/turn-classifier";
import { getEnabledToolNames } from "@/services/agent/tools";
import { runFileExport } from "@/services/agent/tools/handlers/file-export";
import { runImageGenerate } from "@/services/agent/tools/handlers/image-generate";
import { runVideoGenerate } from "@/services/agent/tools/handlers/video-generate";
import { formatMemoriesForPrompt } from "@/services/memory/format";
import { recallMemories } from "@/services/memory/recall";
import { buildSystemPrompt } from "@/prompts/system";
import { formatSettingsForPrompt, getUserSettings } from "@/services/settings/repository";
import type { AgentStreamEvent } from "@/types/agent";
import { dedupeGeneratedMedia, type GeneratedMediaItem } from "@/types/media";
import type { MessageAttachment } from "@/types/multimodal";
import type { AgentPlan } from "@/types/plan";
import type { OpenRouterChatMessage } from "@/types/openrouter";

export type RunAgentInput = {
  messages: OpenRouterChatMessage[];
  attachments?: MessageAttachment[];
  timezone?: string;
  conversationId?: string;
};

function getLastUserMessage(messages: OpenRouterChatMessage[]): string {
  for (let i = messages.length - 1; i >= 0; i--) {
    const msg = messages[i];
    if (msg?.role !== "user" || !msg.content) continue;
    if (typeof msg.content === "string") return msg.content;
    return msg.content
      .filter((p) => p.type === "text")
      .map((p) => p.text)
      .join("\n");
  }
  return "";
}

function applyPlanToolEvent(plan: AgentPlan, event: AgentStreamEvent): AgentPlan {
  if (event.type !== "tool") return plan;
  if (event.status === "running") {
    return markPlanStepByTool(plan, event.name, "running");
  }
  if (event.status === "done" || event.status === "error") {
    return markPlanStepByTool(plan, event.name, "done");
  }
  return plan;
}

/**
 * Agent pipeline:
 * plan → intent → memory recall → tools (loop) → streamed response
 */
export async function* runAgent(
  input: RunAgentInput
): AsyncGenerator<AgentStreamEvent> {
  const lastUser = getLastUserMessage(input.messages);
  const regexIntent = detectIntent(lastUser);
  const hasAttachments = Boolean(input.attachments?.length);

  let settings;
  try {
    settings = await getUserSettings();
  } catch (error) {
    console.warn("[orchestrator] settings load failed:", error);
    settings = {
      displayName: null,
      preferredLanguage: "id" as const,
      timezone: null,
      assistantStyle: "balanced" as const,
      agentPowerMode: "sedang" as const,
      useAgentTeam: false,
      updatedAt: new Date().toISOString(),
    };
  }

  const useAgentTeam = settings.useAgentTeam ?? false;
  const powerMode = settings.agentPowerMode ?? "sedang";
  const effectivePowerMode = getEffectivePowerMode(powerMode, useAgentTeam);
  const powerLabel = useAgentTeam
    ? "Use Agent MAX"
    : AGENT_POWER_LABELS[effectivePowerMode];
  const baseTurn = classifyTurn(lastUser, hasAttachments, effectivePowerMode);
  const turn = applyUseAgentTeamMode(
    baseTurn,
    useAgentTeam,
    hasAttachments,
    lastUser
  );

  yield {
    type: "phase",
    phase: "thinking",
    label:
      turn.tier === "casual"
        ? `Mode ${powerLabel} · Merespons…`
        : `Mode ${powerLabel} · Mengingat konteks…`,
  };

  let recalled: Awaited<ReturnType<typeof recallMemories>> = [];
  if (turn.memoryLimit > 0) {
    try {
      recalled = await recallMemories(lastUser, {
        conversationId: input.conversationId,
        limit: turn.memoryLimit,
      });
    } catch (error) {
      console.warn("[orchestrator] memory recall failed:", error);
    }
  }

  const tz = resolveTimezone(input.timezone ?? settings.timezone ?? undefined);
  const realtime = buildRealtimeContext(tz);
  const memoryBlock = formatMemoriesForPrompt(recalled);
  const enabledTools = getEnabledToolNames();
  const userProfile = formatSettingsForPrompt(settings);

  yield {
    type: "phase",
    phase: "planning",
    label:
      turn.tier === "casual"
        ? `Mode ${powerLabel} · Respon cepat…`
        : `Mode ${powerLabel} · Merencanakan strategi…`,
  };

  const plan = turn.skipPlanner
    ? buildInstantPlan(lastUser, turn.intent)
    : await runPlanner({
        userMessage: lastUser,
        enabledTools,
        memoryPreview: memoryBlock.slice(0, 500),
        userLanguage: settings.preferredLanguage,
      });

  const intent = hasAttachments
    ? "multimodal"
    : resolveIntent(plan.intent, regexIntent, plan.tools_needed);
  const baseMeta = buildAgentMeta(intent, effectivePowerMode);
  const routingReason = hasAttachments
    ? `${baseMeta.routingReason} · Multimodal input detected`
    : plan.intent !== regexIntent && plan.intent !== "general"
      ? `${baseMeta.routingReason} · Planner: ${plan.summary}`
      : plan.complexity !== "simple"
        ? `${baseMeta.routingReason} · ${plan.complexity} task`
        : baseMeta.routingReason;

  const meta = {
    ...baseMeta,
    routingReason,
    conversationId: input.conversationId,
    memoriesRecalled: recalled.length,
    toolsUsed: [] as string[],
    plan,
  };

  yield { type: "plan", plan };
  yield { type: "meta", meta };

  const useTeamMode = useAgentTeam
    ? !hasAttachments && lastUser.trim().length > 0
    : turn.tier === "complex" &&
      shouldActivateTeamMode(lastUser, plan, hasAttachments, effectivePowerMode);

  if (useTeamMode) {
    yield {
      type: "phase",
      phase: "planning",
      label: useAgentTeam
        ? "Use Agent · Deploy 5 agent MAX…"
        : `Mode ${powerLabel} · Mengerahkan tim agent paralel…`,
    };

    for await (const event of runTeamAgent(input, {
      lastUser,
      plan,
      memoryBlock,
      recalledCount: recalled.length,
      timezone: tz,
      userLanguage: settings.preferredLanguage,
      meta,
      useAgentTeam,
    })) {
      yield event;
    }
    return;
  }

  yield {
    type: "phase",
    phase: "thinking",
    label: `Mode ${powerLabel} · Menjalankan rencana…`,
  };

  const awarenessBlock = turn.compactPrompt
    ? undefined
    : buildAwarenessForTurn({
        attachments: input.attachments,
        hasPlan: true,
        memoryCount: recalled.length,
      });

  let currentPlan = plan;

  const referenceImageUrl = getReferenceImageFromAttachments(input.attachments);
  const img2img = Boolean(referenceImageUrl);

  const generationHint = resolveMediaGenerationHint(
    lastUser,
    input.attachments,
    plan
  );

  const fileExportIntent = resolveFileExportIntent(lastUser, plan);

  const preGeneratedMedia: GeneratedMediaItem[] = [];
  const earlyToolsUsed: string[] = [];
  let generationFailureBlock = "";

  if (generationHint === "image") {
    yield {
      type: "phase",
      phase: "tooling",
      label: img2img
        ? "Edit gambar AI · referensi foto kamu…"
        : "Generate gambar AI · Flux 2 Pro…",
    };
    yield { type: "tool", name: "image_generate", status: "running" };

    const result = await runImageGenerate(
      {
        prompt: buildImagePromptFromUser(lastUser, { hasReference: img2img }),
        reference_image_url: referenceImageUrl,
      },
      { conversationId: input.conversationId, timezone: tz }
    );

    yield {
      type: "tool",
      name: "image_generate",
      status: result.success ? "done" : "error",
      summary: result.summary,
    };

    if (result.media) {
      preGeneratedMedia.push(result.media);
      yield { type: "media", item: result.media };
    } else if (!result.success) {
      generationFailureBlock = formatGenerationFailureBlock({
        kind: "image",
        error: result.summary,
      });
    }
    earlyToolsUsed.push("image_generate");
    currentPlan = markPlanStepByTool(currentPlan, "image_generate", "done");
    yield { type: "plan_update", plan: currentPlan };
  } else if (generationHint === "video") {
    const { duration, requested } = resolveVideoDuration(lastUser);
    yield {
      type: "phase",
      phase: "tooling",
      label:
        requested && requested < duration
          ? `Generate video AI · min ${duration} detik (Veo)…`
          : "Generate video AI · Google Veo 3.1…",
    };
    yield { type: "tool", name: "video_generate", status: "running" };

    const result = await runVideoGenerate(
      {
        prompt: buildVideoPromptFromUser(lastUser),
        duration,
      },
      { conversationId: input.conversationId, timezone: tz }
    );

    yield {
      type: "tool",
      name: "video_generate",
      status: result.success ? "done" : "error",
      summary: result.summary,
    };

    if (result.media) {
      preGeneratedMedia.push(result.media);
      yield { type: "media", item: result.media };
    } else if (!result.success) {
      generationFailureBlock = formatGenerationFailureBlock({
        kind: "video",
        error: result.summary,
      });
    }
    earlyToolsUsed.push("video_generate");
    currentPlan = markPlanStepByTool(currentPlan, "video_generate", "done");
    yield { type: "plan_update", plan: currentPlan };
  } else if (
    fileExportIntent?.simple &&
    !generationHint
  ) {
    yield {
      type: "phase",
      phase: "tooling",
      label: `Membuat file ${fileExportIntent.format.toUpperCase()}…`,
    };
    yield { type: "tool", name: "file_export", status: "running" };

    const result = await runFileExport(
      buildSimpleFileExportArgs(lastUser, fileExportIntent.format),
      { conversationId: input.conversationId, timezone: tz }
    );

    yield {
      type: "tool",
      name: "file_export",
      status: result.success ? "done" : "error",
      summary: result.summary,
    };

    if (result.media) {
      preGeneratedMedia.push(result.media);
      yield { type: "media", item: result.media };
    } else if (!result.success) {
      generationFailureBlock = formatGenerationFailureBlock({
        kind: "file",
        error: result.summary,
      });
    }
    earlyToolsUsed.push("file_export");
    currentPlan = markPlanStepByTool(currentPlan, "file_export", "done");
    yield { type: "plan_update", plan: currentPlan };
  }

  const mediaBlock = [
    formatGeneratedMediaBlock(preGeneratedMedia),
    generationFailureBlock,
  ]
    .filter(Boolean)
    .join("\n\n");

  const systemPrompt = buildSystemPrompt(
    realtime,
    memoryBlock,
    enabledTools,
    userProfile,
    turn.compactPrompt ? compactPlanLine(currentPlan) : formatPlanForPrompt(currentPlan),
    awarenessBlock,
    mediaBlock || undefined,
    { compact: turn.compactPrompt, powerMode: effectivePowerMode, useAgentTeam }
  );

  const apiMessages = mergeAttachmentsIntoMessages(
    input.messages,
    input.attachments ?? []
  );
  const plugins = buildMultimodalPlugins(input.attachments);

  for await (const event of runAgentLoop({
    systemPrompt,
    messages: apiMessages,
    meta,
    toolContext: {
      timezone: tz,
      conversationId: input.conversationId,
      referenceImageUrl,
    },
    temperature:
      intent === "coding" ? 0.3 : intent === "multimodal" ? 0.5 : 0.7,
    plugins,
    generationHint,
    fileExportIntent,
    preGeneratedMedia,
    referenceImageUrl,
    skipToolLoop: turn.skipToolLoop,
    maxToolRounds: turn.maxToolRounds,
  })) {
    if (event.type === "tool") {
      currentPlan = applyPlanToolEvent(currentPlan, event);
      yield { type: "plan_update", plan: currentPlan };
    }

    if (event.type === "phase" && event.phase === "tooling") {
      if (
        currentPlan.tools_needed.includes("web_search") &&
        currentPlan.steps.some(
          (s) => s.tool === "web_search" && s.status === "pending"
        )
      ) {
        currentPlan = markPlanStepByTool(currentPlan, "web_search", "running");
        yield { type: "plan_update", plan: currentPlan };
      }
    }

    if (event.type === "phase" && event.phase === "streaming") {
      currentPlan = markComposeStepRunning(currentPlan);
      yield { type: "plan_update", plan: currentPlan };
    }

    if (event.type === "done") {
      currentPlan = markAllPlanStepsDone(currentPlan);
      yield { type: "plan_update", plan: currentPlan };
      const mergedMedia = dedupeGeneratedMedia(
        event.meta.generatedMedia ?? preGeneratedMedia
      );
      const mergedTools = [
        ...new Set([...earlyToolsUsed, ...(event.meta.toolsUsed ?? [])]),
      ];
      yield {
        ...event,
        meta: {
          ...event.meta,
          plan: currentPlan,
          generatedMedia: mergedMedia,
          toolsUsed: mergedTools,
          recommendUseAgent:
            !useAgentTeam && !hasAttachments
              ? getUseAgentRecommendation(lastUser, currentPlan) ?? undefined
              : undefined,
        },
      };
      continue;
    }

    yield event;
  }
}
