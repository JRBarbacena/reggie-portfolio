import { useEffect, useLayoutEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import SiteFooter from "./SiteFooter.jsx";
import SiteNavigation from "./SiteNavigation.jsx";
import NeoScrollbar from "./NeoScrollbar.jsx";
import ClickSpark from "./ClickSpark.jsx";
import SmoothScroll from "./SmoothScroll.jsx";
import ChatbotWidget from "./ChatbotWidget.jsx";

const routeBodyClasses = ["home", "story-page", "tech-page", "travel-page", "life-page"];

export default function AppShell({ children }) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const isHome = pathname === "/";
  const headerRef = useRef(null);
  const hasReadPastHeroRef = useRef(false);

  useEffect(() => {
    hasReadPastHeroRef.current = false;
    document.body.classList.remove(...routeBodyClasses, "page-scroll-started");
    document.documentElement.classList.remove("is-page-leaving");
    if (isHome) document.body.classList.add("home");
    else if (pathname === "/tech") document.body.classList.add("story-page", "tech-page");
    else if (pathname === "/travel") document.body.classList.add("story-page", "travel-page");
    else if (pathname === "/life") document.body.classList.add("story-page", "life-page");
    window.scrollTo({ top: 0, behavior: "instant" });
    return () => {
      hasReadPastHeroRef.current = false;
      document.body.classList.remove(...routeBodyClasses, "page-scroll-started");
    };
  }, [isHome, pathname]);

  useEffect(() => {
    const header = headerRef.current;
    if (!header || isHome) return undefined;
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    let scrollFrame = 0;
    const syncHeader = () => {
      scrollFrame = 0;
      const hasStartedScrolling = window.scrollY > 12;
      const shouldSkipDeferredSections = motionQuery.matches || navigator.connection?.saveData;
      if (hasStartedScrolling || shouldSkipDeferredSections) hasReadPastHeroRef.current = true;
      header.classList.toggle("is-scrolled", hasStartedScrolling);
      // Reveal the interior only once per page visit. The header may return to its
      // unscrolled styling at the top, but content that has already appeared stays put.
      document.body.classList.toggle("page-scroll-started", hasReadPastHeroRef.current);
    };
    const scheduleHeaderSync = () => {
      if (!scrollFrame) scrollFrame = window.requestAnimationFrame(syncHeader);
    };
    syncHeader();
    window.addEventListener("scroll", scheduleHeaderSync, { passive: true });
    motionQuery.addEventListener("change", scheduleHeaderSync);
    return () => {
      window.removeEventListener("scroll", scheduleHeaderSync);
      motionQuery.removeEventListener("change", scheduleHeaderSync);
      if (scrollFrame) window.cancelAnimationFrame(scrollFrame);
      header.classList.remove("is-scrolled");
    };
  }, [isHome, pathname]);

  const handleLinkClick = (event) => {
    const link = event.target.closest("a[href]");
    if (!link || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || link.target || link.hasAttribute("download")) return;
    // Fan-carousel side cards use their first activation to move into the
    // center. Their own click handler prevents navigation for that activation.
    if (link.hasAttribute("data-center-before-navigation") && link.dataset.centered !== "true") return;
    const destination = new URL(link.href, window.location.href);
    if (destination.origin !== window.location.origin || destination.pathname === window.location.pathname) return;
    event.preventDefault();
    document.documentElement.classList.add("is-page-leaving");
    const delay = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 150;
    window.setTimeout(() => navigate(`${destination.pathname}${destination.search}${destination.hash}`), delay);
  };

  useLayoutEffect(() => {
    const elements = [...document.querySelectorAll("[data-reveal]")];
    const sections = [...document.querySelectorAll("[data-viewport-section]")];
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotion || !("IntersectionObserver" in window)) {
      elements.forEach((element) => element.classList.add("is-revealed", "reveal-complete"));
      sections.forEach((section) => section.classList.add("is-viewport-active", "has-entered-viewport"));
      return undefined;
    }
    const root = document.getElementById("root");
    const isInViewport = (element) => {
      const bounds = element.getBoundingClientRect();
      return bounds.top < window.innerHeight && bounds.bottom > 0;
    };
    // Never delay the hero or any content that is already visible when a route
    // first paints. Only elements outside the initial viewport use the reveal.
    elements.filter(isInViewport).forEach((element) => element.classList.add("is-revealed", "reveal-complete"));
    sections.filter(isInViewport).forEach((section) => section.classList.add("is-viewport-active", "has-entered-viewport"));
    const settleTimers = new Set();
    const revealFrames = new Set();
    const reveal = (element) => {
      if (element.classList.contains("is-revealed")) return;
      element.classList.add("reveal-active");
      const frame = window.requestAnimationFrame(() => {
        revealFrames.delete(frame);
        element.classList.add("is-revealed");
      });
      revealFrames.add(frame);
      let timer;
      const settle = () => {
        element.removeEventListener("transitionend", onTransitionEnd);
        if (timer) {
          window.clearTimeout(timer);
          settleTimers.delete(timer);
        }
        element.classList.add("reveal-complete");
        element.classList.remove("reveal-active");
      };
      const onTransitionEnd = (event) => { if (event.target === element) settle(); };
      element.addEventListener("transitionend", onTransitionEnd);
      timer = window.setTimeout(settle, 1100);
      settleTimers.add(timer);
    };
    const observer = new IntersectionObserver((entries) => entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      reveal(entry.target);
      observer.unobserve(entry.target);
    }), { threshold: 0.04, rootMargin: "80px 0px -2%" });
    const sectionObserver = new IntersectionObserver((entries) => entries.forEach((entry) => {
      entry.target.classList.toggle("is-viewport-active", entry.isIntersecting);
      if (entry.isIntersecting) entry.target.classList.add("has-entered-viewport");
    }), { threshold: 0, rootMargin: "18% 0px 18% 0px" });
    const observe = (element) => { if (!element.classList.contains("is-revealed")) observer.observe(element); };
    const observeSection = (element) => {
      if (!element.classList.contains("has-entered-viewport")) sectionObserver.observe(element);
    };
    elements.forEach(observe);
    sections.forEach(observeSection);
    const mutations = new MutationObserver((records) => records.forEach((record) => record.addedNodes.forEach((node) => {
      if (!(node instanceof Element)) return;
      if (node.matches("[data-reveal]")) observe(node);
      node.querySelectorAll?.("[data-reveal]").forEach(observe);
      if (node.matches("[data-viewport-section]")) observeSection(node);
      node.querySelectorAll?.("[data-viewport-section]").forEach(observeSection);
    })));
    mutations.observe(root, { childList: true, subtree: true });
    const revealFocusedContent = (event) => {
      const element = event.target.closest?.("[data-reveal]");
      if (element) reveal(element);
    };
    root.addEventListener("focusin", revealFocusedContent);
    // Enable the hidden starting state only after the observers are installed.
    document.documentElement.classList.add("motion-ready");
    return () => {
      observer.disconnect();
      sectionObserver.disconnect();
      mutations.disconnect();
      root.removeEventListener("focusin", revealFocusedContent);
      revealFrames.forEach(window.cancelAnimationFrame);
      settleTimers.forEach(window.clearTimeout);
    };
  }, [pathname]);

  return <div className="app-shell" onClickCapture={handleLinkClick}>
    <SmoothScroll />
    <ClickSpark />
    <a className="skip-link" href="#main">Skip to content</a>
    {!isHome && <header ref={headerRef} className="site-header"><SiteNavigation /></header>}
    {children}
    <SiteFooter />
    <NeoScrollbar />
    {pathname !== "/admin" && <ChatbotWidget />}
  </div>;
}
