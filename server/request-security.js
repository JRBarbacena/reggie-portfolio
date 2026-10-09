// @ts-check

import { randomUUID } from "node:crypto";

const DEFAULT_MAX_KEYS = 4_000;

function headerValue(request, name) {
  const value = request.headers?.[name];
  return Array.isArray(value) ? value[0] : value;
}

function byteLength(value) {
  return Buffer.byteLength(typeof value === "string" ? value : JSON.stringify(value ?? {}), "utf8");
}

export function parseJsonBody(request, maxBytes) {
  const statedLength = Number.parseInt(String(headerValue(request, "content-length") ?? ""), 10);
  if (Number.isFinite(statedLength) && statedLength > maxBytes) {
    return { ok: false, status: 413, message: "Request body is too large." };
  }

  const rawBody = request.body;
  if (byteLength(rawBody) > maxBytes) {
    return { ok: false, status: 413, message: "Request body is too large." };
  }

  if (rawBody && typeof rawBody === "object" && !Array.isArray(rawBody)) {
    return { ok: true, body: rawBody };
  }
  if (typeof rawBody !== "string" || !rawBody.trim()) return { ok: true, body: {} };

  try {
    const parsed = JSON.parse(rawBody);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new TypeError("Expected an object.");
    return { ok: true, body: parsed };
  } catch {
    return { ok: false, status: 400, message: "Request body must be valid JSON." };
  }
}

export function requestId(request) {
  const platformId = String(headerValue(request, "x-vercel-id") ?? "").trim();
  return /^[A-Za-z0-9.:_-]{1,128}$/.test(platformId) ? platformId : randomUUID();
}

export function requestKey(request) {
  const candidates = [
    headerValue(request, "x-vercel-forwarded-for"),
    headerValue(request, "x-real-ip"),
    headerValue(request, "x-forwarded-for"),
    request.socket?.remoteAddress,
  ];
  const address = String(candidates.find(Boolean) ?? "unknown").split(",")[0].trim().slice(0, 64);
  return address || "unknown";
}

export function createSlidingWindowLimiter({ windowMs, maxKeys = DEFAULT_MAX_KEYS, now = Date.now }) {
  const entries = new Map();

  return function check(key, limit) {
    const timestamp = now();
    const cutoff = timestamp - windowMs;
    const recent = (entries.get(key) ?? []).filter((entry) => entry > cutoff);
    const limited = recent.length >= limit;
    if (!limited) recent.push(timestamp);
    if (recent.length) entries.set(key, recent);

    if (entries.size > maxKeys) {
      for (const [entryKey, timestamps] of entries) {
        if (!timestamps.some((entry) => entry > cutoff)) entries.delete(entryKey);
      }
      while (entries.size > maxKeys) entries.delete(entries.keys().next().value);
    }

    const retryAfterSeconds = limited
      ? Math.max(1, Math.ceil((recent[0] + windowMs - timestamp) / 1000))
      : 0;
    return { limited, retryAfterSeconds };
  };
}

export function sendJson(response, status, payload, id) {
  response.setHeader("Cache-Control", "no-store");
  response.setHeader("X-Content-Type-Options", "nosniff");
  if (id) response.setHeader("X-Request-Id", id);
  return response.status(status).json(payload);
}

export function logServerError(event, error, context = {}) {
  console.error(JSON.stringify({
    level: "error",
    event,
    ...context,
    error: {
      name: String(error?.name ?? "Error").slice(0, 80),
      code: String(error?.code ?? "unknown").slice(0, 80),
      status: Number(error?.status) || undefined,
    },
  }));
}

export function createTimedFetch(timeoutMs) {
  return function timedFetch(input, init = {}) {
    const timeoutSignal = AbortSignal.timeout(timeoutMs);
    const signal = init.signal ? AbortSignal.any([init.signal, timeoutSignal]) : timeoutSignal;
    return fetch(input, { ...init, signal });
  };
}
