"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { X } from "lucide-react";
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

const TOAST_DURATION = 3200;
const TOAST_EXIT_DURATION = 280;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [exiting, setExiting] = useState<Set<string>>(new Set());

  const removeToast = useCallback((id: string) => {
    setExiting((prev) => new Set(prev).add(id));
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
      setExiting((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }, TOAST_EXIT_DURATION);
  }, []);

  const toast = useCallback(
    (message: string, variant: ToastVariant = "default") => {
      const id = crypto.randomUUID();
      setToasts((prev) => [...prev, { id, message, variant }]);
      setTimeout(() => {
        removeToast(id);
      }, TOAST_DURATION);
    },
    [removeToast]
  );

  const value = useMemo(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed inset-x-3 bottom-[calc(7.5rem+env(safe-area-inset-bottom,0px))] z-[70] flex flex-col items-stretch gap-2 sm:inset-x-auto sm:right-5 sm:bottom-[calc(6.5rem+env(safe-area-inset-bottom,0px))] sm:max-w-sm sm:items-end">
        {toasts.map((t, i) => {
          const isExiting = exiting.has(t.id);
          return (
            <div
              key={t.id}
              className={cn(
                "w-full rounded-xl px-3.5 py-2.5 text-sm shadow-lg ring-1 backdrop-blur-xl sm:w-auto sm:min-w-[16rem] sm:px-4",
                isExiting ? "paios-toast-exit" : "paios-toast-enter",
                t.variant === "success" &&
                  "bg-emerald-950/80 text-emerald-100 ring-emerald-500/20",
                t.variant === "error" &&
                  "bg-red-950/80 text-red-100 ring-red-500/20",
                t.variant === "default" &&
                  "bg-[oklch(0.16_0.02_265/92%)] text-foreground ring-white/10"
              )}
              style={
                !isExiting ? { animationDelay: `${i * 0.06}s` } : undefined
              }
            >
              <div className="flex items-start justify-between gap-3">
                <span className="flex-1">{t.message}</span>
                <button
                  type="button"
                  onClick={() => removeToast(t.id)}
                  className="pointer-events-auto shrink-0 rounded-md p-0.5 text-muted-foreground/60 transition-colors hover:text-foreground"
                  aria-label="Tutup"
                >
                  <X className="size-3" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
