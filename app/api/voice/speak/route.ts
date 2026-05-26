import {
  DEFAULT_VOICE_TTS_FORMAT,
  DEFAULT_VOICE_TTS_VOICE,
  VOICE_TTS_VOICES,
  type VoiceTtsVoice,
} from "@/lib/voice/constants";
import { streamSpeechFromOpenRouter } from "@/lib/openrouter-audio";
import { shouldFallbackFromOpenRouterAudio } from "@/lib/voice/audio-errors";
export const runtime = "nodejs";

function encodeEvent(data: unknown): string {
  return `data: ${JSON.stringify(data)}\n\n`;
}

type SpeakBody = {
  text?: string;
  voice?: VoiceTtsVoice;
  format?: string;
};

export async function POST(request: Request) {
  let body: SpeakBody;

  try {
    body = (await request.json()) as SpeakBody;
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const text = body.text?.trim();
  if (!text) {
    return Response.json({ error: "text is required" }, { status: 400 });
  }

  const voice =
    body.voice && VOICE_TTS_VOICES.includes(body.voice)
      ? body.voice
      : DEFAULT_VOICE_TTS_VOICE;

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();

      try {
        for await (const chunk of streamSpeechFromOpenRouter(text, {
          voice,
          format: DEFAULT_VOICE_TTS_FORMAT,
          signal: request.signal,
        })) {
          if (request.signal.aborted) break;

          if (chunk.kind === "audio") {
            controller.enqueue(
              encoder.encode(
                encodeEvent({ type: "audio", data: chunk.data })
              )
            );
          } else {
            controller.enqueue(
              encoder.encode(
                encodeEvent({ type: "tts_transcript", content: chunk.content })
              )
            );
          }
        }

        controller.enqueue(encoder.encode(encodeEvent({ type: "done" })));
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "TTS stream failed";
        if (shouldFallbackFromOpenRouterAudio(message)) {
          controller.enqueue(
            encoder.encode(
              encodeEvent({
                type: "tts_fallback",
                text,
                reason: message,
              })
            )
          );
          controller.enqueue(encoder.encode(encodeEvent({ type: "done" })));
        } else {
          controller.enqueue(
            encoder.encode(encodeEvent({ type: "error", message }))
          );
        }
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
