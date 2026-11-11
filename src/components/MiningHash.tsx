"use client";

import { useEffect, useState } from "react";
import { DIFFICULTY } from "@/lib/chain-core";

const HEX = "0123456789abcdef";

/**
 * Shows the tip hash being "found": digits settle left to right, once, on load.
 * Server HTML and no-motion users get the final hash straight away.
 */
export function MiningHash({ value, head = 18, tail = 8 }: { value: string; head?: number; tail?: number }) {
  const final = `${value.slice(0, head)}…${value.slice(-tail)}`;
  const [text, setText] = useState(final);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const start = performance.now();
    const duration = 1100;
    let frame = 0;
    const tick = (now: number) => {
      const settled = Math.floor(((now - start) / duration) * final.length);
      if (settled >= final.length) {
        setText(final);
        return;
      }
      let out = "";
      for (let i = 0; i < final.length; i++) {
        const c = final[i];
        out += i < settled || c === "…" ? c : HEX[(Math.random() * 16) | 0];
      }
      setText(out);
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [final]);

  return (
    <span className="mono" title={value}>
      <span className="sr-only">{value}</span>
      <span aria-hidden="true">
        <span className="zeros">{text.slice(0, DIFFICULTY)}</span>
        {text.slice(DIFFICULTY)}
      </span>
    </span>
  );
}
