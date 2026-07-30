/**
 * Seeded PRNG (mulberry32). The radio must be deterministic: the same slot
 * number generates the same track in every browser — that's how listeners
 * stay in sync without a server.
 */
export type Rng = () => number;

export function mulberry32(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const pick = <T,>(rng: Rng, list: T[]): T => list[Math.floor(rng() * list.length)];

export const rint = (rng: Rng, min: number, max: number): number =>
  min + Math.floor(rng() * (max - min + 1));

/** Random number in [min, max] rounded to 2 decimals (fits our commands). */
export const rnum = (rng: Rng, min: number, max: number): number =>
  Math.round((min + rng() * (max - min)) * 100) / 100;

export const chance = (rng: Rng, p: number): boolean => rng() < p;
