"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { cn } from "@/lib/utils";

type ToastVariant = "default" | "success" | "error";

type Toast = {
  id: string;
  message: string;
  variant: ToastVariant;
};

type ToastContextValue = {
  toast: (message: string, variant?: ToastVariant) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((message: string, variant: ToastVariant = "default") => {
    const id = crypto.randomUUID();
    setToasts((prev) => [...prev, { id, message, variant }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3200);
  }, []);

  const value = useMemo(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed inset-x-3 bottom-[calc(7.5rem+env(safe-area-inset-bottom,0px))] z-[70] flex flex-col items-stretch gap-2 sm:inset-x-auto sm:right-5 sm:bottom-[calc(6.5rem+env(safe-area-inset-bottom,0px))] sm:max-w-sm sm:items-end">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={cn(
              "animate-in slide-in-from-bottom-2 w-full rounded-xl px-3.5 py-2.5 text-sm shadow-lg ring-1 backdrop-blur-xl sm:w-auto sm:min-w-[16rem] sm:px-4",
              t.variant === "success" &&
                "bg-emerald-950/80 text-emerald-100 ring-emerald-500/20",
              t.variant === "error" &&
                "bg-red-950/80 text-red-100 ring-red-500/20",
              t.variant === "default" &&
                "bg-[oklch(0.16_0.02_265/92%)] text-foreground ring-white/10"
            )}
          >
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
