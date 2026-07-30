import type { Track } from "./composer";

/**
 * Curated anchor tracks — the station's own singles, aired every 4th slot.
 * Hand-tuned, stable across composer changes. More land in phase B.
 */

const anchor = (
  style: Track["style"],
  title: string,
  bpm: number,
  code: string
): Track => ({ style, title, bpm, code, states: [code] });

export const ANCHORS: Track[] = [
  // ---------------------------------------------------------------- MOTOR
  anchor(
    "motor",
    "Correa de distribución",
    124,
    `bd bd bd bd | kit 909 | gain 0.9 -- bombo constante
~ cp ~ cp | kit 909 | reverb 0.3 | gain 0.5 -- palmada
~ ho ~ ho | kit 909 | gain 0.4 -- contratiempo
0 ~ [~ 0] ~ 3 ~ [~ 5] ~ | synth bass | scale menor | swing 0.15 | gain 0.7 -- bajo funk
<0 5> ~ ~ ~ | synth pad | scale menor | slow 2 | reverb 0.55 | gain 0.55 -- cuerdas: base
<2 7> ~ ~ ~ | synth pad | scale menor | slow 2 | reverb 0.55 | gain 0.4 -- cuerdas: armonía
~ ~ <7 ~> ~ ~ <9 12> ~ ~ | synth piano | scale menor | delay 0.45 | pan 0.3 | gain 0.4 -- detalles`
  ),
  anchor(
    "motor",
    "Cromo y humo",
    126,
    `bd:1 bd bd bd | kit 909 | gain 0.9 -- bombo constante
~ cp ~ cp | kit 909 | reverb 0.3 | gain 0.5 -- palmada
~ ho ~ ho | kit 909 | gain 0.42 -- contratiempo
hh hh hh | kit 909 | gain 0.26 -- hats, 3 contra 4
0 ~ ~ [~ 0] ~ 3 ~ <5 7> | synth bass | scale menor | swing 0.18 | gain 0.72 -- bajo funk
<0 -2 3 2> ~ ~ ~ | synth pad | scale menor | slow 2 | reverb 0.55 | gain 0.55 -- cuerdas: progresión
<2 0 5 4> ~ ~ ~ | synth pad | scale menor | slow 2 | reverb 0.55 | gain 0.38 -- cuerdas: armonía
0 ~ ~ <12 ~> ~ ~ 7 ~ | synth acid | scale menor | delay 0.3 | gain 0.34 -- ácido lejano`
  ),
  anchor(
    "motor",
    "Última ronda en la fábrica",
    122,
    `bd bd bd bd | kit 909 | gain 0.9 -- bombo constante
~ ~ cp ~ | kit 909 | reverb 0.35 | gain 0.5 -- palmada escasa
~ ho ~ ho | kit 909 | gain 0.38 -- contratiempo
-2 ~ [~ -2] ~ 2 ~ [~ 3] ~ | synth bass | scale menor | swing 0.12 | gain 0.7 -- bajo grave
<0 3 5 2> ~ ~ ~ | synth pad | scale menor | slow 2 | reverb 0.6 | gain 0.55 -- cuerdas: progresión
<2 5 7 4> ~ ~ ~ | synth pad | scale menor | slow 2 | reverb 0.6 | gain 0.4 -- cuerdas: armonía
~ <9 ~> ~ ~ 7 ~ ~ <12 ~> | synth piano | scale menor | delay 0.5 | pan -0.35 | gain 0.4 -- detalles`
  ),
  // ---------------------------------------------------------------- ÓXIDO
  anchor(
    "oxido",
    "Herrumbre madre",
    140,
    `bd:3 bd bd bd | kit 909 | drive 0.65 | gain 0.9 -- el martillo
~ ~ sn ~ | kit 909 | drive 0.55 | gain 0.5 -- caja seca
hh hh hh hh | kit 909 | fast 2 | drive 0.35 | gain 0.28 -- hats de máquina
mt ~ mt mt ~ | drive 0.5 | pan -0.4 | gain 0.5 -- mt rodando, 5 contra 4
ht(7,16) | drive 0.4 | pan 0.35 | gain 0.38 | every 4 rev -- grieta
0 0 0 <0 -3> | synth bass | scale menor | lpf 320 | drive 0.5 | gain 0.65 -- sub pulsado`
  ),
  anchor(
    "oxido",
    "Turno de noche",
    138,
    `bd bd bd bd | kit 909 | drive 0.7 | gain 0.9 -- el martillo
~ ~ sn:6 ~ | kit 909 | drive 0.6 | gain 0.48 -- caja seca
hh hh hh hh? | kit 909 | fast 2 | drive 0.4 | gain 0.3 -- hats de máquina
rm ~ ~ rm ~ rm ~ | drive 0.5 | pan 0.4 | gain 0.5 -- rm rodando, 7 contra 4
<-7 -5> ~ | synth pad | scale menor | slow 4 | lpf 350 | drive 0.4 | gain 0.6 -- drone grave
<0 -2> ~ ~ | synth pad | scale menor | slow 4 | lpf 700 | gain 0.3 -- niebla`
  ),
  anchor(
    "oxido",
    "Viga y martillo",
    142,
    `bd bd bd bd | kit 909 | drive 0.75 | gain 0.9 -- el martillo
~ ~ ~ [bd bd] | kit 909 | drive 0.6 | gain 0.45 -- doble bombo
~ ~ sn ~ | kit 909 | drive 0.5 | gain 0.5 -- caja seca
lt ~ ~ lt lt ~ ~ | drive 0.55 | pan -0.45 | gain 0.52 | every 4 rev -- lt rodando, 7 contra 4
hh hh hh hh | kit 909 | fast 2 | drive 0.45 | gain 0.26 -- hats de máquina
0 0 0 <0 -5> | synth bass | scale menor | lpf 280 | drive 0.55 | gain 0.68 -- sub pulsado`
  ),
  // ----------------------------------------------------------------- CASA
  anchor(
    "casa",
    "Portal abierto",
    124,
    `bd bd bd bd | kit 909 | gain 0.9 -- bombo constante
~ ho ~ ho | kit 909 | swing 0.32 | gain 0.45 -- hat abierto a contratiempo
~ cp ~ cp | kit 909 | reverb 0.3 | gain 0.5 -- palmada
hh hh? hh hh | kit 909 | swing 0.32 | gain 0.34 -- hats
0 ~ [~ 4] ~ 7 ~ <4 9> ~ | synth bass | scale mayor | swing 0.32 | gain 0.7 -- bajo saltarín
~ <7 9 11 9> ~ ~ <12 ~> ~ ~ ~ | synth piano | scale mayor | delay 0.5 | pan 0.3 | gain 0.45 -- pianito`
  ),
  anchor(
    "casa",
    "Vecinos bailando",
    123,
    `bd bd bd bd | kit linn | gain 0.9 -- bombo constante
~ ho ~ ho | kit linn | swing 0.38 | gain 0.42 -- hat abierto a contratiempo
~ cp ~ cp | kit linn | reverb 0.32 | gain 0.5 -- palmada
hh hh hh hh | kit linn | fast 2 | swing 0.38 | gain 0.24 -- hats
3 ~ [~ 3] 4 ~ <7 9> ~ ~ | synth bass | scale mayor | swing 0.38 | gain 0.68 -- bajo saltarín
~ <9 7 12 11> ~ ~ <11 ~> ~ ~ ~ | synth piano | scale mayor | delay 0.52 | pan -0.28 | gain 0.44 -- pianito`
  ),
  anchor(
    "casa",
    "Azotea al sol",
    125,
    `bd bd bd bd | kit 909 | gain 0.9 -- bombo constante
~ ho ~ ho | kit 909 | swing 0.28 | gain 0.46 -- hat abierto a contratiempo
~ cp ~ cp | kit 909 | reverb 0.28 | gain 0.5 -- palmada
0 [~ 0] ~ 4 ~ [~ 7] ~ <4 2> | synth bass | scale mayor | swing 0.28 | gain 0.7 -- bajo saltarín
~ <7 11 9 14> ~ ~ <12 ~> ~ ~ ~ | synth piano | scale mayor | delay 0.48 | pan 0.34 | gain 0.46 -- pianito
cb(2,8) | pan 0.45 | gain 0.28 -- cencerro lejano`
  ),
  // --------------------------------------------------------------- NIEBLA
  anchor(
    "niebla",
    "Romance en la niebla",
    72,
    `<-7 -4> ~ ~ ~ | synth pad | scale menor | slow 4 | lpf 500 | reverb 0.65 | gain 0.55 -- suelo grave
<0 3 5 2> ~ ~ ~ ~ | synth pad | scale menor | slow 4 | delay 0.4 | reverb 0.65 | gain 0.5 -- bruma
7 ~ ~ ~ 9 ~ ~ <12 ~> ~ | synth piano | scale menor | delay 0.6 | reverb 0.5 | gain 0.42 -- destellos fríos
bd ~ ~ ~ ~ ~ ~ ~ | lpf 250 | reverb 0.4 | gain 0.5 -- latido enterrado
ho ~ ~ ~ ~ ~ | lpf 550 | pan 0.4 | gain 0.2 -- aliento`
  ),
  anchor(
    "niebla",
    "Faro y marea",
    66,
    `<-7 -9> ~ ~ ~ ~ | synth pad | scale penta | slow 8 | lpf 450 | reverb 0.7 | gain 0.55 -- suelo grave
<0 4 2 5> ~ ~ ~ ~ ~ | synth pad | scale penta | slow 4 | delay 0.45 | reverb 0.7 | gain 0.48 -- bruma
<7 9> ~ ~ ~ ~ 12 ~ ~ ~ | synth piano | scale penta | delay 0.55 | reverb 0.45 | gain 0.4 -- destellos
bd ~ ~ ~ ~ ~ ~ ~ | lpf 220 | reverb 0.35 | gain 0.48 -- latido enterrado`
  ),
  anchor(
    "niebla",
    "Vapor de radiador",
    62,
    `<-7 -5> ~ ~ | synth pad | scale menor | slow 8 | lpf 600 | reverb 0.68 | gain 0.56 -- suelo grave
<0 2 -2 3> ~ ~ ~ ~ | synth pad | scale menor | slow 4 | delay 0.38 | reverb 0.68 | gain 0.48 -- bruma
9 ~ ~ <7 ~> ~ ~ ~ <12 14> ~ | synth piano | scale menor | delay 0.58 | reverb 0.42 | gain 0.4 -- destellos
ho ~ ~ ~ ~ | lpf 480 | pan -0.4 | gain 0.2 -- aliento`
  ),
];
