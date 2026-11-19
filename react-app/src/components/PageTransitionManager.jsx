import { forwardRef, useCallback, useEffect, useImperativeHandle, useLayoutEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import "./PageTransitionManager.css";

const MOVE_DURATION = 320;
const REVEAL_DURATION = 180;
const SAFETY_TIMEOUT = 6000;

function sourceSnapshot(element) {
  const bounds = element.getBoundingClientRect();
  const style = window.getComputedStyle(element);
  return {
    left: bounds.left,
    top: bounds.top,
    width: bounds.width,
    height: bounds.height,
    color: style.color,
    fontFamily: style.fontFamily,
    fontSize: style.fontSize,
    fontWeight: style.fontWeight,
    letterSpacing: style.letterSpacing,
    lineHeight: style.lineHeight,
  };
}

function navigationMotion(source, label) {
  const bounds = label.getBoundingClientRect();
  const sourceSize = Number.parseFloat(source.fontSize) || 16;
  const labelSize = Number.parseFloat(window.getComputedStyle(label).fontSize) || sourceSize;
  return {
    x: bounds.left - source.left,
    y: bounds.top - source.top,
    scale: labelSize / sourceSize,
  };
}

const PageTransitionManager = forwardRef(function PageTransitionManager({ navigate, pathname }, ref) {
  const [visual, setVisual] = useState(null);
  const activeRef = useRef(null);
  const frameRef = useRef(0);
  const observerRef = useRef(null);
  const timersRef = useRef(new Set());
  const mountedRef = useRef(true);

  const clearScheduledWork = useCallback(() => {
    timersRef.current.forEach(window.clearTimeout);
    timersRef.current.clear();
    if (frameRef.current) window.cancelAnimationFrame(frameRef.current);
    frameRef.current = 0;
    observerRef.current?.disconnect();
    observerRef.current = null;
  }, []);

  const schedule = useCallback((callback, delay) => {
    const timer = window.setTimeout(() => {
      timersRef.current.delete(timer);
      callback();
    }, delay);
    timersRef.current.add(timer);
    return timer;
  }, []);

  const focusDestination = useCallback((element) => {
    if (!element?.isConnected) return;
    const hadTabIndex = element.hasAttribute("tabindex");
    if (!hadTabIndex) element.setAttribute("tabindex", "-1");
    element.focus({ preventScroll: true });
    if (!hadTabIndex) element.addEventListener("blur", () => element.removeAttribute("tabindex"), { once: true });
  }, []);

  const finish = useCallback((focus = false, updateState = true) => {
    const active = activeRef.current;
    const heading = active?.heading;
    active?.sourceElement?.classList.remove("page-transition-source-hidden");
    active?.destinationElement?.classList.remove("page-transition-source-hidden");
    clearScheduledWork();
    document.documentElement.classList.remove(
      "page-transition-active",
      "page-transition-destination",
      "page-transition-revealing",
      "page-transition-scroll-locked",
    );
    activeRef.current = null;
    if (updateState && mountedRef.current) setVisual(null);
    if (focus) focusDestination(heading || document.querySelector("main#main:not(.route-loading) h1, main#main:not(.route-loading)"));
  }, [clearScheduledWork, focusDestination]);

  const establishDestination = useCallback((heading, destinationElement) => {
    const active = activeRef.current;
    if (!active || active.destinationElement) return;
    active.heading = heading;
    active.destinationElement = destinationElement;
    destinationElement.classList.add("page-transition-source-hidden");
    observerRef.current?.disconnect();
    observerRef.current = null;
    frameRef.current = window.requestAnimationFrame(() => {
      frameRef.current = 0;
      setVisual((current) => current ? {
        ...current,
        phase: "settling",
        motion: navigationMotion(current.source, destinationElement),
      } : current);
    });
    schedule(() => {
      destinationElement.classList.remove("page-transition-source-hidden");
      document.documentElement.classList.add("page-transition-revealing");
      setVisual((current) => current ? { ...current, phase: "revealing" } : current);
    }, MOVE_DURATION);
    schedule(() => finish(true), MOVE_DURATION + REVEAL_DURATION);
  }, [finish, schedule]);

  const findDestination = useCallback(() => {
    const active = activeRef.current;
    if (!active) return;
    const heading = document.querySelector("main#main:not(.route-loading) h1");
    const destinationElement = [...document.querySelectorAll(".site-nav a[data-page-transition]")]
      .find((link) => link.getAttribute("href") === active.destinationPath)
      ?.querySelector(".site-nav__label");
    if (heading && destinationElement) establishDestination(heading, destinationElement);
  }, [establishDestination]);

  useLayoutEffect(() => {
    const active = activeRef.current;
    if (!active) return;
    if (!active.navigationCommitted) {
      if (pathname !== active.sourcePath) finish(false);
      return;
    }
    if (pathname !== active.destinationPath) {
      finish(false);
      return;
    }
    document.documentElement.classList.add("page-transition-destination");
    window.scrollTo({ top: 0, behavior: "instant" });
    frameRef.current = window.requestAnimationFrame(() => {
      frameRef.current = 0;
      findDestination();
      if (activeRef.current?.destinationElement) return;
      observerRef.current = new MutationObserver(findDestination);
      observerRef.current.observe(document.getElementById("root"), { childList: true, subtree: true });
    });
  }, [findDestination, finish, pathname]);

  useEffect(() => {
    if (!visual) return undefined;
    let resizeFrame = 0;
    const recalculate = () => {
      resizeFrame = 0;
      const active = activeRef.current;
      if (!active) return;
      setVisual((current) => {
        if (!current) return current;
        if (active.destinationElement?.isConnected) return {
          ...current,
          motion: navigationMotion(current.source, active.destinationElement),
        };
        if (!active.sourceElement?.isConnected) return current;
        return { ...current, source: sourceSnapshot(active.sourceElement) };
      });
    };
    const scheduleRecalculation = () => {
      if (!resizeFrame) resizeFrame = window.requestAnimationFrame(recalculate);
    };
    window.addEventListener("resize", scheduleRecalculation);
    window.addEventListener("orientationchange", scheduleRecalculation);
    return () => {
      window.removeEventListener("resize", scheduleRecalculation);
      window.removeEventListener("orientationchange", scheduleRecalculation);
      if (resizeFrame) window.cancelAnimationFrame(resizeFrame);
    };
  }, [visual]);

  useImperativeHandle(ref, () => ({
    start({ link, destinationPath, nextLocation }) {
      if (!link.matches("[data-page-transition]")) return false;
      if (activeRef.current) return true;
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return false;

      const sourceElement = link.querySelector(".site-nav__label") || link;
      const source = sourceSnapshot(sourceElement);
      if (!source.width || !source.height) return false;

      activeRef.current = {
        destinationPath,
        heading: null,
        navigationCommitted: false,
        sourcePath: pathname,
        sourceElement,
      };
      document.documentElement.classList.add("page-transition-active");
      flushSync(() => setVisual({
        label: sourceElement.textContent.trim(),
        motion: { x: 0, y: 0, scale: 1 },
        phase: "ready",
        source,
      }));
      sourceElement.classList.add("page-transition-source-hidden");

      activeRef.current.navigationCommitted = true;
      try {
        navigate(nextLocation);
      } catch {
        finish(false);
        return true;
      }
      schedule(() => finish(false), SAFETY_TIMEOUT);
      return true;
    },
  }), [finish, navigate, pathname, schedule]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      finish(false, false);
    };
  }, [finish]);

  if (!visual) return null;
  const { source, motion } = visual;
  return <div className={`page-transition-layer is-${visual.phase}`} aria-hidden="true">
    <span
      className="page-transition-label-clone"
      style={{
        "--page-transition-scale": motion.scale,
        "--page-transition-x": `${motion.x}px`,
        "--page-transition-y": `${motion.y}px`,
        color: source.color,
        fontFamily: source.fontFamily,
        fontSize: source.fontSize,
        fontWeight: source.fontWeight,
        height: `${source.height}px`,
        left: `${source.left}px`,
        letterSpacing: source.letterSpacing,
        lineHeight: source.lineHeight,
        top: `${source.top}px`,
        width: `${source.width}px`,
      }}
    >{visual.label}</span>
  </div>;
});

export default PageTransitionManager;
