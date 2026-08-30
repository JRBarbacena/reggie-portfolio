// site-footer.js — shared <site-footer> web component. Renders the contact /
// social links from site-config.js so they live in one place and stay
// identical on every page.

import { OWNER, SOCIALS } from "./site-config.js";

const SOCIAL_ICONS = {
  Facebook: '<svg class="social-dock__brand" viewBox="0 0 24 24" aria-hidden="true"><path d="M14.2 8.2V6.7c0-.8.5-1 1-1h2.6V2.2L14.6 2c-3.2 0-5 1.9-5 5.2v1H6.5V12h3.1v10h4.6V12h3.1l.5-3.8h-3.6Z"/></svg>',
  Instagram: '<svg class="social-dock__brand social-dock__brand--stroke" viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4.2"/><circle class="social-dock__brand-dot" cx="17.4" cy="6.7" r="1"/></svg>',
  LinkedIn: '<svg class="social-dock__brand" viewBox="0 0 24 24" aria-hidden="true"><path d="M20.45 20.45h-3.56v-5.57c0-1.33-.03-3.04-1.85-3.04-1.86 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28ZM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12ZM7.12 20.45H3.56V9h3.56v11.45Z"/></svg>',
  TikTok: '<svg class="social-dock__brand" viewBox="0 0 24 24" aria-hidden="true"><path d="M15.7 2c.4 2.2 1.7 3.6 4.1 3.8v4a9.2 9.2 0 0 1-4.1-1.1v6.5a6.8 6.8 0 1 1-5.9-6.7v4a2.9 2.9 0 1 0 1.9 2.7V2h4Z"/></svg>',
};

class SiteFooter extends HTMLElement {
  connectedCallback() {
    const year = new Date().getFullYear();
    const activities = [
      { icon: "&#128187;", label: "Building & learning" },
      { icon: "&#127911;", label: "Listening to Justin Bieber" },
      { icon: "&#127911;", label: "Listening to Matt Maltese" },
      { icon: "&#127911;", label: "Listening to Sica" },
      { icon: "&#127911;", label: "Listening to Waiian" },
      { icon: "&#127911;", label: "Listening to Skusta Clee" },
      { icon: "&#127911;", label: "Listening to Chris Brown" },
      { icon: "&#127918;", label: "Playing Nintendo Switch" },
      { icon: "&#127916;", label: "Watching movies" },
      { icon: "&#10024;", label: "Doing my best" },
    ];
    const currentActivity = activities[Math.floor(Math.random() * activities.length)];
    const dockLinks = SOCIALS.filter((social) => SOCIAL_ICONS[social.label]).map((social) => {
      const external = social.href.startsWith("http")
        ? ' target="_blank" rel="noopener noreferrer"'
        : "";
      return `<li>
        <a class="social-dock__link" href="${social.href}"${external} aria-label="${social.label}">
          ${SOCIAL_ICONS[social.label]}
        </a>
      </li>`;
    }).join("");

    this.innerHTML = `
      <footer class="site-footer">
        <div class="content-column">
          <div class="site-footer__cta" data-reveal>
            <h2>Let's talk</h2>
            <p>A small corner for a hello, a new idea, or a future collaboration.</p>
          </div>
          <section class="contact-panel card" aria-label="Contact information" data-reveal data-reveal-delay="1">
            <div class="contact-panel__main">
              <p class="contact-panel__eyebrow">Greetings</p>
              <h3>Have something in mind?</h3>
              <p>
                Whether it is a project, an idea, or simply a quick hello,
                my inbox is always a good place to start.
              </p>
              <div class="contact-panel__actions">
                <a class="btn btn-primary" href="mailto:${OWNER.email}">Send a message</a>
              </div>
            </div>
            <aside class="contact-panel__status" aria-label="Live status">
              <p class="contact-panel__eyebrow">Live status</p>
              <dl class="status-list">
                <div><dt>location</dt><dd><span class="country-badge">PH</span>San Mateo, Rizal</dd></div>
                <div><dt>Timezone</dt><dd>GMT+8 · Manila</dd></div>
                <div><dt>Currently</dt><dd><span class="status-activity">${currentActivity.icon} ${currentActivity.label}</span></dd></div>
                <div><dt>Open to</dt><dd class="status-list__pills"><span>Collabs</span><span>Coffee chats</span><span>Talks</span><span>Volleyball</span><span>Ride & chats</span></dd></div>
              </dl>
            </aside>
          </section>
          <p class="site-footer__base text-meta">
            © 2026 John Reggie Barbacena. All rights reserved.
          </p>
        </div>
        <nav class="social-dock" aria-label="Social links">
          <ul>${dockLinks}</ul>
        </nav>
      </footer>
    `;

    if (document.body.classList.contains("home")) {
      this._syncHomeDock = () => {
        document.body.classList.toggle("has-scrolled-home", window.scrollY > 10);
      };
      this._syncHomeDock();
      window.addEventListener("scroll", this._syncHomeDock, { passive: true });
    }
  }

  disconnectedCallback() {
    if (this._syncHomeDock) window.removeEventListener("scroll", this._syncHomeDock);
  }
}

if (!customElements.get("site-footer")) {
  customElements.define("site-footer", SiteFooter);
}

export { SiteFooter };
