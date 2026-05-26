"use client";

import { Copy, ExternalLink, MessageSquare } from "lucide-react";
import type { AgentAction } from "@/types/ui-response";
import { cn } from "@/lib/utils";

type ActionBarProps = {
  actions: AgentAction[];
};

export function ActionBar({ actions }: ActionBarProps) {
  if (actions.length === 0) return null;

  const handleClick = async (action: AgentAction) => {
    if (action.type === "link") {
      window.open(action.value, "_blank", "noopener,noreferrer");
      return;
    }
    if (action.type === "prompt") {
      window.dispatchEvent(
        new CustomEvent("paios:fill-prompt", { detail: action.value })
      );
      return;
    }
    if (action.type === "copy") {
      await navigator.clipboard.writeText(action.value);
    }
  };

  return (
    <div className="mt-4 flex flex-wrap gap-2">
      {actions.map((action) => (
        <button
          key={action.id}
          type="button"
          onClick={() => void handleClick(action)}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all",
            "bg-white/[0.04] text-foreground/90 ring-1 ring-white/10",
            "hover:bg-cyan-500/10 hover:ring-cyan-500/30 hover:text-cyan-200"
          )}
        >
          {action.type === "link" ? (
            <ExternalLink className="size-3" />
          ) : action.type === "copy" ? (
            <Copy className="size-3" />
          ) : (
            <MessageSquare className="size-3" />
          )}
          {action.label}
        </button>
      ))}
    </div>
  );
}
