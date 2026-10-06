import { useEffect, useRef, useState } from "react";

export default function useNearViewport(rootMargin = "420px 0px") {
  const ref = useRef(null);
  const [isNear, setIsNear] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element || isNear) return undefined;
    let observer;
    let done = false;
    const margin = Math.max(0, Number.parseFloat(rootMargin) || 0);
    const cleanup = () => {
      observer?.disconnect();
      window.removeEventListener("scroll", checkPosition);
      window.removeEventListener("resize", checkPosition);
    };
    const reveal = () => {
      if (done) return;
      done = true;
      setIsNear(true);
      cleanup();
    };
    const checkPosition = () => {
      const bounds = element.getBoundingClientRect();
      if (bounds.top <= window.innerHeight + margin && bounds.bottom >= -margin) reveal();
    };

    // Check immediately as well as observing: cached/restored scroll positions
    // can already place a deferred section in view before the observer callback.
    checkPosition();
    if (done) return cleanup;
    window.addEventListener("scroll", checkPosition, { passive: true });
    window.addEventListener("resize", checkPosition, { passive: true });
    if ("IntersectionObserver" in window) {
      observer = new IntersectionObserver((entries) => {
        if (entries.some((entry) => entry.isIntersecting)) reveal();
      }, { rootMargin, threshold: 0 });
      observer.observe(element);
    }
    return cleanup;
  }, [isNear, rootMargin]);

  return [ref, isNear];
}
