import {
  IMAGE_EDIT_MODEL,
  IMAGE_MODELS,
  VIDEO_DEFAULTS,
  VIDEO_MODEL,
} from "@/lib/media/constants";

const OPENROUTER_CHAT_URL = "https://openrouter.ai/api/v1/chat/completions";
const OPENROUTER_VIDEOS_URL = "https://openrouter.ai/api/v1/videos";

function getOpenRouterHeaders(): HeadersInit {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY environment variable is not set");
  }

  return {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
    "HTTP-Referer": process.env.APP_URL ?? "http://localhost:3000",
    "X-Title": "PAIOS",
  };
}

type OpenRouterMessage = Record<string, unknown>;

function extractImageUrls(message: Record<string, unknown>): string[] {
  const urls: string[] = [];

  const images = message.images;
  if (Array.isArray(images)) {
    for (const img of images) {
      if (!img || typeof img !== "object") continue;
      const record = img as Record<string, unknown>;
      const imageUrl = record.image_url ?? record.imageUrl;
      if (imageUrl && typeof imageUrl === "object") {
        const url = (imageUrl as Record<string, unknown>).url;
        if (typeof url === "string") urls.push(url);
      }
    }
  }

  const content = message.content;
  if (Array.isArray(content)) {
    for (const part of content) {
      if (!part || typeof part !== "object") continue;
      const record = part as Record<string, unknown>;
      if (record.type === "image_url") {
        const imageUrl = record.image_url;
        if (imageUrl && typeof imageUrl === "object") {
          const url = (imageUrl as Record<string, unknown>).url;
          if (typeof url === "string") urls.push(url);
        }
      }
    }
  }

  return urls;
}

function isImageOnlyModel(model: string): boolean {
  return model.includes("flux") || model.includes("sourceful");
}

export type GenerateImageInput = {
  prompt: string;
  model?: string;
  aspectRatio?: string;
  referenceImageUrl?: string;
};

