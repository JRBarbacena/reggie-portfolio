// Shared navigation Web Component. Native anchors remain the navigation
// baseline; JavaScript manages only disclosure state, focus, and presentation.

import { PAGES } from "./pages.js";
import { buildNavModel, resolveActiveState } from "./nav-model.js";

const MOBILE_QUERY = "(max-width: 768px)";
const PAGE_EXIT_MS = 150;

function isPlainPrimaryClick(event) {
  return event.button === 0
    && !event.defaultPrevented
    && !event.metaKey
    && !event.ctrlKey
    && !event.shiftKey
    && !event.altKey;
}

function isDifferentInternalPage(link, locationApi = window.location) {
  if (!link || link.hasAttribute("download")) return false;
  if (link.target && link.target.toLowerCase() !== "_self") return false;

  let destination;
  try {
    destination = new URL(link.href, locationApi.href);
  } catch {
    return false;
  }

  if (destination.origin !== locationApi.origin) return false;
  return `${destination.pathname}${destination.search}` !==
    `${locationApi.pathname}${locationApi.search}`;
}

class SiteNav extends HTMLElement {
  connectedCallback() {
    this._media = typeof window.matchMedia === "function"
      ? window.matchMedia(MOBILE_QUERY)
      : { matches: false, addEventListener() {}, removeEventListener() {} };
    this.render();
    this.bindEvents();
    this.bindScrollState();
    this.syncPresentation();
    this._pageShowHandler = () => this.clearPageExit();
    window.addEventListener("pageshow", this._pageShowHandler);
  }

  disconnectedCallback() {
    if (this._scrollHandler) window.removeEventListener("scroll", this._scrollHandler);
    if (this._documentClickHandler) document.removeEventListener("click", this._documentClickHandler);
    if (this._documentKeyHandler) document.removeEventListener("keydown", this._documentKeyHandler);
    if (this._pageShowHandler) window.removeEventListener("pageshow", this._pageShowHandler);
    this._media?.removeEventListener?.("change", this._mediaHandler);
  }

  get activePage() {
    return this.getAttribute("active-page");
  }

  bindScrollState() {
    const header = this.closest(".site-header");
    if (!header) return;
    const updateState = () => header.classList.toggle("is-scrolled", window.scrollY > 20);
    this._scrollHandler = updateState;
    updateState();
    window.addEventListener("scroll", updateState, { passive: true });
  }

  render() {
    const { primary } = buildNavModel(PAGES);
    const active = resolveActiveState(PAGES, this.activePage);
    const primaryLinks = primary.map((link) => this.linkHtml(link, active)).join("");

    this.innerHTML = `
      <nav class="site-nav" aria-label="Primary navigation" data-menu-open="false">
        <a class="site-nav__brand" href="/" aria-label="Home — Reggie">
          <img src="/assets/images/brand/rb-monogram.png" alt="" width="48" height="48" />
        </a>

        <button
          class="site-nav__mobile-toggle"
          type="button"
          aria-expanded="false"
          aria-controls="site-nav-menu"
          aria-label="Toggle navigation menu"
        >☰</button>

        <div class="site-nav__menu" id="site-nav-menu">
          <ul class="site-nav__list">${primaryLinks}</ul>
        </div>
      </nav>
    `;
  }

  linkHtml(link, active) {
    const isActive =
      link.id === active.activePrimaryId || link.id === active.activeOverflowId;
    const className = isActive ? "site-nav__link is-active" : "site-nav__link";
    const current = isActive ? ' aria-current="page"' : "";
    return `<li><a class="${className}"${current} href="${link.href}" data-page-id="${link.id}">${link.label}</a></li>`;
  }

  bindEvents() {
    const nav = this.querySelector(".site-nav");
    const mobileToggle = this.querySelector(".site-nav__mobile-toggle");
    const menu = this.querySelector(".site-nav__menu");

    const setMobileMenu = (open, { returnFocus = false } = {}) => {
      nav.setAttribute("data-menu-open", String(open));
      mobileToggle.setAttribute("aria-expanded", String(open));
      menu.toggleAttribute("inert", this._media.matches && !open);
      if (returnFocus) mobileToggle.focus();
    };

    this.setMobileMenu = setMobileMenu;

    mobileToggle.addEventListener("click", () => {
      setMobileMenu(nav.getAttribute("data-menu-open") !== "true");
    });

    this._documentClickHandler = (event) => {
      if (this.contains(event.target)) return;
      if (this._media.matches) setMobileMenu(false);
    };

    this._documentKeyHandler = (event) => {
      if (event.key !== "Escape") return;
      if (nav.getAttribute("data-menu-open") === "true") {
        setMobileMenu(false, { returnFocus: true });
      }
    };

    document.addEventListener("click", this._documentClickHandler);
    document.addEventListener("keydown", this._documentKeyHandler);

    this.addEventListener("click", (event) => {
      const link = event.target.closest("a[href]");
      if (!link) return;
      if (this._media.matches) setMobileMenu(false);
      if (!isPlainPrimaryClick(event) || !isDifferentInternalPage(link)) return;

      event.preventDefault();
      this.startPageExit(link);
    });

    this._mediaHandler = () => this.syncPresentation();
    this._media.addEventListener?.("change", this._mediaHandler);
  }

  syncPresentation() {
    const nav = this.querySelector(".site-nav");
    const menu = this.querySelector(".site-nav__menu");
    const mobileToggle = this.querySelector(".site-nav__mobile-toggle");
    if (!nav || !menu || !mobileToggle) return;

    if (this._media.matches) {
      menu.toggleAttribute("inert", nav.getAttribute("data-menu-open") !== "true");
      return;
    }

    nav.setAttribute("data-menu-open", "false");
    mobileToggle.setAttribute("aria-expanded", "false");
    menu.removeAttribute("inert");
  }

  startPageExit(link) {
    if (document.documentElement.classList.contains("is-page-leaving")) return;
    const destination = new URL(link.href, window.location.href);
    document.documentElement.classList.add("is-page-leaving");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.setTimeout(
      () => window.location.assign(destination.href),
      reducedMotion ? 0 : PAGE_EXIT_MS,
    );
  }

  clearPageExit() {
    document.documentElement.classList.remove("is-page-leaving");
  }
}

if (!customElements.get("site-nav")) {
  customElements.define("site-nav", SiteNav);
}

export { SiteNav, isDifferentInternalPage, isPlainPrimaryClick };
