"use client";

import { Brain, LayoutGrid, PenLine, Sparkles, Wrench } from "lucide-react";
import { cn } from "@/lib/utils";
import type { StreamPhase } from "@/types/agent";

const PHASE_COPY: Record<
  StreamPhase,
  { icon: typeof Brain; messages: string[] }
> = {
  planning: {
    icon: Sparkles,
    messages: [
      "Merencanakan strategi…",
      "Memetakan langkah eksekusi…",
      "Memilih tools terbaik…",
    ],
  },
  thinking: {
    icon: Brain,
    messages: [
      "Menganalisis intent…",
      "Memetakan konteks…",
      "Menyiapkan strategi…",
    ],
  },
  tooling: {
    icon: Wrench,
    messages: [
      "Menjalankan tools…",
      "Mengumpulkan data…",
      "Memproses hasil tool…",
    ],
  },
  composing: {
    icon: PenLine,
    messages: [
      "Menyusun jawaban…",
      "Merangkai respons…",
      "Mengoptimalkan output…",
    ],
  },
  streaming: {
    icon: Sparkles,
    messages: ["Menulis respons…", "Streaming token…", "Hampir selesai…"],
  },
  rendering: {
    icon: LayoutGrid,
    messages: [
      "Membangun tampilan visual…",
      "Merender UI blocks…",
      "Menyempurnakan layout…",
    ],
  },
};

type AgentThinkingProps = {
  phase?: StreamPhase;
  label?: string;
  activeTool?: string;
  className?: string;
};

export function AgentThinking({
  phase = "thinking",
  label,
  activeTool,
  className,
}: AgentThinkingProps) {
  const config = PHASE_COPY[phase] ?? PHASE_COPY.thinking;
  const Icon = config.icon;
  const displayLabel =
    label ??
    (phase === "tooling" && activeTool
      ? `Tool: ${activeTool.replace(/_/g, " ")}…`
      : config.messages[0]);

  return (
    <div className={cn("space-y-3 py-1", className)}>
      <div className="flex items-center gap-3">
        <div className="relative flex size-8 shrink-0 items-center justify-center">
          <span className="absolute inset-0 animate-ping rounded-xl bg-cyan-400/20" />
          <span className="absolute inset-0 animate-pulse rounded-xl bg-gradient-to-br from-cyan-500/25 to-violet-500/20 ring-1 ring-cyan-400/30" />
          <Icon className="relative size-4 text-cyan-200" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="paios-stream-shimmer text-sm font-medium text-foreground/90">
            {displayLabel}
          </p>
          <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/5">
            <div className="paios-stream-progress h-full rounded-full bg-gradient-to-r from-cyan-500 via-violet-500 to-cyan-400" />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1.5 pl-11">
        {[0, 1, 2, 3, 4].map((i) => (
          <span
            key={i}
            className="size-1 rounded-full bg-cyan-400/70"
            style={{
              animation: "paios-wave 1.2s ease-in-out infinite",
              animationDelay: `${i * 120}ms`,
            }}
          />
        ))}
      </div>
    </div>
  );
}
