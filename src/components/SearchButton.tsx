"use client";

import { useSyncExternalStore } from "react";

const noop = () => () => {};

export function SearchButton() {
  const keys = useSyncExternalStore(
    noop,
    () => (/Mac|iPhone|iPad/.test(navigator.platform) ? "⌘ K" : "Ctrl K"),
    () => "Ctrl K",
  );
  return (
    <button
      type="button"
      className="search-btn"
      aria-haspopup="dialog"
      onClick={() => window.dispatchEvent(new Event("portfolio:palette"))}
    >
      <svg width="15" height="15" viewBox="0 0 16 16" aria-hidden="true">
        <g fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
          <circle cx="7" cy="7" r="4.75" />
          <path d="m10.5 10.5 3.5 3.5" />
        </g>
      </svg>
      Jump to
      <kbd>{keys}</kbd>
    </button>
  );
}
