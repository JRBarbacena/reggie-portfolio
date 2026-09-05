import { useEffect, useId, useRef, useState } from "react";
import "./ChatbotMascot.css";

export const CHATBOT_MASCOT_STATES = [
  "idle",
  "hover",
  "listening",
  "thinking",
  "responding",
  "success",
  "error",
  "notification",
  "opening",
  "open",
  "closing",
];

const TRACKING_STATES = new Set(["idle", "hover", "listening", "open"]);

function validState(state) {
  return CHATBOT_MASCOT_STATES.includes(state) ? state : "idle";
}

/**
 * An animation-ready, decorative clay mascot. The SVG exposes independent
 * shadow, body, lobe-detail, and eye layers so chat state never needs to
 * know about its visual implementation.
 */
export default function ChatbotMascot({
  state = "idle",
  size = 64,
  className = "",
  animated = true,
  onAnimationEnd,
}) {
  const mascotRef = useRef(null);
  const pointerFrameRef = useRef(0);
  const pointerRef = useRef(null);
  const blinkTimersRef = useRef([]);
  const [isBlinking, setIsBlinking] = useState(false);
  const mascotState = validState(state);
  const instanceId = useId().replace(/:/g, "");
  const ids = {
    clay: `mascot-clay-${instanceId}`,
    highlight: `mascot-highlight-${instanceId}`,
    eye: `mascot-eye-${instanceId}`,
    softShadow: `mascot-soft-shadow-${instanceId}`,
    eyeShadow: `mascot-eye-shadow-${instanceId}`,
  };

  useEffect(() => {
    const mascot = mascotRef.current;
    if (!mascot || !animated) return undefined;

    const resetPointer = () => {
      mascot.style.setProperty("--mascot-eye-x", "0px");
      mascot.style.setProperty("--mascot-eye-y", "0px");
      mascot.style.setProperty("--mascot-lean", "0deg");
      mascot.style.setProperty("--mascot-follow-x", "0px");
      mascot.style.setProperty("--mascot-follow-y", "0px");
    };

    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (motionQuery.matches || !TRACKING_STATES.has(mascotState)) {
      resetPointer();
      return undefined;
    }

    const updatePointer = () => {
      pointerFrameRef.current = 0;
      const point = pointerRef.current;
      if (!point) return;
      const bounds = mascot.getBoundingClientRect();
      const centerX = bounds.left + bounds.width / 2;
      const centerY = bounds.top + bounds.height / 2;
      const deltaX = point.x - centerX;
      const deltaY = point.y - centerY;
      const distance = Math.max(1, Math.hypot(deltaX, deltaY));
      const strength = Math.min(1, distance / 240);
      const directionX = deltaX / distance;
      const directionY = deltaY / distance;
      const eyeX = Math.max(-1, Math.min(1, deltaX / 180));
      const eyeY = Math.max(-1, Math.min(1, deltaY / 180));
      mascot.style.setProperty("--mascot-eye-x", `${(eyeX * 3.4).toFixed(2)}px`);
      mascot.style.setProperty("--mascot-eye-y", `${(eyeY * 2).toFixed(2)}px`);
      mascot.style.setProperty("--mascot-lean", `${(eyeX * 1.8).toFixed(2)}deg`);
      mascot.style.setProperty("--mascot-follow-x", `${(directionX * strength * 4.5).toFixed(2)}px`);
      mascot.style.setProperty("--mascot-follow-y", `${(directionY * strength * 3.5).toFixed(2)}px`);
    };

    const handlePointerMove = (event) => {
      if (event.pointerType && event.pointerType !== "mouse") return;
      pointerRef.current = { x: event.clientX, y: event.clientY };
      if (!pointerFrameRef.current) pointerFrameRef.current = requestAnimationFrame(updatePointer);
    };
    const handlePointerLeave = () => {
      pointerRef.current = null;
      resetPointer();
    };

    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    document.documentElement.addEventListener("mouseleave", handlePointerLeave);
    window.addEventListener("blur", handlePointerLeave);
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      document.documentElement.removeEventListener("mouseleave", handlePointerLeave);
      window.removeEventListener("blur", handlePointerLeave);
      if (pointerFrameRef.current) cancelAnimationFrame(pointerFrameRef.current);
      pointerFrameRef.current = 0;
      resetPointer();
    };
  }, [animated, mascotState]);

  useEffect(() => {
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (!animated || motionQuery.matches || !["idle", "hover", "open", "listening"].includes(mascotState)) {
      setIsBlinking(false);
      return undefined;
    }

    let cancelled = false;
    const scheduleBlink = () => {
      const wait = 3_800 + Math.random() * 4_600;
      const start = window.setTimeout(() => {
        if (cancelled) return;
        setIsBlinking(true);
        const end = window.setTimeout(() => {
          setIsBlinking(false);
          if (!cancelled) scheduleBlink();
        }, 150);
        blinkTimersRef.current.push(end);
      }, wait);
      blinkTimersRef.current.push(start);
    };
    scheduleBlink();
    return () => {
      cancelled = true;
      blinkTimersRef.current.forEach((timer) => window.clearTimeout(timer));
      blinkTimersRef.current = [];
      setIsBlinking(false);
    };
  }, [animated, mascotState]);

  return (
    <svg
      ref={mascotRef}
      className={["chatbot-mascot", !animated && "chatbot-mascot--static", className].filter(Boolean).join(" ")}
      data-state={mascotState}
      data-blinking={isBlinking}
      width={size}
      height={size}
      viewBox="0 0 160 160"
      aria-hidden="true"
      focusable="false"
      onAnimationEnd={onAnimationEnd}
    >
      <defs>
        <linearGradient id={ids.clay} x1="35" y1="24" x2="128" y2="142" gradientUnits="userSpaceOnUse">
          <stop stopColor="#30333a" />
          <stop offset="0.42" stopColor="#15171c" />
          <stop offset="1" stopColor="#050608" />
        </linearGradient>
        <radialGradient id={ids.highlight} cx="0" cy="0" r="1" gradientTransform="translate(62 46) rotate(55) scale(68 65)" gradientUnits="userSpaceOnUse">
          <stop stopColor="#626772" stopOpacity="0.52" />
          <stop offset="0.48" stopColor="#31343b" stopOpacity="0.16" />
          <stop offset="1" stopColor="#111217" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={ids.eye} x1="76" y1="70" x2="91" y2="108" gradientUnits="userSpaceOnUse">
          <stop stopColor="#fffefa" />
          <stop offset="0.72" stopColor="#f0efe8" />
          <stop offset="1" stopColor="#d7d6cf" />
        </linearGradient>
        <filter id={ids.softShadow} x="-30%" y="-40%" width="160%" height="190%">
          <feGaussianBlur stdDeviation="5.5" />
        </filter>
        <filter id={ids.eyeShadow} x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow dx="0" dy="2" stdDeviation="1.6" floodColor="#000000" floodOpacity="0.32" />
        </filter>
      </defs>

      <g className="chatbot-mascot__shadow">
        <ellipse cx="81" cy="137" rx="43" ry="9" fill="#1d2630" opacity="0.24" filter={`url(#${ids.softShadow})`} />
      </g>

      <g className="chatbot-mascot__body">
        <path
          className="chatbot-mascot__main-mass"
          d="M80 17c17.8 0 27.2 9.1 31.9 25.6 16.9-2.4 30.6 7.2 33.5 21.8 3.3 16.1-4.8 27.9-16 34.4 6.8 14.4 1.9 29.2-11.7 35.8-14.1 6.9-26.8 1.7-36.9-9.5-10.3 11.3-22.6 16.6-36.7 9.7-13.6-6.6-18.7-21.8-11.9-36.2C20.6 91.9 13 79.5 16.7 64.1c3.5-14.7 17-23.7 33.1-21.7C54.8 26 63.4 17 80 17Z"
          fill={`url(#${ids.clay})`}
        />
        <path
          className="chatbot-mascot__highlight"
          d="M80 21c15.7 0 24.3 8.1 28.3 22.8-12.4-5.9-27.9-7.8-42.7-.8C69.7 29.4 73.3 21 80 21Z"
          fill={`url(#${ids.highlight})`}
        />
        <g className="chatbot-mascot__lobes" aria-hidden="true">
          <path
            className="chatbot-mascot__lobe-detail"
            d="M41 55c-10.3 4.4-17.1 13-17.1 23.1 0 9.4 5.1 17.5 13.4 22.8-4.1-14.3-2.5-30.5 3.7-45.9ZM119 55c10.3 4.4 17.1 13 17.1 23.1 0 9.4-5.1 17.5-13.4 22.8 4.1-14.3 2.5-30.5-3.7-45.9Z"
            fill="#000000"
            opacity="0.2"
          />
        </g>
      </g>

      <g className="chatbot-mascot__face">
        <ellipse className="chatbot-mascot__eye chatbot-mascot__eye--left" cx="63" cy="85" rx="13.6" ry="19.8" fill={`url(#${ids.eye})`} filter={`url(#${ids.eyeShadow})`} />
        <ellipse className="chatbot-mascot__eye chatbot-mascot__eye--right" cx="97" cy="85" rx="13.6" ry="19.8" fill={`url(#${ids.eye})`} filter={`url(#${ids.eyeShadow})`} />
      </g>
    </svg>
  );
}
