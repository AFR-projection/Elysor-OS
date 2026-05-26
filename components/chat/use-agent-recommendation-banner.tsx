"use client";

import { Sparkles, Users, Zap } from "lucide-react";
import { useSettings } from "@/components/providers/settings-provider";
import { useToast } from "@/components/providers/toast-provider";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type UseAgentRecommendationBannerProps = {
  reason: string;
  score: number;
  className?: string;
};

export function UseAgentRecommendationBanner({
  reason,
  score,
  className,
}: UseAgentRecommendationBannerProps) {
  const { settings, updateSettings } = useSettings();
  const { toast } = useToast();

  if (settings.useAgentTeam) return null;

  const handleEnable = async () => {
    try {
      await updateSettings({ useAgentTeam: true });
      toast("Use Agent aktif — tim 5 agent siap untuk task berikutnya", "success");
      window.dispatchEvent(new CustomEvent("paios:use-agent-enabled"));
    } catch {
      toast("Gagal mengaktifkan Use Agent", "error");
    }
  };

  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border border-amber-400/25 bg-gradient-to-r from-amber-500/10 via-violet-500/8 to-cyan-500/8 p-3 ring-1 ring-amber-400/15 sm:p-4",
        className
      )}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded-lg bg-amber-500/15 ring-1 ring-amber-400/25">
              <Zap className="size-3.5 text-amber-300" />
            </span>
            <p className="text-sm font-semibold text-amber-100">
              Task berat terdeteksi · skor {score}/10
            </p>
          </div>
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
            {reason}
          </p>
          <p className="mt-1.5 flex items-center gap-1 text-[10px] text-violet-300/80">
            <Users className="size-3" />
            Aktifkan Use Agent untuk deploy Analyst, Researcher, Builder, Creator
            + Synthesizer dengan model premium.
          </p>
        </div>
        <Button
          type="button"
          onClick={() => void handleEnable()}
          className="shrink-0 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white hover:from-violet-500 hover:to-fuchsia-500"
        >
          <Sparkles className="mr-1.5 size-3.5" />
          Aktifkan Use Agent
        </Button>
      </div>
    </div>
  );
}
