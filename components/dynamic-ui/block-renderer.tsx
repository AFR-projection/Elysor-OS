"use client";

import type { ReactNode } from "react";
import type { UIBlock } from "@/types/ui-response";
import { AlertView } from "@/components/dynamic-ui/blocks/alert-view";
import { CardGrid } from "@/components/dynamic-ui/blocks/card-grid";
import { ChartView } from "@/components/dynamic-ui/blocks/chart-view";
import { ChartViewVip } from "@/components/dynamic-ui/blocks/chart-view-vip";
import { CodeView } from "@/components/dynamic-ui/blocks/code-view";
import { ListView } from "@/components/dynamic-ui/blocks/list-view";
import { StatGrid } from "@/components/dynamic-ui/blocks/stat-grid";
import { TimelineView } from "@/components/dynamic-ui/blocks/timeline-view";
import { cn } from "@/lib/utils";

function LiveShell({
  children,
  active,
  className,
}: {
  children: ReactNode;
  active?: boolean;
  className?: string;
}) {
  return (
    <div className={cn(className, active && "paios-block-live")}>{children}</div>
  );
}

export function BlockRenderer({
  blocks,
  animate,
  isStreaming,
  vipMode,
}: {
  blocks: UIBlock[];
  animate?: boolean;
  isStreaming?: boolean;
  vipMode?: boolean;
}) {
  const stats = blocks.filter((b) => b.type === "stat");
  const cards = blocks.filter((b) => b.type === "card");
  const others = blocks.filter(
    (b) => b.type !== "stat" && b.type !== "card"
  );
  const lastBlock = blocks[blocks.length - 1];

  return (
    <div className="space-y-3">
      {stats.length > 0 ? (
        <LiveShell
          active={isStreaming && lastBlock?.type === "stat"}
          className={animate ? "paios-block-reveal" : undefined}
        >
          <StatGrid blocks={stats} animateIn={isStreaming} />
        </LiveShell>
      ) : null}
      {cards.length > 0 ? (
        <LiveShell
          active={isStreaming && lastBlock?.type === "card"}
          className={
            animate ? "paios-block-reveal paios-block-reveal-delay-1" : undefined
          }
        >
          <CardGrid blocks={cards} />
        </LiveShell>
      ) : null}
      {others.map((block, i) => {
        const delayClass =
          animate && i < 4
            ? `paios-block-reveal paios-block-reveal-delay-${i + 2}`
            : animate
              ? "paios-block-reveal"
              : undefined;
        const isLast = block === lastBlock;
        const inner = (() => {
          switch (block.type) {
            case "timeline":
              return <TimelineView block={block} />;
            case "chart":
              return vipMode ? (
                <ChartViewVip block={block} animateIn={isStreaming && isLast} />
              ) : (
                <ChartView block={block} animateIn={isStreaming && isLast} />
              );
            case "alert":
              return <AlertView block={block} />;
            case "list":
              return <ListView block={block} />;
            case "code":
              return <CodeView block={block} />;
            default:
              return null;
          }
        })();
        if (!inner) return null;
        return (
          <LiveShell key={`${block.type}-${i}`} active={isStreaming && isLast} className={delayClass}>
            {inner}
          </LiveShell>
        );
      })}
    </div>
  );
}
