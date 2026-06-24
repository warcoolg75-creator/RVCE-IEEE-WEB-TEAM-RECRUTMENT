import type {
  CampusEvent,
  EventLocation,
  FilterFacets,
  GeoCoordinates,
  NormalizationReport,
  OrganizerSocials,
} from "@/types";
import {
  CATEGORY_RULES,
  TAG_CANONICAL,
  UNCATEGORIZED,
} from "./constants";
import { parseEventDate } from "./dateHelpers";
import {
  cleanEmail,
  cleanOrNull,
  coerceNumber,
  coerceToString,
  sanitizeText,
  stableHash,
  truncate,
} from "./text";

/**
 * The single runtime data-cleaning entry point.
 *
 * Takes the raw, untrusted JSON (anything at all) and returns a fully typed,
 * de-duplicated, UI-safe `CampusEvent[]` plus filter facets and a diagnostics
 * report. It NEVER throws — every field passes through a safe accessor and
 * falls back to a sensible default. Issues are tallied and logged to the
 * console as warnings.
 */
export function normalizeEvents(raw: unknown): {
  events: CampusEvent[];
  facets: FilterFacets;
  report: NormalizationReport;
} {
  const report: NormalizationReport = {
    totalRaw: 0,
    kept: 0,
    skippedNotObject: 0,
    duplicatesRemoved: 0,
    idCollisionsResolved: 0,
    missingDates: 0,
    unparseableDates: 0,
    coercedNumbers: 0,
    repairedEmails: 0,
    htmlSanitized: 0,
    missingNames: 0,
    missingDescriptions: 0,
    duplicateExamples: [],
    dateFormats: { iso: 0, dmy: 0, epoch: 0, unparseable: 0, missing: 0 },
    missingFieldCounts: {},
  };
  const missingField = (key: string) => {
    report.missingFieldCounts[key] = (report.missingFieldCounts[key] ?? 0) + 1;
  };

  const list: unknown[] = Array.isArray(raw)
    ? raw
    : isRecord(raw) && Array.isArray((raw as Record<string, unknown>).events)
    ? ((raw as Record<string, unknown>).events as unknown[])
    : isRecord(raw) && Array.isArray((raw as Record<string, unknown>).data)
    ? ((raw as Record<string, unknown>).data as unknown[])
    : [];

  report.totalRaw = list.length;

  // --- Pass 1: normalize each record into a draft (no final id yet) ---
  interface Draft {
    event: Omit<CampusEvent, "id">;
    originalId: string | null;
    signature: string;
    completeness: number;
  }

  const drafts: Draft[] = [];

  for (const item of list) {
    if (!isRecord(item)) {
      report.skippedNotObject++;
      continue;
    }

    const rawTitle = cleanOrNull(item.title);
    if (rawTitle === null) {
      report.missingNames++;
      missingField("name");
    }
    const title = rawTitle ?? "Untitled Event";
    const organizer = cleanOrNull(item.host_club) ?? "Unknown Organizer";
    const category = deriveCategory(title);

    const emailResult = cleanEmail(item.contact_email);
    if (emailResult.repaired) report.repairedEmails++;
    if (!emailResult.email) missingField("contact email");

    classifyDateFormat(item.start_time, report);
    const start = parseEventDate(item.start_time);
    const end = parseEventDate(item.end_time);
    if (start.ts === null) {
      missingField("date");
      if (start.fuzzy) report.unparseableDates++;
      else report.missingDates++;
    }

    const desc = sanitizeText(item.description);
    if (desc.hadHtml) report.htmlSanitized++;
    if (desc.text === "") {
      report.missingDescriptions++;
      missingField("description");
    }

    const reg = coerceNumber(item.current_registrations);
    const cap = coerceNumber(item.max_capacity);
    if (reg.coerced || cap.coerced) report.coercedNumbers++;

    const location = normalizeLocation(item.location);
    const tags = normalizeTags(item.tags);
    const socials = normalizeSocials(item.organizer_socials);
    const createdAt = parseEventDate(item.created_at).ts;

    if (!location) missingField("location");
    if (tags.length === 0) missingField("tags");
    if (!socials) missingField("organizer socials");
    if (coerceNumber(item.current_registrations).value === null) missingField("registrations");
    if (coerceNumber(item.max_capacity).value === null) missingField("capacity");

    const event: Omit<CampusEvent, "id"> = {
      title,
      organizer,
      category,
      contactEmail: emailResult.email,
      startTime: start.ts,
      endTime: end.ts,
      fuzzyDate: start.fuzzy,
      description: desc.text,
      snippet: truncate(desc.text, 170),
      location,
      tags,
      socials,
      currentRegistrations: clampCount(reg.value),
      maxCapacity: clampCount(cap.value),
      isCancelled: toBool(item.is_cancelled),
      requiresTicket: toBool(item.requires_ticket),
      createdAt,
    };

    const signature = [
      title.toLowerCase(),
      start.ts ?? start.fuzzy ?? "no-date",
      organizer.toLowerCase(),
      stableHash(desc.text.slice(0, 64)),
    ].join("|");

    drafts.push({
      event,
      originalId: cleanOrNull(item.id),
      signature,
      completeness: scoreCompleteness(event),
    });
  }

  // --- Pass 2: de-duplicate (same title + same calendar day) ---
  // Events without a real date are never collapsed together (each kept).
  const bestByKey = new Map<string, Draft>();
  const order: string[] = [];

  for (const draft of drafts) {
    const dayKey =
      draft.event.startTime !== null
        ? `${draft.event.title.toLowerCase()}|${dayStamp(draft.event.startTime)}`
        : `unique|${draft.signature}|${order.length}`;

    const existing = bestByKey.get(dayKey);
    if (!existing) {
      bestByKey.set(dayKey, draft);
      order.push(dayKey);
    } else {
      report.duplicatesRemoved++;
      if (report.duplicateExamples.length < 5) {
        const when =
          draft.event.startTime !== null
            ? new Date(draft.event.startTime).toISOString().slice(0, 10)
            : "no date";
        report.duplicateExamples.push(`${draft.event.title} (${when})`);
      }
      // keep the more complete record
      if (draft.completeness > existing.completeness) {
        bestByKey.set(dayKey, draft);
      }
    }
  }

  // --- Pass 3: assign stable, unique ids ---
  const usedIds = new Set<string>();
  const events: CampusEvent[] = [];

  for (const key of order) {
    const draft = bestByKey.get(key)!;
    let id = draft.originalId ?? "";

    if (id === "" || usedIds.has(id)) {
      if (id !== "") report.idCollisionsResolved++;
      // Deterministic fallback derived from event content.
      id = `evt-${stableHash(draft.signature)}`;
      let n = 1;
      while (usedIds.has(id)) {
        id = `evt-${stableHash(draft.signature)}-${n++}`;
      }
    }
    usedIds.add(id);
    events.push({ id, ...draft.event });
  }

  report.kept = events.length;

  logReport(report);

  return { events, facets: buildFacets(events), report };
}

