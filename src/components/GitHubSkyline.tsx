"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { gridOf, heightFor, prettyDate, toStl, type Day } from "@/lib/contributions";
import type { Skyline } from "@/lib/skyline-engine";
import type { SkylineIn, SkylineOut } from "@/lib/skyline.worker";

function isLight() {
  const t = document.documentElement.dataset.theme;
  if (t === "light") return true;
  if (t === "dark") return false;
  return window.matchMedia("(prefers-color-scheme: light)").matches;
}

/** Rebuilds the day list from the compact form. Levels aren't needed on the client. */
function expand(start: string, counts: string): Day[] {
  const t0 = Date.parse(`${start}T00:00:00Z`);
  return counts.split(",").map((c, i) => ({
    date: new Date(t0 + i * 86_400_000).toISOString().slice(0, 10),
    count: Number(c),
    level: 0,
  }));
}

type Driver = { send(m: Exclude<SkylineIn, { type: "init" }>): void; dispose(): void };

/**
 * A year of GitHub contributions as a 3D city you can turn and hover. Rendered
 * in a Web Worker on an OffscreenCanvas where supported; loads only when the
 * section comes near the screen.
 */
export function GitHubSkyline({
  start,
  counts,
  user,
  children,
}: {
  /** First day, YYYY-MM-DD. */
  start: string;
  /** One count per day from `start`, comma-separated (kept compact for the page payload). */
  counts: string;
  user: string;
  children?: ReactNode;
}) {
  const days = useMemo(() => expand(start, counts), [start, counts]);
  const host = useRef<HTMLDivElement>(null);
  const driver = useRef<Driver | null>(null);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [tip, setTip] = useState<{ index: number; x: number; y: number } | null>(null);
  const pointerPx = useRef({ x: 0, y: 0 });

  const data = useMemo(() => {
    const cells = gridOf(days);
    const max = Math.sqrt(Math.max(1, ...days.map((d) => d.count)));
    return {
      heights: days.map((d) => heightFor(d.count)),
      intensity: days.map((d) => (d.count === 0 ? 0 : Math.max(0.02, Math.sqrt(d.count) / max))),
      cols: cells.map((c) => c.col),
      rows: cells.map((c) => c.row),
    };
  }, [days]);

  useEffect(() => {
    const el = host.current;
    if (!el) return;
    let disposed = false;
    let started = false;
    const canvas = document.createElement("canvas");
    canvas.setAttribute("aria-hidden", "true");
    el.appendChild(canvas);

    const onHover = (index: number | null) =>
      setTip(index === null ? null : { index, x: pointerPx.current.x, y: pointerPx.current.y });

    const start = async () => {
      if (started || disposed) return;
      started = true;
      const opts = {
        ...data,
        width: el.clientWidth,
        height: el.clientHeight,
        dpr: window.devicePixelRatio || 1,
        still: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
        light: isLight(),
      };
      if ("transferControlToOffscreen" in canvas && typeof Worker === "function") {
        const offscreen = canvas.transferControlToOffscreen();
        const worker = new Worker(new URL("../lib/skyline.worker.ts", import.meta.url), { type: "module" });
        worker.onmessage = (e: MessageEvent<SkylineOut>) => {
          if (e.data.type === "ready") setReady(true);
          else if (e.data.type === "failed") setFailed(true);
          else if (e.data.type === "hover") onHover(e.data.index);
        };
        worker.onerror = () => setFailed(true);
        const init: SkylineIn = { type: "init", canvas: offscreen, ...opts };
        worker.postMessage(init, [offscreen]);
        driver.current = { send: (m) => worker.postMessage(m), dispose: () => worker.terminate() };
      } else {
        try {
          const { createSkyline } = await import("@/lib/skyline-engine");
          if (disposed) return;
          const sky: Skyline = createSkyline(canvas, opts, onHover);
          driver.current = {
            send: (m) => {
              if (m.type === "pointer") sky.pointer(m.x, m.y);
              else if (m.type === "drag") sky.drag(m.dx, m.dy);
              else if (m.type === "release") sky.release();
              else if (m.type === "rise") sky.rise();
              else if (m.type === "resize") sky.resize(m.width, m.height, m.dpr);
              else if (m.type === "theme") sky.theme(m.light);
              else if (m.type === "visible") sky.visible(m.visible);
            },
            dispose: () => sky.dispose(),
          };
          setReady(true);
        } catch {
          setFailed(true);
        }
      }
    };

    // Load when the section is close; grow the buildings once it's properly in view.
    const near = new IntersectionObserver(([e]) => e.isIntersecting && void start(), { rootMargin: "400px 0px" });
    near.observe(el);
    const seen = new IntersectionObserver(
      ([e]) => {
        driver.current?.send({ type: "visible", visible: e.isIntersecting });
        if (e.intersectionRatio > 0.35) driver.current?.send({ type: "rise" });
      },
      { threshold: [0, 0.35, 0.6] },
    );
    seen.observe(el);

    const ro = new ResizeObserver(() =>
      driver.current?.send({
        type: "resize",
        width: el.clientWidth,
        height: el.clientHeight,
        dpr: window.devicePixelRatio || 1,
      }),
    );
    ro.observe(el);

    const ndc = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      pointerPx.current = { x: e.clientX - r.left, y: e.clientY - r.top };
      return { x: ((e.clientX - r.left) / r.width) * 2 - 1, y: -(((e.clientY - r.top) / r.height) * 2 - 1) };
    };
    let down: { x: number; y: number; id: number } | null = null;
    const onMove = (e: PointerEvent) => {
      const p = ndc(e);
      if (!down) {
        driver.current?.send({ type: "pointer", x: p.x, y: p.y });
        setTip((t) => (t ? { ...t, ...pointerPx.current } : t));
        return;
      }
      if (down.id !== e.pointerId) return;
      const dx = e.clientX - down.x;
      const dy = e.clientY - down.y;
      down.x = e.clientX;
      down.y = e.clientY;
      driver.current?.send({ type: "drag", dx: (dx / el.clientWidth) * Math.PI, dy: (dy / el.clientHeight) * 1.2 });
    };
    const onDown = (e: PointerEvent) => {
      down = { x: e.clientX, y: e.clientY, id: e.pointerId };
      el.setPointerCapture(e.pointerId);
      el.dataset.dragging = "true";
      driver.current?.send({ type: "pointer", x: null });
    };
    const onUp = (e: PointerEvent) => {
      if (!down || down.id !== e.pointerId) return;
      down = null;
      delete el.dataset.dragging;
      driver.current?.send({ type: "release" });
      if (e.pointerType === "mouse") {
        const p = ndc(e);
        driver.current?.send({ type: "pointer", x: p.x, y: p.y });
      }
    };
    const onLeave = () => {
      if (!down) driver.current?.send({ type: "pointer", x: null });
    };
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerdown", onDown);
    el.addEventListener("pointerup", onUp);
    el.addEventListener("pointercancel", onUp);
    el.addEventListener("pointerleave", onLeave);

    const onTheme = () => driver.current?.send({ type: "theme", light: isLight() });
    const scheme = window.matchMedia("(prefers-color-scheme: light)");
    window.addEventListener("portfolio:theme", onTheme);
    scheme.addEventListener("change", onTheme);

    return () => {
      disposed = true;
      near.disconnect();
      seen.disconnect();
      ro.disconnect();
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerdown", onDown);
      el.removeEventListener("pointerup", onUp);
      el.removeEventListener("pointercancel", onUp);
      el.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("portfolio:theme", onTheme);
      scheme.removeEventListener("change", onTheme);
      driver.current?.dispose();
      driver.current = null;
      canvas.remove();
    };
  }, [data]);

  const download = () => {
    const blob = new Blob([toStl(days, `${user}-github-skyline`)], { type: "model/stl" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${user}-github-skyline-${days.at(-1)?.date.slice(0, 4) ?? ""}.stl`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const day = tip ? days[tip.index] : null;

  return (
    <div className="skyline" data-ready={ready || undefined} data-failed={failed || undefined}>
      <div className="skyline-stage">
        {children}
        <div className="skyline-canvas" ref={host} />
        {day && tip && (
          <p className="skyline-tip" role="status" style={{ left: tip.x, top: tip.y }}>
            <b>
              {day.count === 0 ? "No" : day.count.toLocaleString("en-US")} contribution{day.count === 1 ? "" : "s"}
            </b>
            <span>{prettyDate(day.date)}</span>
          </p>
        )}
      </div>
      <div className="skyline-bar">
        <p className="dim">
          {ready ? "Drag to turn the city. Hover a building to see the day." : "One building per day."}
        </p>
        <button type="button" className="btn" onClick={download}>
          Download for 3D printing (STL)
        </button>
      </div>
    </div>
  );
}
