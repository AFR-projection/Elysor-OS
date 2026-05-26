"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useAgent } from "@/components/providers/agent-provider";
import { useConversation } from "@/components/providers/conversation-provider";
import { useSettings } from "@/components/providers/settings-provider";
import { useToast } from "@/components/providers/toast-provider";
import { ChatInput } from "@/components/chat/chat-input";
import { MessageList } from "@/components/chat/message-list";
import { useChatShortcuts } from "@/hooks/use-chat-shortcuts";
import { useStreamBuffer } from "@/hooks/use-stream-buffer";
import { useSmartVoiceInput } from "@/hooks/use-smart-voice-input";
import { filesToAttachments } from "@/lib/attachments-client";
import { streamAgentChat } from "@/lib/chat-client";
import { resolveTimezone } from "@/lib/timezone";
import type { AgentStreamEvent, StreamPhase } from "@/types/agent";
import type { LocalChatMessage } from "@/types/chat";
import { dedupeGeneratedMedia } from "@/types/media";
import type { MessageAttachment } from "@/types/multimodal";
import type { OpenRouterChatMessage } from "@/types/openrouter";

function createMessage(
  role: LocalChatMessage["role"],
  content: string,
  meta?: LocalChatMessage["meta"]
): LocalChatMessage {
  return {
    id: crypto.randomUUID(),
    role,
    content,
    createdAt: new Date(),
    meta,
  };
}

function toApiMessages(messages: LocalChatMessage[]): OpenRouterChatMessage[] {
  return messages
    .filter((m) => m.role === "user" || m.role === "assistant")
    .filter((m) => !m.meta?.isError)
    .filter(
      (m) =>
        m.content.trim().length > 0 ||
        (m.meta?.attachments?.length ?? 0) > 0
    )
    .map((m) => ({
      role: m.role,
      content: m.content.trim() || "Analyze the attached files.",
    }));
}

