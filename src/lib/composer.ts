import { mulberry32, pick, rint, rnum, chance, type Rng } from "./rng";

/**
 * The radio's composer: given a style and a seed, deterministically builds
 * a track — same seed, same track, in every browser. Each grammar distills
 * a style into weighted parameter ranges, never fixed values.
 *
 * Design rules (from the blind-judge review):
 * - ONE groove per track: every swung lane shares the same swing value.
 * - ONE kit per track (mixing kits reads as a bug, not a choice).
 * - No cosmetic values (a pan of 0.02 does nothing — pan wide or not at all).
 * - Structural variety between seeds, not decimal jitter: riffs are built
 *   from templates + degree pools, layers appear/disappear, progressions
 *   use 4 positions, sample variants and `?` get real use.
 *
 * A track carries `states` (arrangement: fewer layers in, everything, out).
 */

export type StyleName = "motor" | "oxido" | "casa" | "niebla";

export const STYLES: StyleName[] = ["motor", "oxido", "casa", "niebla"];

export interface Track {
  style: StyleName;
  title: string;
  bpm: number;
  /** arrangement: states[0] = intro, last = full picture */
  states: string[];
  /** the full pattern (last state) — what "remix this" copies */
  code: string;
}

interface Lane {
  line: string;
  /** 1 = foundation (intro), 2 = body, 3 = decoration (only in full state) */
  tier: 1 | 2 | 3;
}

interface Sketch {
  bpm: number;
  lanes: Lane[];
}

// ------------------------------------------------------------------ helpers

const TITLES: Record<StyleName, string[]> = {
  motor: ["Autopista", "Cromo", "Turbina", "Medianoche en la fábrica", "Bujía", "Correa"],
  oxido: ["Herrumbre", "Chapa y pintura", "Polígono", "Soldadura", "Viga maestra", "Fundición"],
  casa: ["Portal abierto", "Vecinos", "Azotea", "Llave maestra", "Rellano", "Persiana"],
  niebla: ["Marea baja", "Vapor", "Duermevela", "Faro lejano", "Escarcha", "Bajamar"],
};

/** signed pan far enough from center to be audible (never cosmetic) */
const span = (rng: Rng, min: number, max: number): number =>
  (chance(rng, 0.5) ? 1 : -1) * rnum(rng, min, max);

/** fill a riff template: R = root (insistent), X/Y = wandering degrees.
 *  Draws without replacement so `<X Y>` never degenerates into `<3 3>`. */
function riff(rng: Rng, template: string, root: number, others: number[]): string {
  const pool = [...others];
  return template.replaceAll("R", String(root)).replace(/X|Y/g, () => {
    if (pool.length === 0) pool.push(...others);
    const i = Math.floor(rng() * pool.length);
    return String(pool.splice(i, 1)[0]);
  });
}

/** a one-token lane with the voice placed at `lead` (voices interleave
 *  instead of all hitting at position 0 of their loops) */
function offsetLane(token: string, lead: number, length: number): string {
  const slots = Array(length).fill("~");
  slots[Math.min(lead, length - 1)] = token;
  return slots.join(" ");
}

/** a lane of `length` slots with `hits` tokens scattered (odd-meter perc) */
function sparse(rng: Rng, token: string, length: number, hits: number): string {
  const slots = Array(length).fill("~");
  let placed = 0;
  while (placed < hits) {
    const i = Math.floor(rng() * length);
    if (slots[i] === "~") {
      slots[i] = token;
      placed++;
    }
  }
  return slots.join(" ");
}

// ----------------------------------------------------------------- grammars

