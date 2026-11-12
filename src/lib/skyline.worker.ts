/// <reference lib="webworker" />
import { createSkyline, type Skyline, type SkylineOptions } from "./skyline-engine";

export type SkylineIn =
  | ({ type: "init"; canvas: OffscreenCanvas } & SkylineOptions)
  | { type: "pointer"; x: number | null; y?: number }
  | { type: "drag"; dx: number; dy: number }
  | { type: "release" }
  | { type: "rise" }
  | { type: "resize"; width: number; height: number; dpr: number }
  | { type: "theme"; light: boolean }
  | { type: "visible"; visible: boolean };

export type SkylineOut = { type: "ready" } | { type: "failed" } | { type: "hover"; index: number | null };

let sky: Skyline | null = null;
let riseQueued = false;
const post = (m: SkylineOut) => self.postMessage(m);

self.onmessage = (e: MessageEvent<SkylineIn>) => {
  const m = e.data;
  if (m.type === "init") {
    try {
      sky = createSkyline(m.canvas, m, (index) => post({ type: "hover", index }));
      if (riseQueued) sky.rise();
      post({ type: "ready" });
    } catch {
      post({ type: "failed" });
    }
    return;
  }
  if (!sky) {
    if (m.type === "rise") riseQueued = true;
    return;
  }
  if (m.type === "pointer") sky.pointer(m.x, m.y);
  else if (m.type === "drag") sky.drag(m.dx, m.dy);
  else if (m.type === "release") sky.release();
  else if (m.type === "rise") sky.rise();
  else if (m.type === "resize") sky.resize(m.width, m.height, m.dpr);
  else if (m.type === "theme") sky.theme(m.light);
  else if (m.type === "visible") sky.visible(m.visible);
};
