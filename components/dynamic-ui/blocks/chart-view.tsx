import { cn } from "@/lib/utils";
import type { ChartBlock } from "@/types/ui-response";

export function ChartView({
  block,
  animateIn,
}: {
  block: ChartBlock;
  animateIn?: boolean;
}) {
  const max = Math.max(...block.data.map((d) => d.value), 1);

  return (
    <div
      className={cn(
        "rounded-xl bg-white/[0.03] p-4 ring-1 ring-white/10",
        animateIn && "paios-chart-grow"
      )}
    >
      {block.title ? (
        <h4 className="mb-4 text-sm font-semibold text-foreground">
          {block.title}
        </h4>
      ) : null}
      <div className="flex h-40 items-end gap-2 sm:gap-3">
        {block.data.map((point, i) => {
          const height = Math.max((point.value / max) * 100, 4);
          return (
            <div
              key={`${point.label}-${i}`}
              className="flex min-w-0 flex-1 flex-col items-center gap-2"
            >
              <span className="text-[10px] font-medium text-muted-foreground">
                {point.value}
              </span>
              <div
                className={cn(
                  "w-full rounded-t-md bg-gradient-to-t from-cyan-600/80 to-cyan-400/60 transition-all duration-700 ease-out",
                  animateIn && "paios-bar-grow"
                )}
                style={{ height: `${height}%` }}
              />
              <span className="w-full truncate text-center text-[10px] text-muted-foreground">
                {point.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
