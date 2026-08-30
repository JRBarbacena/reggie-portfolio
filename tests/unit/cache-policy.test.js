import { describe, expect, it } from "vitest";
import { normalizeRoute, isCacheable, PRODUCT_ROUTES } from "../../js/cache-policy.js";

describe("service-worker cache policy", () => {
  it.each([["/index.html", "/"], ["/tech.html", "/tech"], ["/travel/", "/travel"]])("normalizes %s", (input, expected) => {
    expect(normalizeRoute(input)).toBe(expected);
  });

  it("contains exactly the four product routes", () => {
    expect([...PRODUCT_ROUTES]).toEqual(["/", "/tech", "/travel", "/life"]);
  });

  it("only caches successful same-origin GET responses", () => {
    const response = { ok: true, type: "basic" };
    expect(isCacheable({ method: "GET", url: "https://site.test/tech" }, response, "https://site.test")).toBe(true);
    expect(isCacheable({ method: "POST", url: "https://site.test/tech" }, response, "https://site.test")).toBe(false);
    expect(isCacheable({ method: "GET", url: "https://other.test/tech" }, response, "https://site.test")).toBe(false);
    expect(isCacheable({ method: "GET", url: "https://site.test/tech" }, { ok: false, type: "basic" }, "https://site.test")).toBe(false);
  });
});
