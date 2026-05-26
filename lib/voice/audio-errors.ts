export function isOpenRouterCreditError(message: string): boolean {
  return (
    /\b402\b/.test(message) ||
    /requires at least \$0\.50/i.test(message) ||
    /insufficient credits?/i.test(message) ||
    /payment required/i.test(message)
  );
}

export function isOpenRouterAuthError(message: string): boolean {
  return /\b401\b/.test(message) || /invalid api key/i.test(message);
}

export function shouldFallbackFromOpenRouterAudio(message: string): boolean {
  return (
    isOpenRouterCreditError(message) ||
    isOpenRouterAuthError(message) ||
    /\b402\b|\b503\b|\b429\b/.test(message)
  );
}

export function friendlyAudioError(message: string, kind: "stt" | "tts"): string {
  if (isOpenRouterCreditError(message)) {
    return kind === "stt"
      ? "OpenRouter STT butuh saldo ≥ $0.50 — PAIOS otomatis pakai Browser STT."
      : "OpenRouter TTS butuh saldo ≥ $0.50 — PAIOS otomatis pakai Browser TTS.";
  }
  if (isOpenRouterAuthError(message)) {
    return "OPENROUTER_API_KEY tidak valid — periksa .env.local";
  }
  if (/OPENROUTER_API_KEY/.test(message)) {
    return "OPENROUTER_API_KEY belum diset — voice cloud nonaktif, fallback browser aktif.";
  }
  return message;
}
