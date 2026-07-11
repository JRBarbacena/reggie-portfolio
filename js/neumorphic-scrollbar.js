(function () {
  function initScrollbar() {
    const track = document.createElement("div");
    const thumb = document.createElement("span");
    track.className = "neo-scrollbar";
    track.setAttribute("aria-hidden", "true");
    track.append(thumb);
    document.body.append(track);

    let dragging = false;
    let startY = 0;
    let startScroll = 0;

    function metrics() {
      const root = document.documentElement;
      const maxScroll = Math.max(0, root.scrollHeight - window.innerHeight);
      const trackHeight = track.clientHeight;
      const thumbHeight = Math.max(42, Math.round(trackHeight * (window.innerHeight / root.scrollHeight)));
      return { maxScroll, trackHeight, thumbHeight, maxThumbTop: Math.max(0, trackHeight - thumbHeight) };
    }

    function update() {
      const { maxScroll, thumbHeight, maxThumbTop } = metrics();
      const top = maxScroll ? (window.scrollY / maxScroll) * maxThumbTop : 0;
      track.hidden = maxScroll === 0;
      thumb.style.height = `${thumbHeight}px`;
      thumb.style.transform = `translateY(${top}px)`;
    }

    function scrollFromThumb(top) {
      const { maxScroll, maxThumbTop } = metrics();
      if (!maxThumbTop) return;
      window.scrollTo({ top: (top / maxThumbTop) * maxScroll, behavior: "auto" });
    }

    track.addEventListener("pointerdown", (event) => {
      if (event.target === thumb) {
        dragging = true;
        startY = event.clientY;
        startScroll = window.scrollY;
        thumb.setPointerCapture(event.pointerId);
        track.classList.add("is-dragging");
        return;
      }
      const rect = track.getBoundingClientRect();
      const { thumbHeight } = metrics();
      scrollFromThumb(event.clientY - rect.top - thumbHeight / 2);
    });

    thumb.addEventListener("pointermove", (event) => {
      if (!dragging) return;
      const { maxScroll, maxThumbTop } = metrics();
      if (!maxScroll || !maxThumbTop) return;
      const nextScroll = Math.min(maxScroll, Math.max(0, startScroll + ((event.clientY - startY) / maxThumbTop) * maxScroll));
      window.scrollTo({ top: nextScroll, behavior: "auto" });
    });

    function endDrag() {
      dragging = false;
      track.classList.remove("is-dragging");
    }

    thumb.addEventListener("pointerup", endDrag);
    thumb.addEventListener("pointercancel", endDrag);
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    update();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initScrollbar, { once: true });
  } else {
    initScrollbar();
  }
})();
