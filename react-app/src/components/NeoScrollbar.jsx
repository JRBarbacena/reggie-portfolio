import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";

export default function NeoScrollbar() {
  const trackRef = useRef(null);
  const thumbRef = useRef(null);
  const dragRef = useRef(null);
  const frameRef = useRef(0);
  const { pathname } = useLocation();

  useEffect(() => {
    const track = trackRef.current;
    const thumb = thumbRef.current;
    if (!track || !thumb) return undefined;

    const metrics = () => {
      const root = document.documentElement;
      const maxScroll = Math.max(0, root.scrollHeight - window.innerHeight);
      const trackHeight = track.clientHeight;
      const thumbHeight = Math.max(42, Math.round(trackHeight * (window.innerHeight / root.scrollHeight)));
      return { maxScroll, thumbHeight, maxThumbTop: Math.max(0, trackHeight - thumbHeight) };
    };
    const update = () => {
      frameRef.current = 0;
      const { maxScroll, thumbHeight, maxThumbTop } = metrics();
      track.hidden = maxScroll === 0;
      thumb.style.height = `${thumbHeight}px`;
      thumb.style.transform = `translate3d(0, ${maxScroll ? (window.scrollY / maxScroll) * maxThumbTop : 0}px, 0)`;
    };
    const scheduleUpdate = () => { if (!frameRef.current) frameRef.current = window.requestAnimationFrame(update); };
    const resizeObserver = new ResizeObserver(scheduleUpdate);
    resizeObserver.observe(document.documentElement);
    window.addEventListener("scroll", scheduleUpdate, { passive: true });
    window.addEventListener("resize", scheduleUpdate);
    scheduleUpdate();
    return () => {
      window.removeEventListener("scroll", scheduleUpdate);
      window.removeEventListener("resize", scheduleUpdate);
      resizeObserver.disconnect();
      if (frameRef.current) window.cancelAnimationFrame(frameRef.current);
      frameRef.current = 0;
    };
  }, [pathname]);

  const scrollFromThumb = (top) => {
    const root = document.documentElement;
    const track = trackRef.current;
    const thumb = thumbRef.current;
    const maxScroll = Math.max(0, root.scrollHeight - window.innerHeight);
    const maxThumbTop = Math.max(0, track.clientHeight - thumb.clientHeight);
    if (maxThumbTop) window.scrollTo({ top: (top / maxThumbTop) * maxScroll, behavior: "auto" });
  };

  const pointerDown = (event) => {
    const track = trackRef.current;
    const thumb = thumbRef.current;
    if (event.target === thumb) {
      dragRef.current = { startY: event.clientY, startScroll: window.scrollY };
      thumb.setPointerCapture(event.pointerId); track.classList.add("is-dragging");
      return;
    }
    const rect = track.getBoundingClientRect();
    scrollFromThumb(event.clientY - rect.top - thumb.clientHeight / 2);
  };

  const pointerMove = (event) => {
    if (!dragRef.current) return;
    const root = document.documentElement;
    const track = trackRef.current;
    const thumb = thumbRef.current;
    const maxScroll = Math.max(0, root.scrollHeight - window.innerHeight);
    const maxThumbTop = Math.max(0, track.clientHeight - thumb.clientHeight);
    if (!maxScroll || !maxThumbTop) return;
    const next = dragRef.current.startScroll + ((event.clientY - dragRef.current.startY) / maxThumbTop) * maxScroll;
    window.scrollTo({ top: Math.min(maxScroll, Math.max(0, next)), behavior: "auto" });
  };

  const pointerUp = () => { dragRef.current = null; trackRef.current?.classList.remove("is-dragging"); };

  return <div ref={trackRef} className="neo-scrollbar" aria-hidden="true" onPointerDown={pointerDown}><span ref={thumbRef} onPointerMove={pointerMove} onPointerUp={pointerUp} onPointerCancel={pointerUp} /></div>;
}
