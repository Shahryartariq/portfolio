/// <reference lib="webworker" />
import type { ShapeId } from "./shapes";
import { createEngine, type Engine, type EngineOptions } from "./stage-engine";

export type StageIn =
  | ({ type: "init"; canvas: OffscreenCanvas } & EngineOptions)
  | { type: "shape"; id: ShapeId }
  | { type: "resize"; width: number; height: number; dpr: number }
  | { type: "tilt"; x: number; y: number }
  | { type: "theme"; light: boolean }
  | { type: "visible"; visible: boolean };

let engine: Engine | null = null;
let pendingShape: ShapeId | null = null;

self.onmessage = (e: MessageEvent<StageIn>) => {
  const m = e.data;
  if (m.type === "init") {
    try {
      engine = createEngine(m.canvas, m);
      if (pendingShape) engine.setShape(pendingShape);
      self.postMessage({ type: "ready" });
    } catch {
      self.postMessage({ type: "failed" });
    }
    return;
  }
  if (!engine) {
    if (m.type === "shape") pendingShape = m.id;
    return;
  }
  if (m.type === "shape") engine.setShape(m.id);
  else if (m.type === "resize") engine.resize(m.width, m.height, m.dpr);
  else if (m.type === "tilt") engine.tilt(m.x, m.y);
  else if (m.type === "theme") engine.theme(m.light);
  else if (m.type === "visible") engine.visible(m.visible);
};
