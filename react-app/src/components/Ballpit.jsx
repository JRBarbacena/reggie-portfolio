import { useEffect, useRef } from "react";
import {
  ACESFilmicToneMapping,
  AmbientLight,
  Color,
  InstancedMesh,
  MathUtils,
  MeshPhysicalMaterial,
  Object3D,
  PerspectiveCamera,
  Plane,
  PMREMGenerator,
  PointLight,
  Raycaster,
  Scene,
  SphereGeometry,
  SRGBColorSpace,
  Timer,
  Vector2,
  Vector3,
  WebGLRenderer,
} from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";

const DEFAULTS = {
  count: 50,
  colors: [0xd5001c, 0xffffff, 0x15151e],
  ambientColor: 0xffffff,
  ambientIntensity: 1,
  lightIntensity: 180,
  materialParams: {
    metalness: 0.18,
    roughness: 0.28,
    clearcoat: 1,
    clearcoatRoughness: 0.12,
  },
  minSize: 0.28,
  maxSize: 0.72,
  size0: 0.7,
  gravity: 0,
  friction: 0.9975,
  wallBounce: 0.55,
  maxVelocity: 0.1,
  maxX: 5,
  maxY: 5,
  maxZ: 2,
  controlSphere0: false,
  followCursor: false,
  showCursorBall: false,
};

const tempPosition = new Vector3();
const tempVelocity = new Vector3();
const otherPosition = new Vector3();
const otherVelocity = new Vector3();
const difference = new Vector3();
const correction = new Vector3();
const firstImpulse = new Vector3();
const secondImpulse = new Vector3();
const instanceObject = new Object3D();

class BallPhysics {
  constructor(config) {
    this.config = config;
    this.center = new Vector3();
    this.positionData = new Float32Array(config.count * 3);
    this.velocityData = new Float32Array(config.count * 3);
    this.sizeData = new Float32Array(config.count);
    this.reset();
  }

  reset() {
    const { config, positionData, velocityData } = this;
    this.center.toArray(positionData, 0);
    for (let index = 1; index < config.count; index += 1) {
      const offset = index * 3;
      positionData[offset] = MathUtils.randFloatSpread(config.maxX * 2);
      positionData[offset + 1] = MathUtils.randFloatSpread(config.maxY * 2);
      positionData[offset + 2] = MathUtils.randFloatSpread(config.maxZ * 2);
      velocityData[offset] = MathUtils.randFloatSpread(config.maxVelocity * 0.45);
      velocityData[offset + 1] = MathUtils.randFloatSpread(config.maxVelocity * 0.45);
      velocityData[offset + 2] = MathUtils.randFloatSpread(config.maxVelocity * 0.3);
    }
    this.setSizes();
  }

  setSizes() {
    this.sizeData[0] = this.config.size0;
    for (let index = 1; index < this.config.count; index += 1) {
      this.sizeData[index] = MathUtils.randFloat(this.config.minSize, this.config.maxSize);
    }
  }

  maintainMotion() {
    if (this.config.gravity !== 0) return;
    const minimumSpeed = this.config.maxVelocity * 0.18;
    const minimumSpeedSquared = minimumSpeed * minimumSpeed;

    for (let index = 1; index < this.config.count; index += 1) {
      const offset = index * 3;
      tempVelocity.fromArray(this.velocityData, offset);
      if (tempVelocity.lengthSq() >= minimumSpeedSquared) continue;
      if (tempVelocity.lengthSq() < Number.EPSILON) {
        tempVelocity.set(
          MathUtils.randFloatSpread(1),
          MathUtils.randFloatSpread(1),
          MathUtils.randFloatSpread(0.6),
        );
      }
      tempVelocity.normalize().multiplyScalar(MathUtils.randFloat(minimumSpeed, minimumSpeed * 1.45));
      tempVelocity.toArray(this.velocityData, offset);
    }
  }

