import * as THREE from "./three-lite";

export type SkylineData = {
  heights: number[];
  /** 0 for no contributions, otherwise 0..1 relative to the busiest day. */
  intensity: number[];
  cols: number[];
  rows: number[];
};

export type SkylineOptions = SkylineData & {
  width: number;
  height: number;
  dpr: number;
  still: boolean;
  light: boolean;
};

export type Skyline = {
  pointer(x: number | null, y?: number): void;
  drag(dx: number, dy: number): void;
  release(): void;
  rise(): void;
  resize(width: number, height: number, dpr: number): void;
  theme(light: boolean): void;
  visible(v: boolean): void;
  dispose(): void;
};

/**
 * Colour ramp from a quiet day to the busiest one: blue, periwinkle, violet,
 * then warm amber at the top. Index 0 is for days with no contributions.
 */
const RAMP = {
  dark: ["#1d3557", "#2f5bd3", "#6d84ff", "#a77bff", "#f6c065"],
  light: ["#d3dcea", "#5a7ae6", "#3446c4", "#7a3fd1", "#c27a00"],
};
const BASE = { dark: "#0f243d", light: "#ffffff" };
const HOVER = { dark: "#ffffff", light: "#f6c065" };

type Raf = (cb: (t: number) => void) => number;

/**
 * A year of GitHub contributions as a 3D city: one building per day, height by
 * count. Works on a normal canvas or an OffscreenCanvas in a Web Worker.
 */
