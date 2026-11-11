"use client";

import { useEffect, useRef, useState } from "react";
import type { BlockData } from "@/data/chain";
import { span, type Block } from "@/lib/chain-core";
import { Hash } from "./Hash";
import { verifyInBrowser } from "./verify";

const TX_LABEL: Record<BlockData["kind"], [string, string]> = {
  job: ["project", "projects"],
  build: ["project", "projects"],
  study: ["highlight", "highlights"],
  freelance: ["highlight", "highlights"],
};

type Check = "idle" | "checking" | "ok" | "bad";

/** An isometric block. Faces use theme colours so it works in both themes. */
function Cube({ label, sub, pending }: { label: string; sub: string; pending?: boolean }) {
  return (
    <svg className="cube" viewBox="0 0 120 112" aria-hidden="true" data-pending={pending || undefined}>
      <polygon className="cube-top" points="60,4 112,32 60,60 8,32" />
      <polygon className="cube-left" points="8,32 60,60 60,108 8,80" />
      <polygon className="cube-right" points="112,32 60,60 60,108 112,80" />
      <text className="cube-label" x="34" y="59" textAnchor="middle" transform="skewY(28.3)">
        {label}
      </text>
      <text className="cube-sub" x="86" y="118" textAnchor="middle" transform="skewY(-28.3)">
        {sub}
      </text>
    </svg>
  );
}

function Details({ block }: { block: Block }) {
  const [one, many] = TX_LABEL[block.kind];
  return (
    <>
      <div className="block-main">
        <div className="block-top">
          <h3 className="block-org">{block.org}</h3>
          <p className="block-when">{span(block.start, block.end)}</p>
        </div>
        <p className="block-title">
          {block.title}
          <span className="dim">, {block.place}</span>
        </p>
        <p className="block-summary">{block.summary}</p>
      </div>
      {block.txs.length > 0 && (
        <div className="txs">
          <p className="txs-head">
            {block.txs.length} {block.txs.length === 1 ? one : many}
          </p>
          <ol>
            {block.txs.map((tx) => (
              <li key={tx.title}>
                <p className="tx-title">
                  {tx.href ? (
                    <a href={tx.href} target="_blank" rel="noopener">
                      {tx.title}
                    </a>
                  ) : (
                    tx.title
                  )}
                </p>
                {tx.detail && <p className="tx-detail">{tx.detail}</p>}
              </li>
            ))}
          </ol>
        </div>
      )}
      <dl className="block-proof">
        <div>
          <dt>Hash</dt>
          <dd>
            <Hash value={block.hash} />
          </dd>
        </div>
        <div>
          <dt>Previous</dt>
          <dd>
            <Hash value={block.prev} />
          </dd>
        </div>
        <div>
          <dt>Nonce</dt>
          <dd className="mono">{block.nonce.toLocaleString("en-US")}</dd>
        </div>
      </dl>
    </>
  );
}

export function BlockExplorer({ blocks, pending }: { blocks: Block[]; pending: BlockData[] }) {
  const tip = blocks[blocks.length - 1];
  const [selected, setSelected] = useState(tip.height);
  const [checks, setChecks] = useState<Check[]>(() => blocks.map(() => "idle"));
  const [result, setResult] = useState("");
  const strip = useRef<HTMLDivElement>(null);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);

  // Start scrolled to the newest block, like a block explorer.
  useEffect(() => {
    const s = strip.current;
    if (s) s.scrollLeft = s.scrollWidth;
  }, []);

  const select = (h: number, focus = false) => {
    setSelected(h);
    const el = tabs.current[h];
    if (focus) el?.focus();
    el?.scrollIntoView({ block: "nearest", inline: "nearest" });
  };

  const onKey = (e: React.KeyboardEvent, h: number) => {
    const last = blocks.length - 1;
    const next = { ArrowRight: h + 1, ArrowLeft: h - 1, Home: 0, End: last }[e.key];
    if (next === undefined) return;
    e.preventDefault();
    select(Math.max(0, Math.min(last, next)), true);
  };

  const verify = async () => {
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const t0 = performance.now();
    setResult("");
    setChecks(blocks.map(() => "checking"));
    const broken = await verifyInBrowser(blocks);
    const ms = Math.max(1, Math.round(performance.now() - t0));
    // Light the links up one after another so you can watch it propagate.
    for (let i = 0; i < blocks.length; i++) {
      const state: Check = broken === -1 || i < broken ? "ok" : "bad";
      setChecks((c) => c.map((v, j) => (j === i ? state : v)));
      if (!still) await new Promise((r) => setTimeout(r, 110));
    }
    setResult(
      broken === -1
        ? `Valid. Your browser rehashed all ${blocks.length} blocks in ${ms} ms and every link matches.`
        : `Block ${broken} doesn't match its hash. The chain is broken from there on.`,
    );
  };

  const allOk = checks.every((c) => c === "ok");

  return (
    <div className="explorer">
      <div className="explorer-bar">
        <button type="button" className="btn" onClick={verify} disabled={checks.some((c) => c === "checking")}>
          {checks.some((c) => c === "checking") ? "Checking…" : allOk ? "Verify again" : "Verify the chain"}
        </button>
        <p className="verify-result" role="status" aria-live="polite" data-state={allOk ? "ok" : result ? "bad" : "idle"}>
          {result}
        </p>
        <p className="explorer-hint dim">Pick a block to see what&rsquo;s inside.</p>
      </div>

      <div className="strip" ref={strip}>
        <div className="strip-track">
          <div className="strip-tabs" role="tablist" aria-label="Career blocks, oldest to newest">
          {blocks.map((b, i) => (
            <div
              className="slot"
              role="presentation"
              key={b.hash}
              data-check={checks[i]}
              style={{ "--i": i } as React.CSSProperties}
            >
              {i > 0 && <span className="link" aria-hidden="true" data-check={checks[i]} />}
              <button
                ref={(el) => {
                  tabs.current[b.height] = el;
                }}
                type="button"
                role="tab"
                id={`tab-${b.height}`}
                aria-selected={selected === b.height}
                aria-controls={`block-panel-${b.height}`}
                tabIndex={selected === b.height ? 0 : -1}
                className="slot-btn"
                data-tip={b.hash === tip.hash || undefined}
                onClick={() => select(b.height)}
                onKeyDown={(e) => onKey(e, b.height)}
              >
                <Cube label={`#${b.height}`} sub={b.hash.slice(0, 6)} />
                <span className="slot-org">{b.org}</span>
                <span className="slot-year">{b.start.slice(0, 4)}</span>
              </button>
            </div>
          ))}
          </div>
          {pending.map((p) => (
            <div className="slot slot-pending" key={p.id} data-testid="pending-block">
              <span className="link link-pending" aria-hidden="true" />
              <div className="slot-btn" aria-label={`${p.title}: pending, not mined yet`}>
                <Cube label="?" sub="mempool" pending />
                <span className="slot-org">{p.title}</span>
                <span className="slot-year">Pending</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Every block's panel is in the page (good for search engines); only the selected one shows. */}
      {blocks.map((b) => (
        <div
          key={b.hash}
          className="block-card panel"
          id={`block-panel-${b.height}`}
          role="tabpanel"
          aria-labelledby={`tab-${b.height}`}
          data-height={b.height}
          hidden={b.height !== selected}
        >
          <p className="panel-height" aria-hidden="true">
            #{b.height}
          </p>
          <Details block={b} />
        </div>
      ))}
    </div>
  );
}

