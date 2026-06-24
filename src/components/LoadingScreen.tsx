import { useEffect, useState } from "react";
import { useData } from "@/store/DataContext";
import { SparkleIcon } from "./icons";

/**
 * Full-screen splash shown on first load while the dataset is fetched and
 * normalized, then fades out smoothly — avoiding a flash of empty content.
 */
export function LoadingScreen() {
  const { status } = useData();
  const [gone, setGone] = useState(false);
  const ready = status === "ready" || status === "error";

  useEffect(() => {
    if (!ready) return;
    const t = setTimeout(() => setGone(true), 500);
    return () => clearTimeout(t);
  }, [ready]);

  if (gone) return null;

  return (
    <div
      aria-hidden={ready}
      className={`fixed inset-0 z-[95] grid place-items-center bg-surface-subtle transition-opacity duration-500 ${
        ready ? "pointer-events-none opacity-0" : "opacity-100"
      }`}
    >
      <div className="flex flex-col items-center gap-5">
        <span className="grid h-16 w-16 place-items-center rounded-2xl bg-brand text-brand-fg shadow-lg shadow-brand/30">
          <SparkleIcon width={32} height={32} aria-hidden="true" />
        </span>
        <div className="text-center">
          <p className="text-base font-bold tracking-tight text-content">RVCE Campus Events</p>
          <div className="mt-3 flex items-center justify-center gap-2 text-sm text-content-muted">
            <span
              className="h-4 w-4 animate-spin rounded-full border-2 border-border border-t-brand"
              role="status"
              aria-label="Loading"
            />
            Loading events…
          </div>
        </div>
      </div>
    </div>
  );
}
