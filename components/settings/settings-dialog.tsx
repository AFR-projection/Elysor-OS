"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  Brain,
  Check,
  Cpu,
  Globe,
  Loader2,
  Monitor,
  Settings,
  Sparkles,
  User,
  X,
  Zap,
} from "lucide-react";
import { useSettings } from "@/components/providers/settings-provider";
import { useToast } from "@/components/providers/toast-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UseAgentToggle } from "@/components/chat/use-agent-toggle";
import {
  AGENT_POWER_DESCRIPTIONS,
  AGENT_POWER_LABELS,
  AGENT_POWER_SPECS,
} from "@/lib/agent-power";
import { PAIOS_VERSION } from "@/lib/paios-version";
import { isValidTimezone } from "@/lib/timezone";
import { cn } from "@/lib/utils";
import type { AgentPowerMode, PreferredLanguage } from "@/types/settings";

type SettingsTab = "profile" | "agent" | "system";

type SettingsDialogProps = {
  open: boolean;
  onClose: () => void;
};

const TABS: Array<{
  id: SettingsTab;
  label: string;
  icon: typeof User;
}> = [
  { id: "profile", label: "Profil", icon: User },
  { id: "agent", label: "Agent AI", icon: Cpu },
  { id: "system", label: "Sistem", icon: Monitor },
];

const LANGUAGES: Array<{ value: PreferredLanguage; label: string; flag: string }> =
  [
    { value: "id", label: "Indonesia", flag: "🇮🇩" },
    { value: "en", label: "English", flag: "🇺🇸" },
    { value: "auto", label: "Auto", flag: "🌐" },
  ];

const POWER_ICONS: Record<AgentPowerMode, typeof Zap> = {
  hemat: Zap,
  sedang: Sparkles,
  max: Brain,
};

