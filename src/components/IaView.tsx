import { useEffect, useRef, useState } from "react";
import { usePlayer } from "../lib/usePlayer";
import { parsePattern } from "../lib/parser";
import { DEFAULT_BPM } from "../lib/audioEngine";
import {
  extractBpm,
  iaConsumeUse,
  iaUsesLeft,
  playableSlice,
  sanitizeIaCode,
  streamGeneration,
} from "../lib/ia";
import Visualizer from "./Visualizer";
import { t } from "../lib/i18n";

type Phase = "idle" | "streaming" | "done" | "closed" | "error";

const EXAMPLES = [
  "un techno berlinés duro y seco",
  "house cálido con piano",
  "algo tranquilo para estudiar",
  "acid house rápido",
  "un ritmo que suene a lluvia",
];

const ADJUST_EXAMPLES = [
  "añádele más groove",
  "más oscuro y lento",
  "quita el piano",
  "dobla los hats",
  "métele acid",
];

/**
 * The IA tab: natural language in, a playing pattern out. Tokens stream
 * straight into view (the pattern types itself) and playback starts as soon
 * as the first line parses — latency becomes performance, not waiting.
 */
export default function IaView({ onOpen }: { onOpen: (code: string, bpm?: number) => void }) {
  const [prompt, setPrompt] = useState("");
  const [raw, setRaw] = useState("");
  const [code, setCode] = useState("");
  const [bpm, setBpm] = useState(DEFAULT_BPM);
  const [phase, setPhase] = useState<Phase>("idle");
  const [left, setLeft] = useState(() => iaUsesLeft());
  const startedRef = useRef(false);
  const abortRef = useRef<AbortController | null>(null);

  const { playing, play, stop } = usePlayer(code, { bpm });

  // leaving the tab stops both the stream and the sound
  useEffect(
    () => () => {
      abortRef.current?.abort();
      stop();
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const applyText = (accumulated: string) => {
    setRaw(accumulated);
    const playable = playableSlice(accumulated);
    if (playable === "") return;
    const { lanes, warnings } = parsePattern(playable);
    if (lanes.length === 0 || warnings.length > 0) return;
    setCode(playable);
    const announced = extractBpm(playable);
    if (announced) setBpm(announced);
    if (!startedRef.current) {
      startedRef.current = true;
      play();
    }
  };

  const generate = async (mode: "new" | "adjust" = "new") => {
    const wish = prompt.trim();
    if (!wish || phase === "streaming") return;
    if (iaUsesLeft() <= 0) {
      setPhase("closed");
      return;
    }
    // vibe-coding: the current pattern travels along and gets rewritten
    const base = mode === "adjust" && code ? code : undefined;
    iaConsumeUse();
    setLeft(iaUsesLeft());
    setPhase("streaming");
    setRaw("");
    setCode("");
    startedRef.current = false;
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      let text = await streamGeneration(wish, applyText, {
        code: base,
        signal: controller.signal,
      });
      let final = sanitizeIaCode(text);
      let parsed = parsePattern(final);

      // one silent retry: hand the parser's complaints back to the model
      if ((parsed.lanes.length === 0 || parsed.warnings.length > 0) && iaUsesLeft() > 0) {
        const complaints =
          parsed.warnings.length > 0
            ? parsed.warnings
            : ["todas las líneas son solo silencios (~): no suena nada — pon sonidos y notas"];
        iaConsumeUse();
        setLeft(iaUsesLeft());
        text = await streamGeneration(wish, applyText, {
          code: base,
          fix: { code: text, warnings: complaints },
          signal: controller.signal,
        });
        final = sanitizeIaCode(text);
        parsed = parsePattern(final);
      }

      if (parsed.lanes.length === 0) {
        if (base) setCode(base); // a failed adjust must not eat the pattern
        setPhase("error");
        return;
      }
      setCode(final);
      const announced = extractBpm(final);
      if (announced) setBpm(announced);
      if (!startedRef.current) {
        startedRef.current = true;
        play();
      }
      setPhase("done");
    } catch (err) {
      if (controller.signal.aborted) return;
      if (base) setCode(base); // a failed adjust must not eat the pattern
      setPhase(err instanceof Error && err.message === "cerrado" ? "closed" : "error");
    }
  };

  const display = phase === "streaming" ? sanitizeIaCode(raw) || raw : code;

  return (
    <div className="flex-1 overflow-y-auto p-5 md:p-7 relative min-w-0">
      <Visualizer />
      <div className="relative z-10 max-w-3xl mx-auto">
        <h1 className="text-2xl md:text-3xl uppercase tracking-wide led mb-2">{t("ia.title")}</h1>
        <p className="text-xs text-fog leading-relaxed max-w-lg mb-5">{t("ia.sub")}</p>

        <div className="flex gap-2">
          <input
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") void generate(code ? "adjust" : "new");
            }}
            maxLength={280}
            placeholder={code ? t("ia.adjustPlaceholder") : t("ia.placeholder")}
            className="flex-1 px-3 py-2.5 text-sm bg-black border border-acid/40 outline-none text-acid placeholder-fog focus:border-acid transition-all"
          />
          {code && (
            <button
              onClick={() => void generate("adjust")}
              disabled={phase === "streaming" || !prompt.trim()}
              className="px-5 py-2.5 text-xs font-bold uppercase tracking-widest text-black bg-acid shadow-[4px_4px_0_#ff3ea5] hover:shadow-[2px_2px_0_#ff3ea5] hover:translate-x-[2px] hover:translate-y-[2px] transition-all disabled:opacity-50 disabled:shadow-none"
            >
              {phase === "streaming" ? (
                <span className="blink">{t("ia.generating")}</span>
              ) : (
                t("ia.adjust")
              )}
            </button>
          )}
          <button
            onClick={() => void generate("new")}
            disabled={phase === "streaming" || !prompt.trim()}
            className={
              code
                ? "px-4 py-2.5 text-xs uppercase tracking-widest border border-white/20 text-fog hover:border-acid/60 hover:text-acid transition-all disabled:opacity-50"
                : "px-5 py-2.5 text-xs font-bold uppercase tracking-widest text-black bg-acid shadow-[4px_4px_0_#ff3ea5] hover:shadow-[2px_2px_0_#ff3ea5] hover:translate-x-[2px] hover:translate-y-[2px] transition-all disabled:opacity-50 disabled:shadow-none"
            }
          >
            {phase === "streaming" && !code ? (
              <span className="blink">{t("ia.generating")}</span>
            ) : code ? (
              t("ia.fresh")
            ) : (
              t("ia.generate")
            )}
          </button>
        </div>

        <div className="flex gap-2 flex-wrap mt-3">
          {(code ? ADJUST_EXAMPLES : EXAMPLES).map((example) => (
            <button
              key={example}
              onClick={() => setPrompt(example)}
              className="px-2.5 py-1 text-[10px] border border-white/15 text-fog hover:text-acid hover:border-acid/60 transition-all"
            >
              {example}
            </button>
          ))}
          <span className="ml-auto text-[10px] text-fog/70 self-center">
            {prompt.length > 0 && <span className="mr-3">{prompt.length}/280</span>}
            {t("ia.left", { n: left })}
          </span>
        </div>

        {phase === "closed" && (
          <p className="mt-5 px-3 py-2.5 border border-mag/50 text-mag text-xs">{t("ia.closed")}</p>
        )}
        {phase === "error" && (
          <p className="mt-5 px-3 py-2.5 border border-red-500/50 text-red-400 text-xs">
            {t("ia.error")}
          </p>
        )}

        {display && (
          <pre className="mt-5 px-4 py-3 bg-black/70 border border-acid/25 text-[13px] leading-relaxed text-acid whitespace-pre-wrap break-words min-h-[8rem]">
            {display}
            {phase === "streaming" && <span className="blink">▮</span>}
          </pre>
        )}

        {code && (
          <div className="flex items-center gap-2.5 flex-wrap mt-4">
            <button
              onClick={playing ? stop : play}
              className={
                "px-5 py-2 text-xs font-bold uppercase tracking-widest border transition-all " +
                (playing
                  ? "border-mag text-mag hover:bg-mag hover:text-black"
                  : "border-acid text-acid hover:bg-acid hover:text-black")
              }
            >
              {playing ? "■ Stop" : "▶ Play"}
            </button>
            <span className="px-2.5 py-1 border border-acid/40 text-[10px] uppercase tracking-widest led">
              {bpm} bpm
            </span>
            <button
              onClick={() => onOpen(code, bpm)}
              className="ml-auto px-5 py-2 text-xs font-bold uppercase tracking-widest border border-mag text-mag hover:bg-mag hover:text-black transition-all"
            >
              {t("ia.open")}
            </button>
          </div>
        )}

        <p className="mt-6 text-[10px] text-fog/70 leading-relaxed max-w-md">{t("ia.note")}</p>
      </div>
    </div>
  );
}
