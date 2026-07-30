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