/** MOTOR — clean machine soul: 4-chord pad progressions, funk bass. */
function motor(rng: Rng): Sketch {
  const bpm = rint(rng, 122, 128);
  const hatKind = rng();
  // ONE groove — and if the hats are the straight 3-step polymeter, the
  // whole track goes straight with them (no split feel)
  const groove = hatKind < 0.75 ? rnum(rng, 0.12, 0.25) : 0;
  const lanes: Lane[] = [];

  // kick: constant, sometimes with an alternating double-hit fill
  lanes.push({
    tier: 1,
    line: `bd${chance(rng, 0.4) ? `:${rint(rng, 0, 3)}` : ""} bd bd ${chance(rng, 0.25) ? "<bd [bd bd]>" : "bd"} | kit 909 | gain 0.9 -- bombo constante`,
  });

  // backbeat FAMILY — the clap used to be a byte-for-byte clone across tracks
  const backbeat = pick(rng, [
    "~ cp ~ cp",
    "~ cp ~ [cp cp?]",
    "~ sn ~ sn",
    "~ cp ~ <cp [cp cp]>",
  ]);
  lanes.push({
    tier: 1,
    line: `${backbeat} | kit 909 | reverb ${rnum(rng, 0.25, 0.35)} | gain 0.5 -- contragolpe`,
  });

  const offbeat = pick(rng, ["~ ho ~ ho", "~ [~ ho] ~ ho", "~ ho ~ ho?"]);
  lanes.push({
    tier: 2,
    line: `${offbeat} | kit 909 | gain ${rnum(rng, 0.35, 0.45)} -- contratiempo`,
  });

  // hats: 16ths, straight 8ths with ?, or a 3-step polymeter shimmer
  const hatEvolve = chance(rng, 0.3) ? " | every 8 rev" : "";
  if (hatKind < 0.45) {
    lanes.push({
      tier: 3,
      line: `hh hh hh hh | kit 909 | fast 2 | swing ${groove} | gain ${rnum(rng, 0.25, 0.32)}${hatEvolve} -- hats`,
    });
  } else if (hatKind < 0.75) {
    lanes.push({
      tier: 3,
      line: `hh hh? hh hh | kit 909 | swing ${groove} | gain ${rnum(rng, 0.3, 0.38)}${hatEvolve} -- hats`,
    });
  } else {
    lanes.push({
      tier: 3,
      line: `hh hh hh | kit 909 | gain ${rnum(rng, 0.24, 0.3)} -- hats, 3 contra 4`,
    });
  }

  // signature percussion: an odd-grid voice that makes THIS track's grid its own
  if (chance(rng, 0.45)) {
    const percPan = span(rng, 0.25, 0.45);
    const perc = pick(rng, [
      `rm(3,8) | kit 909 | pan ${percPan} | gain ${rnum(rng, 0.26, 0.32)} -- rim rodando`,
      `~ ~ rm | kit 909 | pan ${percPan} | gain ${rnum(rng, 0.26, 0.32)} -- rim, 3 contra 4`,
      `mt ~ ~ ~ mt ~ ~ | kit 909 | slow 2 | pan ${percPan} | gain ${rnum(rng, 0.28, 0.34)} -- toms lejanos`,
    ]);
    lanes.push({ tier: 3, line: perc });
  }

  const bassTemplates = [
    "R ~ [~ R] ~ X ~ [~ Y] ~",
    "R ~ R [~ X] ~ R <Y X> ~",
    "R ~ [~ R] X ~ <R Y> ~ ~",
    "R [~ R] ~ X ~ ~ [~ Y] ~",
    "R ~ ~ [~ X] R ~ <Y ~> ~",
    "R [~ R?] ~ [R R] X ~ [~ Y] ~",
    "R ~ [X ~] R [~ R?] ~ <Y X> ~",
  ];
  const root = pick(rng, [0, 0, 0, -2]);
  lanes.push({
    // half the intros open kick+bass instead of always kick+clap
    tier: chance(rng, 0.5) ? 1 : 2,
    line: `${riff(rng, pick(rng, bassTemplates), root, [3, 5, 7, -2].filter((d) => d !== root))} | synth bass | scale menor${groove > 0 ? ` | swing ${groove}` : ""} | gain ${rnum(rng, 0.65, 0.75)} -- bajo funk`,
  });

  // 4-position progression with a two-level twist: the last chord resolves
  // differently every other pass — the harmonic cycle stops photocopying
  const prog = pick(rng, [
    [0, 3, 5, 2],
    [0, -2, 3, 2],
    [0, 5, 3, -2],
    [3, 2, 0, -2],
  ]);
  const nestLast = chance(rng, 0.5);
  const voice = (offset: number) =>
    prog
      .map((d, i) =>
        i === 3 && nestLast ? `<${d + offset} ${d + offset - 2}>` : String(d + offset)
      )
      .join(" ");
  const rev = rnum(rng, 0.5, 0.6);
  const voicing = pick(rng, [2, 4]); // thirds or sixths — the chord's colour
  if (chance(rng, 0.35)) {
    // STAB strings: the progression hits offbeats instead of blocking on the 1
    const stabLpf = rint(rng, 1600, 2600);
    lanes.push({
      tier: 2,
      line: `~ <${voice(0)}> ~ ~ ~ <${voice(0)}> ~ ~ | synth pad | scale menor | lpf ${stabLpf} | delay ${rnum(rng, 0.2, 0.3)} | gain ${rnum(rng, 0.45, 0.52)} -- cuerdas: stabs`,
    });
    lanes.push({
      tier: 3,
      line: `~ ~ ~ <${voice(voicing)}> ~ ~ ~ ~ | synth pad | scale menor | lpf ${stabLpf + 500} | reverb ${rev} | pan ${span(rng, 0.2, 0.4)} | gain ${rnum(rng, 0.32, 0.38)} -- cuerdas: respuesta`,
    });
  } else {
    lanes.push({
      tier: 2,
      line: `<${voice(0)}> ~ ~ ~ | synth pad | scale menor | slow 2 | reverb ${rev} | gain ${rnum(rng, 0.5, 0.6)} -- cuerdas: progresión`,
    });
    lanes.push({
      tier: 3,
      line: `<${voice(voicing)}> ~ ~ ~ | synth pad | scale menor | slow 2 | reverb ${rev} | gain ${rnum(rng, 0.35, 0.42)} -- cuerdas: armonía`,
    });
  }

  // detail voice: sparse piano, a distant acid line, or an acid arpeggio
  const detail = rng();
  if (detail < 0.5) {
    const motifs = [
      "~ ~ <7 ~> ~ ~ <9 12> ~ ~",
      "~ <9 ~> ~ ~ 7 ~ ~ <12 ~>",
      "<7 ~ 9 ~> ~ ~ ~ <11 ~> ~ ~ ~ ~",
      "~ ~ 7 ~ ~ <9 ~> ~ ~ 12 ~ ~ ~",
      "7 ~ ~ <11 9> ~ ~ ~ <14 ~> ~ ~ ~",
    ];
    lanes.push({
      tier: 3,
      line: `${pick(rng, motifs)} | synth piano | scale menor | delay ${rnum(rng, 0.4, 0.5)} | pan ${span(rng, 0.2, 0.4)} | gain ${rnum(rng, 0.38, 0.45)}${chance(rng, 0.3) ? " | every 4 rev" : ""} -- detalles de piano`,
    });
  } else if (detail < 0.8) {
    lanes.push({
      tier: 3,
      line: `${riff(rng, "R ~ ~ <X ~> ~ ~ R ~", 7, [12, 14, 10])} | synth acid | scale menor | delay ${rnum(rng, 0.25, 0.35)} | gain ${rnum(rng, 0.3, 0.38)} -- ácido lejano`,
    });
  } else {
    lanes.push({
      tier: 3,
      line: `${riff(rng, "R X 7 12 ~ 7 X ~", 0, [3, 5])} | synth acid | fast 2 | scale menor | lpf ${rint(rng, 700, 1100)} | gain ${rnum(rng, 0.28, 0.34)}${chance(rng, 0.4) ? " | every 4 rev" : ""} -- arpegio ácido`,
    });
  }

  return { bpm, lanes };
}

