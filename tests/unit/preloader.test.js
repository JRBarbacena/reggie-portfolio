import { describe, expect, it, vi } from "vitest";
import {
  ENTRY_STATUS_KEY,
  PRELOADER_EXIT_MS,
  claimDirectHomeEntry,
  navigationType,
  startEntryStatus,
} from "../../js/preloader.js";

function storage() {
  const values = new Map();
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
  };
}

const directEntry = (overrides = {}) => ({
  pathname: "/",
  type: "navigate",
  referrer: "",
  origin: "https://portfolio.test",
  reducedMotion: false,
  saveData: false,
  storage: storage(),
  ...overrides,
});

describe("Home entry status policy", () => {
  it("claims only the first direct Home navigation", () => {
    const session = storage();
    expect(claimDirectHomeEntry(directEntry({ storage: session }))).toBe(true);
    expect(session.getItem(ENTRY_STATUS_KEY)).toBe("true");
    expect(claimDirectHomeEntry(directEntry({ storage: session }))).toBe(false);
  });

  it.each([
    [{ pathname: "/tech" }, "non-Home page"],
    [{ type: "back_forward" }, "history restore"],
    [{ referrer: "https://portfolio.test/tech" }, "internal navigation"],
    [{ reducedMotion: true }, "reduced motion"],
    [{ saveData: true }, "save data"],
  ])("skips a %s entry", (overrides) => {
    expect(claimDirectHomeEntry(directEntry(overrides))).toBe(false);
  });

  it("shows again for a real Home reload", () => {
    expect(claimDirectHomeEntry(directEntry({ type: "reload" }))).toBe(true);
  });

  it("fails closed when storage is unavailable", () => {
    const brokenStorage = { getItem: () => { throw new Error("blocked"); } };
    expect(claimDirectHomeEntry(directEntry({ storage: brokenStorage }))).toBe(false);
  });

  it("reads modern and legacy navigation lifecycle values", () => {
    expect(navigationType({ getEntriesByType: () => [{ type: "reload" }] })).toBe("reload");
    expect(navigationType({ getEntriesByType: () => [], navigation: { type: 2 } })).toBe("back_forward");
    expect(navigationType({ getEntriesByType: () => { throw new Error("blocked"); } })).toBe("unknown");
  });

  it("uses an accessible dialog and cleans up its inert background idempotently", () => {
    const session = storage();
    let timeoutCallback;
    const media = { matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() };
    const win = {
      location: { pathname: "/", origin: "https://portfolio.test" },
      performance: { getEntriesByType: () => [{ type: "navigate" }] },
      navigator: {},
      sessionStorage: session,
      matchMedia: () => media,
      requestAnimationFrame: (callback) => callback(),
      setTimeout: vi.fn((callback) => { timeoutCallback = callback; return 1; }),
      clearTimeout: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    };
    const doc = document.implementation.createHTMLDocument("Home");
    doc.body.innerHTML = '<a class="skip-link" href="#main">Skip</a><main id="main"><h1>Home</h1></main>';
    const controller = startEntryStatus(win, doc);

    expect(PRELOADER_EXIT_MS).toBe(300);
    expect(controller.element.getAttribute("role")).toBe("dialog");
    expect(controller.element.getAttribute("aria-modal")).toBe("true");
    expect(controller.element.querySelectorAll("h1, h2, h3, h4, h5, h6")).toHaveLength(0);
    expect(controller.element.querySelector("button").textContent).toMatch(/Enter portfolio/);
    expect(doc.querySelector("main").hasAttribute("inert")).toBe(true);

    controller.enter();
    timeoutCallback();
    controller.finish();
    expect(doc.querySelector(".site-preloader")).toBeNull();
    expect(doc.querySelector("main").hasAttribute("inert")).toBe(false);
    expect(win.clearTimeout).toHaveBeenCalledTimes(1);
  });
});