  update(frame) {
    const { config, positionData, velocityData, sizeData } = this;
    const startIndex = 1;

    if (config.controlSphere0) {
      tempPosition.fromArray(positionData, 0).lerp(this.center, 0.1).toArray(positionData, 0);
      tempVelocity.set(0, 0, 0).toArray(velocityData, 0);
    }

    for (let index = startIndex; index < config.count; index += 1) {
      const offset = index * 3;
      tempPosition.fromArray(positionData, offset);
      tempVelocity.fromArray(velocityData, offset);
      tempVelocity.y -= frame.delta * config.gravity * sizeData[index];
      tempVelocity.multiplyScalar(config.friction).clampLength(0, config.maxVelocity);
      tempPosition.add(tempVelocity);
      tempPosition.toArray(positionData, offset);
      tempVelocity.toArray(velocityData, offset);
    }

    for (let index = startIndex; index < config.count; index += 1) {
      const offset = index * 3;
      tempPosition.fromArray(positionData, offset);
      tempVelocity.fromArray(velocityData, offset);
      const radius = sizeData[index];

      for (let otherIndex = index + 1; otherIndex < config.count; otherIndex += 1) {
        const otherOffset = otherIndex * 3;
        otherPosition.fromArray(positionData, otherOffset);
        otherVelocity.fromArray(velocityData, otherOffset);
        const sumRadius = radius + sizeData[otherIndex];
        difference.copy(otherPosition).sub(tempPosition);
        const distance = difference.length();
        if (distance > 0 && distance < sumRadius) {
          correction.copy(difference).normalize().multiplyScalar((sumRadius - distance) * 0.5);
          firstImpulse.copy(correction).multiplyScalar(Math.max(tempVelocity.length(), 1));
          secondImpulse.copy(correction).multiplyScalar(Math.max(otherVelocity.length(), 1));
          tempPosition.sub(correction);
          tempVelocity.sub(firstImpulse);
          otherPosition.add(correction);
          otherVelocity.add(secondImpulse);
          otherPosition.toArray(positionData, otherOffset);
          otherVelocity.toArray(velocityData, otherOffset);
        }
      }

      if (config.controlSphere0) {
        otherPosition.fromArray(positionData, 0);
        difference.copy(otherPosition).sub(tempPosition);
        const distance = difference.length();
        const sumRadius = radius + sizeData[0];
        if (distance > 0 && distance < sumRadius) {
          correction.copy(difference).normalize().multiplyScalar(sumRadius - distance);
          tempPosition.sub(correction);
          tempVelocity.sub(correction.multiplyScalar(Math.max(tempVelocity.length(), 2)));
        }
      }

      if (Math.abs(tempPosition.x) + radius > config.maxX) {
        tempPosition.x = Math.sign(tempPosition.x) * (config.maxX - radius);
        tempVelocity.x *= -config.wallBounce;
      }
      if (config.gravity === 0 && Math.abs(tempPosition.y) + radius > config.maxY) {
        tempPosition.y = Math.sign(tempPosition.y) * (config.maxY - radius);
        tempVelocity.y *= -config.wallBounce;
      } else if (config.gravity !== 0 && tempPosition.y - radius < -config.maxY) {
        tempPosition.y = -config.maxY + radius;
        tempVelocity.y *= -config.wallBounce;
      }
      const zBoundary = Math.max(config.maxZ, config.maxSize);
      if (Math.abs(tempPosition.z) + radius > zBoundary) {
        tempPosition.z = Math.sign(tempPosition.z) * (config.maxZ - radius);
        tempVelocity.z *= -config.wallBounce;
      }
      tempPosition.toArray(positionData, offset);
      tempVelocity.toArray(velocityData, offset);
    }

    this.maintainMotion();
  }
}

function gradientColor(colors, ratio, target = new Color()) {
  const palette = colors.map((value) => new Color(value));
  const scaled = MathUtils.clamp(ratio, 0, 1) * (palette.length - 1);
  const index = Math.floor(scaled);
  if (index >= palette.length - 1) return target.copy(palette.at(-1));
  return target.copy(palette[index]).lerp(palette[index + 1], scaled - index);
}

