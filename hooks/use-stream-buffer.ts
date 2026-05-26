"use client";

import { useCallback, useEffect, useRef } from "react";

/**
 * Batches rapid SSE deltas into one React update per animation frame.
 */
export function useStreamBuffer(onFlush: (text: string) => void) {
  const pendingRef = useRef("");
  const rafRef = useRef<number | null>(null);
  const onFlushRef = useRef(onFlush);

  useEffect(() => {
    onFlushRef.current = onFlush;
  }, [onFlush]);

  const flushNow = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    const batch = pendingRef.current;
    pendingRef.current = "";
    if (batch) onFlushRef.current(batch);
  }, []);

  const push = useCallback((text: string) => {
    if (!text) return;
    pendingRef.current += text;
    if (rafRef.current !== null) return;

    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      const batch = pendingRef.current;
      pendingRef.current = "";
      if (batch) onFlushRef.current(batch);
    });
  }, []);

  useEffect(() => {
    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  return { push, flushNow };
}
