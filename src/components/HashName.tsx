"use client";

import { useEffect, useRef } from "react";

const HEX = "0123456789abcdef";
const LOCK_MS = 900;

type Cell = { x: number; y: number; ch: string; lockedUntil: number };

function linesFor(width: number, name: string): string[] {
  const [first, ...rest] = name.split(" ");
  if (width >= 640) return [first, rest.join(" ")];
  return [first, ...rest];
}

function cssVar(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

/**
 * The name drawn in hex digits that keep re-rolling like a miner searching for
 * a hash. Under the pointer the digits settle to zeros: a proof found. The real
 * heading stays in the DOM for screen readers and search engines.
 */
export function HashName({ name }: { name: string }) {
  const [first, middle, ...rest] = name.split(" ");
  const last = rest.join(" ");
  const wrap = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const host = wrap.current;
    const cv = canvas.current;
    if (!host || !cv) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;

    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let cells: Cell[] = [];
    let cw = 7;
    let chH = 11;
    let width = 0;
    let height = 0;
    let frame = 0;
    let visible = true;
    let last = 0;
    let pointer: { x: number; y: number } | null = null;
    let colors = { ink: "#e8eef6", night: "#0a1a2f", accent: "#a9b6ff" };
    let monoFamily = "monospace";
    let displayFamily = "sans-serif";
    let drawName: (c: CanvasRenderingContext2D) => void = () => {};

    const readStyle = () => {
      colors = { ink: cssVar("--ink"), night: cssVar("--night"), accent: cssVar("--accent") };
      const probe = host.querySelector<HTMLElement>(".hash-name-fallback");
      if (probe) displayFamily = getComputedStyle(probe).fontFamily;
      const mono = document.querySelector<HTMLElement>(".mono");
      monoFamily = mono ? getComputedStyle(mono).fontFamily : "ui-monospace, monospace";
    };

    const setFont = (c: CanvasRenderingContext2D, px: number) => {
      c.font = `800 ${px}px ${displayFamily}`;
      if ("fontStretch" in c) (c as CanvasRenderingContext2D & { fontStretch: string }).fontStretch = "expanded";
    };

    const layout = () => {
      readStyle();
      width = host.clientWidth;
      const lines = linesFor(width, name);

      // Size the type so the longest line fills the width.
      const off = document.createElement("canvas").getContext("2d", { willReadFrequently: true })!;
      setFont(off, 100);
      const widest = Math.max(...lines.map((l) => off.measureText(l).width));
      const size = Math.min(200, Math.floor((width / widest) * 100 * 0.985));
      const lineH = Math.round(size * 0.9);
      height = lineH * lines.length + Math.round(size * 0.14);
      cw = Math.max(4.5, size / 24);
      chH = cw * 1.45;

      drawName = (c) => {
        setFont(c, size);
        c.textBaseline = "alphabetic";
        c.textAlign = "left";
        lines.forEach((l, i) => c.fillText(l, -size * 0.02, lineH * (i + 1) - size * 0.1));
      };

      off.canvas.width = width;
      off.canvas.height = height;
      off.fillStyle = "#fff";
      drawName(off);
      const mask = off.getImageData(0, 0, width, height).data;
      const alphaAt = (x: number, y: number) => {
        const xi = Math.min(width - 1, Math.max(0, Math.floor(x)));
        const yi = Math.min(height - 1, Math.max(0, Math.floor(y)));
        return mask[(yi * width + xi) * 4 + 3];
      };

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      cv.width = Math.round(width * dpr);
      cv.height = Math.round(height * dpr);
      cv.style.width = `${width}px`;
      cv.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // A digit wherever the grid cell's centre falls inside a letter.
      cells = [];
      for (let y = chH / 2; y < height; y += chH) {
        for (let x = cw / 2; x < width; x += cw) {
          if (alphaAt(x, y) > 200) cells.push({ x, y, ch: HEX[(Math.random() * 16) | 0], lockedUntil: 0 });
        }
      }
      host.dataset.ready = "true";
      draw(performance.now());
    };

    const draw = (now: number) => {
      ctx.clearRect(0, 0, width, height);

      // Solid letters, so the name reads at a glance.
      ctx.fillStyle = colors.ink;
      drawName(ctx);

      // Hex digits cut into the letters, re-rolling like a miner searching.
      ctx.font = `600 ${(chH * 0.84).toFixed(1)}px ${monoFamily}`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      const r2 = (cw * 7) ** 2;
      const locked: Cell[] = [];
      ctx.fillStyle = colors.night;
      ctx.globalAlpha = 0.5;
      for (const c of cells) {
        if (pointer) {
          const dx = c.x - pointer.x;
          const dy = c.y - pointer.y;
          if (dx * dx + dy * dy < r2) c.lockedUntil = now + LOCK_MS;
        }
        if (c.lockedUntil > now) locked.push(c);
        else ctx.fillText(c.ch, c.x, c.y);
      }
      ctx.globalAlpha = 1;

      // Under the pointer the digits settle on zero: a proof found.
      for (const c of locked) {
        ctx.fillStyle = colors.accent;
        ctx.fillRect(c.x - cw / 2, c.y - chH / 2, cw, chH);
        ctx.fillStyle = colors.night;
        ctx.fillText("0", c.x, c.y);
      }
    };

    const tick = (now: number) => {
      frame = requestAnimationFrame(tick);
      if (!visible || now - last < 60) return;
      last = now;
      for (const c of cells) {
        if (Math.random() < 0.07) c.ch = HEX[(Math.random() * 16) | 0];
      }
      draw(now);
    };

    const onMove = (e: PointerEvent) => {
      const r = cv.getBoundingClientRect();
      pointer = { x: e.clientX - r.left, y: e.clientY - r.top };
      if (still) draw(performance.now());
    };
    const onLeave = () => {
      pointer = null;
    };

    let ro: ResizeObserver | undefined;
    let io: IntersectionObserver | undefined;
    let cancelled = false;
    let lastWidth = 0;

    document.fonts.ready.then(() => {
      if (cancelled) return;
      layout();
      lastWidth = width;
      ro = new ResizeObserver(() => {
        if (Math.abs(host.clientWidth - lastWidth) > 4) {
          layout();
          lastWidth = width;
        }
      });
      ro.observe(host);
      io = new IntersectionObserver(([e]) => (visible = e.isIntersecting));
      io.observe(host);
      if (!still) frame = requestAnimationFrame(tick);
    });

    const onTheme = () => requestAnimationFrame(() => {
      readStyle();
      draw(performance.now());
    });
    const scheme = window.matchMedia("(prefers-color-scheme: light)");
    cv.addEventListener("pointermove", onMove);
    cv.addEventListener("pointerleave", onLeave);
    window.addEventListener("portfolio:theme", onTheme);
    scheme.addEventListener("change", onTheme);

    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
      ro?.disconnect();
      io?.disconnect();
      cv.removeEventListener("pointermove", onMove);
      cv.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("portfolio:theme", onTheme);
      scheme.removeEventListener("change", onTheme);
    };
  }, [name]);

  return (
    <div className="hash-name" ref={wrap}>
      {/* Same size and line breaks as the canvas, so nothing moves when it takes over. */}
      <h1 className="hash-name-fallback" id="name">
        {first}
        <span className="hash-name-break"> </span>
        {middle}
        <span className="hash-name-break hash-name-break-sm"> </span>
        {last}
      </h1>
      <canvas ref={canvas} aria-hidden="true" />
    </div>
  );
}