export async function generateImageOpenRouter(
  input: GenerateImageInput
): Promise<{ dataUrl: string; model: string }> {
  const hasReference = Boolean(input.referenceImageUrl);
  const models = hasReference
    ? [
        IMAGE_EDIT_MODEL,
        IMAGE_MODELS.fallback,
        IMAGE_MODELS.primary,
        IMAGE_MODELS.fast,
      ].filter((m, i, arr) => arr.indexOf(m) === i)
    : [
        input.model ?? IMAGE_MODELS.primary,
        IMAGE_MODELS.fallback,
        IMAGE_MODELS.fast,
      ].filter((m, i, arr) => arr.indexOf(m) === i);

  let lastError = "Image generation failed";

  for (const model of models) {
    try {
      const content: OpenRouterMessage[] = [
        {
          type: "text",
          text: input.prompt,
        },
      ];

      if (input.referenceImageUrl) {
        content.push({
          type: "image_url",
          image_url: { url: input.referenceImageUrl },
        });
      }

      const body: Record<string, unknown> = {
        model,
        messages: [{ role: "user", content }],
        modalities: isImageOnlyModel(model)
          ? ["image"]
          : ["image", "text"],
      };

      if (input.aspectRatio && !isImageOnlyModel(model)) {
        body.image_config = { aspect_ratio: input.aspectRatio };
      }

      const response = await fetch(OPENROUTER_CHAT_URL, {
        method: "POST",
        headers: getOpenRouterHeaders(),
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        lastError = await response.text();
        continue;
      }

      const result = (await response.json()) as {
        choices?: Array<{ message?: Record<string, unknown> }>;
      };
      const message = result.choices?.[0]?.message;
      if (!message) {
        lastError = "No message in image response";
        continue;
      }

      const urls = extractImageUrls(message);
      if (urls.length === 0) {
        lastError = "No image in model response";
        continue;
      }

      return { dataUrl: urls[0]!, model };
    } catch (err) {
      lastError = err instanceof Error ? err.message : "Image generation error";
    }
  }

  throw new Error(lastError);
}

export type GenerateVideoInput = {
  prompt: string;
  model?: string;
  duration?: number;
  resolution?: string;
  aspectRatio?: string;
  generateAudio?: boolean;
  referenceImageUrl?: string;
  onProgress?: (status: string, attempt: number) => void;
};

type VideoJobStatus = {
  status?: string;
  error?: string;
  message?: string;
  unsigned_urls?: string[];
  video_url?: string;
  output?: { url?: string };
  result?: { url?: string };
};

function extractVideoDownloadUrl(status: VideoJobStatus): string | null {
  return (
    status.unsigned_urls?.[0] ??
    status.video_url ??
    status.output?.url ??
    status.result?.url ??
    null
  );
}

async function downloadVideoFromJob(jobId: string, status: VideoJobStatus): Promise<Buffer> {
  const directUrl = extractVideoDownloadUrl(status);
  if (directUrl) {
    return downloadRemoteFile(directUrl);
  }

  const contentRes = await fetch(`${OPENROUTER_VIDEOS_URL}/${jobId}/content`, {
    headers: getOpenRouterHeaders(),
  });
  if (contentRes.ok) {
    return Buffer.from(await contentRes.arrayBuffer());
  }

  throw new Error("Video completed but no download URL");
}

export async function generateVideoOpenRouter(
  input: GenerateVideoInput
): Promise<{
  downloadUrl: string;
  model: string;
  jobId: string;
  buffer: Buffer;
}> {
  const model = input.model ?? VIDEO_MODEL;

  const body: Record<string, unknown> = {
    model,
    prompt: input.prompt,
    duration: input.duration ?? VIDEO_DEFAULTS.duration,
    resolution: input.resolution ?? VIDEO_DEFAULTS.resolution,
    aspect_ratio: input.aspectRatio ?? VIDEO_DEFAULTS.aspectRatio,
    generate_audio: input.generateAudio ?? VIDEO_DEFAULTS.generateAudio,
  };

  if (input.referenceImageUrl) {
    body.frame_images = [{ url: input.referenceImageUrl, frame: 0 }];
  }

  const submit = await fetch(OPENROUTER_VIDEOS_URL, {
    method: "POST",
    headers: getOpenRouterHeaders(),
    body: JSON.stringify(body),
  });

  if (!submit.ok) {
    const err = await submit.text();
    throw new Error(`Video submit failed (${submit.status}): ${err}`);
  }

  const job = (await submit.json()) as {
    id?: string;
    polling_url?: string;
    status?: string;
  };

  const jobId = job.id;
  const pollingUrl = job.polling_url ?? `${OPENROUTER_VIDEOS_URL}/${jobId}`;

  if (!jobId) {
    throw new Error("Video job missing id");
  }

  input.onProgress?.(job.status ?? "queued", 0);

  const maxAttempts = 90;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const delayMs = attempt < 10 ? 4000 : attempt < 30 ? 8000 : 12000;
    await sleep(delayMs);

    const poll = await fetch(pollingUrl, {
      headers: getOpenRouterHeaders(),
    });

    if (!poll.ok) {
      const err = await poll.text();
      throw new Error(`Video poll failed (${poll.status}): ${err}`);
    }

    const status = (await poll.json()) as VideoJobStatus;
    input.onProgress?.(status.status ?? "processing", attempt);

    const normalizedStatus = status.status?.toLowerCase();

    if (normalizedStatus === "completed" || normalizedStatus === "succeeded") {
      const buffer = await downloadVideoFromJob(jobId, status);
      const url = extractVideoDownloadUrl(status) ?? `${OPENROUTER_VIDEOS_URL}/${jobId}/content`;
      return { downloadUrl: url, model, jobId, buffer };
    }

    if (normalizedStatus === "failed" || normalizedStatus === "error") {
      throw new Error(
        status.error ?? status.message ?? "Video generation failed"
      );
    }
  }

  throw new Error(
    "Video generation timed out — coba prompt lebih pendek atau resolusi lebih rendah"
  );
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function downloadRemoteFile(url: string): Promise<Buffer> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Download failed (${response.status})`);
  }
  return Buffer.from(await response.arrayBuffer());
}
