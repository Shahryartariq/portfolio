"use client";

import { useEffect, useRef, useState } from "react";
import type { ShapeId } from "@/lib/shapes";
import type { Engine } from "@/lib/stage-engine";
import type { StageIn } from "@/lib/stage.worker";

function isLight() {
  const t = document.documentElement.dataset.theme;
  if (t === "light") return true;
  if (t === "dark") return false;
  return window.matchMedia("(prefers-color-scheme: light)").matches;
}

/** Either a worker that renders on an OffscreenCanvas, or the engine on the main thread. */
type Driver = { send(m: Exclude<StageIn, { type: "init" }>): void; dispose(): void };

/**
 * A cloud of points that morphs between five shapes: a core sphere, a browser
 * window, a neural network, linked blocks and a shield. three.js runs in a Web
 * Worker when the browser supports OffscreenCanvas, so the page stays responsive.
 */
export function Stage3D({ shape, label }: { shape: ShapeId; label: string }) {
  const host = useRef<HTMLDivElement>(null);
  const driver = useRef<Driver | null>(null);
  const latest = useRef<ShapeId>(shape);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    latest.current = shape;
    driver.current?.send({ type: "shape", id: shape });
  }, [shape]);

  useEffect(() => {
    const el = host.current;
    if (!el) return;
    let disposed = false;
    const canvas = document.createElement("canvas");
    canvas.setAttribute("aria-hidden", "true");
    el.appendChild(canvas);

    const opts = () => ({
      width: el.clientWidth,
      height: el.clientHeight,
      dpr: window.devicePixelRatio || 1,
      small: window.innerWidth < 700,
      still: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
      light: isLight(),
    });

    const start = async () => {
      if (disposed) return;
      if ("transferControlToOffscreen" in canvas && typeof Worker === "function") {
        const offscreen = canvas.transferControlToOffscreen();
        const worker = new Worker(new URL("../lib/stage.worker.ts", import.meta.url), { type: "module" });
        worker.onmessage = (e: MessageEvent<{ type: string }>) => {
          if (e.data.type === "ready") setReady(true);
          if (e.data.type === "failed") setFailed(true);
        };
        worker.onerror = () => setFailed(true);
        const init: StageIn = { type: "init", canvas: offscreen, ...opts() };
        worker.postMessage(init, [offscreen]);
        worker.postMessage({ type: "shape", id: latest.current });
        driver.current = { send: (m) => worker.postMessage(m), dispose: () => worker.terminate() };
      } else {
        try {
          const { createEngine } = await import("@/lib/stage-engine");
          if (disposed) return;
          const engine: Engine = createEngine(canvas, opts());
          engine.setShape(latest.current);
          driver.current = {
            send: (m) => {
              if (m.type === "shape") engine.setShape(m.id);
              else if (m.type === "resize") engine.resize(m.width, m.height, m.dpr);
              else if (m.type === "tilt") engine.tilt(m.x, m.y);
              else if (m.type === "theme") engine.theme(m.light);
              else if (m.type === "visible") engine.visible(m.visible);
              else if (m.type === "pointer") engine.pointer(m.x, m.y);
              else if (m.type === "drag") engine.drag(m.dx, m.dy);
              else if (m.type === "release") engine.release();
              else if (m.type === "burst") engine.burst();
            },
            dispose: () => engine.dispose(),
          };
          setReady(true);
        } catch {
          setFailed(true);
        }
      }
    };

    // Start when the browser is idle, so the page is interactive first.
    const useIdle = "requestIdleCallback" in window;
    const idle = useIdle
      ? window.requestIdleCallback(() => void start(), { timeout: 2500 })
      : window.setTimeout(() => void start(), 1200);

    const ro = new ResizeObserver(() =>
      driver.current?.send({
        type: "resize",
        width: el.clientWidth,
        height: el.clientHeight,
        dpr: window.devicePixelRatio || 1,
      }),
    );
    ro.observe(el);
    const io = new IntersectionObserver(([e]) => driver.current?.send({ type: "visible", visible: e.isIntersecting }));
    io.observe(el);
    const onPointer = (e: PointerEvent) =>
      driver.current?.send({
        type: "tilt",
        x: (e.clientY / window.innerHeight - 0.5) * 0.35,
        y: (e.clientX / window.innerWidth - 0.5) * 0.5,
      });
    window.addEventListener("pointermove", onPointer, { passive: true });
    // Hover pushes the points away from the cursor; drag spins it; a click scatters it.
    const ndc = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      return { x: ((e.clientX - r.left) / r.width) * 2 - 1, y: -(((e.clientY - r.top) / r.height) * 2 - 1) };
    };
    let down: { x: number; y: number; id: number; moved: number } | null = null;
    const onMove = (e: PointerEvent) => {
      const p = ndc(e);
      if (e.pointerType === "mouse" || down) driver.current?.send({ type: "pointer", x: p.x, y: p.y });
      if (!down || down.id !== e.pointerId) return;
      const dx = e.clientX - down.x;
      const dy = e.clientY - down.y;
      down.moved += Math.abs(dx) + Math.abs(dy);
      down.x = e.clientX;
      down.y = e.clientY;
      driver.current?.send({ type: "drag", dx: (dx / el.clientWidth) * Math.PI * 1.4, dy: (dy / el.clientHeight) * Math.PI * 0.8 });
    };
    const onDown = (e: PointerEvent) => {
      down = { x: e.clientX, y: e.clientY, id: e.pointerId, moved: 0 };
      el.setPointerCapture(e.pointerId);
      el.dataset.dragging = "true";
    };
    const onUp = (e: PointerEvent) => {
      if (!down || down.id !== e.pointerId) return;
      if (down.moved < 6) driver.current?.send({ type: "burst" });
      else driver.current?.send({ type: "release" });
      down = null;
      delete el.dataset.dragging;
      if (e.pointerType !== "mouse") driver.current?.send({ type: "pointer", x: null });
    };
    const onLeave = () => {
      if (!down) driver.current?.send({ type: "pointer", x: null });
    };
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerdown", onDown);
    el.addEventListener("pointerup", onUp);
    el.addEventListener("pointercancel", onUp);
    el.addEventListener("pointerleave", onLeave);

    const onVisibility = () => driver.current?.send({ type: "visible", visible: !document.hidden });
    document.addEventListener("visibilitychange", onVisibility);
    const onTheme = () => driver.current?.send({ type: "theme", light: isLight() });
    const scheme = window.matchMedia("(prefers-color-scheme: light)");
    window.addEventListener("portfolio:theme", onTheme);
    scheme.addEventListener("change", onTheme);

    return () => {
      disposed = true;
      if (useIdle) window.cancelIdleCallback(idle);
      else window.clearTimeout(idle);
      ro.disconnect();
      io.disconnect();
      window.removeEventListener("pointermove", onPointer);
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerdown", onDown);
      el.removeEventListener("pointerup", onUp);
      el.removeEventListener("pointercancel", onUp);
      el.removeEventListener("pointerleave", onLeave);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("portfolio:theme", onTheme);
      scheme.removeEventListener("change", onTheme);
      driver.current?.dispose();
      driver.current = null;
      canvas.remove();
    };
  }, []);

  return (
    <div className="stage3d" data-ready={ready || undefined} data-failed={failed || undefined} data-shape={shape}>
      <div className="stage3d-canvas" ref={host} />
      <div className="stage3d-glow" aria-hidden="true" />
      <p className="sr-only" aria-live="polite">
        {label}
      </p>
      {ready && (
        <p className="stage3d-hint" aria-hidden="true">
          <span className="hint-fine">Drag to spin it, click to scatter it</span>
          <span className="hint-coarse">Swipe sideways to spin it, tap to scatter it</span>
        </p>
      )}
    </div>
  );
}
