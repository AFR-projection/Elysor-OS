/**
 * Extracts the visible `text` field from a streaming JSON (or plain text) response
 * so the UI can show live tokens without flashing raw JSON.
 */
export class StreamingTextExtractor {
  private raw = "";
  private emitted = 0;
  private mode: "detect" | "json" | "plain" = "detect";
  private textValueStart = -1;

  push(delta: string): string {
    if (!delta) return "";
    this.raw += delta;

    if (this.mode === "detect") {
      const sample = this.raw.trimStart().slice(0, 48);
      if (sample.startsWith("{") || sample.startsWith("```")) {
        this.mode = "json";
      } else if (this.raw.length >= 24 && !sample.startsWith("{")) {
        this.mode = "plain";
      }
    }

    if (this.mode === "plain") {
      const next = this.raw.slice(this.emitted);
      this.emitted = this.raw.length;
      return next;
    }

    if (this.mode === "json") {
      return this.extractJsonTextDelta();
    }

    return "";
  }

  get hasExtractedText(): boolean {
    return this.emitted > 0;
  }

  private extractJsonTextDelta(): string {
    if (this.textValueStart < 0) {
      const keyMatch = this.raw.match(/"text"\s*:/);
      if (!keyMatch || keyMatch.index === undefined) return "";

      let i = keyMatch.index + keyMatch[0].length;
      while (i < this.raw.length && /\s/.test(this.raw[i]!)) i++;
      if (this.raw[i] !== '"') return "";

      this.textValueStart = i + 1;
    }

    let i = this.textValueStart;
    let decoded = "";

    while (i < this.raw.length) {
      const ch = this.raw[i]!;

      if (ch === '"') {
        const segment = decoded.slice(this.emitted);
        this.emitted = decoded.length;
        return segment;
      }

      if (ch === "\\") {
        if (i + 1 >= this.raw.length) break;
        const esc = this.raw[i + 1]!;
        switch (esc) {
          case '"':
            decoded += '"';
            break;
          case "\\":
            decoded += "\\";
            break;
          case "n":
            decoded += "\n";
            break;
          case "r":
            decoded += "\r";
            break;
          case "t":
            decoded += "\t";
            break;
          case "/":
            decoded += "/";
            break;
          default:
            decoded += esc;
        }
        i += 2;
        continue;
      }

      decoded += ch;
      i++;
    }

    const segment = decoded.slice(this.emitted);
    this.emitted = decoded.length;
    return segment;
  }
}

/** Character batches for fallback / replay paths (avoid per-char SSE flood). */
export function* chunkTextForStream(text: string, size = 8): Generator<string> {
  for (let i = 0; i < text.length; i += size) {
    yield text.slice(i, i + size);
  }
}
