import { useEffect, useRef, useState } from "react";
import { NavLink } from "react-router-dom";
import { routes } from "../site-data.js";
import BrandMark from "./BrandMark.jsx";

const primaryRoutes = routes.filter((route) => route.tier === "primary");

export default function SiteNavigation() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(() => window.matchMedia("(max-width: 768px)").matches);
  const navRef = useRef(null);
  const menuButtonRef = useRef(null);

  useEffect(() => {
    const query = window.matchMedia("(max-width: 768px)");
    const updateViewport = () => {
      setIsMobile(query.matches);
      if (!query.matches) setMenuOpen(false);
    };
    query.addEventListener("change", updateViewport);
    return () => query.removeEventListener("change", updateViewport);
  }, []);

  useEffect(() => {
    const handlePointer = (event) => {
      if (navRef.current?.contains(event.target)) return;
      setMenuOpen(false);
    };
    const handleKey = (event) => {
      if (event.key !== "Escape") return;
      if (menuOpen) { setMenuOpen(false); menuButtonRef.current?.focus(); }
    };
    document.addEventListener("pointerdown", handlePointer);
    document.addEventListener("keydown", handleKey);
    return () => { document.removeEventListener("pointerdown", handlePointer); document.removeEventListener("keydown", handleKey); };
  }, [menuOpen]);

  const closeMenus = () => { setMenuOpen(false); };
  const linkClass = ({ isActive }) => `site-nav__link${isActive ? " is-active" : ""}`;

  return <nav ref={navRef} className="site-nav" aria-label="Primary navigation" data-menu-open={menuOpen}>
    <NavLink className="site-nav__brand" to="/" aria-label="Home — Reggie" onClick={closeMenus}>
      <BrandMark />
    </NavLink>
    <button ref={menuButtonRef} className="site-nav__mobile-toggle" type="button" aria-expanded={menuOpen} aria-controls="site-nav-menu" aria-label="Toggle navigation menu" onClick={() => setMenuOpen((open) => !open)}>☰</button>
    <div className="site-nav__menu" id="site-nav-menu" inert={isMobile && !menuOpen ? true : undefined}>
      <ul className="site-nav__list">{primaryRoutes.map((route) => <li key={route.path}><NavLink className={linkClass} to={route.path} end={route.path === "/"} onClick={closeMenus}>{route.label}</NavLink></li>)}</ul>
    </div>
  </nav>;
}
