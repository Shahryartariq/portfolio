/** A visitor's message, shaped as the next block on top of the career chain. */
export type MessageBlock = {
  height: number;
  prev: string;
  from: string;
  email: string;
  message: string;
  time: string;
};

export const MESSAGE_DIFFICULTY = 4;

export function messagePayload(m: MessageBlock, nonce: number): string {
  return JSON.stringify({
    height: m.height,
    prev: m.prev,
    nonce,
    data: { from: m.from, email: m.email, message: m.message, time: m.time },
  });
}

export type MinerIn = { block: MessageBlock };
export type MinerOut =
  | { type: "progress"; nonce: number; rate: number; hash: string }
  | { type: "found"; nonce: number; hash: string; ms: number };

export function mailto(to: string, m: MessageBlock, nonce: number, hash: string): string {
  const subject = `Block #${m.height} from ${m.from}`;
  const body = [
    m.message,
    "",
    "Mined on your portfolio:",
    `  height ${m.height}`,
    `  hash   ${hash}`,
    `  prev   ${m.prev}`,
    `  nonce  ${nonce}`,
    `  time   ${m.time}`,
    m.email ? `  reply  ${m.email}` : "",
  ]
    .filter((l, i, a) => !(l === "" && i === a.length - 1))
    .join("\n");
  return `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
