import { describe, expect, it } from "vitest";
import { radioAt, SLOT_SECONDS } from "./radio";
import { ANCHORS } from "./anchors";
import { critique } from "./critic";
import { parsePattern } from "./parser";

describe("the station", () => {
  it("is deterministic: same moment, same broadcast everywhere", () => {
    const t = 1_900_000_123;
    expect(radioAt("fm", t)).toEqual(radioAt("fm", t));
    expect(radioAt("niebla", t)).toEqual(radioAt("niebla", t));
  });

  it("stays on the same track within a slot and changes on the boundary", () => {
    const slotStart = 4_000_000 * SLOT_SECONDS;
    const a = radioAt("fm", slotStart + 1);
    const b = radioAt("fm", slotStart + SLOT_SECONDS - 1);
    const c = radioAt("fm", slotStart + SLOT_SECONDS + 1);
    expect(a.track.code).toBe(b.track.code);
    expect(a.slot + 1).toBe(c.slot);
  });

  it("plays an anchor every 4th slot", () => {
    for (let i = 0; i < 16; i++) {
      const air = radioAt("fm", (4_000_000 + i) * SLOT_SECONDS + 5);
      expect(air.isAnchor).toBe(air.slot % 4 === 0);
    }
  });

  it("niebla dial only ever plays niebla", () => {
    for (let i = 0; i < 50; i++) {
      const air = radioAt("niebla", (5_000_000 + i) * SLOT_SECONDS + 5);
      expect(air.track.style).toBe("niebla");
    }
  });

  it("arrangement builds up within the slot", () => {
    // find a generative slot with 3 states
    for (let i = 1; i < 40; i++) {
      const base = (6_000_000 + i) * SLOT_SECONDS;
      const air = radioAt("fm", base + 5);
      if (air.isAnchor || air.track.states.length < 3) continue;
      expect(radioAt("fm", base + 5).stateIndex).toBe(0);
      expect(radioAt("fm", base + Math.floor(SLOT_SECONDS * 0.2)).stateIndex).toBe(1);
      expect(radioAt("fm", base + Math.floor(SLOT_SECONDS * 0.5)).stateIndex).toBe(2);
      return;
    }
    throw new Error("no generative 3-state slot found in sample");
  });

  it("a full broadcast day parses clean on both dials", () => {
    const dayStart = 7_000_000 * SLOT_SECONDS;
    for (let slot = 0; slot < (24 * 3600) / SLOT_SECONDS; slot++) {
      for (const dial of ["fm", "niebla"] as const) {
        const air = radioAt(dial, dayStart + slot * SLOT_SECONDS + 5);
        expect(parsePattern(air.track.code).warnings).toEqual([]);
      }
    }
  });
});

describe("anchors", () => {
  it("every anchor parses clean", () => {
    for (const anchor of ANCHORS) {
      expect(parsePattern(anchor.code).warnings, anchor.title).toEqual([]);
    }
  });

  it("generative tracks aired by the station pass the critic", () => {
    for (let i = 1; i < 30; i++) {
      const air = radioAt("fm", (8_000_000 + i) * SLOT_SECONDS + 5);
      if (air.isAnchor) continue;
      const verdict = critique(air.track, air.track.style);
      expect(verdict.issues, `slot ${air.slot} (${air.track.style})`).toEqual([]);
    }
  });
});
