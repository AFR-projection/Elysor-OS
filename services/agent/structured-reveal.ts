import type { AgentStreamEvent } from "@/types/agent";
import type { AgentStructuredResponse } from "@/types/ui-response";

const BLOCK_REVEAL_MS = 420;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function* revealStructured(
  parsed: AgentStructuredResponse
): AsyncGenerator<AgentStreamEvent> {
  const { blocks } = parsed.ui;
  if (blocks.length === 0 && parsed.actions.length === 0) return;

  yield {
    type: "phase",
    phase: "rendering",
    label: "Membangun tampilan visual…",
  };

  const revealed: AgentStructuredResponse = {
    ...parsed,
    ui: { ...parsed.ui, blocks: [] },
    actions: [],
  };

  yield {
    type: "structured_partial",
    structured: revealed,
    blockProgress: { current: 0, total: blocks.length },
  };

  await sleep(BLOCK_REVEAL_MS);

  for (let i = 0; i < blocks.length; i++) {
    revealed.ui = {
      ...revealed.ui,
      blocks: blocks.slice(0, i + 1),
    };
    yield {
      type: "structured_partial",
      structured: { ...revealed },
      blockProgress: { current: i + 1, total: blocks.length },
    };
    if (i < blocks.length - 1) {
      await sleep(BLOCK_REVEAL_MS);
    }
  }

  if (parsed.actions.length > 0) {
    await sleep(BLOCK_REVEAL_MS / 2);
    yield {
      type: "structured_partial",
      structured: { ...parsed },
      blockProgress: { current: blocks.length, total: blocks.length },
    };
  }
}
