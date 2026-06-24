import { format, isToday } from "date-fns";
import type { CampusEvent } from "@/types";
import { EventPill } from "./EventPill";

/**
 * Mobile-friendly agenda: a vertical list of the visible range's days that
 * have events, each with its full set of pills. Used instead of the grid on
 * small screens, where a 7-column layout is unusable.
 */
export function AgendaList({
  days,
  eventsByDay,
  hueFor,
  isFaded,
  slideKey,
}: {
  days: Date[];
  eventsByDay: Map<string, CampusEvent[]>;
  hueFor: (club: string) => number;
  isFaded: (e: CampusEvent) => boolean;
  slideKey: string;
}) {
  const withEvents = days
    .map((date) => ({ date, events: eventsByDay.get(format(date, "yyyy-MM-dd")) ?? [] }))
    .filter((d) => d.events.length > 0);

  if (withEvents.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border p-10 text-center text-sm text-content-muted">
        No events this period.
      </div>
    );
  }

  return (
    <div key={slideKey} className="animate-fade-in space-y-4">
      {withEvents.map(({ date, events }) => (
        <section key={date.toISOString()} className="rounded-2xl border border-border bg-surface-raised p-3">
          <div className="mb-2 flex items-center gap-2">
            <span
              className={`grid h-9 w-9 place-items-center rounded-xl text-sm font-bold ${
                isToday(date) ? "bg-brand text-brand-fg" : "bg-surface-subtle text-content"
              }`}
            >
              {date.getDate()}
            </span>
            <div>
              <p className="text-sm font-semibold text-content">{format(date, "EEEE")}</p>
              <p className="text-xs text-content-muted">{format(date, "MMMM yyyy")}</p>
            </div>
            <span className="ml-auto text-xs text-content-faint">
              {events.length} event{events.length === 1 ? "" : "s"}
            </span>
          </div>
          <div className="space-y-1">
            {events.map((e) => (
              <EventPill key={e.id} event={e} hue={hueFor(e.organizer)} faded={isFaded(e)} showTime />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
