/**
 * Point clouds for the 3D object. Every shape has exactly `n` points so the
 * object can morph point-for-point from one to another. Pure and seeded, so it
 * renders the same every time and can be unit tested.
 */

export type ShapeId = "core" | "fullstack" | "ai" | "blockchain" | "security";
export const SHAPES: ShapeId[] = ["core", "fullstack", "ai", "blockchain", "security"];

type Rng = () => number;
type Vec = [number, number, number];

/** Mulberry32: tiny, fast, good enough for scattering points. */
export function rng(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

class Builder {
  readonly out: Float32Array;
  private i = 0;
  constructor(
    readonly n: number,
    readonly r: Rng,
  ) {
    this.out = new Float32Array(n * 3);
  }
  get left() {
    return this.n - this.i;
  }
  push(x: number, y: number, z: number) {
    if (this.i >= this.n) return;
    this.out[this.i * 3] = x;
    this.out[this.i * 3 + 1] = y;
    this.out[this.i * 3 + 2] = z;
    this.i++;
  }
  /** Points along a straight segment. */
  line(a: Vec, b: Vec, count: number, jitter = 0.008) {
    for (let k = 0; k < count; k++) {
      const t = this.r();
      const j = () => (this.r() - 0.5) * jitter;
      this.push(a[0] + (b[0] - a[0]) * t + j(), a[1] + (b[1] - a[1]) * t + j(), a[2] + (b[2] - a[2]) * t + j());
    }
  }
  /** Points on the surface of a small sphere. */
  ball(c: Vec, radius: number, count: number) {
    for (let k = 0; k < count; k++) {
      const u = this.r() * 2 - 1;
      const th = this.r() * Math.PI * 2;
      const s = Math.sqrt(1 - u * u);
      this.push(c[0] + radius * s * Math.cos(th), c[1] + radius * s * Math.sin(th), c[2] + radius * u);
    }
  }
  /** Points filling an axis-aligned rectangle on the plane z. */
  rect(x0: number, y0: number, x1: number, y1: number, z: number, count: number) {
    for (let k = 0; k < count; k++) this.push(x0 + (x1 - x0) * this.r(), y0 + (y1 - y0) * this.r(), z);
  }
  /** Rectangle outline. */
  frame(x0: number, y0: number, x1: number, y1: number, z: number, count: number) {
    const w = x1 - x0;
    const h = y1 - y0;
    const per = count / (2 * (w + h));
    this.line([x0, y0, z], [x1, y0, z], Math.round(per * w));
    this.line([x0, y1, z], [x1, y1, z], Math.round(per * w));
    this.line([x0, y0, z], [x0, y1, z], Math.round(per * h));
    this.line([x1, y0, z], [x1, y1, z], Math.round(per * h));
  }
  /** Spread any points that are left over along a fallback so the count is exact. */
  fill(f: (b: Builder) => void) {
    while (this.left > 0) f(this);
  }
}

function core(b: Builder) {
  // A sphere, plus a few points inside for depth.
  const surface = Math.floor(b.n * 0.82);
  const golden = Math.PI * (3 - Math.sqrt(5));
  for (let k = 0; k < surface; k++) {
    const y = 1 - (k / (surface - 1)) * 2;
    const rad = Math.sqrt(1 - y * y);
    const th = golden * k;
    const r = 1.35 + (b.r() - 0.5) * 0.04;
    b.push(Math.cos(th) * rad * r, y * r, Math.sin(th) * rad * r);
  }
  b.fill((x) => x.ball([0, 0, 0], 0.35 + x.r() * 0.8, 1));
}

function fullstack(b: Builder) {
  // A browser window: frame, tab bar, address bar, sidebar, text and a button.
  const n = b.n;
  b.frame(-1.6, -1.05, 1.6, 1.05, 0, Math.round(n * 0.2));
  b.line([-1.6, 0.72, 0], [1.6, 0.72, 0], Math.round(n * 0.05));
  for (const x of [-1.42, -1.28, -1.14]) b.ball([x, 0.89, 0], 0.045, Math.round(n * 0.012));
  b.frame(-0.85, 0.82, 1.35, 0.96, 0, Math.round(n * 0.05));
  b.rect(-1.5, -0.95, -0.85, 0.6, 0.12, Math.round(n * 0.12));
  for (let row = 0; row < 7; row++) {
    const y = 0.48 - row * 0.2;
    const len = row === 0 ? 1.4 : 0.6 + ((row * 37) % 10) / 10;
    b.line([-0.65, y, 0.2], [-0.65 + len, y, 0.2], Math.round(n * (row === 0 ? 0.06 : 0.035)), 0.02);
  }
  b.rect(0.55, -0.88, 1.35, -0.62, 0.32, Math.round(n * 0.06));
  b.fill((x) => x.rect(-1.6, -1.05, 1.6, 1.05, -0.05, 1));
}

function ai(b: Builder) {
  // A small neural network: 4 layers of nodes, every node linked to the next layer.
  const layers = [4, 6, 6, 3];
  const xs = [-1.65, -0.55, 0.55, 1.65];
  const nodes: Vec[][] = layers.map((count, l) =>
    Array.from({ length: count }, (_, k) => {
      const y = (k - (count - 1) / 2) * 0.42;
      const z = Math.sin(k * 1.7 + l) * 0.45;
      return [xs[l], y, z] as Vec;
    }),
  );
  const nodePts = Math.round((b.n * 0.42) / nodes.flat().length);
  for (const layer of nodes) for (const c of layer) b.ball(c, 0.1, nodePts);
  const edges: [Vec, Vec][] = [];
  for (let l = 0; l < nodes.length - 1; l++) for (const a of nodes[l]) for (const c of nodes[l + 1]) edges.push([a, c]);
  const per = Math.floor(b.left / edges.length);
  for (const [a, c] of edges) b.line(a, c, per, 0.01);
  b.fill((x) => {
    const [a, c] = edges[Math.floor(x.r() * edges.length)];
    x.line(a, c, 1, 0.01);
  });
}

function cubeEdges(c: Vec, s: number): [Vec, Vec][] {
  const h = s / 2;
  const v = (dx: number, dy: number, dz: number): Vec => [c[0] + dx * h, c[1] + dy * h, c[2] + dz * h];
  const out: [Vec, Vec][] = [];
  for (const a of [-1, 1])
    for (const d of [-1, 1]) {
      out.push([v(-1, a, d), v(1, a, d)], [v(a, -1, d), v(a, 1, d)], [v(a, d, -1), v(a, d, 1)]);
    }
  return out;
}

function blockchain(b: Builder) {
  // Three blocks linked in a row, slightly staggered in depth.
  const centers: Vec[] = [
    [-1.3, -0.15, -0.2],
    [0, 0.15, 0.15],
    [1.3, -0.15, -0.2],
  ];
  const size = 0.82;
  const edgePts = Math.round((b.n * 0.62) / (centers.length * 12));
  for (const c of centers) for (const [a, d] of cubeEdges(c, size)) b.line(a, d, edgePts);
  for (let k = 0; k < centers.length - 1; k++) {
    const a = centers[k];
    const d = centers[k + 1];
    b.line([a[0] + size / 2, a[1], a[2]], [d[0] - size / 2, d[1], d[2]], Math.round(b.n * 0.04), 0.02);
  }
  // A faint fill inside each block.
  b.fill((x) => {
    const c = centers[Math.floor(x.r() * centers.length)];
    const h = size / 2;
    x.push(c[0] + (x.r() * 2 - 1) * h, c[1] + (x.r() * 2 - 1) * h, c[2] + (x.r() * 2 - 1) * h);
  });
}

/** Is (x, y) inside the shield outline? */
export function inShield(x: number, y: number): boolean {
  if (y > 1.1 || y < -1.35) return false;
  const top = 1.1 - 0.12 * (x * x);
  if (y > top) return false;
  if (y >= -0.15) return Math.abs(x) <= 1.0;
  const t = (y + 1.35) / 1.2; // 0 at the tip, 1 where the sides start curving
  return Math.abs(x) <= 1.0 * Math.sqrt(Math.max(0, t));
}

function inKeyhole(x: number, y: number): boolean {
  const cy = 0.18;
  if (x * x + (y - cy) ** 2 < 0.2 * 0.2) return true;
  return y < cy && y > -0.48 && Math.abs(x) < 0.08 + (cy - y) * 0.12;
}

function security(b: Builder) {
  // A shield: a bright rim on both faces, a thin body, and a keyhole drawn as an outline.
  const rim = Math.round(b.n * 0.42);
  let placed = 0;
  while (placed < rim) {
    const x = (b.r() * 2 - 1) * 1.02;
    const y = -1.36 + b.r() * 2.48;
    if (inShield(x, y) && !inShield(x * 1.07, (y + 0.1) * 1.06 - 0.1)) {
      b.push(x, y, (b.r() < 0.5 ? 1 : -1) * 0.06);
      placed++;
    }
  }
  // Keyhole outline: a ring and a tapered slot.
  const key = Math.round(b.n * 0.12);
  for (let k = 0; k < key * 0.6; k++) {
    const a = b.r() * Math.PI * 2;
    b.push(Math.cos(a) * 0.21, 0.18 + Math.sin(a) * 0.21, 0.1);
  }
  b.line([-0.09, 0.0, 0.1], [-0.15, -0.5, 0.1], Math.round(key * 0.15));
  b.line([0.09, 0.0, 0.1], [0.15, -0.5, 0.1], Math.round(key * 0.15));
  b.line([-0.15, -0.5, 0.1], [0.15, -0.5, 0.1], Math.round(key * 0.1));
  b.fill((x) => {
    const px = (x.r() * 2 - 1) * 1.0;
    const py = -1.35 + x.r() * 2.45;
    if (inShield(px, py) && !inKeyhole(px, py)) {
      const bulge = 0.08 * (1 - px * px);
      x.push(px, py, (x.r() < 0.5 ? 1 : -1) * bulge);
    }
  });
}

const BUILDERS: Record<ShapeId, (b: Builder) => void> = { core, fullstack, ai, blockchain, security };

export function buildShape(id: ShapeId, n: number, seed = 7): Float32Array {
  const b = new Builder(n, rng(seed + SHAPES.indexOf(id) * 101));
  BUILDERS[id](b);
  return b.out;
}
