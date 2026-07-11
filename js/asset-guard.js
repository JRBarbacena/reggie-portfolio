// asset-guard.js — resilience for asset-loading failures.
// Non-critical (images/fonts): keep surrounding text/layout intact (Req 1.5).
// Critical (CSS/JS): show a visible error banner while retaining rendered
// content (Req 1.6).

/** Hide broken informative images without disturbing layout/alt text. */
function guardImages() {
  const images = document.querySelectorAll("img");
  images.forEach((img) => {
    img.addEventListener(
      "error",
      () => {
        // Preserve reserved space; just remove the broken-image glyph.
        img.dataset.failed = "true";
        img.style.visibility = "hidden";
      },
      { once: true }
    );
  });
}

/** Reveal the critical-error banner while keeping already-rendered content. */
export function reportCriticalError() {
  document.body.classList.add("has-critical-error");
}

/** Verify the shared stylesheet actually applied; if not, surface an error. */
function guardCriticalStyles() {
  // main.css sets body { display: flex }. If styles failed to load/apply the
  // computed value will differ, signalling a critical CSS failure.
  requestAnimationFrame(() => {
    const applied = getComputedStyle(document.body).display;
    if (applied !== "flex") {
      reportCriticalError();
    }
  });
}

function init() {
  guardImages();
  guardCriticalStyles();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
