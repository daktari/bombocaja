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
    id: "tresillo-cubano",
    bpm: 110,
    name: { es: "Tresillo cubano", en: "Cuban tresillo" },
    style: { es: "euclidiano (3,8)", en: "euclidean (3,8)" },
    code: "bd(3,8) | gain 0.9\ncb(2,8) | pan 0.4 | gain 0.4\nhh hh hh hh hh hh hh hh | gain 0.35\nlt ~ ~ mt ~ ~ ht ~ | gain 0.5 | pan -0.3\n0 ~ ~ 3 ~ ~ 5 ~ | synth bass | scale menor | gain 0.6",
  },
  {
    id: "melodia-triste",
    bpm: 80,
    name: { es: "Melodía triste", en: "Sad melody" },
    style: { es: "piano + menor", en: "piano + minor" },
    code: "0 ~ 2 ~ 3 ~ <2 5> ~ | synth piano | scale menor | reverb 0.5 | gain 0.7\n0 ~ ~ ~ -3 ~ ~ ~ | synth bass | scale menor | gain 0.6\nbd ~ ~ ~ sn:4 ~ ~ ~ | kit linn | lpf 2500 | gain 0.6\nhh ~ hh ~ | swing 0.3 | pan 0.4 | gain 0.25",
  },
];
