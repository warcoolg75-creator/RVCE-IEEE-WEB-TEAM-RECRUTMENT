import { useEffect, useRef, useState } from "react";
import { BRANCHES } from "@/utils/branchRelevance";
import {
  GraduationCapIcon,
  ChevronDownIcon,
  SearchIcon,
  CloseIcon,
  CheckIcon,
} from "./icons";

/**
 * Prominent "Recommended for your branch" selector with a searchable dropdown.
 * Shared by the Feed sidebar and the Calendar sidebar. Selecting a branch
 * highlights/sorts relevant events; the value is persisted by the parent.
 */
export function BranchFilter({
  value,
  onChange,
  recommendedCount,
  homeBranch,
}: {
  value: string;
  onChange: (branch: string) => void;
  recommendedCount?: number;
  /** The user's own branch (from their profile) — annotated as "Your branch". */
  homeBranch?: string | null;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  // Close on outside click / Escape.
  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  useEffect(() => {
    if (open) searchRef.current?.focus();
    else setQuery("");
  }, [open]);

  const filtered = query
    ? BRANCHES.filter((b) => b.toLowerCase().includes(query.toLowerCase()))
    : BRANCHES;

  const select = (branch: string) => {
    onChange(branch);
    setOpen(false);
  };

  return (
    <div className="rounded-2xl border border-brand/30 bg-brand-subtle/60 p-3">
      <div className="mb-2 flex items-center gap-2">
        <span className="grid h-7 w-7 place-items-center rounded-lg bg-brand text-brand-fg">
          <GraduationCapIcon width={16} height={16} />
        </span>
        <div className="leading-tight">
          <p className="text-sm font-semibold text-content">Recommended for you</p>
          <p className="text-[11px] text-content-muted">Pick your branch</p>
        </div>
        {value && (
          <button
            type="button"
            onClick={() => onChange("")}
            aria-label="Clear branch selection"
            title="Clear branch"
            className="ml-auto grid h-7 w-7 place-items-center rounded-full text-content-faint hover:bg-surface hover:text-content"
          >
            <CloseIcon width={15} height={15} />
          </button>
        )}
      </div>

      <div ref={rootRef} className="relative">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-haspopup="listbox"
          aria-expanded={open}
          className="flex w-full items-center justify-between rounded-xl border border-border bg-surface px-3.5 py-2.5 text-left text-sm text-content"
        >
          <span className={value ? "truncate" : "truncate text-content-faint"}>
            {value || "All Branches"}
          </span>
          <ChevronDownIcon
            width={16}
            height={16}
            className={`shrink-0 text-content-faint transition-transform ${open ? "rotate-180" : ""}`}
          />
        </button>

        {open && (
          <div
            role="listbox"
            className="absolute z-30 mt-1.5 w-full overflow-hidden rounded-xl border border-border bg-surface-raised shadow-xl animate-fade-in-fast"
          >
            <div className="relative border-b border-border-subtle p-2">
              <SearchIcon
                width={15}
                height={15}
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-content-faint"
              />
              <input
                ref={searchRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search branches…"
                aria-label="Search branches"
                className="input-base py-1.5 pl-8 text-sm"
              />
            </div>
            <ul className="max-h-64 overflow-y-auto p-1">
              <Option label="All Branches" selected={value === ""} onClick={() => select("")} muted />
              {filtered.map((b) => (
                <Option
                  key={b}
                  label={b}
                  selected={value === b}
                  isHome={homeBranch === b}
                  onClick={() => select(b)}
                />
              ))}
              {filtered.length === 0 && (
                <li className="px-2 py-2 text-xs text-content-faint">No branches match</li>
              )}
            </ul>
          </div>
        )}
      </div>

      {value && recommendedCount !== undefined && (
        <p className="mt-2 text-[11px] text-content-muted">
          <span className="font-semibold text-brand">{recommendedCount.toLocaleString()}</span>{" "}
          event{recommendedCount === 1 ? "" : "s"} recommended for you
        </p>
      )}
    </div>
  );
}

function Option({
  label,
  selected,
  onClick,
  muted = false,
  isHome = false,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
  muted?: boolean;
  isHome?: boolean;
}) {
  return (
    <li>
      <button
        type="button"
        role="option"
        aria-selected={selected}
        onClick={onClick}
        className={`flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm hover:bg-surface-subtle ${
          selected ? "text-brand" : muted ? "text-content-muted" : "text-content"
        }`}
      >
        <span className="grid h-4 w-4 shrink-0 place-items-center">
          {selected && <CheckIcon width={13} height={13} strokeWidth={3} />}
        </span>
        <span className="truncate">{label}</span>
        {isHome && (
          <span className="ml-auto shrink-0 rounded-full bg-brand/15 px-1.5 text-[10px] font-semibold text-brand">
            Your branch
          </span>
        )}
      </button>
    </li>
  );
}
