"use client";

import { useRef, useState } from "react";

/** Selects the address on the page, so Ctrl/Cmd+C still works when the clipboard is blocked. */
function selectAddress(email: string) {
  const link = Array.from(document.querySelectorAll<HTMLAnchorElement>("a.contact-mail")).find(
    (a) => a.textContent?.trim() === email,
  );
  if (!link) return false;
  const range = document.createRange();
  range.selectNodeContents(link);
  const sel = window.getSelection();
  sel?.removeAllRanges();
  sel?.addRange(range);
  return true;
}

export function CopyEmail({ email }: { email: string }) {
  const [state, setState] = useState<"idle" | "copied" | "selected" | "failed">("idle");
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const show = (next: typeof state) => {
    setState(next);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setState("idle"), next === "copied" ? 2000 : 6000);
  };

  return (
    <button
      type="button"
      className="btn js-only"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(email);
          show("copied");
        } catch {
          show(selectAddress(email) ? "selected" : "failed");
        }
      }}
    >
      <span aria-live="polite">
        {state === "copied"
          ? "Copied"
          : state === "selected"
            ? "Couldn\u2019t copy. Address selected"
            : state === "failed"
              ? "Couldn\u2019t copy"
              : "Copy email"}
      </span>
    </button>
  );
}
