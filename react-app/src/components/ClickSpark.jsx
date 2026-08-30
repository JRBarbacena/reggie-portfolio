import { useEffect, useRef } from "react";

const easingFunctions = {
  linear: (progress) => progress,
  "ease-in": (progress) => progress * progress,
  "ease-in-out": (progress) => progress < 0.5
    ? 2 * progress * progress
    : -1 + (4 - 2 * progress) * progress,
  "ease-out": (progress) => progress * (2 - progress),
};

export default function ClickSpark({
  sparkColor = "#d5001c",
  sparkSize = 8,
  sparkRadius = 14,
  sparkCount = 8,
  duration = 360,
  easing = "ease-out",
  extraScale = 1,
}) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return undefined;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const ease = easingFunctions[easing] ?? easingFunctions["ease-out"];
    const sparks = [];
    let animationFrame = 0;
    let enabled = !reducedMotion.matches;

    const setActiveState = (active) => {
      canvas.dataset.active = String(active);
    };

    const resizeCanvas = () => {
      const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(window.innerWidth * pixelRatio);
      canvas.height = Math.round(window.innerHeight * pixelRatio);
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
      context.lineCap = "round";
    };

    const stopAnimation = () => {
      if (animationFrame) cancelAnimationFrame(animationFrame);
      animationFrame = 0;
      sparks.length = 0;
      context.clearRect(0, 0, window.innerWidth, window.innerHeight);
      setActiveState(false);
    };

    const draw = (timestamp) => {
      context.clearRect(0, 0, window.innerWidth, window.innerHeight);

      for (let index = sparks.length - 1; index >= 0; index -= 1) {
        const spark = sparks[index];
        const progress = Math.min((timestamp - spark.startTime) / duration, 1);
        if (progress >= 1) {
          sparks.splice(index, 1);
          continue;
        }

        const eased = ease(progress);
        const distance = eased * sparkRadius * extraScale;
        const lineLength = sparkSize * (1 - eased);
        const cosine = Math.cos(spark.angle);
        const sine = Math.sin(spark.angle);

        context.globalAlpha = 1 - progress;
        context.strokeStyle = sparkColor;
        context.lineWidth = 1.75;
        context.beginPath();
        context.moveTo(spark.x + distance * cosine, spark.y + distance * sine);
        context.lineTo(
          spark.x + (distance + lineLength) * cosine,
          spark.y + (distance + lineLength) * sine,
        );
        context.stroke();
      }

      context.globalAlpha = 1;
      if (sparks.length > 0) animationFrame = requestAnimationFrame(draw);
      else {
        animationFrame = 0;
        setActiveState(false);
      }
    };

    const handlePointerDown = (event) => {
      if (!enabled || event.pointerType !== "mouse" || event.button !== 0) return;

      const startTime = performance.now();
      for (let index = 0; index < sparkCount; index += 1) {
        sparks.push({
          x: event.clientX,
          y: event.clientY,
          angle: (Math.PI * 2 * index) / sparkCount,
          startTime,
        });
      }

      setActiveState(true);
      if (!animationFrame) animationFrame = requestAnimationFrame(draw);
    };

    const handleMotionPreference = (event) => {
      enabled = !event.matches;
      canvas.dataset.enabled = String(enabled);
      if (!enabled) stopAnimation();
    };

    canvas.dataset.enabled = String(enabled);
    setActiveState(false);
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas, { passive: true });
    window.addEventListener("pointerdown", handlePointerDown, { passive: true });
    reducedMotion.addEventListener("change", handleMotionPreference);

    return () => {
      stopAnimation();
      window.removeEventListener("resize", resizeCanvas);
      window.removeEventListener("pointerdown", handlePointerDown);
      reducedMotion.removeEventListener("change", handleMotionPreference);
    };
  }, [duration, easing, extraScale, sparkColor, sparkCount, sparkRadius, sparkSize]);

  return <canvas ref={canvasRef} className="click-spark" aria-hidden="true" />;
}