/* -------------------------------------------------------------------------- */
/*  Field-level normalizers                                                   */
/* -------------------------------------------------------------------------- */

/** Tally which raw date format a start_time value used, for diagnostics. */
function classifyDateFormat(value: unknown, report: NormalizationReport): void {
  const f = report.dateFormats;
  if (value === null || value === undefined || value === "") {
    f.missing++;
    return;
  }
  if (typeof value === "number") {
    f.epoch++;
    return;
  }
  if (typeof value === "string") {
    const raw = value.trim();
    if (/^\d{10,}$/.test(raw)) f.epoch++;
    else if (/^\d{4}-\d{2}-\d{2}/.test(raw)) f.iso++;
    else if (/^\d{2}[/-]\d{2}[/-]\d{4}/.test(raw)) f.dmy++;
    else f.unparseable++;
    return;
  }
  f.unparseable++;
}

function deriveCategory(title: string): string {
  for (const rule of CATEGORY_RULES) {
    if (rule.patterns.some((re) => re.test(title))) return rule.category;
  }
  return UNCATEGORIZED;
}

function normalizeLocation(input: unknown): EventLocation | null {
  if (!isRecord(input)) return null;

  const building = cleanOrNull(input.building);
  const floorNum = coerceNumber(input.floor).value;
  const floor = floorNum !== null && Number.isInteger(floorNum) ? floorNum : null;

  const roomRaw = cleanOrNull(input.room_number);
  const room = roomRaw ? (/^\d+$/.test(roomRaw) ? `Room ${roomRaw}` : roomRaw) : null;

  const coordinates = parseCoordinates(input.map_coordinates);

  const parts = [building, room, floor !== null ? `Floor ${floor}` : null].filter(
    (p): p is string => !!p
  );
  const label = parts.length > 0 ? parts.join(" · ") : "Venue to be announced";

  // Nothing useful at all → treat as no location.
  if (!building && !room && floor === null && !coordinates) return null;

  return { building, room, floor, coordinates, label };
}

function parseCoordinates(input: unknown): GeoCoordinates | null {
  let lat: unknown;
  let lng: unknown;

  if (Array.isArray(input)) {
    [lat, lng] = input;
  } else if (isRecord(input)) {
    lat = input.latitude ?? input.lat;
    lng = input.longitude ?? input.lng;
  } else if (typeof input === "string") {
    const parts = input.split(",").map((s) => s.trim());
    if (parts.length === 2) [lat, lng] = parts;
  }

  const latN = coerceNumber(lat).value;
  const lngN = coerceNumber(lng).value;
  if (
    latN === null ||
    lngN === null ||
    Math.abs(latN) > 90 ||
    Math.abs(lngN) > 180
  ) {
    return null;
  }
  return { lat: latN, lng: lngN };
}

