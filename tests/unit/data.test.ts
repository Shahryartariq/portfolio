import { describe, expect, it, vi } from "vitest";

vi.mock("next/cache", () => ({ unstable_cache: (fn: unknown) => fn }));

import { filterItems, type PaletteItem } from "@/components/CommandPalette";
import { chainData } from "@/data/chain";
import { clients } from "@/data/clients";
import { projects } from "@/data/projects";
import { classify, getStatuses } from "@/lib/status";

describe("content", () => {
  it("has unique project slugs with https links", () => {
    expect(new Set(projects.map((p) => p.slug)).size).toBe(projects.length);
    for (const p of projects) {
      expect(p.url).toMatch(/^https:\/\//);
      expect(p.repo).toMatch(/^https:\/\/github\.com\/Shahryartariq\/[a-z]+$/);
    }
    expect(projects.filter((p) => p.featured)).toHaveLength(2);
  });

  it("has valid, ordered dates in the chain", () => {
    for (const d of chainData) {
      expect(d.start).toMatch(/^\d{4}-(0[1-9]|1[0-2])$/);
      if (d.end) expect(d.end >= d.start).toBe(true);
    }
    const starts = chainData.map((d) => d.start);
    expect([...starts].sort()).toEqual(starts);
  });

  it("never links internal client tools", () => {
    expect(clients.find((c) => c.slug === "lc")?.href).toBeUndefined();
    expect(JSON.stringify([clients, chainData])).not.toMatch(/srbtest|ameeqcode\.com/);
  });
});

describe("status", () => {
  it("classifies responses", () => {
    expect(classify(true, 200)).toBe("up");
    expect(classify(true, 4000)).toBe("slow");
    expect(classify(false, 200)).toBe("down");
    expect(classify(true, null)).toBe("down");
  });

  it("returns one status per project from sample data", async () => {
    process.env.STATUS_SAMPLE_DATA = "1";
    const s = await getStatuses();
    expect(Object.keys(s).sort()).toEqual(projects.map((p) => p.slug).sort());
  });
});

describe("command palette search", () => {
  const items: PaletteItem[] = [
    { id: "a", label: "Satscope", hint: "Open live site", action: "https://x", keywords: "bitcoin" },
    { id: "b", label: "Projects", hint: "Section", action: "#projects" },
  ];
  it("matches label, hint and keywords, all words", () => {
    expect(filterItems(items, "")).toHaveLength(2);
    expect(filterItems(items, "bitcoin").map((i) => i.id)).toEqual(["a"]);
    expect(filterItems(items, "sat live").map((i) => i.id)).toEqual(["a"]);
    expect(filterItems(items, "SECTION").map((i) => i.id)).toEqual(["b"]);
    expect(filterItems(items, "nothing")).toEqual([]);
  });
});
