"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useToast } from "@/components/providers/toast-provider";
import {
  createMemoryApi,
  deleteMemoryApi,
  fetchMemories,
  updateMemoryApi,
} from "@/lib/memories-client";
import type { MemoryPreferences } from "@/lib/memory-preferences";
import type { MemoryRecord, MemoryType } from "@/types/memory";

export const MEMORY_TYPES: MemoryType[] = [
  "preference",
  "long_term",
  "project",
  "session",
];

export type MemoryFormState = {
  type: MemoryType;
  key: string;
  content: string;
  importance: number;
  pinned: boolean;
};

const EMPTY_FORM: MemoryFormState = {
  type: "long_term",
  key: "",
  content: "",
  importance: 5,
  pinned: false,
};

type UseMemoryManagerOptions = {
  prefs: MemoryPreferences;
  enabled?: boolean;
  onChanged?: () => void;
};

export function useMemoryManager({
  prefs,
  enabled = true,
  onChanged,
}: UseMemoryManagerOptions) {
  const { toast } = useToast();
  const [memories, setMemories] = useState<MemoryRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<
    MemoryType | "all"
  >(prefs.defaultFilter);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<MemoryFormState>(EMPTY_FORM);

  useEffect(() => {
    setFilterType(prefs.defaultFilter);
  }, [prefs.defaultFilter]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchMemories({
        type: filterType === "all" ? undefined : filterType,
        q: search.trim() || undefined,
      });
      let list = data.memories;
      if (!prefs.showSessionMemories) {
        list = list.filter((m) => m.type !== "session");
      }
      setMemories(list);
      setTotal(data.total);
    } catch {
      toast("Gagal memuat memori", "error");
    } finally {
      setLoading(false);
    }
  }, [filterType, prefs.showSessionMemories, search, toast]);

  useEffect(() => {
    if (!enabled) return;
    void load();
  }, [enabled, load]);

  const stats = useMemo(() => {
    const pinned = memories.filter((m) => m.pinned).length;
    const byType = MEMORY_TYPES.reduce(
      (acc, type) => {
        acc[type] = memories.filter((m) => m.type === type).length;
        return acc;
      },
      {} as Record<MemoryType, number>
    );
    return { pinned, byType };
  }, [memories]);

  const resetForm = useCallback(() => {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setShowAdd(false);
  }, []);

  const handleSaveNew = useCallback(async () => {
    if (!form.key.trim() || !form.content.trim()) {
      toast("Key dan isi wajib diisi", "error");
      return;
    }
    setSaving(true);
    try {
      await createMemoryApi({
        type: form.type,
        key: form.key,
        content: form.content,
        importance: form.importance,
        pinned: form.pinned,
      });
      toast("Memori disimpan", "success");
      resetForm();
      await load();
      onChanged?.();
    } catch {
      toast("Gagal menyimpan memori", "error");
    } finally {
      setSaving(false);
    }
  }, [form, load, onChanged, resetForm, toast]);

  const handleUpdate = useCallback(
    async (memory: MemoryRecord) => {
      setSaving(true);
      try {
        await updateMemoryApi(memory.id, {
          type: form.type,
          key: form.key,
          content: form.content,
          importance: form.importance,
          pinned: form.pinned,
        });
        toast("Memori diperbarui", "success");
        resetForm();
        await load();
        onChanged?.();
      } catch {
        toast("Gagal memperbarui memori", "error");
      } finally {
        setSaving(false);
      }
    },
    [form, load, onChanged, resetForm, toast]
  );

  const handleDelete = useCallback(
    async (id: string) => {
      try {
        await deleteMemoryApi(id);
        toast("Memori dihapus", "default");
        if (editingId === id) resetForm();
        await load();
        onChanged?.();
      } catch {
        toast("Gagal menghapus memori", "error");
      }
    },
    [editingId, load, onChanged, resetForm, toast]
  );

  const handleTogglePin = useCallback(
    async (memory: MemoryRecord) => {
      try {
        await updateMemoryApi(memory.id, { pinned: !memory.pinned });
        await load();
        onChanged?.();
      } catch {
        toast("Gagal pin memori", "error");
      }
    },
    [load, onChanged, toast]
  );

  const startEdit = useCallback((memory: MemoryRecord) => {
    setEditingId(memory.id);
    setShowAdd(true);
    setForm({
      type: memory.type,
      key: memory.key,
      content: memory.content,
      importance: memory.importance,
      pinned: memory.pinned,
    });
  }, []);

  return {
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
    stats,
    load,
    resetForm,
    handleSaveNew,
    handleUpdate,
    handleDelete,
    handleTogglePin,
    startEdit,
  };
}
