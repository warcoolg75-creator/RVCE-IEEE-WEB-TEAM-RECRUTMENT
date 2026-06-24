import { memo } from "react";
import { Link } from "react-router-dom";
import type { CampusEvent } from "@/types";
import { formatDateShort, formatTime, relativeLabel } from "@/utils/dateHelpers";
import { useData } from "@/store/DataContext";
import { getClubColorMap, hueForClub, clubHueStyle } from "@/utils/clubColors";
import { scoreEvent, RECOMMEND_THRESHOLD } from "@/utils/branchRelevance";
import { CategoryBadge } from "./CategoryBadge";
import { BookmarkButton } from "./BookmarkButton";
import { ShareButton } from "./ShareButton";
import { RegistrationBar } from "./RegistrationBar";
import { RegisterButton } from "./registration/RegisterButton";
import { RegistrationBadge } from "./registration/RegistrationBadge";
import { CalendarIcon, MapPinIcon, UsersIcon, TicketIcon } from "./icons";

/**
 * Event summary card used on the feed and bookmarks pages. Every field is
 * rendered through the normalized model, so missing data degrades gracefully
 * (no "undefined" / "NaN" ever reaches the DOM).
 *
 * When a `branch` is provided (Feed with "Recommended for your branch" active)
 * the card shows a "Recommended" badge for relevant events and dims those with
 * zero relevance — without ever hiding them.
 */
function EventCardImpl({
  event,
  branch = "",
  focused = false,
}: {
  event: CampusEvent;
  branch?: string;
  focused?: boolean;
}) {
  const { facets } = useData();
  const hue = hueForClub(event.organizer, getClubColorMap(facets.organizers));

  const score = branch ? scoreEvent(event, branch) : 0;
  const recommended = score >= RECOMMEND_THRESHOLD;
  const faded = branch !== "" && score === 0;
  const hasCapacity =
    event.currentRegistrations !== null && event.maxCapacity !== null && event.maxCapacity > 0;

  const rel = relativeLabel(event.startTime);
  const hasRealDate = event.startTime !== null;
  const dateText = hasRealDate
    ? formatDateShort(event.startTime)
    : event.fuzzyDate ?? "Date to be announced";
  const timeText = formatTime(event.startTime);

  return (
    <Link
      to={`/event/${encodeURIComponent(event.id)}`}
      style={clubHueStyle(hue)}
      className={`group club-accent card-surface relative flex h-full cursor-pointer flex-col p-5 pl-6 transition-all duration-150
        hover:border-brand/50 hover:shadow-lg hover:shadow-black/5 hover:-translate-y-0.5
        focus-visible:border-brand ${faded ? "opacity-70 hover:opacity-100" : ""} ${
          focused ? "ring-2 ring-brand ring-offset-2 ring-offset-surface-subtle" : ""
        }`}
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <CategoryBadge category={event.category} />
          <RegistrationBadge eventId={event.id} />
          {recommended && (
            <span className="inline-flex items-center gap-1 rounded-full bg-brand/12 px-2.5 py-0.5 text-xs font-semibold text-brand ring-1 ring-inset ring-brand/30">
              ✨ Recommended
            </span>
          )}
          {event.isCancelled && (
            <span className="inline-flex items-center rounded-full bg-rose-500/12 px-2.5 py-0.5 text-xs font-semibold text-rose-600 ring-1 ring-inset ring-rose-500/25 dark:text-rose-300">
              Cancelled
            </span>
          )}
          {rel && !event.isCancelled && (
            <span className="text-xs font-medium text-brand">{rel}</span>
          )}
        </div>
        {/* actions: subtly dimmed on desktop until hover/focus; always full on touch */}
        <div className="-mr-1 -mt-1 flex shrink-0 items-center opacity-100 transition-opacity duration-150 sm:opacity-60 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
          <ShareButton event={event} />
          <BookmarkButton id={event.id} title={event.title} />
        </div>
      </div>

      <h3
        className={`text-[15px] font-semibold leading-snug text-content line-clamp-2 ${
          event.isCancelled ? "line-through decoration-content-faint/60" : ""
        }`}
      >
        {event.title}
      </h3>

      <p className="mt-1 text-xs font-medium text-content-muted">{event.organizer}</p>

      {event.snippet && (
        <p className="mt-3 text-sm leading-relaxed text-content-muted line-clamp-2">
          {event.snippet}
        </p>
      )}

      <div className="mt-auto pt-4">
        <div className="flex flex-col gap-1.5 text-xs text-content-muted">
          <span className="inline-flex items-center gap-1.5">
            <CalendarIcon width={14} height={14} aria-hidden="true" className="text-content-faint" />
            <span className={`truncate ${hasRealDate ? "" : "italic text-content-faint"}`}>
              {dateText}
              {timeText && <span className="text-content-faint"> · {timeText}</span>}
            </span>
          </span>
          {event.location?.building && (
            <span className="inline-flex items-center gap-1.5">
              <MapPinIcon width={14} height={14} aria-hidden="true" className="text-content-faint" />
              <span className="truncate">{event.location.building}</span>
            </span>
          )}
        </div>

        {(event.currentRegistrations !== null || event.requiresTicket) && (
          <div className="mt-3 border-t border-border-subtle pt-3 text-xs text-content-faint">
            {hasCapacity ? (
              <RegistrationBar
                registrations={event.currentRegistrations}
                capacity={event.maxCapacity}
              />
            ) : (
              event.currentRegistrations !== null && (
                <span className="inline-flex items-center gap-1">
                  <UsersIcon width={13} height={13} aria-hidden="true" />
                  {event.currentRegistrations.toLocaleString()} registered
                </span>
              )
            )}
            {event.requiresTicket && (
              <span className="mt-1.5 inline-flex items-center gap-1">
                <TicketIcon width={13} height={13} aria-hidden="true" /> Ticketed
              </span>
            )}
          </div>
        )}

        <div className="mt-3 flex justify-end">
          <RegisterButton event={event} />
        </div>
      </div>
    </Link>
  );
}

export const EventCard = memo(EventCardImpl);
