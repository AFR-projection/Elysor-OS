"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { AgentIntent, StreamPhase } from "@/types/agent";

export type AgentStatus = "idle" | "thinking" | "streaming" | "error";

type AgentState = {
  status: AgentStatus;
  activeModel: string | null;
  activeModelLabel: string | null;
  routingReason: string | null;
  intent: AgentIntent | null;
  streamPhase: StreamPhase | null;
  streamLabel: string | null;
};

type AgentContextValue = AgentState & {
  setAgentState: (state: Partial<AgentState>) => void;
  resetAgentState: () => void;
};

const AgentContext = createContext<AgentContextValue | null>(null);

const initialState: AgentState = {
  status: "idle",
  activeModel: null,
  activeModelLabel: null,
  routingReason: null,
  intent: null,
  streamPhase: null,
  streamLabel: null,
};

export function AgentProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AgentState>(initialState);

  const setAgentState = useCallback((patch: Partial<AgentState>) => {
    setState((prev) => ({ ...prev, ...patch }));
  }, []);

  const resetAgentState = useCallback(() => {
    setState(initialState);
  }, []);

  const value = useMemo(
    () => ({
      ...state,
      setAgentState,
      resetAgentState,
    }),
    [state, setAgentState, resetAgentState]
  );

  return (
    <AgentContext.Provider value={value}>{children}</AgentContext.Provider>
  );
}

export function useAgent() {
  const ctx = useContext(AgentContext);
  if (!ctx) {
    throw new Error("useAgent must be used within AgentProvider");
  }
  return ctx;
}
