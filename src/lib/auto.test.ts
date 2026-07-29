import { describe, expect, it } from "vitest";
import { mutateCode } from "./auto";
import { parsePattern } from "./parser";

describe("AUTO mutations", () => {
  it("never introduces parser warnings over many runs", () => {
    let code = "bd ~ sn ~\nhh hh ho hh\n0 0 3 5 | synth bass | scale menor";
    for (let i = 0; i < 50; i++) {
      const mutation = mutateCode(code, []);
      if (mutation) code = mutation.code;
    }
    expect(parsePattern(code).warnings).toEqual([]);
  });

  it("respects locked lanes", () => {
    const code = "bd bd bd bd\nhh hh hh hh";
    for (let i = 0; i < 30; i++) {
      const mutation = mutateCode(code, [true, false]);
      if (mutation) {
        expect(mutation.code.split("\n")[0]).toBe("bd bd bd bd");
      }
    }
  });

  it("returns null when every lane is locked", () => {
    expect(mutateCode("bd ~ sn ~", [true])).toBeNull();
  });

  it("preserves inline comments and pipe commands", () => {
    for (let i = 0; i < 20; i++) {
      const mutation = mutateCode("bd ~ sn ~ | kit 808 -- el bombo", []);
      if (mutation) {
        expect(mutation.code).toContain("| kit 808");
        expect(mutation.code).toContain("-- el bombo");
      }
    }
  });
});
