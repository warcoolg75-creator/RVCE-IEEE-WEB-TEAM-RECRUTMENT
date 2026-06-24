import { useEffect, useMemo, useRef, useState } from "react";
import { format, isToday } from "date-fns";
import type { CampusEvent } from "@/types";
import { EmptyState } from "@/components/empty-states/EmptyState";
import { ListIcon } from "@/components/icons";
import { TimelineNode } from "./TimelineNode";

const PAGE = 50;

/**
 * Vertical, date-grouped timeline of the (already filtered) events. Events are
 * rendered incrementally — a sentinel near the bottom loads the next page via
 * IntersectionObserver — so it stays smooth even with thousands of events.
 */
export function TimelineView({
  events,
  branch = "",
}: {
  events: CampusEvent[];
  branch?: string;
}) {
  // Timeline is inherently chronological: dated events ascending, undated last.
  const ordered = useMemo(() => {
    return [...events].sort((a, b) => {
      if (a.startTime === null) return b.startTime === null ? 0 : 1;
      if (b.startTime === null) return -1;
      return a.startTime - b.startTime;
    });
  }, [events]);

  const [limit, setLimit] = useState(PAGE);
  useEffect(() => setLimit(PAGE), [ordered]);

  const sentinelRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setLimit((l) => Math.min(l + PAGE, ordered.length));
        }
      },
      { rootMargin: "600px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [ordered.length]);

  // Group the currently-visible slice by calendar day.
  const groups = useMemo(() => {
    const slice = ordered.slice(0, limit);
    const map = new Map<string, { label: string; today: boolean; items: CampusEvent[] }>();
    for (const e of slice) {
      const key = e.startTime !== null ? format(e.startTime, "yyyy-MM-dd") : "tba";
      let g = map.get(key);
      if (!g) {
        g =
          e.startTime !== null
            ? { label: format(e.startTime, "EEEE, d MMM yyyy"), today: isToday(e.startTime), items: [] }
            : { label: "Date to be announced", today: false, items: [] };
        map.set(key, g);
      }
      g.items.push(e);
    }
    return [...map.values()];
  }, [ordered, limit]);

  if (events.length === 0) {
    return (
      <EmptyState
        icon={<ListIcon width={24} height={24} aria-hidden="true" />}
        title="Nothing on the timeline"
        message="No events in this date range for the timeline."
      />
    );
  }

  return (
    <div className="relative">
      {groups.map((g) => (
        <section key={g.label} className="mb-2">
          <div className="sticky top-[8.5rem] z-10 -mx-1 mb-2 bg-surface-subtle/90 px-1 py-1.5 backdrop-blur-sm">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-content">
              {g.label}
              {g.today && (
                <span className="rounded-full bg-brand px-2 py-0.5 text-[11px] font-bold text-brand-fg">
                  TODAY
                </span>
              )}
            </h2>
          </div>
          {/* vertical line + nodes */}
          <div className="relative ml-1 space-y-2.5 border-l-2 border-border-subtle pb-2">
            {g.items.map((e) => (
              <TimelineNode key={e.id} event={e} branch={branch} />
            ))}
          </div>
        </section>
      ))}
      {limit < ordered.length && <div ref={sentinelRef} className="h-10" aria-hidden="true" />}
    </div>
  );
}
