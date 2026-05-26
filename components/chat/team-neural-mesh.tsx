"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";
import type { TeamAgentState } from "@/types/team";

const ROLE_RING: Record<string, string> = {
  analyst: "stroke-violet-400",
  researcher: "stroke-cyan-400",
  builder: "stroke-amber-400",
  creator: "stroke-pink-400",
  synthesizer: "stroke-emerald-400",
};

const ROLE_GLOW: Record<string, string> = {
  analyst: "shadow-[0_0_20px_-4px_oklch(0.62_0.18_285/55%)]",
  researcher: "shadow-[0_0_20px_-4px_oklch(0.72_0.14_195/55%)]",
  builder: "shadow-[0_0_20px_-4px_oklch(0.75_0.16_55/55%)]",
  creator: "shadow-[0_0_20px_-4px_oklch(0.68_0.18_350/55%)]",
  synthesizer: "shadow-[0_0_24px_-2px_oklch(0.72_0.14_165/60%)]",
};

const VB = { w: 400, h: 280 };
const CENTER = { x: 200, y: 132 };
const WORKER_RADIUS = 92;

type NodeLayout = {
  agent: TeamAgentState;
  x: number;
  y: number;
  isCenter: boolean;
};

function buildLayout(agents: TeamAgentState[]): NodeLayout[] {
  const synthesizer = agents.find((a) => a.role === "synthesizer");
  const workers = agents.filter((a) => a.role !== "synthesizer");
  const layouts: NodeLayout[] = [];

  if (synthesizer) {
    layouts.push({
      agent: synthesizer,
      x: CENTER.x,
      y: CENTER.y,
      isCenter: true,
    });
  }

  workers.forEach((agent, i) => {
    const angle = (2 * Math.PI * i) / workers.length - Math.PI / 2;
    layouts.push({
      agent,
      x: CENTER.x + WORKER_RADIUS * Math.cos(angle),
      y: CENTER.y + WORKER_RADIUS * Math.sin(angle),
      isCenter: false,
    });
  });

  return layouts;
}

function getDisplayProgress(agent: TeamAgentState, pulse: number): number {
  if (agent.status === "done") return 100;
  if (agent.status === "pending") return 0;
  if (agent.status === "error") return agent.progress;
  const wobble = Math.sin(pulse * 0.8 + agent.id.length) * 4;
  return Math.min(96, Math.max(agent.progress + wobble, 8));
}

type TeamNeuralMeshProps = {
  agents: TeamAgentState[];
  isStreaming?: boolean;
  pulse?: number;
  className?: string;
};

