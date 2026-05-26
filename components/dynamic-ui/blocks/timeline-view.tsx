import type { TimelineBlock } from "@/types/ui-response";

export function TimelineView({ block }: { block: TimelineBlock }) {
  return (
    <div className="rounded-xl bg-white/[0.03] p-4 ring-1 ring-white/10">
      {block.title ? (
        <h4 className="mb-4 text-sm font-semibold text-foreground">
          {block.title}
        </h4>
      ) : null}
      <ol className="relative space-y-0">
        {block.events.map((event, i) => (
          <li key={`${event.time}-${i}`} className="relative flex gap-4 pb-6 last:pb-0">
            {i < block.events.length - 1 ? (
              <span className="absolute top-6 left-[5px] h-full w-px bg-gradient-to-b from-cyan-500/40 to-transparent" />
            ) : null}
            <span className="relative z-10 mt-1 size-2.5 shrink-0 rounded-full bg-cyan-400 ring-4 ring-cyan-500/20" />
            <div className="min-w-0 flex-1 pt-0.5">
              <div className="flex flex-wrap items-baseline gap-2">
                <span className="text-[10px] font-medium uppercase tracking-wider text-cyan-400/90">
                  {event.time}
                </span>
                <span className="text-sm font-medium text-foreground">
                  {event.title}
                </span>
              </div>
              {event.description ? (
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  {event.description}
                </p>
              ) : null}
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
