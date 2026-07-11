// hero-chips.js — click-to-reveal behavior for the scattered hero chips on the
// Home page. Each chip toggles its detail bubble; opening one closes the rest.
// Closes on outside click and Escape. No animation library — CSS handles motion.

function initHeroChips() {
  const chips = Array.from(document.querySelectorAll(".hero-chip"));
  if (chips.length === 0) return;

  const closeAll = (except) => {
    chips.forEach((chip) => {
      if (chip !== except) chip.setAttribute("aria-expanded", "false");
    });
  };

  chips.forEach((chip) => {
    chip.addEventListener("click", (e) => {
      e.stopPropagation();
      const open = chip.getAttribute("aria-expanded") === "true";
      closeAll(chip);
      chip.setAttribute("aria-expanded", String(!open));
    });
  });

  document.addEventListener("click", () => closeAll(null));
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeAll(null);
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initHeroChips);
} else {
  initHeroChips();
}
