import { useEffect, useRef, useState } from "react";
import { usePlayer } from "../lib/usePlayer";
import { audioEngine } from "../lib/audioEngine";
import { radioAt, CHANNELS, SLOT_SECONDS, type Dial, type OnAir } from "../lib/radio";
import Visualizer from "./Visualizer";
import { t } from "../lib/i18n";

const nowSeconds = () => Math.floor(Date.now() / 1000);
const mmss = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

/**
 * The station console. The broadcast is a pure function of the clock:
 * every listener computes the same track for the same moment. Tuning in
 * starts the engine; slot and arrangement changes flow through the live
 * pattern update, so transitions are seamless DJ cuts.
 */
export default function FmView({ onRemix }: { onRemix: (code: string, bpm?: number) => void }) {
  const [dial, setDial] = useState<Dial>("fm");
  const [tuned, setTuned] = useState(false);
  const [air, setAir] = useState<OnAir>(() => radioAt("fm", nowSeconds()));

  const code = air.track.states[Math.min(air.stateIndex, air.track.states.length - 1)];
  const { playing, play, stop } = usePlayer(code, { bpm: air.track.bpm });

  // radio fade: wind the volume down at the slot's tail, back up on the new
  // track — the honest cousin of a crossfade with a single deck
  const fadeState = useRef<{ fadedSlot: number; live: boolean }>({ fadedSlot: -1, live: false });
  fadeState.current.live = tuned && playing;

  // the clock drives everything — recomputing also resyncs after background
  useEffect(() => {
    const tick = () => {
      const next = radioAt(dial, nowSeconds());
      setAir((prev) => {
        if (fadeState.current.live) {
          if (next.secondsLeft <= 4 && fadeState.current.fadedSlot !== next.slot) {
            fadeState.current.fadedSlot = next.slot;
            audioEngine.fadeTo(0.08, 3);
          } else if (prev.slot !== next.slot) {
            audioEngine.fadeTo(0.9, 1.5);
          }
        }
        return next;
      });
    };
    tick();
    const interval = window.setInterval(tick, 1000);
    const onVisible = () => tick();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [dial]);

  const tune = () => {
    setTuned(true);
    play();
  };

  const mute = () => {
    setTuned(false);
    stop();
    audioEngine.setVolume(0.9);
  };

  // leaving the FM tab must not leave the master faded
  useEffect(() => () => audioEngine.setVolume(0.9), []);

  const switchDial = (next: Dial) => {
    if (next === dial) return;
    setDial(next);
    setAir(radioAt(next, nowSeconds()));
  };

  const upNext = radioAt(dial, (air.slot + 1) * SLOT_SECONDS + 1);
  const live = tuned && playing;

  return (
    <div className="flex flex-1 min-h-0">
      {/* rail */}
      <aside className="hidden md:block w-56 border-r border-white/10 bg-panel p-4 space-y-6 overflow-y-auto shrink-0">
        <section>
          <h3 className="text-[10px] uppercase tracking-[0.25em] text-fog mb-2">{t("fm.dial")}</h3>
          <button
            onClick={() => switchDial("fm")}
            className={
              "block w-full text-left px-3 py-2.5 mb-2 border text-xs uppercase tracking-widest transition-all " +
              (dial === "fm"
                ? "border-acid text-acid bg-acid/5 shadow-[3px_3px_0_rgba(200,255,0,0.2)]"
                : "border-white/15 text-fog hover:text-acid")
            }
          >
            ▸ bakaluti FM
            <small className="block text-[9px] normal-case tracking-normal text-fog mt-0.5">
              {t("fm.dialFmDesc")}
            </small>
          </button>
          <button
            onClick={() => switchDial("niebla")}
            className={
              "block w-full text-left px-3 py-2.5 border text-xs uppercase tracking-widest transition-all " +
              (dial === "niebla"
                ? "border-acid text-acid bg-acid/5 shadow-[3px_3px_0_rgba(200,255,0,0.2)]"
                : "border-white/15 text-fog hover:text-acid")
            }
          >
            niebla FM
            <small className="block text-[9px] normal-case tracking-normal text-fog mt-0.5">
              {t("fm.dialNieblaDesc")}
            </small>
          </button>
        </section>

        <section>
          <h3 className="text-[10px] uppercase tracking-[0.25em] text-fog mb-2">{t("fm.next")}</h3>
          <div className="border border-white/10 px-3 py-2">
            <b className="block text-[11px] font-normal text-slate-200">{upNext.track.title}</b>
            <span className="text-[9px] uppercase tracking-wider text-fog">
              {CHANNELS[upNext.track.style]} · {upNext.track.bpm} bpm ·{" "}
              {t("fm.in")} {mmss(air.secondsLeft)}
            </span>
          </div>
        </section>
      </aside>

      {/* stage */}
      <main className="flex-1 p-5 md:p-7 relative overflow-y-auto min-w-0">
        <Visualizer />
        <div className="relative z-10 max-w-3xl">
          {/* mobile dial */}
          <div className="md:hidden flex gap-2 mb-4">
            <button
              onClick={() => switchDial("fm")}
              className={
                "flex-1 px-3 py-2 border text-[11px] uppercase tracking-widest transition-all " +
                (dial === "fm" ? "border-acid text-acid bg-acid/5" : "border-white/15 text-fog")
              }
            >
              bakaluti FM
            </button>
            <button
              onClick={() => switchDial("niebla")}
              className={
                "flex-1 px-3 py-2 border text-[11px] uppercase tracking-widest transition-all " +
                (dial === "niebla" ? "border-acid text-acid bg-acid/5" : "border-white/15 text-fog")
              }
            >
              niebla FM
            </button>
          </div>

          <div className="flex items-center gap-2.5 text-[10px] uppercase tracking-[0.3em]">
            {live ? (
              <>
                <span className="w-2.5 h-2.5 bg-acid blink shadow-[0_0_10px_#c8ff00]" />
                <span className="text-acid">{t("fm.live")}</span>
              </>
            ) : (
              <span className="text-fog">{t("fm.off")}</span>
            )}
            <span className="ml-auto text-fog tracking-[0.15em]">slot #{air.slot}</span>
          </div>

          <h1 className="text-2xl md:text-3xl uppercase tracking-wide led mt-4 mb-2 text-wrap-balance">
            {air.track.title}
          </h1>
          <div className="flex gap-2 flex-wrap text-[10px] uppercase tracking-widest">
            <span className="px-2.5 py-1 border border-mag/50 text-mag">
              {CHANNELS[air.track.style]}
            </span>
            <span className="px-2.5 py-1 border border-acid/40 led">{air.track.bpm} bpm</span>
            {air.isAnchor && (
              <span className="px-2.5 py-1 border border-white/15 text-fog">{t("fm.anchor")}</span>
            )}
          </div>

          <div className="h-[3px] bg-white/10 mt-5">
            <div
              className="h-full bg-acid shadow-[0_0_8px_rgba(200,255,0,0.6)]"
              style={{ width: `${(air.secondsIntoSlot / SLOT_SECONDS) * 100}%` }}
            />
          </div>
          <div className="flex justify-between text-[9px] uppercase tracking-widest text-fog mt-1">
            <span>{mmss(air.secondsIntoSlot)}</span>
            <span>
              {t("fm.left")} {mmss(air.secondsLeft)}
            </span>
          </div>

          <div className="mt-5 bg-black border border-acid/25 overflow-x-auto">
            <pre className="px-4 py-3 text-[13px] leading-relaxed text-acid">{code}</pre>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap mt-5">
            {live ? (
              <button
                onClick={mute}
                className="px-5 py-2 text-xs font-bold uppercase tracking-widest border border-mag text-mag hover:bg-mag hover:text-black transition-all"
              >
                {t("fm.mute")}
              </button>
            ) : (
              <button
                onClick={tune}
                className="px-8 py-2.5 text-sm font-bold uppercase tracking-widest text-black bg-acid shadow-[5px_5px_0_#ff3ea5] hover:shadow-[2px_2px_0_#ff3ea5] hover:translate-x-[3px] hover:translate-y-[3px] transition-all"
              >
                {t("fm.tune")}
              </button>
            )}
            <button
              onClick={() => onRemix(air.track.code, air.track.bpm)}
              className="ml-auto px-5 py-2 text-xs font-bold uppercase tracking-widest border border-mag text-mag hover:bg-mag hover:text-black transition-all"
            >
              {t("fm.remix")}
            </button>
          </div>

          <p className="md:hidden mt-4 text-[10px] uppercase tracking-wider text-fog">
            {t("fm.next")}: {upNext.track.title} · {CHANNELS[upNext.track.style]}
          </p>

          <p className="mt-6 text-[10px] text-fog/70 leading-relaxed max-w-md">{t("fm.note")}</p>
        </div>
      </main>
    </div>
  );
}
