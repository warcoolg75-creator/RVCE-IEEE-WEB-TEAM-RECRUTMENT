import {
  format,
  formatDistanceToNowStrict,
  isToday,
  isTomorrow,
  isYesterday,
  isThisWeek,
  isValid,
  parse,
} from "date-fns";

/**
 * Plausible bounds for a campus-event timestamp (epoch ms).
 * Used to reject nonsense values that parse but can't be real (e.g. 0, or
 * seconds-since-epoch mistaken for ms).
 */
const MIN_TS = Date.UTC(2000, 0, 1);
const MAX_TS = Date.UTC(2100, 0, 1);

const DMY_FORMATS = [
  "dd/MM/yyyy h:mm a",
  "dd/MM/yyyy H:mm",
  "dd/MM/yyyy",
  "dd-MM-yyyy h:mm a",
  "dd-MM-yyyy",
  "MM/dd/yyyy h:mm a",
];

export interface ParsedDate {
  /** epoch ms when a real date could be derived, else null. */
  ts: number | null;
  /** raw text when a value was present but could not be parsed. */
  fuzzy: string | null;
}

/**
 * Parse the wildly inconsistent date inputs found in the dataset:
 *  - epoch milliseconds (number, or numeric string)
 *  - ISO 8601 strings
 *  - dd/MM/yyyy h:mm a (and a few siblings)
 *  - free text ("This Saturday", "Before semester ends") → kept as `fuzzy`
 * Never throws.
 */
export function parseEventDate(input: unknown): ParsedDate {
  if (input === null || input === undefined) return { ts: null, fuzzy: null };

  // Numbers (and numeric strings) are treated as epoch milliseconds.
  if (typeof input === "number" && Number.isFinite(input)) {
    return inRange(input) ? { ts: input, fuzzy: null } : { ts: null, fuzzy: null };
  }

  if (typeof input === "string") {
    const raw = input.trim();
    if (raw === "") return { ts: null, fuzzy: null };

    // Pure number string → epoch ms
    if (/^\d{10,}$/.test(raw)) {
      const n = Number(raw);
      if (inRange(n)) return { ts: n, fuzzy: null };
    }

    // ISO 8601
    const iso = Date.parse(raw);
    if (!Number.isNaN(iso) && /^\d{4}-\d{2}-\d{2}/.test(raw) && inRange(iso)) {
      return { ts: iso, fuzzy: null };
    }

    // Day/month/year style formats
    for (const fmt of DMY_FORMATS) {
      const d = parse(raw, fmt, new Date());
      if (isValid(d) && inRange(d.getTime())) {
        return { ts: d.getTime(), fuzzy: null };
      }
    }

    // Present but unparseable → keep the text for display.
    return { ts: null, fuzzy: raw };
  }

  return { ts: null, fuzzy: null };
}

function inRange(ts: number): boolean {
  return ts >= MIN_TS && ts <= MAX_TS;
}

/** "Sat, 4 Oct 2026 · 5:05 PM" */
export function formatDateTime(ts: number | null): string {
  if (ts === null) return "Date to be announced";
  try {
    return format(ts, "EEE, d MMM yyyy · h:mm a");
  } catch {
    return "Date to be announced";
  }
}

/** "4 Oct 2026" */
export function formatDateShort(ts: number | null): string {
  if (ts === null) return "TBA";
  try {
    return format(ts, "d MMM yyyy");
  } catch {
    return "TBA";
  }
}

/** "5:05 PM" */
export function formatTime(ts: number | null): string {
  if (ts === null) return "";
  try {
    return format(ts, "h:mm a");
  } catch {
    return "";
  }
}

/**
 * Human relative label: "Today", "Tomorrow", "Yesterday",
 * "This week", "in 3 days", "2 months ago".
 */
export function relativeLabel(ts: number | null): string | null {
  if (ts === null) return null;
  try {
    if (isToday(ts)) return "Today";
    if (isTomorrow(ts)) return "Tomorrow";
    if (isYesterday(ts)) return "Yesterday";
    const distance = formatDistanceToNowStrict(ts, { addSuffix: true });
    if (isThisWeek(ts, { weekStartsOn: 1 }) && ts > Date.now()) return "This week";
    return distance;
  } catch {
    return null;
  }
}

export function isUpcoming(ts: number | null): boolean {
  return ts !== null && ts >= Date.now();
}

/** ISO date (yyyy-mm-dd) for <input type="date"> binding. */
export function toDateInputValue(ts: number | null): string {
  if (ts === null) return "";
  try {
    return format(ts, "yyyy-MM-dd");
  } catch {
    return "";
  }
}
