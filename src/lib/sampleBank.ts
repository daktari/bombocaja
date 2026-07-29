const MANIFEST_URLS = [
  // the classic Dirt-Samples library (bd, sn, hh…)
  "https://raw.githubusercontent.com/tidalcycles/dirt-samples/master/strudel.json",
  // real sampled drum machines (RolandTR808_bd, RolandTR909_sd, LinnDrum_hh…)
  "https://raw.githubusercontent.com/felixroos/dough-samples/main/tidal-drum-machines.json",
  // pitched piano samples (note-name keyed map)
  "https://raw.githubusercontent.com/felixroos/dough-samples/main/piano.json",
];

const NOTE_SEMITONES: Record<string, number> = { c: 0, d: 2, e: 4, f: 5, g: 7, a: 9, b: 11 };

/** "Ds4" / "A0" / "Cb2" → MIDI number, or null if unparseable. */
function noteNameToMidi(name: string): number | null {
  const m = /^([A-Ga-g])(s|b)?(-?\d)$/.exec(name);
  if (!m) return null;
  const accidental = m[2] === "s" ? 1 : m[2] === "b" ? -1 : 0;
  return 12 * (parseInt(m[3], 10) + 1) + NOTE_SEMITONES[m[1].toLowerCase()] + accidental;
}

interface PitchedEntry {
  midi: number;
  url: string;
}

/**
 * Loads real percussion samples from the same libraries Strudel uses.
 * Everything is lazy and cached; if the network is down the audio
 * engine falls back to synthesized sounds.
 */
class SampleBank {
  /** sample-map key → absolute URLs of its variants */
  private files: Record<string, string[]> = {};
  /** pitched instruments: id → entries sorted by midi */
  private pitchedMaps: Record<string, PitchedEntry[]> = {};
  private manifestPromise: Promise<boolean> | null = null;
  private buffers = new Map<string, AudioBuffer>();
  private pending = new Map<string, Promise<void>>();

  private ensureManifests(): Promise<boolean> {
    if (!this.manifestPromise) {
      this.manifestPromise = Promise.all(
        MANIFEST_URLS.map((url) =>
          fetch(url)
            .then((res) => res.json())
            .then((json: Record<string, unknown>) => {
              const base = typeof json._base === "string" ? json._base : "";
              for (const [key, value] of Object.entries(json)) {
                if (Array.isArray(value)) {
                  this.files[key] = (value as string[]).map((path) => base + path);
                } else if (value && typeof value === "object") {
                  // note-name keyed map (e.g. piano): {"A0": "A0v8.mp3", ...}
                  const entries: PitchedEntry[] = [];
                  for (const [note, file] of Object.entries(value as Record<string, string>)) {
                    const midi = noteNameToMidi(note);
                    if (midi !== null && typeof file === "string") {
                      entries.push({ midi, url: base + file });
                    }
                  }
                  if (entries.length) {
                    this.pitchedMaps[key] = entries.sort((a, b) => a.midi - b.midi);
                  }
                }
              }
              return true;
            })
            .catch(() => false)
        )
      ).then(async (results) => {
        // Self-hosted seed: fills any key the network couldn't provide, so
        // the core sounds and kits work even if GitHub is unreachable.
        try {
          const json: Record<string, unknown> = await fetch("/samples/local.json").then((r) =>
            r.json()
          );
          const base = typeof json._base === "string" ? json._base : "";
          for (const [key, value] of Object.entries(json)) {
            if (Array.isArray(value) && !this.files[key]) {
              this.files[key] = (value as string[]).map((path) => base + path);
            }
          }
        } catch {
          // no local seed available
        }
        const anyLoaded = results.some(Boolean) || Object.keys(this.files).length > 0;
        if (!anyLoaded) this.manifestPromise = null; // allow retry
        return anyLoaded;
      });
    }
    return this.manifestPromise;
  }

  /** Fetch + decode every `sound:variant` key, e.g. ["bd:0", "RolandTR808_bd:2"]. */
  async preload(ctx: AudioContext, keys: string[]): Promise<void> {
    const ok = await this.ensureManifests();
    if (!ok) return;
    await Promise.all(keys.map((key) => this.loadOne(ctx, key)));
  }

  private loadOne(ctx: AudioContext, key: string): Promise<void> {
    const cached = this.pending.get(key);
    if (cached) return cached;

    const [id, variantRaw] = key.split(":");
    const list = this.files[id];
    if (!list || list.length === 0) return Promise.resolve();
    const variant = (parseInt(variantRaw, 10) || 0) % list.length;

    const promise = fetch(list[variant])
      .then((res) => res.arrayBuffer())
      .then((data) => ctx.decodeAudioData(data))
      .then((buffer) => {
        this.buffers.set(key, buffer);
      })
      .catch(() => {
        this.pending.delete(key); // retry next time
      });
    this.pending.set(key, promise);
    return promise;
  }

  /** Synchronous cache lookup — used at schedule time. */
  get(id: string, variant: number): AudioBuffer | undefined {
    const list = this.files[id];
    if (!list || list.length === 0) return undefined;
    return this.buffers.get(`${id}:${variant % list.length}`);
  }

  private nearestPitched(id: string, midi: number): PitchedEntry | undefined {
    const entries = this.pitchedMaps[id];
    if (!entries || entries.length === 0) return undefined;
    let best = entries[0];
    for (const entry of entries) {
      if (Math.abs(entry.midi - midi) < Math.abs(best.midi - midi)) best = entry;
    }
    return best;
  }

  /** Fetch + decode the nearest pitched samples for a set of MIDI notes. */
  async preloadPitched(ctx: AudioContext, id: string, midis: number[]): Promise<void> {
    const ok = await this.ensureManifests();
    if (!ok) return;
    const wanted = new Map<string, PitchedEntry>();
    for (const midi of midis) {
      const entry = this.nearestPitched(id, midi);
      if (entry) wanted.set(`${id}#${entry.midi}`, entry);
    }
    await Promise.all(
      [...wanted.entries()].map(([key, entry]) => this.loadUrl(ctx, key, entry.url))
    );
  }

  /** Nearest sample + playback rate to reach the target note. */
  getPitched(id: string, midi: number): { buffer: AudioBuffer; rate: number } | undefined {
    const entry = this.nearestPitched(id, midi);
    if (!entry) return undefined;
    const buffer = this.buffers.get(`${id}#${entry.midi}`);
    if (!buffer) return undefined;
    return { buffer, rate: Math.pow(2, (midi - entry.midi) / 12) };
  }

  private loadUrl(ctx: AudioContext, key: string, url: string): Promise<void> {
    const cached = this.pending.get(key);
    if (cached) return cached;
    const promise = fetch(url)
      .then((res) => res.arrayBuffer())
      .then((data) => ctx.decodeAudioData(data))
      .then((buffer) => {
        this.buffers.set(key, buffer);
      })
      .catch(() => {
        this.pending.delete(key); // retry next time
      });
    this.pending.set(key, promise);
    return promise;
  }
}

export const sampleBank = new SampleBank();
