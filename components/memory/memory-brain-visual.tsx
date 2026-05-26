"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

const VIDEO_SRC = "/memory/visual-memory.mp4";

type MemoryBrainVisualProps = {
  activity?: number;
  className?: string;
};

export function MemoryBrainVisual({
  activity = 0.25,
  className,
}: MemoryBrainVisualProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.muted = true;
    video.playsInline = true;
    video.loop = true;

    const play = () => {
      void video.play().catch(() => {
        /* autoplay blocked until user gesture — acceptable */
      });
    };

    play();
    video.addEventListener("loadeddata", play);
    return () => video.removeEventListener("loadeddata", play);
  }, []);

  const glow = 0.35 + activity * 0.45;
  const brightness = 1 + activity * 0.12;

  return (
    <div
      className={cn(
        "relative aspect-square w-full max-w-[min(100%,440px)] shrink-0",
        className
      )}
    >
      <div
        className="pointer-events-none absolute inset-[8%] rounded-full opacity-80 blur-3xl transition-opacity duration-700"
        style={{
          background:
            "radial-gradient(circle, oklch(0.62 0.24 320 / 55%), oklch(0.55 0.18 195 / 25%), transparent 70%)",
          opacity: glow,
        }}
      />

      <div className="relative size-full overflow-hidden rounded-[2rem] ring-1 ring-fuchsia-400/20 shadow-[0_0_80px_-20px_oklch(0.62_0.22_320/50%)] sm:rounded-[2.5rem]">
        <video
          ref={videoRef}
          src={VIDEO_SRC}
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          aria-label="Visual neural memory — otak AI hidup"
          className="size-full object-cover object-center transition-[filter] duration-500"
          style={{
            filter: `brightness(${brightness}) saturate(1.08) contrast(1.04)`,
          }}
        />

        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[oklch(0.09_0.025_280)] via-transparent to-[oklch(0.12_0.03_290/35%)]" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/4 bg-gradient-to-t from-[oklch(0.09_0.025_280)] to-transparent" />
      </div>

      <div className="pointer-events-none absolute inset-x-[10%] bottom-[6%] h-px bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent" />
    </div>
  );
}
