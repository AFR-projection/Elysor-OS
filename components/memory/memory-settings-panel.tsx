"use client";

import { useCallback, useEffect, useState } from "react";
import { Brain, Database, RefreshCw, Sparkles, Zap } from "lucide-react";
import {
  backfillEmbeddingsApi,
  fetchMemoryVectorStats,
  type MemoryVectorStats,
} from "@/lib/memories-client";
import type { MemoryPreferences } from "@/lib/memory-preferences";
import { fetchServerMemoryPrefs, updateServerMemoryPrefs } from "@/lib/memories-client";
import { cn } from "@/lib/utils";
import { MEMORY_TYPE_LABELS, type MemoryType } from "@/types/memory";

type MemorySettingsPanelProps = {
  stats: {
    pinned: number;
    byType: Record<MemoryType, number>;
  };
  total: number;
  prefs: MemoryPreferences;
  onPrefsChange: (patch: Partial<MemoryPreferences>) => void;
};

export function MemorySettingsPanel({
  stats,
  total,
  prefs,
  onPrefsChange,
}: MemorySettingsPanelProps) {
  const [vectorStats, setVectorStats] = useState<MemoryVectorStats | null>(
    null
  );
  const [backfilling, setBackfilling] = useState(false);
  const [hybridAlpha, setHybridAlpha] = useState<number | null>(null);

  const loadVectorStats = useCallback(async () => {
    try {
      const data = await fetchMemoryVectorStats();
      setVectorStats(data);
    } catch {
      setVectorStats(null);
    }
  }, []);

  useEffect(() => {
    void (async () => {
      await loadVectorStats();
      try {
        const { prefs } = await fetchServerMemoryPrefs();
        setHybridAlpha(typeof (prefs as any).hybridAlpha === "number" ? (prefs as any).hybridAlpha : 0.62);
      } catch {
        setHybridAlpha(0.62);
      }
    })();
  }, [loadVectorStats, total]);

  const recallLabel =
    vectorStats?.recall === "pgvector" ? "pgvector ANN" : "Keyword";

  const handleBackfill = async () => {
    setBackfilling(true);
    try {
      let done = false;
      while (!done) {
        const { result } = await backfillEmbeddingsApi({ batchSize: 50 });
        done = result.done;
      }
      await loadVectorStats();
    } finally {
      setBackfilling(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Sparkles className="size-4 text-fuchsia-400" />
        <h3 className="text-sm font-semibold">Neural Engine · v4.1</h3>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        <StatCard label="Total" value={String(total)} accent="violet" />
        <StatCard label="Pinned" value={String(stats.pinned)} accent="amber" />
        <StatCard
          label="Recall"
          value={recallLabel}
          accent="cyan"
          className="col-span-2 sm:col-span-1"
        />
      </div>

      {vectorStats && (
        <div className="rounded-xl bg-white/[0.03] p-3 ring-1 ring-white/6">
          <div className="mb-2 flex items-center justify-between gap-2">
            <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/80">
              <Database className="size-3" />
              Neon pgvector
            </p>
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-[9px] font-medium",
                vectorStats.pgvector.enabled
                  ? "bg-emerald-500/15 text-emerald-200"
                  : "bg-amber-500/15 text-amber-200"
              )}
            >
              {vectorStats.pgvector.enabled ? "Aktif" : "Belum setup"}
            </span>
          </div>
          <div className="space-y-1 text-xs text-muted-foreground">
            <div className="flex justify-between">
              <span>Embeddings</span>
              <span className="font-medium text-violet-200/90">
                {vectorStats.postgres.withEmbedding}/{vectorStats.postgres.total}
              </span>
            </div>
            {vectorStats.postgres.withoutEmbedding > 0 && (
              <div className="flex justify-between">
                <span>Belum di-embed</span>
                <span className="font-medium text-amber-200/90">
                  {vectorStats.postgres.withoutEmbedding}
                </span>
              </div>
            )}
          </div>
          {vectorStats.postgres.withoutEmbedding > 0 && (
            <button
              type="button"
              onClick={() => void handleBackfill()}
              disabled={backfilling}
              className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg bg-cyan-500/10 px-3 py-2 text-[11px] font-medium text-cyan-200 ring-1 ring-cyan-400/20 transition-colors hover:bg-cyan-500/15 disabled:opacity-50"
            >
              <RefreshCw
                className={cn("size-3.5", backfilling && "animate-spin")}
              />
              {backfilling ? "Backfill…" : "Backfill embeddings"}
            </button>
          )}
        </div>
      )}

      <div className="rounded-xl bg-white/[0.03] p-3 ring-1 ring-white/6">
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/80">
          Distribusi memori
        </p>
        <div className="space-y-1.5">
          {(Object.keys(stats.byType) as MemoryType[]).map((type) => (
            <div key={type} className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">
                {MEMORY_TYPE_LABELS[type]}
              </span>
              <span className="font-medium text-violet-200/90">
                {stats.byType[type]}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-3 rounded-xl bg-white/[0.03] p-3 ring-1 ring-white/6">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/80">
          Pengaturan memori
        </p>

        <SettingToggle
          icon={<Brain className="size-3.5 text-fuchsia-300" />}
          label="Auto-simpan dari chat"
          description="PAIOS mengekstrak fakta penting setelah balasan AI"
          checked={prefs.autoLearnFromChat}
          onChange={(checked) => onPrefsChange({ autoLearnFromChat: checked })}
        />

        {hybridAlpha !== null && (
          <div className="space-y-2 pt-1">
            <label className="text-xs font-medium text-muted-foreground">
              Hybrid balance (Keyword ↔ Vector)
            </label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={hybridAlpha}
                onChange={(e) => setHybridAlpha(Number(e.target.value))}
                onMouseUp={async () => {
                  try {
                    await updateServerMemoryPrefs({ hybridAlpha: hybridAlpha! });
                  } catch {
                    // ignore
                  }
                }}
                className="flex-1"
              />
              <span className="w-12 text-right text-xs tabular-nums">
                {Math.round((hybridAlpha ?? 0.62) * 100)}%
              </span>
            </div>
            <p className="text-[10px] text-muted-foreground/70">
              {hybridAlpha < 0.5
                ? "Fokus keyword (lebih presisi untuk istilah spesifik)"
                : hybridAlpha > 0.5
                  ? "Fokus semantic vector (lebih kontekstual dan fuzzy match)"
                  : "Seimbang antara keyword & vector"}
            </p>
          </div>
        )}

        <SettingToggle
          icon={<Zap className="size-3.5 text-cyan-300" />}
          label="Tampilkan memori sesi"
          description="Memori sementara per conversation"
          checked={prefs.showSessionMemories}
          onChange={(checked) => onPrefsChange({ showSessionMemories: checked })}
        />

        <div className="space-y-1.5 pt-1">
          <label className="text-xs text-muted-foreground">
            Filter default
          </label>
          <select
            value={prefs.defaultFilter}
            onChange={(e) =>
              onPrefsChange({
                defaultFilter: e.target
                  .value as typeof prefs.defaultFilter,
              })
            }
            className="h-9 w-full rounded-lg border-0 bg-white/[0.04] px-2 text-xs ring-1 ring-white/10"
          >
            <option value="all">Semua tipe</option>
            {(Object.keys(MEMORY_TYPE_LABELS) as MemoryType[]).map((t) => (
              <option key={t} value={t}>
                {MEMORY_TYPE_LABELS[t]}
              </option>
            ))}
          </select>
        </div>

        <p className="text-[10px] leading-relaxed text-muted-foreground/65">
          Satu DB Neon — metadata + pgvector ANN recall. Hybrid (keyword + vector)
          dengan reweight real-time; keyword fallback otomatis jika pgvector nonaktif.
        </p>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  accent,
  className,
}: {
  label: string;
  value: string;
  accent: "violet" | "amber" | "cyan";
  className?: string;
}) {
  const ring =
    accent === "violet"
      ? "ring-violet-400/20 bg-violet-500/10"
      : accent === "amber"
        ? "ring-amber-400/20 bg-amber-500/10"
        : "ring-cyan-400/20 bg-cyan-500/10";

  return (
    <div
      className={cn(
        "rounded-xl px-3 py-2.5 ring-1",
        ring,
        className
      )}
    >
      <p className="text-[9px] uppercase tracking-widest text-muted-foreground/75">
        {label}
      </p>
      <p className="mt-0.5 text-lg font-semibold tabular-nums">{value}</p>
    </div>
  );
}

function SettingToggle({
  icon,
  label,
  description,
  checked,
  onChange,
}: {
  icon: React.ReactNode;
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-lg p-2 transition-colors hover:bg-white/[0.03]">
      <div className="mt-0.5 shrink-0">{icon}</div>
      <div className="min-w-0 flex-1">
        <span className="text-xs font-medium">{label}</span>
        <p className="mt-0.5 text-[10px] leading-relaxed text-muted-foreground/75">
          {description}
        </p>
      </div>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-1 shrink-0"
      />
    </label>
  );
}
