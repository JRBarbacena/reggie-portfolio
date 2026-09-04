import { useEffect, useRef } from "react";
import { animate, splitText, stagger } from "animejs";
import "./HomeHeroIntro.css";

const GREETING = "Hello there! I am John Reggie Barbacena";
const HEADLINE = "Welcome to my little space on the internet";

export default function HomeHeroIntro({ active, id }) {
  const greetingRef = useRef(null);
  const headlineRef = useRef(null);

  useEffect(() => {
    if (!active || !greetingRef.current || !headlineRef.current) return undefined;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let typingTimer = 0;
    let startTimer = 0;
    let wordAnimation;
    let splitter;

    const play = () => {
      if (!greetingRef.current || !headlineRef.current) return;
      if (reducedMotion.matches) {
        greetingRef.current.textContent = GREETING;
        greetingRef.current.classList.add("is-ready");
        headlineRef.current.classList.add("is-ready");
        return;
      }

      greetingRef.current.classList.add("is-ready");
      headlineRef.current.classList.add("is-ready");
      greetingRef.current.textContent = "";
      let character = 0;
      typingTimer = window.setInterval(() => {
        character += 1;
        if (greetingRef.current) greetingRef.current.textContent = GREETING.slice(0, character);
        if (character >= GREETING.length) window.clearInterval(typingTimer);
      }, 72);

      splitter = splitText(headlineRef.current, { words: true, accessible: true });
      wordAnimation = animate(splitter.words, {
        opacity: [0, 1],
        translateY: ["0.75em", "0"],
        duration: 720,
        delay: stagger(90, { start: 360 }),
        ease: "outExpo",
      });
    };

    startTimer = window.setTimeout(play, 620);
    return () => {
      window.clearTimeout(startTimer);
      window.clearInterval(typingTimer);
      wordAnimation?.cancel?.();
      splitter?.revert();
      greetingRef.current?.classList.remove("is-ready");
      headlineRef.current?.classList.remove("is-ready");
    };
  }, [active]);

  return <div className={`home-hero-intro${active ? " is-active" : ""}`}>
    <p ref={greetingRef} className="home-hero-intro__greeting" aria-label={GREETING}>{GREETING}</p>
    <h1 ref={headlineRef} id={id} className="home-hero-intro__headline" aria-label={HEADLINE}>
      Welcome to my <span className="home-hero-intro__highlight">little space</span> on the internet
    </h1>
  </div>;
}
