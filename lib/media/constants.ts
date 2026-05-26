/** Best for img2img / edit with reference photo */
export const IMAGE_EDIT_MODEL = "google/gemini-2.5-flash-image";

/** Top-tier text-to-image */
export const IMAGE_MODELS = {
  primary: "black-forest-labs/flux.2-pro",
  fallback: "google/gemini-2.5-flash-image",
  fast: "black-forest-labs/flux.2-flex",
} as const;

/** Google Veo — flagship video generation on OpenRouter */
export const VIDEO_MODEL = "google/veo-3.1";

export const VIDEO_DEFAULTS = {
  duration: 8,
  resolution: "720p" as const,
  aspectRatio: "16:9" as const,
  generateAudio: true,
};

export const MEDIA_GENERATED_DIR = "generated";
