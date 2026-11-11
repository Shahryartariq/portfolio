import type { BlockData } from "@/data/chain";

/** Hashes must start with this many zero hex digits. */
export const DIFFICULTY = 4;
export const GENESIS_PREV = "0".repeat(64);

export type Block = BlockData & {
  height: number;
  prev: string;
  nonce: number;
  hash: string;
};

/**
 * The exact text that gets hashed. Field order is fixed so the result is the
 * same on the server (node:crypto) and in the browser (Web Crypto).
 */
export function payload(data: BlockData, height: number, prev: string, nonce: number): string {
  const { id, kind, title, org, start, end, place, summary, txs, pending } = data;
  return JSON.stringify({
    height,
    prev,
    nonce,
    data: {
      id,
      kind,
      title,
      org,
      start,
      end,
      place,
      summary,
      txs: txs.map((t) => ({ title: t.title, detail: t.detail ?? null, href: t.href ?? null })),
      pending: pending ?? false,
    },
  });
}

export function short(hash: string, head = 10, tail = 6): string {
  return `${hash.slice(0, head)}…${hash.slice(-tail)}`;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function month(ym: string): string {
  const [y, m] = ym.split("-").map(Number);
  return `${MONTHS[m - 1]} ${y}`;
}

export function span(start: string, end: string | null): string {
  return `${month(start)} to ${end ? month(end) : "now"}`;
}
