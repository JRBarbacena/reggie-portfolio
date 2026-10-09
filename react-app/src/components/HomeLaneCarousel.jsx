import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { gsap } from "gsap";
import { responsivePhotoDimensions, responsivePhotoPath, responsivePhotoSrcSet } from "../responsive-photos.js";
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
  const introTimelineRef = useRef(null);
  const introPlayingRef = useRef(false);
  const [centerIndex, setCenterIndex] = useState(Math.floor(lanes.length / 2));
  const [reducedMotion, setReducedMotion] = useState(false);
  const [hasEntered, setHasEntered] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(query.matches);
    update();
    query.addEventListener?.("change", update);
    return () => query.removeEventListener?.("change", update);
  }, []);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage || hasEntered) return undefined;
    if (reducedMotion || !("IntersectionObserver" in window)) {
      setHasEntered(true);
      return undefined;
    }

    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      setHasEntered(true);
      observer.disconnect();
    }, { threshold: 0.18, rootMargin: "0px 0px -8%" });

    observer.observe(stage);
    return () => observer.disconnect();
  }, [hasEntered, reducedMotion]);

  useLayoutEffect(() => {
    const stage = stageRef.current;
    if (!stage || lanes.length === 0) return undefined;
    let resizeFrame = 0;

    if (!hasEntered && !reducedMotion) {
      cardRefs.current.forEach((card, index) => {
        if (!card) return;
        const stackOffset = index - Math.floor(lanes.length / 2);
        card.dataset.centered = String(index === centerIndex);
        gsap.set(card, {
          x: stackOffset * 5,
          y: 88 + Math.abs(stackOffset) * 5,
          rotation: stackOffset * 2.5,
          scale: 0.76,
          opacity: 0,
          zIndex: lanes.length - Math.abs(stackOffset),
        });
      });
      return () => gsap.killTweensOf(cardRefs.current.filter(Boolean));
    }

    const arrange = () => {
      const width = stage.getBoundingClientRect().width;
      const spread = Math.min(225, Math.max(92, width * (width < 640 ? 0.26 : 0.2)));
      const firstLayout = firstLayoutRef.current;
      const cards = cardRefs.current.filter(Boolean);
      const targets = new Map();

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
        targets.set(card, target);
        if (reducedMotion) {
          gsap.set(card, { ...target, clearProps: "willChange" });
        }
      });

      if (reducedMotion) {
        firstLayoutRef.current = false;
        return;
      }

      if (firstLayout) {
        firstLayoutRef.current = false;
        introPlayingRef.current = true;
        const dealOrder = [...cards].sort((a, b) => {
          const aIndex = cardRefs.current.indexOf(a);
          const bIndex = cardRefs.current.indexOf(b);
          return Math.abs(aIndex - centerIndex) - Math.abs(bIndex - centerIndex) || aIndex - bIndex;
        });

        gsap.set(cards, { x: 0, y: 82, rotation: 0, scale: 0.8, opacity: 0, willChange: "transform, opacity" });
        introTimelineRef.current?.kill();
        introTimelineRef.current = gsap.timeline({
          defaults: { duration: 1.05, ease: "back.out(1.45)", overwrite: true },
          onComplete: () => {
            introPlayingRef.current = false;
            introTimelineRef.current = null;
            gsap.set(cards, { clearProps: "willChange" });
          },
        });

        introTimelineRef.current.to(cards, {
          y: 56,
          opacity: 0.9,
          duration: 0.32,
          stagger: 0.07,
          ease: "power2.out",
        }, 0);

        dealOrder.forEach((card, orderIndex) => {
          introTimelineRef.current.to(card, targets.get(card), 0.38 + orderIndex * 0.18);
        });
        return;
      }

      cards.forEach((card) => {
        gsap.to(card, { ...targets.get(card), duration: 0.58, ease: "power3.out", overwrite: "auto", willChange: "transform, opacity", onComplete: () => gsap.set(card, { clearProps: "willChange" }) });
      });
    };

    arrange();
    const scheduleArrange = () => {
      if (resizeFrame || introPlayingRef.current) return;
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
      introTimelineRef.current?.kill();
      introTimelineRef.current = null;
      introPlayingRef.current = false;
      gsap.killTweensOf(cardRefs.current.filter(Boolean));
    };
  }, [centerIndex, hasEntered, lanes.length, reducedMotion]);

  if (lanes.length === 0) return null;

  const move = (direction) => {
    setCenterIndex((current) => (current + direction + lanes.length) % lanes.length);
  };

  const carouselReady = hasEntered || reducedMotion;

  return <div className={`home-lane-carousel${carouselReady ? " is-entered" : ""}`} role="region" aria-roledescription="carousel" aria-label="Portfolio destinations">
    <div className="home-lane-carousel__stage" ref={stageRef}>
      {lanes.map((lane, index) => <Link
        className="home-lane-card"
        to={lane.path}
        key={lane.path}
        ref={(element) => { cardRefs.current[index] = element; }}
        aria-label={`View ${lane.title}: ${lane.description}`}
        aria-hidden={carouselReady ? undefined : true}
        tabIndex={carouselReady ? undefined : -1}
        data-center-before-navigation
        onClick={(event) => {
          if (index === centerIndex) return;
          event.preventDefault();
          setCenterIndex(index);
        }}
      >
        <figure className="home-lane-card__media">
          <img src={responsivePhotoPath(lane.image, 640)} srcSet={responsivePhotoSrcSet(lane.image)} sizes="(max-width: 640px) calc(100vw - 6rem), 17rem" alt={lane.alt} {...responsivePhotoDimensions(lane.image)} loading="lazy" decoding="async" />
          <figcaption>View {lane.title}</figcaption>
        </figure>
        <p>{lane.description}</p>
      </Link>)}
    </div>
    <div className="home-lane-carousel__controls" aria-label="Carousel controls">
      <button type="button" onClick={() => move(-1)} aria-label="Show previous destination" disabled={!carouselReady}><ArrowIcon direction="previous" /></button>
      <div className="home-lane-carousel__dots" role="group" aria-label="Choose a destination">
        {lanes.map((lane, index) => <button
          type="button"
          key={lane.path}
          className={index === centerIndex ? "is-active" : ""}
          aria-label={`Center ${lane.title}`}
          aria-pressed={index === centerIndex}
          disabled={!carouselReady}
          onClick={() => setCenterIndex(index)}
        />)}
      </div>
      <button type="button" onClick={() => move(1)} aria-label="Show next destination" disabled={!carouselReady}><ArrowIcon direction="next" /></button>
    </div>
  </div>;
}
