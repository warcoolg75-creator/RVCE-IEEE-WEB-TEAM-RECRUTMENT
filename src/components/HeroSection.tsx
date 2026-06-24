import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  addDays,
  differenceInMinutes,
  formatDistanceToNowStrict,
  isToday,
  startOfDay,
} from "date-fns";
import type { CampusEvent } from "@/types";
import { useData } from "@/store/DataContext";
import { getClubColorMap, hueForClub, clubHueStyle } from "@/utils/clubColors";
import { formatTime } from "@/utils/dateHelpers";
import { CategoryBadge } from "./CategoryBadge";
import { BookmarkButton } from "./BookmarkButton";
import { CalendarIcon } from "./icons";

type Tab = "now" | "today" | "week";

const HOUR = 60;

/**
 * Horizontally-scrollable hero at the top of the Feed showing what's
 * Now / Today / This Week. Hidden entirely when nothing is on this week.
 */
export function HeroSection() {
  const { events, facets } = useData();
  const clubColorMap = useMemo(() => getClubColorMap(facets.organizers), [facets.organizers]);

  const { now, today, week, nextUp } = useMemo(() => {
    const t = Date.now();
    const dayStart = startOfDay(t).getTime();
    const weekEnd = addDays(t, 7).getTime();

    const dated = events.filter((e) => e.startTime !== null) as (CampusEvent & {
      startTime: number;
    })[];

    const now = dated.filter((e) => Math.abs(differenceInMinutes(e.startTime, t)) <= HOUR);
    const today = dated.filter((e) => isToday(e.startTime)).sort((a, b) => a.startTime - b.startTime);
    const week = dated
      .filter((e) => e.startTime >= dayStart && e.startTime <= weekEnd)
      .sort((a, b) => a.startTime - b.startTime);

    const upcoming = dated
      .filter((e) => e.startTime >= t)
      .sort((a, b) => a.startTime - b.startTime);

    return { now, today, week, nextUp: upcoming[0] ?? null };
  }, [events]);

  const [tab, setTab] = useState<Tab>("now");

  // Hide the whole section when there's nothing this week.
  if (week.length === 0) return null;

  const list = tab === "now" ? now : tab === "today" ? today : week;

  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: "now", label: "Now", count: now.length },
    { key: "today", label: "Today", count: today.length },
    { key: "week", label: "This Week", count: week.length },
  ];

  return (
    <section className="mb-6 animate-fade-in" aria-label="Events happening soon">
      <div className="mb-3 flex items-center gap-1.5">
        {tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            aria-pressed={tab === t.key}
            className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-sm font-medium transition-colors ${
              tab === t.key
                ? "bg-brand text-brand-fg"
                : "text-content-muted hover:bg-surface hover:text-content"
            }`}
          >
            {t.key === "now" && (
              <span className="relative flex h-2 w-2">
                <span
                  className={`absolute inline-flex h-full w-full rounded-full ${
                    now.length ? "animate-ping bg-rose-400" : "bg-content-faint"
                  } opacity-75`}
                />
                <span
                  className={`relative inline-flex h-2 w-2 rounded-full ${
                    now.length ? "bg-rose-500" : "bg-content-faint"
                  }`}
                />
              </span>
            )}
            {t.label}
            <span
              className={`rounded-full px-1.5 text-[11px] font-bold ${
                tab === t.key ? "bg-white/20" : "bg-surface-subtle text-content-faint"
              }`}
            >
              {t.count}
            </span>
          </button>
        ))}
      </div>

      {list.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border px-4 py-5 text-sm text-content-muted">
          {tab === "now" ? (
            nextUp ? (
              <>
                No events right now — Next up:{" "}
                <Link
                  to={`/event/${encodeURIComponent(nextUp.id)}`}
                  className="font-semibold text-brand hover:underline"
                >
                  {nextUp.title}
                </Link>{" "}
                in {formatDistanceToNowStrict(nextUp.startTime!)}.
              </>
            ) : (
              "No events happening right now."
            )
          ) : (
            "Nothing scheduled for this period."
          )}
        </div>
      ) : (
        <div
          className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2 [scrollbar-width:thin]"
          role="list"
        >
          {list.map((e) => (
            <HeroCard
              key={e.id}
              event={e}
              live={tab === "now"}
              hue={hueForClub(e.organizer, clubColorMap)}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function HeroCard({
  event,
  live,
  hue,
}: {
  event: CampusEvent;
  live: boolean;
  hue: number;
}) {
  return (
    <Link
      to={`/event/${encodeURIComponent(event.id)}`}
      role="listitem"
      style={clubHueStyle(hue)}
      className="club-accent group relative flex w-64 shrink-0 snap-start flex-col gap-2 rounded-2xl border border-border
        bg-surface-raised p-4 pl-5 transition-all hover:border-brand/50 hover:shadow-lg hover:shadow-black/5"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          {live && (
            <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/15 px-2 py-0.5 text-[11px] font-bold text-rose-600 ring-1 ring-inset ring-rose-500/30 dark:text-rose-400">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-rose-500" />
              </span>
              LIVE
            </span>
          )}
          <CategoryBadge category={event.category} />
        </div>
        <BookmarkButton id={event.id} title={event.title} className="-mr-1 -mt-1 shrink-0" />
      </div>

      <h3
        className={`text-sm font-semibold leading-snug text-content line-clamp-2 ${
          event.isCancelled ? "line-through decoration-content-faint/60" : ""
        }`}
      >
        {event.title}
      </h3>

      <p className="text-xs font-medium text-content-muted">{event.organizer}</p>

      <span className="mt-auto inline-flex items-center gap-1.5 text-xs text-content-faint">
        <CalendarIcon width={13} height={13} />
        {formatTime(event.startTime) || "Time TBA"}
      </span>
    </Link>
  );
}
