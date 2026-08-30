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

export default function HeroBallpit({ active = true }) {
  const [capable, setCapable] = useState(false);
  const [compact, setCompact] = useState(window.innerWidth < 720);

  useEffect(() => {
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const compactQuery = window.matchMedia("(max-width: 719px)");
    const connection = navigator.connection;
    const update = () => {
      setCompact(compactQuery.matches);
      setCapable(active && !motionQuery.matches && !connection?.saveData && supportsWebGL());
    };
    update();
    motionQuery.addEventListener("change", update);
    compactQuery.addEventListener("change", update);
    connection?.addEventListener?.("change", update);
    return () => {
      motionQuery.removeEventListener("change", update);
      compactQuery.removeEventListener("change", update);
      connection?.removeEventListener?.("change", update);
    };
  }, [active]);

  return (
    <div
      className={`hero-ballpit ${capable ? "is-live" : "is-static"}`}
      aria-hidden="true"
    >
      {capable && (
        <BallpitBoundary>
          <Suspense fallback={null}>
            <Ballpit
              className="hero-ballpit__canvas"
              count={65}
              gravity={0}
              friction={0.998}
              wallBounce={0.55}
              followCursor={false}
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
