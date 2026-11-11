"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { AREA_LABEL, disciplines } from "@/data/disciplines";
import type { ShapeId } from "@/lib/shapes";
import { Stage3D } from "./Stage3D";

/**
 * The intro and the four areas scroll on the left while the 3D object stays in
 * view on the right and morphs to match the step in the middle of the screen.
 */
export function Disciplines({ intro }: { intro: ReactNode }) {
  const [active, setActive] = useState(0); // 0 = intro, 1..4 = areas
  const steps = useRef<(HTMLElement | null)[]>([]);

  // The active step is the one crossing a line in the middle of the screen
  // (lower on phones, where the 3D object covers the top).
  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const line = window.innerHeight * (window.innerWidth <= 860 ? 0.66 : 0.5);
      let best = 0;
      steps.current.forEach((el, i) => {
        if (el && el.getBoundingClientRect().top <= line) best = i;
      });
      setActive(best);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  const shape: ShapeId = active === 0 ? "core" : disciplines[active - 1].shape;
  const label = active === 0 ? "Full-stack, AI, blockchain, security" : disciplines[active - 1].title;

  return (
    <div className="stage">
      <div className="stage-visual">
        <Stage3D shape={shape} label={label} />
        <ol className="stage-dots" aria-label="Areas">
          {disciplines.map((d, i) => (
            <li key={d.id}>
              <a href={`#${d.id}`} aria-current={active === i + 1 ? "step" : undefined} data-area={d.id}>
                {AREA_LABEL[d.id]}
              </a>
            </li>
          ))}
        </ol>
      </div>
      <div className="stage-text">
        <div
          className="stage-step stage-intro"
          data-step={0}
          ref={(el) => {
            steps.current[0] = el;
          }}
        >
          {intro}
        </div>
        {disciplines.map((d, i) => (
          <section
            key={d.id}
            id={d.id}
            className="stage-step area"
            data-area={d.id}
            data-step={i + 1}
            aria-labelledby={`${d.id}-title`}
            ref={(el) => {
              steps.current[i + 1] = el;
            }}
          >
            <h2 className="area-title" id={`${d.id}-title`}>
              {d.title}
            </h2>
            <p className="area-line">{d.line}</p>
            <ul className="area-proof">
              {d.proof.map((p) => (
                <li key={p.text}>
                  {p.href ? (
                    <a href={p.href} target="_blank" rel="noopener">
                      {p.text}
                    </a>
                  ) : (
                    p.text
                  )}
                </li>
              ))}
            </ul>
            <ul className="stack area-tools" aria-label={`${d.title} tools`}>
              {d.tools.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
