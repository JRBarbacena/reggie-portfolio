// site-nav.js — shared <site-nav> Web Component. Renders identical navigation
// on every page from the single Page Registry + pure nav model. Only the
// `active-page` attribute differs per page. (Req 3.1–3.9, 8.2, 8.3)

import { PAGES } from "./pages.js";
import { buildNavModel, resolveActiveState } from "./nav-model.js";

const MOBILE_QUERY = "(max-width: 768px)";

class SiteNav extends HTMLElement {
  connectedCallback() {
    this.render();
    this.bindEvents();
    this.bindScrollState();
  }

  disconnectedCallback() {
    if (this._scrollHandler) window.removeEventListener("scroll", this._scrollHandler);
  }

  bindScrollState() {
    const header = this.closest(".site-header");
    if (!header) return;
    const updateState = () => header.classList.toggle("is-scrolled", window.scrollY > 20);
    this._scrollHandler = updateState;
    updateState();
    window.addEventListener("scroll", updateState, { passive: true });
  }

  get activePage() {
    return this.getAttribute("active-page");
  }

  render() {
    const { primary, overflow } = buildNavModel(PAGES);
    const active = resolveActiveState(PAGES, this.activePage);

    const primaryLinks = primary
      .map((link) => this.linkHtml(link, active))
      .join("");

    const overflowLinks = overflow
      .map((link) => this.linkHtml(link, active))
      .join("");

    const overflowActive = active.overflowControlActive ? " is-active" : "";

    this.innerHTML = `
      <nav class="site-nav" aria-label="Primary" data-menu-open="false">
        <!-- LOGO PLACEHOLDER: "reggie." is a text stand-in for Reggie's real
             logo. Swap this <a> content for the logo image/SVG when ready. -->
        <a class="site-nav__brand" href="index.html" aria-label="Home — Reggie">
          reggie<span class="brand-accent">.</span>
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

          <div class="site-nav__overflow" data-open="false">
            <button
              class="site-nav__overflow-toggle${overflowActive}"
              type="button"
              aria-haspopup="true"
              aria-expanded="false"
              aria-controls="site-nav-overflow"
              aria-label="More pages"
            >
              <span class="site-nav__overflow-label">More</span>
              <svg
                class="site-nav__overflow-caret"
                width="12"
                height="12"
                viewBox="0 0 12 12"
                aria-hidden="true"
              >
                <path
                  d="M2.5 4.5 6 8l3.5-3.5"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.7"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
            </button>
            <ul class="site-nav__overflow-menu" id="site-nav-overflow">
              ${overflowLinks}
            </ul>
          </div>
        </div>
      </nav>
    `;
  }

  linkHtml(link, active) {
    const isActive =
      link.id === active.activePrimaryId || link.id === active.activeOverflowId;
    const cls = isActive ? "site-nav__link is-active" : "site-nav__link";
    const current = isActive ? ' aria-current="page"' : "";
    return `<li><a class="${cls}"${current} href="${link.href}" data-page-id="${link.id}">${link.label}</a></li>`;
  }

  bindEvents() {
    const nav = this.querySelector(".site-nav");
    const mobileToggle = this.querySelector(".site-nav__mobile-toggle");
    const overflow = this.querySelector(".site-nav__overflow");
    const overflowToggle = this.querySelector(".site-nav__overflow-toggle");

    // Mobile menu open/close
    mobileToggle.addEventListener("click", () => {
      const open = nav.getAttribute("data-menu-open") === "true";
      nav.setAttribute("data-menu-open", String(!open));
      mobileToggle.setAttribute("aria-expanded", String(!open));
    });

    // Overflow ("...") menu open/close
    const setOverflow = (open) => {
      overflow.setAttribute("data-open", String(open));
      overflowToggle.setAttribute("aria-expanded", String(open));
    };
    overflowToggle.addEventListener("click", (e) => {
      e.stopPropagation();
      setOverflow(overflow.getAttribute("data-open") !== "true");
    });

    // Close overflow on outside click / Escape
    document.addEventListener("click", (e) => {
      if (!overflow.contains(e.target)) setOverflow(false);
    });
    this.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        setOverflow(false);
        overflowToggle.focus();
      }
    });

    // Intercept link activation to verify the target exists (Req 3.6).
    this.addEventListener("click", (e) => {
      const link = e.target.closest("a.site-nav__link");
      if (!link) return;
      // Let same-page links behave normally.
      this.handleNavigate(e, link);
    });
  }

  async handleNavigate(event, link) {
    const href = link.getAttribute("href");
    // Progressive enhancement: if fetch is unavailable, allow default nav.
    if (typeof fetch !== "function") return;

    event.preventDefault();
    try {
      const res = await fetch(href, { method: "HEAD" });
      if (res.ok) {
        window.location.href = href;
      } else {
        this.showUnavailable(link);
      }
    } catch {
      // Network/host error — keep current page, indicate unavailability.
      this.showUnavailable(link);
    }
  }

  showUnavailable(link) {
    let note = this.querySelector(".site-nav__notice");
    if (!note) {
      note = document.createElement("p");
      note.className = "site-nav__notice text-meta";
      note.setAttribute("role", "status");
      this.querySelector(".site-nav").appendChild(note);
    }
    note.textContent = `“${link.textContent.trim()}” is currently unavailable.`;
    clearTimeout(this._noticeTimer);
    this._noticeTimer = setTimeout(() => note.remove(), 4000);
  }
}

if (!customElements.get("site-nav")) {
  customElements.define("site-nav", SiteNav);
}

export { SiteNav };
