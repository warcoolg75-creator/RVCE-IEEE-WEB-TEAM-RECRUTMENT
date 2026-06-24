/**
 * Canonical, normalized domain model used everywhere in the app.
 * The raw JSON is messy (see normalizeEvents.ts); these types describe the
 * clean shape produced *after* runtime normalization. Optional fields are
 * `null`/`undefined` when the source data was missing or unusable — the UI
 * is expected to render a graceful fallback for those, never raw garbage.
 */

export interface GeoCoordinates {
  lat: number;
  lng: number;
}

export interface EventLocation {
  /** Building name, e.g. "Main Auditorium". Null when unknown. */
  building: string | null;
  /** Room as a display string, e.g. "Room 123". Null when unknown. */
  room: string | null;
  /** Floor number. Null when unknown. */
  floor: number | null;
  /** Parsed map coordinates, when present and valid. */
  coordinates: GeoCoordinates | null;
  /** A single-line human label combining the parts, never empty. */
  label: string;
}

export interface OrganizerSocials {
  instagram: string | null;
  linkedin: string | null;
}

/**
 * The clean event used across the UI.
 */
export interface CampusEvent {
  /** Stable, guaranteed-unique id (original when unambiguous, else hashed). */
  id: string;
  title: string;
  organizer: string;
  /** Derived event category/format (Workshop, Hackathon, …) or "Uncategorized". */
  category: string;
  contactEmail: string | null;

  /** Parsed start as epoch ms, or null when missing/unparseable. */
  startTime: number | null;
  /** Parsed end as epoch ms, or null. */
  endTime: number | null;
  /** Raw text when a date was present but unparseable, e.g. "This Saturday". */
  fuzzyDate: string | null;

  /** Full sanitized description (HTML stripped). Empty string when missing. */
  description: string;
  /** Pre-computed short snippet for cards. */
  snippet: string;

  location: EventLocation | null;
  tags: string[];
  socials: OrganizerSocials | null;

  currentRegistrations: number | null;
  maxCapacity: number | null;
  isCancelled: boolean;
  requiresTicket: boolean;

  createdAt: number | null;
}

export type SortKey = "date-asc" | "date-desc" | "name-asc" | "popularity-desc";

export type RegistrationFilter = "all" | "registered" | "not-registered" | "available";

export interface FilterState {
  search: string;
  categories: string[];
  organizers: string[];
  tags: string[];
  venues: string[];
  /** ISO yyyy-mm-dd or "" */
  dateFrom: string;
  dateTo: string;
  sort: SortKey;
  /** Hide events flagged as cancelled. */
  hideCancelled: boolean;
  /** Registration-status filter (combines with all others). */
  registration: RegistrationFilter;
}

/** Distinct values used to populate filter controls. */
export interface FilterFacets {
  categories: string[];
  organizers: string[];
  tags: string[];
  venues: string[];
}

export interface DataState {
  status: "idle" | "loading" | "ready" | "error";
  events: CampusEvent[];
  byId: Map<string, CampusEvent>;
  facets: FilterFacets;
  error: string | null;
  /** Diagnostics surfaced by the normalization layer. */
  report: NormalizationReport | null;
}

export interface NormalizationReport {
  totalRaw: number;
  kept: number;
  skippedNotObject: number;
  duplicatesRemoved: number;
  idCollisionsResolved: number;
  missingDates: number;
  unparseableDates: number;
  coercedNumbers: number;
  repairedEmails: number;
  htmlSanitized: number;
  /** Extended diagnostics surfaced on the /debug dashboard. */
  missingNames: number;
  missingDescriptions: number;
  duplicateExamples: string[];
  dateFormats: {
    iso: number;
    dmy: number;
    epoch: number;
    unparseable: number;
    missing: number;
  };
  /** Per-field count of events where the field is missing/empty. */
  missingFieldCounts: Record<string, number>;
}
