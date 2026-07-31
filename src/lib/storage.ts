const PROGRESS_KEY = "bakaluti.progress";
const PATTERNS_KEY = "bakaluti.patterns";

export interface SavedPattern {
  id: string;
  name: string;
  code: string;
  savedAt: number;
  bpm?: number;
}

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function loadProgress(): string[] {
  return read<string[]>(PROGRESS_KEY, []);
}

export function saveProgress(lessonIds: string[]) {
  localStorage.setItem(PROGRESS_KEY, JSON.stringify(lessonIds));
}

export function loadPatterns(): SavedPattern[] {
  return read<SavedPattern[]>(PATTERNS_KEY, []);
}

export function addPattern(name: string, code: string, bpm?: number): SavedPattern {
  const pattern: SavedPattern = {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    name,
    code,
    savedAt: Date.now(),
    bpm,
  };
  localStorage.setItem(PATTERNS_KEY, JSON.stringify([pattern, ...loadPatterns()]));
  return pattern;
}

export function deletePattern(id: string) {
  localStorage.setItem(
    PATTERNS_KEY,
    JSON.stringify(loadPatterns().filter((p) => p.id !== id))
  );
}
