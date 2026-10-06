import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { gsap } from "gsap";
import "./Masonry.css";

const COLUMN_QUERIES = ["(min-width: 1200px)", "(min-width: 780px)", "(min-width: 520px)"];
const COLUMN_VALUES = [4, 3, 2];

function useColumns() {
  const read = () => COLUMN_VALUES[COLUMN_QUERIES.findIndex((query) => matchMedia(query).matches)] ?? 1;
  const [columns, setColumns] = useState(() => typeof window === "undefined" ? 1 : read());

  useEffect(() => {
    const media = COLUMN_QUERIES.map((query) => matchMedia(query));
    const update = () => setColumns(read());
    media.forEach((entry) => entry.addEventListener("change", update));
    return () => media.forEach((entry) => entry.removeEventListener("change", update));
  }, []);

  return columns;
}

function useMeasure() {
  const ref = useRef(null);
  const [width, setWidth] = useState(0);

  useLayoutEffect(() => {
    if (!ref.current) return undefined;
    const observer = new ResizeObserver(([entry]) => {
      const nextWidth = Math.round(entry.contentRect.width * 2) / 2;
      setWidth((currentWidth) => Math.abs(currentWidth - nextWidth) < 0.5 ? currentWidth : nextWidth);
    });
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return [ref, width];
}

function loadImageDimensions(items) {
  return Promise.all(items.map((item) => new Promise((resolve) => {
    const image = new Image();
    image.onload = () => resolve([item.id, image.naturalWidth / image.naturalHeight]);
    image.onerror = () => resolve([item.id, 4 / 3]);
    image.src = item.img;
  }))).then((entries) => Object.fromEntries(entries));
}

function initialPosition(item, direction, bounds) {
  if (direction === "top") return { x: item.x, y: item.y - 38 };
  if (direction === "left") return { x: item.x - 38, y: item.y };
  if (direction === "right") return { x: item.x + 38, y: item.y };
  if (direction === "center") return { x: bounds.width / 2 - item.w / 2, y: bounds.height / 2 - item.h / 2 };
  return { x: item.x, y: item.y + 38 };
}

export default function Masonry({
  items,
  ease = "power3.out",
  duration = 0.6,
  stagger = 0.05,
  animateFrom = "bottom",
  scaleOnHover = true,
  hoverScale = 1.015,
  blurToFocus = true,
}) {
  const columns = useColumns();
  const [containerRef, width] = useMeasure();
  const [ratios, setRatios] = useState(null);
  const hasMounted = useRef(false);
  const pointerBounds = useRef(new WeakMap());

  useEffect(() => {
    let current = true;
    setRatios(null);
    loadImageDimensions(items).then((dimensions) => { if (current) setRatios(dimensions); });
    return () => { current = false; };
  }, [items]);

  const layout = useMemo(() => {
    if (!width || !ratios) return { entries: [], height: 0 };
    const columnHeights = new Array(columns).fill(0);
    const columnWidth = width / columns;
    const inset = 6;
    const entries = items.map((item) => {
      const column = columnHeights.indexOf(Math.min(...columnHeights));
      const ratio = Math.max(0.55, Math.min(2, ratios[item.id] || 4 / 3));
      const height = (columnWidth - inset * 2) / ratio + inset * 2;
      const entry = { ...item, x: columnWidth * column, y: columnHeights[column], w: columnWidth, h: height };
      columnHeights[column] += height;
      return entry;
    });
    return { entries, height: Math.max(0, ...columnHeights) };
  }, [columns, items, ratios, width]);

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container || layout.entries.length === 0) return undefined;
    const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const bounds = container.getBoundingClientRect();
    const elements = [];

    layout.entries.forEach((item, index) => {
      const element = container.querySelector(`[data-masonry-key="${CSS.escape(item.id)}"]`);
      if (!element) return;
      elements.push(element);
      const destination = { x: item.x, y: item.y, width: item.w, height: item.h };
      if (!hasMounted.current && !reducedMotion) {
        const start = initialPosition(item, animateFrom, bounds);
        gsap.fromTo(element, {
          ...start,
          width: item.w,
          height: item.h,
          opacity: 0,
          scale: 0.975,
          filter: blurToFocus && index < columns * 2 ? "blur(3px)" : "none",
        }, {
          ...destination,
          opacity: 1,
          scale: 1,
          filter: "blur(0px)",
          duration,
          ease,
          delay: index * stagger,
          onComplete: () => { element.style.willChange = "auto"; },
        });
      } else {
        gsap.to(element, { ...destination, opacity: 1, filter: "blur(0px)", duration: reducedMotion ? 0 : duration, ease, overwrite: "auto" });
      }
    });
    hasMounted.current = true;
    return () => { elements.forEach((element) => gsap.killTweensOf(element)); };
  }, [animateFrom, blurToFocus, columns, containerRef, duration, ease, layout, stagger]);

  const handlePointerEnter = (event) => {
    const element = event.currentTarget;
    pointerBounds.current.set(element, element.getBoundingClientRect());
    const image = element.querySelector("img");
    if (image) image.style.willChange = "transform";
    if (scaleOnHover && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
      gsap.to(element, { scale: hoverScale, duration: 0.32, ease: "power2.out", overwrite: "auto" });
    }
  };

  const handlePointerMove = (event) => {
    if (matchMedia("(prefers-reduced-motion: reduce), (pointer: coarse)").matches) return;
    const bounds = pointerBounds.current.get(event.currentTarget);
    const image = event.currentTarget.querySelector("img");
    if (!bounds || !image) return;
    const x = ((event.clientX - bounds.left) / bounds.width - 0.5) * 10;
    const y = ((event.clientY - bounds.top) / bounds.height - 0.5) * 8;
    gsap.to(image, { x, y, scale: 1.045, duration: 0.45, ease: "power3.out", overwrite: "auto" });
  };

  const handlePointerLeave = (event) => {
    const element = event.currentTarget;
    pointerBounds.current.delete(element);
    gsap.to(element, { scale: 1, duration: 0.32, ease: "power2.out", overwrite: "auto" });
    const image = element.querySelector("img");
    if (image) gsap.to(image, { x: 0, y: 0, scale: 1, duration: 0.5, ease: "power3.out", overwrite: "auto", onComplete: () => { image.style.willChange = "auto"; } });
  };

  return <div ref={containerRef} className="masonry-list" style={{ height: `${layout.height}px` }}>
    {layout.entries.map((item) => <figure
      key={item.id}
      data-masonry-key={item.id}
      className="masonry-item"
      onPointerEnter={handlePointerEnter}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
    >
      <div className="masonry-item__image"><img src={item.img} srcSet={item.srcSet} sizes="(max-width: 520px) 94vw, (max-width: 780px) 47vw, (max-width: 1200px) 31vw, 24vw" alt={item.alt} loading="lazy" decoding="async" /></div>
    </figure>)}
  </div>;
}
