"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";
import type { ChartBlock } from "@/types/ui-response";

export function ChartViewVip({
  block,
  animateIn,
}: {
  block: ChartBlock;
  animateIn?: boolean;
}) {
  const stats = useMemo(() => {
    const values = block.data.map((d) => d.value);
    const sum = values.reduce((a, b) => a + b, 0);
    const max = Math.max(...values, 1);
    const min = Math.min(...values);
    const avg = values.length ? sum / values.length : 0;
    return { max, min, avg, sum };
  }, [block.data]);

  const maxVal = Math.max(...block.data.map((d) => d.value), 1);
  const isLine = block.chartType === "line";
  const width = 360;
  const height = 140;
  const pad = 12;
  const chartW = width - pad * 2;
  const chartH = height - pad * 2;

  const points = block.data.map((point, i) => {
    const x =
      block.data.length === 1
        ? pad + chartW / 2
        : pad + (i / (block.data.length - 1)) * chartW;
    const y = pad + chartH - (point.value / maxVal) * chartH;
    return { x, y, ...point };
  });

  const linePath = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`)
    .join(" ");
  const areaPath = `${linePath} L ${points[points.length - 1]?.x ?? pad} ${pad + chartH} L ${points[0]?.x ?? pad} ${pad + chartH} Z`;

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border border-violet-400/25 bg-gradient-to-br from-violet-500/[0.12] via-cyan-500/[0.06] to-[oklch(0.11_0.025_265)] p-4 ring-1 ring-violet-400/15 shadow-[0_0_40px_-12px_oklch(0.62_0.18_285/45%)]",
        animateIn && "paios-chart-grow"
      )}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-30"
        style={{
          backgroundImage:
            "linear-gradient(oklch(1 0 0 / 4%) 1px, transparent 1px), linear-gradient(90deg, oklch(1 0 0 / 4%) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />

      <div className="relative mb-3 flex flex-wrap items-start justify-between gap-2">
        <div>
          <span className="mb-1 inline-flex rounded-full border border-violet-400/30 bg-violet-500/15 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-violet-200">
            VIP Chart
          </span>
          {block.title ? (
            <h4 className="mt-1 text-base font-bold text-foreground">
              {block.title}
            </h4>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2 text-[10px]">
          <span className="rounded-md bg-white/5 px-2 py-1 tabular-nums">
            Max <strong className="text-cyan-300">{stats.max}</strong>
          </span>
          <span className="rounded-md bg-white/5 px-2 py-1 tabular-nums">
            Avg <strong className="text-violet-300">{stats.avg.toFixed(1)}</strong>
          </span>
          <span className="rounded-md bg-white/5 px-2 py-1 tabular-nums">
            Min <strong className="text-muted-foreground">{stats.min}</strong>
          </span>
        </div>
      </div>

      {isLine && points.length > 1 ? (
        <div className="relative mb-3">
          <svg
            viewBox={`0 0 ${width} ${height}`}
            className="h-36 w-full"
            aria-hidden
          >
            <defs>
              <linearGradient id="vip-line-fill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="oklch(0.72 0.14 195 / 35%)" />
                <stop offset="100%" stopColor="oklch(0.72 0.14 195 / 0%)" />
              </linearGradient>
            </defs>
            <path d={areaPath} fill="url(#vip-line-fill)" />
            <path
              d={linePath}
              fill="none"
              className="stroke-cyan-400"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            {points.map((p, i) => (
              <g key={`${p.label}-${i}`}>
                <circle cx={p.x} cy={p.y} r="4" className="fill-cyan-400" />
                <circle
                  cx={p.x}
                  cy={p.y}
                  r="7"
                  className="fill-cyan-400/20"
                />
              </g>
            ))}
          </svg>
        </div>
      ) : (
        <div className="mb-3 flex h-44 items-end gap-2 sm:gap-3">
          {block.data.map((point, i) => {
            const heightPct = Math.max((point.value / maxVal) * 100, 6);
            return (
              <div
                key={`${point.label}-${i}`}
                className="flex min-w-0 flex-1 flex-col items-center gap-2"
              >
                <span className="text-[11px] font-bold tabular-nums text-cyan-200">
                  {point.value}
                </span>
                <div className="relative flex h-32 w-full items-end justify-center">
                  <div
                    className={cn(
                      "w-full max-w-[48px] rounded-t-lg bg-gradient-to-t from-violet-600/90 via-cyan-500/80 to-cyan-300/70 shadow-[0_0_20px_-4px_oklch(0.72_0.14_195/50%)] transition-all duration-700",
                      animateIn && "paios-bar-grow"
                    )}
                    style={{ height: `${heightPct}%` }}
                  />
                </div>
                <span className="w-full truncate text-center text-[10px] font-medium text-muted-foreground">
                  {point.label}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {isLine ? (
        <div className="relative flex flex-wrap justify-center gap-3 border-t border-white/8 pt-2">
          {points.map((p, i) => (
            <span
              key={`${p.label}-legend-${i}`}
              className="text-[10px] text-muted-foreground"
            >
              <strong className="text-foreground/85">{p.label}</strong> ·{" "}
              {p.value}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}
