"use client";

import { Loader2, Wrench } from "lucide-react";
import { cn } from "@/lib/utils";

const TOOL_LABELS: Record<string, string> = {
  web_search: "Mencari di web…",
  memory_search: "Mencari memori…",
  memory_create: "Menyimpan memori…",
  memory_update: "Memperbarui memori…",
  memory_delete: "Menghapus memori…",
  get_datetime: "Membaca waktu…",
  database_stats: "Query database…",
  workspace_list: "Scan folder workspace…",
  workspace_read: "Membaca file workspace…",
  image_generate: "Generate gambar AI…",
  video_generate: "Generate video AI (Veo)…",
  file_export: "Membuat file (PDF/Excel)…",
};

export function ToolActivity({
  toolName,
  status,
  summary,
}: {
  toolName?: string;
  status?: "running" | "done" | "error";
  summary?: string;
}) {
  if (!toolName) return null;

  const label = TOOL_LABELS[toolName] ?? `Menjalankan ${toolName}…`;

  return (
    <div
      className={cn(
        "mb-3 flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium",
        status === "error"
          ? "bg-red-500/10 text-red-300 ring-1 ring-red-500/20"
          : status === "done"
            ? "bg-emerald-500/10 text-emerald-300 ring-1 ring-emerald-500/20"
            : "bg-cyan-500/10 text-cyan-300 ring-1 ring-cyan-500/20"
      )}
    >
      {status === "running" ? (
        <Loader2 className="size-3.5 shrink-0 animate-spin" />
      ) : (
        <Wrench className="size-3.5 shrink-0" />
      )}
      <span>
        {status === "done" ? `✓ ${label.replace("…", "")}` : label}
        {summary && status !== "running" ? ` · ${summary}` : null}
      </span>
    </div>
  );
}