/** ÓXIDO — relentless and saturated; the odd meter must be AUDIBLE. */
function oxido(rng: Rng): Sketch {
  const bpm = rint(rng, 135, 142);
  const lanes: Lane[] = [];

  // kick FAMILY — the hammer has more than one handle
  const kickVar = chance(rng, 0.8) ? `:${rint(rng, 0, 7)}` : "";
  const kickKind = rng();
  const kick =
    kickKind < 0.55
      ? `bd${kickVar} bd bd bd`
      : kickKind < 0.8
        ? "bd(7,8)"
        : `bd${kickVar} bd bd <bd [bd bd]>`;
  lanes.push({
    tier: 1,
    line: `${kick} | kit 909 | drive ${rnum(rng, 0.55, 0.8)} | gain 0.9 -- el martillo`,
  });

  const snVar = chance(rng, 0.5) ? `:${rint(rng, 0, 9)}` : "";
  const snare = pick(rng, [
    `~ ~ sn${snVar} ~`,
    `~ ~ sn${snVar} [~ sn?]`,
    `~ ~ <sn${snVar} [sn sn]> ~`,
  ]);
  lanes.push({
    tier: 2,
    line: `${snare} | kit 909 | drive ${rnum(rng, 0.5, 0.7)} | gain ${rnum(rng, 0.45, 0.55)}${chance(rng, 0.3) ? ` | every ${pick(rng, [2, 4])} rev` : ""} -- caja seca`,
  });

  // hats: their own grid, not always fast-2 sixteenths
  const hatKind = rng();
  const hatFx = `kit 909 | drive ${rnum(rng, 0.3, 0.5)} | gain ${rnum(rng, 0.25, 0.32)}`;
  if (hatKind < 0.4) {
    lanes.push({
      tier: 2,
      line: `hh hh hh hh${chance(rng, 0.4) ? "?" : ""} | fast 2 | ${hatFx} -- hats de máquina`,
    });
  } else if (hatKind < 0.7) {
    lanes.push({ tier: 2, line: `hh(11,16) | ${hatFx} -- hats de máquina, euclídeos` });
  } else {
    lanes.push({
      tier: 2,
      line: `[hh hh] ~ hh hh${chance(rng, 0.4) ? "?" : ""} | ${hatFx} -- hats de máquina, cojos`,
    });
  }

  // THE defining layer: loud, driven, odd-length percussion that rolls
  const tom = pick(rng, ["mt", "lt", "rm"]);
  const oddLen = pick(rng, [5, 7, 9]);
  const tomPan = span(rng, 0.25, 0.5);
  lanes.push({
    tier: 1,
    line: `${sparse(rng, tom, oddLen, rint(rng, 2, oddLen > 7 ? 4 : 3))} | drive ${rnum(rng, 0.4, 0.6)} | pan ${tomPan} | gain ${rnum(rng, 0.45, 0.55)} -- ${tom} rodando, ${oddLen} contra 4`,
  });

  // second percussion answers on the OTHER side of the stereo field
  if (chance(rng, 0.7)) {
    const [k, n] = pick(rng, [[5, 16], [7, 16], [3, 8]] as [number, number][]);
    const answerPan = -Math.sign(tomPan) * rnum(rng, 0.2, 0.45);
    lanes.push({
      tier: 3,
      line: `${pick(rng, ["rm", "ht"])}(${k},${n}) | drive ${rnum(rng, 0.3, 0.5)} | pan ${answerPan} | gain ${rnum(rng, 0.35, 0.42)}${chance(rng, 0.6) ? ` | every ${pick(rng, [2, 3, 4])} rev` : ""} -- grieta`,
    });
  }

  // scrap metal: filtered open hats scraping an odd grid (the brief's "metal")
  if (chance(rng, 0.5)) {
    const metal = pick(rng, ["ho ~ ~ ho ~", "ho(3,8)", "~ ho ~ ~ ho ~ ~"]);
    lanes.push({
      tier: 3,
      line: `${metal} | kit 909 | drive ${rnum(rng, 0.4, 0.6)} | lpf ${rint(rng, 2500, 5000)} | gain ${rnum(rng, 0.25, 0.32)} -- chatarra`,
    });
  }

  // ground: pulsing sub, a loaded acid line, or a sustained drone
  const droneEnd = pick(rng, ["R", "<R -3>", "<R -5>"]).replaceAll("R", "0");
  const groundKind = rng();
  if (groundKind < 0.45) {
    lanes.push({
      tier: 1,
      line: `0 0 0 ${droneEnd} | synth bass | scale menor | lpf ${rint(rng, 250, 400)} | drive ${rnum(rng, 0.4, 0.6)} | gain ${rnum(rng, 0.6, 0.7)} -- sub pulsado`,
    });
  } else if (groundKind < 0.7) {
    lanes.push({
      tier: 1,
      line: `${riff(rng, "R ~ R R ~ X Y", 0, [12, -2, 7])} | synth acid | scale menor | lpf ${rint(rng, 700, 1000)} | drive ${rnum(rng, 0.3, 0.5)} | gain ${rnum(rng, 0.55, 0.62)} -- ácido de carga, 7 contra 4`,
    });
  } else {
    lanes.push({
      tier: 1,
      line: `<${pick(rng, ["-5", "-7", "-10", "-12"])} ${pick(rng, ["-9", "-4", "-14"])}> ${chance(rng, 0.5) ? "~" : "~ ~"} | synth pad | scale menor | slow 4 | lpf ${rint(rng, 260, 520)} | drive ${rnum(rng, 0.3, 0.5)} | gain ${rnum(rng, 0.55, 0.65)} -- drone grave`,
    });
  }

  if (chance(rng, 0.4)) {
    lanes.push({
      tier: 3,
      line: `<${pick(rng, ["0", "-2"])} ${pick(rng, ["-4", "-5"])}> ~ ~ | synth pad | scale menor | slow 4 | lpf ${rint(rng, 600, 900)} | gain 0.3 -- niebla`,
    });
  }

  // structural guarantee: no dead loops — if every layer came out static,
  // the snare carries the evolution
  if (!lanes.some((lane) => /[<?]|every/.test(lane.line))) {
    lanes[1].line = lanes[1].line.replace(" -- ", " | every 4 rev -- ");
  }

  return { bpm, lanes };
}

