import { DATA_SOURCE } from "./constants";

/** Must match REMOTE_PROXY_PATH in vite.config.ts. */
const REMOTE_PROXY_PATH = "/__events-data";

/**
 * Fetch the raw dataset at runtime from the configured source.
 *
 *  - `VITE_DATA_SOURCE` starting with "https" → fetched over the network.
 *    The R2 bucket sends no CORS headers, so the dev/preview server proxies
 *    the request (see vite.config.ts) and we hit a same-origin path. As a
 *    fallback (e.g. a host that *does* allow CORS) we retry the URL directly.
 *  - Any other value (e.g. "./events.json") → loaded from the dev/preview
 *    server (the file lives in /public), resolved against the app base URL.
 *
 * The JSON itself is never modified — all cleaning happens in normalizeEvents.
 */
export async function fetchRawEvents(signal?: AbortSignal): Promise<unknown> {
  if (/^https?:\/\//i.test(DATA_SOURCE)) {
    try {
      return await getJson(REMOTE_PROXY_PATH, signal);
    } catch (proxyErr) {
      // Proxy unavailable (e.g. plain static host) → try a direct request.
      try {
        return await getJson(DATA_SOURCE, signal);
      } catch {
        throw proxyErr;
      }
    }
  }
  return getJson(resolveLocal(DATA_SOURCE), signal);
}

async function getJson(url: string, signal?: AbortSignal): Promise<unknown> {
  const res = await fetch(url, { signal });
  if (!res.ok) {
    throw new Error(`Failed to load events (${res.status} ${res.statusText}) from ${url}`);
  }
  return res.json();
}

function resolveLocal(source: string): string {
  const base = import.meta.env.BASE_URL || "/";
  const cleaned = source.replace(/^\.?\//, "");
  return `${base}${cleaned}`.replace(/\/{2,}/g, "/");
}

export function describeSource(): { mode: "remote" | "local"; value: string } {
  return {
    mode: /^https?:\/\//i.test(DATA_SOURCE) ? "remote" : "local",
    value: DATA_SOURCE,
  };
}
