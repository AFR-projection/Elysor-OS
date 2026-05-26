"use client";

import { Sparkles, Users, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

type UseAgentToggleProps = {
  enabled: boolean;
  onChange: (enabled: boolean) => void;
  disabled?: boolean;
};

export function UseAgentToggle({
  enabled,
  onChange,
  disabled,
}: UseAgentToggleProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onChange(!enabled)}
      className={cn(
        "flex items-center gap-2 rounded-xl border px-2.5 py-2 text-left transition-all sm:px-3",
        enabled
          ? "border-violet-400/25 bg-violet-500/10 text-violet-100"
          : "border-white/[0.08] bg-white/[0.02] text-muted-foreground hover:border-white/12 hover:bg-white/[0.04] hover:text-foreground",
        disabled && "pointer-events-none opacity-50"
      )}
      aria-pressed={enabled}
      aria-label={enabled ? "Use Agent aktif" : "Use Agent nonaktif"}
    >
      <span
        className={cn(
          "flex size-8 shrink-0 items-center justify-center rounded-lg",
          enabled
            ? "bg-violet-500/20 text-violet-200"
            : "bg-white/[0.04] text-muted-foreground"
        )}
      >
        {enabled ? <Users className="size-4" /> : <Zap className="size-4" />}
      </span>
      <span className="min-w-0">
        <span className="flex items-center gap-1 text-xs font-semibold">
          Use Agent
          {enabled ? <Sparkles className="size-3 text-cyan-300/90" /> : null}
        </span>
        <span className="mt-0.5 block text-[10px] text-muted-foreground/80">
          {enabled ? "5 agent · MAX" : "Single · fast"}
        </span>
      </span>
    </button>
  );
}
