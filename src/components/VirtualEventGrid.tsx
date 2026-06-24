import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useWindowVirtualizer } from "@tanstack/react-virtual";
import type { CampusEvent } from "@/types";
import { EventCard } from "./EventCard";

/**
 * Windowed (virtualized) responsive grid. Only the rows visible in the
 * viewport are mounted, so rendering stays smooth even with 12,000 events.
 * Uses the *window* as the scroll container (whole-page scroll) and measures
 * row heights dynamically so variable-height cards line up correctly.
 */
export function VirtualEventGrid({
  events,
  branch = "",
  focusedIndex = -1,
}: {
  events: CampusEvent[];
  /** When set, cards show branch-relevance badges/fading. */
  branch?: string;
  /** Index of the keyboard-focused card (J/K navigation), or -1. */
  focusedIndex?: number;
}) {
  const parentRef = useRef<HTMLDivElement>(null);
  const [cols, setCols] = useState(3);

  // Track column count from the container width.
  useLayoutEffect(() => {
    const el = parentRef.current;
    if (!el) return;
    const compute = (w: number) => (w < 620 ? 1 : w < 1024 ? 2 : 3);
    const ro = new ResizeObserver((entries) => {
      const w = entries[0].contentRect.width;
      setCols((prev) => {
        const next = compute(w);
        return next === prev ? prev : next;
      });
    });
    ro.observe(el);
    setCols(compute(el.getBoundingClientRect().width));
    return () => ro.disconnect();
  }, []);

  const rowCount = Math.ceil(events.length / cols);

  const virtualizer = useWindowVirtualizer({
    count: rowCount,
    estimateSize: () => 252,
    overscan: 5,
    scrollMargin: parentRef.current?.offsetTop ?? 0,
    getItemKey: (index) => `row-${index}-${cols}`,
  });

  // Re-measure when the column count changes (row composition changes).
  useEffect(() => {
    virtualizer.measure();
  }, [cols, virtualizer]);

  // Scroll the keyboard-focused card's row into view.
  useEffect(() => {
    if (focusedIndex >= 0) {
      virtualizer.scrollToIndex(Math.floor(focusedIndex / cols), { align: "auto" });
    }
  }, [focusedIndex, cols, virtualizer]);

  const items = virtualizer.getVirtualItems();

  return (
    <div ref={parentRef} className="relative w-full">
      <div style={{ height: virtualizer.getTotalSize(), position: "relative" }}>
        {items.map((virtualRow) => {
          const start = virtualRow.index * cols;
          const rowEvents = events.slice(start, start + cols);
          return (
            <div
              key={virtualRow.key}
              data-index={virtualRow.index}
              ref={virtualizer.measureElement}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                transform: `translateY(${virtualRow.start - virtualizer.options.scrollMargin}px)`,
              }}
            >
              <div
                className="grid gap-4 pb-4"
                style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
              >
                {rowEvents.map((event, i) => (
                  <EventCard
                    key={event.id}
                    event={event}
                    branch={branch}
                    focused={start + i === focusedIndex}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
