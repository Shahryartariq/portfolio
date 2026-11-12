import { SAMPLE_CALENDAR } from "@/data/fixtures/contributions";

export type Day = { date: string; count: number; level: number };

export type Calendar = {
  days: Day[];
  /** "live" when read from GitHub, "snapshot" when GitHub couldn't be reached. */
  source: "live" | "snapshot";
  fetchedAt: string;
};

export const GITHUB_USER = "Shahryartariq";

/**
 * Reads GitHub's public contribution calendar fragment
 * (github.com/users/<user>/contributions): one <td> per day with the date and
 * level, and a <tool-tip> per day with the count ("5 contributions on …").
 */
export function parseCalendarHtml(html: string): Day[] {
  const byId = new Map<string, Day>();
  for (const m of html.matchAll(/<td\b[^>]*\bdata-date="(\d{4}-\d{2}-\d{2})"[^>]*>/g)) {
    const tag = m[0];
    const id = tag.match(/\bid="([^"]+)"/)?.[1];
    const level = Number(tag.match(/\bdata-level="(\d)"/)?.[1] ?? 0);
    if (id) byId.set(id, { date: m[1], count: 0, level });
  }
  for (const m of html.matchAll(/<tool-tip\b[^>]*\bfor="([^"]+)"[^>]*>([^<]*)<\/tool-tip>/g)) {
    const day = byId.get(m[1]);
    const n = m[2].trim().match(/^([\d,]+)\s+contribution/);
    if (day) day.count = n ? Number(n[1].replace(/,/g, "")) : 0;
  }
  return [...byId.values()].sort((a, b) => (a.date < b.date ? -1 : 1));
}

export function parseSample(text: string = SAMPLE_CALENDAR): Day[] {
  return text.split(",").map((s) => {
    const [d, c, l] = s.split(":");
    return { date: `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}`, count: Number(c), level: Number(l) };
  });
}

export type Stats = {
  total: number;
  activeDays: number;
  longestStreak: number;
  currentStreak: number;
  busiest: Day | null;
};

export function stats(days: Day[]): Stats {
  let total = 0;
  let active = 0;
  let longest = 0;
  let run = 0;
  let busiest: Day | null = null;
  for (const d of days) {
    total += d.count;
    if (d.count > 0) {
      active++;
      run++;
      longest = Math.max(longest, run);
      if (!busiest || d.count > busiest.count) busiest = d;
    } else run = 0;
  }
  // The current streak may end yesterday: today isn't over yet.
  let current = 0;
  let i = days.length - 1;
  if (i >= 0 && days[i].count === 0) i--;
  for (; i >= 0 && days[i].count > 0; i--) current++;
  return { total, activeDays: active, longestStreak: longest, currentStreak: current, busiest };
}

/** Column (week) and row (weekday, Sunday = 0) for each day, like GitHub's grid. */
export function gridOf(days: Day[]): { col: number; row: number }[] {
  if (!days.length) return [];
  const first = new Date(`${days[0].date}T00:00:00Z`).getUTCDay();
  return days.map((_, i) => ({ col: Math.floor((i + first) / 7), row: (i + first) % 7 }));
}

/** Building height for a day's count. Square root, so one huge day doesn't flatten the rest. */
export function heightFor(count: number): number {
  return count === 0 ? 0.12 : 0.35 + Math.sqrt(count) * 0.62;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
export function prettyDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return `${MONTHS[m - 1]} ${d}, ${y}`;
}

/** An ASCII STL of the skyline (one box per day on a base), for 3D printing. */
export function toStl(days: Day[], name = "github-skyline"): string {
  const cells = gridOf(days);
  const cols = (cells.at(-1)?.col ?? 0) + 1;
  const unit = 2.5; // mm per cell
  const lines: string[] = [`solid ${name}`];
  const box = (x0: number, y0: number, z0: number, x1: number, y1: number, z1: number) => {
    const v = [
      [x0, y0, z0], [x1, y0, z0], [x1, y1, z0], [x0, y1, z0],
      [x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1],
    ];
    const faces: [number, number, number, [number, number, number]][] = [
      [0, 2, 1, [0, 0, -1]], [0, 3, 2, [0, 0, -1]],
      [4, 5, 6, [0, 0, 1]], [4, 6, 7, [0, 0, 1]],
      [0, 1, 5, [0, -1, 0]], [0, 5, 4, [0, -1, 0]],
      [1, 2, 6, [1, 0, 0]], [1, 6, 5, [1, 0, 0]],
      [2, 3, 7, [0, 1, 0]], [2, 7, 6, [0, 1, 0]],
      [3, 0, 4, [-1, 0, 0]], [3, 4, 7, [-1, 0, 0]],
    ];
    for (const [a, b, c, n] of faces) {
      lines.push(`facet normal ${n.join(" ")}`, "outer loop");
      for (const k of [a, b, c]) lines.push(`vertex ${v[k].map((x) => x.toFixed(3)).join(" ")}`);
      lines.push("endloop", "endfacet");
    }
  };
  // Base plate.
  box(-unit, -unit, 0, cols * unit + unit, 7 * unit + unit, 3);
  days.forEach((d, i) => {
    if (d.count === 0) return;
    const { col, row } = cells[i];
    const x = col * unit;
    const y = (6 - row) * unit;
    box(x + 0.15, y + 0.15, 3, x + unit - 0.15, y + unit - 0.15, 3 + heightFor(d.count) * 3);
  });
  lines.push(`endsolid ${name}`);
  return lines.join("\n");
}

export async function fetchCalendar(user = GITHUB_USER): Promise<Day[]> {
  const res = await fetch(`https://github.com/users/${user}/contributions`, {
    headers: { "user-agent": "shehryartariq.vercel.app skyline", accept: "text/html" },
    signal: AbortSignal.timeout(8000),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`GitHub answered ${res.status}`);
  const days = parseCalendarHtml(await res.text());
  if (days.length < 300) throw new Error(`Only ${days.length} days in the calendar`);
  return days;
}