export function createSkyline(
  canvas: HTMLCanvasElement | OffscreenCanvas,
  o: SkylineOptions,
  onHover: (index: number | null) => void,
): Skyline {
  const raf: Raf =
    typeof requestAnimationFrame === "function"
      ? requestAnimationFrame
      : (cb) => setTimeout(() => cb(performance.now()), 16) as unknown as number;
  const caf = typeof cancelAnimationFrame === "function" ? cancelAnimationFrame : (id: number) => clearTimeout(id);

  const renderer = new THREE.WebGLRenderer({ canvas: canvas as HTMLCanvasElement, alpha: true, antialias: true });
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, 1, 0.5, 400);
  const group = new THREE.Group();
  scene.add(group);

  const n = o.heights.length;
  const cols = Math.max(...o.cols) + 1;
  const cx = (cols - 1) / 2;
  const cz = 3;

  // Lights: soft fill plus a key light from the front-left so faces read clearly.
  const ambient = new THREE.AmbientLight(0xffffff, 1.0);
  const key = new THREE.DirectionalLight(0xffffff, 1.6);
  key.position.set(-18, 40, 30);
  const rim = new THREE.DirectionalLight(0xa9b6ff, 0.6);
  rim.position.set(30, 20, -20);
  scene.add(ambient, key, rim);

  // Base plate.
  const baseMat = new THREE.MeshStandardMaterial({ roughness: 0.8, metalness: 0.05 });
  const base = new THREE.Mesh(new THREE.BoxGeometry(cols + 2, 0.8, 9), baseMat);
  base.position.set(0, -0.4, 0);
  group.add(base);

  // One instance per day. The box geometry is moved up so scaling grows it from the ground.
  const geo = new THREE.BoxGeometry(0.84, 1, 0.84);
  geo.translate(0, 0.5, 0);
  const mat = new THREE.MeshStandardMaterial({ roughness: 0.45, metalness: 0.15 });
  const mesh = new THREE.InstancedMesh(geo, mat, n);
  group.add(mesh);

  const m4 = new THREE.Matrix4();
  const color = new THREE.Color();
  let light = o.light;
  let hovered: number | null = null;

  const stops = { dark: RAMP.dark.map((c) => new THREE.Color(c)), light: RAMP.light.map((c) => new THREE.Color(c)) };
  const paint = () => {
    const ramp = stops[light ? "light" : "dark"];
    for (let i = 0; i < n; i++) {
      const t = o.intensity[i];
      if (i === hovered) color.set(HOVER[light ? "light" : "dark"]);
      else if (t <= 0) color.copy(ramp[0]);
      else {
        // Spread 0..1 over the four coloured stops.
        const x = Math.min(0.9999, t) * 3;
        const k = Math.floor(x);
        color.lerpColors(ramp[1 + k], ramp[2 + k], x - k);
      }
      mesh.setColorAt(i, color);
    }
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    baseMat.color.set(BASE[light ? "light" : "dark"]);
  };
  paint();

  // Rise-in: each week's buildings grow a little after the previous week's.
  let riseStart = o.still ? -Infinity : Infinity;
  const STAGGER = 18;
  const setHeights = (now: number) => {
    let done = true;
    for (let i = 0; i < n; i++) {
      const t = Math.min(1, Math.max(0, (now - riseStart - o.cols[i] * STAGGER) / 700));
      if (t < 1) done = false;
      const e = 1 - (1 - t) ** 3;
      const h = Math.max(0.001, o.heights[i] * e);
      m4.makeScale(1, h, 1);
      m4.setPosition(o.cols[i] - cx, 0, o.rows[i] - cz);
      mesh.setMatrixAt(i, m4);
    }
    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingSphere();
    return done;
  };
  setHeights(o.still ? Infinity : -Infinity);
  let rising = false;

  // Rotation: a slow sway until the visitor drags it, then momentum.
  const REST = { x: 0.55, y: -0.32 };
  const rot = { x: REST.x, y: REST.y, vx: 0, vy: 0, dragging: false, touched: false };
  group.rotation.set(rot.x, rot.y, 0);

  const resize = (w: number, h: number, dpr: number) => {
    renderer.setPixelRatio(Math.min(dpr, 2));
    renderer.setSize(Math.max(1, w), Math.max(1, h), false);
    camera.aspect = w / Math.max(1, h);
    // Back the camera off just far enough for the whole year to fit across.
    const halfWidth = (cols + 2) / 2;
    const hfov = 2 * Math.atan(Math.tan((camera.fov * Math.PI) / 360) * camera.aspect);
    const dist = (halfWidth / Math.tan(hfov / 2)) * 1.08 + 4;
    camera.position.set(0, 3, dist);
    camera.lookAt(0, -1.2, 0);
    camera.updateProjectionMatrix();
  };
  resize(o.width, o.height, o.dpr);

  const raycaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  let pointerAt: { x: number; y: number } | null = null;

  let isVisible = true;
  let frame = 0;
  const t0 = performance.now();
  const tick = (now: number) => {
    frame = raf(tick);
    if (!isVisible) return;
    if (rising && setHeights(now)) rising = false;

    if (!rot.dragging) {
      rot.vy *= 0.94;
      rot.vx *= 0.9;
      rot.y += rot.vy;
      rot.x += rot.vx;
      if (!rot.touched && !o.still) rot.y = REST.y + Math.sin((now - t0) / 6000) * 0.2;
    }
    rot.x = Math.max(0.12, Math.min(1.25, rot.x));
    group.rotation.set(rot.x, rot.y, 0);

    if (pointerAt) {
      ndc.set(pointerAt.x, pointerAt.y);
      raycaster.setFromCamera(ndc, camera);
      const hit = raycaster.intersectObject(mesh, false)[0];
      const id = hit?.instanceId ?? null;
      if (id !== hovered) {
        hovered = id;
        paint();
        onHover(id);
      }
    }
    renderer.render(scene, camera);
  };
  frame = raf(tick);

  return {
    pointer(x, y) {
      if (x === null || y === undefined) {
        pointerAt = null;
        if (hovered !== null) {
          hovered = null;
          paint();
          onHover(null);
        }
        return;
      }
      pointerAt = { x, y };
    },
    drag(dx, dy) {
      rot.dragging = true;
      rot.touched = true;
      rot.y += dx;
      rot.x += dy;
      rot.vy = dx;
      rot.vx = dy * 0.4;
    },
    release() {
      rot.dragging = false;
      rot.vy = Math.max(-0.1, Math.min(0.1, rot.vy));
    },
    rise() {
      if (o.still || rising || riseStart !== Infinity) return;
      riseStart = performance.now();
      rising = true;
    },
    resize,
    theme(l) {
      light = l;
      paint();
    },
    visible(v) {
      isVisible = v;
    },
    dispose() {
      caf(frame);
      geo.dispose();
      mat.dispose();
      baseMat.dispose();
      renderer.dispose();
    },
  };
}
