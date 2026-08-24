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
  // Replace the server-safe fallback class once scripting is confirmed.
  document.documentElement.classList.remove("no-js");
  document.documentElement.classList.add("js");

  // Designs and the exception page keep their intentionally static layouts.
  if (document.body.matches(".error-page") || location.pathname.includes("designs")) {
    document.documentElement.classList.add("motion-disabled");
    return;
  }

  // Section heading text is safe, lightweight automatic reveal content.
  // Complex components opt in themselves so their layout transforms never conflict.
  const automaticTargets = document.querySelectorAll(
    "main section:not(:first-child) > .section-head > :is(h2, p):not([data-reveal])"
  );
  automaticTargets.forEach((element) => {
    if (element.closest("[data-reveal]")) return;
    element.setAttribute("data-reveal", "text");
    if (element.matches("p")) element.setAttribute("data-reveal-delay", "1");
  });

  const targets = Array.from(document.querySelectorAll("[data-reveal]"));
  if (targets.length === 0) return;

  function beginReveals() {
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
            entry.target.addEventListener(
              "transitionend",
              () => entry.target.classList.add("reveal-complete"),
              { once: true }
            );
            obs.unobserve(entry.target);
          }
        }
      },
      { rootMargin: "0px 0px -18% 0px", threshold: 0.12 }
    );

    targets.forEach((el) => observer.observe(el));
  }

  // The entry gate hides the page. Do not run below-the-fold reveals behind
  // it, otherwise visitors never see those transitions after clicking Enter.
  if (document.documentElement.classList.contains("preloader-pending")) {
    document.addEventListener("portfolio:entered", beginReveals, { once: true });
  } else {
    beginReveals();
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initReveal);
} else {
  initReveal();
}
