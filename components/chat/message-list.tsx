"use client";

import { useEffect, useRef } from "react";
import { Bot, User } from "lucide-react";
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

const STARTER_HINTS = [
  { label: "React vs Vue", hint: "Bandingkan React vs Vue (chart)" },
  { label: "Timeline AI", hint: "Timeline sejarah AI + statistik PAIOS" },
  { label: "Statistik", hint: "Statistik project PAIOS" },
  { label: "Berita AI", hint: "Search berita AI hari ini + ringkas" },
  { label: "Logo PAIOS", hint: "Buat logo PAIOS futuristik" },
  { label: "Analisa fitur", hint: "Analisa PAIOS dan buat rekomendasi fitur" },
];

type MessageListProps = {
  messages: LocalChatMessage[];
  isLoading?: boolean;
  onRegenerate?: () => void;
  canRegenerate?: boolean;
  onSendHint?: (hint: string) => void;
};

function UserBubble({ message }: { message: LocalChatMessage }) {
  const hasContent = message.content.trim().length > 0;
  const attachments = message.meta?.attachments ?? [];

  return (
    <div className="flex max-w-[min(88%,28rem)] flex-col items-end gap-1.5">
      {attachments.length > 0 ? (
        <>
          <AttachmentPreview
            attachments={attachments.filter(
              (a): a is MessageAttachment =>
                "dataUrl" in a && Boolean(a.dataUrl)
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
        <UseAgentRecommendationBanner
          reason={recommendUseAgent.reason}
          score={recommendUseAgent.score}
        />
      ) : null}

      {team ? (
        <TeamProgressPanel
          team={team}
          isStreaming={isStreaming}
          powerMode={powerMode}
          useAgentTeam={settings.useAgentTeam}
        />
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
        <StreamingMessageContent
          content={message.content}
          isStreaming={isStreaming}
        />
      ) : !isStreaming ? (
        <p className="text-sm italic text-muted-foreground">
          Respons kosong — coba kirim ulang.
        </p>
      ) : (
        <StreamingMessageContent
          content={message.content}
          isStreaming={isStreaming}
        />
      )}
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
  const bottomRef = useRef<HTMLDivElement>(null);
  const scrollKeyRef = useRef("");

  const lastAssistantId = [...messages]
    .reverse()
    .find((m) => m.role === "assistant")?.id;

  useEffect(() => {
    const last = messages[messages.length - 1];
    const key = `${messages.length}:${last?.id ?? ""}:${last?.content.length ?? 0}:${isLoading ? 1 : 0}`;
    if (key === scrollKeyRef.current) return;
    scrollKeyRef.current = key;
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  if (messages.length === 0) {
    return (
      <div className="paios-chat-scroll flex flex-col items-center justify-center px-4 py-10 sm:px-6 sm:py-16">
        <div className="w-full max-w-xl text-center">
          <PaiosLogoMark size="lg" className="mx-auto mb-6 sm:mb-8" />
          <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            Halo, saya PAIOS
          </h2>
          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted-foreground/85 sm:text-[15px]">
            Personal AI Operating System — ingat konteks kamu, jalankan tools,
            dan jawab dengan data real-time.
          </p>
          <div className="mt-8 grid gap-2.5 sm:grid-cols-2 sm:gap-3">
            {STARTER_HINTS.map((item) => (
              <button
                key={item.hint}
                type="button"
                disabled={!onSendHint || isLoading}
                onClick={() => onSendHint?.(item.hint)}
                className="paios-panel group px-4 py-3.5 text-left transition-all hover:border-cyan-500/15 hover:bg-white/[0.04] active:scale-[0.99] disabled:opacity-50"
              >
                <span className="block text-sm font-medium text-foreground/90 group-hover:text-foreground">
                  {item.label}
                </span>
                <span className="mt-1 block text-[11px] leading-snug text-muted-foreground/70">
                  {item.hint}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="paios-chat-scroll px-3 py-4 sm:px-4 sm:py-6">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-5 sm:gap-6">
        {messages.map((message) => {
          const isUser = message.role === "user";
          const isStreaming = message.meta?.isStreaming;
          const hasContent = message.content.trim().length > 0;
          const structured = message.meta?.structured;

          if (isUser) {
            return (
              <article key={message.id} className="flex justify-end gap-2 sm:gap-2.5">
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
                "group flex gap-2.5 sm:gap-3",
                isStreaming && "paios-message-streaming"
              )}
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

                {!isStreaming &&
                (hasContent || structured || message.meta?.modelLabel) ? (
                  <ModelBadge meta={message.meta} />
                ) : null}

                {!isStreaming && hasContent && !message.meta?.isError ? (
                  <MessageActions
                    content={message.content}
                    canRegenerate={
                      canRegenerate && message.id === lastAssistantId
                    }
                    onRegenerate={onRegenerate}
                  />
                ) : null}
              </div>
            </article>
          );
        })}
        <div ref={bottomRef} className="h-2 shrink-0" />
      </div>
    </div>
  );
}
