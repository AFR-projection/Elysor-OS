/** Voice Activity Detection tuning */
export const VAD_CONFIG = {
  /** RMS threshold (0–1) — speech detected above this */
  speechThreshold: 0.016,
  /** Consecutive speech frames before starting capture (~16ms/frame at 60fps) */
  speechStartFrames: 3,
  /** Silence duration after speech before auto-submit (ms) */
  silenceMs: 850,
  /** Minimum utterance length to submit (ms) */
  minSpeechMs: 450,
  /** Hard cap per utterance (ms) */
  maxSpeechMs: 28000,
  /** Ignore very short blips during silence (ms) */
  minSilenceBeforeSpeechMs: 120,
} as const;

export const SESSION_LABELS = {
  idle: "Memuat voice mode…",
  connecting: "Menghubungkan ke PAIOS…",
  listening: "PAIOS mendengarkan — bicara kapan saja",
  voice_off: "Voice Off — mikrofon dimatikan",
  user_speaking: "Mendengar kamu…",
  transcribing: "Memproses suara…",
  thinking: "PAIOS sedang berpikir…",
  speaking: "PAIOS sedang berbicara…",
} as const;
