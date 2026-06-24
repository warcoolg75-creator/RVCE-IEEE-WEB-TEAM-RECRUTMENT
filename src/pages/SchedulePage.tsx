import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  differenceInMinutes,
  format,
  formatDistanceToNowStrict,
  isToday,
} from "date-fns";
import type { CampusEvent } from "@/types";
import { useData } from "@/store/DataContext";
import { useRegistrationStore } from "@/store/registrationStore";
import { useActiveProfile } from "@/store/profileStore";
import { toast } from "@/store/toast";
import { findConflicts } from "@/utils/conflictDetection";
import { getClubColorMap, hueForClub, clubHueStyle } from "@/utils/clubColors";
import { formatTime, formatDateShort } from "@/utils/dateHelpers";
import { CategoryBadge } from "@/components/CategoryBadge";
import { ScheduleExportMenu } from "@/components/ScheduleExportMenu";
import { PersonalNotes } from "@/components/registration/PersonalNotes";
import { EmptyState } from "@/components/empty-states/EmptyState";
import { BackToTop } from "@/components/BackToTop";
import { SkeletonGrid } from "@/components/SkeletonCard";
import { CalendarIcon, MapPinIcon, CloseIcon, ChevronDownIcon } from "@/components/icons";

const HOUR_MS = 60 * 60 * 1000;

interface Group {
  key: string;
  label: string;
  today: boolean;
  items: CampusEvent[];
}

