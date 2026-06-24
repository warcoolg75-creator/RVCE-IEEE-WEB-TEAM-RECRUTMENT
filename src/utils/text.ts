import { MISSING_TOKENS } from "./constants";

/**
 * A fast, stable, non-cryptographic string hash (FNV-1a, 32-bit) rendered as
 * base36. Used to generate deterministic ids when the source id is missing or
 * collides, so the same record always yields the same id across reloads.
 */
export function stableHash(input: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  // >>> 0 to keep it unsigned
  return (h >>> 0).toString(36);
}

const HTML_ENTITIES: Record<string, string> = {
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&#39;": "'",
  "&apos;": "'",
  "&nbsp;": " ",
  "&mdash;": "—",
  "&ndash;": "–",
  "&hellip;": "…",
};

/**
 * Strip HTML tags and decode common entities, collapse whitespace.
 * Returns clean plain text safe to render via React (which escapes anyway,
 * but we don't want users to see raw markup). Never throws.
 */
export function sanitizeText(input: unknown): { text: string; hadHtml: boolean } {
  const raw = coerceToString(input);
  if (!raw) return { text: "", hadHtml: false };

  const hadHtml = /<[a-z][\s\S]*?>/i.test(raw) || /&[a-z#0-9]+;/i.test(raw);

  let out = raw
    // drop script/style content entirely
    .replace(/<(script|style)[\s\S]*?<\/\1>/gi, "")
    // tags → space so words don't fuse
    .replace(/<[^>]+>/g, " ");

  out = out.replace(/&[a-z#0-9]+;/gi, (m) => {
    const lower = m.toLowerCase();
    if (HTML_ENTITIES[lower] !== undefined) return HTML_ENTITIES[lower];
    const numeric = lower.match(/^&#(\d+);$/);
    if (numeric) {
      const code = Number(numeric[1]);
      if (Number.isFinite(code)) return String.fromCodePoint(code);
    }
    return " ";
  });

  out = out.replace(/\s+/g, " ").trim();
  return { text: out, hadHtml };
}

/** Coerce unknown JSON value to a trimmed string (numbers/bools included). */
export function coerceToString(input: unknown): string {
  if (input === null || input === undefined) return "";
  if (typeof input === "string") return input.trim();
  if (typeof input === "number" && Number.isFinite(input)) return String(input);
  if (typeof input === "boolean") return String(input);
  return "";
}

/**
 * Returns a cleaned string, or null when the value is missing / a known
 * placeholder ("—", "N/A", "TBD", whitespace, …).
 */
export function cleanOrNull(input: unknown): string | null {
  const s = coerceToString(input);
  if (s === "") return null;
  if (MISSING_TOKENS.has(s.toLowerCase())) return null;
  return s;
}

/** Coerce a possibly-string/number/null value to a finite number, or null. */
export function coerceNumber(input: unknown): { value: number | null; coerced: boolean } {
  if (typeof input === "number") {
    return Number.isFinite(input) ? { value: input, coerced: false } : { value: null, coerced: false };
  }
  if (typeof input === "string") {
    const t = input.trim();
    if (t === "") return { value: null, coerced: false };
    const n = Number(t);
    return Number.isFinite(n) ? { value: n, coerced: true } : { value: null, coerced: false };
  }
  return { value: null, coerced: false };
}

/** Truncate to a length on a word boundary, adding an ellipsis. */
export function truncate(text: string, max = 160): string {
  if (text.length <= max) return text;
  const slice = text.slice(0, max);
  const lastSpace = slice.lastIndexOf(" ");
  return (lastSpace > max * 0.6 ? slice.slice(0, lastSpace) : slice).trimEnd() + "…";
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Validate / lightly repair contact emails. Several rows have the pattern
 * "clubname.rvce.edu.in" (missing @). We repair that specific, unambiguous
 * case; everything else that isn't a valid email becomes null.
 */
export function cleanEmail(input: unknown): { email: string | null; repaired: boolean } {
  const s = cleanOrNull(input);
  if (!s) return { email: null, repaired: false };
  if (EMAIL_RE.test(s)) return { email: s, repaired: false };

  // Repair "<handle>.rvce.edu.in" -> "<handle>@rvce.edu.in"
  const m = s.match(/^([a-z0-9._-]+)\.(rvce\.edu\.in)$/i);
  if (m) {
    const candidate = `${m[1]}@${m[2]}`;
    if (EMAIL_RE.test(candidate)) return { email: candidate, repaired: true };
  }
  return { email: null, repaired: false };
}
