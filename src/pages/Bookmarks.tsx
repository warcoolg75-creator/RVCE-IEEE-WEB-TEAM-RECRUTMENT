import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useData } from "@/store/DataContext";
import { useBookmarkStore } from "@/store/bookmarks";
import { useActiveProfile } from "@/store/profileStore";
import { useDebounce } from "@/hooks/useDebounce";
import { filterAndSortEvents } from "@/utils/filterEvents";
import { findConflicts } from "@/utils/conflictDetection";
import { formatTime, formatDateShort } from "@/utils/dateHelpers";
import { DEFAULT_FILTERS } from "@/utils/constants";
import { format } from "date-fns";
import type { CampusEvent, SortKey } from "@/types";
import { toast } from "@/store/toast";
import { SearchBar } from "@/components/SearchBar";
import { SortSelect } from "@/components/SortSelect";
import { ScheduleExportMenu } from "@/components/ScheduleExportMenu";
import { VirtualEventGrid } from "@/components/VirtualEventGrid";
import { EmptyState } from "@/components/empty-states/EmptyState";
import { BackToTop } from "@/components/BackToTop";
import { SkeletonGrid } from "@/components/SkeletonCard";
import { SearchIcon } from "@/components/icons";

export function Bookmarks() {
  const { status, byId } = useData();
  const profile = useActiveProfile();
  const ids = useBookmarkStore((s) => s.ids);
  const clear = useBookmarkStore((s) => s.clear);

  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortKey>("date-asc");
  const debouncedSearch = useDebounce(search, 200);

  // Resolve ids → events (ignoring any stale ids no longer in the dataset).
  const bookmarked = useMemo(
    () => ids.map((id) => byId.get(id)).filter((e): e is NonNullable<typeof e> => !!e),
    [ids, byId]
  );

  const visible = useMemo(
    () =>
      filterAndSortEvents(bookmarked, {
        ...DEFAULT_FILTERS,
        search: debouncedSearch,
        sort,
      }),
    [bookmarked, debouncedSearch, sort]
  );

  const conflicts = useMemo(() => findConflicts(bookmarked), [bookmarked]);

  // Bookmarks sorted by date for the printable schedule (#print-root).
  const printSchedule = useMemo(() => {
    const dated = [...bookmarked].sort((a, b) => {
      if (a.startTime === null) return b.startTime === null ? 0 : 1;
      if (b.startTime === null) return -1;
      return a.startTime - b.startTime;
    });
    const groups = new Map<string, { label: string; items: CampusEvent[] }>();
    for (const e of dated) {
      const key = e.startTime !== null ? format(e.startTime, "yyyy-MM-dd") : "tba";
      let g = groups.get(key);
      if (!g) {
        g = {
          label: e.startTime !== null ? format(e.startTime, "EEEE, d MMMM yyyy") : "Date to be announced",
          items: [],
        };
        groups.set(key, g);
      }
      g.items.push(e);
    }
    return [...groups.values()];
  }, [bookmarked]);

  const handleClear = () => {
    clear();
    toast.info("All bookmarks removed");
  };

  return (
    <div className="mx-auto max-w-screen-2xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4 animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-content sm:text-3xl">
            {profile ? `Your saved events, ${profile.name.split(/\s+/)[0]}` : "Your bookmarks"}
          </h1>
          <p className="mt-1 text-sm text-content-muted">
            {bookmarked.length > 0
              ? `${bookmarked.length} saved event${bookmarked.length > 1 ? "s" : ""}`
              : "Events you save appear here."}
          </p>
        </div>
        {bookmarked.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <ScheduleExportMenu events={bookmarked} />
            <button
              type="button"
              onClick={handleClear}
              aria-label="Remove all bookmarks"
              className="btn px-3 py-2 text-rose-600 hover:bg-rose-500/10 dark:text-rose-400"
            >
              Clear all
            </button>
          </div>
        )}
      </div>

      {status === "loading" && <SkeletonGrid count={6} />}

      {status === "ready" && bookmarked.length === 0 && (
        <EmptyState
          icon={<span className="text-2xl">🔖</span>}
          title="No bookmarks yet!"
          message="Browse events and tap the bookmark icon to save them here."
          action={
            <Link to="/" className="btn-primary">
              Browse Events →
            </Link>
          }
        />
      )}

      {status === "ready" && bookmarked.length > 0 && conflicts.length > 0 && (
        <div className="mb-5 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-amber-700 dark:text-amber-300">
            ⚠️ Schedule conflicts
            <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-xs font-bold">
              {conflicts.length}
            </span>
          </h2>
          <ul className="mt-3 space-y-2">
            {conflicts.map(({ event1, event2 }) => (
              <li
                key={`${event1.id}-${event2.id}`}
                className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-content"
              >
                <Link
                  to={`/event/${encodeURIComponent(event1.id)}`}
                  className="font-medium text-content hover:text-brand hover:underline"
                >
                  {event1.title}
                </Link>
                <span className="text-content-faint">({formatTime(event1.startTime)})</span>
                <span className="text-amber-600 dark:text-amber-400">⇄</span>
                <Link
                  to={`/event/${encodeURIComponent(event2.id)}`}
                  className="font-medium text-content hover:text-brand hover:underline"
                >
                  {event2.title}
                </Link>
                <span className="text-content-faint">({formatTime(event2.startTime)})</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {status === "ready" && bookmarked.length > 0 && (
        <>
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="flex-1">
              <SearchBar
                value={search}
                onChange={setSearch}
                placeholder="Search your bookmarks…"
              />
            </div>
            <div className="min-w-[12rem]">
              <SortSelect value={sort} onChange={setSort} />
            </div>
          </div>

          {visible.length > 0 ? (
            <>
              <p className="mb-4 text-sm text-content-muted">
                Showing{" "}
                <span className="font-semibold text-content">{visible.length}</span> of{" "}
                {bookmarked.length} bookmarks
              </p>
              <VirtualEventGrid events={visible} />
            </>
          ) : (
            <EmptyState
              icon={<SearchIcon width={24} height={24} aria-hidden="true" />}
              title="No bookmarks match"
              message="Try a different search term."
            />
          )}
        </>
      )}

      <BackToTop />

      {/* Print-only schedule (shown by print.css when exporting to PDF). */}
      <div id="print-root" aria-hidden="true">
        <h1 className="print-title">My RVCE Campus Events Schedule</h1>
        <p className="print-meta">
          {bookmarked.length} event{bookmarked.length === 1 ? "" : "s"} · Exported{" "}
          {formatDateShort(Date.now())}
        </p>
        {printSchedule.map((g) => (
          <div key={g.label}>
            <div className="print-day">{g.label}</div>
            {g.items.map((e) => (
              <div key={e.id} className="print-event">
                <span className="print-time">{formatTime(e.startTime) || "TBA"}</span>
                <span>
                  <span className="print-name">{e.title}</span>
                  <br />
                  <span className="print-sub">
                    {e.organizer}
                    {e.location?.label ? ` · ${e.location.label}` : ""}
                  </span>
                </span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
