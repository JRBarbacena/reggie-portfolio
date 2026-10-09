import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiRequestError, requestJson } from "../../react-app/src/lib/api-client.js";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("requestJson", () => {
  it("returns parsed JSON for a successful response", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true }),
    }));

    await expect(requestJson("/api/example")).resolves.toEqual({ ok: true });
    expect(fetch).toHaveBeenCalledWith("/api/example", expect.objectContaining({ signal: expect.any(AbortSignal) }));
  });

  it("preserves a safe server error and status", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: false,
      status: 429,
      json: async () => ({ message: "Please wait." }),
    }));

    const error = await requestJson("/api/example").catch((caught) => caught);
    expect(error).toBeInstanceOf(ApiRequestError);
    expect(error).toMatchObject({ message: "Please wait.", status: 429 });
  });

  it("turns an abort timeout into an actionable message", async () => {
    vi.stubGlobal("fetch", vi.fn((_url, options) => new Promise((_resolve, reject) => {
      options.signal.addEventListener("abort", () => reject(options.signal.reason), { once: true });
    })));

    await expect(requestJson("/api/example", {}, { timeoutMs: 5 })).rejects.toMatchObject({
      name: "ApiRequestError",
      message: "The request timed out. Please try again.",
    });
  });
});
