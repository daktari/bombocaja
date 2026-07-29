/**
 * Up to 8 microphone recordings, usable as pattern tokens v1..v8.
 * Blobs persist in IndexedDB; AudioBuffers decode lazily per context.
 */

const DB_NAME = "bombocaja";
const STORE = "voices";
export const VOICE_SLOTS = 8;
const MAX_RECORD_MS = 2000;

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE)) {
        request.result.createObjectStore(STORE);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function idbPut(slot: number, blob: Blob): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put(blob, slot);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function idbDelete(slot: number): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).delete(slot);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function idbGetAll(): Promise<Map<number, Blob>> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const result = new Map<number, Blob>();
    const tx = db.transaction(STORE, "readonly");
    const cursorReq = tx.objectStore(STORE).openCursor();
    cursorReq.onsuccess = () => {
      const cursor = cursorReq.result;
      if (cursor) {
        result.set(cursor.key as number, cursor.value as Blob);
        cursor.continue();
      } else {
        resolve(result);
      }
    };
    cursorReq.onerror = () => reject(cursorReq.error);
  });
}

class VoiceBank {
  private blobs = new Map<number, Blob>();
  private buffers = new Map<number, AudioBuffer>();
  private loadPromise: Promise<void> | null = null;

  /** Read persisted recordings from IndexedDB (no AudioContext needed). */
  loadBlobs(): Promise<void> {
    if (!this.loadPromise) {
      this.loadPromise = idbGetAll()
        .then((blobs) => {
          this.blobs = blobs;
        })
        .catch(() => {
          // no IndexedDB (private mode etc.) — recordings just won't persist
        });
    }
    return this.loadPromise;
  }

  /** Which slots have a recording (1-based → index 0..7). */
  slotStates(): boolean[] {
    return Array.from({ length: VOICE_SLOTS }, (_, i) => this.blobs.has(i + 1));
  }

  /** Decode any persisted blobs that don't have an AudioBuffer yet. */
  async ensureDecoded(ctx: BaseAudioContext): Promise<void> {
    await this.loadBlobs();
    await Promise.all(
      [...this.blobs.entries()]
        .filter(([slot]) => !this.buffers.has(slot))
        .map(async ([slot, blob]) => {
          try {
            this.buffers.set(slot, await ctx.decodeAudioData(await blob.arrayBuffer()));
          } catch {
            // undecodable recording — drop it
            this.blobs.delete(slot);
          }
        })
    );
  }

  /** Sync lookup at schedule time: id is "v1".."v8". */
  get(id: string): AudioBuffer | undefined {
    return this.buffers.get(parseInt(id.slice(1), 10));
  }

  /** Record ~2s from the mic into a slot. Rejects if mic access fails. */
  async record(slot: number, ctx: AudioContext): Promise<void> {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    try {
      const recorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];
      recorder.ondataavailable = (e) => chunks.push(e.data);
      const stopped = new Promise<Blob>((resolve) => {
        recorder.onstop = () => resolve(new Blob(chunks, { type: recorder.mimeType }));
      });
      recorder.start();
      await new Promise((r) => window.setTimeout(r, MAX_RECORD_MS));
      recorder.stop();
      const blob = await stopped;
      const buffer = await ctx.decodeAudioData(await blob.arrayBuffer());
      this.blobs.set(slot, blob);
      this.buffers.set(slot, buffer);
      void idbPut(slot, blob).catch(() => {});
    } finally {
      stream.getTracks().forEach((track) => track.stop());
    }
  }

  async preview(slot: number, ctx: AudioContext): Promise<void> {
    await this.ensureDecoded(ctx);
    const buffer = this.buffers.get(slot);
    if (!buffer) return;
    void ctx.resume();
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);
    source.start();
  }

  remove(slot: number) {
    this.blobs.delete(slot);
    this.buffers.delete(slot);
    void idbDelete(slot).catch(() => {});
  }
}

export const voiceBank = new VoiceBank();
