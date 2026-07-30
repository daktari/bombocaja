import { compose, type StyleName, type Track } from "./composer";
import { ANCHORS } from "./anchors";
import { mulberry32 } from "./rng";

/**
 * The station is a pure function of the clock: the day is sliced into
 * slots, the slot number seeds the composer, and everyone who computes
 * radioAt(dial, now) hears the same track — no server, no playlist that
 * can ever run out. Every 4th slot plays a curated anchor track.
 */

export const SLOT_SECONDS = 150;

export type Dial = "fm" | "niebla";

export const CHANNELS: Record<StyleName, string> = {
  motor: "MOTOR",
  oxido: "ÓXIDO",
  casa: "CASA",
  niebla: "NIEBLA",
};

/** UTC-hour programming for the main dial. */
function franjaStyles(hourUtc: number): StyleName[] {
  if (hourUtc >= 6 && hourUtc < 10) return ["niebla", "casa"];
  if (hourUtc >= 10 && hourUtc < 14) return ["casa", "motor"];
  if (hourUtc >= 14 && hourUtc < 18) return ["motor", "casa"];
  if (hourUtc >= 18 && hourUtc < 22) return ["motor", "oxido"];
  if (hourUtc >= 22 || hourUtc < 2) return ["oxido", "motor"];
  return ["oxido", "niebla"]; // 02–06: la madrugada
}

export interface OnAir {
  dial: Dial;
  slot: number;
  track: Track;
  isAnchor: boolean;
  secondsIntoSlot: number;
  secondsLeft: number;
  /** which arrangement state should be sounding right now */
  stateIndex: number;
}

export function radioAt(dial: Dial, unixSeconds: number): OnAir {
  const slot = Math.floor(unixSeconds / SLOT_SECONDS);
  const secondsIntoSlot = unixSeconds - slot * SLOT_SECONDS;
  const rng = mulberry32(slot);

  const anchorPool =
    dial === "niebla"
      ? ANCHORS.filter((a) => a.style === "niebla")
      : ANCHORS.filter((a) => a.style !== "niebla");

  let track: Track;
  let isAnchor = false;

  if (slot % 4 === 0 && anchorPool.length > 0) {
    isAnchor = true;
    track = anchorPool[Math.floor(rng() * anchorPool.length)];
  } else if (dial === "niebla") {
    track = compose("niebla", slot);
  } else {
    const hourUtc = Math.floor(unixSeconds / 3600) % 24;
    const styles = franjaStyles(hourUtc);
    track = compose(styles[Math.floor(rng() * styles.length)], slot);
  }

  // arrangement: fewer layers early in the slot, everything after, and a
  // wind-down at the end so the DJ cut lands on a thinner picture
  const progress = secondsIntoSlot / SLOT_SECONDS;
  const thresholds =
    track.states.length >= 3 ? [0.12, 0.3] : track.states.length === 2 ? [0.18] : [];
  let stateIndex = 0;
  for (const t of thresholds) if (progress >= t) stateIndex++;
  if (progress >= 0.9 && track.states.length >= 2) {
    stateIndex = track.states.length - 2; // outro: drop the decorations
  }

  return {
    dial,
    slot,
    track,
    isAnchor,
    secondsIntoSlot,
    secondsLeft: SLOT_SECONDS - secondsIntoSlot,
    stateIndex,
  };
}
