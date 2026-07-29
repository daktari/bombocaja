/* bombocaja service worker — app shell + sample cache for offline use */
const SHELL_CACHE = "bombocaja-shell-v1";
const SAMPLE_CACHE = "bombocaja-samples-v1";

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((k) => k !== SHELL_CACHE && k !== SAMPLE_CACHE)
          .map((k) => caches.delete(k))
      );
      await self.clients.claim();
    })()
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);

  // Samples & manifests from GitHub: immutable → cache-first.
  if (url.hostname === "raw.githubusercontent.com") {
    event.respondWith(
      (async () => {
        const cache = await caches.open(SAMPLE_CACHE);
        const hit = await cache.match(request);
        if (hit) return hit;
        const response = await fetch(request);
        if (response.ok) cache.put(request, response.clone());
        return response;
      })()
    );
    return;
  }

  // App shell: network-first with cache fallback (works offline after 1st visit).
  if (url.origin === self.location.origin) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(SHELL_CACHE);
        try {
          const response = await fetch(request);
          if (response.ok) cache.put(request, response.clone());
          return response;
        } catch {
          const hit = await cache.match(request);
          return hit ?? (await cache.match("/")) ?? Response.error();
        }
      })()
    );
  }
});
