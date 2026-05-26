"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  AudioLines,
  Brain,
  Menu,
  MessageSquare,
  Settings,
} from "lucide-react";
import { PaiosLogoMark } from "@/components/brand/paios-logo-mark";
import { SettingsDialog } from "@/components/settings/settings-dialog";
import { useAgent } from "@/components/providers/agent-provider";
import { useShell } from "@/components/providers/shell-provider";
import { Button, buttonVariants } from "@/components/ui/button";
import { PAIOS_VERSION } from "@/lib/paios-version";
import { cn } from "@/lib/utils";

const STATUS = {
  idle: { label: "Online", dot: "bg-emerald-400", pill: "border-emerald-500/15 bg-emerald-500/8" },
  thinking: { label: "Thinking", dot: "bg-amber-400", pill: "border-amber-500/15 bg-amber-500/8" },
  streaming: { label: "Live", dot: "bg-cyan-400", pill: "border-cyan-500/15 bg-cyan-500/8" },
  error: { label: "Error", dot: "bg-red-400", pill: "border-red-500/15 bg-red-500/8" },
} as const;

export function TopBar() {
  const pathname = usePathname();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const { status, activeModelLabel, streamLabel } = useAgent();
  const { toggleSidebar } = useShell();
  const s = STATUS[status];
  const statusText = streamLabel && status !== "idle" ? streamLabel : s.label;
  const onVoice = pathname === "/voice";
  const onMemory = pathname === "/memory";

  return (
    <>
      <header className="safe-top paios-surface relative z-30 flex h-[3.25rem] shrink-0 items-center gap-3 border-b border-white/[0.06] px-3 sm:h-14 sm:px-5">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-9 shrink-0 rounded-xl lg:hidden"
          onClick={toggleSidebar}
          aria-label="Buka menu"
        >
          <Menu className="size-5" />
        </Button>

        <div className="flex min-w-0 flex-1 items-center gap-2.5 sm:gap-3">
          <PaiosLogoMark size="sm" className="hidden shrink-0 sm:flex" />
          <div className="min-w-0">
            <h1 className="truncate text-sm font-semibold tracking-tight sm:text-[15px]">
              {onVoice ? "Voice Mode" : onMemory ? "Memory Hub" : "PAIOS"}
            </h1>
            <p className="truncate text-[11px] text-muted-foreground/80 sm:text-xs">
              {activeModelLabel && !onVoice && !onMemory
                ? activeModelLabel
                : PAIOS_VERSION.fullLabel}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1 sm:gap-1.5">
          {onVoice || onMemory ? (
            <Link
              href="/"
              aria-label="Kembali ke chat"
              className={cn(
                buttonVariants({ variant: "ghost", size: "icon" }),
                "size-9 rounded-xl"
              )}
            >
              <MessageSquare className="size-4" />
            </Link>
          ) : (
            <>
              <Link
                href="/memory"
                aria-label="Memory Hub"
                className={cn(
                  buttonVariants({ variant: "ghost", size: "icon" }),
                  "hidden size-9 rounded-xl sm:inline-flex"
                )}
              >
                <Brain className="size-4" />
              </Link>
              <Link
                href="/voice"
                aria-label="Voice mode"
                className={cn(
                  buttonVariants({ variant: "ghost", size: "icon" }),
                  "size-9 rounded-xl"
                )}
              >
                <AudioLines className="size-4" />
              </Link>
            </>
          )}

          <div
            className={cn(
              "hidden items-center gap-1.5 rounded-full border px-2.5 py-1 sm:flex",
              s.pill
            )}
          >
            <span className={cn("size-1.5 rounded-full", s.dot)} />
            <span className="max-w-[8rem] truncate text-[11px] font-medium">
              {statusText}
            </span>
          </div>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-9 rounded-xl"
            onClick={() => setSettingsOpen(true)}
            aria-label="Pengaturan"
          >
            <Settings className="size-4" />
          </Button>
        </div>
      </header>

      <SettingsDialog open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </>
  );
}
