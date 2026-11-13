"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { complete, run, type TermData } from "@/lib/terminal";
import { applyTheme } from "./ThemeToggle";

type Line = { kind: "in" | "out"; text: string };

const PROMPT = "visitor@shehryar:~$";
const WELCOME: Line[] = [
  { kind: "out", text: "Welcome. This is the whole site as a command line." },
  { kind: "out", text: "Type help and press Enter. Esc closes it." },
];

export function TerminalButton() {
  return (
    <button
      type="button"
      className="icon-btn"
      aria-label="Open the terminal"
      title="Terminal (press `)"
      aria-haspopup="dialog"
      onClick={() => window.dispatchEvent(new Event("portfolio:terminal"))}
    >
      <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
        <g fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <path d="m3 4.5 3.5 3.5L3 11.5" />
          <path d="M8.5 12h4.5" />
        </g>
      </svg>
    </button>
  );
}

/** The site as a command line. Opens with the ` key or the header button. */
export function Terminal({ data }: { data: TermData }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const log = useRef<HTMLDivElement>(null);
  const [lines, setLines] = useState<Line[]>(WELCOME);
  const [value, setValue] = useState("");
  const history = useRef<string[]>([]);
  const cursor = useRef(0);

  const open = useCallback(() => {
    const d = dialog.current;
    if (!d || d.open) return;
    d.showModal();
    input.current?.focus();
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "`" || e.ctrlKey || e.metaKey || e.altKey) return;
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
      e.preventDefault();
      open();
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("portfolio:terminal", open);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("portfolio:terminal", open);
    };
  }, [open]);

  useEffect(() => {
    log.current?.scrollTo(0, log.current.scrollHeight);
  }, [lines]);

  const submit = () => {
    const text = value;
    setValue("");
    if (text.trim()) history.current.push(text);
    cursor.current = history.current.length;
    const res = run(text, data);
    const a = res.action;
    if (a?.type === "clear") {
      setLines([]);
      return;
    }
    setLines((l) => [...l, { kind: "in", text }, ...res.lines.map((t) => ({ kind: "out" as const, text: t }))]);
    if (!a) return;
    if (a.type === "exit") dialog.current?.close();
    else if (a.type === "theme") applyTheme(a.theme);
    else if (a.type === "open") {
      if (a.url.startsWith("mailto:")) window.location.href = a.url;
      else window.open(a.url, "_blank", "noopener,noreferrer");
    } else if (a.type === "goto") {
      dialog.current?.close();
      document.getElementById(a.id)?.scrollIntoView();
      window.history.replaceState(null, "", `#${a.id}`);
    }
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      submit();
    } else if (e.key === "Tab") {
      e.preventDefault();
      setValue(complete(value, data));
    } else if (e.key === "ArrowUp" || e.key === "ArrowDown") {
      e.preventDefault();
      const h = history.current;
      cursor.current = Math.max(0, Math.min(h.length, cursor.current + (e.key === "ArrowUp" ? -1 : 1)));
      setValue(h[cursor.current] ?? "");
    } else if (e.key === "l" && e.ctrlKey) {
      e.preventDefault();
      setLines([]);
    }
  };

  return (
    <dialog
      ref={dialog}
      className="terminal"
      aria-label="Terminal"
      onClick={(e) => {
        if (e.target === dialog.current) dialog.current?.close();
        else input.current?.focus();
      }}
    >
      <div className="terminal-bar">
        <span>shehryar: terminal</span>
        <button type="button" onClick={() => dialog.current?.close()} aria-label="Close the terminal">
          Esc
        </button>
      </div>
      <div className="terminal-log" ref={log} role="log" aria-live="polite">
        {lines.map((l, i) =>
          l.kind === "in" ? (
            <p key={i} className="terminal-in">
              <span className="terminal-prompt">{PROMPT}</span> {l.text}
            </p>
          ) : (
            <p key={i}>{l.text || " "}</p>
          ),
        )}
      </div>
      <label className="terminal-line">
        <span className="terminal-prompt" aria-hidden="true">
          {PROMPT}
        </span>
        <span className="sr-only">Command</span>
        <input
          ref={input}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={onKeyDown}
          autoComplete="off"
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck={false}
        />
      </label>
    </dialog>
  );
}
