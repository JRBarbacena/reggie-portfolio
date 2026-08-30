import { useEffect, useState } from "react";
import "lenis/dist/lenis.css";

function supportsEnhancedScroll(motionQuery, pointerQuery) {
  return pointerQuery.matches
    && !motionQuery.matches
    && !navigator.connection?.saveData;
}

export default function SmoothScroll() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const pointerQuery = window.matchMedia("(hover: hover) and (pointer: fine)");
    const connection = navigator.connection;
    const update = () => setEnabled(supportsEnhancedScroll(motionQuery, pointerQuery));

    update();
    motionQuery.addEventListener("change", update);
    pointerQuery.addEventListener("change", update);
    connection?.addEventListener?.("change", update);
    return () => {
      motionQuery.removeEventListener("change", update);
      pointerQuery.removeEventListener("change", update);
      connection?.removeEventListener?.("change", update);
    };
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    if (!enabled) {
      root.dataset.scrollMotion = "native";
      return undefined;
    }

    let disposed = false;
    let animationFrame = 0;
    let lenis;
    let removeListeners = () => {};

    import("lenis").then(({ default: Lenis }) => {
      if (disposed) return;
      lenis = new Lenis({
        autoRaf: false,
        lerp: 0.11,
        smoothWheel: true,
        syncTouch: false,
        wheelMultiplier: 0.92,
        overscroll: true,
        stopInertiaOnNavigate: true,
        prevent: (node) => node instanceof HTMLElement
          && node.matches("dialog, textarea, select, [data-lenis-prevent], .neo-scrollbar"),
      });
      root.dataset.scrollMotion = "smooth";

      const frame = (time) => {
        animationFrame = 0;
        lenis.raf(time);
        if (lenis.isScrolling === "smooth") animationFrame = requestAnimationFrame(frame);
      };
      const wake = () => {
        if (!animationFrame) animationFrame = requestAnimationFrame(frame);
      };
      const sleepWhenHidden = () => {
        if (!document.hidden || !animationFrame) return;
        cancelAnimationFrame(animationFrame);
        animationFrame = 0;
      };

      window.addEventListener("wheel", wake, { passive: true });
      document.addEventListener("visibilitychange", sleepWhenHidden);
      removeListeners = () => {
        window.removeEventListener("wheel", wake);
        document.removeEventListener("visibilitychange", sleepWhenHidden);
      };
    });

    return () => {
      disposed = true;
      removeListeners();
      if (animationFrame) cancelAnimationFrame(animationFrame);
      lenis?.destroy();
      root.dataset.scrollMotion = "native";
    };
  }, [enabled]);

  return null;
}
