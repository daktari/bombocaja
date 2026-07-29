import { parsePattern } from "./parser";

/**
 * AUTO mode: small, musical, text-level mutations. The result is written
 * back into the editor so the user *sees* the pattern evolve — learning
 * by watching the machine live-code. Locked lanes are never touched, and
 * a mutation is discarded if it would introduce parser warnings.
 */

export interface Mutation {
  code: string;
  /** Human-readable description, e.g. "hh → <hh ho>" */
  change: string;
}

const DRUMS = ["bd", "sn", "hh", "ho", "cp", "rm", "cb", "lt", "mt", "ht"];
const NOTES = ["c", "d", "e", "f", "g", "a", "b", "c5", "d5", "e5", "g5"];

const RE_DRUM = /^(bd|sn|hh|ho|cp|rm|cb|lt|mt|ht)(:\d+)?$/;
const RE_VOICE = /^v[1-8]$/;
const RE_NOTE = /^[a-g]#?\d?$/;
const RE_DEGREE = /^-?\d{1,2}$/;
const RE_PROBBED = /^(.+)\?$/;

const rand = <T,>(list: T[]): T => list[Math.floor(Math.random() * list.length)];

function mutateToken(token: string, melodic: boolean, soundCount: number): string | null {
  const probbed = RE_PROBBED.exec(token);
  if (probbed && Math.random() < 0.5) return probbed[1]; // calm it down

  if (token === "~") {
    return melodic ? rand(NOTES) : rand(DRUMS); // fill a silence
  }

  if (RE_DEGREE.test(token)) {
    const n = parseInt(token, 10) + rand([-2, -1, 1, 2]);
    return String(Math.max(-3, Math.min(9, n)));
  }

  if (RE_NOTE.test(token) && melodic) {
    return Math.random() < 0.3 ? `<${token} ${rand(NOTES)}>` : rand(NOTES);
  }

  const drum = RE_DRUM.exec(token);
  const isVoice = RE_VOICE.test(token);
  if (drum || isVoice) {
    const base = drum ? drum[1] : token;
    const roll = Math.random();
    if (roll < 0.2 && soundCount > 2) return "~"; // thin out
    if (roll < 0.4 && drum) return rand(DRUMS.filter((d) => d !== base));
    if (roll < 0.55) return `${token}?`;
    if (roll < 0.7) return `[${token} ${token}]`;
    if (roll < 0.85 && drum) return `${base}:${Math.floor(Math.random() * 10)}`;
    return `<${token} ${drum ? rand(DRUMS) : token}>`;
  }

  return null; // complex token (brackets, mods) — leave it alone
}

function mutateLine(line: string): { line: string; change: string } | null {
  const commentIndex = line.indexOf("--");
  const comment = commentIndex >= 0 ? line.slice(commentIndex).trim() : null;
  const codePart = commentIndex >= 0 ? line.slice(0, commentIndex) : line;
  const parts = codePart.split("|");
  const pattern = parts[0];
  const tokens = pattern.trim().split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return null;

  const melodic = tokens.some((tok) => RE_NOTE.test(tok) || RE_DEGREE.test(tok));
  const soundCount = tokens.filter((tok) => tok !== "~").length;

  // try a few random tokens until one accepts a mutation
  for (let attempt = 0; attempt < 6; attempt++) {
    const index = Math.floor(Math.random() * tokens.length);
    const mutated = mutateToken(tokens[index], melodic, soundCount);
    if (mutated === null || mutated === tokens[index]) continue;
    const change = `${tokens[index]} → ${mutated}`;
    const next = [...tokens];
    next[index] = mutated;
    const rebuilt =
      [next.join(" "), ...parts.slice(1).map((p) => p.trim())].join(" | ") +
      (comment ? " " + comment : "");
    return { line: rebuilt, change };
  }
  return null;
}

/** Mutate one random unlocked lane of `code`. Null if nothing safe to do. */
export function mutateCode(code: string, locks: boolean[]): Mutation | null {
  const lines = code.split("\n");
  const laneLines: number[] = [];
  lines.forEach((raw, i) => {
    const line = raw.trim();
    if (line !== "" && !line.startsWith("--")) laneLines.push(i);
  });
  const candidates = laneLines.filter((_, laneIndex) => !locks[laneIndex]);
  if (candidates.length === 0) return null;

  const baseline = parsePattern(code).warnings.length;

  for (let attempt = 0; attempt < 8; attempt++) {
    const lineIndex = rand(candidates);
    const result = mutateLine(lines[lineIndex]);
    if (!result) continue;
    const nextLines = [...lines];
    nextLines[lineIndex] = result.line;
    const nextCode = nextLines.join("\n");
    if (parsePattern(nextCode).warnings.length > baseline) continue;
    return { code: nextCode, change: result.change };
  }
  return null;
}
