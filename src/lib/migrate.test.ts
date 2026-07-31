import { beforeEach, describe, expect, it } from "vitest";
import { migrateLegacyStorage } from "./migrate";

/** Minimal localStorage double for the node test environment. */
function fakeStorage(initial: Record<string, string>) {
  const map = new Map(Object.entries(initial));
  return {
    get length() {
      return map.size;
    },
    key: (i: number) => [...map.keys()][i] ?? null,
    getItem: (k: string) => map.get(k) ?? null,
    setItem: (k: string, v: string) => void map.set(k, v),
    removeItem: (k: string) => void map.delete(k),
    snapshot: () => Object.fromEntries(map),
  };
}

let storage: ReturnType<typeof fakeStorage>;

beforeEach(() => {
  storage = fakeStorage({
    "bombocaja.lang": "es",
    "bombocaja.patterns": '[{"name":"mi ritmo"}]',
    "bakaluti.visited": "1", // already migrated on a previous visit
    "bombocaja.visited": "1", // stale twin must not clobber it
    unrelated: "stays",
  });
  (globalThis as { localStorage?: unknown }).localStorage = storage;
});

describe("legacy storage migration", () => {
  it("renames every bombocaja key, keeps data, never clobbers", () => {
    migrateLegacyStorage();
    expect(storage.snapshot()).toEqual({
      "bakaluti.lang": "es",
      "bakaluti.patterns": '[{"name":"mi ritmo"}]',
      "bakaluti.visited": "1",
      unrelated: "stays",
    });
  });

  it("is idempotent", () => {
    migrateLegacyStorage();
    migrateLegacyStorage();
    expect(storage.getItem("bakaluti.lang")).toBe("es");
    expect(storage.getItem("bombocaja.lang")).toBeNull();
  });
});
