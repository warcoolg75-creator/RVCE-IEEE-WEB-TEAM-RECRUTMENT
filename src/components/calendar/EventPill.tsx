import { Link } from "react-router-dom";
import type { CampusEvent } from "@/types";
import { clubHueStyle } from "@/utils/clubColors";
import { formatTime } from "@/utils/dateHelpers";
import { useRegistrationStore } from "@/store/registrationStore";

/**
 * A single colored event chip shown inside a day cell. Background is the
 * organizing club's color; clicking opens the existing Event Detail page.
 * `faded` dims events that aren't relevant to the selected branch. Registered
 * events get a ✓ and a double-thickness ring so they stand out.
 */
export function EventPill({
  event,
  hue,
  faded = false,
  showTime = false,
}: {
  event: CampusEvent;
  hue: number;
  faded?: boolean;
  showTime?: boolean;
}) {
  const registered = useRegistrationStore((s) => s.registrations.some((r) => r.eventId === event.id));

  return (
    <Link
      to={`/event/${encodeURIComponent(event.id)}`}
      style={clubHueStyle(hue)}
      title={`${event.title} — ${event.organizer}${registered ? " (registered)" : ""}`}
      className={`club-pill block truncate rounded-md px-1.5 py-0.5 text-[11px] font-medium leading-tight
        transition-[opacity,transform] hover:brightness-110 focus-visible:ring-2 focus-visible:ring-white/70 ${
          faded ? "opacity-30 saturate-50 hover:opacity-60" : "opacity-100"
        } ${event.isCancelled ? "line-through" : ""} ${
          registered ? "ring-2 ring-inset ring-white/80" : ""
        }`}
    >
      {registered && <span aria-label="registered" className="mr-0.5 font-bold">✓</span>}
      {showTime && event.startTime !== null && (
        <span className="mr-1 font-semibold opacity-90">{formatTime(event.startTime)}</span>
      )}
      {event.title}
    </Link>
  );
}
