"use client";

type SpeechRecognitionCtor = new () => SpeechRecognition;

function getSpeechRecognition(): SpeechRecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as Window & {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function supportsBrowserStt(): boolean {
  return getSpeechRecognition() !== null;
}

function resolveSttLang(language?: string): string {
  if (!language || language === "auto") return "id-ID";
  if (language.startsWith("en")) return "en-US";
  if (language.startsWith("id")) return "id-ID";
  return language;
}

export function listenWithBrowserStt(
  language?: string,
  signal?: AbortSignal
): Promise<string> {
  const SpeechRecognition = getSpeechRecognition();
  if (!SpeechRecognition) {
    return Promise.reject(
      new Error("Browser STT tidak didukung — gunakan Chrome/Edge/Safari terbaru.")
    );
  }

  return new Promise((resolve, reject) => {
    const recognition = new SpeechRecognition();
    recognition.lang = resolveSttLang(language);
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    let settled = false;

    const finish = (fn: () => void) => {
      if (settled) return;
      settled = true;
      fn();
    };

    const onAbort = () => {
      recognition.stop();
      finish(() => reject(new DOMException("Aborted", "AbortError")));
    };

    signal?.addEventListener("abort", onAbort, { once: true });

    recognition.onresult = (event) => {
      const text = Array.from(event.results)
        .map((result) => result[0]?.transcript ?? "")
        .join(" ")
        .trim();
      finish(() => resolve(text));
    };

    recognition.onerror = (event) => {
      const code = event.error;
      const message =
        code === "not-allowed"
          ? "Izinkan akses mikrofon di browser"
          : code === "no-speech"
            ? "Tidak ada suara terdeteksi — coba bicara lebih jelas"
            : code === "network"
              ? "Layanan speech browser tidak tersedia — gunakan mode rekam suara (tap mic 2×)"
              : `Browser STT gagal (${code})`;
      finish(() => reject(new Error(message)));
    };

    recognition.onend = () => {
      if (!settled) {
        finish(() => reject(new Error("Tidak ada suara terdeteksi — coba lagi")));
      }
    };

    try {
      recognition.start();
    } catch (error) {
      finish(() =>
        reject(
          error instanceof Error
            ? error
            : new Error("Gagal memulai browser STT")
        )
      );
    }
  });
}
