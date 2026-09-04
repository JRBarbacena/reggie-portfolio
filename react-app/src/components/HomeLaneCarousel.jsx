import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { gsap } from "gsap";
import "./HomeLaneCarousel.css";

function relativeSlot(index, centerIndex, total) {
  let distance = index - centerIndex;
  const half = Math.floor(total / 2);
  if (distance > half) distance -= total;
  if (distance < -half) distance += total;
  return distance;
}

function ArrowIcon({ direction }) {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d={direction === "previous" ? "m14.5 6-6 6 6 6" : "m9.5 6 6 6-6 6"} /></svg>;
}

export default function HomeLaneCarousel({ lanes }) {
  const stageRef = useRef(null);
  const cardRefs = useRef([]);
  const firstLayoutRef = useRef(true);
  const [centerIndex, setCenterIndex] = useState(Math.floor(lanes.length / 2));
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(query.matches);
    update();
    query.addEventListener?.("change", update);
    return () => query.removeEventListener?.("change", update);
  }, []);

  useLayoutEffect(() => {
    const stage = stageRef.current;
    if (!stage || lanes.length === 0) return undefined;
    let resizeFrame = 0;

    const arrange = () => {
      const width = stage.getBoundingClientRect().width;
      const spread = Math.min(225, Math.max(92, width * (width < 640 ? 0.26 : 0.2)));
      const firstLayout = firstLayoutRef.current;

      cardRefs.current.forEach((card, index) => {
        if (!card) return;
        const slot = relativeSlot(index, centerIndex, lanes.length);
        const distance = Math.abs(slot);
        const target = {
          x: slot * spread,
          y: distance * (width < 640 ? 22 : 30),
          rotation: slot * (width < 640 ? 7 : 10),
          scale: distance === 0 ? 1 : width < 640 ? 0.86 : 0.9,
          opacity: distance === 0 ? 1 : 0.82,
          zIndex: distance === 0 ? 10 : 5 - distance,
        };

        card.dataset.centered = String(distance === 0);
        if (reducedMotion) {
          gsap.set(card, target);
          return;
        }

        if (firstLayout) {
          gsap.fromTo(card,
            { x: 0, y: 105, rotation: 0, scale: 0.72, opacity: 0 },
            { ...target, duration: 0.9, delay: 0.08 + index * 0.08, ease: "elastic.out(1, 0.8)", overwrite: true },
          );
        } else {
          gsap.to(card, { ...target, duration: 0.58, ease: "power3.out", overwrite: "auto" });
        }
      });

      firstLayoutRef.current = false;
    };

    arrange();
    const scheduleArrange = () => {
      if (resizeFrame) return;
      resizeFrame = requestAnimationFrame(() => {
        resizeFrame = 0;
        arrange();
      });
    };
    const resizeObserver = new ResizeObserver(scheduleArrange);
    resizeObserver.observe(stage);
    return () => {
      resizeObserver.disconnect();
      if (resizeFrame) cancelAnimationFrame(resizeFrame);
      gsap.killTweensOf(cardRefs.current.filter(Boolean));
    };
  }, [centerIndex, lanes.length, reducedMotion]);

  if (lanes.length === 0) return null;

  const move = (direction) => {
    setCenterIndex((current) => (current + direction + lanes.length) % lanes.length);
  };

  return <div className="home-lane-carousel" role="region" aria-roledescription="carousel" aria-label="Portfolio destinations">
    <div className="home-lane-carousel__stage" ref={stageRef}>
      {lanes.map((lane, index) => <Link
        className="home-lane-card"
        to={lane.path}
        key={lane.path}
        ref={(element) => { cardRefs.current[index] = element; }}
        aria-label={`View ${lane.title}: ${lane.description}`}
        data-center-before-navigation
        onClick={(event) => {
          if (index === centerIndex) return;
          event.preventDefault();
          setCenterIndex(index);
        }}
      >
        <figure className="home-lane-card__media">
          <img src={`/images/photos/${lane.image}`} alt={lane.alt} width="640" height="480" loading="lazy" decoding="async" />
          <figcaption>View {lane.title}</figcaption>
        </figure>
        <p>{lane.description}</p>
      </Link>)}
    </div>
    <div className="home-lane-carousel__controls" aria-label="Carousel controls">
      <button type="button" onClick={() => move(-1)} aria-label="Show previous destination"><ArrowIcon direction="previous" /></button>
      <div className="home-lane-carousel__dots" role="group" aria-label="Choose a destination">
        {lanes.map((lane, index) => <button
          type="button"
          key={lane.path}
          className={index === centerIndex ? "is-active" : ""}
          aria-label={`Center ${lane.title}`}
          aria-pressed={index === centerIndex}
          onClick={() => setCenterIndex(index)}
        />)}
      </div>
      <button type="button" onClick={() => move(1)} aria-label="Show next destination"><ArrowIcon direction="next" /></button>
    </div>
  </div>;
}
