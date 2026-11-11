import { DIFFICULTY, GENESIS_PREV, payload, type Block } from "@/lib/chain-core";

export async function sha256Hex(text: string): Promise<string> {
  const bytes = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(bytes), (b) => b.toString(16).padStart(2, "0")).join("");
}

/** Recomputes every hash with Web Crypto. Returns the first broken height, or -1. */
export async function verifyInBrowser(blocks: Block[]): Promise<number> {
  let prev = GENESIS_PREV;
  for (const b of blocks) {
    const hash = await sha256Hex(payload(b, b.height, b.prev, b.nonce));
    if (b.prev !== prev || hash !== b.hash || !hash.startsWith("0".repeat(DIFFICULTY))) return b.height;
    prev = hash;
  }
  return -1;
}
