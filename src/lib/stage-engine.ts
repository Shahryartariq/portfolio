import * as THREE from "./three-lite";
import { buildShape, type ShapeId } from "./shapes";

/** Dark theme colours (additive glow) and light theme colours (solid). */
const COLORS: Record<ShapeId, { dark: string; light: string }> = {
  core: { dark: "#a9b6ff", light: "#2f43c7" },
  fullstack: { dark: "#7fb0ff", light: "#1650b8" },
  ai: { dark: "#c9a2ff", light: "#6630b8" },
  blockchain: { dark: "#f6c065", light: "#a86a00" },
  security: { dark: "#55e0c6", light: "#08806f" },
};
const CORE_MIX: ShapeId[] = ["fullstack", "ai", "blockchain", "security"];
const MORPH_MS = 1300;

export type EngineOptions = {
  width: number;
  height: number;
  dpr: number;
  small: boolean;
  still: boolean;
  light: boolean;
};

export type Engine = {
  setShape(id: ShapeId): void;
  resize(width: number, height: number, dpr: number): void;
  tilt(x: number, y: number): void;
  theme(light: boolean): void;
  visible(v: boolean): void;
  dispose(): void;
};

function hexToRgb(hex: string): [number, number, number] {
  const v = parseInt(hex.slice(1), 16);
  return [((v >> 16) & 255) / 255, ((v >> 8) & 255) / 255, (v & 255) / 255];
}

function easeInOut(t: number) {
  return t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;
}

type Raf = (cb: (t: number) => void) => number;

/**
 * The 3D object: a cloud of points that morphs between shapes. Works on a
 * normal canvas or an OffscreenCanvas inside a Web Worker.
 */
