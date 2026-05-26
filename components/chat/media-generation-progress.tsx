"use client";

import { Film, ImageIcon, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type MediaGenerationProgressProps = {
  kind: "image" | "video";
  label?: string;
  className?: string;
};

export function MediaGenerationProgress({
  kind,
  label,
  className,
}: MediaGenerationProgressProps) {
  const isVideo = kind === "video";
  const defaultLabel = isVideo
    ? "Generate video AI · Google Veo 3.1…"
    : "Generate gambar AI · Flux 2 Pro…";

  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl ring-1",
        isVideo
          ? "ring-violet-400/25 bg-violet-500/[0.06]"
          : "ring-fuchsia-400/25 bg-fuchsia-500/[0.06]",
        className
      )}
    >
      <div className="flex items-center gap-2 border-b border-white/6 px-3 py-2.5">
        <Loader2
          className={cn(
            "size-4 shrink-0 animate-spin",
            isVideo ? "text-violet-300" : "text-fuchsia-300"
          )}
        />
        {isVideo ? (
          <Film className="size-3.5 shrink-0 text-violet-300/80" />
        ) : (
          <ImageIcon className="size-3.5 shrink-0 text-fuchsia-300/80" />
        )}
        <span className="text-xs font-medium text-foreground/90">
          {label ?? defaultLabel}
        </span>
      </div>

      <div className="relative aspect-video max-h-72 w-full overflow-hidden bg-black/25">
        <div className="absolute inset-0 paios-media-gen-shimmer" />
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-4">
          <div
            className={cn(
              "size-14 rounded-2xl ring-1",
              isVideo
                ? "bg-violet-500/15 ring-violet-400/30"
                : "bg-fuchsia-500/15 ring-fuchsia-400/30"
            )}
          />
          <p className="text-center text-[11px] text-muted-foreground/80">
            {isVideo
              ? "Video generation bisa 1–5 menit · jangan tutup tab"
              : "Sedang render pixel · biasanya 10–40 detik"}
          </p>
        </div>
      </div>

      <div className="px-3 py-2">
        <div className="h-1 overflow-hidden rounded-full bg-white/5">
          <div
            className={cn(
              "paios-stream-progress h-full rounded-full bg-gradient-to-r",
              isVideo
                ? "from-violet-500 via-fuchsia-500 to-violet-400"
                : "from-fuchsia-500 via-cyan-500 to-fuchsia-400"
            )}
          />
        </div>
      </div>
    </div>
  );
}
