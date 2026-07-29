import { DEFAULT_BPM, MIN_BPM, MAX_BPM } from "../lib/audioEngine";

interface Props {
  playing: boolean;
  onPlay: () => void;
  onStop: () => void;
  onReset?: () => void;
  bpm?: number;
  onBpmChange?: (bpm: number) => void;
  volume?: number;
  onVolumeChange?: (volume: number) => void;
}

export default function Transport({
  playing,
  onPlay,
  onStop,
  onReset,
  bpm = DEFAULT_BPM,
  onBpmChange,
  volume,
  onVolumeChange,
}: Props) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <button
        onClick={onPlay}
        className={
          "px-4 py-1.5 text-xs font-bold uppercase tracking-widest border transition-all " +
          (playing
            ? "bg-acid text-black border-acid shadow-[0_0_14px_rgba(200,255,0,0.4)]"
            : "border-acid text-acid hover:bg-acid hover:text-black")
        }
      >
        ▶ Play
      </button>
      <button
        onClick={onStop}
        className="px-4 py-1.5 text-xs font-bold uppercase tracking-widest border border-mag text-mag hover:bg-mag hover:text-black transition-all"
      >
        ■ Stop
      </button>
      {onReset && (
        <button
          onClick={onReset}
          className="px-4 py-1.5 text-xs uppercase tracking-widest border border-white/20 text-fog hover:border-white/60 hover:text-white transition-all"
        >
          ↺ Reset
        </button>
      )}

      {onBpmChange ? (
        <label className="ml-2 flex items-center gap-2 px-3 py-1.5 bg-black border border-acid/30 text-xs select-none">
          <span className="text-[10px] uppercase tracking-widest text-fog">Tempo</span>
          <input
            type="range"
            min={MIN_BPM}
            max={MAX_BPM}
            step={1}
            value={bpm}
            onChange={(e) => onBpmChange(Number(e.target.value))}
            className="w-24 accent-acid"
          />
          <span className="w-16 text-right led">{bpm} BPM</span>
        </label>
      ) : (
        <div className="ml-2 px-3 py-1.5 bg-black border border-acid/30 text-xs led select-none">
          {bpm} BPM
        </div>
      )}

      {onVolumeChange && volume !== undefined && (
        <label className="flex items-center gap-2 px-3 py-1.5 bg-black border border-mag/30 text-xs text-fog select-none">
          <span className="text-[10px] uppercase tracking-widest text-fog">Vol</span>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={volume}
            onChange={(e) => onVolumeChange(Number(e.target.value))}
            className="w-20 accent-mag"
          />
        </label>
      )}

      {playing && <span className="ml-1 w-2.5 h-2.5 bg-acid blink shadow-[0_0_10px_#c8ff00]" />}
    </div>
  );
}
