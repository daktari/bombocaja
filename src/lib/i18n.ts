/**
 * Tiny i18n: flat key → string dictionaries, `{var}` interpolation, and a
 * language toggle that persists + reloads (keeps every component simple).
 * Spanish is the source of truth; missing EN keys fall back to ES.
 */

export type Lang = "es" | "en";

const LANG_KEY = "bombocaja.lang";

export function getLang(): Lang {
  if (typeof localStorage === "undefined") return "es";
  return localStorage.getItem(LANG_KEY) === "en" ? "en" : "es";
}

export function toggleLang() {
  localStorage.setItem(LANG_KEY, getLang() === "es" ? "en" : "es");
  location.reload();
}

/** For data files (sounds, gallery, snippets) that carry both languages. */
export interface Localized {
  es: string;
  en: string;
}

export function pick(l: Localized): string {
  return l[getLang()];
}

const ES: Record<string, string> = {
  "nav.tagline": "juega con sonido",

  "grid.empty": "Escribe un patrón para ver los pasos…",
  "grid.laneVol": "volumen de esta línea",

  "ed.help": "? Ayuda",
  "ed.save": "+ Guardar",
  "ed.share": "↗ Compartir",
  "ed.savePlaceholder": "nombre del ritmo…",
  "ed.saved": "guardado en Library ✓",
  "ed.copied": "enlace copiado ✓",
  "ed.exported": "wav descargado ✓",
  "ed.exportError": "error: no se pudo exportar",
  "ed.defaultName": "Sin nombre",
  "ed.steps": "Pasos",

  "hero.title": "Haz música escribiendo palabras",
  "hero.sub":
    "No hace falta saber música. Ya hay un ritmo esperándote — cuando suene, cambia cualquier palabra y escucha qué pasa.",
  "hero.play": "▶ Dale a Play",
  "hero.skip": "explorar por mi cuenta →",

  "sidebar.hint": "Haz clic en uno para cargarlo en el editor.",

  "ln.lessons": "Lecciones",
  "ln.course": "Curso",
  "ln.recipes": "Recetas",
  "ln.deep": "A fondo",
  "ln.recipe": "Receta",
  "ln.deepLabel": "A fondo",
  "ln.lesson": "Lección",
  "ln.done": "· completada ✓",
  "ln.try": "Pruébalo tú",
  "ln.task": "▸ Reto:",
  "ln.idle": "Dale a Play y escucha. Luego prueba el reto de abajo.",
  "ln.exploring":
    "Estás experimentando — bien. Cualquier cambio vale: dale a Play y escucha qué pasó. El reto sigue ahí si quieres el ✓.",
  "ln.next": "Siguiente:",
  "ln.footer": "Todo lo que aprendas aquí funciona igual en el Editor",

  "lib.remix": "Para remezclar",
  "lib.remixSub": "Puntos de partida con estilo. Escúchalos aquí mismo, ábrelos y hazlos tuyos.",
  "lib.listen": "▶ Escuchar",
  "lib.stop": "■ Parar",
  "lib.remixBtn": "▸ Remezclar",
  "lib.open": "▸ Abrir",
  "lib.yours": "Tus ritmos",
  "lib.empty": "Aún no has guardado ninguno. En el Editor, dale a `+ Guardar` y aparecerá aquí.",
  "lib.delete": "borrar",

  "insp.sounds": "Sonidos",
  "insp.silence": "silencio",
  "insp.aliases": "También valen los nombres de Strudel: `sd`, `oh`, `rim`.",
  "insp.kits": "Cajas de ritmos",
  "insp.kit808": "Roland TR-808 — el sonido del trap",
  "insp.kit909": "Roland TR-909 — el sonido del techno",
  "insp.kitlinn": "LinnDrum — el sonido de los 80",
  "insp.kitsNote": "Mismo patrón, otra alma. Máquinas reales sampleadas.",
  "insp.variants": "Variantes",
  "insp.variantsBody":
    "Cada sonido tiene varias versiones. Prueba `bd:3` o `sn:7` — mismo tipo de golpe, otro sabor.",
  "insp.tricks": "Trucos",
  "insp.trickGroup": "dos golpes en un paso",
  "insp.trickRepeat": "lo mismo, más corto",
  "insp.trickAlt": "alterna en cada vuelta",
  "insp.trickEuclid": "3 golpes repartidos en 8 pasos",
  "insp.trickProb": "suena solo a veces",
  "insp.melody": "Melodía",
  "insp.melNotes": "notas (do, mi, sol, si…)",
  "insp.melOct": "más aguda · sostenido",
  "insp.melDegrees": "peldaños de la escala (7 = otra octava)",
  "insp.melSynth": "piano, bass, pad o acid (el TB-303)",
  "insp.melScale": "mayor, menor o penta",
  "insp.pipe": "Trucos con",
  "insp.pipeIntro": "Añádelos al final de una línea: `bd ~ sn ~ | fast 2`",
  "insp.fast": "el doble de rápido",
  "insp.slow": "la mitad de lento",
  "insp.rev": "del revés",
  "insp.every": "cada 4 vueltas, del revés",
  "insp.lpf": "apaga los agudos (100–12000)",
  "insp.delay": "eco (0–1)",
  "insp.reverb": "espacio (0–1)",
  "insp.pan": "izquierda ↔ derecha (-1 a 1)",
  "insp.gain": "volumen de la línea (0–2)",
  "insp.how": "Cómo funciona",
  "insp.how1": "Separa los sonidos con espacios",
  "insp.how2": "Cada línea es una capa que suena a la vez",
  "insp.how3": "Todo lo que escribas tras `--` son notas tuyas",
  "insp.how4": "Todo se repite en bucle, una y otra vez",
  "insp.how5": "Puedes editar mientras suena",
  "insp.how6": "Cada línea tiene su propio volumen (sliders de abajo)",
  "insp.note": "Nota",
  "insp.noteBody":
    "Los sonidos reales se descargan de internet la primera vez. Sin conexión, bd / sn / hh suenan con versiones sintéticas.",
  "insp.warn": "⚠ Ojo",

  "w.line": "Línea {n}: ",
  "w.unknownSound": '"{token}" no es un sonido conocido (mira la lista de sonidos →)',
  "w.unclosed": 'falta cerrar "{c}"',
  "w.stray": '"{c}" sin su pareja de apertura',
  "w.euclidExtra": 'en "{token}": lo que va después de (k,n) se ignora',
  "w.needsNumber": '"{cmd}" necesita un número (ej: {cmd} 2)',
  "w.every": '"every" se usa así: every 4 rev',
  "w.synth": '"synth" se usa así: synth piano ({list})',
  "w.scale": '"scale" se usa así: scale menor (mayor, menor o penta)',
  "w.kit": '"kit" se usa así: kit 808 ({list})',
  "w.bank": '"bank" se usa así: bank RolandTR808 ({list})',
  "w.unknownCmd": '"{cmd}" no es un truco conocido ({list})',

  "vox.label": "Voz",
  "vox.recTitle": "graba ~2s con tu micro",
  "vox.playTitle": "escuchar",
  "vox.delTitle": "borrar",
  "vox.hint": "→ escribe v1…v8 en el patrón",
  "vox.err": "no se pudo usar el micro",

  "auto.title": "la app muta el ritmo sola — fija líneas con ▣ para protegerlas",
  "grid.lock": "fijar línea (AUTO no la toca)",

  "insp.voice": "Tu voz",
  "insp.voiceBody":
    "Graba hasta 8 sonidos con el micro (fila VOZ) y úsalos como `v1`…`v8`. Funcionan con todo: `[v1 v1]`, `v1(3,8)`, `| reverb 0.5`…",
  "insp.swing": "arrastra el groove (0–1)",
  "insp.drive": "distorsión (0–1)",

  "about.button": "acerca de bombocaja",
  "about.sounds":
    "Los sonidos vienen de `Dirt-Samples` y `tidal-drum-machines`, las librerías comunitarias del ecosistema TidalCycles. Gracias.",
  "about.inspired":
    "Inspirada en `Strudel` y `TidalCycles`, los gigantes del live coding. Si esto te engancha, ve a conocerlos.",
  "about.privacy":
    "Sin cuentas, sin cookies, sin servidores. Tus ritmos, tu progreso y tu voz viven solo en tu navegador y nunca salen de él.",
  "about.license": "Código abierto bajo licencia AGPL-3.0.",
  "about.close": "✕ Cerrar",

  "err.title": "Algo se ha roto",
  "err.body": "No eres tú, somos nosotros. Tus ritmos guardados y tu progreso están a salvo.",
  "err.reload": "↺ Recargar",

  "ac.voice": "tu voz grabada",
  "ac.trick": "truco (después de |)",
  "ac.synth": "instrumento",
  "ac.scale": "escala",
  "ac.kit": "caja de ritmos {name}",
};

