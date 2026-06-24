import type { CampusEvent, FilterState } from "@/types";
import { fold, foldTokens } from "./diacriticSearch";

/**
 * Apply the full filter + sort pipeline (all conditions combine with AND).
 * Search is a tokenized, diacritic- and case-insensitive match across the
 * event's pre-built haystack (title, description, organizer, category, tags,
 * venue) — so "cafe" matches "café".
 */
export function filterAndSortEvents(
  events: CampusEvent[],
  filters: FilterState
): CampusEvent[] {
  const tokens = foldTokens(filters.search);

  const fromTs = filters.dateFrom ? Date.parse(filters.dateFrom) : null;
  // include the whole "to" day
  const toTs = filters.dateTo ? Date.parse(filters.dateTo) + 86_399_999 : null;

  const catSet = new Set(filters.categories);
  const orgSet = new Set(filters.organizers);
  const venueSet = new Set(filters.venues);
  const tagSet = new Set(filters.tags);

  const result = events.filter((e) => {
    if (filters.hideCancelled && e.isCancelled) return false;
    if (catSet.size && !catSet.has(e.category)) return false;
    if (orgSet.size && !orgSet.has(e.organizer)) return false;
    if (venueSet.size && !(e.location?.building && venueSet.has(e.location.building)))
      return false;
    // tags: event must contain *all* selected tags (AND)
    if (tagSet.size) {
      for (const t of tagSet) if (!e.tags.includes(t)) return false;
    }

    if (fromTs !== null || toTs !== null) {
      if (e.startTime === null) return false;
      if (fromTs !== null && e.startTime < fromTs) return false;
      if (toTs !== null && e.startTime > toTs) return false;
    }

    if (tokens.length) {
      const hay = searchHaystack(e);
      for (const tok of tokens) if (!hay.includes(tok)) return false;
    }
    return true;
  });

  return sortEvents(result, filters.sort);
}

const haystackCache = new WeakMap<CampusEvent, string>();

function searchHaystack(e: CampusEvent): string {
  const cached = haystackCache.get(e);
  if (cached) return cached;
  const hay = fold(
    [
      e.title,
      e.organizer,
      e.category,
      e.description,
      e.tags.join(" "),
      e.location?.label ?? "",
      e.fuzzyDate ?? "",
    ].join(" ")
  );
  haystackCache.set(e, hay);
  return hay;
}

function sortEvents(events: CampusEvent[], sort: FilterState["sort"]): CampusEvent[] {
  const arr = [...events];
  switch (sort) {
    case "name-asc":
      return arr.sort((a, b) => a.title.localeCompare(b.title));
    case "popularity-desc":
      return arr.sort(
        (a, b) => (b.currentRegistrations ?? -1) - (a.currentRegistrations ?? -1)
      );
    case "date-desc":
      return arr.sort((a, b) => dateRank(b.startTime) - dateRank(a.startTime));
    case "date-asc":
    default:
      // upcoming first; events without a date sink to the bottom
      return arr.sort((a, b) => dateRankAsc(a.startTime) - dateRankAsc(b.startTime));
  }
}

function dateRank(ts: number | null): number {
  return ts === null ? -Infinity : ts;
}
function dateRankAsc(ts: number | null): number {
  return ts === null ? Infinity : ts;
}

/** Related events: same category or organizer, excluding the given id. */
export function relatedEvents(
  all: CampusEvent[],
  event: CampusEvent,
  limit = 6
): CampusEvent[] {
  const scored = all
    .filter((e) => e.id !== event.id)
    .map((e) => {
      let score = 0;
      if (e.category === event.category) score += 2;
      if (e.organizer === event.organizer) score += 2;
      const shared = e.tags.filter((t) => event.tags.includes(t)).length;
      score += Math.min(shared, 3);
      return { e, score };
    })
    .filter((x) => x.score > 0);

  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return dateRankAsc(a.e.startTime) - dateRankAsc(b.e.startTime);
  });

  return scored.slice(0, limit).map((x) => x.e);
}
