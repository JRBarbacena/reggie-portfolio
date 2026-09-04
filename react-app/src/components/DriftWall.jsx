import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import "./DriftWall.css";

const prefersReducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const columnFactor = (index, variance) => {
  const pseudo = ((index * 0.6180339887 + 0.35) % 1) * 2 - 1;
  return 1 + variance * pseudo;
};

export default function DriftWall({
  items,
  columns = 5,
  tileWidth = 164,
  tileHeight = 116,
  gap = 12,
  radius = 15,
  tilt = 14,
  turn = 0,
  roll = 2,
  perspective = 1050,
  depth = 10,
  speed = 34,
  direction = "up",
  variance = 0.5,
  parallax = 0.7,
  pauseOnHover = true,
  lift = 54,
  fade = 0.18,
  dim = 0.72,
  className = "",
  style,
}) {
  const containerRef = useRef(null);
  const planeRef = useRef(null);
  const trackRefs = useRef([]);
  const rafRef = useRef(null);
  const offsetsRef = useRef([]);
  const velocitiesRef = useRef([]);
  const hoveredColRef = useRef(-1);
  const wallHoveredRef = useRef(false);
  const pointerRef = useRef({ x: 0, y: 0 });
  const pointerDampedRef = useRef({ x: 0, y: 0 });
  const lastTsRef = useRef(null);
  const [containerHeight, setContainerHeight] = useState(520);
  const [activeId, setActiveId] = useState(null);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = (event) => setReduced(event.matches);
    setReduced(prefersReducedMotion());
    mediaQuery.addEventListener("change", onChange);
    return () => mediaQuery.removeEventListener("change", onChange);
  }, []);

  const columnItems = useMemo(() => {
    const grouped = Array.from({ length: columns }, () => []);
    items.forEach((item, index) => grouped[index % columns].push(item));
    return grouped.map((column) => (column.length ? column : items.slice(0, 1)));
  }, [columns, items]);

  const columnMeta = useMemo(() => {
    const unit = tileHeight + gap;
    return columnItems.map((column) => {
      const copyHeight = Math.max(unit, column.length * unit);
      const copies = Math.max(2, Math.ceil((containerHeight * 1.6) / copyHeight) + 1);
      return { copies, copyHeight };
    });
  }, [columnItems, containerHeight, gap, tileHeight]);

  useLayoutEffect(() => {
    if (!containerRef.current) return undefined;
    const observer = new ResizeObserver(([entry]) => {
      setContainerHeight(entry.contentRect.height || 520);
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const baseVelocities = useMemo(() => {
    const directionSign = direction === "up" ? 1 : -1;
    return columnItems.map((_, columnIndex) => {
      const alternateSign = columnIndex % 2 === 0 ? 1 : -1;
      return speed * columnFactor(columnIndex, variance) * directionSign * alternateSign;
    });
  }, [columnItems, direction, speed, variance]);

  useEffect(() => {
    offsetsRef.current = columnMeta.map((meta, index) => meta.copyHeight * ((index * 0.37) % 1));
    velocitiesRef.current = columnItems.map(() => 0);
  }, [columnItems, columnMeta]);

  const applyPlaneTransform = useCallback((pointerX, pointerY) => {
    if (!planeRef.current) return;
    planeRef.current.style.transform =
      `translate(-50%, -50%) scale(1.18) rotateX(${tilt + pointerY}deg) ` +
      `rotateY(${turn + pointerX}deg) rotateZ(${roll}deg) translateZ(${-depth}px)`;
  }, [depth, roll, tilt, turn]);

  useEffect(() => {
    let isVisible = true;
    let isRunning = false;

    const animate = (timestamp) => {
      if (!isRunning) return;
      if (lastTsRef.current === null) lastTsRef.current = timestamp;
      const delta = Math.min(0.05, Math.max(0, timestamp - lastTsRef.current) / 1000);
      lastTsRef.current = timestamp;

      const maximumTilt = parallax * 8;
      const targetX = pointerRef.current.x * maximumTilt;
      const targetY = -pointerRef.current.y * maximumTilt;
      const damping = 1 - Math.exp(-delta / 0.12);
      pointerDampedRef.current.x += (targetX - pointerDampedRef.current.x) * damping;
      pointerDampedRef.current.y += (targetY - pointerDampedRef.current.y) * damping;
      applyPlaneTransform(pointerDampedRef.current.x, pointerDampedRef.current.y);

      for (let columnIndex = 0; columnIndex < trackRefs.current.length; columnIndex += 1) {
        const track = trackRefs.current[columnIndex];
        const meta = columnMeta[columnIndex];
        if (!track || !meta) continue;

        if (!reduced) {
          const paused = pauseOnHover && (wallHoveredRef.current || hoveredColRef.current === columnIndex);
          const target = paused ? 0 : baseVelocities[columnIndex];
          const easing = 1 - Math.exp(-delta / (target === 0 ? 0.16 : 0.28));
          velocitiesRef.current[columnIndex] += (target - velocitiesRef.current[columnIndex]) * easing;
          const rawOffset = (offsetsRef.current[columnIndex] ?? 0) + velocitiesRef.current[columnIndex] * delta;
          offsetsRef.current[columnIndex] = ((rawOffset % meta.copyHeight) + meta.copyHeight) % meta.copyHeight;
        }

        track.style.transform = `translate3d(0, ${-(offsetsRef.current[columnIndex] ?? 0)}px, 0)`;
      }

      rafRef.current = requestAnimationFrame(animate);
    };

    const start = () => {
      if (isRunning || !isVisible || document.hidden) return;
      isRunning = true;
      lastTsRef.current = null;
      rafRef.current = requestAnimationFrame(animate);
    };
    const stop = () => {
      isRunning = false;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      lastTsRef.current = null;
    };
    const syncAnimation = () => {
      if (isVisible && !document.hidden) start();
      else stop();
    };
    const observer = new IntersectionObserver(([entry]) => {
      isVisible = entry.isIntersecting;
      syncAnimation();
    }, { rootMargin: "120px 0px", threshold: 0 });

    if (containerRef.current) observer.observe(containerRef.current);
    document.addEventListener("visibilitychange", syncAnimation);
    start();
    return () => {
      stop();
      observer.disconnect();
      document.removeEventListener("visibilitychange", syncAnimation);
    };
  }, [applyPlaneTransform, baseVelocities, columnMeta, parallax, pauseOnHover, reduced]);

  const activate = useCallback((id, columnIndex) => {
    hoveredColRef.current = columnIndex;
    setActiveId((current) => current === id ? current : id);
  }, []);

  const release = useCallback(() => {
    hoveredColRef.current = -1;
    setActiveId(null);
  }, []);

  const handlePointerMove = useCallback((event) => {
    const bounds = containerRef.current?.getBoundingClientRect();
    if (!bounds) return;
    if (parallax > 0 && !reduced) {
      pointerRef.current = {
        x: (event.clientX - bounds.left) / bounds.width - 0.5,
        y: (event.clientY - bounds.top) / bounds.height - 0.5,
      };
    }

    const tile = event.target.closest?.("[data-tile-id]");
    if (tile) activate(tile.dataset.tileId, Number(tile.dataset.col));
  }, [activate, parallax, reduced]);

  const cssVariables = useMemo(() => ({
    "--dw-tile-w": `${tileWidth}px`,
    "--dw-tile-h": `${tileHeight}px`,
    "--dw-gap": `${gap}px`,
    "--dw-radius": `${radius}px`,
    "--dw-perspective": `${perspective}px`,
    "--dw-lift": `${lift}px`,
    "--dw-dim": dim,
    "--dw-edge": `${Math.max(0, (1 - fade) * 100)}%`,
    ...style,
  }), [dim, fade, gap, lift, perspective, radius, style, tileHeight, tileWidth]);

  return (
    <div
      ref={containerRef}
      className={["drift-wall", reduced ? "drift-wall--reduced" : "", className].filter(Boolean).join(" ")}
      style={cssVariables}
      onPointerMove={handlePointerMove}
      onPointerEnter={() => { wallHoveredRef.current = true; }}
      onPointerLeave={() => {
        wallHoveredRef.current = false;
        pointerRef.current = { x: 0, y: 0 };
        release();
      }}
      role="group"
      aria-label="Drifting wall of technology logos"
    >
      <div ref={planeRef} className="drift-wall__plane">
        {columnItems.map((column, columnIndex) => {
          const { copies } = columnMeta[columnIndex];
          return (
            <div className="drift-wall__col" key={`column-${columnIndex}`}>
              <div className="drift-wall__track" ref={(element) => { trackRefs.current[columnIndex] = element; }}>
                {Array.from({ length: copies }, (_, copyIndex) =>
                  column.map((item, itemIndex) => {
                    const id = `${columnIndex}-${copyIndex}-${itemIndex}`;
                    return (
                      <div
                        className={`drift-wall__tile${activeId === id ? " is-active" : ""}`}
                        data-tile-id={id}
                        data-col={columnIndex}
                        key={id}
                        tabIndex={copyIndex === 0 ? 0 : -1}
                        role="img"
                        aria-label={item.title}
                        onFocus={() => activate(id, columnIndex)}
                        onBlur={release}
                      >
                        <span className="drift-wall__inner" style={{ "--tech-color": `#${item.hex}` }}>
                          {item.icon ? (
                            <svg className="drift-wall__logo" viewBox="0 0 24 24" aria-hidden="true">
                              <path d={item.icon.path} />
                            </svg>
                          ) : (
                            <span className="drift-wall__wordmark" aria-hidden="true">{item.shortTitle}</span>
                          )}
                          <span className="drift-wall__title" aria-hidden="true">{item.title}</span>
                        </span>
                      </div>
                    );
                  }),
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
