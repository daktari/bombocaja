import type { Localized } from "./i18n";

export type SoundColor = "cyan" | "fuchsia" | "slate" | "amber";

export interface SoundDef {
  id: string;
  name: Localized;
  feel: string;
  color: SoundColor;
}

/**
 * Curated beginner-friendly subset of the Dirt-Samples library.
 * The ids match the keys in the strudel.json manifest.
 */
export const SOUNDS: SoundDef[] = [
  { id: "bd", name: { es: "golpe profundo", en: "deep hit" }, feel: "BUM", color: "cyan" },
  { id: "sn", name: { es: "golpe seco", en: "sharp hit" }, feel: "TAK", color: "fuchsia" },
  { id: "hh", name: { es: "brillo corto", en: "short shimmer" }, feel: "ts", color: "slate" },
  { id: "ho", name: { es: "brillo largo", en: "long shimmer" }, feel: "tsss", color: "slate" },
  { id: "cp", name: { es: "palmada", en: "handclap" }, feel: "CLAP", color: "fuchsia" },
  { id: "rm", name: { es: "toque de madera", en: "wood tap" }, feel: "tok", color: "fuchsia" },
  { id: "cb", name: { es: "campana", en: "cowbell" }, feel: "TONK", color: "amber" },
  { id: "lt", name: { es: "tambor grave", en: "low tom" }, feel: "dum", color: "amber" },
  { id: "mt", name: { es: "tambor medio", en: "mid tom" }, feel: "dom", color: "amber" },
  { id: "ht", name: { es: "tambor agudo", en: "high tom" }, feel: "dim", color: "amber" },
];

export const SOUND_IDS = new Set(SOUNDS.map((s) => s.id));

/** Strudel/tidal-drum-machines names accepted as synonyms of our ids. */
export const SOUND_ALIASES: Record<string, string> = {
  sd: "sn",
  oh: "ho",
  rim: "rm",
};

export function soundDef(id: string): SoundDef | undefined {
  return SOUNDS.find((s) => s.id === id);
}

// -------------------------------------------------------------- drum kits

/** Short kit name → full machine name in the tidal-drum-machines map. */
export const KITS: Record<string, string> = {
  "808": "RolandTR808",
  "909": "RolandTR909",
  linn: "LinnDrum",
};

/** Our sound id → sample suffix used by the drum machine maps. */
const MACHINE_SOUND: Record<string, string> = {
  bd: "bd",
  sn: "sd",
  hh: "hh",
  ho: "oh",
  cp: "cp",
  rm: "rim",
  cb: "cb",
  lt: "lt",
  mt: "mt",
  ht: "ht",
};

/** Sample-map key for a sound played through a kit, e.g. "RolandTR808_bd". */
export function kitSampleId(kit: string, soundId: string): string {
  return `${KITS[kit]}_${MACHINE_SOUND[soundId] ?? soundId}`;
}
