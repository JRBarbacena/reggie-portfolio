import {
  CACHE_PREFIX, SHELL_CACHE, RUNTIME_CACHE, REQUIRED_SHELL, OPTIONAL_SHELL,
  PRODUCT_ROUTES, normalizeRoute, isCacheable
} from "./js/cache-policy.js";

const MAX_RUNTIME_ENTRIES = 40;

async function fetchRequired(cache, path) {
  const response = await fetch(path, { cache: "no-store" });
  if (!response.ok) throw new Error(`Required app-shell response failed: ${path}`);
  await cache.put(normalizeRoute(path), response);
}

async function trim(cacheName, maxEntries) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  await Promise.all(keys.slice(0, Math.max(0, keys.length - maxEntries)).map((key) => cache.delete(key)));
}

self.addEventListener("install", (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(SHELL_CACHE);
    await Promise.all(REQUIRED_SHELL.map((path) => fetchRequired(cache, path)));
    await Promise.allSettled(OPTIONAL_SHELL.map((path) => fetchRequired(cache, path)));
  })());
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "PORTFOLIO_ACTIVATE") self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const owned = (await caches.keys()).filter((key) => key.startsWith(CACHE_PREFIX));
    const obsolete = owned.filter((key) => key !== SHELL_CACHE && key !== RUNTIME_CACHE);
    await Promise.all(obsolete.map((key) => caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== self.location.origin) return;
  event.respondWith(request.mode === "navigate" ? navigate(request) : asset(request));
});

async function navigate(request) {
  const route = normalizeRoute(request.url, self.location.origin);
  try {
    const response = await fetch(request);
    if (isCacheable(request, response, self.location.origin) && PRODUCT_ROUTES.has(route)) {
      const cache = await caches.open(SHELL_CACHE);
      await cache.put(route, response.clone());
    }
    return response;
  } catch {
    const cache = await caches.open(SHELL_CACHE);
    return (PRODUCT_ROUTES.has(route) && await cache.match(route)) || await cache.match("/offline.html");
  }
}

async function asset(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (isCacheable(request, response, self.location.origin)) {
    const cache = await caches.open(RUNTIME_CACHE);
    await cache.put(request, response.clone());
    await trim(RUNTIME_CACHE, MAX_RUNTIME_ENTRIES);
  }
  return response;
}
