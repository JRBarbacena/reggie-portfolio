import { describe, expect, it, vi } from "vitest";
import {
  createSlidingWindowLimiter,
  parseJsonBody,
  requestId,
  sendJson,
} from "../../server/request-security.js";

describe("request body limits", () => {
  it("accepts a small object body", () => {
    expect(parseJsonBody({ headers: {}, body: { action: "poll" } }, 128)).toEqual({
      ok: true,
      body: { action: "poll" },
    });
  });

  it("rejects invalid JSON and oversized declared or actual bodies", () => {
    expect(parseJsonBody({ headers: {}, body: "{" }, 128).status).toBe(400);
    expect(parseJsonBody({ headers: { "content-length": "129" }, body: "{}" }, 128).status).toBe(413);
    expect(parseJsonBody({ headers: {}, body: { message: "x".repeat(130) } }, 128).status).toBe(413);
  });
});

describe("sliding-window rate limits", () => {
  it("isolates keys and reports when a caller may retry", () => {
    let timestamp = 1_000;
    const check = createSlidingWindowLimiter({ windowMs: 10_000, now: () => timestamp });

    expect(check("send:visitor-a", 2).limited).toBe(false);
    expect(check("send:visitor-a", 2).limited).toBe(false);
    expect(check("send:visitor-b", 2).limited).toBe(false);
    expect(check("send:visitor-a", 2)).toEqual({ limited: true, retryAfterSeconds: 10 });

    timestamp = 11_001;
    expect(check("send:visitor-a", 2).limited).toBe(false);
  });
});

describe("safe JSON responses", () => {
  it("adds no-store, nosniff, and a request correlation id", () => {
    const setHeader = vi.fn();
    const json = vi.fn((payload) => payload);
    const status = vi.fn(() => ({ json }));
    const response = { setHeader, status };

    expect(sendJson(response, 429, { message: "slow down" }, "request-1")).toEqual({ message: "slow down" });
    expect(setHeader).toHaveBeenCalledWith("Cache-Control", "no-store");
    expect(setHeader).toHaveBeenCalledWith("X-Content-Type-Options", "nosniff");
    expect(setHeader).toHaveBeenCalledWith("X-Request-Id", "request-1");
    expect(status).toHaveBeenCalledWith(429);
  });

  it("only accepts a bounded platform request id", () => {
    expect(requestId({ headers: { "x-vercel-id": "iad1::abc-123" } })).toBe("iad1::abc-123");
    expect(requestId({ headers: { "x-vercel-id": "contains spaces" } })).toMatch(/^[0-9a-f-]{36}$/);
  });
});
