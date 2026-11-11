import { describe, expect, it } from "vitest";
import { SHAPES, buildShape, inShield } from "@/lib/shapes";

describe("3D shapes", () => {
  for (const id of SHAPES) {
    it(`${id} has exactly n finite points inside the frame`, () => {
      const pts = buildShape(id, 3000);
      expect(pts).toHaveLength(9000);
      let max = 0;
      for (const v of pts) {
        expect(Number.isFinite(v)).toBe(true);
        max = Math.max(max, Math.abs(v));
      }
      expect(max).toBeLessThan(2.2);
      // No point left at the origin by accident (a sign the builder under-filled).
      let zeros = 0;
      for (let i = 0; i < 3000; i++) if (pts[i * 3] === 0 && pts[i * 3 + 1] === 0 && pts[i * 3 + 2] === 0) zeros++;
      expect(zeros).toBe(0);
    });
  }

  it("is deterministic", () => {
    expect(Array.from(buildShape("ai", 500))).toEqual(Array.from(buildShape("ai", 500)));
  });

  it("shield outline", () => {
    expect(inShield(0, 0)).toBe(true);
    expect(inShield(0, -1.3)).toBe(true);
    expect(inShield(0.9, -1.2)).toBe(false);
    expect(inShield(0, 1.3)).toBe(false);
  });
});
