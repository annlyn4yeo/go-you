// GO—YOU service worker (DD-039). Hand-written on purpose: P1-04 needs one thing, so no library.
// - Train (/app) works offline from its last good copy, plus the JS/CSS that copy needs.
// - Any other page falls back to /offline.html (plain HTML, nothing to hydrate) when there is no network.
// shortcut: only Train is offline-capable; move to Serwist when background sync (P1-01) lands.
const CACHE = "go-you-v1";
const OFFLINE = "/offline.html";

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll([OFFLINE, "/fonts/space-grotesk-latin.woff2"])));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      for (const key of await caches.keys()) if (key !== CACHE) await caches.delete(key);
      await self.registration.navigationPreload?.enable(); // the network request starts while the worker boots
      await self.clients.claim();
    })(),
  );
});

// Keep the latest Train page and exactly the build files it references; drop older build files.
// Order matters: the new build files are stored first (addAll is all-or-nothing), so a failed download
// on bad gym wifi leaves the previous good copy whole instead of a page whose JS is missing.
async function keepTrain(response) {
  const html = await response.text();
  const cache = await caches.open(CACHE);
  const wanted = new Set(html.match(/\/_next\/static\/[^"'\s)\\]+/g) ?? []);
  const missing = [];
  for (const path of wanted) if (!(await cache.match(path))) missing.push(path);
  await cache.addAll(missing);
  await cache.put("/app", new Response(html, { headers: { "Content-Type": "text/html; charset=utf-8" } }));
  for (const req of await cache.keys()) {
    const path = new URL(req.url).pathname;
    if (path.startsWith("/_next/static/") && !wanted.has(path)) await cache.delete(req);
  }
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin || request.method !== "GET") return;

  // Build files and the brand font never change at a URL: serve a stored copy when there is one, else the network.
  if (url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/fonts/")) {
    event.respondWith(caches.match(request).then((hit) => hit ?? fetch(request)));
    return;
  }

  if (request.mode !== "navigate") return;
  event.respondWith(
    (async () => {
      try {
        const response = (await event.preloadResponse) ?? (await fetch(request));
        // Only a real signed-in Train page is kept (a signed-out visit is a redirect, which is not "ok").
        if (url.pathname === "/app" && response.ok) event.waitUntil(keepTrain(response.clone()).catch(() => {}));
        return response;
      } catch {
        const cache = await caches.open(CACHE);
        return (url.pathname === "/app" && (await cache.match("/app"))) || (await cache.match(OFFLINE)) || Response.error();
      }
    })(),
  );
});
