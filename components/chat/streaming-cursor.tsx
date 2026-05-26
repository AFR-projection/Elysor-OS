"use client";

import { cn } from "@/lib/utils";

type StreamingCursorProps = {
  className?: string;
};

export function StreamingCursor({ className }: StreamingCursorProps) {
  return (
    <span
      className={cn("paios-stream-cursor ml-0.5 inline-block align-middle", className)}
      aria-hidden
    />
  );
}
