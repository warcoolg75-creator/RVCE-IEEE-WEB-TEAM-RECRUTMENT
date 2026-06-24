import { useEffect, useRef } from "react";
import { useUIStore } from "@/store/ui";
import { CloseIcon } from "./icons";

interface Shortcut {
  keys: string[];
  label: string;
}
const GROUPS: { title: string; items: Shortcut[] }[] = [
  {
    title: "Global",
    items: [
      { keys: ["/"], label: "Focus search" },
      { keys: ["?"], label: "Show this help" },
      { keys: ["Esc"], label: "Clear search / close dialogs" },
      { keys: ["1"], label: "Go to Feed" },
      { keys: ["2"], label: "Go to Calendar" },
      { keys: ["3"], label: "Go to Bookmarks" },
      { keys: ["D"], label: "Toggle dark / light mode" },
    ],
  },
  {
    title: "Feed",
    items: [
      { keys: ["J"], label: "Focus next event" },
      { keys: ["K"], label: "Focus previous event" },
      { keys: ["Enter"], label: "Open focused event" },
      { keys: ["B"], label: "Bookmark focused event" },
      { keys: ["S"], label: "Copy share link of focused event" },
    ],
  },
  {
    title: "Event detail",
    items: [
      { keys: ["B"], label: "Toggle bookmark" },
      { keys: ["Backspace"], label: "Back to feed" },
    ],
  },
];

/** Keyboard-shortcuts help modal. Closes on Escape and traps focus while open. */
export function ShortcutsModal() {
  const open = useUIStore((s) => s.helpOpen);
  const setOpen = useUIStore((s) => s.setHelpOpen);
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      const focusables = panelRef.current?.querySelectorAll<HTMLElement>(
        'button, [href], input, [tabindex]:not([tabindex="-1"])'
      );
      if (!focusables || focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[70] grid place-items-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Keyboard shortcuts"
    >
      <div className="absolute inset-0 bg-black/40 animate-fade-in-fast" onClick={() => setOpen(false)} />
      <div
        ref={panelRef}
        className="relative z-10 w-full max-w-lg overflow-hidden rounded-2xl border border-border bg-surface-raised shadow-xl animate-slide-up"
      >
        <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-content">
            ⌨️ Keyboard shortcuts
          </h2>
          <button
            ref={closeRef}
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close"
            className="grid h-9 w-9 place-items-center rounded-full hover:bg-surface"
          >
            <CloseIcon width={18} height={18} />
          </button>
        </div>

        <div className="grid gap-6 p-5 sm:grid-cols-3">
          {GROUPS.map((g) => (
            <div key={g.title}>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-content-faint">
                {g.title}
              </h3>
              <ul className="space-y-2">
                {g.items.map((s) => (
                  <li key={s.label} className="flex items-center justify-between gap-3 text-sm">
                    <span className="text-content-muted">{s.label}</span>
                    <span className="flex shrink-0 gap-1">
                      {s.keys.map((k) => (
                        <kbd
                          key={k}
                          className="rounded border border-border bg-surface-subtle px-1.5 py-0.5 text-[11px] font-semibold text-content"
                        >
                          {k}
                        </kbd>
                      ))}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
