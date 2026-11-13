"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { buildGraph, describe, type WorkInput } from "@/lib/constellation";

const AREA_VAR = { fullstack: "--a-fullstack", ai: "--a-ai", blockchain: "--a-blockchain", security: "--a-security" };

function cssVar(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

/**
 * Projects and the tools behind them as a 3D map you can turn. Drawn on a 2D
 * canvas with its own projection: about 40 points, so no 3D library is needed.
 */
export function Constellation({ work }: { work: WorkInput[] }) {
  const graph = useMemo(() => buildGraph(work), [work]);
  const host = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const [hovered, setHovered] = useState<number | null>(null);
  const selectedRef = useRef<number | null>(null);
  const hoveredRef = useRef<number | null>(null);

  useEffect(() => {
    selectedRef.current = selected;
  }, [selected]);

  useEffect(() => {
    const el = host.current;
    const cv = canvas.current;
    const ctx = cv?.getContext("2d");
    if (!el || !cv || !ctx) return;

    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const { nodes, edges } = graph;
    const pts = nodes.map(() => ({ x: 0, y: 0, s: 1, depth: 0 }));
    const rot = { x: 0.28, y: 0.5, vx: 0, vy: 0, dragging: false };
    let w = 0;
    let h = 0;
    let visible = true;
    let frame = 0;
    let colors = { ink: "", dim: "", rule: "", night: "", area: {} as Record<string, string>, sans: "sans-serif" };

    const readStyle = () => {
      colors = {
        ink: cssVar("--ink"),
        dim: cssVar("--dim"),
        rule: cssVar("--rule"),
        night: cssVar("--night"),
        area: Object.fromEntries(Object.entries(AREA_VAR).map(([k, v]) => [k, cssVar(v)])),
        sans: getComputedStyle(document.body).fontFamily,
      };
    };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = el.clientWidth;
      h = el.clientHeight;
      cv.width = Math.round(w * dpr);
      cv.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const project = () => {
      const cy = Math.cos(rot.y);
      const sy = Math.sin(rot.y);
      const cx = Math.cos(rot.x);
      const sx = Math.sin(rot.x);
      // Fill a wide stage: stretch the map sideways on landscape screens.
      const radius = Math.min(w, h) * 0.3;
      const wide = Math.min(2.1, Math.max(1, (w / h) * 0.95));
      nodes.forEach((n, i) => {
        const x1 = n.x * cy + n.z * sy;
        const z1 = -n.x * sy + n.z * cy;
        const y1 = n.y * cx - z1 * sx;
        const z2 = n.y * sx + z1 * cx;
        const s = 4 / (4 - z2);
        pts[i] = { x: w / 2 + x1 * radius * wide * s, y: h / 2 - y1 * radius * s, s, depth: z2 };
      });
    };

    const draw = () => {
      project();
      ctx.clearRect(0, 0, w, h);
      const active = hoveredRef.current ?? selectedRef.current;
      const lit = new Set<number>(active === null ? [] : [active, ...nodes[active].links]);

      for (const [a, b] of edges) {
        const on = active !== null && (a === active || b === active);
        const depth = (pts[a].depth + pts[b].depth) / 2;
        ctx.globalAlpha = on ? 0.95 : active === null ? 0.22 + (depth + 1.3) * 0.12 : 0.07;
        ctx.strokeStyle = on ? colors.area[nodes[active!].area ?? nodes[a].area ?? ""] || colors.ink : colors.dim;
        ctx.lineWidth = on ? 1.6 : 1;
        ctx.beginPath();
        ctx.moveTo(pts[a].x, pts[a].y);
        ctx.lineTo(pts[b].x, pts[b].y);
        ctx.stroke();
      }

      const order = nodes.map((_, i) => i).sort((a, b) => pts[a].depth - pts[b].depth);
      const radiusOf = (i: number) => (nodes[i].kind === "area" ? 11 : nodes[i].kind === "work" ? 6.5 : 3.2) * pts[i].s;
      for (const i of order) {
        const n = nodes[i];
        const p = pts[i];
        const on = active === null || lit.has(i);
        const color = n.area ? colors.area[n.area] : colors.dim;
        const r = radiusOf(i);
        ctx.globalAlpha = on ? Math.min(1, 0.55 + (p.depth + 1.5) * 0.25) : 0.16;
        ctx.beginPath();
        ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
        if (n.kind === "area") {
          ctx.fillStyle = colors.night;
          ctx.fill();
          ctx.strokeStyle = color;
          ctx.lineWidth = 2.5;
          ctx.stroke();
        } else {
          ctx.fillStyle = color;
          ctx.fill();
        }
        if (i === active) {
          ctx.beginPath();
          ctx.arc(p.x, p.y, r + 5, 0, Math.PI * 2);
          ctx.strokeStyle = colors.ink;
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }
      }

      // Labels: what's lit comes first, then whatever is nearest the viewer. A label
      // that would overlap one already placed tries the other side, then waits its turn.
      const wanted = order
        .filter((i) => (active === null ? nodes[i].kind !== "skill" : lit.has(i)))
        .sort(
          (a, b) =>
            Number(b === active) - Number(a === active) ||
            Number(nodes[b].kind === "area") - Number(nodes[a].kind === "area") ||
            pts[b].depth - pts[a].depth,
        );
      const placed: [number, number, number, number][] = [];
      ctx.textBaseline = "middle";
      ctx.globalAlpha = 1;
      for (const i of wanted) {
        const n = nodes[i];
        const p = pts[i];
        const size = n.kind === "area" ? 15 : n.kind === "work" ? 13.5 : 12.5;
        ctx.font = `${n.kind === "skill" ? 500 : 650} ${size}px ${colors.sans}`;
        const tw = ctx.measureText(n.label).width;
        const gap = radiusOf(i) + 7;
        // Right, left, then above or below the dot.
        const first = p.x < w * 0.72 ? 1 : -1;
        const spots: [number, number][] = [
          [first === 1 ? p.x + gap : p.x - gap - tw, p.y],
          [first === 1 ? p.x - gap - tw : p.x + gap, p.y],
          [p.x - tw / 2, p.y - gap - size * 0.6],
          [p.x - tw / 2, p.y + gap + size * 0.6],
        ];
        for (const [x0, y0] of spots) {
          const box: [number, number, number, number] = [x0 - 3, y0 - size * 0.7, x0 + tw + 3, y0 + size * 0.7];
          if (box[0] < 2 || box[2] > w - 2 || box[1] < 2 || box[3] > h - 2) continue;
          if (placed.some((q) => box[0] < q[2] && box[2] > q[0] && box[1] < q[3] && box[3] > q[1])) continue;
          placed.push(box);
          ctx.textAlign = "left";
          ctx.fillStyle = n.kind === "skill" ? colors.dim : colors.ink;
          if (active !== null) ctx.fillStyle = colors.ink;
          ctx.fillText(n.label, x0, y0);
          break;
        }
      }
    };

    const tick = () => {
      frame = requestAnimationFrame(tick);
      if (!visible) return;
      if (!rot.dragging) {
        rot.vy *= 0.94;
        rot.vx *= 0.9;
        // Drift slowly unless something is selected or hovered, so labels can be read.
        const idle = hoveredRef.current === null && selectedRef.current === null && !still;
        rot.y += rot.vy + (idle ? 0.0022 : 0);
        rot.x += rot.vx;
      }
      rot.x = Math.max(-0.9, Math.min(0.9, rot.x));
      draw();
    };

    const nearest = (e: PointerEvent): number | null => {
      const r = cv.getBoundingClientRect();
      const x = e.clientX - r.left;
      const y = e.clientY - r.top;
      let best: number | null = null;
      let bestD = 22 * 22;
      pts.forEach((p, i) => {
        const d = (p.x - x) ** 2 + (p.y - y) ** 2;
        if (d < bestD) {
          bestD = d;
          best = i;
        }
      });
      return best;
    };

    let down: { x: number; y: number; id: number; moved: number } | null = null;
    const onMove = (e: PointerEvent) => {
      if (down && down.id === e.pointerId) {
        const dx = e.clientX - down.x;
        const dy = e.clientY - down.y;
        down.moved += Math.abs(dx) + Math.abs(dy);
        down.x = e.clientX;
        down.y = e.clientY;
        rot.y += dx * 0.008;
        rot.x += dy * 0.006;
        rot.vy = dx * 0.008;
        rot.vx = dy * 0.003;
        return;
      }
      if (e.pointerType !== "mouse") return;
      const n = nearest(e);
      if (n !== hoveredRef.current) {
        hoveredRef.current = n;
        setHovered(n);
        cv.style.cursor = n === null ? "grab" : "pointer";
      }
    };
    const onDown = (e: PointerEvent) => {
      down = { x: e.clientX, y: e.clientY, id: e.pointerId, moved: 0 };
      rot.dragging = true;
      cv.setPointerCapture(e.pointerId);
    };
    const onUp = (e: PointerEvent) => {
      if (!down || down.id !== e.pointerId) return;
      rot.dragging = false;
      if (down.moved < 6) setSelected(nearest(e));
      down = null;
    };
    const onLeave = () => {
      if (hoveredRef.current !== null) {
        hoveredRef.current = null;
        setHovered(null);
      }
    };

    readStyle();
    resize();
    const ro = new ResizeObserver(() => {
      resize();
      draw();
    });
    ro.observe(el);
    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting));
    io.observe(el);
    const onTheme = () => requestAnimationFrame(readStyle);
    const scheme = window.matchMedia("(prefers-color-scheme: light)");
    window.addEventListener("portfolio:theme", onTheme);
    scheme.addEventListener("change", onTheme);
    document.fonts.ready.then(readStyle);
    cv.addEventListener("pointermove", onMove);
    cv.addEventListener("pointerdown", onDown);
    cv.addEventListener("pointerup", onUp);
    cv.addEventListener("pointercancel", onUp);
    cv.addEventListener("pointerleave", onLeave);
    frame = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(frame);
      ro.disconnect();
      io.disconnect();
      window.removeEventListener("portfolio:theme", onTheme);
      scheme.removeEventListener("change", onTheme);
      cv.removeEventListener("pointermove", onMove);
      cv.removeEventListener("pointerdown", onDown);
      cv.removeEventListener("pointerup", onUp);
      cv.removeEventListener("pointercancel", onUp);
      cv.removeEventListener("pointerleave", onLeave);
    };
  }, [graph]);

  const shown = hovered ?? selected;
  const node = shown === null ? null : graph.nodes[shown];

  return (
    <div className="constellation">
      <div className="constellation-stage" ref={host}>
        <canvas ref={canvas} aria-hidden="true" />
      </div>
      <p className="constellation-caption" role="status">
        {node ? (
          <>
            {describe(graph, shown!)}{" "}
            {node.href && (
              <a href={node.href} target="_blank" rel="noopener">
                Open {node.label}
              </a>
            )}
          </>
        ) : (
          <span className="dim">Drag to turn it. Point at a dot, or pick a project below, to see what it connects to.</span>
        )}
      </p>
      <ul className="constellation-keys" aria-label="Projects on the map">
        {graph.nodes.map((n, i) =>
          n.kind === "work" ? (
            <li key={n.id}>
              <button
                type="button"
                aria-pressed={selected === i}
                data-area={n.area}
                onClick={() => setSelected(selected === i ? null : i)}
              >
                {n.label}
              </button>
            </li>
          ) : null,
        )}
      </ul>
    </div>
  );
}
