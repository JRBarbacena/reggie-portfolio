import { describe, it, expect, beforeEach } from "vitest";
import { PAGES } from "../../js/pages.js";
import "../../js/site-nav.js";

function mountNav(activePage) {
  document.body.innerHTML = `<site-nav active-page="${activePage}"></site-nav>`;
  return document.querySelector("site-nav");
}

describe("<site-nav> rendering", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("renders exactly one link per page", () => {
    mountNav("home");
    const links = document.querySelectorAll("a.site-nav__link");
    const ids = Array.from(links).map((a) => a.dataset.pageId).sort();
    expect(ids).toEqual(PAGES.map((p) => p.id).sort());
  });

  it("renders primary pages as top-level links and Designs in the overflow menu", () => {
    mountNav("home");
    const overflowMenu = document.querySelector("#site-nav-overflow");
    const overflowIds = Array.from(
      overflowMenu.querySelectorAll("a.site-nav__link")
    ).map((a) => a.dataset.pageId);
    expect(overflowIds).toEqual(["designs"]);
  });

  it("marks the active primary link and not the overflow control (Req 3.7)", () => {
    mountNav("tech");
    const active = document.querySelectorAll('[aria-current="page"]');
    expect(active).toHaveLength(1);
    expect(active[0].dataset.pageId).toBe("tech");
    const overflowToggle = document.querySelector(".site-nav__overflow-toggle");
    expect(overflowToggle.classList.contains("is-active")).toBe(false);
  });

  it("marks BOTH the overflow control and the Designs link active (Req 3.8)", () => {
    mountNav("designs");
    const overflowToggle = document.querySelector(".site-nav__overflow-toggle");
    expect(overflowToggle.classList.contains("is-active")).toBe(true);
    const activeLink = document.querySelector('a[aria-current="page"]');
    expect(activeLink.dataset.pageId).toBe("designs");
  });

  it("toggles the overflow menu open/closed via the control", () => {
    mountNav("home");
    const overflow = document.querySelector(".site-nav__overflow");
    const toggle = document.querySelector(".site-nav__overflow-toggle");
    expect(overflow.getAttribute("data-open")).toBe("false");
    toggle.click();
    expect(overflow.getAttribute("data-open")).toBe("true");
    expect(toggle.getAttribute("aria-expanded")).toBe("true");
  });

  it("renders identical structure regardless of active page (Req 3.9)", () => {
    mountNav("home");
    const orderHome = Array.from(
      document.querySelectorAll("a.site-nav__link")
    ).map((a) => a.dataset.pageId);
    mountNav("designs");
    const orderDesigns = Array.from(
      document.querySelectorAll("a.site-nav__link")
    ).map((a) => a.dataset.pageId);
    expect(orderHome).toEqual(orderDesigns);
  });
});
