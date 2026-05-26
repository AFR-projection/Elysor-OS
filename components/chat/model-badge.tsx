import { Brain, Cpu, Wrench } from "lucide-react";
import type { MessageMeta } from "@/types/chat";

const INTENT_LABELS: Record<string, string> = {
  general: "General",
  reasoning: "Reasoning",
  coding: "Coding",
  research: "Research",
};

export function ModelBadge({ meta }: { meta?: MessageMeta }) {
  if (!meta?.modelLabel && !meta?.toolsUsed?.length && !meta?.memoriesRecalled) {
    return null;
  }

  return (
    <div className="mt-1.5 flex flex-wrap items-center gap-1">
      {meta.modelLabel ? (
        <span className="inline-flex items-center gap-1 rounded-md bg-white/[0.03] px-1.5 py-0.5 text-[9px] text-muted-foreground/80">
          <Cpu className="size-2.5 text-cyan-400/70" />
          {meta.modelLabel}
        </span>
      ) : null}
      {meta.toolsUsed && meta.toolsUsed.length > 0 ? (
        <span className="hidden items-center gap-1 rounded-md bg-cyan-500/8 px-1.5 py-0.5 text-[9px] text-cyan-300/80 sm:inline-flex">
          <Wrench className="size-2.5" />
          {meta.toolsUsed.join(" · ")}
        </span>
      ) : null}
      {meta.memoriesRecalled != null && meta.memoriesRecalled > 0 ? (
        <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/8 px-1.5 py-0.5 text-[9px] text-amber-300/80">
          <Brain className="size-2.5" />
          {meta.memoriesRecalled} memori
        </span>
      ) : null}
      {meta.intent ? (
        <span className="hidden rounded-md bg-violet-500/8 px-1.5 py-0.5 text-[9px] text-violet-300/80 sm:inline">
          {INTENT_LABELS[meta.intent] ?? meta.intent}
        </span>
      ) : null}
    </div>
  );
}
