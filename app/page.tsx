import { AppShell } from "@/components/layout/app-shell";
import { ChatPanel } from "@/components/chat/chat-panel";

export default function Home() {
  return (
    <AppShell>
      <ChatPanel />
    </AppShell>
  );
}
