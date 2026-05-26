"use client";

import { LayoutGrid, Sparkles } from "lucide-react";
import { ActionBar } from "@/components/dynamic-ui/action-bar";
import { BlockRenderer } from "@/components/dynamic-ui/block-renderer";
import { StreamingMessageContent } from "@/components/chat/streaming-message-content";
import { cn } from "@/lib/utils";
import type { AgentStructuredResponse } from "@/types/ui-response";

const UI_TYPE_LABELS: Record<string, string> = {
  text: "Respons",
  dashboard: "Dashboard",
  cards: "Insight Cards",
  timeline: "Timeline",
  chart: "Visual Data",
  mixed: "JARVIS Output",
};

type DynamicResponseProps = {
  structured: AgentStructuredResponse;
  streamText?: string;
  isStreaming?: boolean;
  animateBlocks?: boolean;
  useAgentTeam?: boolean;
  vipMode?: boolean;
};

export function DynamicResponse({
  structured,
  streamText,
  isStreaming,
  animateBlocks,
  useAgentTeam,
  vipMode,
}: DynamicResponseProps) {
  const hasBlocks = structured.ui.blocks.length > 0;
  const text = streamText ?? structured.text;
  const uiLabel = UI_TYPE_LABELS[structured.ui.type] ?? structured.ui.type;
  const isVip = vipMode || useAgentTeam;

  return (
    <div className="space-y-3">
      {hasBlocks ? (
        <div
          className={cn(
            "overflow-hidden rounded-2xl border bg-gradient-to-br from-white/[0.03] to-transparent",
            isStreaming
              ? "border-cyan-400/25 ring-1 ring-cyan-400/15 shadow-[0_0_40px_-16px_oklch(0.72_0.14_195/40%)]"
              : isVip
                ? "border-violet-400/30 shadow-[0_0_48px_-16px_oklch(0.62_0.18_285/45%)] ring-1 ring-violet-400/20"
                : "border-white/8"
          )}
        >
          <div
            className={cn(
              "flex items-center justify-between gap-2 border-b px-3 py-2.5 sm:px-4",
              isStreaming
                ? "border-cyan-400/15 bg-cyan-500/[0.06]"
                : "border-white/6 bg-white/[0.02]"
            )}
          >
            <div className="flex min-w-0 items-center gap-2">
              <span
                className={cn(
                  "flex size-7 shrink-0 items-center justify-center rounded-lg",
                  isStreaming
                    ? "bg-cyan-500/15 ring-1 ring-cyan-400/20"
                    : "bg-violet-500/12 ring-1 ring-violet-400/15"
                )}
              >
                {isStreaming ? (
                  <Sparkles className="size-3.5 animate-pulse text-cyan-300" />
                ) : (
                  <LayoutGrid className="size-3.5 text-violet-300" />
                )}
              </span>
              <div className="min-w-0">
                <p className="truncate text-xs font-bold text-foreground/90">
                  {isVip ? "VIP · " : ""}
                  {uiLabel}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  {structured.ui.blocks.length} block
                  {structured.ui.blocks.length !== 1 ? "s" : ""}
                  {isStreaming ? " · rendering live" : " · siap"}
                </p>
              </div>
            </div>
            {!isStreaming && structured.actions.length > 0 ? (
              <span className="shrink-0 rounded-full bg-white/5 px-2 py-0.5 text-[9px] text-muted-foreground">
                {structured.actions.length} aksi
              </span>
            ) : null}
          </div>

          {text ? (
            <div className="border-b border-white/5 px-3 py-3 sm:px-4">
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                Ringkasan
              </p>
              <StreamingMessageContent
                content={text}
                isStreaming={isStreaming}
              />
            </div>
          ) : null}

          <div className="p-3 sm:p-4">
            <BlockRenderer
              blocks={structured.ui.blocks}
              animate={animateBlocks}
              isStreaming={isStreaming}
              vipMode={isVip}
            />
          </div>
        </div>
      ) : text ? (
        <StreamingMessageContent content={text} isStreaming={isStreaming} />
      ) : null}

      {!isStreaming ? <ActionBar actions={structured.actions} /> : null}
    </div>
  );
}
