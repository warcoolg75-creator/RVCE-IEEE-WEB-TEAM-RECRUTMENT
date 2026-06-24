import { useEffect, useMemo, useState } from "react";
import { useData, feedScroll } from "@/store/DataContext";
import { useFilters } from "@/hooks/useFilters";
import { useFeedKeyboard } from "@/hooks/useKeyboardNav";
import { useRegistrationStore } from "@/store/registrationStore";
import { useProfileStore, useActiveProfile } from "@/store/profileStore";
import { filterAndSortEvents } from "@/utils/filterEvents";
import { canRegister } from "@/utils/registrationState";
import { scoreEvent, RECOMMEND_THRESHOLD } from "@/utils/branchRelevance";
import { SearchBar } from "@/components/SearchBar";
import { HeroSection } from "@/components/HeroSection";
import { AnalyticsPanel } from "@/components/AnalyticsPanel";
import { FilterSidebar } from "@/components/FilterSidebar";
import { BranchFilter } from "@/components/BranchFilter";
import { RegistrationStatusFilter } from "@/components/registration/RegistrationStatusFilter";
import { ActiveFilters } from "@/components/ActiveFilters";
import { SortSelect } from "@/components/SortSelect";
import { VirtualEventGrid } from "@/components/VirtualEventGrid";
import { AnimatedNumber } from "@/components/AnimatedNumber";
import { TimelineView } from "@/components/timeline/TimelineView";
import { SkeletonGrid } from "@/components/SkeletonCard";
import { EmptyState } from "@/components/empty-states/EmptyState";
import { BackToTop } from "@/components/BackToTop";
import { FilterIcon, SearchIcon, CloseIcon, GridIcon, ListIcon } from "@/components/icons";

