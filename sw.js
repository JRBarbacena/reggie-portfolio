const CACHE_NAME = "reggie-portfolio-v20260717-3";

const APP_SHELL = [
  "/",
  "/index.html",
  "/tech",
  "/travel",
  "/life",
  "/designs",
  "/css/main.css?v=20260714-1",
  "/js/site-cache.js",
  "/js/site-nav.js",
  "/js/site-footer.js",
  "/js/pages.js",
  "/js/nav-model.js",
  "/js/motion.js",
  "/js/hero.js",
  "/assets/images/brand/rb-monogram.png",
];

self.addEventListener("install", (event) => {
  // A missing optional route must not prevent caching the rest of the app.
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      Promise.all(APP_SHELL.map((asset) => cache.add(asset).catch(() => undefined)))
    )
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET" || new URL(request.url).origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).then((response) => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
        return response;
      }).catch(() => caches.match(request).then((response) => response || caches.match("/index.html")))
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) =>
      cached || fetch(request).then((response) => {
        if (!response.ok) return response;
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
        return response;
      })
    )
  );
});
