"use client";

import { useEffect, useState } from "react";
import {
  Check,
  ChevronDown,
  ChevronUp,
  Circle,
  Loader2,
  Map,
  SkipForward,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { AgentPlan, PlanStepStatus } from "@/types/plan";

const COMPLEXITY_LABELS: Record<string, string> = {
  simple: "Sederhana",
  moderate: "Sedang",
  complex: "Kompleks",
};

function StepIcon({ status }: { status?: PlanStepStatus }) {
  if (status === "done") {
    return (
      <span className="flex size-4 shrink-0 items-center justify-center rounded-full bg-emerald-500/20">
        <Check className="size-2.5 text-emerald-300" />
      </span>
    );
  }
  if (status === "running") {
    return (
      <span className="flex size-4 shrink-0 items-center justify-center rounded-full bg-cyan-500/20">
        <Loader2 className="size-2.5 animate-spin text-cyan-300" />
      </span>
    );
  }
  if (status === "skipped") {
    return (
      <span className="flex size-4 shrink-0 items-center justify-center rounded-full bg-white/5">
        <SkipForward className="size-2.5 text-muted-foreground" />
      </span>
    );
  }
  return (
    <span className="flex size-4 shrink-0 items-center justify-center rounded-full bg-white/5">
      <Circle className="size-2 text-muted-foreground/60" />
    </span>
  );
}

type PlanCardProps = {
  plan: AgentPlan;
  isStreaming?: boolean;
  className?: string;
  collapsible?: boolean;
};

export function PlanCard({
  plan,
  isStreaming,
  className,
  collapsible = true,
}: PlanCardProps) {
  const doneCount = plan.steps.filter((s) => s.status === "done").length;
  const progress =
    plan.steps.length > 0 ? Math.round((doneCount / plan.steps.length) * 100) : 0;
  const allDone = plan.steps.every(
    (s) => s.status === "done" || s.status === "skipped"
  );
  const [expanded, setExpanded] = useState(isStreaming || !allDone);

  useEffect(() => {
    if (isStreaming) setExpanded(true);
    else if (allDone && collapsible) setExpanded(false);
  }, [isStreaming, allDone, collapsible]);

  if (collapsible && !expanded && !isStreaming) {
    return (
      <button
        type="button"
        onClick={() => setExpanded(true)}
        className={cn(
          "mb-2 flex w-full items-center gap-2 rounded-xl border border-white/6 bg-white/[0.03] px-3 py-2 text-left transition-colors hover:bg-white/[0.05]",
          className
        )}
      >
        <span className="flex size-6 shrink-0 items-center justify-center rounded-lg bg-emerald-500/15">
          <Check className="size-3 text-emerald-300" />
        </span>
        <span className="min-w-0 flex-1 truncate text-xs text-muted-foreground">
          Rencana agent · {doneCount}/{plan.steps.length} selesai
        </span>
        <ChevronDown className="size-3.5 shrink-0 text-muted-foreground" />
      </button>
    );
  }

  return (
    <div
      className={cn(
        "mb-2 overflow-hidden rounded-xl border border-violet-400/10 bg-violet-500/[0.04]",
        className
      )}
    >
      <div className="flex items-start gap-2.5 px-3 py-2.5">
        <div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg bg-violet-500/12">
          <Map className="size-3.5 text-violet-200" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-medium uppercase tracking-wide text-violet-300/80">
              Rencana
            </span>
            <span className="rounded-full bg-white/5 px-1.5 py-0.5 text-[9px] text-muted-foreground">
              {COMPLEXITY_LABELS[plan.complexity] ?? plan.complexity}
            </span>
            {isStreaming ? (
              <span className="flex items-center gap-1 text-[9px] text-cyan-400/80">
                <Sparkles className="size-2.5" />
                live
              </span>
            ) : null}
            {collapsible && !isStreaming ? (
              <button
                type="button"
                onClick={() => setExpanded(false)}
                className="ml-auto rounded-md p-1 text-muted-foreground hover:bg-white/5"
                aria-label="Tutup rencana"
              >
                <ChevronUp className="size-3.5" />
              </button>
            ) : null}
          </div>
          <p className="mt-0.5 text-xs leading-snug text-foreground/85">
            {plan.summary}
          </p>
        </div>
      </div>

      {isStreaming ? (
        <div className="px-3 pb-2">
          <div className="mb-1 flex justify-between text-[9px] text-muted-foreground">
            <span>Progress</span>
            <span>{progress}%</span>
          </div>
          <div className="h-0.5 overflow-hidden rounded-full bg-white/5">
            <div
              className="h-full rounded-full bg-gradient-to-r from-violet-500 to-cyan-400 transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      ) : null}

      <ol className="space-y-0 border-t border-white/5 px-2 py-1.5">
        {plan.steps.map((step) => (
          <li
            key={step.id}
            className={cn(
              "flex items-center gap-2 rounded-lg px-2 py-1.5",
              step.status === "running" && "bg-cyan-500/6"
            )}
          >
            <StepIcon status={step.status} />
            <div className="min-w-0 flex-1">
              <p
                className={cn(
                  "text-xs font-medium leading-snug",
                  step.status === "done"
                    ? "text-muted-foreground line-through decoration-white/15"
                    : "text-foreground/90"
                )}
              >
                {step.title}
              </p>
              {step.tool ? (
                <span className="mt-0.5 inline-block rounded bg-white/5 px-1 py-px font-mono text-[9px] text-cyan-300/70">
                  {step.tool}
                </span>
              ) : null}
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
