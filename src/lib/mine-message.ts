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

/** Longest message the form accepts. Keeps the mailto link short enough for desktop mail apps. */
export const MESSAGE_MAX = 1500;

/** Loose check for an optional reply address: something@something.tld, no spaces. */
export function looksLikeEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function subjectFor(m: MessageBlock): string {
  return `Message from ${m.from}`;
}

export function bodyFor(m: MessageBlock, nonce: number, hash: string): string {
  return [
    m.message,
    "",
    "Sent from your portfolio with proof of work:",
    `  step   ${m.height}`,
    `  hash   ${hash}`,
    `  prev   ${m.prev}`,
    `  nonce  ${nonce}`,
    `  time   ${m.time}`,
    m.email ? `  reply  ${m.email}` : "",
  ]
    .filter((l, i, a) => !(l === "" && i === a.length - 1))
    .join("\n");
}

export function mailto(to: string, m: MessageBlock, nonce: number, hash: string): string {
  return `mailto:${to}?subject=${encodeURIComponent(subjectFor(m))}&body=${encodeURIComponent(bodyFor(m, nonce, hash))}`;
}

/** The same email as plain text, for visitors whose browser has no mail app to open. */
export function asText(to: string, m: MessageBlock, nonce: number, hash: string): string {
  return [`To: ${to}`, `Subject: ${subjectFor(m)}`, "", bodyFor(m, nonce, hash)].join("\n");
}
