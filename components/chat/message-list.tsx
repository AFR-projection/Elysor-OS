"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Bot,
  ChevronDown,
  Brain,
  Globe,
  MessagesSquare,
  Search,
  Sparkles,
  User,
  Zap,
  FileText,
} from "lucide-react";
import { PaiosLogoMark } from "@/components/brand/paios-logo-mark";
import { AttachmentPreview } from "@/components/chat/attachment-bar";
import { GeneratedMediaGallery } from "@/components/chat/generated-media-gallery";
import { MediaGenerationProgress } from "@/components/chat/media-generation-progress";
import { MessageActions } from "@/components/chat/message-actions";
import { MessageAttachments } from "@/components/chat/message-attachments";
import { PlanCard } from "@/components/chat/plan-card";
import { TeamProgressPanel } from "@/components/chat/team-progress-panel";
import { UseAgentRecommendationBanner } from "@/components/chat/use-agent-recommendation-banner";
import { StreamLiveProgress } from "@/components/chat/stream-live-progress";
import { StreamingMessageContent } from "@/components/chat/streaming-message-content";
import { DynamicResponse } from "@/components/dynamic-ui/dynamic-response";
import { ModelBadge } from "@/components/chat/model-badge";
import { ToolActivity } from "@/components/chat/tool-activity";
import { useSettings } from "@/components/providers/settings-provider";
import { cn } from "@/lib/utils";
import type { LocalChatMessage } from "@/types/chat";
import type { MessageAttachment } from "@/types/multimodal";

/* ─── Date formatting helpers ─── */
function formatDateSeparator(date: Date): string {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const msgDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  if (msgDate.getTime() === today.getTime()) return "Hari ini";
  if (msgDate.getTime() === yesterday.getTime()) return "Kemarin";
  const diffDays = Math.round(
    (today.getTime() - msgDate.getTime()) / (1000 * 60 * 60 * 24)
  );
  if (diffDays < 7) return `${diffDays} hari yang lalu`;
  return date.toLocaleDateString("id-ID", {
    day: "numeric", month: "long", year: "numeric",
  });
}

