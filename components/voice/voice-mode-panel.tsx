"use client";

import Link from "next/link";
import { ArrowLeft, Mic, MicOff } from "lucide-react";
import { VoiceAgentVisual } from "@/components/voice/voice-agent-visual";
import { VoiceParticlesBackground } from "@/components/voice/voice-particles-background";
import { useConversation } from "@/components/providers/conversation-provider";
import { useSettings } from "@/components/providers/settings-provider";
import { useToast } from "@/components/providers/toast-provider";
import { buttonVariants } from "@/components/ui/button";
import { useVoiceSession } from "@/hooks/use-voice-session";
import { cn } from "@/lib/utils";

export function VoiceModePanel() {
  const { toast } = useToast();
  const { settings } = useSettings();
  const {
    activeConversationId,
    setActiveConversationId,
    refreshConversations,
    refreshMemories,
  } = useConversation();

  const session = useVoiceSession({
    timezone: settings.timezone,
    preferredLanguage: settings.preferredLanguage,
    conversationId: activeConversationId,
    onConversationId: setActiveConversationId,
    onRefresh: () => {
      void refreshConversations();
      void refreshMemories();
    },
    onError: (message) => toast(message, "error"),
  });

  const connected = session.sessionActive;
  const live = connected && session.voiceEnabled;

  return (
    <div className="paios-voice-mode relative flex h-full min-h-0 flex-1 flex-col overflow-hidden">
      <VoiceParticlesBackground active={connected} />

      <div className="safe-top relative z-10 flex shrink-0 items-center justify-between border-b border-white/5 bg-background/40 px-4 py-3 backdrop-blur-md">
        <Link
          href="/"
          className={cn(
            buttonVariants({ variant: "ghost", size: "sm" }),
            "gap-2 rounded-xl text-muted-foreground"
          )}
        >
          <ArrowLeft className="size-4" />
          Chat
        </Link>
        <div className="flex flex-col items-center gap-0.5">
          <span className="text-xs font-semibold uppercase tracking-widest text-violet-300/90">
            Live Voice
          </span>
          {connected ? (
            <span
              className={cn(
                "flex items-center gap-1.5 text-[10px]",
                live ? "text-emerald-300/90" : "text-amber-300/90"
              )}
            >
              <span
                className={cn(
                  "size-1.5 rounded-full",
                  live ? "animate-pulse bg-emerald-400" : "bg-amber-400"
                )}
              />
              {live ? "Terhubung · Mendengarkan" : "Terhubung · Voice Off"}
            </span>
          ) : (
            <span className="text-[10px] text-muted-foreground">
              Menghubungkan…
            </span>
          )}
        </div>
        <div className="w-[72px]" />
      </div>

      <div className="paios-chat-scroll relative z-[1] flex flex-1 flex-col items-center justify-center px-4 py-6 sm:px-8">
        <VoiceAgentVisual
          phase={session.phase}
          level={session.displayLevel}
          sessionActive={connected}
          micAnalyserRef={session.micAnalyserRef}
          playbackAnalyserRef={session.playbackAnalyserRef}
          className="mb-6 sm:mb-8"
        />

        <p className="max-w-md text-center text-sm font-medium text-foreground/90">
          {session.statusLabel}
        </p>

        {connected && session.voiceEnabled ? (
          <p className="mt-2 text-center text-[11px] text-muted-foreground/70">
            Bicara natural · diam sebentar = auto kirim · bisa interupsi saat AI
            ngomong
          </p>
        ) : null}

        {connected && !session.voiceEnabled ? (
          <p className="mt-2 text-center text-[11px] text-amber-300/70">
            Ketuk mic untuk Voice On — PAIOS tetap terhubung
          </p>
        ) : null}

        <div className="mt-8 flex min-h-[96px] w-full max-w-lg flex-col items-center gap-3 text-center">
          {session.userCaption ? (
            <p className="animate-in fade-in slide-in-from-bottom-2 text-sm text-muted-foreground duration-300">
              <span className="font-semibold text-cyan-300/90">Kamu: </span>
              {session.userCaption}
            </p>
          ) : null}
          {session.agentCaption ? (
            <p className="animate-in fade-in slide-in-from-bottom-2 text-sm leading-relaxed text-foreground/85 duration-500">
              <span className="font-semibold text-violet-300/90">PAIOS: </span>
              {session.agentCaption}
            </p>
          ) : null}
        </div>
      </div>

      <div className="safe-bottom relative z-10 shrink-0 border-t border-white/5 bg-background/50 px-4 py-6 backdrop-blur-md">
        <div className="mx-auto flex max-w-lg flex-col items-center gap-4">
          <button
            type="button"
            onClick={() => session.toggleVoice()}
            disabled={!connected}
            className={cn(
              "relative flex size-20 items-center justify-center rounded-full transition-all duration-500 sm:size-24",
              !connected && "opacity-50",
              session.voiceEnabled
                ? "bg-gradient-to-br from-cyan-500/25 to-violet-500/25 ring-2 ring-cyan-400/40 shadow-[0_0_48px_-10px_oklch(0.72_0.14_195/45%)] hover:scale-[1.03]"
                : "bg-amber-500/12 ring-2 ring-amber-400/35 shadow-[0_0_32px_-10px_oklch(0.75_0.14_85/35%)] hover:scale-[1.03]"
            )}
            aria-label={
              session.voiceEnabled ? "Voice Off" : "Voice On"
            }
          >
            {session.voiceEnabled ? (
              <Mic className="size-8 text-cyan-50 sm:size-9" />
            ) : (
              <MicOff className="size-8 text-amber-200 sm:size-9" />
            )}
            {session.voiceEnabled && connected ? (
              <span className="paios-voice-agent__btn-glow absolute inset-0 rounded-full" />
            ) : null}
          </button>

          <p className="text-center text-[11px] text-muted-foreground/75">
            {session.voiceEnabled
              ? "Voice On — ketuk untuk Voice Off (mute)"
              : "Voice Off — ketuk untuk Voice On"}
          </p>
        </div>
      </div>
    </div>
  );
}
