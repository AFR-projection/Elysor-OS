const OPENROUTER_EMBEDDINGS_URL =
  "https://openrouter.ai/api/v1/embeddings";

/** Cheap, fast embedding model on OpenRouter */
export const EMBEDDING_MODEL = "openai/text-embedding-3-small";

export function memoryEmbeddingText(key: string, content: string): string {
  return `${key.replace(/_/g, " ")}: ${content}`.slice(0, 8000);
}

function getHeaders(): HeadersInit {
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

export async function embedTexts(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) return [];

  const response = await fetch(OPENROUTER_EMBEDDINGS_URL, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({
      model: EMBEDDING_MODEL,
      input: texts,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Embeddings failed (${response.status}): ${body.slice(0, 200)}`);
  }

  const json = (await response.json()) as {
    data?: Array<{ embedding?: number[] }>;
  };

  const vectors = json.data?.map((d) => d.embedding ?? []) ?? [];
  if (vectors.length !== texts.length) {
    throw new Error("Embeddings response length mismatch");
  }

  return vectors;
}

function timeout<T>(ms: number, value: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

export async function embedText(
  text: string,
  timeoutMs = 12_000
): Promise<number[] | null> {
  const trimmed = text.trim();
  if (!trimmed) return null;

  try {
    const result = await Promise.race([
      embedTexts([trimmed]).then(([vector]) => vector),
      timeout<null>(timeoutMs, null),
    ]);
    return result?.length ? result : null;
  } catch (error) {
    console.warn("[embeddings]", error);
    return null;
  }
}

export function isEmbeddingsAvailable(): boolean {
  return Boolean(process.env.OPENROUTER_API_KEY);
}
