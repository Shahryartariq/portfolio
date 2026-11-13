import { AREA_LABEL, type Area } from "@/data/disciplines";
import { rng } from "./shapes";

export type NodeKind = "area" | "work" | "skill";

export type GNode = {
  id: string;
  label: string;
  kind: NodeKind;
  /** Colour group: the area itself, or a work item's first area. Skills have none. */
  area?: Area;
  href?: string;
  x: number;
  y: number;
  z: number;
  /** Indexes of directly connected nodes. */
  links: number[];
};

export type Graph = { nodes: GNode[]; edges: [number, number][] };

export type WorkInput = { id: string; label: string; areas: Area[]; stack: string[]; href?: string };

const AREAS: Area[] = ["fullstack", "ai", "blockchain", "security"];
/** The four areas sit on the corners of a tetrahedron. */
const CORNERS: Record<Area, [number, number, number]> = {
  fullstack: [0.94, 0.33, 0],
  ai: [-0.47, 0.33, 0.82],
  blockchain: [-0.47, 0.33, -0.82],
  security: [0, -1, 0],
};

function norm(v: number[], len: number): [number, number, number] {
  const d = Math.hypot(v[0], v[1], v[2]) || 1;
  return [(v[0] / d) * len, (v[1] / d) * len, (v[2] / d) * len];
}

/**
 * Lays the work out in 3D: areas on the outside corners, each project pulled
 * toward the areas it belongs to, each tool near the projects that use it.
 * Seeded, so it's the same on every visit.
 */
export function buildGraph(work: WorkInput[], seed = 11): Graph {
  const r = rng(seed);
  const jitter = (k: number) => (r() - 0.5) * k;
  const nodes: GNode[] = [];
  const edges: [number, number][] = [];
  const index = new Map<string, number>();
  const add = (n: Omit<GNode, "links">) => {
    index.set(n.id, nodes.length);
    nodes.push({ ...n, links: [] });
    return nodes.length - 1;
  };
  const link = (a: number, b: number) => {
    edges.push([a, b]);
    nodes[a].links.push(b);
    nodes[b].links.push(a);
  };

  for (const a of AREAS) {
    const [x, y, z] = norm(CORNERS[a], 1.45);
    add({ id: `area:${a}`, label: AREA_LABEL[a], kind: "area", area: a, x, y, z });
  }

  for (const w of work) {
    const sum = [0, 0, 0];
    w.areas.forEach((a, i) => {
      // The first area counts double, so a project sits closest to its main one.
      const k = i === 0 ? 2 : 1;
      CORNERS[a].forEach((c, j) => (sum[j] += c * k));
    });
    const [x, y, z] = norm(sum, 0.8);
    const i = add({
      id: `work:${w.id}`,
      label: w.label,
      kind: "work",
      area: w.areas[0],
      href: w.href,
      x: x + jitter(0.5),
      y: y + jitter(0.5),
      z: z + jitter(0.5),
    });
    for (const a of w.areas) link(i, index.get(`area:${a}`)!);
  }

  for (const w of work) {
    const wi = index.get(`work:${w.id}`)!;
    for (const s of w.stack) {
      const id = `skill:${s.toLowerCase()}`;
      let si = index.get(id);
      if (si === undefined) si = add({ id, label: s, kind: "skill", x: 0, y: 0, z: 0 });
      link(wi, si);
    }
  }

  // A tool sits between the projects that use it, pushed a little outwards.
  for (const n of nodes) {
    if (n.kind !== "skill") continue;
    const sum = [0, 0, 0];
    for (const l of n.links) {
      sum[0] += nodes[l].x;
      sum[1] += nodes[l].y;
      sum[2] += nodes[l].z;
    }
    const k = n.links.length;
    const base = [sum[0] / k + jitter(0.5), sum[1] / k + jitter(0.5), sum[2] / k + jitter(0.5)];
    const len = Math.hypot(base[0], base[1], base[2]);
    [n.x, n.y, n.z] = norm(base, k > 1 ? Math.max(0.3, len * 0.8) : len + 0.5);
  }

  // Push apart anything that ended up too close to read.
  const MIN = 0.44;
  for (let pass = 0; pass < 80; pass++) {
    for (let i = 4; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i];
        const b = nodes[j];
        let dx = b.x - a.x;
        let dy = b.y - a.y;
        let dz = b.z - a.z;
        let d = Math.hypot(dx, dy, dz);
        if (d >= MIN) continue;
        if (d < 1e-6) {
          dx = 0.01 * (i + 1);
          dy = 0.01;
          dz = -0.01;
          d = Math.hypot(dx, dy, dz);
        }
        const push = (MIN - d) / 2 / d;
        a.x -= dx * push;
        a.y -= dy * push;
        a.z -= dz * push;
        b.x += dx * push;
        b.y += dy * push;
        b.z += dz * push;
      }
    }
  }
  return { nodes, edges };
}

/** One sentence about a node, for the caption under the map. */
export function describe(g: Graph, i: number): string {
  const n = g.nodes[i];
  const names = (kind: NodeKind) =>
    n.links
      .map((l) => g.nodes[l])
      .filter((m) => m.kind === kind)
      .map((m) => m.label);
  if (n.kind === "work") return `${n.label} is built with ${names("skill").join(", ")}. Areas: ${names("area").join(", ")}.`;
  if (n.kind === "skill") return `${n.label} is used in ${names("work").join(", ")}.`;
  return `${n.label}: ${names("work").join(", ")}.`;
}
