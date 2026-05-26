"use client";

/** Tiny silent MP3 — unlocks browser autoplay after user gesture (mic permission). */
const SILENT_MP3 =
  "data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4Ljc2LjEwMAAAAAAAAAAAAAAA//tQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAACAAADhAC7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7//8AAAAATGF2YzU4LjEzAAAAAAAAAAAAAAAAJAAAAAAAAAAAA4T/hcwAAAA=";

let unlocked = false;

export async function unlockBrowserAudio(): Promise<void> {
  if (unlocked || typeof window === "undefined") return;

  try {
    const probe = new Audio(SILENT_MP3);
    probe.volume = 0.01;
    await probe.play();
    probe.pause();
    unlocked = true;
  } catch {
    // Will retry on next user interaction
  }
}

export function speakWithBrowserTts(
  text: string,
  language = "id-ID"
): Promise<void> {
  if (typeof window === "undefined" || !window.speechSynthesis) {
    return Promise.reject(new Error("Browser TTS tidak tersedia"));
  }

  const trimmed = text.trim();
  if (!trimmed) return Promise.resolve();

  return new Promise((resolve, reject) => {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(trimmed);
    utterance.lang = language;
    utterance.rate = 1;
    utterance.onend = () => resolve();
    utterance.onerror = () =>
      reject(new Error("Browser TTS gagal memutar suara"));
    window.speechSynthesis.speak(utterance);
  });
}

export function stopBrowserTts(): void {
  if (typeof window !== "undefined") {
    window.speechSynthesis.cancel();
  }
}
