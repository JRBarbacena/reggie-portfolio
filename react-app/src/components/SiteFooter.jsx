import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const socials = [
  ["Facebook", "https://www.facebook.com/johnreggie.barbacena.7"],
  ["Instagram", "https://instagram.com/jjstr.rgg"],
  ["TikTok", "https://www.tiktok.com/@gieoverheaven"],
  ["LinkedIn", "https://www.linkedin.com/in/john-reggie-barbacena-a011b5368/"],
];

function SocialIcon({ label }) {
  if (label === "Facebook") return <svg className="social-dock__brand" viewBox="0 0 24 24" aria-hidden="true"><path d="M14.2 8.2V6.7c0-.8.5-1 1-1h2.6V2.2L14.6 2c-3.2 0-5 1.9-5 5.2v1H6.5V12h3.1v10h4.6V12h3.1l.5-3.8h-3.6Z" /></svg>;
  if (label === "Instagram") return <svg className="social-dock__brand social-dock__brand--stroke" viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4.2" /><circle className="social-dock__brand-dot" cx="17.4" cy="6.7" r="1" /></svg>;
  if (label === "TikTok") return <svg className="social-dock__brand" viewBox="0 0 24 24" aria-hidden="true"><path d="M15.7 2c.4 2.2 1.7 3.6 4.1 3.8v4a9.2 9.2 0 0 1-4.1-1.1v6.5a6.8 6.8 0 1 1-5.9-6.7v4a2.9 2.9 0 1 0 1.9 2.7V2h4Z" /></svg>;
  return <svg className="social-dock__brand" viewBox="0 0 24 24" aria-hidden="true"><path d="M20.45 20.45h-3.56v-5.57c0-1.33-.03-3.04-1.85-3.04-1.86 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28ZM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12ZM7.12 20.45H3.56V9h3.56v11.45Z" /></svg>;
}

export default function SiteFooter() {
  const { pathname } = useLocation();
  useEffect(() => {
    if (pathname !== "/") { document.body.classList.remove("has-scrolled-home"); return undefined; }
    const syncDock = () => document.body.classList.toggle("has-scrolled-home", window.scrollY > 10);
    syncDock(); window.addEventListener("scroll", syncDock, { passive: true });
    return () => { window.removeEventListener("scroll", syncDock); document.body.classList.remove("has-scrolled-home"); };
  }, [pathname]);

  return <footer className="site-footer"><div className="content-column">
    <div className="site-footer__cta" data-reveal><h2>Let&apos;s talk</h2><p>A small corner for a hello, a new idea, or a future collaboration.</p></div>
    <section className="contact-panel card" aria-label="Contact information" data-reveal data-reveal-delay="1"><div className="contact-panel__main"><p className="contact-panel__eyebrow">Greetings</p><h3>Have something in mind?</h3><p>Whether it is a project, an idea, or simply a quick hello, my inbox is always a good place to start.</p><div className="contact-panel__actions"><a className="btn btn-primary" href="mailto:iggybarbacena@gmail.com">Send a message</a></div></div><div className="contact-panel__status" aria-label="Live status"><p className="contact-panel__eyebrow">Live status</p><dl className="status-list"><div><dt>Location</dt><dd><span className="country-badge">PH</span>San Mateo, Rizal</dd></div><div><dt>Timezone</dt><dd>GMT+8 · Manila</dd></div><div><dt>Currently</dt><dd><span className="status-activity">💻 Building &amp; learning</span></dd></div><div><dt>Open to</dt><dd className="status-list__pills"><span>Collabs</span><span>Coffee chats</span><span>Talks</span><span>Volleyball</span><span>Ride &amp; chats</span></dd></div></dl></div></section>
    <p className="site-footer__base text-meta">© 2026 John Reggie Barbacena. All rights reserved.</p>
  </div><nav className="social-dock" aria-label="Social links"><ul>{socials.map(([label, href]) => <li key={label}><a className="social-dock__link" href={href} target="_blank" rel="noopener noreferrer" aria-label={label}><SocialIcon label={label} /></a></li>)}</ul></nav></footer>;
}
