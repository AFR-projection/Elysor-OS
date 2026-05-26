"use client";

import Link from "next/link";
import { ArrowLeft, Brain } from "lucide-react";
import { MemoryBrainVisual } from "@/components/memory/memory-brain-visual";
import { MemoryManager } from "@/components/memory/memory-manager";
import { MemorySettingsPanel } from "@/components/memory/memory-settings-panel";
import { useConversation } from "@/components/providers/conversation-provider";
import { buttonVariants } from "@/components/ui/button";
import { useMemoryManager } from "@/hooks/use-memory-manager";
import { useMemoryPreferences } from "@/hooks/use-memory-preferences";
import { cn } from "@/lib/utils";

export function MemoryHubPanel() {
  const { refreshMemories } = useConversation();
  const { prefs, updatePrefs } = useMemoryPreferences();

  const manager = useMemoryManager({
    prefs,
    onChanged: () => void refreshMemories(),
  });

  const activity =
    manager.loading ? 0.85 : manager.search.trim() ? 0.65 : 0.25;

  return (
    <div className="paios-memory-mode relative flex h-full min-h-0 flex-1 flex-col overflow-hidden">
      <div className="safe-top relative z-10 flex shrink-0 items-center justify-between border-b border-white/5 bg-background/40 px-4 py-3 backdrop-blur-md">
        <Link
          href="/"
          className={cn(
            buttonVariants({ variant: "ghost", size: "sm" }),
            "gap-2 rounded-xl text-muted-foreground"
          )}
        >
          <ArrowLeft className="size-4" />
          Chat
        </Link>
        <div className="flex flex-col items-center gap-0.5">
          <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-fuchsia-300/90">
            <Brain className="size-3.5" />
            Neural Memory
          </span>
          <span className="flex items-center gap-1.5 text-[10px] text-emerald-300/90">
            <span className="size-1.5 animate-pulse rounded-full bg-emerald-400" />
            v4.1 · {manager.total} synapse{manager.total === 1 ? "" : "s"}
          </span>
        </div>
        <div className="w-[72px]" />
      </div>

      <div className="paios-scrollbar relative z-[1] min-h-0 flex-1 overflow-y-auto overscroll-contain">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6 lg:flex-row lg:gap-8 lg:px-8 lg:py-8">
          <section className="flex flex-col items-center lg:w-[42%] lg:shrink-0">
            <MemoryBrainVisual activity={activity} />
            <p className="mt-4 max-w-sm text-center text-sm font-medium text-foreground/90">
              {manager.total === 0
                ? "Neural core siap — mulai chat dan PAIOS akan belajar tentang kamu"
                : "Neural core aktif — memori hidup dan siap di-recall saat chat"}
            </p>
            <p className="mt-2 text-center text-[11px] text-muted-foreground/70">
              Neon pgvector recall · pin untuk prioritas
            </p>

            <div className="mt-6 w-full lg:hidden">
              <div className="rounded-2xl bg-white/[0.03] p-4 ring-1 ring-white/8 backdrop-blur-sm">
                <MemorySettingsPanel
                  stats={manager.stats}
                  total={manager.total}
                  prefs={prefs}
                  onPrefsChange={updatePrefs}
                />
              </div>
            </div>
          </section>

          <section className="flex min-h-[420px] min-w-0 flex-1 flex-col lg:min-h-[520px]">
            <div className="grid min-h-0 flex-1 gap-6 lg:grid-cols-[1fr_280px]">
              <div className="flex min-h-[360px] flex-col rounded-2xl bg-white/[0.03] p-4 ring-1 ring-white/8 backdrop-blur-sm sm:min-h-[420px] sm:p-5">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <h2 className="text-sm font-semibold">Daftar Memori</h2>
                  <span className="rounded-full bg-violet-500/15 px-2 py-0.5 text-[10px] text-violet-200">
                    CRUD · semantic search
                  </span>
                </div>
                <MemoryManager manager={manager} />
              </div>

              <div className="hidden min-h-0 rounded-2xl bg-white/[0.03] p-4 ring-1 ring-white/8 backdrop-blur-sm lg:block">
                <MemorySettingsPanel
                  stats={manager.stats}
                  total={manager.total}
                  prefs={prefs}
                  onPrefsChange={updatePrefs}
                />
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
