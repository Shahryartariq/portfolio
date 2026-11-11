/// <reference lib="webworker" />
import { MESSAGE_DIFFICULTY, messagePayload, type MinerIn, type MinerOut } from "./mine-message";

const encoder = new TextEncoder();
const target = "0".repeat(MESSAGE_DIFFICULTY);

function hex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, "0")).join("");
}

self.onmessage = async (e: MessageEvent<MinerIn>) => {
  const { block } = e.data;
  const started = performance.now();
  let lastReport = started;
  let lastNonce = 0;
  for (let nonce = 0; ; nonce++) {
    const hash = hex(await crypto.subtle.digest("SHA-256", encoder.encode(messagePayload(block, nonce))));
    if (hash.startsWith(target)) {
      const out: MinerOut = { type: "found", nonce, hash, ms: Math.round(performance.now() - started) };
      self.postMessage(out);
      return;
    }
    const now = performance.now();
    if (now - lastReport > 120) {
      const rate = Math.round(((nonce - lastNonce) * 1000) / (now - lastReport));
      const out: MinerOut = { type: "progress", nonce, rate, hash };
      self.postMessage(out);
      lastReport = now;
      lastNonce = nonce;
    }
  }
};