export function SchedulePage() {
  const { status, facets, byId } = useData();
  const profile = useActiveProfile();
  const registrations = useRegistrationStore((s) => s.registrations);
  const cancel = useRegistrationStore((s) => s.cancelRegistration);
  const clearAll = useRegistrationStore((s) => s.clearAllRegistrations);
  const [showClear, setShowClear] = useState(false);
  const [showPast, setShowPast] = useState(false);

  const clubColorMap = useMemo(() => getClubColorMap(facets.organizers), [facets.organizers]);

  // Resolve registrations → events (dropping any stale ids).
  const registered = useMemo(
    () =>
      registrations
        .map((r) => byId.get(r.eventId))
        .filter((e): e is CampusEvent => !!e),
    [registrations, byId]
  );

  const { upcomingGroups, pastGroups, nextUp, conflicts } = useMemo(() => {
    const now = Date.now();
    const sorted = [...registered].sort((a, b) => {
      if (a.startTime === null) return b.startTime === null ? 0 : 1;
      if (b.startTime === null) return -1;
      return a.startTime - b.startTime;
    });

    const isPast = (e: CampusEvent) =>
      e.startTime !== null && e.startTime < now && Math.abs(e.startTime - now) > HOUR_MS;

    const upcoming = sorted.filter((e) => !isPast(e));
    const past = sorted.filter(isPast).reverse(); // most recent past first

    const group = (list: CampusEvent[]): Group[] => {
      const map = new Map<string, Group>();
      for (const e of list) {
        const key = e.startTime !== null ? format(e.startTime, "yyyy-MM-dd") : "tba";
        let g = map.get(key);
        if (!g) {
          g =
            e.startTime !== null
              ? { key, label: format(e.startTime, "EEEE, d MMM yyyy"), today: isToday(e.startTime), items: [] }
              : { key, label: "Date to be announced", today: false, items: [] };
          map.set(key, g);
        }
        g.items.push(e);
      }
      return [...map.values()];
    };

    const futureWithDate = sorted.filter((e) => e.startTime !== null && e.startTime >= now);

    return {
      upcomingGroups: group(upcoming),
      pastGroups: group(past),
      nextUp: futureWithDate[0] ?? null,
      conflicts: findConflicts(registered),
    };
  }, [registered]);

  const shareSchedule = () => {
    const lines = upcomingGroups
      .flatMap((g) => g.items)
      .filter((e) => e.startTime !== null)
      .map(
        (e) =>
          `• ${formatDateShort(e.startTime)} ${formatTime(e.startTime)} — ${e.title} (${e.organizer})`
      );
    const text = `My RVCE Campus Events schedule:\n${lines.join("\n") || "No upcoming events."}`;
    navigator.clipboard?.writeText(text).then(
      () => toast.success("✓ Schedule copied to clipboard"),
      () => toast.error("Couldn't copy schedule")
    );
  };

  const hueFor = (club: string) => hueForClub(club, clubColorMap);

  if (status === "loading") {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <SkeletonGrid count={3} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-content sm:text-3xl">
            {profile ? `${profile.name.split(/\s+/)[0]}'s Schedule` : "My Schedule"}
          </h1>
          <p className="mt-1 text-sm text-content-muted">Events you've registered to attend.</p>
        </div>
        {registered.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <ScheduleExportMenu events={registered} />
            <button type="button" onClick={shareSchedule} className="btn-ghost" aria-label="Copy schedule to clipboard">
              Share
            </button>
            <button
              type="button"
              onClick={() => setShowClear(true)}
              aria-label="Clear all registrations"
              className="btn px-3 py-2 text-rose-600 hover:bg-rose-500/10 dark:text-rose-400"
            >
              Clear all
            </button>
          </div>
        )}
      </div>

      {registered.length === 0 ? (
        <EmptyState
          icon={<CalendarIcon width={24} height={24} aria-hidden="true" />}
          title="No registrations yet!"
          message="Browse events and register for the ones you want to attend."
          action={
            <Link to="/" className="btn-primary">
              Browse Events →
            </Link>
          }
        />
      ) : (
        <>
          {/* Summary stats */}
          <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Stat label="Registered" value={`${registered.length}`} sub="events" icon="📋" />
            <Stat
              label="Next event"
              value={nextUp ? nextUp.title : "—"}
              sub={nextUp && nextUp.startTime !== null ? `in ${formatDistanceToNowStrict(nextUp.startTime)}` : "nothing upcoming"}
              icon="📅"
            />
            <Stat
              label="Conflicts"
              value={`${conflicts.length}`}
              sub="overlapping"
              icon="⚠️"
              warn={conflicts.length > 0}
            />
          </div>

          {/* Conflicts */}
          {conflicts.length > 0 && (
            <div className="mb-6 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4">
              <h2 className="text-sm font-semibold text-amber-700 dark:text-amber-300">
                ⚠️ Schedule conflicts
              </h2>
              <ul className="mt-2 space-y-1.5 text-sm">
                {conflicts.map(({ event1, event2 }) => (
                  <li key={`${event1.id}-${event2.id}`} className="flex flex-wrap items-center gap-x-2 text-content">
                    <Link to={`/event/${encodeURIComponent(event1.id)}`} className="font-medium hover:text-brand hover:underline">
                      {event1.title}
                    </Link>
                    <span className="text-content-faint">({formatTime(event1.startTime)})</span>
                    <span className="text-amber-600 dark:text-amber-400">⇄</span>
                    <Link to={`/event/${encodeURIComponent(event2.id)}`} className="font-medium hover:text-brand hover:underline">
                      {event2.title}
                    </Link>
                    <span className="text-content-faint">({formatTime(event2.startTime)})</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Upcoming agenda */}
          {upcomingGroups.map((g) => (
            <ScheduleGroup key={g.key} group={g} hueFor={hueFor} onCancel={cancel} />
          ))}

          {/* Past events (collapsed) */}
          {pastGroups.length > 0 && (
            <div className="mt-6">
              <button
                type="button"
                onClick={() => setShowPast((p) => !p)}
                aria-expanded={showPast}
                className="flex w-full items-center justify-between rounded-xl border border-border bg-surface-raised px-4 py-2.5 text-sm font-medium text-content-muted hover:text-content"
              >
                <span>Past events ({pastGroups.reduce((n, g) => n + g.items.length, 0)})</span>
                <ChevronDownIcon
                  width={16}
                  height={16}
                  aria-hidden="true"
                  className={`transition-transform ${showPast ? "rotate-180" : ""}`}
                />
              </button>
              {showPast && (
                <div className="mt-2 opacity-70">
                  {pastGroups.map((g) => (
                    <ScheduleGroup key={g.key} group={g} hueFor={hueFor} onCancel={cancel} past />
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}

      <BackToTop />

      {/* Clear-all confirmation modal */}
      {showClear && (
        <div className="fixed inset-0 z-[70] grid place-items-center p-4" role="dialog" aria-modal="true" aria-label="Clear all registrations">
          <div className="absolute inset-0 bg-black/40 animate-fade-in-fast" onClick={() => setShowClear(false)} />
          <div className="relative z-10 w-full max-w-sm rounded-2xl border border-border bg-surface-raised p-5 shadow-xl animate-slide-up">
            <h2 className="text-base font-semibold text-content">Clear all registrations?</h2>
            <p className="mt-1.5 text-sm text-content-muted">
              This removes all {registered.length} registered events from your schedule. This can't be undone.
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <button type="button" onClick={() => setShowClear(false)} className="btn-ghost">
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  clearAll();
                  setShowClear(false);
                  toast.info("All registrations cleared");
                }}
                className="btn bg-rose-500 px-4 py-2 text-white hover:opacity-90"
              >
                Clear all
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Print-only schedule (PDF export) */}
      {registered.length > 0 && (
        <div id="print-root" aria-hidden="true">
          <h1 className="print-title">My RVCE Campus Events Schedule</h1>
          <p className="print-meta">
            {registered.length} registered event{registered.length === 1 ? "" : "s"} · Exported{" "}
            {formatDateShort(Date.now())}
          </p>
          {[...upcomingGroups, ...pastGroups].map((g) => (
            <div key={g.key}>
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
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  sub,
  icon,
  warn,
}: {
  label: string;
  value: string;
  sub: string;
  icon: string;
  warn?: boolean;
}) {
  return (
    <div className={`rounded-2xl border p-4 ${warn ? "border-amber-500/40 bg-amber-500/10" : "border-border bg-surface-raised"}`}>
      <p className="text-xs text-content-muted">
        <span aria-hidden="true">{icon}</span> {label}
      </p>
      <p className="mt-1 truncate text-base font-bold text-content" title={value}>
        {value}
      </p>
      <p className="text-xs text-content-faint">{sub}</p>
    </div>
  );
}

function ScheduleGroup({
  group,
  hueFor,
  onCancel,
  past = false,
}: {
  group: Group;
  hueFor: (club: string) => number;
  onCancel: (id: string) => void;
  past?: boolean;
}) {
  return (
    <section className="mb-4">
      <div className="sticky top-16 z-10 -mx-1 mb-2 bg-surface-subtle/90 px-1 py-1.5 backdrop-blur-sm">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-content">
          {group.label}
          {group.today && !past && (
            <span className="rounded-full bg-brand px-2 py-0.5 text-[11px] font-bold text-brand-fg">TODAY</span>
          )}
        </h2>
      </div>
      <div className="space-y-2.5">
        {group.items.map((e) => (
          <ScheduleEntry key={e.id} event={e} hue={hueFor(e.organizer)} onCancel={onCancel} />
        ))}
      </div>
    </section>
  );
}

function ScheduleEntry({
  event,
  hue,
  onCancel,
}: {
  event: CampusEvent;
  hue: number;
  onCancel: (id: string) => void;
}) {
  const now = Date.now();
  const happeningNow =
    event.startTime !== null && Math.abs(differenceInMinutes(event.startTime, now)) <= 60;
  const today = event.startTime !== null && isToday(event.startTime);

  return (
    <article
      className={`rounded-2xl border bg-surface-raised p-4 transition-colors ${
        today && !happeningNow
          ? "border-brand/50 animate-pulse-border"
          : happeningNow
          ? "border-rose-500/50"
          : "border-border"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-brand">{formatTime(event.startTime) || "Time TBA"}</span>
            <CategoryBadge category={event.category} />
            {happeningNow && (
              <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/15 px-2 py-0.5 text-[11px] font-bold text-rose-600 dark:text-rose-400">
                🔴 HAPPENING NOW
              </span>
            )}
            {event.isCancelled && (
              <span className="rounded-full bg-rose-500/12 px-2 py-0.5 text-[11px] font-semibold text-rose-600 dark:text-rose-300">
                Cancelled
              </span>
            )}
          </div>
          <Link
            to={`/event/${encodeURIComponent(event.id)}`}
            className="font-semibold text-content hover:text-brand hover:underline"
          >
            {event.title}
          </Link>
          <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-content-muted">
            <span className="inline-flex items-center gap-1.5">
              <span style={clubHueStyle(hue)} className="club-swatch h-2.5 w-2.5 rounded-full" aria-hidden="true" />
              {event.organizer}
            </span>
            {event.location?.building && (
              <span className="inline-flex items-center gap-1">
                <MapPinIcon width={12} height={12} aria-hidden="true" /> {event.location.building}
              </span>
            )}
          </p>
          <PersonalNotes eventId={event.id} />
        </div>
        <button
          type="button"
          onClick={() => onCancel(event.id)}
          aria-label={`Cancel registration for ${event.title}`}
          className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium text-content-muted hover:border-rose-500/50 hover:text-rose-600 dark:hover:text-rose-400"
        >
          <CloseIcon width={13} height={13} aria-hidden="true" /> Cancel
        </button>
      </div>
    </article>
  );
}
