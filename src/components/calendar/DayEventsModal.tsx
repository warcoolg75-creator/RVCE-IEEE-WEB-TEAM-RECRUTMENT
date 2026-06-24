import { useEffect } from "react";
import { format } from "date-fns";
import type { CampusEvent } from "@/types";
import { EventPill } from "./EventPill";
import { CloseIcon } from "@/components/icons";

/**
 * Modal listing every event on a given day — opened by the "+N more" link or
 * by clicking a day cell. Closes on backdrop click or Escape.
 */
export function DayEventsModal({
  date,
  events,
  hueFor,
  isFaded,
  onClose,
}: {
  date: Date;
  events: CampusEvent[];
  hueFor: (club: string) => number;
  isFaded: (e: CampusEvent) => boolean;
  onClose: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label={`Events on ${format(date, "d MMMM yyyy")}`}
    >
      <div className="absolute inset-0 bg-black/40 animate-fade-in-fast" onClick={onClose} />
      <div className="relative z-10 flex max-h-[80vh] w-full max-w-md flex-col rounded-2xl border border-border bg-surface-raised shadow-xl animate-slide-up">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div>
            <p className="text-sm font-semibold text-content">{format(date, "EEEE")}</p>
            <p className="text-xs text-content-muted">{format(date, "d MMMM yyyy")}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="grid h-9 w-9 place-items-center rounded-full hover:bg-surface"
          >
            <CloseIcon width={18} height={18} />
          </button>
        </div>
        <div className="flex-1 space-y-1.5 overflow-y-auto p-3">
          <p className="px-1 pb-1 text-xs text-content-faint">
            {events.length} event{events.length === 1 ? "" : "s"}
          </p>
          {events.map((e) => (
            <EventPill
              key={e.id}
              event={e}
              hue={hueFor(e.organizer)}
              faded={isFaded(e)}
              showTime
            />
          ))}
        </div>
      </div>
    </div>
  );
}
