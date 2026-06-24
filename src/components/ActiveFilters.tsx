import type { FilterState } from "@/types";
import { formatDateShort } from "@/utils/dateHelpers";
import { CloseIcon } from "./icons";

interface Chip {
  key: string;
  label: string;
  onRemove: () => void;
}

/** Renders the currently-applied filters as removable chips. */
export function ActiveFilters({
  filters,
  branch = "",
  onClearBranch,
  onToggle,
  onPatch,
  onReset,
}: {
  filters: FilterState;
  branch?: string;
  onClearBranch?: () => void;
  onToggle: (key: "categories" | "organizers" | "tags" | "venues", value: string) => void;
  onPatch: (next: Partial<FilterState>) => void;
  onReset: () => void;
}) {
  const chips: Chip[] = [];

  if (branch && onClearBranch) {
    chips.push({ key: "branch", label: `🎓 ${branch}`, onRemove: onClearBranch });
  }

  const pushList = (
    key: "categories" | "organizers" | "tags" | "venues",
    prefix: string
  ) => {
    for (const v of filters[key]) {
      chips.push({ key: `${key}:${v}`, label: `${prefix}: ${v}`, onRemove: () => onToggle(key, v) });
    }
  };

  if (filters.search.trim())
    chips.push({
      key: "search",
      label: `“${filters.search.trim()}”`,
      onRemove: () => onPatch({ search: "" }),
    });

  if (filters.registration !== "all") {
    const labels: Record<string, string> = {
      registered: "Registered",
      "not-registered": "Not registered",
      available: "Available to register",
    };
    chips.push({
      key: "reg",
      label: labels[filters.registration] ?? "Registration",
      onRemove: () => onPatch({ registration: "all" }),
    });
  }

  pushList("categories", "Category");
  pushList("organizers", "Club");
  pushList("tags", "Tag");
  pushList("venues", "Venue");

  if (filters.dateFrom)
    chips.push({
      key: "from",
      label: `From ${formatDateShort(Date.parse(filters.dateFrom))}`,
      onRemove: () => onPatch({ dateFrom: "" }),
    });
  if (filters.dateTo)
    chips.push({
      key: "to",
      label: `To ${formatDateShort(Date.parse(filters.dateTo))}`,
      onRemove: () => onPatch({ dateTo: "" }),
    });
  if (filters.hideCancelled)
    chips.push({
      key: "cancelled",
      label: "Hiding cancelled",
      onRemove: () => onPatch({ hideCancelled: false }),
    });

  if (chips.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {chips.map((c) => (
        <button
          key={c.key}
          type="button"
          onClick={c.onRemove}
          aria-label={`Remove filter: ${c.label}`}
          className="group inline-flex animate-slide-from-left items-center gap-1.5 rounded-full border border-border bg-surface-raised
            py-1 pl-3 pr-2 text-xs font-medium text-content-muted transition-colors hover:border-brand/50 hover:text-content"
        >
          {c.label}
          <CloseIcon
            width={13}
            height={13}
            aria-hidden="true"
            className="text-content-faint group-hover:text-content"
          />
        </button>
      ))}
      {chips.length > 1 && (
        <button
          type="button"
          onClick={onReset}
          className="text-xs font-medium text-brand hover:underline"
        >
          Clear all
        </button>
      )}
    </div>
  );
}