export function SettingsDialog({ open, onClose }: SettingsDialogProps) {
  const { settings, updateSettings, isLoading } = useSettings();
  const { toast } = useToast();

  const [tab, setTab] = useState<SettingsTab>("profile");
  const [displayName, setDisplayName] = useState("");
  const [language, setLanguage] = useState<PreferredLanguage>("id");
  const [timezone, setTimezone] = useState("");
  const [powerMode, setPowerMode] = useState<AgentPowerMode>("sedang");
  const [useAgentTeam, setUseAgentTeam] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setDisplayName(settings.displayName ?? "");
    setLanguage(settings.preferredLanguage);
    setTimezone(settings.timezone ?? "");
    setPowerMode(settings.agentPowerMode ?? "sedang");
    setUseAgentTeam(settings.useAgentTeam ?? false);
  }, [open, settings]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const browserTimezone = useMemo(() => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone;
    } catch {
      return "Asia/Jakarta";
    }
  }, []);

  const isDirty = useMemo(() => {
    if (!open) return false;
    return (
      (displayName.trim() || null) !== (settings.displayName ?? null) ||
      language !== settings.preferredLanguage ||
      (timezone.trim() || null) !== (settings.timezone ?? null) ||
      powerMode !== (settings.agentPowerMode ?? "sedang") ||
      useAgentTeam !== (settings.useAgentTeam ?? false)
    );
  }, [
    open,
    displayName,
    language,
    timezone,
    powerMode,
    useAgentTeam,
    settings,
  ]);

  if (!open) return null;

  const handleSave = async () => {
    const trimmedTz = timezone.trim();
    if (trimmedTz && !isValidTimezone(trimmedTz)) {
      toast(
        "Timezone tidak valid. Contoh: Asia/Jakarta, Asia/Phnom_Penh",
        "error"
      );
      return;
    }

    setSaving(true);
    try {
      await updateSettings({
        displayName: displayName.trim() || null,
        preferredLanguage: language,
        timezone: timezone.trim() || null,
        agentPowerMode: powerMode,
        useAgentTeam,
      });
      toast("Pengaturan disimpan", "success");
      onClose();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Gagal menyimpan pengaturan";
      toast(message, "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center sm:p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/70 backdrop-blur-md"
        onClick={onClose}
        aria-label="Tutup pengaturan"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-title"
        className="paios-scrollbar safe-bottom relative flex max-h-[94dvh] w-full max-w-3xl flex-col overflow-hidden rounded-t-2xl border border-white/10 bg-[oklch(0.13_0.028_265)] shadow-2xl sm:max-h-[88vh] sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative shrink-0 border-b border-white/8 bg-gradient-to-r from-cyan-500/[0.08] via-violet-500/[0.06] to-transparent px-4 py-4 sm:px-6">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <Settings className="size-5 shrink-0 text-cyan-400" />
                <h2 id="settings-title" className="text-lg font-semibold sm:text-xl">
                  Command Center
                </h2>
                <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                  {PAIOS_VERSION.fullLabel}
                </span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
                Konfigurasi profil, kekuatan agent, dan preferensi sistem PAIOS.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="shrink-0 rounded-lg p-2 text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground"
            >
              <X className="size-4" />
            </button>
          </div>

          <nav className="mt-4 flex gap-1 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setTab(id)}
                className={cn(
                  "flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition-all sm:text-sm",
                  tab === id
                    ? "bg-white/10 text-foreground ring-1 ring-white/10"
                    : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
                )}
              >
                <Icon className="size-3.5" />
                {label}
              </button>
            ))}
          </nav>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5">
          {isLoading ? (
            <div className="flex items-center justify-center py-16 text-sm text-muted-foreground">
              <Loader2 className="mr-2 size-4 animate-spin" />
              Memuat pengaturan…
            </div>
          ) : null}

          {!isLoading && tab === "profile" ? (
            <div className="space-y-5">
              <section className="rounded-xl border border-white/8 bg-white/[0.02] p-4">
                <h3 className="text-sm font-semibold text-foreground/90">
                  Identitas
                </h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  Nama dipakai agent saat memanggil kamu dan menyimpan memory.
                </p>

                <div className="mt-4 flex items-center gap-4">
                  <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500/25 to-cyan-500/20 text-xl font-bold text-foreground ring-1 ring-white/10">
                    {(displayName.trim() || "P").charAt(0).toUpperCase()}
                  </div>
                  <label className="min-w-0 flex-1 space-y-1.5">
                    <span className="text-xs font-medium text-muted-foreground">
                      Nama kamu
                    </span>
                    <Input
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="Aldo"
                      className="bg-white/[0.04] ring-white/10"
                    />
                  </label>
                </div>
              </section>

              <section className="rounded-xl border border-white/8 bg-white/[0.02] p-4">
                <h3 className="text-sm font-semibold text-foreground/90">
                  Bahasa respons
                </h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  Agent akan menyesuaikan bahasa jawaban dengan pilihan ini.
                </p>
                <div className="mt-3 grid grid-cols-3 gap-2">
                  {LANGUAGES.map((lang) => (
                    <button
                      key={lang.value}
                      type="button"
                      onClick={() => setLanguage(lang.value)}
                      className={cn(
                        "rounded-xl border px-2 py-3 text-center transition-all",
                        language === lang.value
                          ? "border-cyan-400/35 bg-cyan-500/10 ring-1 ring-cyan-400/20"
                          : "border-white/8 bg-white/[0.03] hover:bg-white/[0.05]"
                      )}
                    >
                      <span className="text-lg">{lang.flag}</span>
                      <p className="mt-1 text-[11px] font-medium">{lang.label}</p>
                    </button>
                  ))}
                </div>
              </section>
            </div>
          ) : null}

          {!isLoading && tab === "agent" ? (
            <div className="space-y-5">
              <section className="rounded-xl border border-violet-400/25 bg-gradient-to-br from-violet-500/10 via-cyan-500/5 to-transparent p-4">
                <h3 className="text-sm font-semibold">Use Agent — Tim 5 Agent</h3>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  ON = setiap pesan deploy 4 specialist + synthesizer (MAX).
                  OFF = single agent cepat & ringan seperti chat AI biasa.
                </p>
                <div className="mt-3">
                  <UseAgentToggle
                    enabled={useAgentTeam}
                    onChange={setUseAgentTeam}
                  />
                </div>
              </section>

              <section className="rounded-xl border border-violet-400/15 bg-gradient-to-br from-violet-500/[0.06] to-transparent p-4">
                <div className="flex items-start gap-3">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-violet-500/15 ring-1 ring-violet-400/20">
                    <Brain className="size-5 text-violet-300" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold">Mode Daya Agent</h3>
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                      {useAgentTeam
                        ? "Use Agent ON — mode daya di-override ke MAX otomatis."
                        : "Hemat · Sedang · Max — kontrol token & kedalaman single agent."}
                    </p>
                  </div>
                </div>
              </section>

              <div className="grid gap-3 lg:grid-cols-3">
                {(["hemat", "sedang", "max"] as AgentPowerMode[]).map((mode) => {
                  const Icon = POWER_ICONS[mode];
                  const specs = AGENT_POWER_SPECS[mode];
                  const active = powerMode === mode;

                  return (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setPowerMode(mode)}
                      disabled={useAgentTeam}
                      className={cn(
                        "group relative rounded-2xl border p-4 text-left transition-all duration-200",
                        active
                          ? mode === "max"
                            ? "border-violet-400/40 bg-violet-500/10 ring-1 ring-violet-400/30 shadow-[0_0_32px_-12px_oklch(0.62_0.18_285/45%)]"
                            : mode === "sedang"
                              ? "border-cyan-400/35 bg-cyan-500/8 ring-1 ring-cyan-400/25"
                              : "border-emerald-400/30 bg-emerald-500/8 ring-1 ring-emerald-400/20"
                          : "border-white/8 bg-white/[0.02] hover:border-white/15 hover:bg-white/[0.04]"
                      )}
                    >
                      {active ? (
                        <span className="absolute right-3 top-3 flex size-5 items-center justify-center rounded-full bg-cyan-400/20">
                          <Check className="size-3 text-cyan-200" />
                        </span>
                      ) : null}

                      <div className="flex items-center gap-2">
                        <Icon
                          className={cn(
                            "size-4",
                            mode === "max"
                              ? "text-violet-300"
                              : mode === "sedang"
                                ? "text-cyan-300"
                                : "text-emerald-300"
                          )}
                        />
                        <span className="text-base font-bold">
                          {AGENT_POWER_LABELS[mode]}
                        </span>
                      </div>

                      <p className="mt-2 text-[11px] leading-snug text-muted-foreground">
                        {AGENT_POWER_DESCRIPTIONS[mode]}
                      </p>

                      <dl className="mt-3 space-y-1.5 border-t border-white/6 pt-3">
                        {(
                          [
                            ["Token", specs.tokens],
                            ["Model", specs.model],
                            ["Tim agent", specs.team],
                            ["Kedalaman", specs.depth],
                          ] as const
                        ).map(([key, value]) => (
                          <div
                            key={key}
                            className="flex items-center justify-between gap-2 text-[10px]"
                          >
                            <dt className="text-muted-foreground">{key}</dt>
                            <dd className="font-medium text-foreground/85">
                              {value}
                            </dd>
                          </div>
                        ))}
                      </dl>
                    </button>
                  );
                })}
              </div>

              <div className="rounded-xl border border-white/8 bg-white/[0.02] p-4 text-xs text-muted-foreground">
                <p>
                  <span className="font-medium text-foreground/80">Tip:</span>{" "}
                  Pakai <strong className="text-violet-300">Max</strong> untuk
                  research, analisa, laporan PDF, dan task multi-langkah.{" "}
                  <strong className="text-emerald-300">Hemat</strong> untuk chat
                  ringan sehari-hari.
                </p>
              </div>
            </div>
          ) : null}

          {!isLoading && tab === "system" ? (
            <div className="space-y-5">
              <section className="rounded-xl border border-white/8 bg-white/[0.02] p-4">
                <div className="flex items-center gap-2">
                  <Globe className="size-4 text-cyan-400" />
                  <h3 className="text-sm font-semibold">Timezone</h3>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Agent memakai timezone ini untuk waktu, jadwal, dan konteks
                  realtime. Kosongkan untuk ikuti browser (
                  <code className="text-cyan-300/80">{browserTimezone}</code>).
                </p>

                <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                  <Input
                    value={timezone}
                    onChange={(e) => setTimezone(e.target.value)}
                    placeholder="Asia/Jakarta"
                    className="bg-white/[0.04] ring-white/10"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    className="shrink-0 ring-white/10"
                    onClick={() => setTimezone(browserTimezone)}
                  >
                    Deteksi browser
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="shrink-0 ring-white/10"
                    onClick={() => setTimezone("")}
                  >
                    Reset
                  </Button>
                </div>
              </section>

              <section className="rounded-xl border border-white/8 bg-white/[0.02] p-4">
                <h3 className="text-sm font-semibold">Modul terkait</h3>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  <Link
                    href="/memory"
                    onClick={onClose}
                    className="flex items-center gap-3 rounded-xl border border-white/8 bg-white/[0.03] px-3 py-3 transition-colors hover:border-cyan-400/20 hover:bg-white/[0.05]"
                  >
                    <Brain className="size-4 text-cyan-400" />
                    <div>
                      <p className="text-sm font-medium">Memory Hub</p>
                      <p className="text-[10px] text-muted-foreground">
                        Memory v4.1 · pgvector
                      </p>
                    </div>
                  </Link>
                  <div className="flex items-center gap-3 rounded-xl border border-white/8 bg-white/[0.03] px-3 py-3">
                    <Sparkles className="size-4 text-violet-400" />
                    <div>
                      <p className="text-sm font-medium">Agent Pipeline</p>
                      <p className="text-[10px] text-muted-foreground">
                        Planner · Tools · Team mode
                      </p>
                    </div>
                  </div>
                </div>
              </section>

              <section className="rounded-xl border border-white/8 bg-white/[0.02] p-4">
                <h3 className="text-sm font-semibold">Info build</h3>
                <dl className="mt-3 grid gap-2 text-xs sm:grid-cols-2">
                  <div className="flex justify-between rounded-lg bg-white/[0.03] px-3 py-2">
                    <dt className="text-muted-foreground">App</dt>
                    <dd className="font-mono">{PAIOS_VERSION.app}</dd>
                  </div>
                  <div className="flex justify-between rounded-lg bg-white/[0.03] px-3 py-2">
                    <dt className="text-muted-foreground">Agent</dt>
                    <dd className="font-mono">{PAIOS_VERSION.agent}</dd>
                  </div>
                  <div className="flex justify-between rounded-lg bg-white/[0.03] px-3 py-2">
                    <dt className="text-muted-foreground">Memory</dt>
                    <dd className="font-mono">{PAIOS_VERSION.memory}</dd>
                  </div>
                  <div className="flex justify-between rounded-lg bg-white/[0.03] px-3 py-2">
                    <dt className="text-muted-foreground">Mode aktif</dt>
                    <dd className="font-medium text-cyan-300">
                      {AGENT_POWER_LABELS[powerMode]}
                    </dd>
                  </div>
                </dl>
              </section>
            </div>
          ) : null}
        </div>

        <div className="shrink-0 border-t border-white/8 bg-[oklch(0.12_0.025_265)] px-4 py-3 sm:px-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[11px] text-muted-foreground">
              {isDirty ? (
                <span className="text-amber-300/90">
                  ● Perubahan belum disimpan
                </span>
              ) : (
                <span>Pengaturan tersinkron</span>
              )}
            </p>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={onClose}
                className="ring-white/10"
                disabled={saving}
              >
                Batal
              </Button>
              <Button
                onClick={() => void handleSave()}
                disabled={saving || !isDirty}
                className="min-w-[120px]"
              >
                {saving ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  "Simpan"
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
