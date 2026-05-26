import { cn } from "@/lib/utils";
import type { AlertBlock, BlockVariant } from "@/types/ui-response";
import { AlertCircle, CheckCircle2, Info, TriangleAlert } from "lucide-react";

const VARIANT_CONFIG: Record<
  BlockVariant,
  { icon: typeof Info; className: string }
> = {
  default: {
    icon: Info,
    className: "ring-white/10 bg-white/[0.04] text-foreground",
  },
  info: {
    icon: Info,
    className: "ring-cyan-500/25 bg-cyan-500/10 text-cyan-100",
  },
  success: {
    icon: CheckCircle2,
    className: "ring-emerald-500/25 bg-emerald-500/10 text-emerald-100",
  },
  warning: {
    icon: TriangleAlert,
    className: "ring-amber-500/25 bg-amber-500/10 text-amber-100",
  },
  danger: {
    icon: AlertCircle,
    className: "ring-red-500/25 bg-red-500/10 text-red-100",
  },
};

export function AlertView({ block }: { block: AlertBlock }) {
  const config = VARIANT_CONFIG[block.variant ?? "info"];
  const Icon = config.icon;

  return (
    <div
      className={cn(
        "flex gap-3 rounded-xl p-3.5 ring-1",
        config.className
      )}
    >
      <Icon className="mt-0.5 size-4 shrink-0 opacity-80" />
      <div>
        {block.title ? (
          <p className="text-sm font-semibold">{block.title}</p>
        ) : null}
        <p className="text-xs leading-relaxed opacity-90">{block.message}</p>
      </div>
    </div>
  );
}
