import type { ListBlock } from "@/types/ui-response";

export function ListView({ block }: { block: ListBlock }) {
  return (
    <div className="overflow-hidden rounded-xl ring-1 ring-white/10">
      {block.title ? (
        <div className="border-b border-white/5 bg-white/[0.04] px-4 py-2.5">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {block.title}
          </h4>
        </div>
      ) : null}
      <ul className="divide-y divide-white/5 bg-white/[0.02]">
        {block.items.map((item, i) => (
          <li
            key={`${item.label}-${i}`}
            className="flex items-center justify-between gap-4 px-4 py-2.5 text-sm"
          >
            <span className="text-muted-foreground">{item.label}</span>
            {item.value ? (
              <span className="font-medium text-foreground">{item.value}</span>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
