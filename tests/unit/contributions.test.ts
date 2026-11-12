import { describe, expect, it } from "vitest";
import { gridOf, heightFor, parseCalendarHtml, parseSample, prettyDate, stats, toStl } from "@/lib/contributions";

const html = `
<table><tbody><tr>
<td tabindex="0" data-ix="0" aria-selected="false" aria-describedby="contribution-day-component-0-0" style="width: 10px" data-date="2026-11-08" id="contribution-day-component-0-0" data-level="3" role="gridcell" data-view-component="true" class="ContributionCalendar-day"></td>
<td tabindex="0" data-ix="0" data-date="2026-11-09" id="contribution-day-component-1-0" data-level="0" class="ContributionCalendar-day"></td>
<td tabindex="0" data-ix="0" data-date="2026-11-10" id="contribution-day-component-2-0" data-level="1" class="ContributionCalendar-day"></td>
<td tabindex="0" data-ix="0" data-date="2026-11-11" id="contribution-day-component-3-0" data-level="4" class="ContributionCalendar-day"></td>
</tr></tbody></table>
<tool-tip id="tooltip-a" for="contribution-day-component-0-0" popover="manual" data-direction="n" data-type="label" data-view-component="true" class="sr-only position-absolute">38 contributions on November 8th.</tool-tip>
<tool-tip id="tooltip-b" for="contribution-day-component-1-0" popover="manual" class="sr-only">No contributions on November 9th.</tool-tip>
<tool-tip id="tooltip-c" for="contribution-day-component-2-0" popover="manual" class="sr-only">1 contribution on November 10th.</tool-tip>
<tool-tip id="tooltip-d" for="contribution-day-component-3-0" popover="manual" class="sr-only">1,072 contributions on November 11th.</tool-tip>`;

describe("GitHub contribution calendar", () => {
  it("parses dates, levels and counts from GitHub's HTML", () => {
    expect(parseCalendarHtml(html)).toEqual([
      { date: "2026-11-08", count: 38, level: 3 },
      { date: "2026-11-09", count: 0, level: 0 },
      { date: "2026-11-10", count: 1, level: 1 },
      { date: "2026-11-11", count: 1072, level: 4 },
    ]);
  });

  it("reads the saved snapshot", () => {
    const days = parseSample();
    expect(days).toHaveLength(369);
    expect(days[0]).toEqual({ date: "2025-11-09", count: 1, level: 1 });
    expect(days.reduce((a, d) => a + d.count, 0)).toBe(1323);
  });

  it("works out the stats", () => {
    const s = stats(parseSample());
    expect(s.total).toBe(1323);
    expect(s.busiest).toEqual({ date: "2026-11-05", count: 91, level: 4 });
    expect(s.longestStreak).toBeGreaterThanOrEqual(12);
    expect(s.activeDays).toBe(parseSample().filter((d) => d.count > 0).length);
    // The current streak ignores today if today has nothing yet.
    expect(stats([{ date: "a", count: 2, level: 1 }, { date: "b", count: 3, level: 1 }, { date: "c", count: 0, level: 0 }]).currentStreak).toBe(2);
  });

  it("lays days out in weeks like GitHub (Sunday first)", () => {
    const g = gridOf(parseSample());
    expect(g[0]).toEqual({ col: 0, row: 0 }); // Nov 9, 2025 was a Sunday
    expect(g[6]).toEqual({ col: 0, row: 6 });
    expect(g[7]).toEqual({ col: 1, row: 0 });
    expect(g.at(-1)!.col).toBe(52);
  });

  it("scales heights by square root", () => {
    expect(heightFor(0)).toBeLessThan(heightFor(1));
    expect(heightFor(100) / heightFor(25)).toBeLessThan(2);
    expect(prettyDate("2026-11-05")).toBe("Nov 5, 2026");
  });

  it("exports a valid ASCII STL", () => {
    const days = parseSample();
    const stl = toStl(days, "test");
    const active = days.filter((d) => d.count > 0).length;
    expect(stl.startsWith("solid test\n")).toBe(true);
    expect(stl.endsWith("endsolid test")).toBe(true);
    expect(stl.match(/facet normal/g)).toHaveLength((active + 1) * 12);
    expect(stl).not.toMatch(/NaN|Infinity/);
  });
});
