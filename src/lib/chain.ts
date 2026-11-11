import { createHash } from "node:crypto";
import type { BlockData } from "@/data/chain";
import { DIFFICULTY, GENESIS_PREV, payload, type Block } from "./chain-core";

export { DIFFICULTY, GENESIS_PREV, payload, type Block };

const target = "0".repeat(DIFFICULTY);

export function sha256(text: string): string {
  return createHash("sha256").update(text).digest("hex");
}

export function mineBlock(data: BlockData, height: number, prev: string): Block {
  for (let nonce = 0; ; nonce++) {
    const hash = sha256(payload(data, height, prev, nonce));
    if (hash.startsWith(target)) return { ...data, height, prev, nonce, hash };
  }
}

export function mineChain(entries: BlockData[]): Block[] {
  const blocks: Block[] = [];
  let prev = GENESIS_PREV;
  entries.forEach((entry, height) => {
    const block = mineBlock(entry, height, prev);
    blocks.push(block);
    prev = block.hash;
  });
  return blocks;
}

/** Returns the height of the first broken block, or -1 if the chain is valid. */
export function verifyChain(blocks: Block[]): number {
  let prev = GENESIS_PREV;
  for (const b of blocks) {
    const hash = sha256(payload(b, b.height, b.prev, b.nonce));
    if (b.prev !== prev || hash !== b.hash || !hash.startsWith(target)) return b.height;
    prev = b.hash;
  }
  return -1;
}

let cached: { blocks: Block[]; pending: BlockData[] } | undefined;

/** Confirmed entries are mined into blocks; pending ones wait outside the chain. */
export async function getChain() {
  const { chainData } = await import("@/data/chain");
  cached ??= {
    blocks: mineChain(chainData.filter((d) => !d.pending)),
    pending: chainData.filter((d) => d.pending),
  };
  return cached;
}