export function ChatPanel() {
  const [input, setInput] = useState("");
  const [attachments, setAttachments] = useState<MessageAttachment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const assistantIdRef = useRef<string | null>(null);
  const streamTargetIdRef = useRef<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const streamingPhaseSetRef = useRef(false);
  const streamFinishedRef = useRef(false);
  const { setAgentState } = useAgent();
  const { toast } = useToast();
  const { settings, updateSettings } = useSettings();
  const {
    messages,
    setMessages,
    activeConversationId,
    setActiveConversationId,
    isLoadingChat,
    refreshConversations,
    refreshMemories,
    startNewChat,
  } = useConversation();

  const appendDelta = useCallback(
    (text: string) => {
      if (!text) return;
      setMessages((prev) =>
        prev.map((m) => {
          const targetId = streamTargetIdRef.current ?? assistantIdRef.current;
          if (m.id !== targetId) return m;
          return {
            ...m,
            content: m.content + text,
          };
        })
      );
    },
    [setMessages]
  );

  const { push: pushDelta, flushNow: flushDelta } = useStreamBuffer(appendDelta);

  const patchAssistant = useCallback(
    (
      patch: Partial<LocalChatMessage> & {
        meta?: Partial<NonNullable<LocalChatMessage["meta"]>>;
      }
    ) => {
      setMessages((prev) =>
        prev.map((m) => {
          const targetId = streamTargetIdRef.current ?? assistantIdRef.current;
          if (m.id !== targetId) return m;
          return {
            ...m,
            ...patch,
            meta: patch.meta ? { ...m.meta, ...patch.meta } : m.meta,
          };
        })
      );
    },
    [setMessages]
  );

  const applyPhase = useCallback(
    (phase: StreamPhase, label?: string) => {
      const status =
        phase === "streaming" || phase === "rendering"
          ? "streaming"
          : "thinking";
      setAgentState({ status, streamPhase: phase, streamLabel: label ?? null });
      patchAssistant({
        meta: { streamPhase: phase, streamLabel: label, isStreaming: true },
      });
    },
    [patchAssistant, setAgentState]
  );

  const handleEvent = useCallback(
    (event: AgentStreamEvent) => {
      if (event.type === "plan") {
        patchAssistant({
          meta: {
            plan: event.plan,
            streamPhase: "planning",
            streamLabel: "Rencana siap",
            isStreaming: true,
          },
        });
        setAgentState({
          status: "thinking",
          streamPhase: "planning",
          streamLabel: event.plan.summary.slice(0, 48),
        });
      }

      if (event.type === "plan_update") {
        patchAssistant({
          meta: { plan: event.plan, isStreaming: true },
        });
      }

      if (event.type === "team_plan") {
        const workerCount = event.team.agents.filter(
          (a) => a.role !== "synthesizer"
        ).length;
        patchAssistant({
          meta: {
            team: event.team,
            streamPhase: "planning",
            streamLabel: `Deploy ${workerCount} agent paralel + synthesizer…`,
            isStreaming: true,
          },
        });
        setAgentState({
          status: "thinking",
          streamPhase: "planning",
          streamLabel: `${workerCount} agent · misi tim`,
        });
      }

      if (event.type === "team_agent_update") {
        setMessages((prev) =>
          prev.map((m) => {
            const targetId = streamTargetIdRef.current ?? assistantIdRef.current;
            if (m.id !== targetId || !m.meta?.team) return m;
            const nextAgents = m.meta.team.agents.map((a) =>
              a.id === event.agentId ? event.agent : a
            );
            const workers = nextAgents.filter((a) => a.role !== "synthesizer");
            const runningWorkers = workers.filter((a) => a.status === "running");
            const synthRunning = nextAgents.some(
              (a) => a.role === "synthesizer" && a.status === "running"
            );
            const teamLabel = synthRunning
              ? `✨ Synthesizer · menggabungkan ${workers.filter((w) => w.status === "done").length}/${workers.length} hasil`
              : runningWorkers.length > 0
                ? `${runningWorkers.map((a) => a.emoji).join("")} · ${runningWorkers.length}/${workers.length} agent paralel`
                : `${nextAgents.filter((a) => a.status === "done").length}/${nextAgents.length} agent selesai`;

            return {
              ...m,
              meta: {
                ...m.meta,
                team: {
                  ...m.meta.team,
                  agents: nextAgents,
                },
                streamPhase: synthRunning ? "composing" : "tooling",
                streamLabel: teamLabel,
                isStreaming: true,
              },
            };
          })
        );
        setAgentState({
          status: "thinking",
          streamPhase: event.agent.role === "synthesizer" ? "composing" : "tooling",
          streamLabel:
            event.agent.role === "synthesizer"
              ? "✨ Synthesizer menggabungkan tim…"
              : `${event.agent.emoji} Tim paralel aktif`,
        });
      }

      if (event.type === "meta") {
        if (event.meta.conversationId) {
          setActiveConversationId(event.meta.conversationId);
        }
        setAgentState({
          status: "thinking",
          activeModel: event.meta.model,
          activeModelLabel: event.meta.modelLabel,
          routingReason: event.meta.routingReason,
          intent: event.meta.intent,
          streamPhase: "thinking",
          streamLabel: "Menganalisis permintaan…",
        });
        patchAssistant({
          meta: {
            modelUsed: event.meta.model,
            modelLabel: event.meta.modelLabel,
            routingReason: event.meta.routingReason,
            intent: event.meta.intent,
            memoriesRecalled: event.meta.memoriesRecalled,
            plan: event.meta.plan,
            streamPhase: "thinking",
            streamLabel: "Menjalankan rencana…",
            isStreaming: true,
          },
        });
      }

      if (event.type === "phase") {
        if (
          event.phase === "streaming" ||
          event.phase === "rendering" ||
          event.phase === "composing"
        ) {
          streamingPhaseSetRef.current = true;
        }
        applyPhase(event.phase, event.label);
      }

  if (event.type === "tool") {
        setMessages((prev) =>
          prev.map((m) => {
            const targetId = streamTargetIdRef.current ?? assistantIdRef.current;
            if (m.id !== targetId) return m;
            const tools = new Set(m.meta?.toolsUsed ?? []);
            if (event.status === "done" || event.status === "error") {
              tools.add(event.name);
            }
            const isMediaTool =
              event.name === "image_generate" ||
              event.name === "video_generate" ||
              event.name === "file_export";
            const mediaLabel =
              event.name === "image_generate"
                ? "Generate gambar AI · Flux 2 Pro…"
                : event.name === "video_generate"
                  ? event.status === "running"
                    ? event.summary ?? "Generate video AI · Google Veo 3.1…"
                    : "Generate video AI · Google Veo 3.1…"
                  : event.name === "file_export"
                    ? event.status === "running"
                      ? event.summary ?? "Membuat file PDF/Excel…"
                      : "File siap diunduh"
                    : undefined;
            return {
              ...m,
              meta: {
                ...m.meta,
                activeTool: event.status === "running" ? event.name : undefined,
                toolsUsed: Array.from(tools),
                streamPhase:
                  event.status === "running" ? ("tooling" as const) : m.meta?.streamPhase,
                streamLabel:
                  event.status === "running" && isMediaTool
                    ? mediaLabel
                    : event.status === "running"
                      ? `Menjalankan ${event.name.replace(/_/g, " ")}…`
                      : m.meta?.streamLabel,
              },
            };
          })
        );

        if (
          event.status === "done" &&
          (event.name === "memory_create" ||
            event.name === "memory_update" ||
            event.name === "memory_delete")
        ) {
          void refreshMemories();
        }

        if (event.status === "running") {
          setAgentState({
            status: "thinking",
            streamPhase: "tooling",
            streamLabel: `Menjalankan ${event.name.replace(/_/g, " ")}…`,
          });
        }
      }

      if (event.type === "delta") {
        pushDelta(event.content);
        if (!streamingPhaseSetRef.current) {
          streamingPhaseSetRef.current = true;
          applyPhase("streaming", "Menulis respons…");
        }
      }

      if (event.type === "structured_partial") {
        flushDelta();
        setMessages((prev) =>
          prev.map((m) => {
            const targetId = streamTargetIdRef.current ?? assistantIdRef.current;
            if (m.id !== targetId) return m;
            const nextText =
              event.structured.text && event.structured.text.length > m.content.length
                ? event.structured.text
                : m.content;
            return {
              ...m,
              content: nextText,
              meta: {
                ...m.meta,
                structured: event.structured,
                streamPhase: "rendering",
                streamLabel: event.blockProgress
                  ? `Merender visual ${event.blockProgress.current}/${event.blockProgress.total}…`
                  : "Membangun tampilan visual…",
                streamBlockProgress: event.blockProgress,
                isStreaming: true,
              },
            };
          })
        );
        setAgentState({
          status: "streaming",
          streamPhase: "rendering",
          streamLabel: event.blockProgress
            ? `Block ${event.blockProgress.current}/${event.blockProgress.total}`
            : "Merender UI…",
        });
      }

      if (event.type === "media") {
        setMessages((prev) =>
          prev.map((m) => {
            const targetId = streamTargetIdRef.current ?? assistantIdRef.current;
            if (m.id !== targetId) return m;
            const existing = m.meta?.generatedMedia ?? [];
            if (existing.some((x) => x.id === event.item.id)) return m;
            return {
              ...m,
              meta: {
                ...m.meta,
                generatedMedia: [...existing, event.item],
              },
            };
          })
        );
      }

      if (event.type === "done") {
        flushDelta();
        streamFinishedRef.current = true;
        patchAssistant({
          content: event.content,
          meta: {
            modelUsed: event.meta.model,
            modelLabel: event.meta.modelLabel,
            routingReason: event.meta.routingReason,
            intent: event.meta.intent,
            memoriesRecalled: event.meta.memoriesRecalled,
            toolsUsed: event.meta.toolsUsed,
            generatedMedia: event.meta.generatedMedia
              ? dedupeGeneratedMedia(event.meta.generatedMedia)
              : undefined,
            structured: event.structured,
            plan: event.meta.plan,
            team: event.meta.team,
            recommendUseAgent: event.meta.recommendUseAgent,
            activeTool: undefined,
            streamPhase: undefined,
            streamLabel: undefined,
            streamBlockProgress: undefined,
            isStreaming: false,
          },
        });
        setAgentState({
          status: "idle",
          streamPhase: null,
          streamLabel: null,
        });
        void refreshConversations();
      }

      if (event.type === "memory") void refreshMemories();

      if (event.type === "error") {
        flushDelta();
        streamFinishedRef.current = true;
        patchAssistant({
          content: event.message.startsWith("⚠️")
            ? event.message
            : `⚠️ ${event.message}`,
          meta: {
            isStreaming: false,
            isError: true,
            streamPhase: undefined,
            streamLabel: undefined,
          },
        });
        setAgentState({ status: "error", streamPhase: null, streamLabel: null });
      }
    },
    [
      applyPhase,
      flushDelta,
      patchAssistant,
      pushDelta,
      refreshConversations,
      refreshMemories,
      setActiveConversationId,
      setAgentState,
      setMessages,
    ]
  );

  const runStream = useCallback(
    async (
      apiMessages: OpenRouterChatMessage[],
      conversationId: string | null,
      pendingAttachments: MessageAttachment[] = []
    ) => {
      abortRef.current?.abort();
      abortRef.current = new AbortController();
      streamingPhaseSetRef.current = false;
      streamFinishedRef.current = false;
      streamTargetIdRef.current = assistantIdRef.current;
      setIsLoading(true);
      setAgentState({
        status: "thinking",
        streamPhase: "thinking",
        streamLabel: "Mengingat konteks…",
      });

      const tz = resolveTimezone(
        settings.timezone,
        Intl.DateTimeFormat().resolvedOptions().timeZone
      );
      const streamAssistantId = assistantIdRef.current;

      try {
        await streamAgentChat(apiMessages, handleEvent, {
          conversationId,
          timezone: tz,
          attachments: pendingAttachments,
          signal: abortRef.current.signal,
        });
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          flushDelta();
          streamFinishedRef.current = true;
          setMessages((prev) =>
            prev.map((m) =>
              m.id === streamAssistantId
                ? {
                    ...m,
                    content: m.content.trim() || "⏹ Dihentikan.",
                    meta: {
                      ...m.meta,
                      isStreaming: false,
                      streamPhase: undefined,
                      streamLabel: undefined,
                    },
                  }
                : m
            )
          );
          setAgentState({
            status: "idle",
            streamPhase: null,
            streamLabel: null,
          });
          toast("Generasi dihentikan", "default");
          return;
        }
        const message =
          error instanceof Error ? error.message : "Failed to reach PAIOS";
        streamFinishedRef.current = true;
        setMessages((prev) =>
          prev.map((m) =>
            m.id === streamAssistantId
              ? {
                  ...m,
                  content: `⚠️ ${message}`,
                  meta: { isStreaming: false, isError: true },
                }
              : m
          )
        );
        setAgentState({
          status: "error",
          streamPhase: null,
          streamLabel: null,
        });
        toast(message, "error");
      } finally {
        flushDelta();
        if (!streamFinishedRef.current && streamAssistantId) {
          setMessages((prev) =>
            prev.map((m) => {
              if (m.id !== streamAssistantId || !m.meta?.isStreaming) return m;
              return {
                ...m,
                content:
                  m.content.trim() ||
                  "⚠️ Respons tidak selesai — coba kirim ulang.",
                meta: {
                  ...m.meta,
                  isStreaming: false,
                  isError: !m.content.trim(),
                  streamPhase: undefined,
                  streamLabel: undefined,
                  activeTool: undefined,
                },
              };
            })
          );
          setAgentState({
            status: "idle",
            streamPhase: null,
            streamLabel: null,
          });
        }
        setIsLoading(false);
        assistantIdRef.current = null;
        streamTargetIdRef.current = null;
        abortRef.current = null;
      }
    },
    [handleEvent, setAgentState, setMessages, settings.timezone, toast, flushDelta]
  );

  const handleAddFiles = useCallback(
    async (files: FileList) => {
      try {
        const next = await filesToAttachments(files);
        setAttachments((prev) => [...prev, ...next].slice(0, 8));
      } catch (error) {
        toast(
          error instanceof Error ? error.message : "Gagal melampirkan file",
          "error"
        );
      }
    },
    [toast]
  );

  const handleSend = useCallback(
    async (overrideText?: string) => {
      const trimmed = (overrideText ?? input).trim();
      if ((!trimmed && attachments.length === 0) || isLoading) return;

      const userMessage = createMessage("user", trimmed, {
        attachments: [...attachments],
      });
      const assistantPlaceholder = createMessage("assistant", "", {
        isStreaming: true,
        toolsUsed: [],
      });
      assistantIdRef.current = assistantPlaceholder.id;

      const pendingAttachments = [...attachments];
      const nextMessages = [...messages, userMessage, assistantPlaceholder];
      setMessages(nextMessages);
      if (!overrideText) {
        setInput("");
      }
      setAttachments([]);

      await runStream(
        toApiMessages([...messages, userMessage]),
        activeConversationId,
        pendingAttachments
      );
    },
    [
      input,
      attachments,
      isLoading,
      messages,
      activeConversationId,
      runStream,
      setMessages,
    ]
  );

  const voiceLanguage =
    settings.preferredLanguage === "auto"
      ? undefined
      : settings.preferredLanguage;

  const voiceInput = useSmartVoiceInput({
    language: voiceLanguage,
    onTranscript: handleSend,
    onError: (message) => toast(message, "error"),
    onListening: () =>
      toast("Rekam… tap mic lagi saat selesai bicara", "default"),
    onTranscribing: () => toast("Mentranskrip suara…", "default"),
  });

  const handleStop = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  const handleRegenerate = useCallback(async () => {
    if (isLoading) return;

    let lastUserIdx = -1;
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === "user") {
        lastUserIdx = i;
        break;
      }
    }
    if (lastUserIdx < 0) return;

    const trimmed = messages.slice(0, lastUserIdx + 1);
    const assistantPlaceholder = createMessage("assistant", "", {
      isStreaming: true,
      toolsUsed: [],
    });
    assistantIdRef.current = assistantPlaceholder.id;
    setMessages([...trimmed, assistantPlaceholder]);

    await runStream(toApiMessages(trimmed), activeConversationId);
  }, [isLoading, messages, activeConversationId, runStream, setMessages]);

  useEffect(() => {
    const handler = (e: Event) => {
      const value = (e as CustomEvent<string>).detail;
      if (typeof value === "string") setInput(value);
    };
    window.addEventListener("paios:fill-prompt", handler as EventListener);
    return () =>
      window.removeEventListener("paios:fill-prompt", handler as EventListener);
  }, []);

  useChatShortcuts({
    onNewChat: startNewChat,
    onStop: handleStop,
    isLoading,
  });

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden">
      <MessageList
        messages={messages}
        isLoading={isLoading || isLoadingChat}
        onRegenerate={handleRegenerate}
        canRegenerate={!isLoading && messages.some((m) => m.role === "assistant")}
        onSendHint={(hint) => void handleSend(hint)}
      />
      <ChatInput
        value={input}
        onChange={setInput}
        onSend={() => void handleSend()}
        onStop={handleStop}
        attachments={attachments}
        onAddFiles={(files) => void handleAddFiles(files)}
        onRemoveAttachment={(id) =>
          setAttachments((prev) => prev.filter((a) => a.id !== id))
        }
        isLoading={isLoading}
        disabled={isLoadingChat}
        isVoiceRecording={voiceInput.isRecording}
        isVoiceBusy={voiceInput.isBusy}
        onVoiceToggle={() => void voiceInput.toggle()}
        useAgentTeam={settings.useAgentTeam}
        onUseAgentTeamChange={(enabled) => {
          void updateSettings({ useAgentTeam: enabled }).catch(() => {
            toast("Gagal mengubah mode Use Agent", "error");
          });
        }}
      />
    </div>
  );
}
