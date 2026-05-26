"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  Check,
  ChevronDown,
  ChevronUp,
  Loader2,
  Radio,
  Sparkles,
  Users,
  Zap,
} from "lucide-react";
import { TeamNeuralMesh } from "@/components/chat/team-neural-mesh";
import { cn } from "@/lib/utils";
import { AGENT_POWER_LABELS, type AgentPowerMode } from "@/lib/agent-power";
import type { AgentTeamPlan, TeamAgentState } from "@/types/team";

const ROLE_ACCENT: Record<string, string> = {
  analyst: "border-violet-400/30 bg-violet-500/10 text-violet-200",
  researcher: "border-cyan-400/30 bg-cyan-500/10 text-cyan-200",
  builder: "border-amber-400/30 bg-amber-500/10 text-amber-200",
  creator: "border-pink-400/30 bg-pink-500/10 text-pink-200",
  synthesizer: "border-emerald-400/30 bg-emerald-500/10 text-emerald-200",
};

const ROLE_LANE: Record<string, string> = {
  analyst: "from-violet-500 to-indigo-400",
  researcher: "from-cyan-500 to-blue-400",
  builder: "from-amber-500 to-orange-400",
  creator: "from-pink-500 to-rose-400",
  synthesizer: "from-emerald-500 to-teal-400",
};

type TeamPhase = "deploy" | "parallel" | "synthesis" | "complete";

function detectTeamPhase(agents: TeamAgentState[]): TeamPhase {
  const synth = agents.find((a) => a.role === "synthesizer");
  const workers = agents.filter((a) => a.role !== "synthesizer");

  if (synth?.status === "running") return "synthesis";
  if (workers.every((w) => w.status === "done" || w.status === "error")) {
    return synth?.status === "done" ? "complete" : "synthesis";
  }
  if (workers.some((w) => w.status === "running")) return "parallel";
  if (workers.some((w) => w.status === "pending")) return "deploy";
  return "parallel";
}

function getDisplayProgress(agent: TeamAgentState, pulse: number): number {
  if (agent.status === "done") return 100;
  if (agent.status === "pending") return 0;
  const wobble = Math.sin(pulse + agent.id.charCodeAt(0)) * 3;
  return Math.min(98, Math.max(agent.progress + wobble, 6));
}

type TeamProgressPanelProps = {
  team: AgentTeamPlan;
  isStreaming?: boolean;
  powerMode?: AgentPowerMode;
  useAgentTeam?: boolean;
  className?: string;
};

