// APEX service worker: caches static assets only.
// Never caches authenticated API responses, captures, signed URLs, conversations, logs or notifications.
const CACHE = "apex-static-v1";
const STATIC = /\.(?:js|css|woff2?|png|svg|ico|webmanifest)$/;

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  if (req.headers.has("authorization") || url.pathname.startsWith("/_serverFn") || url.pathname.startsWith("/api") || url.search.includes("token")) return;
  if (!STATIC.test(url.pathname)) return;
  e.respondWith(
    caches.open(CACHE).then(async (c) => {
      const hit = await c.match(req);
      if (hit) return hit;
      const res = await fetch(req);
      if (res.ok) c.put(req, res.clone());
      return res;
    }),
  );
});
