/** Pattern ↔ URL hash, base64url-encoded. No backend needed. */

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

export function patternUrl(code: string): string {
  return `${location.origin}${location.pathname}#p=${encodePattern(code)}`;
}

/** Code shared in the current URL, if any. */
export function codeFromHash(): string | null {
  const match = location.hash.match(/^#p=(.+)$/);
  return match ? decodePattern(match[1]) : null;
}
