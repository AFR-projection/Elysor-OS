"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Brain,
  Download,
  History,
  Loader2,
  MessageSquarePlus,
  Search,
  Settings,
  Trash2,
  X,
} from "lucide-react";
import { SettingsDialog } from "@/components/settings/settings-dialog";
import { useConversation } from "@/components/providers/conversation-provider";
import { useShell } from "@/components/providers/shell-provider";
import { useToast } from "@/components/providers/toast-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  downloadTextFile,
  exportChatAsMarkdown,
} from "@/lib/export-chat";
import { PAIOS_VERSION } from "@/lib/paios-version";
import { useHasMounted } from "@/hooks/use-has-mounted";
import { cn } from "@/lib/utils";

export function Sidebar() {
  const [search, setSearch] = useState("");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const mounted = useHasMounted();
  const { toast } = useToast();
  const { sidebarOpen, closeSidebar, isMobile } = useShell();
  const {
    conversations,
    activeConversationId,
    messages,
    memories,
    memoryTotal,
    isLoadingList,
    dbAvailable,
    startNewChat,
    selectConversation,
    removeConversation,
  } = useConversation();

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return conversations;
    return conversations.filter((c) => c.title.toLowerCase().includes(q));
  }, [conversations, search]);

  const activeTitle =
    conversations.find((c) => c.id === activeConversationId)?.title ??
    "PAIOS Chat";

  const handleDeleteConversation = async (id: string) => {
    try {
      await removeConversation(id);
      toast("Chat dihapus", "default");
    } catch {
      toast("Gagal menghapus chat", "error");
    }
  };

  const handleExport = () => {
    if (messages.length === 0) {
      toast("Tidak ada pesan untuk diekspor", "error");
      return;
    }
    const md = exportChatAsMarkdown(messages, activeTitle);
    downloadTextFile(md, `${activeTitle.slice(0, 40).replace(/\s+/g, "-")}.md`);
    toast("Chat diekspor", "success");
  };

  const handleNewChat = () => {
    startNewChat();
    if (isMobile) closeSidebar();
  };

  const handleSelectConversation = (id: string) => {
    void selectConversation(id);
    if (isMobile) closeSidebar();
  };

  return (
    <>
      {sidebarOpen ? (
        <button
          type="button"
          aria-label="Tutup menu"
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity lg:hidden"
          onClick={closeSidebar}
        />
      ) : null}

      <aside
        className={cn(
          "paios-surface fixed inset-y-0 left-0 z-50 flex w-[min(100vw,300px)] max-w-[88vw] flex-col shadow-2xl transition-transform duration-300 ease-out lg:static lg:z-auto lg:w-[272px] lg:max-w-none lg:translate-x-0 lg:shadow-none",
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div className="safe-top flex items-center justify-between border-b border-white/[0.06] px-4 py-3 lg:hidden">
          <span className="text-sm font-semibold tracking-tight">PAIOS</span>
          <button
            type="button"
            onClick={closeSidebar}
            className="rounded-lg p-2 text-muted-foreground hover:bg-white/[0.05]"
            aria-label="Tutup sidebar"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="space-y-2.5 p-3 sm:p-4">
          <Button
            variant="outline"
            className="paios-btn-press h-11 w-full justify-start gap-2.5 rounded-xl border-cyan-500/20 bg-cyan-500/[0.06] text-sm font-medium hover:bg-cyan-500/10"
            onClick={handleNewChat}
          >
            <MessageSquarePlus className="size-4 text-cyan-300" />
            Chat baru
          </Button>
          <div className="relative">
            <Search className="absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-muted-foreground/70" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari chat…"
              className="h-10 border-0 bg-white/[0.03] pl-9 text-sm ring-white/[0.08] placeholder:text-muted-foreground/50"
            />
          </div>
        </div>

        <div className="flex min-h-0 flex-1 flex-col px-1">
          <p className="paios-label flex items-center gap-2 px-3 pb-2">
            <History className="size-3.5 opacity-70" />
            Riwayat
          </p>

          <div className="paios-scrollbar min-h-0 flex-1 overflow-y-auto overscroll-contain px-2 pb-2">
            {!mounted ? (
              <div className="flex justify-center py-12">
                <Loader2 className="size-5 animate-spin text-muted-foreground" />
              </div>
            ) : !dbAvailable ? (
              <p className="px-3 py-2 text-xs leading-relaxed text-amber-200/90">
                Database offline. Jalankan{" "}
                <code className="rounded bg-black/30 px-1 py-0.5 text-[10px]">
                  npm run db:migrate
                </code>
              </p>
            ) : isLoadingList ? (
              <div className="flex justify-center py-12">
                <Loader2 className="size-5 animate-spin text-muted-foreground" />
              </div>
            ) : filtered.length === 0 ? (
              <p className="px-3 py-6 text-center text-xs text-muted-foreground/80">
                {search ? "Tidak ada hasil." : "Belum ada percakapan."}
              </p>
            ) : (
              <ul className="space-y-1">
                {filtered.map((conv) => (
                  <li key={conv.id} className="group relative">
                    <button
                      type="button"
                      onClick={() => handleSelectConversation(conv.id)}
                      className={cn(
                        "min-h-[44px] w-full rounded-xl px-3 py-2.5 pr-10 text-left text-sm transition-colors",
                        activeConversationId === conv.id
                          ? "bg-white/[0.07] text-foreground ring-1 ring-cyan-500/20"
                          : "text-muted-foreground hover:bg-white/[0.04] hover:text-foreground"
                      )}
                    >
                      <span className="line-clamp-2 font-medium leading-snug">
                        {conv.title}
                      </span>
                    </button>
                    <button
                      type="button"
                      aria-label="Hapus chat"
                      onClick={() => void handleDeleteConversation(conv.id)}
                      className="absolute top-1/2 right-1.5 -translate-y-1/2 rounded-lg p-2 text-muted-foreground opacity-100 transition-all hover:bg-red-500/10 hover:text-red-300 sm:opacity-0 sm:group-hover:opacity-100"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="safe-bottom shrink-0 space-y-3 border-t border-white/[0.06] p-3 sm:p-4">
          <Link
            href="/memory"
            onClick={() => {
              if (isMobile) closeSidebar();
            }}
            className="paios-panel flex items-center justify-between gap-3 px-3 py-2.5 transition-colors hover:bg-white/[0.04]"
          >
            <span className="flex min-w-0 items-center gap-2.5">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-violet-500/10 ring-1 ring-violet-400/15">
                <Brain className="size-4 text-violet-300" />
              </span>
              <span className="min-w-0">
                <span className="block text-xs font-semibold text-foreground/90">
                  Memory Hub
                </span>
                <span className="paios-meta">
                  {mounted ? `${memoryTotal} memori` : "Memuat…"} · Memory {PAIOS_VERSION.memory}
                </span>
              </span>
            </span>
            <span className="text-xs text-muted-foreground">→</span>
          </Link>

          {mounted && memories.length > 0 ? (
            <p className="paios-meta line-clamp-2 px-1">
              Terakhir: <span className="text-violet-200/90">{memories[0]?.key}</span>
            </p>
          ) : (
            <p className="paios-meta px-1">
              PAIOS belajar preferensi kamu dari setiap chat.
            </p>
          )}

          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-10 gap-1.5 rounded-xl border-white/[0.08] bg-white/[0.02] text-xs"
              onClick={handleExport}
            >
              <Download className="size-3.5" />
              Export
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-10 gap-1.5 rounded-xl border-white/[0.08] bg-white/[0.02] text-xs"
              onClick={() => {
                setSettingsOpen(true);
                if (isMobile) closeSidebar();
              }}
            >
              <Settings className="size-3.5" />
              Settings
            </Button>
          </div>
        </div>
      </aside>

      <SettingsDialog open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </>
  );
}
