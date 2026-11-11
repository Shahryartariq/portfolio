import { describe, expect, it, vi } from "vitest";

vi.mock("next/cache", () => ({ unstable_cache: (fn: unknown) => fn }));

import { chainData } from "@/data/chain";
import { DIFFICULTY, GENESIS_PREV, getChain, mineChain, payload, sha256, verifyChain } from "@/lib/chain";
import { month, short, span } from "@/lib/chain-core";
import { verifyInBrowser } from "@/components/VerifyChain";

const confirmed = chainData.filter((d) => !d.pending);
const blocks = mineChain(confirmed);

describe("career chain", () => {
  it("mines every confirmed entry into a block", () => {
    expect(blocks).toHaveLength(confirmed.length);
    blocks.forEach((b, i) => expect(b.height).toBe(i));
  });

  it("meets the difficulty and links each block to the one before", () => {
    expect(blocks[0].prev).toBe(GENESIS_PREV);
    blocks.forEach((b, i) => {
      expect(b.hash.startsWith("0".repeat(DIFFICULTY))).toBe(true);
      if (i > 0) expect(b.prev).toBe(blocks[i - 1].hash);
    });
    expect(verifyChain(blocks)).toBe(-1);
  });

  it("is deterministic", () => {
    expect(mineChain(confirmed).map((b) => b.hash)).toEqual(blocks.map((b) => b.hash));
  });

  it("detects an edited entry", () => {
    const tampered = blocks.map((b) => ({ ...b }));
    tampered[2] = { ...tampered[2], summary: "Graduated with ten gold medals." };
    expect(verifyChain(tampered)).toBe(2);
  });

  it("detects a re-mined block that breaks the next link", () => {
    const [first, ...rest] = mineChain([{ ...confirmed[0], title: "Changed" }, ...confirmed.slice(1)]);
    expect(verifyChain([first, ...blocks.slice(1)])).toBe(1);
    expect(rest).toHaveLength(confirmed.length - 1);
  });

  it("keeps pending entries out of the chain", async () => {
    const chain = await getChain();
    expect(chain.blocks.every((b) => !b.pending)).toBe(true);
    expect(chain.pending.every((d) => d.pending)).toBe(true);
  });

  it("hashes the same text in the browser as on the server", async () => {
    expect(await verifyInBrowser(blocks)).toBe(-1);
    const b = blocks[3];
    expect(sha256(payload(b, b.height, b.prev, b.nonce))).toBe(b.hash);
  });

  it("formats dates and hashes", () => {
    expect(month("2023-06")).toBe("Jun 2023");
    expect(span("2025-02", "2025-09")).toBe("Feb 2025 to Sep 2025");
    expect(span("2020-04", null)).toBe("Apr 2020 to now");
    expect(short("0000abcdef0123456789")).toBe("0000abcdef…456789");
  });
});
