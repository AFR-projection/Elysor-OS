"use client";

import { cn } from "@/lib/utils";
import { VoiceOrbCanvas } from "@/components/voice/voice-orb-canvas";
import type { VoiceSessionPhase } from "@/types/voice";

type VoiceAgentVisualProps = {
  phase: VoiceSessionPhase;
  level?: number;
  micAnalyserRef?: React.RefObject<AnalyserNode | null>;
  playbackAnalyserRef?: React.RefObject<AnalyserNode | null>;
  sessionActive?: boolean;
  className?: string;
};

export function VoiceAgentVisual({
  phase,
  level = 0,
  micAnalyserRef,
  playbackAnalyserRef,
  sessionActive = false,
  className,
}: VoiceAgentVisualProps) {
  return (
    <div
      className={cn(
        "relative flex shrink-0 items-center justify-center",
        className
      )}
      data-phase={phase}
      aria-hidden
    >
      <div
        className={cn(
          "pointer-events-none absolute inset-0 m-auto size-[min(78vw,380px)] max-w-full rounded-full blur-3xl transition-opacity duration-700",
          sessionActive ? "opacity-100" : "opacity-40"
        )}
        style={{
          background:
            phase === "speaking"
              ? "radial-gradient(circle, oklch(0.55 0.18 290 / 35%), transparent 68%)"
              : phase === "user_speaking" || phase === "listening"
                ? "radial-gradient(circle, oklch(0.72 0.14 195 / 30%), transparent 68%)"
                : "radial-gradient(circle, oklch(0.55 0.14 265 / 22%), transparent 70%)",
        }}
      />

      <VoiceOrbCanvas
        phase={phase}
        sessionActive={sessionActive}
        micAnalyserRef={micAnalyserRef}
        playbackAnalyserRef={playbackAnalyserRef}
        level={level}
      />
    </div>
  );
}