export function TeamProgressPanel({
  team,
  isStreaming,
  powerMode = "sedang",
  useAgentTeam = false,
  className,
}: TeamProgressPanelProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [pulse, setPulse] = useState(0);
  const [activityFeed, setActivityFeed] = useState<
    Array<{ id: string; text: string; tone: string }>
  >([]);

  useEffect(() => {
    if (isStreaming) setCollapsed(false);
    else setCollapsed(true);
  }, [isStreaming]);

  const phase = useMemo(() => detectTeamPhase(team.agents), [team.agents]);

  const stats = useMemo(() => {
    const workers = team.agents.filter((a) => a.role !== "synthesizer");
    const synth = team.agents.find((a) => a.role === "synthesizer");
    const done = team.agents.filter((a) => a.status === "done").length;
    const running = team.agents.filter((a) => a.status === "running");
    const workersRunning = workers.filter((a) => a.status === "running");
    const total = team.agents.length;
    const progress =
      total > 0
        ? Math.round(
            team.agents.reduce((sum, a) => sum + a.progress, 0) / total
          )
        : 0;

    return {
      workers,
      synth,
      done,
      running,
      workersRunning,
      total,
      progress,
      workerCount: workers.length,
    };
  }, [team.agents]);

  useEffect(() => {
    if (!isStreaming) return;
    const start = team.startedAt ? new Date(team.startedAt).getTime() : Date.now();
    const tick = () => setElapsedSec(Math.floor((Date.now() - start) / 1000));
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [isStreaming, team.startedAt]);

  useEffect(() => {
    if (!isStreaming) return;
    const id = window.setInterval(() => setPulse((p) => p + 1), 700);
    return () => window.clearInterval(id);
  }, [isStreaming]);

  useEffect(() => {
    for (const agent of team.agents) {
      if (!agent.statusLabel) continue;
      const id = `${agent.id}-${agent.status}-${agent.progress}-${agent.statusLabel}`;
      const tone =
        agent.status === "running"
          ? "text-cyan-300"
          : agent.status === "done"
            ? "text-emerald-300"
            : "text-muted-foreground";
      const text = `${agent.emoji} ${agent.name} — ${agent.statusLabel}`;

      setActivityFeed((prev) => {
        if (prev.some((e) => e.id === id)) return prev;
        return [{ id, text, tone }, ...prev].slice(0, 12);
      });
    }
  }, [team.agents]);

  const phaseLabel =
    phase === "deploy"
      ? "Deploy tim…"
      : phase === "parallel"
        ? `${stats.workersRunning.length}/${stats.workerCount} agent kerja paralel`
        : phase === "synthesis"
          ? "Synthesizer menggabungkan hasil…"
          : "Misi tim selesai";

  const runningEmojis = stats.running.map((a) => a.emoji).join(" ");

  if (collapsed) {
    return (
      <div
        className={cn(
          "relative mb-3 overflow-hidden rounded-xl border border-cyan-400/20 bg-gradient-to-r from-cyan-500/[0.08] via-violet-500/[0.05] to-[oklch(0.11_0.025_265)]",
          className
        )}
      >
        <button
          type="button"
          onClick={() => setCollapsed(false)}
          className="flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-white/[0.03] sm:px-4"
        >
          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-cyan-500/15 ring-1 ring-cyan-400/20">
            <Users className="size-4 text-cyan-200" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold text-foreground/90">
              {useAgentTeam ? "Use Agent MAX" : "Mission Control"} · {stats.total} agent ·{" "}
              {stats.progress}% selesai
            </p>
            <p className="truncate text-[10px] text-muted-foreground">
              {phase === "complete" ? "Misi tim selesai" : phaseLabel} · klik untuk
              tampilkan detail
            </p>
          </div>
          <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
        </button>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative mb-3 overflow-hidden rounded-2xl border border-cyan-400/25 bg-gradient-to-b from-cyan-500/[0.1] via-violet-500/[0.06] to-[oklch(0.11_0.025_265)]",
        isStreaming && "ring-1 ring-cyan-400/20 shadow-[0_0_48px_-16px_oklch(0.72_0.14_195/35%)]",
        className
      )}
    >
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,transparent_0%,oklch(0.72_0.14_195/6%)_50%,transparent_100%)] paios-team-scan" />

      <div className="relative border-b border-white/8 px-3 py-3 sm:px-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-cyan-100">
                <Users className="size-3.5" />
                {useAgentTeam ? "Use Agent MAX" : "Mission Control"} · {stats.total} Agent
              </span>
              {isStreaming ? (
                <span className="flex items-center gap-1 rounded-full border border-red-400/30 bg-red-500/10 px-2 py-0.5 text-[9px] font-bold uppercase text-red-200">
                  <Radio className="size-2.5 animate-pulse" />
                  Live
                </span>
              ) : (
                <span className="rounded-full border border-emerald-400/25 bg-emerald-500/10 px-2 py-0.5 text-[9px] font-semibold text-emerald-200">
                  Selesai
                </span>
              )}
              <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[9px] text-muted-foreground">
                Mode {AGENT_POWER_LABELS[powerMode]}
              </span>
            </div>

            <p className="mt-1 text-sm font-medium leading-snug text-foreground/92">
              {team.summary}
            </p>

            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span
                className={cn(
                  "rounded-lg px-2 py-1 text-[10px] font-semibold",
                  phase === "parallel"
                    ? "bg-cyan-500/15 text-cyan-200 ring-1 ring-cyan-400/25"
                    : phase === "synthesis"
                      ? "bg-violet-500/15 text-violet-200 ring-1 ring-violet-400/25"
                      : "bg-white/5 text-muted-foreground"
                )}
              >
                {phaseLabel}
              </span>
              {runningEmojis ? (
                <span className="text-base leading-none tracking-widest">
                  {runningEmojis}
                </span>
              ) : null}
              <span className="text-[10px] tabular-nums text-muted-foreground">
                {isStreaming ? `${elapsedSec}s · ` : ""}
                {stats.done}/{stats.total} done
              </span>
            </div>
          </div>

          <div className="flex items-start gap-2">
            <div className="text-right">
              <p className="text-2xl font-bold tabular-nums text-cyan-200">
                {stats.progress}%
              </p>
              <p className="text-[9px] uppercase tracking-wide text-muted-foreground">
                progress tim
              </p>
            </div>
            <button
              type="button"
              onClick={() => setCollapsed(true)}
              className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-muted-foreground transition-colors hover:bg-white/10 hover:text-foreground"
              title="Sembunyikan Mission Control"
            >
              <ChevronUp className="size-4" />
            </button>
          </div>
        </div>

        <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/5 ring-1 ring-white/5">
          <div
            className="relative h-full rounded-full bg-gradient-to-r from-cyan-400 via-violet-400 to-emerald-400 transition-all duration-500"
            style={{ width: `${Math.max(stats.progress, 5)}%` }}
          >
            {isStreaming ? (
              <div className="absolute inset-0 overflow-hidden">
                <div className="h-full w-1/3 bg-white/30 paios-progress" />
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <div className="relative px-3 py-3 sm:px-4">
        <TeamNeuralMesh
          agents={team.agents}
          isStreaming={isStreaming}
          pulse={pulse}
        />
      </div>

      <div className="relative border-t border-white/6 px-3 py-3 sm:px-4">
        <p className="mb-2 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-cyan-300/85">
          <Zap className="size-3" />
          Parallel lanes — semua agent
        </p>
        <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {team.agents.map((agent) => {
            const progress = getDisplayProgress(agent, pulse);
            const running = agent.status === "running";
            const done = agent.status === "done";

            return (
              <div
                key={agent.id}
                className={cn(
                  "flex min-w-[108px] shrink-0 flex-col rounded-xl border p-2.5 transition-all sm:min-w-[120px]",
                  running && isStreaming
                    ? "border-cyan-400/35 bg-cyan-500/[0.08] ring-1 ring-cyan-400/20 paios-team-lane-active"
                    : done
                      ? "border-emerald-400/25 bg-emerald-500/[0.06]"
                      : "border-white/8 bg-white/[0.02]"
                )}
              >
                <div className="flex items-center justify-between gap-1">
                  <span className="text-lg">{agent.emoji}</span>
                  {running && isStreaming ? (
                    <Loader2 className="size-3 animate-spin text-cyan-300" />
                  ) : done ? (
                    <Check className="size-3 text-emerald-400" />
                  ) : (
                    <span className="size-2 rounded-full bg-white/15" />
                  )}
                </div>
                <p className="mt-1 truncate text-[10px] font-bold">{agent.name}</p>
                <p className="truncate font-mono text-[8px] text-muted-foreground">
                  {agent.modelLabel}
                </p>

                <div className="mt-2 h-16 w-full overflow-hidden rounded-md bg-black/20">
                  <div
                    className={cn(
                      "w-full bg-gradient-to-t opacity-90 transition-all duration-500",
                      ROLE_LANE[agent.role] ?? "from-cyan-500 to-violet-400",
                      running && isStreaming && "paios-team-lane-fill"
                    )}
                    style={{ height: `${progress}%`, marginTop: `${100 - progress}%` }}
                  />
                </div>

                <p className="mt-1.5 line-clamp-2 min-h-[2rem] text-[9px] leading-snug text-muted-foreground">
                  {agent.statusLabel ?? agent.task.slice(0, 48)}
                </p>
                <span
                  className={cn(
                    "mt-1 w-fit rounded px-1 py-0.5 text-[8px] font-semibold uppercase",
                    ROLE_ACCENT[agent.role] ?? "bg-white/5"
                  )}
                >
                  {agent.status}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {activityFeed.length > 0 ? (
        <div className="relative border-t border-white/6 bg-black/10 px-3 py-2 sm:px-4">
          <p className="mb-1.5 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-violet-300/80">
            <Activity className="size-3" />
            Neural feed
          </p>
          <div className="max-h-24 space-y-1 overflow-y-auto">
            {activityFeed.map((entry) => (
              <p
                key={entry.id}
                className={cn(
                  "flex items-start gap-1.5 text-[10px] leading-snug",
                  entry.tone
                )}
              >
                <Sparkles className="mt-0.5 size-2.5 shrink-0 opacity-70" />
                {entry.text}
              </p>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
