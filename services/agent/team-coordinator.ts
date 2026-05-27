import { buildRealtimeContext } from "@/services/agent/context";
import { runSubAgent } from "@/services/agent/sub-agent";
import { runSynthesizer } from "@/services/agent/team-synthesizer";
import {
  buildTeamPlan,
  getTeamSynthesizer,
  getTeamWorkerAgents,
} from "@/services/agent/team-planner";
import type { AgentMeta, AgentStreamEvent } from "@/types/agent";
import type { AgentPlan } from "@/types/plan";
import type { AgentTeamPlan, TeamAgentState } from "@/types/team";
import type { OpenRouterChatMessage } from "@/types/openrouter";
import type { RunAgentInput } from "@/services/agent/orchestrator";

type TeamContext = {
  lastUser: string;
  plan: AgentPlan;
  memoryBlock: string;
  recalledCount: number;
  timezone: string;
  userLanguage?: string;
  meta: AgentMeta;
  useAgentTeam?: boolean;
};

class TeamEventChannel {
  private queue: AgentStreamEvent[] = [];
  private waiters: Array<() => void> = [];

  push(event: AgentStreamEvent): void {
    this.queue.push(event);
    const resolve = this.waiters.shift();
    resolve?.();
  }

  async next(): Promise<AgentStreamEvent | null> {
    if (this.queue.length > 0) return this.queue.shift()!;
    return new Promise((resolve) => {
      this.waiters.push(() => resolve(this.queue.shift() ?? null));
    });
  }

  drain(): AgentStreamEvent[] {
    return this.queue.splice(0);
  }
}

function patchAgent(
  team: AgentTeamPlan,
  agentId: string,
  patch: Partial<TeamAgentState>
): AgentTeamPlan {
  return {
    ...team,
    agents: team.agents.map((a) =>
      a.id === agentId ? { ...a, ...patch } : a
    ),
  };
}

export async function* runTeamAgent(
  input: RunAgentInput,
  ctx: TeamContext
): AsyncGenerator<AgentStreamEvent> {
  let team: AgentTeamPlan;

  try {
    team = await buildTeamPlan({
      userMessage: ctx.lastUser,
      plan: ctx.plan,
      userLanguage: ctx.userLanguage,
      forceFullTeam: ctx.useAgentTeam,
    });
    team = { ...team, startedAt: new Date().toISOString() };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Gagal menyusun tim agent";
    yield { type: "error", message };
    return;
  }

  yield {
    type: "phase",
    phase: "planning",
    label: "Menyusun tim agent paralel…",
  };

  yield { type: "team_plan", team };

  const channel = new TeamEventChannel();
  const realtime = buildRealtimeContext(ctx.timezone);
  const workers = getTeamWorkerAgents(team);
  let teamSnapshot = team;

  yield {
    type: "phase",
    phase: "tooling",
    label: `Deploy ${workers.length} agent paralel…`,
  };

  for (const worker of workers) {
    teamSnapshot = patchAgent(teamSnapshot, worker.id, {
      status: "running",
      progress: 4,
      statusLabel: "Deploy paralel…",
    });
    const deployed = teamSnapshot.agents.find((a) => a.id === worker.id)!;
    yield {
      type: "team_agent_update",
      agentId: worker.id,
      agent: deployed,
    };
    team = patchAgent(team, worker.id, {
      status: "running",
      progress: 4,
      statusLabel: "Deploy paralel…",
    });
  }

  const workerPromises = workers.map(async (worker) => {
    channel.push({
      type: "team_agent_update",
      agentId: worker.id,
      agent: {
        ...worker,
        status: "running",
        progress: 5,
        statusLabel: "Memulai…",
      },
    });

    try {
      const result = await runSubAgent({
        agent: worker,
        userMessage: ctx.lastUser,
        memoryBlock: ctx.memoryBlock,
        realtime,
        toolContext: {
          timezone: ctx.timezone,
          conversationId: input.conversationId,
        },
        useAgentTeam: ctx.useAgentTeam,
        onProgress: (patch) => {
          teamSnapshot = patchAgent(teamSnapshot, worker.id, patch);
          const updated = teamSnapshot.agents.find((a) => a.id === worker.id);
          if (updated) {
            channel.push({
              type: "team_agent_update",
              agentId: worker.id,
              agent: updated,
            });
          }
        },
      });

      teamSnapshot = patchAgent(teamSnapshot, worker.id, {
        status: "done",
        progress: 100,
        output: result.text,
        toolsUsed: result.toolsUsed,
        statusLabel: `${worker.name} selesai`,
      });
      channel.push({
        type: "team_agent_update",
        agentId: worker.id,
        agent: teamSnapshot.agents.find((a) => a.id === worker.id)!,
      });

      return { worker, result };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Sub-agent failed";
      teamSnapshot = patchAgent(teamSnapshot, worker.id, {
        status: "error",
        progress: 100,
        error: message,
        statusLabel: `${worker.name} error`,
      });
      channel.push({
        type: "team_agent_update",
        agentId: worker.id,
        agent: teamSnapshot.agents.find((a) => a.id === worker.id)!,
      });
      return {
        worker,
        result: {
          text: `[${worker.name} gagal: ${message}]`,
          toolsUsed: [] as string[],
        },
      };
    }
  });

  let workersDone = false;
  const allWorkersPromise = Promise.all(workerPromises);
  const workersDoneSignal = (async () => {
    const results = await allWorkersPromise;
    workersDone = true;
    return results;
  })();

  while (true) {
    const raced = await Promise.race([
      channel.next(),
      workersDoneSignal.then(() => "done" as const),
    ]);

    if (raced === "done") break;

    if (raced) {
      yield raced;
      if (raced.type === "team_agent_update") {
        team = patchAgent(team, raced.agentId, raced.agent);
      }
    }
  }

  for (const leftover of channel.drain()) {
    yield leftover;
    if (leftover.type === "team_agent_update") {
      team = patchAgent(team, leftover.agentId, leftover.agent);
    }
  }

  let workerResults: Awaited<typeof workersDoneSignal>;
  try {
    workerResults = await workersDoneSignal;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Tim agent gagal";
    yield { type: "error", message };
    return;
  }

  const synthesizer = getTeamSynthesizer(team);

  try {
    for await (const event of runSynthesizer({
      userMessage: ctx.lastUser,
      workerResults,
      meta: { ...ctx.meta, plan: ctx.plan },
      team,
      synthesizerId: synthesizer.id,
      workersCount: workers.length,
      useAgentTeam: ctx.useAgentTeam,
      onTeamPatch: (agentId, patch) => {
        team = patchAgent(team, agentId, patch);
        return team;
      },
    })) {
      if (event.type === "team_agent_update") {
        team = patchAgent(team, event.agentId, event.agent);
      }
      yield event;
    }
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Synthesizer gagal";
    console.error("[team] Synthesizer fatal:", message);
    yield { type: "error", message };
  }
}

export function getLastUserMessage(messages: OpenRouterChatMessage[]): string {
  for (let i = messages.length - 1; i >= 0; i--) {
    const msg = messages[i];
    if (msg?.role !== "user" || !msg.content) continue;
    if (typeof msg.content === "string") return msg.content;
    return msg.content
      .filter((p) => p.type === "text")
      .map((p) => p.text)
      .join("\n");
  }
  return "";
}
