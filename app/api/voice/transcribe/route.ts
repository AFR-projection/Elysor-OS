import { bufferToBase64, transcribeWithOpenRouter } from "@/lib/openrouter-audio";
import { friendlyAudioError } from "@/lib/voice/audio-errors";
import { resolveSttFormat } from "@/lib/voice/constants";
export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const audio = form.get("audio");
    const language = form.get("language");

    if (!(audio instanceof File) || audio.size === 0) {
      return Response.json(
        { error: "audio file is required" },
        { status: 400 }
      );
    }

    const format = resolveSttFormat(audio.type || "audio/webm");
    const buffer = await audio.arrayBuffer();
    const data = bufferToBase64(buffer);

    const { text } = await transcribeWithOpenRouter({
      data,
      format,
      language:
        typeof language === "string" && language.length >= 2
          ? language.slice(0, 5)
          : undefined,
    });

    if (!text) {
      return Response.json(
        { error: "Tidak ada suara terdeteksi — coba bicara lebih jelas." },
        { status: 422 }
      );
    }

    return Response.json({ text });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Transcription failed";
    console.error("[voice/transcribe]", message);
    return Response.json(
      { error: friendlyAudioError(message, "stt") },
      { status: 500 }
    );
  }}
