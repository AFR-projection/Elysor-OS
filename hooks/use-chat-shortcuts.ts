"use client";

import { useEffect } from "react";

type ChatShortcutsOptions = {
  onNewChat: () => void;
  onStop: () => void;
  isLoading: boolean;
};

export function useChatShortcuts({
  onNewChat,
  onStop,
  isLoading,
}: ChatShortcutsOptions) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "n") {
        e.preventDefault();
        onNewChat();
      }
      if (e.key === "Escape" && isLoading) {
        e.preventDefault();
        onStop();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onNewChat, onStop, isLoading]);
}
