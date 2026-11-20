import { unstable_cache } from "next/cache";
import { projects } from "@/data/projects";

export type SiteStatus = {
  slug: string;
  state: "up" | "slow" | "down";
  /** Response time in ms, or null when the site didn't answer. */
  ms: number | null;
  checkedAt: string;
};

const TIMEOUT_MS = 6000;
const SLOW_MS = 2500;

/**
 * Whether a response means the site is serving visitors. A 404 or 410 means the
 * deployment is gone, so it is down. 401, 403 and 429 mean the site answered but
 * turned this automated check away, which still counts as reachable.
 */
export function reachable(status: number): boolean {
  if (status >= 200 && status < 400) return true;
  return status === 401 || status === 403 || status === 429;
}

export function classify(ok: boolean, ms: number | null): SiteStatus["state"] {
  if (!ok || ms === null) return "down";
  return ms > SLOW_MS ? "slow" : "up";
}

async function check(slug: string, url: string): Promise<SiteStatus> {
  const started = performance.now();
  let ok = false;
  let ms: number | null = null;
  try {
    const res = await fetch(url, {
      method: "GET",
      redirect: "follow",
      cache: "no-store",
      signal: AbortSignal.timeout(TIMEOUT_MS),
      headers: { "user-agent": "shehryartariq.vercel.app status check" },
    });
    ms = Math.round(performance.now() - started);
    ok = reachable(res.status);
  } catch {
    ok = false;
  }
  return { slug, state: classify(ok, ms), ms: ok ? ms : null, checkedAt: new Date().toISOString() };
}

/** Sample data for tests and for builds without network access. */
function sample(): SiteStatus[] {
  const times = [182, 240, 311, 205, 158, 274, 390];
  return projects.map((p, i) => ({
    slug: p.slug,
    state: "up",
    ms: times[i % times.length],
    checkedAt: "2026-11-11T07:00:00.000Z",
  }));
}

const checkAll = unstable_cache(
  async () => Promise.all(projects.map((p) => check(p.slug, p.url))),
  ["site-status-v1"],
  { revalidate: 300 },
);

export async function getStatuses(): Promise<Record<string, SiteStatus>> {
  const list = process.env.STATUS_SAMPLE_DATA === "1" ? sample() : await checkAll();
  return Object.fromEntries(list.map((s) => [s.slug, s]));
}
