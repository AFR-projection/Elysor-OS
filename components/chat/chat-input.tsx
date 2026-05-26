"use client";

import { ArrowUp, Mic, Square } from "lucide-react";
import {
  AttachmentPicker,
  AttachmentPreview,
} from "@/components/chat/attachment-bar";
import { UseAgentToggle } from "@/components/chat/use-agent-toggle";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { MessageAttachment } from "@/types/multimodal";

type ChatInputProps = {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  onStop?: () => void;
  attachments?: MessageAttachment[];
  onAddFiles?: (files: FileList) => void;
  onRemoveAttachment?: (id: string) => void;
  isLoading?: boolean;
  disabled?: boolean;
  isVoiceRecording?: boolean;
  isVoiceBusy?: boolean;
  onVoiceToggle?: () => void;
  useAgentTeam?: boolean;
  onUseAgentTeamChange?: (enabled: boolean) => void;
};

export function ChatInput({
  value,
  onChange,
  onSend,
  onStop,
  attachments = [],
  onAddFiles,
  onRemoveAttachment,
  isLoading = false,
  disabled = false,
  isVoiceRecording = false,
  isVoiceBusy = false,
  onVoiceToggle,
  useAgentTeam = false,
  onUseAgentTeamChange,
}: ChatInputProps) {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  const canSend = value.trim().length > 0 || attachments.length > 0;

  return (
    <div className="safe-bottom shrink-0 border-t border-white/[0.06] bg-[oklch(0.11_0.02_265/88%)] px-3 py-3 backdrop-blur-xl sm:px-5 sm:py-4">
      <div className="mx-auto w-full max-w-3xl space-y-2.5">
        {attachments.length > 0 ? (
          <AttachmentPreview
            attachments={attachments}
            onRemove={onRemoveAttachment}
          />
        ) : null}

        <div className="paios-panel flex flex-col gap-2 p-2 sm:flex-row sm:items-end sm:gap-2.5">
          {onUseAgentTeamChange ? (
            <div className="flex shrink-0 items-center sm:pb-1">
              <UseAgentToggle
                enabled={useAgentTeam}
                onChange={onUseAgentTeamChange}
                disabled={(disabled && !isLoading) || isLoading}
              />
            </div>
          ) : null}

          <div className="flex min-w-0 flex-1 items-end gap-1.5 sm:gap-2">
            {onAddFiles ? (
              <AttachmentPicker
                onFiles={onAddFiles}
                disabled={(disabled && !isLoading) || isLoading}
              />
            ) : null}

            {onVoiceToggle ? (
              <Button
                type="button"
                size="icon"
                variant="ghost"
                onClick={onVoiceToggle}
                disabled={(disabled && !isLoading && !isVoiceBusy) || isVoiceBusy}
                className={cn(
                  "size-10 shrink-0 rounded-xl",
                  isVoiceRecording
                    ? "bg-red-500/12 text-red-300 ring-1 ring-red-400/25"
                    : "text-muted-foreground hover:bg-white/[0.05] hover:text-foreground"
                )}
                aria-label={
                  isVoiceRecording
                    ? "Stop rekam — tap untuk transkrip"
                    : "Rekam suara — tap untuk mulai"
                }
                title={
                  isVoiceRecording
                    ? "Tap lagi untuk kirim transkrip"
                    : "Tap mic → bicara → tap lagi"
                }
              >
                <Mic className={cn("size-4", isVoiceBusy && "animate-pulse")} />
              </Button>
            ) : null}

            <Textarea
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                useAgentTeam
                  ? "Tim 5 agent siap — tulis misi kamu…"
                  : "Kirim pesan ke PAIOS…"
              }
              disabled={disabled && !isLoading}
              rows={1}
              className="min-h-[44px] max-h-32 flex-1 resize-none border-0 bg-transparent px-1 py-2.5 text-[15px] shadow-none placeholder:text-muted-foreground/50 focus-visible:ring-0 sm:min-h-[46px] sm:max-h-36"
            />

            {isLoading ? (
              <Button
                type="button"
                size="icon"
                onClick={onStop}
                className="size-10 shrink-0 rounded-xl bg-red-500/85 text-white hover:bg-red-500"
                aria-label="Stop generation"
              >
                <Square className="size-3.5 fill-current" />
              </Button>
            ) : (
              <Button
                type="button"
                size="icon"
                onClick={onSend}
                disabled={disabled || !canSend}
                className={cn(
                  "size-10 shrink-0 rounded-xl text-white disabled:opacity-35",
                  useAgentTeam
                    ? "bg-violet-600 hover:bg-violet-500"
                    : "bg-cyan-600 hover:bg-cyan-500"
                )}
                aria-label="Send message"
              >
                <ArrowUp className="size-4" />
              </Button>
            )}
          </div>
        </div>

        <p className="hidden text-center text-[11px] text-muted-foreground/60 sm:block">
          {useAgentTeam
            ? "Use Agent ON · 5 specialist + synthesizer"
            : "Single agent · cepat & powerful"}{" "}
          · Mic: tap 2× rekam · Enter kirim
        </p>
      </div>
    </div>
  );
}
