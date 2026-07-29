import { lazy, Suspense, useCallback, useEffect, useRef, useState } from "react";
import Sidebar from "./Sidebar";
import Inspector from "./Inspector";
import Transport from "./Transport";
import StepGrid from "./StepGrid";
import Visualizer from "./Visualizer";
import VoicePanel from "./VoicePanel";

const CodeEditor = lazy(() => import("./CodeEditor"));
import { usePlayer } from "../lib/usePlayer";
import { audioEngine, DEFAULT_BPM } from "../lib/audioEngine";
import { addPattern } from "../lib/storage";
import { patternUrl } from "../lib/share";
import { mutateCode } from "../lib/auto";
import { t } from "../lib/i18n";

export const DEFAULT_CODE = "-- drums\nbd ~ sn ~\n\n-- hats\nhh hh ho hh";

interface Props {
  code: string;
  onCodeChange: (code: string) => void;
  bpm: number;
  onBpmChange: (bpm: number) => void;
}

export default function EditorView({ code, onCodeChange, bpm, onBpmChange }: Props) {
  const [volume, setVolume] = useState(0.9);
  const [laneGains, setLaneGains] = useState<number[]>([]);
  const [saveOpen, setSaveOpen] = useState(false);
  const [saveName, setSaveName] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  /** Mobile-only overlay panel (snippets / help) */
  const [panel, setPanel] = useState<"snippets" | "help" | null>(null);
  /** AUTO mode: the app mutates unlocked lanes while playing. */
  const [auto, setAuto] = useState(false);
  const [locks, setLocks] = useState<boolean[]>([]);
  const [autoTrail, setAutoTrail] = useState<string[]>([]);
  const [exportBars, setExportBars] = useState(4);
  const lastMutation = useRef(-1);

  const flashFn = useRef<((from: number, to: number) => void) | null>(null);
  const registerFlash = useCallback((fn: (from: number, to: number) => void) => {
    flashFn.current = fn;
  }, []);

  const { playing, step, parsed, play, stop } = usePlayer(code, {
    bpm,
    volume,
    laneGains,
    onFlash: (from, to) => flashFn.current?.(from, to),
  });

  // AUTO: one small mutation every 4 loops of the base grid (32 steps).
  useEffect(() => {
    if (!auto || !playing || step <= 0) return;
    if (step % 32 !== 0 || step === lastMutation.current) return;
    lastMutation.current = step;
    const mutation = mutateCode(code, locks);
    if (mutation) {
      setAutoTrail((trail) => [...trail.slice(-19), code]);
      onCodeChange(mutation.code);
      flash(`auto: ${mutation.change}`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  const toggleAuto = () => {
    if (auto) {
      setAuto(false);
      setAutoTrail([]);
    } else {
      setAuto(true);
      if (!playing) play();
    }
  };

  const undoAuto = () => {
    setAutoTrail((trail) => {
      const previous = trail[trail.length - 1];
      if (previous !== undefined) onCodeChange(previous);
      return trail.slice(0, -1);
    });
  };

  const toggleLock = (laneIndex: number) => {
    setLocks((prev) => {
      const next = [...prev];
      next[laneIndex] = !next[laneIndex];
      return next;
    });
  };

  const setLaneGain = (laneIndex: number, gain: number) => {
    setLaneGains((prev) => {
      const next = [...prev];
      next[laneIndex] = gain;
      return next;
    });
  };

  const loadSnippet = (snippetCode: string, snippetBpm?: number) => {
    onCodeChange(snippetCode);
    onBpmChange(snippetBpm ?? DEFAULT_BPM);
  };

  const reset = () => {
    onCodeChange(DEFAULT_CODE);
    onBpmChange(DEFAULT_BPM);
    setVolume(0.9);
    setLaneGains([]);
  };

  const flash = (message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice((current) => (current === message ? null : current)), 1800);
  };

  const confirmSave = () => {
    addPattern(saveName.trim() || t("ed.defaultName"), code, bpm);
    setSaveOpen(false);
    setSaveName("");
    flash(t("ed.saved"));
  };

  const copyLink = async () => {
    await navigator.clipboard.writeText(patternUrl(code, bpm));
    flash(t("ed.copied"));
  };

  const exportWav = async () => {
    if (exporting) return;
    setExporting(true);
    try {
      const blob = await audioEngine.renderWav(parsed.lanes, exportBars * 8);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "bakaluti.wav";
      a.click();
      URL.revokeObjectURL(url);
      flash(t("ed.exported"));
    } catch {
      flash(t("ed.exportError"));
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="flex flex-1 min-h-0 relative">
      {panel && (
        <div
          className={
            "lg:hidden absolute inset-0 z-40 flex " + (panel === "help" ? "flex-row-reverse" : "")
          }
        >
          {panel === "snippets" ? (
            <Sidebar
              className="h-full shadow-[6px_0_24px_rgba(0,0,0,0.6)]"
              onSelect={(c, b) => {
                loadSnippet(c, b);
                setPanel(null);
              }}
            />
          ) : (
            <Inspector className="h-full shadow-[-6px_0_24px_rgba(0,0,0,0.6)]" warnings={parsed.warnings} />
          )}
          <div className="flex-1 bg-black/60" onClick={() => setPanel(null)} />
        </div>
      )}

      <Sidebar className="hidden lg:block" onSelect={loadSnippet} />

      <section className="flex-1 flex flex-col p-3 lg:p-4 gap-3 lg:gap-4 min-w-0 relative">
        <Visualizer />
        <div className="relative z-10 flex items-center justify-between gap-3 flex-wrap">
          <Transport
            playing={playing}
            onPlay={play}
            onStop={stop}
            onReset={reset}
            bpm={bpm}
            onBpmChange={onBpmChange}
            volume={volume}
            onVolumeChange={setVolume}
          />
          <button
            onClick={toggleAuto}
            title={t("auto.title")}
            className={
              "px-4 py-1.5 text-xs font-bold uppercase tracking-widest border transition-all " +
              (auto
                ? "bg-mag text-black border-mag shadow-[0_0_14px_rgba(255,62,165,0.4)]"
                : "border-mag/60 text-mag hover:bg-mag hover:text-black")
            }
          >
            {auto ? <span className="blink">⟳ auto</span> : "⟳ auto"}
          </button>
          {auto && autoTrail.length > 0 && (
            <button
              onClick={undoAuto}
              title={t("ed.undoAuto")}
              aria-label={t("ed.undoAuto")}
              className="px-3 py-1.5 text-xs uppercase tracking-widest border border-mag/40 text-mag/80 hover:bg-mag hover:text-black transition-all"
            >
              ↺ {autoTrail.length}
            </button>
          )}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setPanel("snippets")}
              className="lg:hidden px-3 py-1.5 text-xs uppercase tracking-wider text-fog border border-white/15 hover:text-acid transition-all"
            >
              ≡ Snippets
            </button>
            <button
              onClick={() => setPanel("help")}
              className="lg:hidden px-3 py-1.5 text-xs uppercase tracking-wider text-fog border border-white/15 hover:text-acid transition-all"
            >
              {t("ed.help")}
            </button>
            {notice && <span className="text-[10px] text-acid">{notice}</span>}
            {saveOpen ? (
              <span className="flex items-center gap-1">
                <input
                  autoFocus
                  value={saveName}
                  onChange={(e) => setSaveName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") confirmSave();
                    if (e.key === "Escape") setSaveOpen(false);
                  }}
                  placeholder={t("ed.savePlaceholder")}
                  className="w-36 px-2 py-1.5 text-xs bg-black border border-acid/40 outline-none text-acid placeholder-fog"
                />
                <button
                  onClick={confirmSave}
                  className="px-2 py-1.5 text-xs text-acid border border-acid/40 hover:bg-acid hover:text-black transition-all"
                >
                  ✓
                </button>
              </span>
            ) : (
              <button
                onClick={() => setSaveOpen(true)}
                className="px-3 py-1.5 text-xs uppercase tracking-wider text-slate-300 border border-white/15 hover:border-acid/60 hover:text-acid transition-all"
              >
                {t("ed.save")}
              </button>
            )}
            <button
              onClick={() => void copyLink()}
              className="px-3 py-1.5 text-xs uppercase tracking-wider text-slate-300 border border-white/15 hover:border-acid/60 hover:text-acid transition-all"
            >
              {t("ed.share")}
            </button>
            <select
              value={exportBars}
              onChange={(e) => setExportBars(Number(e.target.value))}
              aria-label={t("ed.bars")}
              title={t("ed.bars")}
              className="px-1 py-1.5 text-xs bg-black border border-white/15 text-fog outline-none"
            >
              {[2, 4, 8].map((n) => (
                <option key={n} value={n}>
                  {n}c
                </option>
              ))}
            </select>
            <button
              onClick={() => void exportWav()}
              disabled={exporting}
              className="px-3 py-1.5 text-xs uppercase tracking-wider border border-red-500/50 text-red-400 hover:bg-red-500 hover:text-black transition-all disabled:opacity-60"
            >
              {exporting ? (
                <span className="blink">● REC…</span>
              ) : (
                <span>
                  <span className="text-red-500">●</span> Rec
                </span>
              )}
            </button>
            <span className="text-[10px] text-fog/70 select-none hidden xl:inline">
              ⌘/Ctrl+Enter ▶ · ⌘/Ctrl+. ■
            </span>
          </div>
        </div>

        <Suspense
          fallback={
            <div className="relative z-10 flex-1 min-h-0 bg-black/70 border border-acid/25 flex items-center justify-center text-xs text-fog">
              …
            </div>
          }
        >
          <CodeEditor
            value={code}
            onChange={onCodeChange}
            onPlay={play}
            onStop={stop}
            registerFlash={registerFlash}
            className="relative z-10 flex-1 min-h-0 overflow-hidden bg-black/70 backdrop-blur-sm border border-acid/25 focus-within:border-acid/60 focus-within:shadow-[4px_4px_0_rgba(200,255,0,0.15)] transition-all"
          />
        </Suspense>

        <div className="relative z-10">
          <VoicePanel />
        </div>

        <div className="relative z-10 shrink-0 max-h-56 overflow-y-auto border border-white/10 bg-panel p-3">
          <div className="text-[10px] uppercase tracking-[0.2em] text-fog mb-2">{t("ed.steps")}</div>
          <StepGrid
            lanes={parsed.lanes}
            step={step}
            laneGains={laneGains}
            onLaneGain={setLaneGain}
            locks={locks}
            onToggleLock={toggleLock}
          />
        </div>
      </section>

      <Inspector className="hidden lg:block" warnings={parsed.warnings} />
    </div>
  );
}
