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

/** fill a riff template: R = root (insistent), X/Y = wandering degrees */
function riff(rng: Rng, template: string, root: number, others: number[]): string {
  return template
    .replaceAll("R", String(root))
    .replace(/X|Y/g, () => String(pick(rng, others)));
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

  lanes.push({
    tier: 1,
    line: `bd${chance(rng, 0.4) ? `:${rint(rng, 0, 3)}` : ""} bd bd bd | kit 909 | gain 0.9 -- bombo constante`,
  });
  lanes.push({
    tier: 1,
    line: `~ cp ~ cp | kit 909 | reverb ${rnum(rng, 0.25, 0.35)} | gain 0.5 -- palmada`,
  });
  lanes.push({ tier: 2, line: `~ ho ~ ho | kit 909 | gain ${rnum(rng, 0.35, 0.45)} -- contratiempo` });

  // hats: 16ths, straight 8ths with ?, or a 3-step polymeter shimmer
  if (hatKind < 0.45) {
    lanes.push({
      tier: 3,
      line: `hh hh hh hh | kit 909 | fast 2 | swing ${groove} | gain ${rnum(rng, 0.25, 0.32)} -- hats`,
    });
  } else if (hatKind < 0.75) {
    lanes.push({
      tier: 3,
      line: `hh hh? hh hh | kit 909 | swing ${groove} | gain ${rnum(rng, 0.3, 0.38)} -- hats`,
    });
  } else {
    lanes.push({
      tier: 3,
      line: `hh hh hh | kit 909 | gain ${rnum(rng, 0.24, 0.3)} -- hats, 3 contra 4`,
    });
  }

  const bassTemplates = [
    "R ~ [~ R] ~ X ~ [~ Y] ~",
    "R ~ R [~ X] ~ R <Y X> ~",
    "R ~ [~ R] X ~ <R Y> ~ ~",
    "R [~ R] ~ X ~ ~ [~ Y] ~",
    "R ~ ~ [~ X] R ~ <Y ~> ~",
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
  lanes.push({
    tier: 2,
    line: `<${voice(0)}> ~ ~ ~ | synth pad | scale menor | slow 2 | reverb ${rev} | gain ${rnum(rng, 0.5, 0.6)} -- cuerdas: progresión`,
  });
  lanes.push({
    tier: 3,
    line: `<${voice(2)}> ~ ~ ~ | synth pad | scale menor | slow 2 | reverb ${rev} | gain ${rnum(rng, 0.35, 0.42)} -- cuerdas: armonía`,
  });

  // detail voice: sparse piano or a distant acid line
  if (chance(rng, 0.6)) {
    const motifs = [
      "~ ~ <7 ~> ~ ~ <9 12> ~ ~",
      "~ <9 ~> ~ ~ 7 ~ ~ <12 ~>",
      "<7 ~ 9 ~> ~ ~ ~ <11 ~> ~ ~ ~ ~",
    ];
    lanes.push({
      tier: 3,
      line: `${pick(rng, motifs)} | synth piano | scale menor | delay ${rnum(rng, 0.4, 0.5)} | pan ${span(rng, 0.2, 0.4)} | gain ${rnum(rng, 0.38, 0.45)} -- detalles de piano`,
    });
  } else {
    lanes.push({
      tier: 3,
      line: `${riff(rng, "R ~ ~ <X ~> ~ ~ R ~", 7, [12, 14, 10])} | synth acid | scale menor | delay ${rnum(rng, 0.25, 0.35)} | gain ${rnum(rng, 0.3, 0.38)} -- ácido lejano`,
    });
  }

  return { bpm, lanes };
}

/** ÓXIDO — relentless and saturated; the odd meter must be AUDIBLE. */
function oxido(rng: Rng): Sketch {
  const bpm = rint(rng, 135, 142);
  const lanes: Lane[] = [];

  lanes.push({
    tier: 1,
    line: `bd${chance(rng, 0.8) ? `:${rint(rng, 0, 7)}` : ""} bd bd bd | kit 909 | drive ${rnum(rng, 0.55, 0.8)} | gain 0.9 -- el martillo`,
  });
  lanes.push({
    tier: 2,
    line: `~ ~ sn${chance(rng, 0.5) ? `:${rint(rng, 0, 9)}` : ""} ~ | kit 909 | drive ${rnum(rng, 0.5, 0.7)} | gain ${rnum(rng, 0.45, 0.55)} -- caja seca`,
  });
  lanes.push({
    tier: 2,
    line: `hh hh hh hh${chance(rng, 0.4) ? "?" : ""} | kit 909 | fast 2 | drive ${rnum(rng, 0.3, 0.5)} | gain ${rnum(rng, 0.25, 0.32)} -- hats de máquina`,
  });

  // THE defining layer: loud, driven, odd-length percussion that rolls
  const tom = pick(rng, ["mt", "lt", "rm"]);
  const oddLen = pick(rng, [5, 7]);
  const tomPan = span(rng, 0.25, 0.5);
  lanes.push({
    tier: 1,
    line: `${sparse(rng, tom, oddLen, rint(rng, 2, 3))} | drive ${rnum(rng, 0.4, 0.6)} | pan ${tomPan} | gain ${rnum(rng, 0.45, 0.55)} -- ${tom} rodando, ${oddLen} contra 4`,
  });

  // second percussion answers on the OTHER side of the stereo field
  if (chance(rng, 0.7)) {
    const [k, n] = pick(rng, [[5, 16], [7, 16], [3, 8]] as [number, number][]);
    const answerPan = -Math.sign(tomPan) * rnum(rng, 0.2, 0.45);
    lanes.push({
      tier: 3,
      line: `${pick(rng, ["rm", "ht"])}(${k},${n}) | drive ${rnum(rng, 0.3, 0.5)} | pan ${answerPan} | gain ${rnum(rng, 0.35, 0.42)}${chance(rng, 0.6) ? " | every 4 rev" : ""} -- grieta`,
    });
  }

  // ground: pulsing sub or sustained pad-drone
  const droneEnd = pick(rng, ["R", "<R -3>", "<R -5>"]).replaceAll("R", "0");
  if (chance(rng, 0.6)) {
    lanes.push({
      tier: 1,
      line: `0 0 0 ${droneEnd} | synth bass | scale menor | lpf ${rint(rng, 250, 400)} | drive ${rnum(rng, 0.4, 0.6)} | gain ${rnum(rng, 0.6, 0.7)} -- sub pulsado`,
    });
  } else {
    lanes.push({
      tier: 1,
      line: `<-7 ${pick(rng, ["-5", "-9", "-4", "-12"])}> ${chance(rng, 0.5) ? "~" : "~ ~"} | synth pad | scale menor | slow 4 | lpf ${rint(rng, 260, 520)} | drive ${rnum(rng, 0.3, 0.5)} | gain ${rnum(rng, 0.55, 0.65)} -- drone grave`,
    });
  }

  if (chance(rng, 0.4)) {
    lanes.push({
      tier: 3,
      line: `<0 -2> ~ ~ | synth pad | scale menor | slow 4 | lpf ${rint(rng, 600, 900)} | gain 0.3 -- niebla`,
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
  const lanes: Lane[] = [];

  lanes.push({ tier: 1, line: `bd bd bd bd | kit ${kit} | gain 0.9 -- bombo constante` });
  lanes.push({
    tier: 1,
    line: `~ ho ~ ho | kit ${kit} | swing ${groove} | gain ${rnum(rng, 0.4, 0.48)} -- hat abierto a contratiempo`,
  });
  lanes.push({
    tier: 2,
    line: `~ cp ~ cp | kit ${kit} | swing ${groove} | reverb ${rnum(rng, 0.25, 0.35)} | gain 0.5 -- palmada`,
  });

  if (chance(rng, 0.5)) {
    lanes.push({
      tier: 3,
      line: `hh hh hh hh | kit ${kit} | fast 2 | swing ${groove} | gain ${rnum(rng, 0.22, 0.28)} -- hats`,
    });
  } else {
    lanes.push({
      tier: 3,
      line: `hh hh? hh hh${chance(rng, 0.5) ? "?" : ""} | kit ${kit} | swing ${groove} | gain ${rnum(rng, 0.3, 0.38)} -- hats`,
    });
  }

  const bassTemplates = [
    "R ~ [~ X] ~ Y ~ <X 9> ~",
    "R ~ [~ R] X ~ <Y 9> ~ ~",
    "R ~ X [~ X] ~ Y ~ <9 11>",
    "R [~ R] ~ X ~ [~ Y] ~ <X 2>",
  ];
  const root = pick(rng, [0, 0, 3]);
  lanes.push({
    // some intros open kick+bass — the house classic
    tier: chance(rng, 0.4) ? 1 : 2,
    line: `${riff(rng, pick(rng, bassTemplates), root, [4, 7, root + 4])} | synth bass | scale mayor | swing ${groove} | gain ${rnum(rng, 0.65, 0.72)} -- bajo saltarín`,
  });

  // sparkles with a real 4-position contour…
  const prog = pick(rng, [
    [7, 9, 11, 9],
    [9, 7, 12, 11],
    [7, 11, 9, 14],
  ]);
  const sparkleDelay = rnum(rng, 0.45, 0.55);
  const sparklePan = span(rng, 0.2, 0.4);
  const sparkleProg = prog
    .map((d, i) => (i === 3 && chance(rng, 0.5) ? `<${d} ${d + 2}>` : String(d)))
    .join(" ");
  lanes.push({
    tier: 3,
    line: `~ <${sparkleProg}> ~ ~ <${pick(rng, [11, 12, 14])} ~> ~ ~ ~ | synth piano | scale mayor | delay ${sparkleDelay} | pan ${sparklePan} | gain ${rnum(rng, 0.4, 0.48)} -- pianito con eco`,
  });
  // …and half the time a parallel third turns it into a proper house stab
  if (chance(rng, 0.5)) {
    lanes.push({
      tier: 3,
      line: `~ <${prog.map((d) => d + 2).join(" ")}> ~ ~ ~ ~ ~ ~ | synth piano | scale mayor | delay ${sparkleDelay} | pan ${-sparklePan} | gain ${rnum(rng, 0.3, 0.36)} -- stab: la tercera`,
    });
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
