import { cn } from "@/lib/utils";
import type { BlockVariant, CardBlock } from "@/types/ui-response";

const VARIANT_STYLES: Record<BlockVariant, string> = {
  default: "ring-white/10 from-white/[0.05]",
  success: "ring-emerald-500/25 from-emerald-500/10",
  warning: "ring-amber-500/25 from-amber-500/10",
  danger: "ring-red-500/25 from-red-500/10",
  info: "ring-cyan-500/25 from-cyan-500/10",
};

export function CardGrid({ blocks }: { blocks: CardBlock[] }) {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {blocks.map((card, i) => (
        <div
          key={`${card.title}-${i}`}
          className={cn(
            "rounded-xl bg-gradient-to-br to-transparent p-4 ring-1",
            VARIANT_STYLES[card.variant ?? "default"]
          )}
        >
          <h4 className="text-sm font-semibold text-foreground">{card.title}</h4>
          {card.description ? (
            <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
              {card.description}
            </p>
          ) : null}
          {card.items && card.items.length > 0 ? (
            <ul className="mt-3 space-y-1">
              {card.items.map((item, j) => (
                <li
                  key={`${item}-${j}`}
                  className="flex items-start gap-2 text-xs text-foreground/90"
                >
                  <span className="mt-1.5 size-1 shrink-0 rounded-full bg-cyan-400/80" />
                  {item}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ))}
    </div>
  );
}
