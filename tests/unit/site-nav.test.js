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

  it("renders every product as a top-level link without an overflow control", () => {
    mountNav("home");
    expect(document.querySelector(".site-nav__overflow")).toBeNull();
    expect(document.querySelectorAll(".site-nav__list a.site-nav__link")).toHaveLength(4);
  });

  it("marks the active primary link", () => {
    mountNav("tech");
    const active = document.querySelectorAll('[aria-current="page"]');
    expect(active).toHaveLength(1);
    expect(active[0].dataset.pageId).toBe("tech");
  });

  it("renders identical structure regardless of active page (Req 3.9)", () => {
    mountNav("home");
    const orderHome = Array.from(
      document.querySelectorAll("a.site-nav__link")
    ).map((a) => a.dataset.pageId);
    mountNav("life");
    const orderLife = Array.from(
      document.querySelectorAll("a.site-nav__link")
    ).map((a) => a.dataset.pageId);
    expect(orderHome).toEqual(orderLife);
  });
});
