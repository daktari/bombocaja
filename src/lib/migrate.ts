/**
 * One-time storage rename: `bombocaja.*` → `bakaluti.*` — the 2026 rebrand
 * finally reaching the internals. Copies every legacy key (never clobbering
 * an existing new one) and removes the old ones. Runs once per visit at
 * startup; a browser with nothing legacy pays a no-op loop.
 *
 * The voice-recording IndexedDB keeps its legacy database name on purpose:
 * renaming it would mean copying blobs across databases for zero visible
 * benefit.
 */
export function migrateLegacyStorage(): void {
  if (typeof localStorage === "undefined") return;
  const legacy: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith("bombocaja.")) legacy.push(key);
  }
  for (const key of legacy) {
    const target = "bakaluti." + key.slice("bombocaja.".length);
    if (localStorage.getItem(target) === null) {
      const value = localStorage.getItem(key);
      if (value !== null) localStorage.setItem(target, value);
    }
    localStorage.removeItem(key);
  }
}
