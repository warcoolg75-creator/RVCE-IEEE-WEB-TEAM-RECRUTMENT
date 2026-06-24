import { useMemo, useState } from "react";
import {
  addMonths,
  addWeeks,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import type { CampusEvent } from "@/types";
import { useData } from "@/store/DataContext";
import { useRegistrationStore } from "@/store/registrationStore";
import { useProfileStore, useActiveProfile } from "@/store/profileStore";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { getClubColorMap, hueForClub } from "@/utils/clubColors";
import { isRelevantToBranch } from "@/utils/branchRelevance";
import { CalendarGrid } from "./CalendarGrid";
import { AgendaList } from "./AgendaList";
import { DayEventsModal } from "./DayEventsModal";
import { ClubLegend } from "./ClubLegend";
import { BranchFilter } from "@/components/BranchFilter";
import { SkeletonGrid } from "@/components/SkeletonCard";
import { EmptyState } from "@/components/empty-states/EmptyState";
import {
  CalendarIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronDownIcon,
  GridIcon,
  ListIcon,
  FilterIcon,
  CloseIcon,
  CheckIcon,
} from "@/components/icons";

type View = "month" | "week";
const WEEK_OPTS = { weekStartsOn: 1 as const };

export function CalendarView() {
  const { status, events, facets } = useData();

  const [anchor, setAnchor] = useState<Date>(() => new Date());
  const [view, setView] = useState<View>("month");
  const [slideDir, setSlideDir] = useState<"left" | "right">("right");
  const profile = useActiveProfile();
  const updateProfile = useProfileStore((s) => s.updateProfile);
  const branch = profile?.branch ?? "";
  const setBranch = (b: string) => updateProfile({ branch: b || null });
  const [hiddenClubs, setHiddenClubs] = useState<Set<string>>(new Set());
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [modal, setModal] = useState<{ date: Date; events: CampusEvent[] } | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [onlyRegistered, setOnlyRegistered] = useState(false);
  const registrations = useRegistrationStore((s) => s.registrations);
  const registeredSet = useMemo(
    () => new Set(registrations.map((r) => r.eventId)),
    [registrations]
  );

  const isDesktop = useMediaQuery("(min-width: 768px)");

  // Club → hue (stable across the dataset).
  const clubColorMap = useMemo(() => getClubColorMap(facets.organizers), [facets.organizers]);
  const hueFor = useMemo(() => (club: string) => hueForClub(club, clubColorMap), [clubColorMap]);

  // Visible date range (only this range is ever bucketed → efficient).
  const { days, rangeStart, rangeEnd } = useMemo(() => {
    if (view === "week") {
      const start = startOfWeek(anchor, WEEK_OPTS);
      const end = endOfWeek(anchor, WEEK_OPTS);
      return { days: eachDayOfInterval({ start, end }), rangeStart: start, rangeEnd: end };
    }
    const start = startOfWeek(startOfMonth(anchor), WEEK_OPTS);
    const end = endOfWeek(endOfMonth(anchor), WEEK_OPTS);
    return { days: eachDayOfInterval({ start, end }), rangeStart: start, rangeEnd: end };
  }, [anchor, view]);

  // Bucket the (filtered) events that fall within the visible range only.
  const { eventsByDay, visibleEvents } = useMemo(() => {
    const map = new Map<string, CampusEvent[]>();
    const startTs = rangeStart.getTime();
    const endTs = rangeEnd.getTime() + 86_399_999;
    const catSet = new Set(selectedCategories);
    const flat: CampusEvent[] = [];

    for (const e of events) {
      if (e.startTime === null) continue;
      if (e.startTime < startTs || e.startTime > endTs) continue;
      if (onlyRegistered && !registeredSet.has(e.id)) continue;
      if (hiddenClubs.has(e.organizer)) continue;
      if (catSet.size && !catSet.has(e.category)) continue;
      const key = format(e.startTime, "yyyy-MM-dd");
      const bucket = map.get(key);
      if (bucket) bucket.push(e);
      else map.set(key, [e]);
      flat.push(e);
    }
    for (const bucket of map.values()) {
      bucket.sort((a, b) => (a.startTime ?? 0) - (b.startTime ?? 0));
    }
    return { eventsByDay: map, visibleEvents: flat };
  }, [events, rangeStart, rangeEnd, hiddenClubs, selectedCategories, onlyRegistered, registeredSet]);

  const isFaded = useMemo(
    () => (e: CampusEvent) => branch !== "" && !isRelevantToBranch(e, branch),
    [branch]
  );

  const relevantCount = useMemo(
    () => (branch ? visibleEvents.filter((e) => !isFaded(e)).length : undefined),
    [branch, visibleEvents, isFaded]
  );

  /* ---- navigation ---- */
  const step = (dir: -1 | 1) => {
    setSlideDir(dir === 1 ? "right" : "left");
    setAnchor((a) => (view === "week" ? addWeeks(a, dir) : addMonths(a, dir)));
  };
  const goToday = () => {
    setSlideDir("right");
    setAnchor(new Date());
  };
  const jumpToMonth = (value: string) => {
    if (!value) return;
    const [y, m] = value.split("-").map(Number);
    if (!y || !m) return;
    const next = new Date(y, m - 1, 1);
    setSlideDir(next > anchor ? "right" : "left");
    setAnchor(next);
  };

  const toggleClub = (club: string) =>
    setHiddenClubs((prev) => {
      const next = new Set(prev);
      next.has(club) ? next.delete(club) : next.add(club);
      return next;
    });
  const selectAllClubs = () => setHiddenClubs(new Set());
  const deselectAllClubs = () => setHiddenClubs(new Set(facets.organizers));
  const toggleCategory = (cat: string) =>
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );

  const slideKey = `${view}-${anchor.toISOString()}`;
  const headerLabel =
    view === "week"
      ? `${format(rangeStart, "d MMM")} – ${format(rangeEnd, "d MMM yyyy")}`
      : format(anchor, "MMMM yyyy");

  /* ---- sidebar (shared between desktop aside + mobile drawer) ---- */
  const sidebar = (
    <div className="flex flex-col gap-3">
      <BranchFilter
        value={branch}
        onChange={setBranch}
        recommendedCount={relevantCount}
        homeBranch={profile?.branch ?? null}
      />

      {/* Personal calendar toggle */}
      <label className="flex cursor-pointer items-center justify-between rounded-xl border border-border bg-surface-raised px-3 py-2.5 text-sm text-content">
        <span className="flex items-center gap-2">
          <span aria-hidden="true">🎟️</span> Show only registered
        </span>
        <button
          type="button"
          role="switch"
          aria-checked={onlyRegistered}
          aria-label="Show only registered events"
          onClick={() => setOnlyRegistered((v) => !v)}
          className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${
            onlyRegistered ? "bg-brand" : "bg-border"
          }`}
        >
          <span
            className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${
              onlyRegistered ? "translate-x-4" : "translate-x-0.5"
            }`}
          />
        </button>
      </label>

      {/* Category filter */}
      <div className="border-t border-border-subtle pt-1.5">
        <CategorySection
          categories={facets.categories}
          selected={selectedCategories}
          onToggle={toggleCategory}
          onClear={() => setSelectedCategories([])}
        />
      </div>

      {/* Clubs (legend + filter) */}
      <ClubLegend
        clubs={facets.organizers}
        hueFor={hueFor}
        hidden={hiddenClubs}
        onToggle={toggleClub}
        onSelectAll={selectAllClubs}
        onDeselectAll={deselectAllClubs}
      />
    </div>
  );

  return (
    <div className="mx-auto max-w-screen-2xl px-4 py-6 sm:px-6">
      <div className="mb-5 animate-fade-in">
        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-content sm:text-3xl">
          <CalendarIcon width={26} height={26} className="text-brand" />
          Calendar
        </h1>
        <p className="mt-1 text-sm text-content-muted">
          Browse events by date, colored by club. Pick your branch to spotlight what's relevant.
        </p>
      </div>

      <div className="flex gap-6">
        {/* Desktop sidebar */}
        <aside className="hidden w-72 shrink-0 lg:block">
          <div className="sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto pr-1">
            {status === "ready" && sidebar}
          </div>
        </aside>

        {/* Main */}
        <div className="min-w-0 flex-1">
          {/* Toolbar */}
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => step(-1)}
                aria-label={view === "week" ? "Previous week" : "Previous month"}
                className="grid h-9 w-9 place-items-center rounded-xl border border-border text-content-muted hover:bg-surface hover:text-content"
              >
                <ChevronLeftIcon width={18} height={18} />
              </button>
              <button
                type="button"
                onClick={() => step(1)}
                aria-label={view === "week" ? "Next week" : "Next month"}
                className="grid h-9 w-9 place-items-center rounded-xl border border-border text-content-muted hover:bg-surface hover:text-content"
              >
                <ChevronRightIcon width={18} height={18} />
              </button>
            </div>

            <h2 className="min-w-[10rem] text-lg font-semibold text-content">{headerLabel}</h2>

            <button type="button" onClick={goToday} className="btn-ghost py-2">
              Today
            </button>

            <div className="ml-auto flex items-center gap-2">
              {/* Date jump */}
              <input
                type="month"
                value={format(startOfMonth(anchor), "yyyy-MM")}
                onChange={(e) => jumpToMonth(e.target.value)}
                aria-label="Jump to month"
                className="input-base hidden w-[10.5rem] py-2 sm:block"
              />

              {/* View toggle */}
              <div className="flex rounded-xl border border-border p-0.5">
                <ToggleBtn active={view === "month"} onClick={() => setView("month")} label="Month">
                  <GridIcon width={15} height={15} />
                </ToggleBtn>
                <ToggleBtn active={view === "week"} onClick={() => setView("week")} label="Week">
                  <ListIcon width={15} height={15} />
                </ToggleBtn>
              </div>

              {/* Mobile filters */}
              <button
                type="button"
                onClick={() => setDrawerOpen(true)}
                className="btn-ghost py-2 lg:hidden"
                aria-label="Open filters"
              >
                <FilterIcon width={16} height={16} />
              </button>
            </div>
          </div>

          {status === "loading" && <SkeletonGrid count={6} />}

          {status === "error" && (
            <EmptyState
              icon={<span className="text-2xl">😕</span>}
              title="Couldn't load the calendar"
              message="The event data failed to load."
            />
          )}

          {status === "ready" &&
            (isDesktop ? (
              <CalendarGrid
                days={days}
                monthAnchor={anchor}
                view={view}
                slideKey={slideKey}
                slideDir={slideDir}
                eventsByDay={eventsByDay}
                hueFor={hueFor}
                isFaded={isFaded}
                onShowMore={(date, evts) => setModal({ date, events: evts })}
              />
            ) : (
              <AgendaList
                days={days}
                eventsByDay={eventsByDay}
                hueFor={hueFor}
                isFaded={isFaded}
                slideKey={slideKey}
              />
            ))}

          {status === "ready" && isDesktop && visibleEvents.length === 0 && (
            <p className="mt-3 text-center text-sm text-content-muted">
              No events this {view === "week" ? "week" : "month"} — try a different{" "}
              {view === "week" ? "week" : "month"}.
            </p>
          )}
        </div>
      </div>

      {modal && (
        <DayEventsModal
          date={modal.date}
          events={modal.events}
          hueFor={hueFor}
          isFaded={isFaded}
          onClose={() => setModal(null)}
        />
      )}

      {/* Mobile filter drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Calendar filters">
          <div className="absolute inset-0 bg-black/40 animate-fade-in-fast" onClick={() => setDrawerOpen(false)} />
          <div className="absolute left-0 top-0 flex h-full w-[85%] max-w-sm flex-col bg-surface-raised shadow-xl animate-drawer-from-left">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <h2 className="text-sm font-semibold">Filters</h2>
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                aria-label="Close filters"
                className="grid h-9 w-9 place-items-center rounded-full hover:bg-surface"
              >
                <CloseIcon width={18} height={18} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-3">{sidebar}</div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---- small local building blocks ---- */

function ToggleBtn({
  active,
  onClick,
  label,
  children,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium transition-colors ${
        active ? "bg-brand text-brand-fg" : "text-content-muted hover:text-content"
      }`}
    >
      {children}
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}

function CategorySection({
  categories,
  selected,
  onToggle,
  onClear,
}: {
  categories: string[];
  selected: string[];
  onToggle: (c: string) => void;
  onClear: () => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center justify-between rounded-lg px-1 py-2 text-sm font-medium text-content hover:text-brand"
      >
        <span className="flex items-center gap-2">
          Category
          {selected.length > 0 && (
            <span className="grid h-5 min-w-[1.25rem] place-items-center rounded-full bg-brand px-1 text-[11px] font-bold text-brand-fg">
              {selected.length}
            </span>
          )}
        </span>
        <ChevronDownIcon
          width={16}
          height={16}
          className={`text-content-faint transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <div className="px-1 pb-1 animate-fade-in-fast">
          {selected.length > 0 && (
            <button
              type="button"
              onClick={onClear}
              className="mb-1 text-xs font-medium text-brand hover:underline"
            >
              Clear
            </button>
          )}
          <ul className="flex flex-col gap-0.5">
            {categories.map((cat) => {
              const checked = selected.includes(cat);
              return (
                <li key={cat}>
                  <label className="flex cursor-pointer items-center gap-2.5 rounded-lg px-1.5 py-1.5 text-sm text-content-muted hover:bg-surface-subtle hover:text-content">
                    <span
                      className={`grid h-4 w-4 shrink-0 place-items-center rounded border transition-colors ${
                        checked ? "border-brand bg-brand text-brand-fg" : "border-border bg-surface"
                      }`}
                    >
                      {checked && <CheckIcon width={11} height={11} strokeWidth={3.5} />}
                    </span>
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => onToggle(cat)}
                      className="sr-only"
                    />
                    <span className="truncate">{cat}</span>
                  </label>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
