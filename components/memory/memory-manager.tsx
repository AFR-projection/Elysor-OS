"use client";

import {
  Loader2,
  Pin,
  PinOff,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  MEMORY_TYPES,
  type useMemoryManager,
} from "@/hooks/use-memory-manager";
import { cn } from "@/lib/utils";
import { MEMORY_TYPE_LABELS } from "@/types/memory";

type MemoryManagerProps = {
  manager: ReturnType<typeof useMemoryManager>;
  compact?: boolean;
};

export function MemoryManager({ manager, compact = false }: MemoryManagerProps) {
  const {
    memories,
    total,
    loading,
    search,
    setSearch,
    filterType,
    setFilterType,
    editingId,
    showAdd,
    setShowAdd,
    saving,
    form,
    setForm,
    load,
    resetForm,
    handleSaveNew,
    handleUpdate,
    handleDelete,
    handleTogglePin,
    startEdit,
  } = manager;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="space-y-2 border-b border-white/6 px-1 pb-3">
        <div className="relative">
          <Search className="absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && void load()}
            placeholder="Cari memori (semantic hybrid)…"
            className="h-9 border-0 bg-white/[0.04] pl-9 text-sm ring-white/10"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          <FilterChip
            active={filterType === "all"}
            onClick={() => setFilterType("all")}
            label="Semua"
          />
          {MEMORY_TYPES.map((t) => (
            <FilterChip
              key={t}
              active={filterType === t}
              onClick={() => setFilterType(t)}
              label={MEMORY_TYPE_LABELS[t]}
            />
          ))}
        </div>
        {!compact ? (
          <p className="text-[10px] text-muted-foreground/70">
            {total} memori tersimpan · hybrid recall aktif
          </p>
        ) : null}
      </div>

      <div className="paios-scrollbar min-h-0 flex-1 overflow-y-auto overscroll-contain py-3">
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : memories.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Belum ada memori. PAIOS belajar dari chat atau tambah manual.
          </p>
        ) : (
          <ul className="space-y-2">
            {memories.map((memory) => (
              <li
                key={memory.id}
                className={cn(
                  "rounded-xl bg-white/[0.03] p-3 ring-1 ring-white/6 transition-colors",
                  editingId === memory.id && "ring-violet-400/30"
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      {memory.pinned ? (
                        <Pin className="size-3 text-amber-400" />
                      ) : null}
                      <span className="text-xs font-semibold text-violet-300">
                        {memory.key}
                      </span>
                      <span className="rounded-full bg-white/5 px-1.5 py-0.5 text-[9px] text-muted-foreground">
                        {MEMORY_TYPE_LABELS[memory.type]}
                      </span>
                      <span className="text-[9px] text-muted-foreground">
                        imp {memory.importance}
                      </span>
                    </div>
                    <p className="mt-1 text-xs leading-relaxed text-foreground/85">
                      {memory.content}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-0.5">
                    <button
                      type="button"
                      onClick={() => void handleTogglePin(memory)}
                      className="rounded-lg p-1.5 text-muted-foreground hover:bg-white/5"
                      aria-label={memory.pinned ? "Unpin" : "Pin"}
                    >
                      {memory.pinned ? (
                        <PinOff className="size-3.5" />
                      ) : (
                        <Pin className="size-3.5" />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => startEdit(memory)}
                      className="rounded-lg px-2 py-1.5 text-[10px] text-muted-foreground hover:bg-white/5"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleDelete(memory.id)}
                      className="rounded-lg p-1.5 text-muted-foreground hover:bg-red-500/10 hover:text-red-300"
                      aria-label="Hapus"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="shrink-0 border-t border-white/8 pt-3">
        {showAdd ? (
          <div className="space-y-2">
            <div className="flex gap-2">
              <select
                value={form.type}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    type: e.target.value as typeof form.type,
                  }))
                }
                className="h-9 flex-1 rounded-lg border-0 bg-white/[0.04] px-2 text-xs ring-1 ring-white/10"
              >
                {MEMORY_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {MEMORY_TYPE_LABELS[t]}
                  </option>
                ))}
              </select>
              <Input
                value={form.key}
                onChange={(e) =>
                  setForm((f) => ({ ...f, key: e.target.value }))
                }
                placeholder="key_snake_case"
                className="h-9 flex-1 bg-white/[0.04] text-xs ring-white/10"
              />
            </div>
            <Textarea
              value={form.content}
              onChange={(e) =>
                setForm((f) => ({ ...f, content: e.target.value }))
              }
              placeholder="Fakta yang ingin disimpan…"
              rows={2}
              className="resize-none border-0 bg-white/[0.04] text-sm ring-white/10"
            />
            <div className="flex items-center justify-between gap-2">
              <label className="flex items-center gap-2 text-xs text-muted-foreground">
                <input
                  type="checkbox"
                  checked={form.pinned}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, pinned: e.target.checked }))
                  }
                />
                Pin memori
              </label>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={resetForm}
                  className="h-8 text-xs ring-white/10"
                >
                  Batal
                </Button>
                <Button
                  size="sm"
                  className="h-8 text-xs"
                  disabled={saving}
                  onClick={() =>
                    void (editingId
                      ? handleUpdate(
                          memories.find((m) => m.id === editingId)!
                        )
                      : handleSaveNew())
                  }
                >
                  {saving ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : editingId ? (
                    "Update"
                  ) : (
                    "Simpan"
                  )}
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <Button
            variant="outline"
            className="h-10 w-full gap-2 text-sm ring-white/10"
            onClick={() => {
              resetForm();
              setShowAdd(true);
            }}
          >
            <Plus className="size-4" />
            Tambah memori manual
          </Button>
        )}
      </div>
    </div>
  );
}

function FilterChip({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full px-2.5 py-1 text-[10px] font-medium transition-colors",
        active
          ? "bg-violet-500/20 text-violet-200 ring-1 ring-violet-400/25"
          : "bg-white/[0.04] text-muted-foreground hover:bg-white/[0.06]"
      )}
    >
      {label}
    </button>
  );
}
