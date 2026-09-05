const CACHE_PREFIX = "reggie-react-portfolio";
const SHELL_CACHE = `${CACHE_PREFIX}-shell-v4`;
const MEDIA_CACHE = `${CACHE_PREFIX}-media-v2`;
const CORE_SHELL = [
  "/",
  "/offline.html",
  "/manifest.webmanifest",
  "/images/brand/pwa-192.png",
  "/images/brand/pwa-512.png",
];

async function cacheBuiltAssets(cache, homeResponse) {
  const html = await homeResponse.clone().text();
  const assetPaths = [...html.matchAll(/(?:src|href)="(\/assets\/[^"?#]+)"/g)].map((match) => match[1]);
  const builtResponses = await Promise.all([...new Set(assetPaths)].map(async (path) => {
    const response = await fetch(path, { cache: "no-store" });
    if (response.ok) await cache.put(path, response.clone());
    return { path, response };
  }));

  const lazyAssetPaths = new Set();
  for (const { path, response } of builtResponses) {
    if (!response.ok || !path.endsWith(".js")) continue;
    const source = await response.clone().text();
    for (const match of source.matchAll(/["'`]((?:assets\/|\.\/)[^"'`?#]+\.(?:js|css))["'`]/g)) {
      lazyAssetPaths.add(match[1].startsWith("assets/") ? `/${match[1]}` : `/assets/${match[1].slice(2)}`);
    }
  }

  await Promise.allSettled([...lazyAssetPaths].map(async (path) => {
    const response = await fetch(path, { cache: "no-store" });
    if (response.ok) await cache.put(path, response);
  }));
}

self.addEventListener("install", (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(SHELL_CACHE);
    const homeResponse = await fetch("/", { cache: "no-store" });
    if (!homeResponse.ok) throw new Error("The React shell could not be cached.");
    await cache.put("/", homeResponse.clone());
    await cacheBuiltAssets(cache, homeResponse);
    await Promise.allSettled(CORE_SHELL.slice(1).map(async (path) => {
      const response = await fetch(path, { cache: "no-store" });
      if (response.ok) await cache.put(path, response);
    }));
    self.skipWaiting();
  })());
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const ownedCaches = (await caches.keys()).filter((name) => name.startsWith(CACHE_PREFIX));
    await Promise.all(ownedCaches.filter((name) => ![SHELL_CACHE, MEDIA_CACHE].includes(name)).map((name) => caches.delete(name)));
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== self.location.origin) return;
  if (request.mode === "navigate") {
    event.respondWith(networkFirstPage(request, url));
    return;
  }
  event.respondWith(cacheFirstAsset(request));
});

async function networkFirstPage(request, url) {
  try {
    const response = await fetch(request);
    if (response.ok && url.pathname !== "/admin") {
      const cache = await caches.open(SHELL_CACHE);
      await cache.put(url.pathname, response.clone());
    }
    return response;
  } catch {
    const cache = await caches.open(SHELL_CACHE);
    if (url.pathname === "/admin") return (await cache.match("/offline.html")) || Response.error();
    return (await cache.match(url.pathname)) || (await cache.match("/")) || (await cache.match("/offline.html")) || Response.error();
  }
}

async function cacheFirstAsset(request) {
  const url = new URL(request.url);
  const cacheName = url.pathname.startsWith("/assets/") ? SHELL_CACHE : MEDIA_CACHE;
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request, { ignoreVary: true });
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok) {
    await cache.put(request, response.clone());
    if (cacheName === MEDIA_CACHE) {
      const keys = await cache.keys();
      await Promise.all(keys.slice(0, Math.max(0, keys.length - 80)).map((key) => cache.delete(key)));
    }
  }
  return response;
}
