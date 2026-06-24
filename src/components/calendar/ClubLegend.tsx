import { useState } from "react";
import { clubHueStyle } from "@/utils/clubColors";
import { CheckIcon, ChevronDownIcon } from "@/components/icons";

/**
 * Color legend that doubles as the club/organizer filter (like Google
 * Calendar): each club shows its color swatch and can be toggled on/off, which
 * shows/hides that club's events on the calendar. Includes a search box and
 * Select-all / Deselect-all controls.
 */
export function ClubLegend({
  clubs,
  hueFor,
  hidden,
  onToggle,
  onSelectAll,
  onDeselectAll,
}: {
  clubs: string[];
  hueFor: (club: string) => number;
  hidden: Set<string>;
  onToggle: (club: string) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
}) {
  const [open, setOpen] = useState(true);
  const [query, setQuery] = useState("");

  const filtered = query
    ? clubs.filter((c) => c.toLowerCase().includes(query.toLowerCase()))
    : clubs;

  const activeCount = clubs.length - hidden.size;

  return (
    <div className="border-t border-border-subtle py-1.5">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center justify-between rounded-lg px-1 py-2 text-sm font-medium text-content hover:text-brand"
      >
        <span className="flex items-center gap-2">
          Clubs
          <span className="text-xs font-normal text-content-faint">
            {activeCount}/{clubs.length}
          </span>
        </span>
        <ChevronDownIcon
          width={16}
          height={16}
          className={`text-content-faint transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="px-1 pb-1 pt-1 animate-fade-in-fast">
          <div className="mb-2 flex items-center gap-2">
            <button
              type="button"
              onClick={onSelectAll}
              className="text-xs font-medium text-brand hover:underline"
            >
              Select all
            </button>
            <span className="text-content-faint">·</span>
            <button
              type="button"
              onClick={onDeselectAll}
              className="text-xs font-medium text-content-muted hover:underline"
            >
              Deselect all
            </button>
          </div>

          {clubs.length > 10 && (
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Filter clubs…"
              aria-label="Filter clubs"
              className="input-base mb-2 py-1.5 text-xs"
            />
          )}

          <ul className="flex max-h-72 flex-col gap-0.5 overflow-y-auto pr-1">
            {filtered.map((club) => {
              const isOn = !hidden.has(club);
              return (
                <li key={club}>
                  <button
                    type="button"
                    onClick={() => onToggle(club)}
                    aria-pressed={isOn}
                    className="flex w-full items-center gap-2.5 rounded-lg px-1.5 py-1.5 text-left text-sm text-content-muted hover:bg-surface-subtle hover:text-content"
                  >
                    <span
                      style={clubHueStyle(hueFor(club))}
                      className={`club-swatch grid h-4 w-4 shrink-0 place-items-center rounded text-white transition-opacity ${
                        isOn ? "opacity-100" : "opacity-25"
                      }`}
                    >
                      {isOn && <CheckIcon width={11} height={11} strokeWidth={3.5} />}
                    </span>
                    <span className={`truncate ${isOn ? "" : "line-through opacity-60"}`}>
                      {club}
                    </span>
                  </button>
                </li>
              );
            })}
            {filtered.length === 0 && (
              <li className="px-1.5 py-1.5 text-xs text-content-faint">No clubs match</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
