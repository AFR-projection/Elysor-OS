import { randomUUID } from "node:crypto";
import {
  downloadRemoteFile,
  generateImageOpenRouter,
  generateVideoOpenRouter,
} from "@/lib/openrouter-media";
import { parseDataUrl, saveGeneratedMedia } from "@/lib/media/storage";
import type { GeneratedMediaItem } from "@/types/media";
import type { ToolExecutionContext, ToolResult } from "@/types/tools";

export async function runImageGenerate(
  args: {
    prompt?: string;
    aspect_ratio?: string;
    reference_image_url?: string;
    model?: string;
  },
  ctx: ToolExecutionContext
): Promise<ToolResult & { media?: GeneratedMediaItem }> {
  const prompt = args.prompt?.trim();
  if (!prompt) {
    return {
      success: false,
      data: null,
      summary: "Prompt wajib diisi",
      error: "Missing prompt",
    };
  }

  try {
    const { dataUrl, model } = await generateImageOpenRouter({
      prompt,
      model: args.model,
      aspectRatio: args.aspect_ratio,
      referenceImageUrl: args.reference_image_url,
    });

    const parsed = parseDataUrl(dataUrl);
    if (!parsed) {
      return {
        success: false,
        data: null,
        summary: "Format gambar tidak valid dari model",
        error: "Invalid image data",
      };
    }

    const saved = await saveGeneratedMedia({
      buffer: parsed.buffer,
      mimeType: parsed.mimeType,
      prefix: "image",
    });

    const media: GeneratedMediaItem = {
      id: randomUUID(),
      kind: "image",
      url: saved.url,
      name: saved.filename,
      mimeType: parsed.mimeType,
      size: saved.size,
      prompt,
      model,
      conversationId: ctx.conversationId,
    };

    return {
      success: true,
      data: { ...media, relativePath: saved.relativePath },
      summary: `Gambar dibuat · ${model} · ${saved.filename}`,
      media,
    };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Image generation failed";
    return {
      success: false,
      data: null,
      summary: message,
      error: message,
    };
  }
}

export async function runVideoGenerate(
  args: {
    prompt?: string;
    duration?: number;
    resolution?: string;
    aspect_ratio?: string;
    generate_audio?: boolean;
    reference_image_url?: string;
    model?: string;
  },
  ctx: ToolExecutionContext
): Promise<ToolResult & { media?: GeneratedMediaItem }> {
  const prompt = args.prompt?.trim();
  if (!prompt) {
    return {
      success: false,
      data: null,
      summary: "Prompt wajib diisi",
      error: "Missing prompt",
    };
  }

  try {
    const { buffer, model, jobId } = await generateVideoOpenRouter({
      prompt,
      model: args.model,
      duration: args.duration,
      resolution: args.resolution,
      aspectRatio: args.aspect_ratio,
      generateAudio: args.generate_audio,
      referenceImageUrl: args.reference_image_url,
    });

    const saved = await saveGeneratedMedia({
      buffer,
      mimeType: "video/mp4",
      prefix: "video",
    });

    const media: GeneratedMediaItem = {
      id: randomUUID(),
      kind: "video",
      url: saved.url,
      name: saved.filename,
      mimeType: "video/mp4",
      size: saved.size,
      prompt,
      model,
      conversationId: ctx.conversationId,
    };

    return {
      success: true,
      data: { ...media, jobId, relativePath: saved.relativePath },
      summary: `Video dibuat · ${model} · ${saved.filename}`,
      media,
    };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Video generation failed";
    return {
      success: false,
      data: null,
      summary: message,
      error: message,
    };
  }
}
