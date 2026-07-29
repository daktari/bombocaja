const MANIFEST_URLS = [
  // the classic Dirt-Samples library (bd, sn, hh…)
  "https://raw.githubusercontent.com/tidalcycles/dirt-samples/master/strudel.json",
  // real sampled drum machines (RolandTR808_bd, RolandTR909_sd, LinnDrum_hh…)
  "https://raw.githubusercontent.com/felixroos/dough-samples/main/tidal-drum-machines.json",
];

/**
 * Loads real percussion samples from the same libraries Strudel uses.
 * Everything is lazy and cached; if the network is down the audio
 * engine falls back to synthesized sounds.
 */
class SampleBank {
  /** sample-map key → absolute URLs of its variants */
  private files: Record<string, string[]> = {};
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
}

export const sampleBank = new SampleBank();
