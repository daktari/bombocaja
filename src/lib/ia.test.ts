import { describe, expect, it } from "vitest";
import { extractBpm, playableSlice, sanitizeIaCode } from "./ia";

describe("IA output sanitizer", () => {
  it("keeps a clean pattern untouched", () => {
    const code = "-- bpm 128\nbd bd bd bd | kit 909 | gain 0.9 -- bombo\n~ cp ~ cp -- palmada";
    expect(sanitizeIaCode(code)).toBe(code);
  });

  it("strips markdown fences and surrounding prose", () => {
    const raw =
      "Aquí tienes tu patrón:\n```\n-- bpm 130\nbd bd bd bd -- bombo\n```\n¡Que lo disfrutes!";
    expect(sanitizeIaCode(raw)).toBe("-- bpm 130\nbd bd bd bd -- bombo");
  });

  it("drops prose lines the parser rejects, keeps valid ones", () => {
    const raw = "Este es un techno duro.\nbd bd bd bd | drive 0.6 -- martillo\nEspero que te guste.";
    expect(sanitizeIaCode(raw)).toBe("bd bd bd bd | drive 0.6 -- martillo");
  });

  it("playableSlice drops the half-written last line while streaming", () => {
    const streamed = "-- bpm 124\nbd bd bd bd -- bombo\n~ cp ~ c";
    expect(playableSlice(streamed)).toBe("-- bpm 124\nbd bd bd bd -- bombo");
  });

  it("extracts and clamps the announced bpm", () => {
    expect(extractBpm("-- bpm 128\nbd bd bd bd")).toBe(128);
    expect(extractBpm("-- BPM 999\nbd")).toBe(180);
    expect(extractBpm("-- bpm 10\nbd")).toBe(60);
    expect(extractBpm("bd bd bd bd")).toBeUndefined();
  });
});
