"use client";

import { useEffect, useRef, useState } from "react";

type UseTypewriterOptions = {
  active?: boolean;
  /** ms per character at normal speed */
  charDelay?: number;
  /** backlog above this uses faster catch-up */
  catchUpThreshold?: number;
};

export function useTypewriter(
  target: string,
  {
    active = false,
    charDelay = 14,
    catchUpThreshold = 60,
  }: UseTypewriterOptions = {}
) {
  const [displayed, setDisplayed] = useState(() => (active ? "" : target));
  const lenRef = useRef(active ? 0 : target.length);
  const targetRef = useRef(target);
  const activeRef = useRef(active);
  const rafRef = useRef<number | null>(null);
  const lastTickRef = useRef(0);

  targetRef.current = target;
  activeRef.current = active;

  useEffect(() => {
    if (!active) {
      lenRef.current = target.length;
      setDisplayed((prev) => (prev === target ? prev : target));
      return;
    }

    if (target === "" && lenRef.current > 0) {
      lenRef.current = 0;
      setDisplayed((prev) => (prev === "" ? prev : ""));
    }
  }, [active, target]);

  useEffect(() => {
    if (!active) {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      return;
    }

    lastTickRef.current = performance.now();

    const tick = (now: number) => {
      if (!activeRef.current) return;

      const tgt = targetRef.current;
      const current = lenRef.current;

      if (current < tgt.length) {
        const backlog = tgt.length - current;
        const delay =
          backlog > catchUpThreshold * 2
            ? 3
            : backlog > catchUpThreshold
              ? 6
              : charDelay;

        if (now - lastTickRef.current >= delay) {
          const step =
            backlog > catchUpThreshold * 2
              ? Math.min(5, backlog)
              : backlog > catchUpThreshold
                ? Math.min(2, backlog)
                : 1;
          lenRef.current = Math.min(current + step, tgt.length);
          setDisplayed(tgt.slice(0, lenRef.current));
          lastTickRef.current = now;
        }
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [active, charDelay, catchUpThreshold]);

  const progress =
    target.length > 0 ? Math.min(1, displayed.length / target.length) : 0;
  const isTyping = active && displayed.length < target.length;

  return { displayed, progress, isTyping };
}
