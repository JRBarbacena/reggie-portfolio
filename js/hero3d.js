// hero3d.js — shared soft-3D hero element for the Travel and Life pages.
//
// One "core" object, two orbits: Travel renders it as a clay globe tracing
// the MNL -> HKG route; Life renders the same core inside a gyroscope of
// rings. Materials and lighting mirror the site's neumorphism: matte clay
// surfaces on the --bg-base tone, key light from the top-left (the same
// direction as the CSS shadow pair), MotoGP red reserved for accents.
//
// Constraints honored:
// - three.js is loaded lazily from a CDN; if the import or WebGL fails the
//   porthole falls back to the static CSS emblem (.hero3d--fallback).
// - prefers-reduced-motion: renders a single static frame, no loop.
// - The loop pauses when the porthole is offscreen or the tab is hidden.
// - Device pixel ratio is capped at 2; no shadow maps (cost stays low).

const THREE_CDN = [
  "https://cdn.jsdelivr.net/npm/three@0.169.0/build/three.module.js",
  "https://unpkg.com/three@0.169.0/build/three.module.js",
];

const REDUCED_MOTION = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const PALETTE = {
  clay: 0xe9edf4, // core surface — sits naturally on --bg-base
  clayDeep: 0xc7d0de, // recessed ring tone (matches --shadow-dark family)
  graphite: 0x2c2c38, // F1 carbon accent (--accent-secondary family)
  red: 0xd5001c, // MotoGP red (--accent-primary)
};

function latLonToVec3(THREE, lat, lon, radius) {
  const phi = ((90 - lat) * Math.PI) / 180;
  const theta = ((lon + 180) * Math.PI) / 180;
  return new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta)
  );
}

function clayMaterial(THREE, color, roughness = 0.62) {
  return new THREE.MeshStandardMaterial({ color, roughness, metalness: 0.08 });
}

/* --- Scene variants ------------------------------------------------------ */

function buildGlobe(THREE, group) {
  const R = 1.62;
  const globe = new THREE.Mesh(
    new THREE.SphereGeometry(R, 48, 48),
    clayMaterial(THREE, PALETTE.clay)
  );
  group.add(globe);

  // Latitude rings — debossed graphite lines, like scores in clay.
  const latitudes = [-45, -20, 0, 20, 45];
  for (const lat of latitudes) {
    const phi = (lat * Math.PI) / 180;
    const ringRadius = R * Math.cos(phi) + 0.004;
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(ringRadius, lat === 0 ? 0.016 : 0.009, 12, 96),
      clayMaterial(THREE, lat === 0 ? PALETTE.graphite : PALETTE.clayDeep, 0.5)
    );
    ring.rotation.x = Math.PI / 2;
    ring.position.y = R * Math.sin(phi);
    group.add(ring);
  }

  // One meridian for readability.
  const meridian = new THREE.Mesh(
    new THREE.TorusGeometry(R + 0.004, 0.009, 12, 96),
    clayMaterial(THREE, PALETTE.clayDeep, 0.5)
  );
  group.add(meridian);

  // Route: Manila -> Hong Kong, lifted off the surface.
  const mnl = latLonToVec3(THREE, 14.6, 121.0, R);
  const hkg = latLonToVec3(THREE, 22.32, 114.17, R);
  const mid = mnl.clone().add(hkg).multiplyScalar(0.5).normalize().multiplyScalar(R + 0.5);
  const routeCurve = new THREE.QuadraticBezierCurve3(
    mnl.clone().multiplyScalar(1.01),
    mid,
    hkg.clone().multiplyScalar(1.01)
  );
  const route = new THREE.Mesh(
    new THREE.TubeGeometry(routeCurve, 48, 0.02, 8),
    clayMaterial(THREE, PALETTE.red, 0.45)
  );
  group.add(route);

  // Pins at both ends + the traveling dot.
  const pinGeometry = new THREE.SphereGeometry(0.055, 16, 16);
  const pinMaterial = clayMaterial(THREE, PALETTE.red, 0.4);
  for (const point of [mnl, hkg]) {
    const pin = new THREE.Mesh(pinGeometry, pinMaterial);
    pin.position.copy(point.clone().multiplyScalar(1.015));
    group.add(pin);
  }
  const traveler = new THREE.Mesh(new THREE.SphereGeometry(0.06, 16, 16), pinMaterial);
  group.add(traveler);

  // Sway around the route-facing angle so the MNL -> HKG arc stays in view.
  const ROUTE_FACING = -2.05;
  group.rotation.y = ROUTE_FACING;

  return (time) => {
    group.rotation.y = ROUTE_FACING + Math.sin(time * 0.12) * 0.85;
    const t = (Math.sin(time * 0.45) + 1) / 2; // ease back and forth MNL <-> HKG
    traveler.position.copy(routeCurve.getPoint(t));
  };
}

