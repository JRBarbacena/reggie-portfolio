import { useCallback, useEffect, useLayoutEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CoffeeIcon, LaptopIcon, MotorcycleIcon, UserGearIcon, VolleyballIcon } from "@phosphor-icons/react";
import SiteNavigation from "../components/SiteNavigation.jsx";
import HeroBallpit from "../components/HeroBallpit.jsx";
import HomeEntryPreloader from "../components/HomeEntryPreloader.jsx";
import HomeHeroIntro from "../components/HomeHeroIntro.jsx";
import { initialBrowserPathname } from "../runtime-session.js";

const ENTRY_STATUS_KEY = "reggie-portfolio-home-entry-seen";

function shouldShowHomeEntry() {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || navigator.connection?.saveData) return false;
  if (initialBrowserPathname !== "/") return false;
  const navigationType = performance.getEntriesByType("navigation")[0]?.type ?? "navigate";
  if (initialBrowserPathname === "/" && navigationType === "reload") return true;
  try {
    if (sessionStorage.getItem(ENTRY_STATUS_KEY)) return false;
    return true;
  } catch { return false; }
}

const photos = [
  ["Hundred_Island.JPG", "Reggie at Hundred Islands", "pos-photo-1"],
  ["Cursor_Cafe.JPG", "Reggie at Café Cursor Manila", "pos-photo-2"],
  ["Patawow_VB.JPG", "Reggie with his volleyball team", "pos-photo-3"],
  ["champs_vb.JPG", "Reggie with a volleyball championship trophy", "pos-photo-4"],
  ["BuildNights_AWS.JPG", "AWS Build Nights event", "pos-photo-5"],
  ["basketball.JPG", "Reggie playing basketball", "pos-photo-6"],
];

const chips = [
  ["laptop", "Laptop", "Acer Nitro 5 | Macbook M4", "pos-chip-1"],
  ["volleyball", "Volleyball", "Opposite Hitter", "pos-chip-2"],
  ["coffee", "Coffee", "White Chocolate Mocha", "pos-chip-3"],
  ["agents", "Agents", "Claude Code | Cursor | Codex | Kiro", "pos-chip-4"],
  ["motorcycle", "Motorcycle", "Nmax | Vespa Classic", "pos-chip-5"],
];

const lanes = [
  ["/tech", "Tech", "KiroVerse.JPG", "Reggie and his peers at an AWS event", "My growth in software engineering, UI/UX, and the communities helping me build better work."],
  ["/travel", "Travel", "Hundred_Island.JPG", "Reggie at Hundred Islands", "Places I have explored, from memorable Philippine escapes to the trips still ahead."],
  ["/life", "Life", "Patawow_VB.JPG", "Reggie and his volleyball team", "Sport, race weekends, coffee runs, and the moments that keep life moving off the clock."],
];

function ChipIcon({ id }) {
  const Icon = { laptop: LaptopIcon, volleyball: VolleyballIcon, coffee: CoffeeIcon, agents: UserGearIcon, motorcycle: MotorcycleIcon }[id];
  return <Icon size={28} weight="regular" aria-hidden="true" />;
}

function PhotoWindow({ photo, priority }) {
  const [name, alt, position] = photo;
  return <figure className={`photo-window ${position}`}><span className="photo-window__bar" aria-hidden="true"><i /><i /><i /><span className="photo-window__name">{name}</span></span><img className="photo-window__img" src={`/images/photos/${name}`} alt={alt} width="320" height="240" loading={priority ? undefined : "lazy"} decoding="async" fetchPriority={priority ? "high" : undefined} /></figure>;
}

export default function HomePage() {
  const [openChip, setOpenChip] = useState(null);
  const [entryVisible, setEntryVisible] = useState(shouldShowHomeEntry);
  const [heroReady, setHeroReady] = useState(() => !entryVisible);
  const revealHero = useCallback(() => setHeroReady(true), []);
  const finishEntry = useCallback(() => setEntryVisible(false), []);

  useLayoutEffect(() => {
    document.documentElement.classList.remove("home-entry-pending");
  }, []);

  useEffect(() => {
    const closeOnEscape = (event) => { if (event.key === "Escape") setOpenChip(null); };
    document.addEventListener("keydown", closeOnEscape);
    return () => { document.documentElement.classList.remove("portfolio-entered"); document.removeEventListener("keydown", closeOnEscape); };
  }, []);

  useEffect(() => {
    const appRoot = document.getElementById("root");
    if (entryVisible) {
      try { sessionStorage.setItem(ENTRY_STATUS_KEY, "true"); } catch { /* Storage is optional. */ }
      appRoot?.setAttribute("inert", "");
      return () => appRoot?.removeAttribute("inert");
    }
    appRoot?.removeAttribute("inert");
    const frame = window.requestAnimationFrame(() => document.documentElement.classList.add("portfolio-entered"));
    return () => window.cancelAnimationFrame(frame);
  }, [entryVisible]);

  return <><main id="main" tabIndex="-1">
    <section className="hero hero--home home-section home-section--hero" aria-labelledby="hero-title">
      <HeroBallpit revealed={heroReady} />
      <header className="site-header site-header--home"><SiteNavigation /></header>
      <div className="hero__center"><HomeHeroIntro active={!entryVisible} id="hero-title" /></div>
      <div className="collage" role="group" aria-label="Photos and details about Reggie">
        {photos.map((photo, index) => <PhotoWindow key={photo[0]} photo={photo} priority={index === 0} />)}
        {chips.map(([id, title, detail, position]) => {
          const expanded = openChip === id;
          return <button key={id} className={`hero-chip ${position}${expanded ? " is-open" : ""}`} type="button" aria-label={title} aria-expanded={expanded} aria-controls={`chip-${id}`} onClick={() => setOpenChip(expanded ? null : id)}><span className="hero-chip__icon" aria-hidden="true"><ChipIcon id={id} /></span><span className="hero-chip__detail" id={`chip-${id}`} role="status"><strong>{title}</strong>{detail}</span></button>;
        })}
      </div>
    </section>
    <section className="home-section home-section--lanes content-column" aria-labelledby="explore-title">
      <div className="section-head section-head--center" data-reveal><h2 id="explore-title">Pick a lane</h2><p>Three routes through what I do and who I am.</p></div>
      <ul className="gallery gallery--lanes" data-reveal>{lanes.map(([path, title, image, alt, description], index) => <li className="gallery__item card lift" data-reveal data-reveal-delay={index + 1} key={path}><Link className="lane-card__link" to={path}><figure className="lane-card__media"><figcaption className="lane-card__filename"><span className="lane-card__controls" aria-hidden="true"><i /><i /><i /></span><span className="lane-card__filename-text">{image}</span></figcaption><img src={`/images/photos/${image}`} alt={alt} width="640" height="480" loading="lazy" decoding="async" /></figure><div className="lane-card__body"><h3>{title}</h3><p>{description}</p></div></Link></li>)}</ul>
    </section>
  </main>{entryVisible && <HomeEntryPreloader onReveal={revealHero} onComplete={finishEntry} />}</>;
}
