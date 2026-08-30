// hero.js — Home hero collage. Click a scattered chip to reveal a detail;
// clicking again (or elsewhere, or Escape) closes it. One open at a time.

function initHeroChips() {
  const chips = Array.from(document.querySelectorAll(".hero-chip"));
  if (chips.length === 0) return;
  let activeChip = null;

  const closeAll = (except) => {
    chips.forEach((chip) => {
      if (chip !== except) {
        chip.setAttribute("aria-expanded", "false");
        chip.classList.remove("is-open");
      }
    });
    if (!except) activeChip = null;
  };

  chips.forEach((chip) => {
    chip.addEventListener("pointerenter", () => {
      chip.classList.add("is-hovering");
    });

    chip.addEventListener("pointerleave", () => {
      chip.classList.remove("is-hovering");
    });

    chip.addEventListener("click", (event) => {
      event.stopPropagation();
      const open = chip.getAttribute("aria-expanded") === "true";
      closeAll(chip);
      chip.setAttribute("aria-expanded", String(!open));
      chip.classList.toggle("is-open", !open);
      activeChip = open ? null : chip;
    });
  });

  // Close when clicking outside any chip.
  document.addEventListener("click", () => closeAll(null));

  // Close on Escape.
  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape" || !activeChip) return;
    const trigger = activeChip;
    closeAll(null);
    trigger.classList.remove("is-hovering");
    trigger.focus();
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initHeroChips);
} else {
  initHeroChips();
}
