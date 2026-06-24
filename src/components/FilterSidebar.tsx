import { useState } from "react";
import type { FilterFacets, FilterState } from "@/types";
import { CheckIcon } from "./icons";

interface Props {
  facets: FilterFacets;
  filters: FilterState;
  activeCount: number;
  onToggle: (key: "categories" | "organizers" | "tags" | "venues", value: string) => void;
  onPatch: (next: Partial<FilterState>) => void;
  onReset: () => void;
}

export function FilterSidebar({
  facets,
  filters,
  activeCount,
  onToggle,
  onPatch,
  onReset,
}: Props) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between px-1 pb-2">
        <h2 className="text-sm font-semibold text-content">Filters</h2>
        {activeCount > 0 && (
          <button
            type="button"
            onClick={onReset}
            className="text-xs font-medium text-brand hover:underline"
          >
            Clear all ({activeCount})
          </button>
        )}
      </div>

      <Section title="Date range" defaultOpen>
        <div className="flex flex-col gap-2">
          <label className="text-xs text-content-muted">
            From
            <input
              type="date"
              value={filters.dateFrom}
              max={filters.dateTo || undefined}
              onChange={(e) => onPatch({ dateFrom: e.target.value })}
              className="input-base mt-1 py-2"
            />
          </label>
          <label className="text-xs text-content-muted">
            To
            <input
              type="date"
              value={filters.dateTo}
              min={filters.dateFrom || undefined}
              onChange={(e) => onPatch({ dateTo: e.target.value })}
              className="input-base mt-1 py-2"
            />
          </label>
        </div>
      </Section>

      <label className="flex cursor-pointer items-center justify-between rounded-xl px-1 py-2.5 text-sm text-content">
        <span>Hide cancelled events</span>
        <Switch
          checked={filters.hideCancelled}
          onChange={(v) => onPatch({ hideCancelled: v })}
          label="Hide cancelled events"
        />
      </label>

      <FacetSection
        title="Category"
        options={facets.categories}
        selected={filters.categories}
        onToggle={(v) => onToggle("categories", v)}
        defaultOpen
      />
      <FacetSection
        title="Club / Organizer"
        options={facets.organizers}
        selected={filters.organizers}
        onToggle={(v) => onToggle("organizers", v)}
      />
      <FacetSection
        title="Tags"
        options={facets.tags}
        selected={filters.tags}
        onToggle={(v) => onToggle("tags", v)}
      />
      <FacetSection
        title="Venue"
        options={facets.venues}
        selected={filters.venues}
        onToggle={(v) => onToggle("venues", v)}
      />
    </div>
  );
}

/* ---- building blocks ---- */

function Section({
  title,
  children,
  defaultOpen = false,
  trailing,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  trailing?: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-t border-border-subtle py-1.5 first:border-t-0">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center justify-between rounded-lg px-1 py-2 text-sm font-medium text-content hover:text-brand"
      >
        <span className="flex items-center gap-2">
          {title}
          {trailing}
        </span>
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className={`text-content-faint transition-transform ${open ? "rotate-180" : ""}`}
          aria-hidden
        >
          <path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {open && <div className="px-1 pb-2 pt-1 animate-fade-in-fast">{children}</div>}
    </div>
  );
}

function FacetSection({
  title,
  options,
  selected,
  onToggle,
  defaultOpen = false,
}: {
  title: string;
  options: string[];
  selected: string[];
  onToggle: (value: string) => void;
  defaultOpen?: boolean;
}) {
  const [showAll, setShowAll] = useState(false);
  const [query, setQuery] = useState("");

  const filtered = query
    ? options.filter((o) => o.toLowerCase().includes(query.toLowerCase()))
    : options;
  const visible = showAll || query ? filtered : filtered.slice(0, 8);

  return (
    <Section
      title={title}
      defaultOpen={defaultOpen}
      trailing={
        selected.length > 0 ? (
          <span className="grid h-5 min-w-[1.25rem] place-items-center rounded-full bg-brand px-1 text-[11px] font-bold text-brand-fg">
            {selected.length}
          </span>
        ) : null
      }
    >
      {options.length > 10 && (
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={`Filter ${title.toLowerCase()}…`}
          className="input-base mb-2 py-1.5 text-xs"
          aria-label={`Filter ${title} options`}
        />
      )}
      <ul className="flex flex-col gap-0.5">
        {visible.map((opt) => {
          const checked = selected.includes(opt);
          return (
            <li key={opt}>
              <label className="flex cursor-pointer items-center gap-2.5 rounded-lg px-1.5 py-1.5 text-sm text-content-muted hover:bg-surface-subtle hover:text-content">
                <span
                  className={`grid h-4 w-4 shrink-0 place-items-center rounded border transition-colors ${
                    checked
                      ? "border-brand bg-brand text-brand-fg"
                      : "border-border bg-surface"
                  }`}
                >
                  {checked && <CheckIcon width={12} height={12} strokeWidth={3} />}
                </span>
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => onToggle(opt)}
                  className="sr-only"
                />
                <span className="truncate">{opt}</span>
              </label>
            </li>
          );
        })}
        {visible.length === 0 && (
          <li className="px-1.5 py-1.5 text-xs text-content-faint">No matches</li>
        )}
      </ul>
      {!query && filtered.length > 8 && (
        <button
          type="button"
          onClick={() => setShowAll((s) => !s)}
          className="mt-1 px-1.5 text-xs font-medium text-brand hover:underline"
        >
          {showAll ? "Show less" : `Show all ${filtered.length}`}
        </button>
      )}
    </Section>
  );
}

function Switch({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative h-5 w-9 rounded-full transition-colors ${
        checked ? "bg-brand" : "bg-border"
      }`}
    >
      <span
        className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${
          checked ? "translate-x-4" : "translate-x-0.5"
        }`}
      />
    </button>
  );
}