class BallInstances extends InstancedMesh {
  constructor(renderer, options = {}) {
    const config = { ...DEFAULTS, ...options };
    const room = new RoomEnvironment();
    const pmrem = new PMREMGenerator(renderer);
    const environment = pmrem.fromScene(room, 0.04).texture;
    room.dispose();
    pmrem.dispose();
    const geometry = new SphereGeometry(1, 32, 24);
    const material = new MeshPhysicalMaterial({ envMap: environment, ...config.materialParams });
    material.envMapRotation.x = -Math.PI / 2;
    super(geometry, material, config.count);
    this.config = config;
    this.environment = environment;
    this.physics = new BallPhysics(config);
    this.ambientLight = new AmbientLight(config.ambientColor, config.ambientIntensity);
    this.light = new PointLight(config.colors[0], config.lightIntensity);
    this.add(this.ambientLight, this.light);
    this.setColors(config.colors);
  }

  setColors(colors) {
    if (!Array.isArray(colors) || colors.length < 2) return;
    const color = new Color();
    for (let index = 0; index < this.count; index += 1) {
      this.setColorAt(index, gradientColor(colors, index / Math.max(1, this.count - 1), color));
      if (index === 0) this.light.color.copy(color);
    }
    if (this.instanceColor) this.instanceColor.needsUpdate = true;
  }

  update(frame) {
    this.physics.update(frame);
    for (let index = 0; index < this.count; index += 1) {
      instanceObject.position.fromArray(this.physics.positionData, index * 3);
      instanceObject.scale.setScalar(index === 0 && !this.config.showCursorBall ? 0 : this.physics.sizeData[index]);
      instanceObject.updateMatrix();
      this.setMatrixAt(index, instanceObject.matrix);
      if (index === 0) this.light.position.copy(instanceObject.position);
    }
    this.instanceMatrix.needsUpdate = true;
  }

  disposeResources() {
    this.geometry.dispose();
    this.material.dispose();
    this.environment.dispose();
  }
}