export function EventFeed() {
  const { status, events, facets, error, report } = useData();
  const { filters, patch, toggleInArray, reset, activeCount, isDefault } = useFilters();
  const profile = useActiveProfile();
  const updateProfile = useProfileStore((s) => s.updateProfile);
  const branch = profile?.branch ?? "";
  const setBranch = (b: string) => updateProfile({ branch: b || null });
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [layout, setLayout] = useState<"grid" | "timeline">(
    profile?.preferences.defaultView ?? "grid"
  );

  // Remember the last-used view in the profile.
  const changeLayout = (v: "grid" | "timeline") => {
    setLayout(v);
    if (profile) updateProfile({ preferences: { ...profile.preferences, defaultView: v } });
  };

  const registrations = useRegistrationStore((s) => s.registrations);
  const registeredSet = useMemo(
    () => new Set(registrations.map((r) => r.eventId)),
    [registrations]
  );

  // Apply all existing filters, then the registration-status filter, then (if a
  // branch is chosen) re-order by relevance score with the chosen sort as tiebreak.
  const filtered = useMemo(() => {
    if (status !== "ready") return [];
    let base = filterAndSortEvents(events, filters);

    if (filters.registration !== "all") {
      base = base.filter((e) => {
        const isReg = registeredSet.has(e.id);
        if (filters.registration === "registered") return isReg;
        if (filters.registration === "not-registered") return !isReg;
        if (filters.registration === "available") return canRegister(e, isReg);
        return true;
      });
    }

    if (branch) base = [...base].sort((a, b) => scoreEvent(b, branch) - scoreEvent(a, branch));
    return base;
  }, [events, filters, status, branch, registeredSet]);

  const recommendedCount = useMemo(
    () =>
      branch ? filtered.filter((e) => scoreEvent(e, branch) >= RECOMMEND_THRESHOLD).length : 0,
    [filtered, branch]
  );

  const { focusedIndex } = useFeedKeyboard(filtered);

  // Persist + restore feed scroll position across navigation.
  useEffect(() => {
    if (status !== "ready") return;
    window.scrollTo(0, feedScroll.offset);
    const onScroll = () => {
      feedScroll.offset = window.scrollY;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [status]);

  return (
    <div className="mx-auto max-w-screen-2xl px-4 py-6 sm:px-6">
      {/* Hero / header */}
      <div className="mb-6 animate-fade-in">
        <h1 className="text-2xl font-bold tracking-tight text-content sm:text-3xl">
          {profile
            ? `Hey ${profile.name.split(/\s+/)[0]}, here's what's happening on campus`
            : "Discover campus events"}
        </h1>
        <p className="mt-1 text-sm text-content-muted">
          Browse, search and bookmark campus events
          {report && (
            <span className="text-content-faint">
              {" "}
              · {report.kept.toLocaleString()} events loaded
            </span>
          )}
        </p>
      </div>

      {/* Happening Now / Today / This Week */}
      {status === "ready" && <HeroSection />}

      {/* Event Insights analytics */}
      {status === "ready" && <AnalyticsPanel />}

      {/* Toolbar */}
      <div className="sticky top-16 z-30 -mx-4 mb-5 border-b border-border bg-surface-subtle/85 px-4 py-3 backdrop-blur-md sm:mx-0 sm:rounded-2xl sm:border sm:px-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex-1">
            <SearchBar value={filters.search} onChange={(v) => patch({ search: v })} />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              className="btn-ghost lg:hidden"
              aria-label="Open filters"
            >
              <FilterIcon width={16} height={16} />
              Filters
              {activeCount > 0 && (
                <span className="grid h-5 min-w-[1.25rem] place-items-center rounded-full bg-brand px-1 text-[11px] font-bold text-brand-fg">
                  {activeCount}
                </span>
              )}
            </button>
            <div className="min-w-[11rem]">
              <SortSelect value={filters.sort} onChange={(v) => patch({ sort: v })} />
            </div>
            <div className="flex rounded-xl border border-border p-0.5" role="group" aria-label="Layout">
              <button
                type="button"
                onClick={() => changeLayout("grid")}
                aria-pressed={layout === "grid"}
                aria-label="Grid layout"
                title="Grid"
                className={`grid h-8 w-8 place-items-center rounded-lg transition-colors ${
                  layout === "grid" ? "bg-brand text-brand-fg" : "text-content-muted hover:text-content"
                }`}
              >
                <GridIcon width={16} height={16} aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => changeLayout("timeline")}
                aria-pressed={layout === "timeline"}
                aria-label="Timeline layout"
                title="Timeline"
                className={`grid h-8 w-8 place-items-center rounded-lg transition-colors ${
                  layout === "timeline" ? "bg-brand text-brand-fg" : "text-content-muted hover:text-content"
                }`}
              >
                <ListIcon width={16} height={16} aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Desktop sidebar */}
        <aside className="hidden w-64 shrink-0 lg:block">
          <div className="sticky top-36 max-h-[calc(100vh-10rem)] space-y-3 overflow-y-auto pr-1">
            {status === "ready" && (
              <>
                <BranchFilter
                  value={branch}
                  onChange={setBranch}
                  recommendedCount={recommendedCount}
                  homeBranch={profile?.branch ?? null}
                />
                <RegistrationStatusFilter
                  value={filters.registration}
                  onChange={(v) => patch({ registration: v })}
                />
                <FilterSidebar
                  facets={facets}
                  filters={filters}
                  activeCount={activeCount}
                  onToggle={toggleInArray}
                  onPatch={patch}
                  onReset={reset}
                />
              </>
            )}
          </div>
        </aside>

        {/* Main content */}
        <div className="min-w-0 flex-1">
          {/* Count + chips */}
          <div className="mb-4 flex flex-col gap-3">
            <p className="text-sm text-content-muted" aria-live="polite">
              {status === "ready" ? (
                branch ? (
                  <>
                    <span className="font-semibold text-content">
                      <AnimatedNumber value={recommendedCount} />
                    </span>{" "}
                    event{recommendedCount === 1 ? "" : "s"} recommended for{" "}
                    <span className="font-medium text-content">{branch}</span>
                    <span className="text-content-faint">
                      {" "}
                      · <AnimatedNumber value={filtered.length} /> shown
                    </span>
                  </>
                ) : (
                  <>
                    Showing{" "}
                    <span className="font-semibold text-content">
                      <AnimatedNumber value={filtered.length} />
                    </span>{" "}
                    of {events.length.toLocaleString()} events
                  </>
                )
              ) : (
                "Loading events…"
              )}
            </p>
            <ActiveFilters
              filters={filters}
              branch={branch}
              onClearBranch={() => setBranch("")}
              onToggle={toggleInArray}
              onPatch={patch}
              onReset={reset}
            />
          </div>

          {status === "ready" && branch && recommendedCount === 0 && filtered.length > 0 && (
            <p className="mb-3 rounded-xl border border-border bg-surface-raised px-3 py-2 text-xs text-content-muted">
              No events specifically for <span className="font-medium text-content">{branch}</span>.
              Showing all events by general relevance.
            </p>
          )}

          {status === "loading" && <SkeletonGrid count={9} />}

          {status === "error" && (
            <EmptyState
              icon={<span className="text-2xl">😕</span>}
              title="Couldn't load events"
              message={error ?? "Couldn't load events. Check your connection."}
              action={
                <button
                  className="btn-primary"
                  onClick={() => window.location.reload()}
                  aria-label="Retry loading events"
                >
                  Retry
                </button>
              }
            />
          )}

          {status === "ready" && filtered.length === 0 && (
            <EmptyState
              icon={<SearchIcon width={24} height={24} aria-hidden="true" />}
              title={filters.search ? "No results found" : "No events match your filters"}
              message={
                filters.search
                  ? `No results for “${filters.search}”. Try different keywords.`
                  : "Try removing a filter to see more events."
              }
              action={
                !isDefault ? (
                  <button className="btn-primary" onClick={reset} aria-label="Clear all filters">
                    Clear all filters
                  </button>
                ) : undefined
              }
            />
          )}

          {status === "ready" &&
            filtered.length > 0 &&
            (layout === "grid" ? (
              <VirtualEventGrid events={filtered} branch={branch} focusedIndex={focusedIndex} />
            ) : (
              <TimelineView events={filtered} branch={branch} />
            ))}
        </div>
      </div>

      <BackToTop />

      {/* Mobile filter drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Filters">
          <div
            className="absolute inset-0 bg-black/40 animate-fade-in-fast"
            onClick={() => setDrawerOpen(false)}
          />
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
            <div className="flex-1 space-y-3 overflow-y-auto px-4 py-3">
              <BranchFilter
                value={branch}
                onChange={setBranch}
                recommendedCount={recommendedCount}
                homeBranch={profile?.branch ?? null}
              />
              <RegistrationStatusFilter
                value={filters.registration}
                onChange={(v) => patch({ registration: v })}
              />
              <FilterSidebar
                facets={facets}
                filters={filters}
                activeCount={activeCount}
                onToggle={toggleInArray}
                onPatch={patch}
                onReset={reset}
              />
            </div>
            <div className="border-t border-border p-4">
              <button className="btn-primary w-full" onClick={() => setDrawerOpen(false)}>
                Show {filtered.length.toLocaleString()} events
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
