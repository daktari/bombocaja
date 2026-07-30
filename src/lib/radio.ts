import { compose, type StyleName, type Track } from "./composer";
import { ANCHORS } from "./anchors";
import { chance, mulberry32, rint, rnum } from "./rng";

/**
 * The station is a pure function of the clock: the day is sliced into
 * slots, the slot number seeds the composer, and everyone who computes
 * radioAt(dial, now) hears the same track — no server, no playlist that
 * can ever run out. Every 4th slot plays a curated anchor track.
 */

export const SLOT_SECONDS = 150;

/** Station IDs: every 8th slot on the main dial opens with a short jingle.
 *  Offset 1 so an ID never lands on an anchor slot (those are slot % 4 === 0).
 *  Niebla never gets one — nothing may interrupt the fog. */
export const ID_EVERY = 8;
export const ID_SECONDS = 10;

/** The station's sonic logo: one FIXED rising motif (brand recognition),
 *  dressed differently by each slot's seed. */
export function stationId(slot: number): Track {
  const rng = mulberry32(slot * 7 + 13);
  const lead = chance(rng, 0.6) ? "acid" : "piano";
  const code = [
    `0 4 7 12 ~ ~ <12 14> ~ | synth ${lead} | scale mayor | delay ${rnum(rng, 0.3, 0.45)} | gain 0.55 -- la sintonía`,
    `-12 ~ ~ ~ | synth bass | scale mayor | lpf ${rint(rng, 250, 350)} | gain 0.6 -- la raíz`,
    ...(chance(rng, 0.5) ? [`hh ~ hh hh | gain ${rnum(rng, 0.16, 0.22)} -- aire`] : []),
  ].join("\n");
  return { style: "motor", title: "bakaluti FM", bpm: 122, states: [code], code };
}

export type Dial = "fm" | "niebla";

export const CHANNELS: Record<StyleName, string> = {
  motor: "MOTOR",
  oxido: "ÓXIDO",
  casa: "CASA",
  niebla: "NIEBLA",
};

/** UTC-hour programming for the main dial. */
function franjaStyles(hourUtc: number): StyleName[] {
  if (hourUtc >= 6 && hourUtc < 10) return ["niebla", "casa", "motor"];
  if (hourUtc >= 10 && hourUtc < 14) return ["casa", "motor", "niebla"];
  if (hourUtc >= 14 && hourUtc < 18) return ["motor", "casa", "oxido"];
  if (hourUtc >= 18 && hourUtc < 22) return ["oxido", "motor", "casa"];
  if (hourUtc >= 22 || hourUtc < 2) return ["oxido", "motor", "niebla"];
  return ["oxido", "niebla", "motor"]; // 02–06: la madrugada
}

export interface OnAir {
  dial: Dial;
  slot: number;
  track: Track;
  isAnchor: boolean;
  /** first seconds of an ID slot: the jingle is on air, not a track */
  isStationId: boolean;
  secondsIntoSlot: number;
  secondsLeft: number;
  /** which arrangement state should be sounding right now */
  stateIndex: number;
}

export function radioAt(dial: Dial, unixSeconds: number): OnAir {
  const slot = Math.floor(unixSeconds / SLOT_SECONDS);
  const secondsIntoSlot = unixSeconds - slot * SLOT_SECONDS;
  const rng = mulberry32(slot);

  if (dial === "fm" && slot % ID_EVERY === 1 && secondsIntoSlot < ID_SECONDS) {
    return {
      dial,
      slot,
      track: stationId(slot),
      isAnchor: false,
      isStationId: true,
      secondsIntoSlot,
      secondsLeft: SLOT_SECONDS - secondsIntoSlot,
      stateIndex: 0,
    };
  }

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
    isStationId: false,
    secondsIntoSlot,
    secondsLeft: SLOT_SECONDS - secondsIntoSlot,
    stateIndex,
  };
}
