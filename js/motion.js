// motion.js — minimal vanilla-JS reveal trigger. CSS owns all animation
// (see motion.css); this module only toggles the .is-revealed class when an
// element scrolls into view. No animation library (no GSAP). Respects
// prefers-reduced-motion and degrades gracefully without IntersectionObserver.

const REDUCED_MOTION = window.matchMedia(
  "(prefers-reduced-motion: reduce)"
).matches;

function revealAll(elements) {
  elements.forEach((el) => el.classList.add("is-revealed"));
}

function initReveal() {
  // Mark that JS is available so CSS pre-reveal state applies only with JS.
  document.documentElement.classList.add("js");

  const targets = Array.from(document.querySelectorAll("[data-reveal]"));
  if (targets.length === 0) return;

  // Under reduced motion, or without IntersectionObserver support, show
  // everything immediately in its final state — never hide content.
  if (REDUCED_MOTION || typeof IntersectionObserver === "undefined") {
    revealAll(targets);
    return;
  }

  const observer = new IntersectionObserver(
    (entries, obs) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-revealed");
          obs.unobserve(entry.target);
        }
      }
    },
    { rootMargin: "0px 0px -10% 0px", threshold: 0.1 }
  );

  targets.forEach((el) => observer.observe(el));
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initReveal);
} else {
  initReveal();
}
