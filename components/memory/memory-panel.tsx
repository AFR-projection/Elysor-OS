"use client";



import { useMemoryManager } from "@/hooks/use-memory-manager";

import { useMemoryPreferences } from "@/hooks/use-memory-preferences";

import { MemoryManager } from "@/components/memory/memory-manager";

import { Brain, X } from "lucide-react";



type MemoryPanelProps = {

  open: boolean;

  onClose: () => void;

  onChanged?: () => void;

};



export function MemoryPanel({ open, onClose, onChanged }: MemoryPanelProps) {

  const { prefs } = useMemoryPreferences();

  const manager = useMemoryManager({

    prefs,

    enabled: open,

    onChanged,

  });



  if (!open) return null;



  return (

    <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center sm:p-4">

      <button

        type="button"

        className="absolute inset-0 bg-black/60 backdrop-blur-sm"

        onClick={onClose}

        aria-label="Tutup panel memori"

      />

      <div className="safe-bottom relative flex max-h-[92dvh] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl bg-[oklch(0.14_0.025_265)] shadow-2xl ring-1 ring-white/10 sm:max-h-[85dvh] sm:rounded-2xl">

        <div className="flex items-center justify-between border-b border-white/8 px-4 py-3">

          <div className="flex items-center gap-2">

            <Brain className="size-5 text-violet-400" />

            <div>

              <h2 className="text-base font-semibold">Memori PAIOS</h2>

              <p className="text-[11px] text-muted-foreground">

                {manager.total} memori · buka halaman Neural Memory untuk v3

              </p>

            </div>

          </div>

          <button

            type="button"

            onClick={onClose}

            className="rounded-lg p-2 text-muted-foreground hover:bg-white/5"

          >

            <X className="size-4" />

          </button>

        </div>



        <div className="flex min-h-0 flex-1 flex-col px-4 pb-4">

          <MemoryManager manager={manager} compact />

        </div>

      </div>

    </div>

  );

}

