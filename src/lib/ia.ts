import { parsePattern } from "./parser";
import { MIN_BPM, MAX_BPM } from "./audioEngine";

/**
 * Client side of the IA tab. The model streams tokens over SSE; these
 * helpers turn that raw text into something playable (and keep chatty
 * models honest by dropping every line the parser doesn't accept).
 */

/** Strip markdown fences and prose: keep only lines the parser accepts. */
export function sanitizeIaCode(raw: string): string {
  let text = raw;
  const fence = raw.match(/```(?:\w*\n)?([\s\S]*?)(?:```|$)/);
  if (fence) text = fence[1];
  const lines = text.split("\n").map((line) => line.trimEnd());
  const kept = lines.filter((line) => {
    const trimmed = line.trim();
    if (trimmed === "" || trimmed.startsWith("--")) return true;
    const { lanes, warnings } = parsePattern(line);
    return lanes.length > 0 && warnings.length === 0;
  });
  return kept.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

/** While streaming, the last line may be half-written — play all but it. */
export function playableSlice(streamed: string): string {
  const lines = streamed.split("\n");
  lines.pop();
  return sanitizeIaCode(lines.join("\n"));
}

/** The model announces tempo as a comment: `-- bpm 128`. */
export function extractBpm(code: string): number | undefined {
  const match = code.match(/--\s*bpm\s+(\d{2,3})/i);
  if (!match) return undefined;
  return Math.min(MAX_BPM, Math.max(MIN_BPM, parseInt(match[1], 10)));
}

// ------------------------------------------------------------- daily quota
// Client-side courtesy limit so one enthusiast doesn't drain the free
// Workers AI allocation for everyone before noon.

export const IA_DAILY_LIMIT = 10;
const QUOTA_KEY = "bombocaja.ia";

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export function iaUsesLeft(): number {
  if (typeof localStorage === "undefined") return IA_DAILY_LIMIT;
  const raw = localStorage.getItem(QUOTA_KEY);
  if (!raw) return IA_DAILY_LIMIT;
  const [day, count] = raw.split(":");
  if (day !== today()) return IA_DAILY_LIMIT;
  return Math.max(0, IA_DAILY_LIMIT - (parseInt(count, 10) || 0));
}

export function iaConsumeUse(): void {
  if (typeof localStorage === "undefined") return;
  const used = IA_DAILY_LIMIT - iaUsesLeft();
  localStorage.setItem(QUOTA_KEY, `${today()}:${used + 1}`);
}

// ---------------------------------------------------------------- streaming

export interface FixPayload {
  code: string;
  warnings: string[];
}

/**
 * POST to the worker and hand each accumulated text snapshot to `onText`.
 * Throws "cerrado" when the free daily allocation ran out (503).
 */
export async function streamGeneration(
  prompt: string,
  onText: (accumulated: string) => void,
  options: { fix?: FixPayload; signal?: AbortSignal } = {}
): Promise<string> {
  const res = await fetch("/api/generar", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ prompt, fix: options.fix }),
    signal: options.signal,
  });
  if (res.status === 503) throw new Error("cerrado");
  if (!res.ok || !res.body) throw new Error("error");

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let text = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const events = buffer.split("\n\n");
    buffer = events.pop() ?? "";
    for (const event of events) {
      for (const line of event.split("\n")) {
        if (!line.startsWith("data: ")) continue;
        const payload = line.slice(6).trim();
        if (payload === "[DONE]") continue;
        try {
          const parsed = JSON.parse(payload) as { response?: string };
          if (typeof parsed.response === "string") {
            text += parsed.response;
            onText(text);
          }
        } catch {
          // partial JSON in a torn chunk — ignored, the buffer catches up
        }
      }
    }
  }
  return text;
}
