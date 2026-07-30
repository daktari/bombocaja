import { describe, expect, it } from "vitest";
import { compose, STYLES } from "./composer";
import { critique } from "./critic";
import { parsePattern } from "./parser";

const SEEDS_PER_STYLE = 2500; // 4 styles × 2500 = 10,000 tracks

describe("composer", () => {
  it("is deterministic: same seed, same track", () => {
    for (const style of STYLES) {
      const a = compose(style, 8400211);
      const b = compose(style, 8400211);
      expect(a).toEqual(b);
    }
  });

  it("niebla: pad-lane periods never coincide — the drift is guaranteed", () => {
    for (let seed = 1; seed <= 300; seed++) {
      const track = compose("niebla", seed * 17 + 1);
      const lines = track.code.split("\n");
      const periods = parsePattern(track.code)
        .lanes.map((lane, i) => ({ lane, line: lines[i] }))
        .filter(({ line }) => line.includes("synth pad"))
        .map(({ lane }) => Math.round(lane.steps.length / lane.speed));
      expect(new Set(periods).size, `seed ${seed}: periodos ${periods.join(",")}`).toBe(
        periods.length
      );
    }
  });

  it("niebla: seeds produce structurally different tracks, not decimal jitter", () => {
    const signatures = new Set(
      Array.from({ length: 40 }, (_, i) => {
        const track = compose("niebla", i * 31 + 3);
        const lines = track.code.split("\n");
        const has = (word: string) => (lines.some((l) => l.includes(word)) ? "1" : "0");
        return `${lines.length}:${has("piano")}${has("bd")}${has("ho")}${has("rm(")}`;
      })
    );
    // at least 4 distinct structural shapes across 40 seeds (the archetypes)
    expect(signatures.size).toBeGreaterThanOrEqual(4);
  });

  it("niebla: the floor varies in kind, not only in decimals", () => {
    const counts = new Map<string, number>();
    const total = 300;
    for (let seed = 1; seed <= total; seed++) {
      const track = compose("niebla", seed * 17 + 5);
      const floor = track.code.split("\n").find((l) => /-- (suelo|pulso|lecho)/.test(l));
      const label = floor?.match(/-- (.+)$/)?.[1] ?? "sin suelo";
      counts.set(label, (counts.get(label) ?? 0) + 1);
    }
    // at least 6 distinct floor kinds in rotation…
    expect(counts.size, [...counts.keys()].join(", ")).toBeGreaterThanOrEqual(6);
    // …and none of them carrying half the channel
    for (const [label, n] of counts) {
      expect(n / total, label).toBeLessThan(0.45);
    }
  });

  for (const style of ["motor", "oxido", "casa"] as const) {
    it(`${style}: no non-kick line SHAPE dominates the channel`, () => {
      const N = 300;
      const shapes = new Map<string, number>();
      for (let seed = 1; seed <= N; seed++) {
        const track = compose(style, seed * 11 + 3);
        for (const line of track.code.split("\n")) {
          const shape = line.replace(/-?\d+(\.\d+)?/g, "#").trim();
          if (shape.includes("bd")) continue; // the four-on-the-floor anchor MAY repeat
          shapes.set(shape, (shapes.get(shape) ?? 0) + 1);
        }
      }
      for (const [shape, n] of shapes) {
        expect(n / N, shape).toBeLessThanOrEqual(0.6);
      }
    });
  }

  it("different seeds produce different tracks", () => {
    const codes = new Set(
      Array.from({ length: 50 }, (_, i) => compose("motor", i * 7 + 1).code)
    );
    expect(codes.size).toBeGreaterThan(40);
  });

  for (const style of STYLES) {
    it(`${style}: ${SEEDS_PER_STYLE} seeds parse clean and pass the critic`, () => {
      const failures: string[] = [];
      for (let seed = 1; seed <= SEEDS_PER_STYLE; seed++) {
        const track = compose(style, seed * 13 + 7);
        const { warnings } = parsePattern(track.code);
        if (warnings.length > 0) {
          failures.push(`seed ${seed}: parser → ${warnings[0]}`);
          continue;
        }
        const verdict = critique(track, style);
        if (!verdict.ok) failures.push(`seed ${seed}: crítico → ${verdict.issues.join("; ")}`);
        if (failures.length > 5) break;
      }
      expect(failures, failures.join("\n")).toEqual([]);
    });
  }
});
