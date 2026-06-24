/**
 * Deterministic, vibrant color assignment for clubs/organizers.
 *
 * Each unique club gets a stable hue. Hues are spread with the golden-angle
 * increment (137.508°) so that clubs adjacent in the (sorted) list land far
 * apart on the color wheel — no two nearby clubs look alike. The same club
 * always maps to the same hue for a given club set.
 *
 * Saturation/lightness are applied per-theme in CSS (see `.club-*` rules in
 * index.css) by reading the `--club-h` custom property, so colors stay correct
 * when toggling dark/light mode without any JS re-render.
 */

const GOLDEN_ANGLE = 137.508;

// Module-level cache so every consumer shares one Map instance (stable identity
// → cheap to use inside memoized/virtualized lists).
let cacheKey = "";
let cacheMap = new Map<string, number>();

/** Build (or reuse) the club → hue map for a set of clubs. */
export function getClubColorMap(clubs: string[]): Map<string, number> {
  const sorted = [...clubs].sort((a, b) => a.localeCompare(b));
  const key = sorted.join("|");
  if (key === cacheKey) return cacheMap;

  const map = new Map<string, number>();
  sorted.forEach((club, i) => {
    map.set(club, Math.round((i * GOLDEN_ANGLE) % 360));
  });
  cacheKey = key;
  cacheMap = map;
  return map;
}

/** Stable fallback hue from a string (used if a club isn't in the map). */
export function hashHue(input: string): number {
  let h = 0;
  for (let i = 0; i < input.length; i++) h = (h * 31 + input.charCodeAt(i)) >>> 0;
  return h % 360;
}

/** Resolve a club's hue, with a deterministic fallback. */
export function hueForClub(club: string, map: Map<string, number>): number {
  return map.get(club) ?? hashHue(club);
}

/**
 * Inline style object that sets the `--club-h` custom property. Components
 * combine this with the `.club-pill` / `.club-accent` / `.club-swatch` classes.
 */
export function clubHueStyle(hue: number): React.CSSProperties {
  return { ["--club-h" as string]: String(hue) } as React.CSSProperties;
}
