// hero.js — Home hero collage. Click a scattered chip to reveal a detail;
// clicking again (or elsewhere, or Escape) closes it. One open at a time.

function initHeroChips() {
  const chips = Array.from(document.querySelectorAll(".hero-chip"));
  if (chips.length === 0) return;

  const closeAll = (except) => {
    chips.forEach((chip) => {
      if (chip !== except) {
        chip.setAttribute("aria-expanded", "false");
        chip.classList.remove("is-open");
      }
    });
  };

  chips.forEach((chip) => {
    chip.addEventListener("click", (event) => {
      event.stopPropagation();
      const open = chip.getAttribute("aria-expanded") === "true";
      closeAll(chip);
      chip.setAttribute("aria-expanded", String(!open));
      chip.classList.toggle("is-open", !open);
    });
  });

  // Close when clicking outside any chip.
  document.addEventListener("click", () => closeAll(null));

  // Close on Escape.
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeAll(null);
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initHeroChips);
} else {
  initHeroChips();
}
