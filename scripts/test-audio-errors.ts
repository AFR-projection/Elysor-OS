import { shouldFallbackFromOpenRouterAudio, friendlyAudioError } from "../lib/voice/audio-errors";

const creditError =
  'OpenRouter STT error (402): {"error":{"message":"This request requires at least $0.50 in balance for audio","code":402}}';

if (!shouldFallbackFromOpenRouterAudio(creditError)) {
  console.error("FAIL: should detect 402 credit error");
  process.exit(1);
}

const friendly = friendlyAudioError(creditError, "stt");
if (!friendly.includes("Browser STT")) {
  console.error("FAIL: friendly STT message missing browser fallback hint");
  process.exit(1);
}

console.log("OK: audio error helpers");
