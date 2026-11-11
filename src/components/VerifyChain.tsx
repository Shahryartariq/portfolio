"use client";

import { useState } from "react";
import { DIFFICULTY, GENESIS_PREV, payload, type Block } from "@/lib/chain-core";

async function sha256(text: string): Promise<string> {
  const bytes = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(bytes), (b) => b.toString(16).padStart(2, "0")).join("");
}

/** Recomputes every hash in the visitor's own browser. */
export async function verifyInBrowser(blocks: Block[]): Promise<number> {
  let prev = GENESIS_PREV;
  for (const b of blocks) {
    const hash = await sha256(payload(b, b.height, b.prev, b.nonce));
    if (b.prev !== prev || hash !== b.hash || !hash.startsWith("0".repeat(DIFFICULTY))) return b.height;
    prev = hash;
  }
  return -1;
}

export function VerifyChain({ blocks }: { blocks: Block[] }) {
  const [state, setState] = useState<"idle" | "busy" | "ok" | "bad">("idle");
  const [msg, setMsg] = useState("");

  const run = async () => {
    setState("busy");
    const t0 = performance.now();
    try {
      const broken = await verifyInBrowser(blocks);
      const ms = Math.max(1, Math.round(performance.now() - t0));
      if (broken === -1) {
        setState("ok");
        setMsg(`Valid. Your browser rehashed all ${blocks.length} blocks in ${ms} ms and every link matches.`);
      } else {
        setState("bad");
        setMsg(`Block ${broken} doesn't match its hash. The chain is broken from there on.`);
      }
    } catch {
      setState("bad");
      setMsg("This browser can't run SHA-256 here. Try a recent Chrome, Firefox or Safari.");
    }
  };

  return (
    <div className="verify">
      <button type="button" className="btn" onClick={run} disabled={state === "busy"}>
        {state === "busy" ? "Checking…" : "Verify the chain"}
      </button>
      <p className="verify-result" role="status" aria-live="polite" data-state={state}>
        {msg}
      </p>
    </div>
  );
}
