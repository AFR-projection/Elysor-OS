import { cn } from "@/lib/utils";
import type { StatBlock } from "@/types/ui-response";
import type { LucideIcon } from "lucide-react";
import {
  Activity,
  Brain,
  Clock,
  Database,
  TrendingDown,
  TrendingUp,
  Zap,
} from "lucide-react";

const ICONS: Record<string, LucideIcon> = {
  activity: Activity,
  brain: Brain,
  clock: Clock,
  database: Database,
  zap: Zap,
};

export function StatGrid({
  blocks,
  animateIn,
}: {
  blocks: StatBlock[];
  animateIn?: boolean;
}) {
  return (
    <div className="grid grid-cols-1 gap-2 min-[420px]:grid-cols-2 lg:grid-cols-3">
      {blocks.map((stat, i) => {
        const Icon = stat.icon ? ICONS[stat.icon] ?? Zap : Zap;
        return (
          <div
            key={`${stat.label}-${i}`}
            className={cn(
              "rounded-lg bg-white/[0.04] p-3 ring-1 ring-white/8",
              animateIn && "paios-stat-pop"
            )}
            style={animateIn ? { animationDelay: `${i * 120}ms` } : undefined}
          >
            <div className="flex items-start justify-between gap-2">
              <Icon className="size-4 shrink-0 text-cyan-400/80" />
              {stat.change ? (
                <span
                  className={cn(
                    "flex items-center gap-0.5 text-[10px] font-medium",
                    stat.trend === "up" && "text-emerald-400",
                    stat.trend === "down" && "text-red-400",
                    stat.trend === "neutral" && "text-muted-foreground"
                  )}
                >
                  {stat.trend === "up" ? (
                    <TrendingUp className="size-3" />
                  ) : stat.trend === "down" ? (
                    <TrendingDown className="size-3" />
                  ) : null}
                  {stat.change}
                </span>
              ) : null}
            </div>
            <p className="mt-2 text-lg font-semibold tracking-tight text-foreground sm:text-xl">
              {stat.value}
            </p>
            <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground">
              {stat.label}
            </p>
          </div>
        );
      })}
    </div>
  );
}
