import { AgentProvider } from "@/components/providers/agent-provider";
import { ConversationProvider } from "@/components/providers/conversation-provider";
import { SettingsProvider } from "@/components/providers/settings-provider";
import { ShellProvider } from "@/components/providers/shell-provider";
import { ToastProvider } from "@/components/providers/toast-provider";
import { Sidebar } from "@/components/layout/sidebar";
import { TopBar } from "@/components/layout/top-bar";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <SettingsProvider>
        <ConversationProvider>
          <AgentProvider>
            <ShellProvider>
              <div className="paios-app-shell flex w-full overflow-hidden">
                <Sidebar />
                <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
                  <TopBar />
                  <main className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
                    {children}
                  </main>
                </div>
              </div>
            </ShellProvider>
          </AgentProvider>
        </ConversationProvider>
      </SettingsProvider>
    </ToastProvider>
  );
}
