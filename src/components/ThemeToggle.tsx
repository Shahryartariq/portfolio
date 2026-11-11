"use client";

import { useEffect, useSyncExternalStore } from "react";

type Theme = "system" | "light" | "dark";
const KEY = "portfolio:theme";
const NEXT: Record<Theme, Theme> = { system: "light", light: "dark", dark: "system" };
const LABEL: Record<Theme, string> = {
  system: "Theme: matches your device",
  light: "Theme: light",
  dark: "Theme: dark",
};

export function applyTheme(theme: Theme) {
  const root = document.documentElement;
  if (theme === "system") delete root.dataset.theme;
  else root.dataset.theme = theme;
  try {
    if (theme === "system") localStorage.removeItem(KEY);
    else localStorage.setItem(KEY, theme);
  } catch {}
  window.dispatchEvent(new CustomEvent("portfolio:theme", { detail: theme }));
}

export function readTheme(): Theme {
  try {
    const t = localStorage.getItem(KEY);
    if (t === "light" || t === "dark") return t;
  } catch {}
  return "system";
}

function subscribe(onChange: () => void) {
  window.addEventListener("portfolio:theme", onChange);
  return () => window.removeEventListener("portfolio:theme", onChange);
}

export function ThemeToggle() {
  const theme = useSyncExternalStore<Theme>(subscribe, readTheme, () => "system");

  // Another tab changed the theme: apply it here too.
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === KEY) applyTheme(readTheme());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  return (
    <button
      type="button"
      className="icon-btn"
      aria-label={`${LABEL[theme]}. Change theme`}
      title={LABEL[theme]}
      onClick={() => applyTheme(NEXT[theme])}
    >
      <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
        {theme === "light" ? (
          <g fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <circle cx="8" cy="8" r="3" />
            <path d="M8 1.5v1.5M8 13v1.5M1.5 8H3M13 8h1.5M3.4 3.4l1 1M11.6 11.6l1 1M3.4 12.6l1-1M11.6 4.4l1-1" />
          </g>
        ) : theme === "dark" ? (
          <path d="M13.5 9.6A5.8 5.8 0 0 1 6.4 2.5a5.8 5.8 0 1 0 7.1 7.1Z" fill="currentColor" />
        ) : (
          <g fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="8" cy="8" r="5.75" />
            <path d="M8 2.25v11.5A5.75 5.75 0 0 0 8 2.25Z" fill="currentColor" />
          </g>
        )}
      </svg>
    </button>
  );
}
