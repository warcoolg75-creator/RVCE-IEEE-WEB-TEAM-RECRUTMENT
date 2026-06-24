import { useEffect, useState } from "react";

/**
 * Reactive media-query matcher. Returns true while the query matches.
 *
 * We listen to both the MediaQueryList `change` event and window `resize`,
 * because some embedded/headless browsers resize the viewport without emitting
 * a `change` event — the `resize` fallback keeps the value in sync.
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() =>
    typeof window !== "undefined" ? window.matchMedia(query).matches : false
  );

  useEffect(() => {
    const mq = window.matchMedia(query);
    const update = () => setMatches(mq.matches);
    update();
    mq.addEventListener("change", update);
    window.addEventListener("resize", update);
    return () => {
      mq.removeEventListener("change", update);
      window.removeEventListener("resize", update);
    };
  }, [query]);

  return matches;
}