/** CASA — warm four-on-floor; ONE shuffle locks every layer together. */
function casa(rng: Rng): Sketch {
  const bpm = rint(rng, 122, 126);
  const groove = rnum(rng, 0.25, 0.4); // the shuffle, shared by ALL swung lanes
  const kit = pick(rng, ["909", "909", "linn"]); // one kit for the whole kitchen
  const scale = chance(rng, 0.75) ? "mayor" : "menor"; // some evenings are wistful
  const lanes: Lane[] = [];

  lanes.push({
    tier: 1,
    line: `bd${chance(rng, 0.3) ? `:${rint(rng, 0, 3)}` : ""} bd bd ${chance(rng, 0.2) ? "<bd [bd bd]>" : "bd"} | kit ${kit} | gain 0.9 -- bombo constante`,
  });
  const hoPat = pick(rng, ["~ ho ~ ho", "~ [~ ho] ~ ho", "~ ho ~ ho?"]);
  lanes.push({
    tier: 1,
    line: `${hoPat} | kit ${kit} | swing ${groove} | gain ${rnum(rng, 0.36, 0.45)} -- hat abierto a contratiempo`,
  });
  const clap = pick(rng, ["~ cp ~ cp", "~ cp ~ [cp cp?]", "~ cp ~ <cp [cp cp]>"]);
  lanes.push({
    tier: 2,
    line: `${clap} | kit ${kit} | swing ${groove} | reverb ${rnum(rng, 0.25, 0.35)} | gain 0.5 -- palmada`,
  });

  // texture slot: hats OR a colour percussion rolling against the grid
  const texture = rng();
  if (texture < 0.35) {
    lanes.push({
      tier: 3,
      line: `hh hh hh hh | kit ${kit} | fast 2 | swing ${groove} | gain ${rnum(rng, 0.22, 0.28)} -- hats`,
    });
  } else if (texture < 0.65) {
    lanes.push({
      tier: 3,
      line: `hh hh? hh hh${chance(rng, 0.5) ? "?" : ""} | kit ${kit} | swing ${groove} | gain ${rnum(rng, 0.3, 0.38)} -- hats`,
    });
  } else {
    const colour = pick(rng, ["rm(3,8)", "mt(5,16)", "~ ~ mt"]);
    lanes.push({
      tier: 3,
      line: `${colour} | kit ${kit} | swing ${groove} | pan ${span(rng, 0.2, 0.4)} | gain ${rnum(rng, 0.24, 0.3)} -- percusión de color`,
    });
  }

  // bass BANK: three mutually exclusive characters, not one mould
  const bassTemplates = [
    "R ~ [~ X] ~ Y ~ <X 9> ~",
    "R ~ [~ R] X ~ <Y 9> ~ ~",
    "R ~ X [~ X] ~ Y ~ <9 11>",
    "R [~ R] ~ X ~ [~ Y] ~ <X 2>",
  ];
  const root = pick(rng, [0, 0, 3]);
  const bassKind = rng();
  const bassSoft = chance(rng, 0.6) ? ` | lpf ${rint(rng, 380, 650)}` : ""; // round it off
  let bass: string;
  let bassName: string;
  if (bassKind < 0.5) {
    bass = riff(rng, pick(rng, bassTemplates), root, [4, 7, root + 4]);
    bassName = "bajo saltarín";
  } else if (bassKind < 0.75) {
    bass = `~ ${root} ~ ${root} ~ ${root} ~ <${root + 7} ${root + pick(rng, [4, 5])}>`;
    bassName = "bajo a contratiempo";
  } else {
    bass = `${root} [~ ${root + 7}] ~ ${root} [~ ${root + 7}] ~ <${root + pick(rng, [4, 5])} ${root + 7}> ~`;
    bassName = "bajo en octavas";
  }
  lanes.push({
    // some intros open kick+bass — the house classic
    tier: chance(rng, 0.4) ? 1 : 2,
    line: `${bass} | synth bass | scale ${scale}${bassSoft} | swing ${groove} | gain ${rnum(rng, 0.65, 0.72)} -- ${bassName}`,
  });

  const prog = pick(rng, [
    [7, 9, 11, 9],
    [9, 7, 12, 11],
    [7, 11, 9, 14],
  ]);
  if (chance(rng, 0.3)) {
    // STAB block: the house chord — rhythmic, percussive, on the offbeats
    const stabMask = pick(rng, ["~ [~ D] ~ ~ ~ [~ D] ~ ~", "~ ~ [~ D] ~ ~ [D ~] ~ ~"]);
    const stabLpf = rint(rng, 2000, 3000);
    const stabRev = rnum(rng, 0.2, 0.3);
    const d0 = pick(rng, [0, 2]);
    lanes.push({
      tier: 2,
      line: `${stabMask.replaceAll("D", String(d0))} | synth pad | scale ${scale} | lpf ${stabLpf} | reverb ${stabRev} | swing ${groove} | gain ${rnum(rng, 0.42, 0.48)} -- stab: la base`,
    });
    lanes.push({
      tier: 3,
      line: `${stabMask.replaceAll("D", String(d0 + 2))} | synth pad | scale ${scale} | lpf ${stabLpf} | reverb ${stabRev} | swing ${groove} | pan ${span(rng, 0.2, 0.35)} | gain ${rnum(rng, 0.32, 0.38)} -- stab: la tercera`,
    });
  } else {
    // sparkles with a real 4-position contour — and a silhouette of their own
    const sparkleDelay = rnum(rng, 0.45, 0.55);
    const sparklePan = span(rng, 0.2, 0.4);
    const sparkleProg = prog
      .map((d, i) => (i === 3 && chance(rng, 0.5) ? `<${d} ${d + 2}>` : String(d)))
      .join(" ");
    const echo = `<${pick(rng, [11, 12, 14])} ~>`;
    const mask = pick(rng, ["~ P ~ ~ E ~ ~ ~", "~ ~ P ~ ~ ~ E ~", "P ~ ~ ~ E ~ ~ ~ ~"]);
    lanes.push({
      tier: 3,
      line: `${mask.replace("P", `<${sparkleProg}>`).replace("E", echo)} | synth piano | scale ${scale} | delay ${sparkleDelay} | pan ${sparklePan} | gain ${rnum(rng, 0.4, 0.48)}${chance(rng, 0.25) ? " | every 8 rev" : ""} -- pianito con eco`,
    });
    // …and half the time a parallel third answers from the other side
    if (chance(rng, 0.5)) {
      lanes.push({
        tier: 3,
        line: `~ <${prog.map((d) => d + 2).join(" ")}> ~ ~ ~ ~ ~ ~ | synth piano | scale ${scale} | delay ${sparkleDelay} | pan ${-sparklePan} | gain ${rnum(rng, 0.3, 0.36)} -- la tercera responde`,
      });
    }
  }

  return { bpm, lanes };
}

