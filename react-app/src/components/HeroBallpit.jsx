import { Component, lazy, Suspense, useEffect, useState } from "react";
import "./HeroBallpit.css";

const Ballpit = lazy(() => import("./Ballpit.jsx"));
const HERO_BALL_COLORS = [0xd5001c, 0xffffff, 0xe5e7eb, 0x15151e];

function supportsWebGL() {
  try {
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("webgl2", { powerPreference: "low-power" })
      ?? canvas.getContext("webgl", { powerPreference: "low-power" });
    context?.getExtension("WEBGL_lose_context")?.loseContext();
    return Boolean(context);
  } catch {
    return false;
  }
}

class BallpitBoundary extends Component {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch() {
    // The CSS atmosphere remains visible if WebGL cannot initialize.
  }

  render() {
    return this.state.failed ? null : this.props.children;
  }
}

export default function HeroBallpit({ enabled = true, revealed = true, interactive = true, onReady }) {
  const [capable, setCapable] = useState(false);
  const [compact, setCompact] = useState(window.innerWidth < 720);
  const [capabilityChecked, setCapabilityChecked] = useState(false);

  useEffect(() => {
    if (!enabled) return undefined;
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const compactQuery = window.matchMedia("(max-width: 719px)");
    const phoneQuery = window.matchMedia("(max-width: 700px), (pointer: coarse) and (max-height: 500px)");
    const connection = navigator.connection;
    // Probe once per mount rather than allocating another context on rotation.
    let webglSupported;
    const update = () => {
      setCompact(compactQuery.matches);
      const allowAnimation = !phoneQuery.matches && !motionQuery.matches && !connection?.saveData;
      if (allowAnimation && webglSupported === undefined) webglSupported = supportsWebGL();
      setCapable(allowAnimation && Boolean(webglSupported));
      setCapabilityChecked(true);
    };
    update();
    motionQuery.addEventListener("change", update);
    compactQuery.addEventListener("change", update);
    phoneQuery.addEventListener("change", update);
    connection?.addEventListener?.("change", update);
    return () => {
      motionQuery.removeEventListener("change", update);
      compactQuery.removeEventListener("change", update);
      phoneQuery.removeEventListener("change", update);
      connection?.removeEventListener?.("change", update);
    };
  }, [enabled]);

  useEffect(() => {
    if (enabled && capabilityChecked && !capable) onReady?.();
  }, [enabled, capabilityChecked, capable, onReady]);

  return (
    <div
      className={`hero-ballpit ${capable ? "is-live" : "is-static"} ${revealed ? "is-revealed" : "is-gathered"}`}
      aria-hidden="true"
    >
      {enabled && capable && (
        <BallpitBoundary>
          <Suspense fallback={null}>
            <Ballpit
              className="hero-ballpit__canvas"
              count={57}
              gravity={0}
              friction={0.998}
              wallBounce={0.55}
              followCursor
              paused={!interactive}
              onReady={onReady}
              showCursorBall={false}
              colors={HERO_BALL_COLORS}
              ambientIntensity={1.15}
              lightIntensity={150}
              minSize={compact ? 0.24 : 0.3}
              maxSize={compact ? 0.58 : 0.76}
              maxVelocity={0.075}
            />
          </Suspense>
        </BallpitBoundary>
      )}
    </div>
  );
}
