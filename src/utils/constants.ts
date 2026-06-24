import type { FilterState, SortKey } from "@/types";

export const UNCATEGORIZED = "Uncategorized";

/**
 * Derived event categories. The dataset has no `category` field, but the
 * event *format* is reliably encoded in the title (e.g. "… Hackathon",
 * "Industry Talk: …", "Guest Lecture"). We map title keywords → category.
 * Order matters: earlier patterns win.
 */
export const CATEGORY_RULES: { category: string; patterns: RegExp[] }[] = [
  { category: "Hackathon", patterns: [/\bhackathon\b/i] },
  { category: "Competition", patterns: [/\bcompetition\b/i, /\bcontest\b/i] },
  { category: "Bootcamp", patterns: [/\bbootcamp\b/i] },
  { category: "Workshop", patterns: [/\bworkshop\b/i, /hands-?on/i] },
  { category: "Guest Lecture", patterns: [/guest lecture/i, /\blecture\b/i] },
  { category: "Industry Talk", patterns: [/industry talk/i, /\btalk\b/i] },
  { category: "Seminar", patterns: [/\bseminar\b/i] },
  { category: "Panel Discussion", patterns: [/panel discussion/i, /\bpanel\b/i] },
  { category: "Networking", patterns: [/networking/i] },
  { category: "Career Fair", patterns: [/career fair/i, /\bplacement\b/i] },
  { category: "Open Mic", patterns: [/open mic/i] },
  { category: "Showcase", patterns: [/\bshowcase\b/i, /\bexpo\b/i, /\bfair\b/i] },
  { category: "Sprint", patterns: [/\bsprint\b/i] },
  { category: "Bootstrap Guide", patterns: [/\b101\b/i, /beginner'?s? guide/i, /\bbasics\b/i] },
  { category: "Session", patterns: [/\bsession\b/i] },
];

/**
 * Canonicalize the many casing/spacing variants of tags into a single label.
 * Keys are lowercased + whitespace-stripped forms; values are display labels.
 */
export const TAG_CANONICAL: Record<string, string> = {
  workshop: "Workshop",
  tech: "Technology",
  technology: "Technology",
  technical: "Technology",
  network: "Networking",
  networking: "Networking",
  freefood: "Free Food",
  competitive: "Competitive",
  certificates: "Certificates",
  sports: "Sports",
  hybrid: "Hybrid",
  guestspeaker: "Guest Speaker",
  online: "Online",
  research: "Research",
  internship: "Internship",
  opentoall: "Open to All",
  prizes: "Prizes",
  cultural: "Cultural",
  beginnerfriendly: "Beginner Friendly",
  general: "General",
};

/** Strings that mean "no value" when they appear in text fields. */
export const MISSING_TOKENS = new Set([
  "",
  "—",
  "-",
  "–",
  "n/a",
  "na",
  "null",
  "undefined",
  "none",
  "tbd",
  "tba",
  "contact us",
  "ask organizer",
  "check instagram",
]);

export const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "date-asc", label: "Date · Upcoming first" },
  { value: "date-desc", label: "Date · Latest first" },
  { value: "name-asc", label: "Name · A–Z" },
  { value: "popularity-desc", label: "Most registered" },
];

export const DEFAULT_FILTERS: FilterState = {
  search: "",
  categories: [],
  organizers: [],
  tags: [],
  venues: [],
  dateFrom: "",
  dateTo: "",
  sort: "date-asc",
  hideCancelled: false,
  registration: "all",
};

export const THEME_STORAGE_KEY = "rvce-theme";
export const BOOKMARKS_STORAGE_KEY = "rvce-bookmarks";
export const BRANCH_STORAGE_KEY = "rvce-branch";

/** Data source from env. Defaults to local file. */
export const DATA_SOURCE: string =
  (import.meta.env.VITE_DATA_SOURCE as string | undefined)?.trim() ||
  "./events.json";
