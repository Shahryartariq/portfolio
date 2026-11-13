"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { applyTheme } from "./ThemeToggle";

export type PaletteItem = {
  id: string;
  label: string;
  hint: string;
  /** "#id" scrolls, "http…" opens in a new tab, "copy:" copies, "theme:" switches, "event:" fires a window event. */
  action: string;
  keywords?: string;
};

export function filterItems(items: PaletteItem[], query: string): PaletteItem[] {
  const q = query.trim().toLowerCase();
  if (!q) return items;
  const words = q.split(/\s+/);
  return items.filter((i) => {
    const hay = `${i.label} ${i.hint} ${i.keywords ?? ""}`.toLowerCase();
    return words.every((w) => hay.includes(w));
  });
}

export function CommandPalette({ items }: { items: PaletteItem[] }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const [note, setNote] = useState("");
  const listId = useId();

  const results = useMemo(() => filterItems(items, query), [items, query]);

  const open = useCallback(() => {
    const d = dialog.current;
    if (!d || d.open) return;
    setQuery("");
    setActive(0);
    setNote("");
    d.showModal();
    input.current?.focus();
  }, []);

  const close = useCallback(() => dialog.current?.close(), []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        if (dialog.current?.open) close();
        else open();
      }
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("portfolio:palette", open);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("portfolio:palette", open);
    };
  }, [open, close]);

  const run = async (item: PaletteItem) => {
    const a = item.action;
    if (a.startsWith("copy:")) {
      try {
        await navigator.clipboard.writeText(a.slice(5));
        setNote("Email copied");
      } catch {
        setNote("Couldn't copy. The address is " + a.slice(5));
      }
      return;
    }
    close();
    if (a.startsWith("#")) {
      document.getElementById(a.slice(1))?.scrollIntoView();
      history.replaceState(null, "", a);
    } else if (a.startsWith("event:")) {
      window.dispatchEvent(new Event(a.slice(6)));
    } else if (a.startsWith("theme:")) {
      applyTheme(a.slice(6) as "light" | "dark" | "system");
    } else {
      window.open(a, "_blank", "noopener,noreferrer");
    }
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => (results.length ? (i + 1) % results.length : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => (results.length ? (i - 1 + results.length) % results.length : 0));
    } else if (e.key === "Enter" && results[active]) {
      e.preventDefault();
      void run(results[active]);
    }
  };

  return (
    <dialog
      ref={dialog}
      className="palette"
      aria-label="Jump to a section, project or link"
      onClick={(e) => {
        if (e.target === dialog.current) close();
      }}
    >
      <input
        ref={input}
        type="text"
        role="combobox"
        aria-expanded="true"
        aria-controls={listId}
        aria-activedescendant={results[active] ? `${listId}-${results[active].id}` : undefined}
        aria-label="Search sections, projects and links"
        placeholder="Type a project, section or link"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setActive(0);
          setNote("");
        }}
        onKeyDown={onKeyDown}
        autoComplete="off"
        spellCheck={false}
      />
      {results.length ? (
        <ul id={listId} role="listbox">
          {results.map((item, i) => (
            <li
              key={item.id}
              id={`${listId}-${item.id}`}
              role="option"
              aria-selected={i === active}
              onMouseMove={() => setActive(i)}
              onClick={() => void run(item)}
            >
              <span>{item.label}</span>
              <span className="hint">{item.hint}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="empty" id={listId} role="status">
          Nothing matches “{query}”. Try a project name like Satscope.
        </p>
      )}
      <p className="empty" role="status" aria-live="polite" hidden={!note}>
        {note}
      </p>
    </dialog>
  );
}
