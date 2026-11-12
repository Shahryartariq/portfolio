import { unstable_cache } from "next/cache";
import { fetchCalendar, parseSample, type Calendar } from "./contributions";

const live = unstable_cache(
  async (): Promise<Calendar> => ({ days: await fetchCalendar(), source: "live", fetchedAt: new Date().toISOString() }),
  ["github-calendar-v1"],
  { revalidate: 6 * 60 * 60 },
);

/** The contribution calendar, refreshed every 6 hours, or the saved snapshot if GitHub can't be reached. */
export async function getCalendar(): Promise<Calendar> {
  const snapshot = (): Calendar => ({ days: parseSample(), source: "snapshot", fetchedAt: "2026-11-12T20:00:00.000Z" });
  if (process.env.STATUS_SAMPLE_DATA === "1") return snapshot();
  try {
    return await live();
  } catch {
    return snapshot();
  }
}