function createBallpit(canvas, options = {}) {
  const renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "high-performance" });
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
  const scene = new Scene();
  const camera = new PerspectiveCamera(50, 1, 0.1, 100);
  camera.position.set(0, 0, 20);
  const timer = new Timer();
  let spheres = new BallInstances(renderer, options);
  scene.add(spheres);
  let frameId = 0;
  let running = false;
  let disposed = false;
  let intersecting = true;
  let scrollFrameId = 0;

  const resize = () => {
    const width = Math.max(1, canvas.parentElement?.clientWidth ?? canvas.clientWidth);
    const height = Math.max(1, canvas.parentElement?.clientHeight ?? canvas.clientHeight);
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.fov = camera.aspect > 1.5 ? 50 : 2 * MathUtils.radToDeg(Math.atan(Math.tan(MathUtils.degToRad(25)) / (camera.aspect / 1.5)));
    camera.updateProjectionMatrix();
    const worldHeight = 2 * Math.tan(MathUtils.degToRad(camera.fov / 2)) * camera.position.length();
    spheres.config.maxX = (worldHeight * camera.aspect) / 2;
    spheres.config.maxY = worldHeight / 2;
  };

  const renderFrame = () => {
    if (!running || disposed) return;
    frameId = requestAnimationFrame(renderFrame);
    timer.update();
    spheres.update({ delta: Math.min(timer.getDelta(), 1 / 30), elapsed: timer.getElapsed() });
    renderer.render(scene, camera);
  };
  const start = () => {
    if (running || disposed) return;
    running = true;
    canvas.dataset.animationState = "running";
    spheres.physics.maintainMotion();
    timer.reset();
    renderFrame();
  };
  const stop = () => {
    running = false;
    cancelAnimationFrame(frameId);
    frameId = 0;
    if (!disposed) canvas.dataset.animationState = "paused";
  };

  const syncVisibility = () => {
    if (disposed) return;
    const bounds = canvas.getBoundingClientRect();
    intersecting = bounds.bottom > 0
      && bounds.right > 0
      && bounds.top < window.innerHeight
      && bounds.left < window.innerWidth;
    if (intersecting && !document.hidden) start(); else stop();
  };

  const scheduleVisibilitySync = () => {
    if (scrollFrameId || disposed) return;
    scrollFrameId = requestAnimationFrame(() => {
      scrollFrameId = 0;
      syncVisibility();
    });
  };

  const resizeObserver = "ResizeObserver" in window ? new ResizeObserver(resize) : null;
  resizeObserver?.observe(canvas.parentElement ?? canvas);
  const intersectionObserver = new IntersectionObserver(([entry]) => {
    intersecting = entry.isIntersecting;
    if (intersecting && !document.hidden) start(); else stop();
  }, { threshold: 0.01 });
  intersectionObserver.observe(canvas);
  const onVisibilityChange = () => {
    if (document.hidden) stop(); else syncVisibility();
  };
  document.addEventListener("visibilitychange", onVisibilityChange);
  window.addEventListener("pageshow", syncVisibility);
  window.addEventListener("focus", syncVisibility);
  window.addEventListener("scroll", scheduleVisibilitySync, { passive: true });

  const pointer = new Vector2();
  const raycaster = new Raycaster();
  const plane = new Plane(new Vector3(0, 0, 1), 0);
  const hit = new Vector3();
  const onPointerMove = (event) => {
    if (!spheres.config.followCursor) return;
    const bounds = canvas.getBoundingClientRect();
    const inside = event.clientX >= bounds.left && event.clientX <= bounds.right
      && event.clientY >= bounds.top && event.clientY <= bounds.bottom;
    if (!inside) {
      spheres.config.controlSphere0 = false;
      return;
    }
    pointer.set(((event.clientX - bounds.left) / bounds.width) * 2 - 1, -(((event.clientY - bounds.top) / bounds.height) * 2 - 1));
    raycaster.setFromCamera(pointer, camera);
    camera.getWorldDirection(plane.normal);
    raycaster.ray.intersectPlane(plane, hit);
    spheres.physics.center.copy(hit);
    spheres.config.controlSphere0 = true;
  };
  const onPointerLeave = () => { spheres.config.controlSphere0 = false; };
  window.addEventListener("pointermove", onPointerMove, { passive: true });
  document.documentElement.addEventListener("pointerleave", onPointerLeave);
  resize();
  start();

  return {
    updateConfig(next) {
      if (next.count !== undefined && next.count !== spheres.config.count) {
        scene.remove(spheres);
        spheres.disposeResources();
        spheres = new BallInstances(renderer, { ...spheres.config, ...next });
        scene.add(spheres);
        resize();
        return;
      }
      Object.assign(spheres.config, next);
      if (next.colors) spheres.setColors(next.colors);
      if (next.minSize !== undefined || next.maxSize !== undefined || next.size0 !== undefined) spheres.physics.setSizes();
    },
    dispose() {
      disposed = true;
      stop();
      canvas.dataset.animationState = "disposed";
      cancelAnimationFrame(scrollFrameId);
      resizeObserver?.disconnect();
      intersectionObserver.disconnect();
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("pageshow", syncVisibility);
      window.removeEventListener("focus", syncVisibility);
      window.removeEventListener("scroll", scheduleVisibilitySync);
      window.removeEventListener("pointermove", onPointerMove);
      document.documentElement.removeEventListener("pointerleave", onPointerLeave);
      spheres.disposeResources();
      scene.clear();
      timer.dispose();
      renderer.dispose();
    },
  };
}

export default function Ballpit({ className = "", followCursor = true, ...props }) {
  const canvasRef = useRef(null);
  const instanceRef = useRef(null);
  const firstRenderRef = useRef(true);
  const currentConfigRef = useRef({ followCursor, ...props });
  currentConfigRef.current = { followCursor, ...props };
  const configSignature = JSON.stringify(currentConfigRef.current);

  useEffect(() => {
    if (!canvasRef.current) return undefined;
    instanceRef.current = createBallpit(canvasRef.current, { followCursor, ...props });
    return () => {
      instanceRef.current?.dispose();
      instanceRef.current = null;
    };
    // The second effect updates mutable options without rebuilding WebGL.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (firstRenderRef.current) {
      firstRenderRef.current = false;
      return;
    }
    instanceRef.current?.updateConfig(currentConfigRef.current);
  }, [configSignature]);

  return (
    <canvas
      className={className}
      ref={canvasRef}
      aria-hidden="true"
      data-ball-count={props.count ?? DEFAULTS.count}
      data-follow-cursor={followCursor}
    />
  );
}