export function TeamNeuralMesh({
  agents,
  isStreaming,
  pulse = 0,
  className,
}: TeamNeuralMeshProps) {
  const layouts = useMemo(() => buildLayout(agents), [agents]);
  const workers = layouts.filter((l) => !l.isCenter);
  const center = layouts.find((l) => l.isCenter);
  const runningCount = agents.filter((a) => a.status === "running").length;

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl border border-white/8 bg-[oklch(0.1_0.02_265/80%)]",
        className
      )}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-50"
        style={{
          backgroundImage:
            "radial-gradient(circle at 50% 48%, oklch(0.72 0.14 195 / 14%) 0%, transparent 55%)",
        }}
      />

      <svg
        viewBox={`0 0 ${VB.w} ${VB.h}`}
        className="relative h-[min(52vw,260px)] w-full sm:h-[280px]"
        aria-hidden
      >
        {center
          ? workers.map(({ agent, x, y }) => {
              const active =
                isStreaming &&
                (agent.status === "running" ||
                  center.agent.status === "running");
              return (
                <line
                  key={`link-${agent.id}`}
                  x1={x}
                  y1={y}
                  x2={center.x}
                  y2={center.y}
                  className={cn(
                    "transition-all duration-500",
                    active
                      ? "stroke-cyan-400/50 paios-team-beam"
                      : agent.status === "done"
                        ? "stroke-emerald-400/25"
                        : "stroke-white/8"
                  )}
                  strokeWidth={active ? 2 : 1}
                  strokeDasharray={active ? "6 8" : undefined}
                />
              );
            })
          : null}

        {center && isStreaming ? (
          <>
            <circle
              cx={center.x}
              cy={center.y}
              r={28}
              fill="none"
              className="stroke-emerald-400/20 paios-team-core-ring"
              strokeWidth={1}
            />
            <circle
              cx={center.x}
              cy={center.y}
              r={38}
              fill="none"
              className="stroke-violet-400/15 paios-team-core-ring"
              strokeWidth={1}
              style={{ animationDelay: "0.4s" }}
            />
          </>
        ) : null}
      </svg>

      {layouts.map(({ agent, x, y, isCenter }) => {
        const left = (x / VB.w) * 100;
        const top = (y / VB.h) * 100;
        const progress = getDisplayProgress(agent, pulse);
        const running = agent.status === "running";
        const done = agent.status === "done";

        return (
          <div
            key={agent.id}
            className="absolute z-10 -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${left}%`, top: `${top}%` }}
          >
            <div
              className={cn(
                "relative flex flex-col items-center transition-all duration-300",
                running && isStreaming && "paios-team-node-active scale-105",
                isCenter && running && "scale-110"
              )}
            >
              <div
                className={cn(
                  "relative flex size-14 items-center justify-center rounded-2xl border bg-[oklch(0.14_0.025_265)] sm:size-16",
                  running
                    ? cn(
                        "border-cyan-400/40 bg-cyan-500/10",
                        ROLE_GLOW[agent.role]
                      )
                    : done
                      ? "border-emerald-400/35 bg-emerald-500/10"
                      : "border-white/10 bg-white/[0.04]",
                  isCenter && "size-16 border-emerald-400/30 sm:size-[4.5rem]"
                )}
              >
                {running && isStreaming ? (
                  <span className="absolute -inset-1 animate-ping rounded-2xl bg-cyan-400/15" />
                ) : null}

                <svg
                  className="absolute inset-0 size-full -rotate-90"
                  viewBox="0 0 64 64"
                >
                  <circle
                    cx="32"
                    cy="32"
                    r="28"
                    fill="none"
                    className="stroke-white/8"
                    strokeWidth="3"
                  />
                  <circle
                    cx="32"
                    cy="32"
                    r="28"
                    fill="none"
                    className={cn(
                      ROLE_RING[agent.role] ?? "stroke-cyan-400",
                      "transition-all duration-500"
                    )}
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeDasharray={`${(progress / 100) * 176} 176`}
                  />
                </svg>

                <span className="relative text-xl sm:text-2xl">{agent.emoji}</span>

                {running && isStreaming ? (
                  <span className="absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full bg-cyan-400 text-[8px] font-bold text-[oklch(0.14_0.025_265)]">
                    ●
                  </span>
                ) : null}
                {done ? (
                  <span className="absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full bg-emerald-500 text-[9px] text-white">
                    ✓
                  </span>
                ) : null}
              </div>

              <p className="mt-1.5 max-w-[88px] truncate text-center text-[10px] font-bold text-foreground/90 sm:max-w-[96px] sm:text-[11px]">
                {agent.name}
              </p>
              <p
                className={cn(
                  "max-w-[100px] truncate text-center text-[9px]",
                  running ? "text-cyan-300/90" : "text-muted-foreground"
                )}
              >
                {agent.statusLabel ??
                  (agent.status === "pending" ? "Standby" : agent.status)}
              </p>
            </div>
          </div>
        );
      })}

      {isStreaming ? (
        <div className="absolute bottom-2 left-0 right-0 flex justify-center">
          <span className="rounded-full border border-cyan-400/20 bg-cyan-500/10 px-2.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-cyan-200/90">
            {runningCount > 1
              ? `${runningCount} neural link aktif · paralel`
              : runningCount === 1
                ? "1 agent aktif"
                : "Menunggu deploy…"}
          </span>
        </div>
      ) : null}
    </div>
  );
}
