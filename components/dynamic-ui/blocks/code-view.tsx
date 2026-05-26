import type { CodeBlock } from "@/types/ui-response";

export function CodeView({ block }: { block: CodeBlock }) {
  return (
    <div className="overflow-hidden rounded-xl ring-1 ring-white/10">
      {block.language ? (
        <div className="border-b border-white/5 bg-white/[0.04] px-3 py-1.5">
          <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            {block.language}
          </span>
        </div>
      ) : null}
      <pre className="overflow-x-auto bg-black/40 p-4">
        <code className="font-mono text-[13px] leading-relaxed text-cyan-100">
          {block.code}
        </code>
      </pre>
    </div>
  );
}
