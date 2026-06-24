import { useEffect, useRef, useState } from "react";
import { useDebounce } from "@/hooks/useDebounce";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { SearchIcon, CloseIcon } from "./icons";

const RECENTS_KEY = "rvce-recent-searches";
const MAX_RECENTS = 5;

/**
 * Debounced (300ms) search input. Keeps a snappy local value and pushes the
 * debounced result up. Pressing "/" focuses it; Escape clears/blurs. Shows the
 * last 5 searches in a dropdown when focused (persisted to localStorage).
 */
export function SearchBar({
  value,
  onChange,
  placeholder = "Search events, clubs, tags…",
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  const [local, setLocal] = useState(value);
  const debounced = useDebounce(local, 300);
  const inputRef = useRef<HTMLInputElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const lastPushed = useRef(value);
  const [open, setOpen] = useState(false);
  const [recents, setRecents] = useLocalStorage<string[]>(RECENTS_KEY, []);

  // Push debounced changes up.
  useEffect(() => {
    if (debounced !== lastPushed.current) {
      lastPushed.current = debounced;
      onChange(debounced);
    }
  }, [debounced, onChange]);

  // Sync down when the external value changes (e.g. reset / URL nav).
  useEffect(() => {
    if (value !== lastPushed.current) {
      lastPushed.current = value;
      setLocal(value);
    }
  }, [value]);

  // Global "/" shortcut to focus.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "/" || e.ctrlKey || e.metaKey || e.altKey) return;
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || (e.target as HTMLElement)?.isContentEditable)
        return;
      e.preventDefault();
      inputRef.current?.focus();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Close the recents dropdown on outside click.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  const commit = (term: string) => {
    const t = term.trim();
    if (t.length < 2) return;
    setRecents((prev) => [t, ...prev.filter((r) => r.toLowerCase() !== t.toLowerCase())].slice(0, MAX_RECENTS));
  };

  const applyRecent = (term: string) => {
    setLocal(term);
    lastPushed.current = term;
    onChange(term);
    commit(term);
    setOpen(false);
    inputRef.current?.blur();
  };

  const showRecents = open && local.trim() === "" && recents.length > 0;

  return (
    <div ref={wrapRef} className="relative">
      <SearchIcon
        width={18}
        height={18}
        aria-hidden="true"
        className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-content-faint"
      />
      <input
        ref={inputRef}
        type="search"
        value={local}
        onChange={(e) => setLocal(e.target.value)}
        onFocus={() => setOpen(true)}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            setLocal("");
            setOpen(false);
            inputRef.current?.blur();
          } else if (e.key === "Enter") {
            commit(local);
            setOpen(false);
          }
        }}
        onBlur={() => commit(local)}
        placeholder={placeholder}
        aria-label="Search events"
        autoComplete="off"
        className="input-base pl-11 pr-16 transition-all duration-200 focus:ring-2 focus:ring-brand/35 focus:shadow-[0_0_0_4px_rgb(var(--brand)/0.12)]"
      />
      {local ? (
        <button
          type="button"
          onClick={() => {
            setLocal("");
            inputRef.current?.focus();
          }}
          aria-label="Clear search"
          className="absolute right-3 top-1/2 -translate-y-1/2 text-content-faint hover:text-content"
        >
          <CloseIcon width={16} height={16} aria-hidden="true" />
        </button>
      ) : (
        <kbd className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 rounded border border-border bg-surface-subtle px-1.5 py-0.5 text-[11px] font-medium text-content-faint sm:block">
          /
        </kbd>
      )}

      {showRecents && (
        <div className="absolute z-40 mt-1.5 w-full overflow-hidden rounded-xl border border-border bg-surface-raised p-1 shadow-xl animate-fade-in-fast">
          <div className="flex items-center justify-between px-2 py-1">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-content-faint">
              Recent searches
            </span>
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                setRecents([]);
              }}
              className="text-[11px] font-medium text-brand hover:underline"
            >
              Clear
            </button>
          </div>
          <ul>
            {recents.map((r) => (
              <li key={r}>
                <button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    applyRecent(r);
                  }}
                  className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm text-content hover:bg-surface-subtle"
                >
                  <SearchIcon width={14} height={14} aria-hidden="true" className="text-content-faint" />
                  {r}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
