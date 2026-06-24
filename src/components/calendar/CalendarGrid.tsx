import { format, isSameMonth } from "date-fns";
import type { CampusEvent } from "@/types";
import { DayCell } from "./DayCell";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

/**
 * The 7-column day grid. Renders a full month (6 weeks) or a single week.
 * Day → events lookup is precomputed by the parent (only the visible range),
 * so this stays cheap even with the full dataset.
 */
export function CalendarGrid({
  days,
  monthAnchor,
  view,
  slideKey,
  slideDir,
  eventsByDay,
  hueFor,
  isFaded,
  onShowMore,
}: {
  days: Date[];
  monthAnchor: Date;
  view: "month" | "week";
  slideKey: string;
  slideDir: "left" | "right";
  eventsByDay: Map<string, CampusEvent[]>;
  hueFor: (club: string) => number;
  isFaded: (e: CampusEvent) => boolean;
  onShowMore: (date: Date, events: CampusEvent[]) => void;
}) {
  const isWeek = view === "week";
  const maxVisible = isWeek ? 8 : 3;

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-surface-raised">
      {/* Weekday header */}
      <div className="grid grid-cols-7 border-b border-border bg-surface-subtle/60">
        {WEEKDAYS.map((d) => (
          <div
            key={d}
            className="border-r border-border-subtle px-2 py-2 text-center text-[11px] font-semibold uppercase tracking-wide text-content-faint last:border-r-0"
          >
            {d}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div
        key={slideKey}
        className={`grid grid-cols-7 ${
          slideDir === "right" ? "animate-slide-from-right" : "animate-slide-from-left"
        }`}
      >
        {days.map((date) => (
          <DayCell
            key={date.toISOString()}
            date={date}
            events={eventsByDay.get(format(date, "yyyy-MM-dd")) ?? []}
            inMonth={isWeek || isSameMonth(date, monthAnchor)}
            maxVisible={maxVisible}
            tall={isWeek}
            hueFor={hueFor}
            isFaded={isFaded}
            onShowMore={onShowMore}
          />
        ))}
      </div>
    </div>
  );
}
