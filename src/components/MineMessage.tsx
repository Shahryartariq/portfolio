"use client";

import { useEffect, useRef, useState } from "react";
import { mailto, type MessageBlock, type MinerIn, type MinerOut } from "@/lib/mine-message";
import { DIFFICULTY } from "@/lib/chain-core";

type State =
  | { step: "write" }
  | { step: "mining"; nonce: number; rate: number; hash: string }
  | { step: "mined"; nonce: number; hash: string; ms: number; block: MessageBlock };

function Zeros({ hash }: { hash: string }) {
  return (
    <span className="mono">
      <span className="zeros">{hash.slice(0, DIFFICULTY)}</span>
      {hash.slice(DIFFICULTY)}
    </span>
  );
}

/**
 * Contact form that mines the visitor's message as the next block on top of
 * the career chain, in a Web Worker, then hands it to their email app.
 */
export function MineMessage({ to, prev, height }: { to: string; prev: string; height: number }) {
  const [state, setState] = useState<State>({ step: "write" });
  const [error, setError] = useState("");
  const worker = useRef<Worker | null>(null);

  useEffect(() => () => worker.current?.terminate(), []);

  const stop = () => {
    worker.current?.terminate();
    worker.current = null;
    setState({ step: "write" });
  };

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const from = String(f.get("from") ?? "").trim();
    const message = String(f.get("message") ?? "").trim();
    const email = String(f.get("email") ?? "").trim();
    if (!from || !message) {
      setError(!from ? "Add your name so I know who the block is from." : "Write a message to mine.");
      return;
    }
    setError("");
    const block: MessageBlock = { height, prev, from, email, message, time: new Date().toISOString() };
    worker.current?.terminate();
    const w = new Worker(new URL("../lib/miner.worker.ts", import.meta.url), { type: "module" });
    worker.current = w;
    setState({ step: "mining", nonce: 0, rate: 0, hash: "" });
    w.onmessage = (ev: MessageEvent<MinerOut>) => {
      const d = ev.data;
      if (d.type === "progress") setState({ step: "mining", nonce: d.nonce, rate: d.rate, hash: d.hash });
      else {
        setState({ step: "mined", nonce: d.nonce, hash: d.hash, ms: d.ms, block });
        w.terminate();
        worker.current = null;
      }
    };
    w.onerror = () => {
      setError("Mining stopped in this browser. You can still email me directly.");
      setState({ step: "write" });
    };
    const job: MinerIn = { block };
    w.postMessage(job);
  };

  if (state.step === "mined") {
    return (
      <div className="miner miner-done" data-testid="mined">
        <p className="miner-title">Proof of work done</p>
        <p className="dim">
          Your browser tried {state.nonce.toLocaleString("en-US")} hashes in {(state.ms / 1000).toFixed(1)} s to find one
          starting with {"0".repeat(DIFFICULTY)}. Your message is now step #{state.block.height}.
        </p>
        <dl className="miner-stats">
          <div>
            <dt>Hash</dt>
            <dd>
              <Zeros hash={state.hash} />
            </dd>
          </div>
          <div>
            <dt>Previous</dt>
            <dd>
              <Zeros hash={state.block.prev} />
            </dd>
          </div>
        </dl>
        <p className="actions">
          <a className="btn btn-primary" href={mailto(to, state.block, state.nonce, state.hash)}>
            Send it by email
          </a>
          <button type="button" className="btn" onClick={() => setState({ step: "write" })}>
            Write another
          </button>
        </p>
      </div>
    );
  }

  const mining = state.step === "mining";
  return (
    <form className="miner" onSubmit={onSubmit} noValidate aria-busy={mining}>
      <p className="miner-title">Or send a message with proof of work</p>
      <p className="dim">
        Before your email app opens, your browser does a second or two of SHA-256 work on the message. It&rsquo;s
        Hashcash, the anti-spam idea Bitcoin later borrowed, and it links your message to my timeline as step #{height}.
      </p>
      <div className="field-row">
        <label className="field">
          <span>Your name</span>
          <input name="from" autoComplete="name" required disabled={mining} maxLength={80} />
        </label>
        <label className="field">
          <span>
            Your email <span className="dim">(optional)</span>
          </span>
          <input name="email" type="email" autoComplete="email" disabled={mining} maxLength={120} />
        </label>
      </div>
      <label className="field">
        <span>Message</span>
        <textarea name="message" rows={4} required disabled={mining} maxLength={2000} />
      </label>
      {error && (
        <p className="field-error" role="alert">
          {error}
        </p>
      )}
      {mining ? (
        <div className="miner-live" role="status" aria-live="off">
          <p>
            <span className="mono">nonce {state.nonce.toLocaleString("en-US")}</span>
            <span className="mono dim">{state.rate.toLocaleString("en-US")} hashes/s</span>
          </p>
          <p className="mono miner-try" aria-hidden="true">
            {state.hash || "…"}
          </p>
          <button type="button" className="btn" onClick={stop}>
            Stop
          </button>
        </div>
      ) : (
        <p className="actions">
          <button type="submit" className="btn btn-primary">
            Do the work and send
          </button>
        </p>
      )}
    </form>
  );
}