/** NIEBLA — four ambient archetypes so no two hours sound the same. */
function niebla(rng: Rng): Sketch {
  const bpm = rint(rng, 60, 74);
  const scale = pick(rng, ["menor", "penta", "mayor"]);
  const rev = rnum(rng, 0.6, 0.72);
  const lanes: Lane[] = [];

  // the seed first decides WHAT KIND of ambient piece this is
  const archetype = pick(rng, ["coral", "destello", "latido", "marea"] as const);

  // The floor FAMILY — what the piece stands on. Every track opening with
  // the same pad-drone shape was the tell that unmasked the channel, so the
  // seed now picks the floor's nature, not only its decimals. Base-step
  // periods stay disjoint from each archetype's upper voices: pads = 24|32,
  // sub = 12, media altura = 32, aliento = 10.
  const floorLane = (opts: { shy?: boolean; noBreath?: boolean } = {}) => {
    const soft = opts.shy ? -0.12 : 0;
    const kinds = opts.noBreath
      ? ["grave", "respira", "sub", "medio"]
      : ["grave", "respira", "sub", "medio", "aliento"];
    const kind = pick(rng, kinds);
    const r = pick(rng, [-3, -5, -7, -10, -12]);
    if (kind === "grave") {
      lanes.push({
        tier: 1,
        line: `<${r} ${r + pick(rng, [2, -2, 3, -5])}> ${"~ ".repeat(pick(rng, [2, 3])).trim()} | synth pad | scale ${scale} | slow 8 | lpf ${rint(rng, 400, 700)} | reverb ${rev} | gain ${rnum(rng, 0.5 + soft, 0.6 + soft)} -- suelo grave`,
      });
    } else if (kind === "respira") {
      lanes.push({
        tier: 1,
        line: `<${r} ${r + 2} ${r - 2} ${r + 4}> ~ ~ | synth pad | scale ${scale} | slow 8 | lpf ${rint(rng, 400, 650)} | reverb ${rev} | gain ${rnum(rng, 0.46 + soft, 0.56 + soft)} -- suelo que respira`,
      });
    } else if (kind === "sub") {
      lanes.push({
        tier: 1,
        line: `${r} ~ ~ | synth bass | scale ${scale} | slow 4 | lpf ${rint(rng, 200, 320)} | gain ${rnum(rng, 0.55 + soft, 0.62 + soft)} -- suelo de sub`,
      });
    } else if (kind === "medio") {
      lanes.push({
        tier: 1,
        line: `<${r + 7} ${r + 5}> ~ ~ ~ | synth pad | scale ${scale} | slow 8 | lpf ${rint(rng, 500, 800)} | reverb ${rev} | gain ${rnum(rng, 0.4 + soft, 0.48 + soft)} -- suelo a media altura`,
      });
    } else {
      lanes.push({
        tier: 1,
        line: `ho ~ ~ ~ ~ | slow 2 | lpf ${rint(rng, 280, 420)} | reverb ${rev} | gain ${rnum(rng, 0.24, 0.3)} -- lecho de aliento`,
      });
    }
  };

  if (archetype === "coral") {
    // three pad voices, unequal lengths — a chordal cloud, no melody at all
    floorLane();
    const prog = pick(rng, [[0, 3, 5, 2], [0, 4, 2, 5], [0, 2, -2, 3]]);
    const progStr = prog
      .map((d, i) => (i === 2 && chance(rng, 0.5) ? `<${d} ${d + 2}>` : String(d)))
      .join(" ");
    // mid period 16 | 40 — can never equal low (24|32) or high (20|28)
    const [midSlow, midRests] = pick(rng, [[4, 3], [8, 4]] as [number, number][]);
    lanes.push({
      tier: 1,
      line: `<${progStr}> ${"~ ".repeat(midRests).trim()} | synth pad | scale ${scale} | slow ${midSlow} | delay ${rnum(rng, 0.3, 0.45)} | reverb ${rev} | gain ${rnum(rng, 0.42, 0.5)} -- bruma media`,
    });
    lanes.push({
      tier: 2,
      line: `${offsetLane(`<${pick(rng, [7, 9])} ${pick(rng, [11, 12])}>${chance(rng, 0.35) ? "?" : ""}`, rint(rng, 1, 3), pick(rng, [5, 7]))} | synth pad | scale ${scale} | slow 4 | reverb ${rev} | pan ${span(rng, 0.25, 0.5)} | gain ${rnum(rng, 0.3, 0.38)} -- bruma alta, desplazada`,
    });
    if (chance(rng, 0.4)) {
      lanes.push({
        tier: 3,
        line: `bd ${"~ ".repeat(7).trim()} | lpf ${rint(rng, 200, 280)} | reverb 0.4 | gain ${rnum(rng, 0.4, 0.48)} -- latido enterrado`,
      });
    }
  } else if (archetype === "destello") {
    // melody-led: the melody IS the intro; the floor is optional and shy
    if (chance(rng, 0.6)) floorLane({ shy: true });
    const melodies = [
      "7 ~ 9 ~ <12 11> ~ ~ 7 ~ <5 9> ~ ~",
      "<9 7> ~ 12 ~ ~ <11 13> ~ 9 ~ ~ 7 ~",
      "7 ~ ~ 9 <12 ~> ~ 11 ~ ~ <9 14> ~ ~",
    ];
    const melDelay = rnum(rng, 0.45, 0.55);
    lanes.push({
      tier: 1,
      line: `${pick(rng, melodies)} | synth piano | scale ${scale} | delay ${melDelay} | reverb ${rnum(rng, 0.4, 0.5)} | gain ${rnum(rng, 0.44, 0.5)}${chance(rng, 0.4) ? " | every 8 rev" : ""} -- melodía`,
    });
    lanes.push({
      tier: 2,
      line: `~ ~ ~ ~ ~ <7 ~> ~ ~ ~ ~ ~ | synth piano | scale ${scale} | delay ${melDelay} | pan ${span(rng, 0.3, 0.5)} | gain ${rnum(rng, 0.26, 0.32)} -- eco al otro lado`,
    });
  } else if (archetype === "latido") {
    // the floor is a slow BASS pulse, not the same pad drone as everyone else
    lanes.push({
      tier: 1,
      line: `${pick(rng, [-5, -7, -10, -12])} ${"~ ".repeat(pick(rng, [2, 4])).trim()} | synth bass | scale ${scale} | slow 2 | lpf ${rint(rng, 250, 350)} | gain ${rnum(rng, 0.55, 0.62)} -- pulso grave`,
    });
    const prog = pick(rng, [[0, 3, 5, 2], [0, 2, -2, 3]]);
    const progStr = prog
      .map((d, i) => (i === 1 && chance(rng, 0.5) ? `<${d} ${d - 2}>` : String(d)))
      .join(" ");
    lanes.push({
      tier: 1,
      line: `${offsetLane(`<${progStr}>`, rint(rng, 1, 2), pick(rng, [5, 6]))} | synth pad | scale ${scale} | slow 4 | delay ${rnum(rng, 0.3, 0.5)} | reverb ${rev} | gain ${rnum(rng, 0.45, 0.55)} -- bruma, desplazada`,
    });
    lanes.push({
      tier: 2,
      line: `${pick(rng, ["7 ~ ~ ~ <9 13> ~ ~ 12? ~", "<7 9> ~ ~ ~ ~ 12 ~ ~ ~"])} | synth piano | scale ${scale} | delay ${rnum(rng, 0.5, 0.6)} | reverb ${rnum(rng, 0.4, 0.5)} | gain ${rnum(rng, 0.4, 0.48)} -- destellos`,
    });
    lanes.push({
      tier: 2,
      line: `bd ${"~ ".repeat(7).trim()} | lpf ${rint(rng, 200, 300)} | reverb ${rnum(rng, 0.3, 0.4)} | gain ${rnum(rng, 0.45, 0.55)} -- latido enterrado`,
    });
  } else {
    // marea: interleaved swells over uneven distant ticks.
    // Periods measured in BASE steps must never coincide: suelo = 24|40,
    // bruma = len×4 (20|28) — no combination collides, so the voices
    // drift forever instead of hitting together.
    if (chance(rng, 0.5)) {
      floorLane({ noBreath: true }); // marea already has its own breath lane
    } else {
      lanes.push({
        tier: 1,
        line: `<-7 -5> ~ <-9 ${pick(rng, ["-7", "-12"])}> ~ ~ | synth pad | scale ${scale} | slow 8 | lpf ${rint(rng, 400, 700)} | reverb ${rev} | gain ${rnum(rng, 0.48, 0.56)} -- suelo que camina`,
      });
    }
    const chord = `<0 <${pick(rng, [2, 4])} ${pick(rng, [5, 7])}>>`;
    lanes.push({
      tier: 1,
      line: `${offsetLane(chord, rint(rng, 1, 2), pick(rng, [5, 7]))} | synth pad | scale ${scale} | slow 4 | delay ${rnum(rng, 0.35, 0.5)} | reverb ${rev} | gain ${rnum(rng, 0.42, 0.5)} -- bruma, desplazada`,
    });
    const hoPan = span(rng, 0.25, 0.5);
    lanes.push({
      tier: 2,
      line: `${offsetLane("ho", rint(rng, 0, 2), pick(rng, [5, 7]))} | lpf ${rint(rng, 400, 600)} | pan ${hoPan} | gain 0.2 -- aliento`,
    });
    const [gk, gn] = pick(rng, [[3, 16], [2, 13], [3, 14]] as [number, number][]);
    lanes.push({
      tier: 3,
      line: `rm(${gk},${gn}) | lpf ${rint(rng, 700, 1000)} | delay ${rnum(rng, 0.4, 0.55)} | pan ${(-Math.sign(hoPan) * rnum(rng, 0.2, 0.4)).toFixed(2)} | gain ${rnum(rng, 0.16, 0.22)} -- gotas irregulares, al otro lado`,
    });
  }

  return { bpm, lanes };
}

const GRAMMARS: Record<StyleName, (rng: Rng) => Sketch> = { motor, oxido, casa, niebla };

// ------------------------------------------------------------------ compose

export function compose(style: StyleName, seed: number): Track {
  const rng = mulberry32(seed * 2654435761 + style.length);
  const sketch = GRAMMARS[style](rng);

  const byTier = (max: number) =>
    sketch.lanes
      .filter((lane) => lane.tier <= max)
      .map((lane) => lane.line)
      .join("\n");

  const states = [byTier(1), byTier(2), byTier(3)].filter(
    (state, i, all) => i === 0 || state !== all[i - 1]
  );

  return {
    style,
    title: `${pick(rng, TITLES[style])} #${(seed % 900) + 100}`,
    bpm: sketch.bpm,
    states,
    code: states[states.length - 1],
  };
}
