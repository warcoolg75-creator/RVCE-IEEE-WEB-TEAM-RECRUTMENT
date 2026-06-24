import { isToday as dfIsToday } from "date-fns";
import type { CampusEvent } from "@/types";
import { EventPill } from "./EventPill";

/**
 * One day in the month/week grid: day number, today highlight, out-of-month
 * dimming, a small "has events" dot, up to `maxVisible` pills and a "+N more".
 */
export function DayCell({
  date,
  events,
  inMonth,
  maxVisible,
  hueFor,
  isFaded,
  onShowMore,
  tall = false,
}: {
  date: Date;
  events: CampusEvent[];
  inMonth: boolean;
  maxVisible: number;
  hueFor: (club: string) => number;
  isFaded: (e: CampusEvent) => boolean;
  onShowMore: (date: Date, events: CampusEvent[]) => void;
  tall?: boolean;
}) {
  const today = dfIsToday(date);
  const visible = events.slice(0, maxVisible);
  const overflow = events.length - visible.length;

  return (
    <div
      className={`flex min-h-0 flex-col gap-1 border-b border-r border-border-subtle p-1.5 ${
        tall ? "min-h-[8rem]" : "min-h-[6.5rem]"
      } ${inMonth ? "bg-surface-raised" : "bg-surface-subtle/40"}`}
    >
      <div className="flex items-center justify-between">
        <span
          className={`grid h-6 min-w-[1.5rem] place-items-center rounded-full px-1 text-xs font-semibold ${
            today
              ? "bg-brand text-brand-fg"
              : inMonth
              ? "text-content"
              : "text-content-faint"
          }`}
        >
          {date.getDate()}
        </span>
        {events.length > 0 && (
          <span
            className="h-1.5 w-1.5 rounded-full bg-brand/70"
            aria-label={`${events.length} events`}
          />
        )}
      </div>

      <div className="flex flex-col gap-0.5 overflow-hidden">
        {visible.map((e) => (
          <EventPill
            key={e.id}
            event={e}
            hue={hueFor(e.organizer)}
            faded={isFaded(e)}
            showTime={tall}
          />
        ))}
        {overflow > 0 && (
          <button
            type="button"
            onClick={() => onShowMore(date, events)}
            className="mt-0.5 rounded px-1.5 py-0.5 text-left text-[11px] font-semibold text-brand hover:bg-brand-subtle"
          >
            +{overflow} more
          </button>
        )}
      </div>
    </div>
  );
}