export function createEngine(canvas: HTMLCanvasElement | OffscreenCanvas, o: EngineOptions): Engine {
  const raf: Raf =
    typeof requestAnimationFrame === "function" ? requestAnimationFrame : (cb) => setTimeout(() => cb(performance.now()), 16) as unknown as number;
  const caf = typeof cancelAnimationFrame === "function" ? cancelAnimationFrame : (id: number) => clearTimeout(id);

  const renderer = new THREE.WebGLRenderer({
    canvas: canvas as HTMLCanvasElement,
    alpha: true,
    antialias: false,
    powerPreference: "low-power",
  });
  const N = o.small ? 2600 : 4200;
  const shapes: Partial<Record<ShapeId, Float32Array>> = {};
  const shapeOf = (id: ShapeId) => (shapes[id] ??= buildShape(id, N));

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 50);
  camera.position.set(0, 0, 7);
  const group = new THREE.Group();
  scene.add(group);

  const positions = new Float32Array(shapeOf("core"));
  const colors = new Float32Array(N * 3);
  const seeds = new Float32Array(N);
  for (let i = 0; i < N; i++) seeds[i] = Math.random();

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  geometry.setAttribute("seed", new THREE.BufferAttribute(seeds, 1));

  const material = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    vertexColors: true,
    uniforms: {
      uSize: { value: o.small ? 34 : 30 },
      uPixel: { value: Math.min(o.dpr, 2) },
      uTime: { value: 0 },
      uAlpha: { value: 0.9 },
    },
    vertexShader: `
      attribute float seed;
      varying vec3 vColor;
      varying float vTwinkle;
      uniform float uSize;
      uniform float uPixel;
      uniform float uTime;
      void main() {
        vColor = color;
        vTwinkle = 0.65 + 0.35 * sin(uTime * 1.6 + seed * 40.0);
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        gl_Position = projectionMatrix * mv;
        gl_PointSize = uSize * uPixel * (0.55 + seed * 0.6) / -mv.z;
      }`,
    fragmentShader: `
      varying vec3 vColor;
      varying float vTwinkle;
      uniform float uAlpha;
      void main() {
        float d = length(gl_PointCoord - 0.5);
        if (d > 0.5) discard;
        float a = smoothstep(0.5, 0.05, d);
        gl_FragColor = vec4(vColor, a * uAlpha * vTwinkle);
      }`,
  });
  group.add(new THREE.Points(geometry, material));

  let light = o.light;
  const fillColors = (id: ShapeId, arr: Float32Array) => {
    for (let i = 0; i < N; i++) {
      const key = id === "core" ? CORE_MIX[i % 4] : id;
      arr.set(hexToRgb(COLORS[key][light ? "light" : "dark"]), i * 3);
    }
  };
  const applyBlending = () => {
    material.blending = light ? THREE.NormalBlending : THREE.AdditiveBlending;
    material.uniforms.uAlpha.value = light ? 0.85 : 0.9;
    material.needsUpdate = true;
  };
  applyBlending();
  fillColors("core", colors);

  let from = new Float32Array(positions);
  let to = shapeOf("core");
  let fromColors = new Float32Array(colors);
  let toColors = new Float32Array(colors);
  let current: ShapeId = "core";
  let morphStart = -Infinity;
  let spin = 0;
  let dirty = false;
  let isVisible = true;
  const tiltTarget = { x: 0, y: 0 };

  const resize = (w: number, h: number, dpr: number) => {
    renderer.setPixelRatio(Math.min(dpr, 2));
    renderer.setSize(Math.max(1, w), Math.max(1, h), false);
    camera.aspect = w / Math.max(1, h);
    camera.position.z = w / h < 0.9 ? 8.6 : 7;
    camera.updateProjectionMatrix();
  };
  resize(o.width, o.height, o.dpr);

  const t0 = performance.now();
  let frame = 0;
  const tick = (now: number) => {
    frame = raf(tick);
    if (!isVisible) return;
    const p = o.still ? 1 : Math.min(1, (now - morphStart) / MORPH_MS);
    const e = easeInOut(p);
    const time = (now - t0) / 1000;
    if (p < 1 || !o.still || dirty) {
      for (let i = 0; i < N * 3; i++) positions[i] = from[i] + (to[i] - from[i]) * e;
      if (!o.still) {
        // A gentle drift so the shape feels alive.
        for (let i = 0; i < N; i++) {
          const s = seeds[i] * 6.283;
          positions[i * 3 + 1] += Math.sin(time * 0.9 + s) * 0.012;
          positions[i * 3 + 2] += Math.cos(time * 0.7 + s) * 0.012;
        }
      }
      geometry.attributes.position.needsUpdate = true;
    }
    if (p < 1) {
      for (let i = 0; i < N * 3; i++) colors[i] = fromColors[i] + (toColors[i] - fromColors[i]) * e;
      geometry.attributes.color.needsUpdate = true;
    } else if (dirty) {
      colors.set(toColors);
      geometry.attributes.color.needsUpdate = true;
    }
    if (p >= 1) dirty = false;
    if (!o.still) {
      spin *= 0.96;
      group.rotation.y += 0.0032 + spin * 0.05;
      group.rotation.x += (tiltTarget.x - group.rotation.x) * 0.04;
      group.rotation.z += (-tiltTarget.y * 0.2 - group.rotation.z) * 0.04;
    }
    material.uniforms.uTime.value = o.still ? 0 : time;
    renderer.render(scene, camera);
  };
  renderer.render(scene, camera);
  frame = raf(tick);

  return {
    setShape(id) {
      if (id === current) return;
      from = new Float32Array(positions);
      fromColors = new Float32Array(colors);
      to = shapeOf(id);
      toColors = new Float32Array(N * 3);
      fillColors(id, toColors);
      current = id;
      morphStart = performance.now();
      spin = o.still ? 0 : 1;
      dirty = true;
    },
    resize,
    tilt(x, y) {
      tiltTarget.x = x;
      tiltTarget.y = y;
    },
    theme(l) {
      light = l;
      applyBlending();
      fillColors(current, toColors);
      if (performance.now() - morphStart > MORPH_MS) colors.set(toColors);
      geometry.attributes.color.needsUpdate = true;
      dirty = true;
    },
    visible(v) {
      isVisible = v;
    },
    dispose() {
      caf(frame);
      geometry.dispose();
      material.dispose();
      renderer.dispose();
    },
  };
}
