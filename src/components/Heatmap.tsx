import { gridOf, type Day } from "@/lib/contributions";

/**
 * The flat calendar: shown before the 3D city loads, and instead of it without
 * WebGL. One path per level keeps the markup small.
 */
export function Heatmap({ days }: { days: Day[] }) {
  const cells = gridOf(days);
  const cols = (cells.at(-1)?.col ?? 0) + 1;
  const paths: string[] = ["", "", "", "", ""];
  days.forEach((d, i) => {
    const x = cells[i].col * 12;
    const y = cells[i].row * 12;
    paths[Math.min(4, d.level)] += `M${x} ${y}h10v10h-10z`;
  });
  return (
    <svg className="heatmap" viewBox={`0 0 ${cols * 12} ${7 * 12}`} aria-hidden="true">
      {paths.map((d, level) => (d ? <path key={level} d={d} data-level={level} /> : null))}
    </svg>
  );
}