function normalizeTags(input: unknown): string[] {
  if (!Array.isArray(input)) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const t of input) {
    const s = coerceToString(t);
    if (!s) continue;
    const key = s.toLowerCase().replace(/[^a-z0-9]/g, "");
    if (!key) continue;
    const label = TAG_CANONICAL[key] ?? titleCase(s);
    const dedupKey = label.toLowerCase();
    if (seen.has(dedupKey)) continue;
    seen.add(dedupKey);
    out.push(label);
  }
  return out;
}

function normalizeSocials(input: unknown): OrganizerSocials | null {
  let instagram: string | null = null;
  let linkedin: string | null = null;

  const assign = (val: unknown) => {
    const s = cleanOrNull(val);
    if (!s) return;
    if (s.startsWith("@") || /insta/i.test(s)) {
      instagram = instagram ?? s;
    } else if (/linkedin|\/in\/|-/.test(s)) {
      linkedin = linkedin ?? s;
    } else {
      instagram = instagram ?? s;
    }
  };

  if (isRecord(input)) {
    instagram = cleanOrNull(input.instagram);
    linkedin = cleanOrNull(input.linkedin);
  } else if (Array.isArray(input)) {
    for (const v of input) assign(v);
  } else if (typeof input === "string") {
    assign(input);
  }

  if (!instagram && !linkedin) return null;
  return { instagram, linkedin };
}

/* -------------------------------------------------------------------------- */
/*  Small helpers                                                             */
/* -------------------------------------------------------------------------- */

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function toBool(v: unknown): boolean {
  if (typeof v === "boolean") return v;
  if (typeof v === "string") return ["true", "yes", "1"].includes(v.trim().toLowerCase());
  if (typeof v === "number") return v === 1;
  return false;
}

function clampCount(n: number | null): number | null {
  if (n === null) return null;
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.round(n);
}

function dayStamp(ts: number): string {
  const d = new Date(ts);
  return `${d.getUTCFullYear()}-${d.getUTCMonth()}-${d.getUTCDate()}`;
}

function titleCase(s: string): string {
  return s
    .toLowerCase()
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

/** A rough "richness" score so dedup keeps the most informative copy. */
function scoreCompleteness(e: Omit<CampusEvent, "id">): number {
  let s = 0;
  if (e.startTime !== null) s += 3;
  if (e.description.length > 40) s += 2;
  if (e.location) s += 2;
  if (e.contactEmail) s += 1;
  if (e.tags.length) s += 1;
  if (e.currentRegistrations !== null) s += 1;
  if (e.socials) s += 1;
  return s;
}

function buildFacets(events: CampusEvent[]): FilterFacets {
  const categories = new Set<string>();
  const organizers = new Set<string>();
  const tags = new Set<string>();
  const venues = new Set<string>();

  for (const e of events) {
    categories.add(e.category);
    organizers.add(e.organizer);
    for (const t of e.tags) tags.add(t);
    if (e.location?.building) venues.add(e.location.building);
  }

  const sorted = (set: Set<string>) => [...set].sort((a, b) => a.localeCompare(b));
  return {
    categories: sorted(categories),
    organizers: sorted(organizers),
    tags: sorted(tags),
    venues: sorted(venues),
  };
}

function logReport(r: NormalizationReport): void {
  /* eslint-disable no-console */
  console.groupCollapsed(
    `%c[normalizeEvents] %ckept ${r.kept.toLocaleString()} of ${r.totalRaw.toLocaleString()} events`,
    "color:#817cff;font-weight:600",
    "color:inherit"
  );
  if (r.duplicatesRemoved)
    console.warn(`Removed ${r.duplicatesRemoved} duplicate events (same title + day).`);
  if (r.idCollisionsResolved)
    console.warn(`Resolved ${r.idCollisionsResolved} colliding ids with stable hashes.`);
  if (r.missingDates)
    console.warn(`${r.missingDates} events had no date (shown as "Date to be announced").`);
  if (r.unparseableDates)
    console.warn(`${r.unparseableDates} events had unparseable date text (kept as a label).`);
  if (r.coercedNumbers)
    console.warn(`${r.coercedNumbers} events had numeric fields stored as strings (coerced).`);
  if (r.repairedEmails) console.warn(`Repaired ${r.repairedEmails} malformed contact emails.`);
  if (r.htmlSanitized) console.warn(`Sanitized HTML/entities in ${r.htmlSanitized} descriptions.`);
  if (r.skippedNotObject)
    console.warn(`Skipped ${r.skippedNotObject} entries that were not valid objects.`);
  console.groupEnd();
  /* eslint-enable no-console */
}
