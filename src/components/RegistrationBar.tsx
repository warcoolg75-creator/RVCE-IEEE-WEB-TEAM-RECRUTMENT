import { useEffect, useState } from "react";

/**
 * Capacity / registration progress bar. Color-coded by fill level with a
 * status label, and animates its width on mount. Renders nothing when the
 * event lacks both registration count and capacity — no empty bars.
 */
export function RegistrationBar({
  registrations,
  capacity,
  variant = "card",
}: {
  registrations: number | null;
  capacity: number | null;
  variant?: "card" | "detail";
}) {
  const hasData = registrations !== null && capacity !== null && capacity > 0;
  const pct = hasData ? Math.round((registrations / capacity) * 100) : 0;

  // Animate from 0 → pct after mount.
  const [width, setWidth] = useState(0);
  useEffect(() => {
    if (!hasData) return;
    const id = requestAnimationFrame(() => setWidth(Math.min(pct, 100)));
    return () => cancelAnimationFrame(id);
  }, [pct, hasData]);

  if (!hasData) return null;

  const { color, status } = statusFor(pct);
  const detail = variant === "detail";

  return (
    <div className={detail ? "" : "mt-1.5"}>
      <div className="flex items-center justify-between gap-2">
        <span className={`${detail ? "text-sm" : "text-xs"} text-content-muted`}>
          {registrations.toLocaleString()} / {capacity.toLocaleString()} registered
        </span>
        {status && (
          <span className={`text-xs font-semibold ${status.className}`}>{status.label}</span>
        )}
      </div>
      <div
        className={`mt-1 w-full overflow-hidden rounded-full bg-surface-subtle ${
          detail ? "h-2.5" : "h-1.5"
        }`}
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${pct}% full`}
      >
        <div
          className={`h-full rounded-full transition-[width] duration-700 ease-out ${color}`}
          style={{ width: `${width}%` }}
        />
      </div>
    </div>
  );
}

function statusFor(pct: number): {
  color: string;
  status: { label: string; className: string } | null;
} {
  if (pct >= 100)
    return {
      color: "bg-content-faint",
      status: { label: "FULL", className: "text-content-faint" },
    };
  if (pct >= 85)
    return {
      color: "bg-rose-500",
      status: { label: "Almost full!", className: "text-rose-600 dark:text-rose-400" },
    };
  if (pct >= 60)
    return {
      color: "bg-amber-500",
      status: { label: "Filling up fast!", className: "text-amber-600 dark:text-amber-400" },
    };
  return { color: "bg-emerald-500", status: null };
}