function getMessageDate(date: Date): string {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

/* ─── Enhanced starter hints ─── */
const STARTER_HINTS: Array<{
  icon: typeof Zap;
  label: string;
  hint: string;
  color: string;
  bg: string;
}> = [
  { icon: Zap, label: "React vs Vue", hint: "Bandingkan React vs Vue (chart)", color: "text-cyan-300", bg: "bg-cyan-500/10" },
  { icon: Brain, label: "Timeline AI", hint: "Timeline sejarah AI + statistik PAIOS", color: "text-violet-300", bg: "bg-violet-500/10" },
  { icon: Search, label: "Berita AI", hint: "Search berita AI hari ini + ringkas", color: "text-emerald-300", bg: "bg-emerald-500/10" },
  { icon: FileText, label: "Analisa", hint: "Analisa PAIOS dan buat rekomendasi fitur", color: "text-amber-300", bg: "bg-amber-500/10" },
  { icon: Globe, label: "Logo PAIOS", hint: "Buat logo PAIOS futuristik", color: "text-pink-300", bg: "bg-pink-500/10" },
  { icon: MessagesSquare, label: "Statistik", hint: "Statistik project PAIOS", color: "text-cyan-300", bg: "bg-cyan-500/10" },
];

/* ─── Welcome / Empty State (Enhanced) ─── */
function WelcomeView({ onSendHint, isLoading }: {
  onSendHint?: (hint: string) => void;
  isLoading?: boolean;
}) {
  return (
    <div className="paios-chat-scroll flex flex-col items-center justify-center px-4 py-10 sm:px-6 sm:py-16">
      <div className="w-full max-w-xl text-center">
        {/* Animated Orb */}
        <div className="relative mx-auto mb-8 flex size-28 items-center justify-center sm:size-36">
          <div
            className="absolute inset-0 rounded-full"
            style={{
              background: "radial-gradient(circle, oklch(0.72 0.14 195 / 20%), oklch(0.55 0.18 290 / 15%), transparent 70%)",
              animation: "paios-welcome-orb-glow 4s ease-in-out infinite",
            }}
          />
          <div
            className="absolute size-24 rounded-full bg-gradient-to-br from-cyan-500/15 via-violet-500/10 to-transparent sm:size-28"
            style={{ animation: "paios-welcome-orb-pulse 3s ease-in-out infinite" }}
          />
          <div
            className="absolute size-32 rounded-full border border-cyan-400/10 sm:size-40"
            style={{ animation: "paios-welcome-orb-spin 12s linear infinite" }}
          >
            <div className="absolute left-1/2 top-0 size-2 -translate-x-1/2 rounded-full bg-cyan-400/40 shadow-[0_0_8px_oklch(0.72_0.14_195/50%)]" />
          </div>
          <div
            className="absolute size-28 rounded-full border border-violet-400/10 sm:size-[8.5rem]"
            style={{ animation: "paios-welcome-orb-spin 18s linear infinite reverse" }}
          >
            <div className="absolute left-1/2 top-0 size-1.5 -translate-x-1/2 rounded-full bg-violet-400/40 shadow-[0_0_8px_oklch(0.55_0.18_290/50%)]" />
          </div>
          <div style={{ animation: "paios-welcome-orb-float 4s ease-in-out infinite" }}>
            <PaiosLogoMark size="md" />
          </div>
        </div>

        <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Halo, saya{" "}
          <span className="bg-gradient-to-r from-cyan-300 to-violet-300 bg-clip-text text-transparent">
            PAIOS
          </span>
        </h2>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted-foreground/85 sm:text-[15px]">
          Personal AI Operating System — ingat konteks kamu, jalankan tools,
          dan jawab dengan data real-time.
        </p>

        <div className="mt-6 flex flex-wrap justify-center gap-2">
          {[
            { label: "Multi-Model AI", icon: Brain, color: "text-cyan-300" },
            { label: "Memory v4", icon: Sparkles, color: "text-violet-300" },
            { label: "Voice Mode", icon: MessagesSquare, color: "text-emerald-300" },
            { label: "Team Agents", icon: Zap, color: "text-amber-300" },
          ].map((feat, i) => (
            <span
              key={feat.label}
              className="paios-feature-stagger inline-flex items-center gap-1.5 rounded-full border border-white/8 bg-white/[0.03] px-3 py-1.5 text-[11px] font-medium text-muted-foreground"
              style={{ animationDelay: `${0.6 + i * 0.12}s` }}
            >
              <feat.icon className={cn("size-3", feat.color)} />
              {feat.label}
            </span>
          ))}
        </div>
        <div className="mt-8 grid gap-2.5 sm:grid-cols-2 sm:gap-3">
          {STARTER_HINTS.map((item) => (
            <button
              key={item.hint}
              type="button"
              disabled={!onSendHint || isLoading}
              onClick={() => onSendHint?.(item.hint)}
              className="paios-panel group flex items-center gap-3 px-4 py-3.5 text-left transition-all hover:border-cyan-500/20 hover:bg-white/[0.04] active:scale-[0.98] disabled:opacity-50"
            >
              <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-xl ring-1", item.bg, item.color, "ring-white/10 group-hover:ring-current/20")}>
                <item.icon className="size-4" />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-medium text-foreground/90 group-hover:text-foreground">{item.label}</span>
                <span className="mt-0.5 block text-[11px] leading-snug text-muted-foreground/70">{item.hint}</span>
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function UserBubble({ message }: { message: LocalChatMessage }) {
  const hasContent = message.content.trim().length > 0;
  const attachments = message.meta?.attachments ?? [];

  return (
    <div className="flex max-w-[min(88%,28rem)] flex-col items-end gap-1.5">
      {attachments.length > 0 ? (
        <>
          <AttachmentPreview
            attachments={attachments.filter(
              (a): a is MessageAttachment => "dataUrl" in a && Boolean(a.dataUrl)
            )}
            compact
            className="justify-end"
          />
          <MessageAttachments attachments={attachments} />
        </>
      ) : null}
      {hasContent ? (
        <div className="rounded-[18px] rounded-br-sm bg-violet-600 px-3.5 py-2.5 text-[15px] leading-relaxed text-white shadow-sm sm:px-4">
          <p className="whitespace-pre-wrap">{message.content}</p>
        </div>
      ) : null}
    </div>
  );
}

function AssistantBody({ message }: { message: LocalChatMessage }) {
  const { settings } = useSettings();
  const powerMode = settings.agentPowerMode ?? "sedang";
  const isStreaming = message.meta?.isStreaming;
  const hasContent = message.content.trim().length > 0;
  const structured = message.meta?.structured;
  const plan = message.meta?.plan;
  const team = message.meta?.team;
  const recommendUseAgent = message.meta?.recommendUseAgent;
  const isVipAnswer = !!team || settings.useAgentTeam;
  const showStructured = !!structured;

  if (message.meta?.isError) {
    return (
      <div className="rounded-xl border border-red-400/25 bg-red-500/10 px-3 py-2.5 text-sm text-red-200 sm:px-4">
        {hasContent ? message.content : "Terjadi kesalahan — coba kirim ulang."}
      </div>
    );
  }

  return (
    <div className="min-w-0 flex-1 space-y-2">
      {isStreaming && !team ? (
        <StreamLiveProgress
          phase={message.meta?.streamPhase}
          label={message.meta?.streamLabel}
          blockCount={message.meta?.streamBlockProgress?.current}
          blockTotal={message.meta?.streamBlockProgress?.total}
          powerMode={powerMode}
        />
      ) : null}

      {plan && !team ? <PlanCard plan={plan} isStreaming={isStreaming} /> : null}

      {recommendUseAgent && !settings.useAgentTeam && !team ? (
        <UseAgentRecommendationBanner reason={recommendUseAgent.reason} score={recommendUseAgent.score} />
      ) : null}

      {team ? (
        <TeamProgressPanel team={team} isStreaming={isStreaming} powerMode={powerMode} useAgentTeam={settings.useAgentTeam} />
      ) : null}

      {message.meta?.activeTool === "image_generate" ? (
        <MediaGenerationProgress kind="image" label={message.meta.streamLabel} />
      ) : message.meta?.activeTool === "video_generate" ? (
        <MediaGenerationProgress kind="video" label={message.meta.streamLabel} />
      ) : message.meta?.activeTool ? (
        <ToolActivity toolName={message.meta.activeTool} status="running" />
      ) : null}

      {message.meta?.generatedMedia?.length ? (
        <GeneratedMediaGallery items={message.meta.generatedMedia} />
      ) : null}

      {showStructured ? (
        <DynamicResponse
          structured={structured}
          streamText={message.content || structured.text}
          isStreaming={isStreaming}
          animateBlocks={isStreaming}
          useAgentTeam={settings.useAgentTeam}
          vipMode={isVipAnswer}
        />
      ) : hasContent ? (
        <StreamingMessageContent content={message.content} isStreaming={isStreaming} />
      ) : !isStreaming ? (
        <p className="text-sm italic text-muted-foreground">Respons kosong — coba kirim ulang.</p>
      ) : null}
    </div>
  );
}

export function MessageList({
  messages,
  isLoading,
  onRegenerate,
  canRegenerate,
  onSendHint,
}: MessageListProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const scrollKeyRef = useRef("");
  const [showFab, setShowFab] = useState(false);
  const [userScrolledUp, setUserScrolledUp] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);

  const lastAssistantId = [...messages]
    .reverse()
    .find((m) => m.role === "assistant")?.id;

  /* ─── Auto-scroll logic ─── */
  const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    bottomRef.current?.scrollIntoView({ behavior });
    setShowFab(false);
    setUserScrolledUp(false);
  }, []);

  useEffect(() => {
    const last = messages[messages.length - 1];
    const key = `${messages.length}:${last?.id ?? ""}:${last?.content.length ?? 0}:${isLoading ? 1 : 0}`;
    if (key === scrollKeyRef.current) return;
    scrollKeyRef.current = key;
    if (!userScrolledUp || initialLoad) {
      scrollToBottom(initialLoad ? "auto" : "smooth");
      setInitialLoad(false);
    }
  }, [messages, isLoading, userScrolledUp, initialLoad, scrollToBottom]);

  /* ─── Detect user scroll ─── */
  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const threshold = 120;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < threshold;
    setShowFab(!atBottom);
    setUserScrolledUp(!atBottom);
  }, []);

  /* ─── Build date-separated message groups ─── */
  const messageGroups: Array<{ date: string; label: string; messages: LocalChatMessage[] }> = [];
  let lastDateKey = "";

  messages.forEach((msg) => {
    const dateKey = getMessageDate(msg.createdAt);
    if (dateKey !== lastDateKey) {
      messageGroups.push({
        date: dateKey,
        label: formatDateSeparator(msg.createdAt),
        messages: [msg],
      });
      lastDateKey = dateKey;
    } else {
      messageGroups[messageGroups.length - 1].messages.push(msg);
    }
  });

  if (messages.length === 0) {
    return <WelcomeView onSendHint={onSendHint} isLoading={isLoading} />;
  }

  return (
    <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="paios-chat-scroll px-3 py-4 sm:px-4 sm:py-6"
      >
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-5 sm:gap-6">
          {messageGroups.map((group) => (
            <div key={group.date} className="space-y-5 sm:space-y-6">
              {/* Date separator */}
              <div className="paios-date-sep">
                <span className="shrink-0 text-[10px] font-medium tracking-wide text-muted-foreground/60">
                  {group.label}
                </span>
              </div>

              <div className="space-y-4">
                {group.messages.map((message, idx) => {
                  const isUser = message.role === "user";
                  const isStreaming = message.meta?.isStreaming;
                  const hasContent = message.content.trim().length > 0;
                  const structured = message.meta?.structured;

                  if (isUser) {
                    return (
                      <article
                        key={message.id}
                        className="paios-message-stagger flex justify-end gap-2 sm:gap-2.5"
                        style={{ animationDelay: `${idx * 0.04}s` }}
                      >
                        <UserBubble message={message} />
                        <div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-violet-500/20 ring-1 ring-violet-400/20 sm:size-8">
                          <User className="size-3.5 text-violet-200 sm:size-4" />
                        </div>
                      </article>
                    );
                  }

                  return (
                    <article
                      key={message.id}
                      className={cn(
                        "paios-message-stagger group flex gap-2.5 sm:gap-3",
                        isStreaming && "paios-message-streaming"
                      )}
                      style={{ animationDelay: `${idx * 0.04}s` }}
                    >
                      <div
                        className={cn(
                          "mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full sm:size-8",
                          message.meta?.isError
                            ? "bg-red-500/15 ring-1 ring-red-400/25"
                            : isStreaming
                              ? "bg-gradient-to-br from-cyan-500/35 to-teal-500/15 ring-1 ring-cyan-400/40 paios-avatar-pulse"
                              : "bg-gradient-to-br from-cyan-500/20 to-teal-500/10 ring-1 ring-cyan-400/20"
                        )}
                      >
                        <Bot className="size-3.5 text-cyan-200 sm:size-4" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <AssistantBody message={message} />

                        {!isStreaming && (hasContent || structured || message.meta?.modelLabel) ? (
                          <ModelBadge meta={message.meta} />
                        ) : null}

                        {!isStreaming && hasContent && !message.meta?.isError ? (
                          <MessageActions
                            content={message.content}
                            canRegenerate={canRegenerate && message.id === lastAssistantId}
                            onRegenerate={onRegenerate}
                          />
                        ) : null}
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
          ))}

          <div ref={bottomRef} className="h-2 shrink-0" />
        </div>
      </div>

      {/* ─── Scroll-to-bottom FAB ─── */}
      <div className={cn("paios-fab", showFab && "paios-fab--visible")}>
        <button
          type="button"
          onClick={() => scrollToBottom()}
          aria-label="Scroll ke bawah"
          className="paios-btn-press flex size-10 items-center justify-center rounded-full bg-gradient-to-br from-cyan-600 to-cyan-700 text-white shadow-lg shadow-cyan-500/25 ring-1 ring-white/20 backdrop-blur-xl transition-all hover:from-cyan-500 hover:to-cyan-600 hover:shadow-cyan-400/30"
          style={{ animation: showFab ? "paios-fab-pulse 2s ease-in-out infinite" : "none" }}
        >
          <ChevronDown className="size-5" />
        </button>
      </div>
    </div>
  );
}
 
type MessageListProps = {
  messages: LocalChatMessage[];
  isLoading?: boolean;
  onRegenerate?: () => void;
  canRegenerate?: boolean;
  onSendHint?: (hint: string) => void;
};
