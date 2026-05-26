import type { AgentStreamEvent } from "@/types/agent";
import type { MessageAttachment } from "@/types/multimodal";
import type { OpenRouterChatMessage } from "@/types/openrouter";
import { resolveTimezone } from "@/lib/timezone";

/** Process one SSE event per animation frame to avoid React update depth errors. */
const EVENTS_PER_FRAME = 1;

function createStreamEventQueue(onEvent: (event: AgentStreamEvent) => void) {
  const queue: AgentStreamEvent[] = [];
  let rafId: number | null = null;
  let resolveIdle: (() => void) | null = null;
  let idlePromise: Promise<void> | null = null;

  const maybeResolveIdle = () => {
    if (queue.length === 0 && rafId === null && resolveIdle) {
      resolveIdle();
      resolveIdle = null;
      idlePromise = null;
    }
  };

  const schedulePump = () => {
    if (rafId !== null || queue.length === 0) return;
    rafId = requestAnimationFrame(pump);
  };

  const dispatch = (events: AgentStreamEvent[]) => {
    for (const event of events) {
      try {
        onEvent(event);
      } catch (error) {
        console.error("[stream] event handler error:", error);
      }
    }
  };

  const pump = () => {
    rafId = null;
    if (queue.length === 0) {
      maybeResolveIdle();
      return;
    }

    dispatch(queue.splice(0, EVENTS_PER_FRAME));
    schedulePump();
    if (queue.length === 0 && rafId === null) {
      maybeResolveIdle();
    }
  };

  const push = (event: AgentStreamEvent) => {
    queue.push(event);
    schedulePump();
  };

  const flushNow = () => {
    if (rafId !== null) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
    schedulePump();
  };

  const waitForIdle = () => {
    if (queue.length === 0 && rafId === null) return Promise.resolve();
    if (!idlePromise) {
      idlePromise = new Promise<void>((resolve) => {
        resolveIdle = resolve;
      });
    }
    return idlePromise;
  };

  return { push, flushNow, waitForIdle };
}

export async function streamAgentChat(
  messages: OpenRouterChatMessage[],
  onEvent: (event: AgentStreamEvent) => void,
  options?: {
    conversationId?: string | null;
    timezone?: string;
    attachments?: MessageAttachment[];
    signal?: AbortSignal;
  }
): Promise<void> {
  const browserTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const timezone = resolveTimezone(options?.timezone, browserTz);

  const response = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      messages,
      attachments: options?.attachments,
      timezone,
      conversationId: options?.conversationId ?? null,
    }),
    signal: options?.signal,
  });

  if (!response.ok) {
    let message = `Chat request failed (${response.status})`;
    try {
      const body = (await response.json()) as { error?: string };
      if (body.error) message = body.error;
    } catch {
      // use default message
    }
    throw new Error(message);
  }

  const reader = response.body?.getReader();
  if (!reader) throw new Error("No response stream from agent");

  const decoder = new TextDecoder();
  let buffer = "";
  const queue = createStreamEventQueue(onEvent);

  try {
    while (true) {
      if (options?.signal?.aborted) {
        await reader.cancel();
        throw new DOMException("Aborted", "AbortError");
      }

      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const parts = buffer.split("\n\n");
      buffer = parts.pop() ?? "";

      for (const part of parts) {
        const line = part.trim();
        if (!line.startsWith("data:")) continue;

        const json = line.slice(5).trim();
        if (!json) continue;

        try {
          queue.push(JSON.parse(json) as AgentStreamEvent);
        } catch {
          // skip malformed events
        }
      }
    }
  } finally {
    reader.releaseLock();
    queue.flushNow();
    await queue.waitForIdle();
  }
}
