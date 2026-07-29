import { degreeToMidi, type LaneDef, type Node } from "../lib/parser";
import { soundDef, type SoundColor } from "../lib/sounds";
import { audioEngine } from "../lib/audioEngine";
import { t } from "../lib/i18n";

const STEPS = 8;

const COLOR_STYLE: Record<SoundColor, string> = {
  cyan: "bg-acid shadow-[0_0_6px_rgba(200,255,0,0.5)]",
  fuchsia: "bg-mag shadow-[0_0_6px_rgba(255,62,165,0.5)]",
  slate: "bg-white/70",
  amber: "bg-warn/85 shadow-[0_0_6px_rgba(255,212,0,0.4)]",
};

function hitStyle(id: string): string {
  if (/^v[1-8]$/.test(id)) {
    return "bg-gradient-to-br from-acid/85 to-mag/85 shadow-[0_0_6px_rgba(255,62,165,0.4)]";
  }
  const def = soundDef(id);
  return def ? COLOR_STYLE[def.color] : "bg-white/5";
}

/**
 * Recursive cell: groups split the cell horizontally, alternation shows
 * the currently active choice (ring), probability renders translucent.
 */
function NodeCell({ node, cycle, lane }: { node: Node; cycle: number; lane: LaneDef }) {
  switch (node.kind) {
    case "rest":
      return <div className="flex-1 h-full bg-white/5" />;
    case "hit":
      return (
        <div
          onClick={() => void audioEngine.previewSound(node.id, node.variant, lane.kit)}
          title={t("vox.playTitle")}
          className={
            "flex-1 h-full flex items-center justify-center text-[9px] font-bold text-black overflow-hidden cursor-pointer " +
            hitStyle(node.id)
          }
        >
          {node.id}
        </div>
      );
    case "note":
    case "degree":
      return (
        <div
          onClick={() =>
            void audioEngine.previewNote(
              lane.synth,
              node.kind === "note" ? node.midi : degreeToMidi(node.n, lane.scale)
            )
          }
          title={t("vox.playTitle")}
          className="flex-1 h-full flex items-center justify-center text-[9px] font-bold text-black overflow-hidden cursor-pointer bg-ice/85 shadow-[0_0_6px_rgba(0,229,255,0.5)]"
        >
          {node.label}
        </div>
      );
    case "group":
      return (
        <div className="flex-1 h-full flex gap-0.5 min-w-0">
          {node.children.map((child, i) => (
            <NodeCell key={i} node={child} cycle={cycle} lane={lane} />
          ))}
        </div>
      );
    case "alt": {
      const n = node.choices.length;
      return (
        <div className="flex-1 h-full flex ring-1 ring-mag/60 min-w-0">
          <NodeCell node={node.choices[cycle % n]} cycle={Math.floor(cycle / n)} lane={lane} />
        </div>
      );
    }
    case "prob":
      return (
        <div className="flex-1 h-full flex opacity-50 min-w-0">
          <NodeCell node={node.child} cycle={cycle} lane={lane} />
        </div>
      );
  }
}

function speedBadge(speed: number): string {
  if (speed > 1) return `×${Math.round(speed)}`;
  if (speed < 1) return `÷${Math.round(1 / speed)}`;
  return "";
}

interface Props {
  lanes: LaneDef[];
  step: number;
  /** When provided, a small volume slider is shown per lane. */
  laneGains?: number[];
  onLaneGain?: (laneIndex: number, gain: number) => void;
  /** AUTO-mode lane locks. */
  locks?: boolean[];
  onToggleLock?: (laneIndex: number) => void;
}

/**
 * 8 visible steps. Each lane repeats its own steps across the grid;
 * the highlight advances at the lane's own speed while playing, and
 * `every N rev` lanes show their reversed version on those loops.
 */
export default function StepGrid({ lanes, step, laneGains, onLaneGain, locks, onToggleLock }: Props) {
  if (lanes.length === 0) {
    return (
      <div className="text-xs text-fog py-4 text-center border border-dashed border-white/15">
        {t("grid.empty")}
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      {lanes.map((lane, laneIndex) => {
        // Position in this lane's own clock (fast/slow scale the base step).
        const laneStep = step >= 0 ? Math.floor(step * lane.speed) : -1;
        const current = laneStep >= 0 ? laneStep % STEPS : -1;
        const laneCycle = laneStep >= 0 ? Math.floor(laneStep / lane.steps.length) : 0;
        const steps =
          lane.everyN && lane.everySteps && laneCycle % lane.everyN === 0
            ? lane.everySteps
            : lane.steps;
        const badge = speedBadge(lane.speed);
        return (
          <div key={laneIndex} className="flex items-center gap-2">
            {locks && onToggleLock && (
              <button
                onClick={() => onToggleLock(laneIndex)}
                title={t("grid.lock")}
                className={
                  "w-4 shrink-0 text-[11px] transition-colors " +
                  (locks[laneIndex] ? "text-mag" : "text-fog/40 hover:text-fog")
                }
              >
                {locks[laneIndex] ? "▣" : "▢"}
              </button>
            )}
            {laneGains && onLaneGain && (
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={laneGains[laneIndex] ?? 1}
                onChange={(e) => onLaneGain(laneIndex, Number(e.target.value))}
                title={t("grid.laneVol")}
                className="w-16 accent-acid shrink-0"
              />
            )}
            <div className="grid grid-cols-8 gap-1.5 flex-1">
              {Array.from({ length: STEPS }, (_, i) => {
                const node = steps[i % steps.length];
                const active = i === current;
                return (
                  <div
                    key={i}
                    className={
                      "h-8 flex transition-all duration-75" +
                      (active ? " ring-2 ring-acid brightness-150 scale-105" : "")
                    }
                  >
                    <NodeCell node={node} cycle={laneCycle} lane={lane} />
                  </div>
                );
              })}
            </div>
            <span className="w-7 shrink-0 text-[10px] text-mag/80 text-right select-none">
              {badge}
            </span>
          </div>
        );
      })}
    </div>
  );
}
