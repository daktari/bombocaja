/** Pattern ↔ URL hash, base64url-encoded. No backend needed. */

export interface SharedPattern {
  code: string;
  bpm?: number;
}

export function encodePattern(code: string): string {
  const b64 = btoa(unescape(encodeURIComponent(code)));
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function decodePattern(encoded: string): string | null {
  try {
    let b64 = encoded.replace(/-/g, "+").replace(/_/g, "/");
    while (b64.length % 4) b64 += "=";
    return decodeURIComponent(escape(atob(b64)));
  } catch {
    return null;
  }
}

export function patternUrl(code: string, bpm?: number): string {
  const bpmPart = bpm && bpm !== 120 ? `&b=${bpm}` : "";
  return `${location.origin}${location.pathname}#p=${encodePattern(code)}${bpmPart}`;
}

/** Pattern shared in the current URL, if any (with its tempo). */
export function sharedFromHash(): SharedPattern | null {
  const match = location.hash.match(/^#p=([^&]+)(?:&b=(\d+))?/);
  if (!match) return null;
  const code = decodePattern(match[1]);
  if (code === null) return null;
  return { code, bpm: match[2] ? parseInt(match[2], 10) : undefined };
}
