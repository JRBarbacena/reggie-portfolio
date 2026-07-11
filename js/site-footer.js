// site-footer.js — shared <site-footer> web component. Renders the contact /
// social links from site-config.js so they live in one place and stay
// identical on every page.

import { OWNER, SOCIALS } from "./site-config.js";

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
    const linkedInIcon = '<svg class="social-dock__brand" viewBox="0 0 24 24" aria-hidden="true"><path d="M20.45 20.45h-3.56v-5.57c0-1.33-.03-3.04-1.85-3.04-1.86 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28ZM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12ZM7.12 20.45H3.56V9h3.56v11.45Z"/></svg>';
    const socialIcons = {
      Facebook: "facebook",
      Instagram: "instagram",
      TikTok: "tiktok",
      LinkedIn: "linkedin",
    };
    const dockLinks = SOCIALS.filter((s) => socialIcons[s.label]).map((s) => {
      const external = s.href.startsWith("http")
        ? ' target="_blank" rel="noopener noreferrer"'
        : "";
      const mark = s.label === "LinkedIn"
        ? linkedInIcon
        : '<img src="https://cdn.simpleicons.org/' + socialIcons[s.label] + '/d5001c" alt="" aria-hidden="true" />';
      return `<li>
        <a class="social-dock__link${s.placeholder ? " is-placeholder" : ""}" href="${s.href}"${external} aria-label="${s.label}${s.placeholder ? " (coming soon)" : ""}">
          ${mark}
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
                <a
                  class="btn btn-secondary btn-disabled"
                  href="#"
                  aria-disabled="true"
                  data-resume-placeholder
                  aria-label="Download my resume coming soon"
                >Download my resume</a>
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

    this.configureHomeDock();
    this.configureResumePlaceholder();
  }

  configureResumePlaceholder() {
    const resumeLink = this.querySelector("[data-resume-placeholder]");
    resumeLink?.addEventListener("click", (event) => {
      event.preventDefault();
    });
  }

  configureHomeDock() {
    const hero = document.querySelector(".hero--home");
    if (!hero || !("IntersectionObserver" in window)) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        document.body.classList.toggle("has-left-home-hero", !entry.isIntersecting);
      },
      { threshold: 0.15 },
    );
    observer.observe(hero);
  }
}

if (!customElements.get("site-footer")) {
  customElements.define("site-footer", SiteFooter);
}

export { SiteFooter };
