import { useEffect, useState } from "react";
import type { DataState } from "@/types";
import { fetchRawEvents } from "@/utils/loadEvents";
import { normalizeEvents } from "@/utils/normalizeEvents";

const initialState: DataState = {
  status: "idle",
  events: [],
  byId: new Map(),
  facets: { categories: [], organizers: [], tags: [], venues: [] },
  error: null,
  report: null,
};

/**
 * Loads the dataset once at app start, normalizes it, and exposes the result.
 * Parsing/normalizing 12k records is deferred to a microtask so the skeleton
 * UI can paint first and the main thread isn't blocked before render.
 */
export function useEventData(): DataState {
  const [state, setState] = useState<DataState>({ ...initialState, status: "loading" });

  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;

    (async () => {
      try {
        const raw = await fetchRawEvents(controller.signal);
        if (cancelled) return;

        // Yield to the browser so the skeleton renders before the heavy work.
        await new Promise((r) => setTimeout(r, 0));
        const { events, facets, report } = normalizeEvents(raw);
        if (cancelled) return;

        const byId = new Map(events.map((e) => [e.id, e]));
        setState({ status: "ready", events, byId, facets, error: null, report });
      } catch (err) {
        if (cancelled || (err as Error).name === "AbortError") return;
        setState({
          ...initialState,
          status: "error",
          error: err instanceof Error ? err.message : "Something went wrong loading events.",
        });
      }
    })();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, []);

  return state;
}