function buildGyro(THREE, group) {
  const core = new THREE.Mesh(
    new THREE.SphereGeometry(0.92, 48, 48),
    clayMaterial(THREE, PALETTE.clay)
  );
  group.add(core);

  // Seam ring on the core, echoing the globe's equator.
  const seam = new THREE.Mesh(
    new THREE.TorusGeometry(0.925, 0.014, 12, 96),
    clayMaterial(THREE, PALETTE.clayDeep, 0.5)
  );
  seam.rotation.x = Math.PI / 2;
  group.add(seam);

  const rings = [
    { radius: 1.72, tube: 0.05, color: PALETTE.graphite, axis: "x", speed: 0.42 },
    { radius: 1.42, tube: 0.038, color: PALETTE.clayDeep, axis: "y", speed: -0.58 },
    { radius: 1.14, tube: 0.03, color: PALETTE.red, axis: "z", speed: 0.85 },
  ];

  const restingTilts = [
    [0.55, 0.1, 0.15],
    [0.35, 0.4, 0.05],
    [0.7, 0.2, 0.35],
  ];
  const spinners = [];
  rings.forEach((spec, index) => {
    const holder = new THREE.Group();
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(spec.radius, spec.tube, 14, 100),
      clayMaterial(THREE, spec.color, 0.5)
    );
    holder.add(ring);
    // Staggered resting orientations so the rings read as a gyroscope.
    holder.rotation.set(...restingTilts[index]);
    group.add(holder);
    spinners.push({ holder, spec });
  });

  // The "lap" marker riding the outer ring.
  const lap = new THREE.Mesh(
    new THREE.SphereGeometry(0.075, 16, 16),
    clayMaterial(THREE, PALETTE.red, 0.4)
  );
  const outer = spinners[0];
  outer.holder.add(lap);

  return (time) => {
    for (const { holder, spec } of spinners) {
      holder.rotation[spec.axis] += spec.speed * 0.008;
      holder.rotation.y += 0.0011;
    }
    const a = time * 0.9;
    lap.position.set(Math.cos(a) * outer.spec.radius, Math.sin(a) * outer.spec.radius, 0);
  };
}

const SCENES = { globe: buildGlobe, gyro: buildGyro };

/* --- Bootstrap ------------------------------------------------------------ */

async function loadThree() {
  for (const url of THREE_CDN) {
    try {
      return await import(url);
    } catch {
      // try the next CDN
    }
  }
  return null;
}

function markFallback(porthole) {
  porthole.classList.add("hero3d--fallback");
  const canvas = porthole.querySelector(".hero3d__canvas");
  if (canvas) canvas.remove();
}

async function initPorthole(THREE, porthole) {
  const canvas = porthole.querySelector(".hero3d__canvas");
  const variant = porthole.dataset.scene;
  const build = SCENES[variant];
  if (!canvas || !build) {
    markFallback(porthole);
    return;
  }

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  } catch {
    markFallback(porthole);
    return;
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 30);
  camera.position.set(0, 0, 6.4);

  // Neumorphic light rig: sky/ground wash + key from the top-left, the same
  // direction the CSS --shadow-light highlight comes from.
  scene.add(new THREE.HemisphereLight(0xffffff, 0xb9c2d0, 1.15));
  const key = new THREE.DirectionalLight(0xffffff, 1.55);
  key.position.set(-4, 5, 6);
  scene.add(key);
  const fill = new THREE.DirectionalLight(0xdce5f2, 0.4);
  fill.position.set(4, -2, 4);
  scene.add(fill);

  const group = new THREE.Group();
  group.rotation.x = 0.32; // stylized axial tilt, shared by both variants
  scene.add(group);
  const animate = build(THREE, group);

  function resize() {
    const size = Math.round(porthole.getBoundingClientRect().width);
    if (size > 0) renderer.setSize(size, size, false);
  }
  resize();
  new ResizeObserver(resize).observe(porthole);

  if (REDUCED_MOTION) {
    // Final readable state, no motion: a single static frame.
    animate(2.4);
    renderer.render(scene, camera);
    return;
  }

  // Pointer parallax on the hero section (subtle, lerped).
  let targetX = 0;
  let targetY = 0;
  const hero = porthole.closest(".story-hero") || porthole;
  hero.addEventListener("pointermove", (event) => {
    const rect = hero.getBoundingClientRect();
    targetY = ((event.clientX - rect.left) / rect.width - 0.5) * 0.3;
    targetX = ((event.clientY - rect.top) / rect.height - 0.5) * 0.22;
  });
  hero.addEventListener("pointerleave", () => {
    targetX = 0;
    targetY = 0;
  });

  let visible = true;
  new IntersectionObserver(
    ([entry]) => {
      visible = entry.isIntersecting;
    },
    { threshold: 0.05 }
  ).observe(porthole);

  const start = performance.now();
  let parallaxX = 0;
  let parallaxY = 0;

  function frame(now) {
    requestAnimationFrame(frame);
    if (!visible || document.hidden) return;
    const time = (now - start) / 1000;
    parallaxX += (targetX - parallaxX) * 0.05;
    parallaxY += (targetY - parallaxY) * 0.05;
    animate(time);
    group.rotation.x = 0.32 + parallaxX;
    group.position.y = Math.sin(time * 0.8) * 0.05; // gentle float
    scene.rotation.y = parallaxY;
    renderer.render(scene, camera);
  }
  requestAnimationFrame(frame);
}

async function init() {
  const portholes = document.querySelectorAll(".hero3d[data-scene]");
  if (portholes.length === 0) return;

  const three = await loadThree();
  if (!three) {
    portholes.forEach(markFallback);
    return;
  }
  portholes.forEach((porthole) => initPorthole(three, porthole));
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
