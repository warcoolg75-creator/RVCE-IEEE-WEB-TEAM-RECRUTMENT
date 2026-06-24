/**
 * Diacritic-insensitive search helpers. Folding decomposes characters (NFD)
 * and strips combining marks so "cafe" matches "café", "Muller" matches
 * "Müller", etc. Used by every event search (Feed, Bookmarks).
 */

// Combining diacritical marks block (U+0300–U+036F).
const COMBINING_MARKS = /[̀-ͯ]/g;

/** Lowercase + strip diacritics for comparison. */
export function fold(input: string): string {
  return input.normalize("NFD").replace(COMBINING_MARKS, "").toLowerCase();
}

/** Split a query into folded, non-empty tokens. */
export function foldTokens(query: string): string[] {
  return fold(query).trim().split(/\s+/).filter(Boolean);
}

/** True when every token appears in the (already folded) haystack. */
export function matchesAllTokens(foldedHaystack: string, tokens: string[]): boolean {
  for (const t of tokens) if (!foldedHaystack.includes(t)) return false;
  return true;
}
