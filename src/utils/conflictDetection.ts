import type { CampusEvent } from "@/types";

/** Two events conflict if they start within this window on the same day. */
const CONFLICT_WINDOW_MS = 2 * 60 * 60 * 1000; // 2 hours

export interface ConflictPair {
  event1: CampusEvent;
  event2: CampusEvent;
}

function sameLocalDay(a: number, b: number): boolean {
  const da = new Date(a);
  const db = new Date(b);
  return (
    da.getFullYear() === db.getFullYear() &&
    da.getMonth() === db.getMonth() &&
    da.getDate() === db.getDate()
  );
}

/** Do two events clash (same day, start times within 2 hours)? */
export function eventsConflict(a: CampusEvent, b: CampusEvent): boolean {
  if (a.id === b.id) return false;
  if (a.startTime === null || b.startTime === null) return false;
  if (!sameLocalDay(a.startTime, b.startTime)) return false;
  return Math.abs(a.startTime - b.startTime) <= CONFLICT_WINDOW_MS;
}

/**
 * Find all conflicting pairs among a set of (bookmarked) events. Runs in
 * O(n log n + pairs): events are sorted by start time so the inner loop breaks
 * as soon as the gap exceeds the window.
 */
export function findConflicts(events: CampusEvent[]): ConflictPair[] {
  const dated = events
    .filter((e): e is CampusEvent & { startTime: number } => e.startTime !== null)
    .sort((a, b) => a.startTime - b.startTime);

  const pairs: ConflictPair[] = [];
  for (let i = 0; i < dated.length; i++) {
    for (let j = i + 1; j < dated.length; j++) {
      if (dated[j].startTime - dated[i].startTime > CONFLICT_WINDOW_MS) break;
      if (sameLocalDay(dated[i].startTime, dated[j].startTime)) {
        pairs.push({ event1: dated[i], event2: dated[j] });
      }
    }
  }
  return pairs;
}

/** Events in `others` that clash with `event` (excluding itself). */
export function conflictsWith(event: CampusEvent, others: CampusEvent[]): CampusEvent[] {
  return others.filter((o) => eventsConflict(event, o));
}
