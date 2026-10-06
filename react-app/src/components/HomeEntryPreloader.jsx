import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { animate, cubicBezier, scrambleText } from "animejs";
import "./HomeEntryPreloader.css";

const PORTFOLIO_OWNER = "Reggie Barbacena";
const CURTAIN_DURATION = 720;
const APPLE_EASE = cubicBezier(0.22, 1, 0.36, 1);

export default function HomeEntryPreloader({ ready = true, onPrepare, onReveal, onComplete }) {
  const overlayRef = useRef(null);
  const nameRef = useRef(null);
  const finishedRef = useRef(false);
  const [scrambleComplete, setScrambleComplete] = useState(false);

  useEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let animation;
    let startFrame = 0;

    const finishScramble = () => {
      setScrambleComplete(true);
    };

    if (reducedMotion.matches) {
      startFrame = window.requestAnimationFrame(() => {
        onPrepare?.();
        finishScramble();
      });
      return () => window.cancelAnimationFrame(startFrame);
    }

    startFrame = window.requestAnimationFrame(() => {
      if (!nameRef.current) return;
      // Prepare the hero while the visitor is reading the name so WebGL and
      // the curtain never create a second wait after the scramble settles.
      onPrepare?.();
      animation = animate(nameRef.current, {
        innerHTML: scrambleText({
          text: PORTFOLIO_OWNER,
          chars: "braille",
          override: true,
          from: "center",
          cursor: "⠿",
          revealRate: 12,
          settleRate: 68,
          settleDuration: 650,
          duration: 2250,
          perturbation: 0,
          seed: 19,
          ease: APPLE_EASE,
        }),
        onComplete: finishScramble,
      });
    });

    return () => {
      window.cancelAnimationFrame(startFrame);
      animation?.cancel?.();
    };
  }, [onPrepare]);

  useEffect(() => {
    if (!ready || !scrambleComplete || finishedRef.current) return undefined;
    finishedRef.current = true;
    onReveal();
    overlayRef.current?.classList.add("is-lifting");
    const finishTimer = window.setTimeout(onComplete, CURTAIN_DURATION);
    return () => window.clearTimeout(finishTimer);
  }, [onComplete, onReveal, ready, scrambleComplete]);

  return createPortal(
    <div ref={overlayRef} className="home-entry-preloader" style={{ "--home-entry-curtain-duration": `${CURTAIN_DURATION}ms` }} role="status" aria-live="polite" aria-label="Opening Reggie Barbacena's portfolio">
      <p ref={nameRef} className="home-entry-preloader__name">{PORTFOLIO_OWNER}</p>
    </div>,
    document.body,
  );
}
