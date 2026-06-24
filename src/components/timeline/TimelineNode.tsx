import { Link } from "react-router-dom";
import type { CampusEvent } from "@/types";
import { formatTime } from "@/utils/dateHelpers";
import { getClubColorMap, hueForClub, clubHueStyle } from "@/utils/clubColors";
import { scoreEvent } from "@/utils/branchRelevance";
import { useData } from "@/store/DataContext";
import { CategoryBadge } from "@/components/CategoryBadge";
import { BookmarkButton } from "@/components/BookmarkButton";
import { ShareButton } from "@/components/ShareButton";
import { RegistrationBadge } from "@/components/registration/RegistrationBadge";

/** A single event hanging off the vertical timeline line. */
export function TimelineNode({
  event,
  branch = "",
}: {
  event: CampusEvent;
  branch?: string;
}) {
  const { facets } = useData();
  const hue = hueForClub(event.organizer, getClubColorMap(facets.organizers));
  const faded = branch !== "" && scoreEvent(event, branch) === 0;

  return (
    <article className="relative pl-8">
      {/* node dot on the line */}
      <span
        style={clubHueStyle(hue)}
        className="club-swatch absolute left-[7px] top-3 h-3 w-3 -translate-x-1/2 rounded-full ring-4 ring-surface-subtle"
        aria-hidden="true"
      />
      <Link
        to={`/event/${encodeURIComponent(event.id)}`}
        className={`block rounded-xl border border-border bg-surface-raised p-3.5 transition-all duration-150 hover:-translate-y-0.5 hover:border-brand/50 hover:shadow-md hover:shadow-black/5 ${
          faded ? "opacity-70 hover:opacity-100" : ""
        }`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="mb-1 flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-brand">
                {formatTime(event.startTime) || "Time TBA"}
              </span>
              <CategoryBadge category={event.category} />
              <RegistrationBadge eventId={event.id} />
              {event.isCancelled && (
                <span className="rounded-full bg-rose-500/12 px-2 py-0.5 text-[11px] font-semibold text-rose-600 dark:text-rose-300">
                  Cancelled
                </span>
              )}
            </div>
            <h3
              className={`truncate text-sm font-semibold text-content ${
                event.isCancelled ? "line-through decoration-content-faint/60" : ""
              }`}
            >
              {event.title}
            </h3>
            <p className="mt-0.5 truncate text-xs text-content-muted">{event.organizer}</p>
          </div>
          <div className="flex shrink-0 items-center">
            <ShareButton event={event} />
            <BookmarkButton id={event.id} title={event.title} />
          </div>
        </div>
      </Link>
    </article>
  );
}
