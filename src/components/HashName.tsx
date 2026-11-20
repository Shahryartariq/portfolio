"use client";

import { useEffect, useRef } from "react";

const HEX = "0123456789abcdef";
const LOCK_MS = 900;

/**
 * `x`/`y` are the cell's centre in CSS pixels (for the pointer); `px`/`py` its
 * top-left in device pixels (for drawing). `d` is the hex digit shown.
 */
type Cell = { x: number; y: number; px: number; py: number; d: number; lockedUntil: number; shownLocked: boolean };

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
 *
 * Drawing is incremental. The solid letters and the seventeen possible cells
 * (0-f, plus the highlighted zero) are rendered once to off-screen canvases;
 * each frame only repaints the few cells that changed, by copying pixels. That
 * keeps the animation to a fraction of a millisecond on a phone, where drawing
 * every digit as text every frame took most of the frame.
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
    const base = document.createElement("canvas"); // the solid letters
    const atlas = document.createElement("canvas"); // one sprite per cell state
    const ZERO = 16; // atlas slot of the highlighted zero
    let cells: Cell[] = [];
    let cw = 7; // cell size in CSS pixels
    let cwD = 14; // cell size in device pixels (whole numbers, so copies never blur)
    let chD = 20;
    let dpr = 1;
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

    /** Renders the letters and the cell sprites in the current theme colours. */
    const buildSprites = () => {
      base.width = cv.width;
      base.height = cv.height;
      const b = base.getContext("2d");
      if (b) {
        b.setTransform(dpr, 0, 0, dpr, 0, 0);
        b.clearRect(0, 0, width, height);
        b.fillStyle = colors.ink;
        drawName(b);
      }

      atlas.width = cwD * (ZERO + 1);
      atlas.height = chD;
      const a = atlas.getContext("2d");
      if (a) {
        a.clearRect(0, 0, atlas.width, atlas.height);
        a.font = `600 ${(chD * 0.84).toFixed(1)}px ${monoFamily}`;
        a.textAlign = "center";
        a.textBaseline = "middle";
        // Digits cut into the letters at half strength.
        a.fillStyle = colors.night;
        a.globalAlpha = 0.5;
        for (let i = 0; i < 16; i++) a.fillText(HEX[i], i * cwD + cwD / 2, chD / 2);
        // The settled zero: a solid accent cell.
        a.globalAlpha = 1;
        a.fillStyle = colors.accent;
        a.fillRect(ZERO * cwD, 0, cwD, chD);
        a.fillStyle = colors.night;
        a.fillText("0", ZERO * cwD + cwD / 2, chD / 2);
      }
    };

    const stamp = (c: Cell, locked: boolean) => {
      ctx.drawImage(atlas, (locked ? ZERO : c.d) * cwD, 0, cwD, chD, c.px, c.py, cwD, chD);
      c.shownLocked = locked;
    };

    const paintAll = (now: number) => {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, cv.width, cv.height);
      ctx.drawImage(base, 0, 0);
      for (const c of cells) stamp(c, c.lockedUntil > now);
    };

    /** Repaints only the cells whose digit or highlight changed. */
    const step = (now: number, reroll: boolean) => {
      const r2 = (cw * 7) ** 2;
      for (const c of cells) {
        if (pointer) {
          const dx = c.x - pointer.x;
          const dy = c.y - pointer.y;
          if (dx * dx + dy * dy < r2) c.lockedUntil = now + LOCK_MS;
        }
        const locked = c.lockedUntil > now;
        let changed = locked !== c.shownLocked;
        if (reroll && !locked && Math.random() < 0.07) {
          c.d = (Math.random() * 16) | 0;
          changed = true;
        }
        if (!changed) continue;
        ctx.clearRect(c.px, c.py, cwD, chD);
        ctx.drawImage(base, c.px, c.py, cwD, chD, c.px, c.py, cwD, chD);
        stamp(c, locked);
      }
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

      dpr = Math.min(window.devicePixelRatio || 1, 2);
      cwD = Math.max(4, Math.round(Math.max(4.5, size / 24) * dpr));
      chD = Math.round(cwD * 1.45);
      cw = cwD / dpr;

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

      cv.width = Math.round(width * dpr);
      cv.height = Math.round(height * dpr);
      cv.style.width = `${width}px`;
      cv.style.height = `${height}px`;

      // A digit wherever the grid cell's centre falls inside a letter.
      cells = [];
      for (let py = 0; py < cv.height; py += chD) {
        for (let px = 0; px < cv.width; px += cwD) {
          const x = (px + cwD / 2) / dpr;
          const y = (py + chD / 2) / dpr;
          if (alphaAt(x, y) > 200) {
            cells.push({ x, y, px, py, d: (Math.random() * 16) | 0, lockedUntil: 0, shownLocked: false });
          }
        }
      }
      buildSprites();
      paintAll(performance.now());
      host.dataset.ready = "true";
      host.dataset.cells = String(cells.length);
    };

    const tick = (now: number) => {
      frame = requestAnimationFrame(tick);
      if (!visible || now - last < 60) return;
      last = now;
      step(now, true);
    };

    const onMove = (e: PointerEvent) => {
      const r = cv.getBoundingClientRect();
      pointer = { x: e.clientX - r.left, y: e.clientY - r.top };
      if (still) step(performance.now(), false);
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

    const onTheme = () =>
      requestAnimationFrame(() => {
        if (!cells.length) return;
        readStyle();
        buildSprites();
        paintAll(performance.now());
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
