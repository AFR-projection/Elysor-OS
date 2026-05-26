"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  deleteConversationApi,
  fetchConversation,
  fetchConversations,
  fetchMemories,
} from "@/lib/conversations-client";
import type { ConversationRecord, StoredMessage } from "@/types/conversation";
import type { LocalChatMessage } from "@/types/chat";
import type { MemoryRecord } from "@/types/memory";
import type { AgentIntent } from "@/types/agent";
import type { AgentPlan } from "@/types/plan";
import type { MessageAttachmentMeta } from "@/types/multimodal";
import type { AgentStructuredResponse } from "@/types/ui-response";

function storedToLocal(message: StoredMessage): LocalChatMessage | null {
  if (message.role !== "user" && message.role !== "assistant") return null;

  const meta =
    message.role === "assistant"
      ? {
          modelUsed: message.modelUsed ?? undefined,
          modelLabel: message.modelLabel ?? undefined,
          intent: (message.intent as AgentIntent) ?? undefined,
          routingReason: message.routingReason ?? undefined,
          memoriesRecalled:
            typeof message.metadata?.memoriesRecalled === "number"
              ? message.metadata.memoriesRecalled
              : undefined,
          toolsUsed: Array.isArray(message.metadata?.toolsUsed)
            ? (message.metadata.toolsUsed as string[])
            : undefined,
          structured:
            message.metadata?.structured &&
            typeof message.metadata.structured === "object"
              ? (message.metadata.structured as AgentStructuredResponse)
              : undefined,
          plan:
            message.metadata?.plan &&
            typeof message.metadata.plan === "object"
              ? (message.metadata.plan as AgentPlan)
              : undefined,
          attachments: Array.isArray(message.metadata?.attachments)
            ? (message.metadata.attachments as MessageAttachmentMeta[])
            : undefined,
          generatedMedia: Array.isArray(message.metadata?.generatedMedia)
            ? (message.metadata.generatedMedia as import("@/types/media").GeneratedMediaItem[])
            : undefined,
        }
      : undefined;

  return {
    id: message.id,
    role: message.role,
    content: message.content,
    createdAt: new Date(message.createdAt),
    meta,
  };
}

type ConversationContextValue = {
  conversations: ConversationRecord[];
  activeConversationId: string | null;
  messages: LocalChatMessage[];
  setMessages: React.Dispatch<React.SetStateAction<LocalChatMessage[]>>;
  memories: MemoryRecord[];
  memoryTotal: number;
  isLoadingList: boolean;
  isLoadingChat: boolean;
  dbAvailable: boolean;
  selectConversation: (id: string) => Promise<void>;
  startNewChat: () => void;
  setActiveConversationId: (id: string | null) => void;
  refreshConversations: () => Promise<void>;
  refreshMemories: () => Promise<void>;
  removeConversation: (id: string) => Promise<void>;
};

const ConversationContext = createContext<ConversationContextValue | null>(
  null
);

export function ConversationProvider({ children }: { children: ReactNode }) {
  const [conversations, setConversations] = useState<ConversationRecord[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<
    string | null
  >(null);
  const [messages, setMessages] = useState<LocalChatMessage[]>([]);
  const [memories, setMemories] = useState<MemoryRecord[]>([]);
  const [memoryTotal, setMemoryTotal] = useState(0);
  const [isLoadingList, setIsLoadingList] = useState(true);
  const [isLoadingChat, setIsLoadingChat] = useState(false);
  const [dbAvailable, setDbAvailable] = useState(true);

  const refreshConversations = useCallback(async () => {
    try {
      const list = await fetchConversations();
      setConversations(list);
      setDbAvailable(true);
    } catch {
      setDbAvailable(false);
    }
  }, []);

  const refreshMemories = useCallback(async () => {
    try {
      const { memories: list, total } = await fetchMemories();
      setMemories(list);
      setMemoryTotal(total);
      setDbAvailable(true);
    } catch {
      setDbAvailable(false);
    }
  }, []);

  useEffect(() => {
    void (async () => {
      setIsLoadingList(true);
      await Promise.all([refreshConversations(), refreshMemories()]);
      setIsLoadingList(false);
    })();
  }, [refreshConversations, refreshMemories]);

  const selectConversation = useCallback(async (id: string) => {
    setIsLoadingChat(true);
    setActiveConversationId(id);
    try {
      const conv = await fetchConversation(id);
      const local = conv.messages
        .map(storedToLocal)
        .filter((m): m is LocalChatMessage => m !== null);
      setMessages(local);
    } catch {
      setMessages([]);
    } finally {
      setIsLoadingChat(false);
    }
  }, []);

  const startNewChat = useCallback(() => {
    setActiveConversationId(null);
    setMessages([]);
  }, []);

  const removeConversation = useCallback(
    async (id: string) => {
      await deleteConversationApi(id);
      if (activeConversationId === id) {
        startNewChat();
      }
      await Promise.all([refreshConversations(), refreshMemories()]);
    },
    [activeConversationId, refreshConversations, refreshMemories, startNewChat]
  );

  const value = useMemo(
    () => ({
      conversations,
      activeConversationId,
      messages,
      setMessages,
      memories,
      memoryTotal,
      isLoadingList,
      isLoadingChat,
      dbAvailable,
      selectConversation,
      startNewChat,
      setActiveConversationId,
      refreshConversations,
      refreshMemories,
      removeConversation,
    }),
    [
      conversations,
      activeConversationId,
      messages,
      memories,
      memoryTotal,
      isLoadingList,
      isLoadingChat,
      dbAvailable,
      selectConversation,
      startNewChat,
      refreshConversations,
      refreshMemories,
      removeConversation,
    ]
  );

  return (
    <ConversationContext.Provider value={value}>
      {children}
    </ConversationContext.Provider>
  );
}

export function useConversation() {
  const ctx = useContext(ConversationContext);
  if (!ctx) {
    throw new Error("useConversation must be used within ConversationProvider");
  }
  return ctx;
}
