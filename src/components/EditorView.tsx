import { lazy, Suspense, useCallback, useEffect, useRef, useState } from "react";
import Sidebar from "./Sidebar";
import Inspector from "./Inspector";
import Transport from "./Transport";
import StepGrid from "./StepGrid";
import Visualizer from "./Visualizer";
import VoicePanel from "./VoicePanel";
import IaStrip from "./IaStrip";

const CodeEditor = lazy(() => import("./CodeEditor"));
import { usePlayer } from "../lib/usePlayer";
import { audioEngine, DEFAULT_BPM, MIN_BPM, MAX_BPM } from "../lib/audioEngine";
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
  /** Mobile: secondary-controls sheet ("⋯") and collapsible steps panel. */
  const [more, setMore] = useState(false);
  const [showSteps, setShowSteps] = useState(false);
  /** The crates: AI adjustments over whatever is loaded in the editor. */
  const [iaOpen, setIaOpen] = useState(false);
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

  // The IA button lives inside the transport group, styled like the hero
  // actions — this feature deserves the spotlight.
  const iaButton = (
    <button
      onClick={() => setIaOpen((open) => !open)}
      title={t("ia.cratesTitle")}
      className={
        "px-4 py-1.5 text-xs font-bold uppercase tracking-widest transition-all " +
        (iaOpen
          ? "bg-mag text-black shadow-[0_0_14px_rgba(255,62,165,0.5)]"
          : "bg-acid text-black shadow-[3px_3px_0_#ff3ea5] hover:shadow-[1px_1px_0_#ff3ea5] hover:translate-x-[2px] hover:translate-y-[2px]")
      }
    >
      ◉ {t("nav.ia")}
    </button>
  );

  // Save / share / export controls, shared by the desktop toolbar and the
  // mobile "más controles" sheet (state is common, so both stay in sync).
  const actionControls = (
    <>
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
    </>
  );

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
        {/* Desktop toolbar: everything in one row. */}
        <div className="relative z-10 hidden lg:flex items-center justify-between gap-3 flex-wrap">
          <Transport
            playing={playing}
            onPlay={play}
            onStop={stop}
            onReset={reset}
            bpm={bpm}
            onBpmChange={onBpmChange}
            volume={volume}
            onVolumeChange={setVolume}
          >
            {iaButton}
          </Transport>
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
            {notice && <span className="text-[10px] text-acid">{notice}</span>}
            {actionControls}
            <span className="text-[10px] text-fog/70 select-none hidden xl:inline">
              ⌘/Ctrl+Enter ▶ · ⌘/Ctrl+. ■
            </span>
          </div>
        </div>

        {/* Mobile toolbar: only the essentials; the rest lives behind "⋯". */}
        <div className="relative z-10 flex lg:hidden items-center gap-2 flex-wrap">
          <Transport playing={playing} onPlay={play} onStop={stop} bpm={bpm}>
            {iaButton}
          </Transport>
          <button
            onClick={toggleAuto}
            title={t("auto.title")}
            className={
              "px-3 py-1.5 text-xs font-bold uppercase tracking-widest border transition-all " +
              (auto
                ? "bg-mag text-black border-mag shadow-[0_0_14px_rgba(255,62,165,0.4)]"
                : "border-mag/60 text-mag hover:bg-mag hover:text-black")
            }
          >
            {auto ? <span className="blink">⟳</span> : "⟳"}
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
          <button
            onClick={() => setMore((open) => !open)}
            title={t("ed.more")}
            aria-label={t("ed.more")}
            aria-expanded={more}
            className={
              "px-3 py-1.5 text-xs font-bold border transition-all " +
              (more
                ? "bg-acid text-black border-acid"
                : "border-white/15 text-fog hover:text-acid")
            }
          >
            ⋯
          </button>
          <button
            onClick={() => setPanel("snippets")}
            className="px-3 py-1.5 text-xs uppercase tracking-wider text-fog border border-white/15 hover:text-acid transition-all"
          >
            ≡
          </button>
          <button
            onClick={() => setPanel("help")}
            className="px-3 py-1.5 text-xs uppercase tracking-wider text-fog border border-white/15 hover:text-acid transition-all"
          >
            ?
          </button>
        </div>
        {notice && <div className="lg:hidden relative z-10 text-[10px] text-acid">{notice}</div>}

        {/* Mobile "más controles" sheet. */}
        {more && (
          <div className="relative z-10 lg:hidden flex flex-col gap-3 border border-white/10 bg-panel p-3">
            <label className="flex items-center gap-2 text-xs select-none">
              <span className="w-12 text-[10px] uppercase tracking-widest text-fog">Tempo</span>
              <input
                type="range"
                min={MIN_BPM}
                max={MAX_BPM}
                step={1}
                value={bpm}
                onChange={(e) => onBpmChange(Number(e.target.value))}
                className="flex-1 accent-acid"
              />
              <span className="w-16 text-right led">{bpm} BPM</span>
            </label>
            <label className="flex items-center gap-2 text-xs select-none">
              <span className="w-12 text-[10px] uppercase tracking-widest text-fog">Vol</span>
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={volume}
                onChange={(e) => setVolume(Number(e.target.value))}
                className="flex-1 accent-mag"
              />
            </label>
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={reset}
                className="px-3 py-1.5 text-xs uppercase tracking-widest border border-white/20 text-fog hover:border-white/60 hover:text-white transition-all"
              >
                ↺ Reset
              </button>
              {actionControls}
            </div>
            <VoicePanel />
          </div>
        )}

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

        {iaOpen && (
          <IaStrip
            code={code}
            bpm={bpm}
            playing={playing}
            volume={volume}
            onApply={(newCode, newBpm) => {
              onCodeChange(newCode);
              if (newBpm) onBpmChange(newBpm);
            }}
          />
        )}

        <div className="relative z-10 hidden lg:block">
          <VoicePanel />
        </div>

        <div className="relative z-10 shrink-0 max-h-56 overflow-y-auto border border-white/10 bg-panel p-3">
          <button
            onClick={() => setShowSteps((open) => !open)}
            aria-expanded={showSteps}
            className="lg:hidden w-full text-left text-[10px] uppercase tracking-[0.2em] text-fog hover:text-acid transition-all"
          >
            {t("ed.steps")} {showSteps ? "▴" : "▾"}
          </button>
          <div className="hidden lg:block text-[10px] uppercase tracking-[0.2em] text-fog mb-2">
            {t("ed.steps")}
          </div>
          <div className={(showSteps ? "block mt-2" : "hidden") + " lg:block lg:mt-0"}>
            <StepGrid
              lanes={parsed.lanes}
              step={step}
              laneGains={laneGains}
              onLaneGain={setLaneGain}
              locks={locks}
              onToggleLock={toggleLock}
            />
          </div>
        </div>
      </section>

      <Inspector className="hidden lg:block" warnings={parsed.warnings} />
    </div>
  );
}