const EN: Record<string, string> = {
  "nav.tagline": "play with sound",

  "grid.empty": "Write a pattern to see the steps…",
  "grid.laneVol": "this line's volume",

  "ed.help": "? Help",
  "ed.save": "+ Save",
  "ed.share": "↗ Share",
  "ed.savePlaceholder": "name your beat…",
  "ed.saved": "saved to Library ✓",
  "ed.copied": "link copied ✓",
  "ed.exported": "wav downloaded ✓",
  "ed.exportError": "error: could not export",
  "ed.defaultName": "Untitled",
  "ed.steps": "Steps",

  "hero.title": "Make music by typing words",
  "hero.sub":
    "No musical knowledge needed. There's already a beat waiting for you — once it plays, change any word and hear what happens.",
  "hero.play": "▶ Hit Play",
  "hero.skip": "explore on my own →",

  "sidebar.hint": "Click one to load it into the editor.",

  "ln.lessons": "Lessons",
  "ln.course": "Course",
  "ln.recipes": "Recipes",
  "ln.deep": "Deep dives",
  "ln.recipe": "Recipe",
  "ln.deepLabel": "Deep dive",
  "ln.lesson": "Lesson",
  "ln.done": "· completed ✓",
  "ln.try": "Try it yourself",
  "ln.task": "▸ Challenge:",
  "ln.idle": "Hit Play and listen. Then try the challenge below.",
  "ln.exploring":
    "You're experimenting — nice. Any change counts: hit Play and hear what happened. The challenge is still there if you want the ✓.",
  "ln.next": "Next:",
  "ln.footer": "Everything you learn here works the same in the Editor",

  "lib.remix": "To remix",
  "lib.remixSub": "Starting points with style. Listen right here, open them and make them yours.",
  "lib.listen": "▶ Listen",
  "lib.stop": "■ Stop",
  "lib.remixBtn": "▸ Remix",
  "lib.open": "▸ Open",
  "lib.yours": "Your beats",
  "lib.empty": "Nothing saved yet. In the Editor, hit `+ Save` and it will show up here.",
  "lib.delete": "delete",

  "insp.sounds": "Sounds",
  "insp.silence": "silence",
  "insp.aliases": "Strudel names work too: `sd`, `oh`, `rim`.",
  "insp.kits": "Drum machines",
  "insp.kit808": "Roland TR-808 — the sound of trap",
  "insp.kit909": "Roland TR-909 — the sound of techno",
  "insp.kitlinn": "LinnDrum — the sound of the 80s",
  "insp.kitsNote": "Same pattern, different soul. Real sampled machines.",
  "insp.variants": "Variants",
  "insp.variantsBody":
    "Every sound comes in many versions. Try `bd:3` or `sn:7` — same kind of hit, different flavor.",
  "insp.tricks": "Tricks",
  "insp.trickGroup": "two hits in one step",
  "insp.trickRepeat": "same thing, shorter",
  "insp.trickAlt": "alternates every loop",
  "insp.trickEuclid": "3 hits spread over 8 steps",
  "insp.trickProb": "only plays sometimes",
  "insp.melody": "Melody",
  "insp.melNotes": "notes (do, mi, sol, si…)",
  "insp.melOct": "higher octave · sharp",
  "insp.melDegrees": "steps of the scale (7 = next octave)",
  "insp.melSynth": "piano, bass, pad or acid (the TB-303)",
  "insp.melScale": "mayor, menor or penta",
  "insp.pipe": "Tricks with",
  "insp.pipeIntro": "Add them at the end of a line: `bd ~ sn ~ | fast 2`",
  "insp.fast": "twice as fast",
  "insp.slow": "half as slow",
  "insp.rev": "backwards",
  "insp.every": "every 4 loops, backwards",
  "insp.lpf": "turns down the highs (100–12000)",
  "insp.delay": "echo (0–1)",
  "insp.reverb": "space (0–1)",
  "insp.pan": "left ↔ right (-1 to 1)",
  "insp.gain": "line volume (0–2)",
  "insp.how": "How it works",
  "insp.how1": "Separate sounds with spaces",
  "insp.how2": "Each line is a layer, all playing at once",
  "insp.how3": "Anything after `--` is your own note",
  "insp.how4": "Everything loops, over and over",
  "insp.how5": "You can edit while it plays",
  "insp.how6": "Each line has its own volume (sliders below)",
  "insp.note": "Note",
  "insp.noteBody":
    "Real sounds download from the internet the first time. Offline, bd / sn / hh fall back to synthesized versions.",
  "insp.warn": "⚠ Heads up",

  "w.line": "Line {n}: ",
  "w.unknownSound": '"{token}" is not a known sound (check the sound list →)',
  "w.unclosed": 'missing closing "{c}"',
  "w.stray": '"{c}" has no opening partner',
  "w.euclidExtra": 'in "{token}": anything after (k,n) is ignored',
  "w.needsNumber": '"{cmd}" needs a number (e.g. {cmd} 2)',
  "w.every": '"every" works like this: every 4 rev',
  "w.synth": '"synth" works like this: synth piano ({list})',
  "w.scale": '"scale" works like this: scale minor (mayor, menor or penta)',
  "w.kit": '"kit" works like this: kit 808 ({list})',
  "w.bank": '"bank" works like this: bank RolandTR808 ({list})',
  "w.unknownCmd": '"{cmd}" is not a known trick ({list})',

  "vox.label": "Voice",
  "vox.recTitle": "record ~2s with your mic",
  "vox.playTitle": "listen",
  "vox.delTitle": "delete",
  "vox.hint": "→ type v1…v8 in the pattern",
  "vox.err": "could not access the mic",

  "auto.title": "the app mutates the beat on its own — lock lines with ▣ to protect them",
  "grid.lock": "lock line (AUTO won't touch it)",

  "insp.voice": "Your voice",
  "insp.voiceBody":
    "Record up to 8 sounds with the mic (VOICE row) and use them as `v1`…`v8`. They work with everything: `[v1 v1]`, `v1(3,8)`, `| reverb 0.5`…",
  "insp.swing": "drags the groove (0–1)",
  "insp.drive": "distortion (0–1)",

  "about.button": "about bombocaja",
  "about.sounds":
    "Sounds come from `Dirt-Samples` and `tidal-drum-machines`, the community libraries of the TidalCycles ecosystem. Thank you.",
  "about.inspired":
    "Inspired by `Strudel` and `TidalCycles`, the giants of live coding. If this hooks you, go meet them.",
  "about.privacy":
    "No accounts, no cookies, no servers. Your beats, your progress and your voice live only in your browser and never leave it.",
  "about.license": "Open source under the AGPL-3.0 license.",
  "about.close": "✕ Close",

  "err.title": "Something broke",
  "err.body": "It's not you, it's us. Your saved beats and progress are safe.",
  "err.reload": "↺ Reload",

  "ac.voice": "your recorded voice",
  "ac.trick": "trick (after |)",
  "ac.synth": "instrument",
  "ac.scale": "scale",
  "ac.kit": "drum machine {name}",
};

export function t(key: string, vars?: Record<string, string | number>): string {
  const table = getLang() === "en" ? EN : ES;
  let s = table[key] ?? ES[key] ?? key;
  if (vars) {
    for (const [k, v] of Object.entries(vars)) s = s.split(`{${k}}`).join(String(v));
  }
  return s;
}
