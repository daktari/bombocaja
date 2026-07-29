import { usePlayer } from "../lib/usePlayer";

/**
 * A code block from lesson prose that can be played in place — the Strudel
 * trick. Falls back to a plain block when the content isn't a valid pattern
 * (e.g. "BUM … TAK …").
 */
export default function PlayableCode({ code }: { code: string }) {
  const { playing, parsed, play, stop } = usePlayer(code);
  const playable = parsed.lanes.length > 0 && parsed.warnings.length === 0;

  if (!playable) {
    return (
      <pre className="bg-black border border-white/10 px-4 py-3 text-acid overflow-x-auto">
        {code}
      </pre>
    );
  }

  return (
    <div
      className={
        "relative border bg-black transition-all " +
        (playing ? "border-acid/70 shadow-[3px_3px_0_rgba(200,255,0,0.2)]" : "border-white/10")
      }
    >
      <pre className="px-4 py-3 pr-14 text-acid overflow-x-auto">{code}</pre>
      <button
        onClick={playing ? stop : play}
        className={
          "absolute top-2 right-2 w-9 h-9 text-sm font-bold border transition-all " +
          (playing
            ? "bg-mag text-black border-mag"
            : "text-acid border-acid/50 hover:bg-acid hover:text-black")
        }
      >
        {playing ? "■" : "▶"}
      </button>
    </div>
  );
}
