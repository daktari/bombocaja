import type { Localized } from "./i18n";

export interface GalleryPattern {
  id: string;
  name: Localized;
  style: Localized;
  code: string;
  /** Recommended tempo. */
  bpm: number;
}

/** The pattern loaded on a first visit — has to sound great instantly. */
export const HERO_CODE = `-- bakaluti · toca cualquier palabra y escucha
bd ~ [~ bd] ~ bd ~ [~ bd] ~ | kit 808 | gain 0.9 -- el bombo
hh*2 hh hh*2 <hh ho> | kit 808 | gain 0.4 | swing 0.15 -- los hats
0 0 3 5 | synth acid | scale menor | delay 0.2 | gain 0.7 -- bajo ácido
~ ~ cp ~ | kit 808 | reverb 0.35 | gain 0.55 -- la palmada`;

/** Curated, remixable starting points — each anchors a style. */
export const GALLERY: GalleryPattern[] = [
  {
    id: "trap-808",
    bpm: 140,
    name: { es: "Trap mínimo", en: "Minimal trap" },
    style: { es: "Roland TR-808", en: "Roland TR-808" },
    code: "bd ~ ~ [~ bd] ~ ~ <bd [bd bd]> ~ | kit 808 | gain 0.95\n~ ~ ~ ~ sn ~ ~ ~ | kit 808 | reverb 0.2 | gain 0.7\nhh hh [hh hh] hh hh [hh hh hh] hh <hh [hh hh]> | kit 808 | gain 0.45\n0 ~ ~ ~ <-3 -5> ~ ~ ~ | synth bass | scale menor | slow 2 | gain 0.85",
  },
  {
    id: "techno-909",
    bpm: 124,
    name: { es: "Techno de Detroit", en: "Detroit techno" },
    style: { es: "TR-909 + strings", en: "TR-909 + strings" },
    code: "bd bd bd bd | kit 909 | gain 0.9\n~ cp ~ cp | kit 909 | reverb 0.3 | gain 0.5\n~ ho ~ ho | kit 909 | gain 0.4\n0 ~ [~ 0] ~ 3 ~ [~ 5] ~ | synth bass | scale menor | swing 0.15 | gain 0.7\n<0 5> ~ ~ ~ | synth pad | scale menor | slow 2 | reverb 0.55 | gain 0.55\n<2 7> ~ ~ ~ | synth pad | scale menor | slow 2 | reverb 0.55 | gain 0.4",
  },
  {
    id: "acid-house",
    bpm: 122,
    name: { es: "Acid house", en: "Acid house" },
    style: { es: "TB-303 + TR-909", en: "TB-303 + TR-909" },
    code: "0 [0 12] 0 7 0 [0 12] <3 5> 0 | synth acid | scale menor | delay 0.3 | gain 0.75\nbd bd bd bd | kit 909 | gain 0.9\n~ ho ~ ho | kit 909 | gain 0.35\n~ cp ~ cp | kit 909 | reverb 0.3 | gain 0.5\nhh hh hh hh | kit 909 | fast 2 | swing 0.2 | gain 0.25",
  },
  {
    id: "funk-linn",
    bpm: 108,
    name: { es: "Funk de los 80", en: "80s funk" },
    style: { es: "LinnDrum", en: "LinnDrum" },
    code: "bd ~ [~ bd] ~ bd ~ ~ ~ | kit linn | swing 0.25 | gain 0.9\n~ ~ ~ ~ sn ~ ~ [~ sn?] | kit linn | swing 0.25 | reverb 0.2 | gain 0.65\nhh hh? hh hh hh hh? hh [hh hh] | kit linn | swing 0.3 | gain 0.4\ncb ~ ~ cb ~ ~ cb ~ | kit linn | gain 0.3 | pan 0.5\n0 ~ 4 ~ <5 7> ~ [~ 4] ~ | synth bass | scale mayor | swing 0.25 | gain 0.7",
  },
  {
    id: "reggaeton",
    bpm: 95,
    name: { es: "Reggaetón mínimo", en: "Minimal reggaeton" },
    style: { es: "dembow clásico", en: "classic dembow" },
    code: "bd ~ ~ bd ~ ~ bd ~ | kit 808 | gain 0.9\n~ ~ sn ~ ~ sn ~ ~ | reverb 0.2 | gain 0.6\nhh hh hh <hh [hh hh]> | gain 0.4\n0 ~ ~ 0 ~ ~ <0 3> ~ | synth bass | scale menor | gain 0.7",
  },
  {
    id: "tresillo-cubano",
    bpm: 110,
    name: { es: "Tresillo cubano", en: "Cuban tresillo" },
    style: { es: "euclidiano (3,8)", en: "euclidean (3,8)" },
    code: "bd(3,8) | gain 0.9\ncb(2,8) | pan 0.4 | gain 0.4\nhh hh hh hh hh hh hh hh | gain 0.35\nlt ~ ~ mt ~ ~ ht ~ | gain 0.5 | pan -0.3\n0 ~ ~ 3 ~ ~ 5 ~ | synth bass | scale menor | gain 0.6",
  },
  {
    id: "balcanes",
    bpm: 130,
    name: { es: "Balcánico", en: "Balkan" },
    style: { es: "ritmo cojo (7,16)", en: "limping beat (7,16)" },
    code: "bd(7,16) | every 4 rev | gain 0.85\nsn(3,16) | delay 0.3 | reverb 0.2 | gain 0.55\nhh(11,16) | gain 0.35 | pan 0.3\n7 ~ 9 ~ 7 ~ <11 12> ~ | synth acid | scale menor | fast 2 | gain 0.4 | pan -0.2",
  },
  {
    id: "nana-sintetica",
    bpm: 75,
    name: { es: "Nana sintética", en: "Synthetic lullaby" },
    style: { es: "pad + penta", en: "pad + penta" },
    code: "<0 4> <2 5> <4 7> <2 5> | synth pad | scale penta | slow 2 | reverb 0.7 | gain 0.8\n7 ~ ~ 9 ~ ~ <7 12> ~ | synth piano | scale penta | delay 0.5 | swing 0.2 | gain 0.5\nbd ~ ~ ~ ~ ~ ~ ~ | lpf 300 | gain 0.6",
  },
  {
    id: "melodia-triste",
    bpm: 80,
    name: { es: "Melodía triste", en: "Sad melody" },
    style: { es: "piano + menor", en: "piano + minor" },
    code: "0 ~ 2 ~ 3 ~ <2 5> ~ | synth piano | scale menor | reverb 0.5 | gain 0.7\n0 ~ ~ ~ -3 ~ ~ ~ | synth bass | scale menor | gain 0.6\nbd ~ ~ ~ sn:4 ~ ~ ~ | kit linn | lpf 2500 | gain 0.6\nhh ~ hh ~ | swing 0.3 | pan 0.4 | gain 0.25",
  },
  {
    id: "maquina-de-escribir",
    bpm: 120,
    name: { es: "Máquina de escribir", en: "Typewriter" },
    style: { es: "rimshots nerviosos", en: "nervous rimshots" },
    code: "rm rm? rm [rm rm] rm? rm rm rm? | pan -0.5 | gain 0.6\nrm? rm rm? rm | pan 0.5 | delay 0.4 | gain 0.45\nbd ~ ~ ~ bd ~ ~ ~ | kit 909 | gain 0.8\n~ ~ ~ ~ ~ ~ cb ~ | delay 0.5 | gain 0.3",
  },
];
