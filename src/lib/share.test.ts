import { beforeEach, describe, expect, it } from "vitest";
import {
  decodePattern,
  encodePattern,
  momentFromHash,
  momentUrl,
  patternUrl,
  sharedFromHash,
} from "./share";

const fakeLocation = { origin: "https://bakaluti.test", pathname: "/", hash: "" };

beforeEach(() => {
  (globalThis as { location?: typeof fakeLocation }).location = { ...fakeLocation };
});

describe("pattern sharing", () => {
  it("round-trips multiline patterns with accents and emoji", () => {
    const code = "-- drums 🥁\nbd(3,8) | reverb 0.5\ncanción ñ áéíóú";
    const encoded = encodePattern(code);
    expect(/[+/=]/.test(encoded)).toBe(false); // url-safe
    expect(decodePattern(encoded)).toBe(code);
  });

  it("returns null on garbage input", () => {
    expect(decodePattern("%%%not-base64%%%")).toBeNull();
  });

  it("includes bpm in the url only when non-default", () => {
    expect(patternUrl("bd ~ sn ~", 175)).toContain("&b=175");
    expect(patternUrl("bd ~ sn ~", 120)).not.toContain("&b=");
  });

  it("reads code and bpm back from the hash", () => {
    globalThis.location.hash = `#p=${encodePattern("bd bd bd bd")}&b=175`;
    expect(sharedFromHash()).toEqual({ code: "bd bd bd bd", bpm: 175 });
  });

  it("reads legacy links without bpm", () => {
    globalThis.location.hash = `#p=${encodePattern("bd ~ sn ~")}`;
    expect(sharedFromHash()).toEqual({ code: "bd ~ sn ~", bpm: undefined });
  });

  it("returns null when there is no shared pattern", () => {
    globalThis.location.hash = "";
    expect(sharedFromHash()).toBeNull();
  });
});

describe("FM moments", () => {
  it("round-trips a moment through the url hash", () => {
    const url = momentUrl("niebla", 1_900_000_123);
    expect(url).toBe("https://bakaluti.test/#fm=niebla&t=1900000123");
    expect(momentFromHash("#fm=niebla&t=1900000123")).toEqual({
      dial: "niebla",
      t: 1_900_000_123,
    });
  });

  it("rejects unknown dials and garbage", () => {
    expect(momentFromHash("#fm=am&t=123")).toBeNull();
    expect(momentFromHash("#fm=fm&t=abc")).toBeNull();
    expect(momentFromHash("#p=whatever")).toBeNull();
  });
});
