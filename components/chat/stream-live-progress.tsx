"use client";



import { cn } from "@/lib/utils";

import {

  AGENT_POWER_LABELS,

  type AgentPowerMode,

} from "@/lib/agent-power";

import type { StreamPhase } from "@/types/agent";



const PHASE_LABELS: Record<StreamPhase, string> = {

  planning: "Merencanakan",

  thinking: "Menganalisis",

  tooling: "Menjalankan tools",

  composing: "Menyusun jawaban",

  streaming: "Menulis respons",

  rendering: "Merender visual",

};



const PHASE_PROGRESS: Record<StreamPhase, number> = {

  planning: 12,

  thinking: 28,

  tooling: 48,

  composing: 62,

  streaming: 78,

  rendering: 92,

};



const POWER_BADGE: Record<AgentPowerMode, string> = {

  hemat: "border-emerald-400/25 bg-emerald-500/10 text-emerald-200/90",

  sedang: "border-cyan-400/25 bg-cyan-500/10 text-cyan-200/90",

  max: "border-violet-400/30 bg-violet-500/12 text-violet-200/95",

};



type StreamLiveProgressProps = {

  phase?: StreamPhase;

  label?: string;

  blockCount?: number;

  blockTotal?: number;

  powerMode?: AgentPowerMode;

  className?: string;

};



export function StreamLiveProgress({

  phase,

  label,

  blockCount,

  blockTotal,

  powerMode = "sedang",

  className,

}: StreamLiveProgressProps) {

  const phaseLabel = phase ? PHASE_LABELS[phase] : "Memproses";

  const displayLabel = label ?? phaseLabel;



  const blockProgress =

    blockTotal && blockTotal > 0

      ? Math.min(1, (blockCount ?? 0) / blockTotal)

      : 0;



  const isRendering = phase === "rendering" && blockTotal && blockTotal > 0;

  const phaseProgress = phase ? PHASE_PROGRESS[phase] : 8;

  const progressPercent = isRendering

    ? Math.max(phaseProgress, Math.round(blockProgress * 100))

    : phaseProgress;



  return (

    <div

      className={cn(

        "overflow-hidden rounded-xl border border-cyan-500/15 bg-gradient-to-r from-cyan-500/[0.05] via-violet-500/[0.03] to-transparent px-3 py-2.5",

        className

      )}

    >

      <div className="mb-2 flex items-center justify-between gap-2">

        <div className="flex min-w-0 flex-1 items-center gap-2">

          <span className="relative flex size-2.5 shrink-0">

            <span className="absolute inline-flex size-full animate-ping rounded-full bg-cyan-400/45" />

            <span className="relative size-2.5 rounded-full bg-cyan-400 shadow-[0_0_8px_oklch(0.72_0.14_195/50%)]" />

          </span>

          <span className="truncate text-xs font-medium text-cyan-100/95">

            {displayLabel}

          </span>

        </div>

        <div className="flex shrink-0 items-center gap-2">

          <span

            className={cn(

              "rounded-full border px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide",

              POWER_BADGE[powerMode]

            )}

          >

            {AGENT_POWER_LABELS[powerMode]}

          </span>

          <span className="text-[10px] tabular-nums text-muted-foreground">

            {progressPercent}%

          </span>

        </div>

      </div>



      <div className="h-1.5 overflow-hidden rounded-full bg-white/5 ring-1 ring-white/5">

        {isRendering ? (

          <div

            className="relative h-full rounded-full bg-gradient-to-r from-cyan-500 via-violet-500 to-emerald-400 transition-all duration-300 ease-out"

            style={{ width: `${Math.max(progressPercent, 8)}%` }}

          >

            <div className="absolute inset-0 animate-pulse bg-white/15" />

          </div>

        ) : (

          <div

            className="relative h-full rounded-full bg-gradient-to-r from-cyan-500 via-violet-500 to-cyan-400 transition-all duration-500 ease-out"

            style={{ width: `${progressPercent}%` }}

          >

            <div className="absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-white/25 to-transparent" />

          </div>

        )}

      </div>



      <div className="mt-1.5 flex items-center justify-between gap-2 text-[10px] text-muted-foreground">

        <span className="flex items-center gap-1.5">

          <span>{phase ? PHASE_LABELS[phase] : "Agent PAIOS"}</span>

          <span className="text-cyan-300/60">·</span>

          <span className="text-cyan-300/75">live</span>

        </span>

        {isRendering ? (

          <span className="tabular-nums">

            Block {blockCount ?? 0}/{blockTotal}

          </span>

        ) : null}

      </div>

    </div>

  );

}

