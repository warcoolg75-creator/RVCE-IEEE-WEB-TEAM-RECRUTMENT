import { useMemo } from "react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { useData } from "@/store/DataContext";
import { describeSource } from "@/utils/loadEvents";

/**
 * Hidden data-quality dashboard at /debug (not linked anywhere). Surfaces the
 * normalization diagnostics plus distributions computed from the clean data —
 * a transparent look at how the messy dataset was handled.
 */
export function DebugPage() {
  const { status, events, report } = useData();

  const stats = useMemo(() => {
    const categories = new Map<string, number>();
    const clubs = new Map<string, number>();
    const months = new Map<string, number>();

    for (const e of events) {
      categories.set(e.category, (categories.get(e.category) ?? 0) + 1);
      clubs.set(e.organizer, (clubs.get(e.organizer) ?? 0) + 1);
      if (e.startTime !== null) {
        const key = format(e.startTime, "yyyy-MM");
        months.set(key, (months.get(key) ?? 0) + 1);
      }
    }

    const sortDesc = (m: Map<string, number>) =>
      [...m.entries()].sort((a, b) => b[1] - a[1]);

    return {
      categories: sortDesc(categories),
      topClubs: sortDesc(clubs).slice(0, 20),
      months: [...months.entries()].sort((a, b) => a[0].localeCompare(b[0])),
    };
  }, [events]);

  if (status !== "ready" || !report) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-16 text-center text-sm text-content-muted">
        {status === "error" ? "Failed to load data." : "Loading data quality report…"}
      </div>
    );
  }

  const source = describeSource();
  const keptPct = Math.round((report.kept / Math.max(report.totalRaw, 1)) * 100);
  const maxMonth = Math.max(1, ...stats.months.map((m) => m[1]));
  const maxCat = Math.max(1, ...stats.categories.map((c) => c[1]));
  const missingRanked = Object.entries(report.missingFieldCounts).sort((a, b) => b[1] - a[1]);

  const fmt = (n: number) => n.toLocaleString();

  return (
    <div className="mx-auto max-w-6xl animate-fade-in px-4 py-8 sm:px-6">
      <div className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-brand">Internal</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-content sm:text-3xl">
          Data Quality Report
        </h1>
        <p className="mt-1 text-sm text-content-muted">
          Runtime normalization diagnostics for the {source.mode} dataset. Not linked from the
          app — <Link to="/" className="text-brand hover:underline">back to feed</Link>.
        </p>
      </div>

      {/* Headline stats */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Raw events received" value={fmt(report.totalRaw)} />
        <Stat label="After cleaning" value={fmt(report.kept)} sub={`${keptPct}% kept`} />
        <Stat label="Duplicates removed" value={fmt(report.duplicatesRemoved)} accent="amber" />
        <Stat label="ID collisions resolved" value={fmt(report.idCollisionsResolved)} accent="amber" />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        {/* Missing core fields */}
        <Panel title="Missing core fields">
          <ul className="space-y-2 text-sm">
            <Row label="Missing / blank names" value={fmt(report.missingNames)} />
            <Row label="Missing dates" value={fmt(report.missingDates)} />
            <Row label="Unparseable date text" value={fmt(report.unparseableDates)} />
            <Row label="Missing descriptions" value={fmt(report.missingDescriptions)} />
            <Row label="Numbers coerced from strings" value={fmt(report.coercedNumbers)} />
            <Row label="Emails repaired" value={fmt(report.repairedEmails)} />
            <Row label="HTML/entities sanitized" value={fmt(report.htmlSanitized)} />
            <Row label="Non-object rows skipped" value={fmt(report.skippedNotObject)} />
          </ul>
        </Panel>

        {/* Date formats */}
        <Panel title="Date formats encountered (start_time)">
          <ul className="space-y-2 text-sm">
            <Row label="ISO 8601" value={fmt(report.dateFormats.iso)} />
            <Row label="DD/MM/YYYY" value={fmt(report.dateFormats.dmy)} />
            <Row label="Epoch milliseconds" value={fmt(report.dateFormats.epoch)} />
            <Row label="Unparseable text" value={fmt(report.dateFormats.unparseable)} accent="amber" />
            <Row label="Missing / null" value={fmt(report.dateFormats.missing)} accent="amber" />
          </ul>
        </Panel>

        {/* Fields with most missing data */}
        <Panel title="Fields with most missing data">
          {missingRanked.length === 0 ? (
            <p className="text-sm text-content-muted">No missing fields recorded.</p>
          ) : (
            <ol className="space-y-2 text-sm">
              {missingRanked.map(([field, count], i) => (
                <li key={field} className="flex items-center gap-3">
                  <span className="w-5 text-content-faint">{i + 1}.</span>
                  <span className="flex-1 capitalize text-content">{field}</span>
                  <span className="font-semibold text-content">{fmt(count)}</span>
                  <span className="text-xs text-content-faint">
                    {Math.round((count / report.totalRaw) * 100)}%
                  </span>
                </li>
              ))}
            </ol>
          )}
        </Panel>

        {/* Duplicate examples */}
        <Panel title={`Duplicates removed (${fmt(report.duplicatesRemoved)})`}>
          {report.duplicateExamples.length === 0 ? (
            <p className="text-sm text-content-muted">None.</p>
          ) : (
            <>
              <p className="mb-2 text-xs text-content-faint">First {report.duplicateExamples.length} examples:</p>
              <ul className="space-y-1.5 text-sm">
                {report.duplicateExamples.map((ex, i) => (
                  <li key={i} className="truncate text-content-muted">• {ex}</li>
                ))}
              </ul>
            </>
          )}
        </Panel>

        {/* Category distribution */}
        <Panel title="Category distribution">
          <ul className="space-y-1.5">
            {stats.categories.map(([cat, count]) => (
              <li key={cat} className="text-sm">
                <div className="mb-0.5 flex items-center justify-between">
                  <span className="text-content">{cat}</span>
                  <span className="text-content-muted">{fmt(count)}</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-surface-subtle">
                  <div
                    className="h-full rounded-full bg-brand"
                    style={{ width: `${(count / maxCat) * 100}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </Panel>

        {/* Top clubs */}
        <Panel title="Top 20 clubs by event count">
          <ol className="space-y-1.5 text-sm">
            {stats.topClubs.map(([club, count], i) => (
              <li key={club} className="flex items-center gap-3">
                <span className="w-5 text-content-faint">{i + 1}.</span>
                <span className="flex-1 truncate text-content">{club}</span>
                <span className="font-semibold text-content-muted">{fmt(count)}</span>
              </li>
            ))}
          </ol>
        </Panel>
      </div>

      {/* Events per month */}
      <Panel title="Events per month" className="mt-5">
        <div className="flex items-end gap-1.5 overflow-x-auto pb-2" style={{ minHeight: 140 }}>
          {stats.months.map(([month, count]) => (
            <div key={month} className="flex w-12 shrink-0 flex-col items-center gap-1">
              <span className="text-[10px] text-content-faint">{count}</span>
              <div
                className="w-full rounded-t bg-brand/80"
                style={{ height: `${(count / maxMonth) * 100}px` }}
                title={`${month}: ${count}`}
              />
              <span className="text-[10px] text-content-faint">{month.slice(2)}</span>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}

function Stat({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string;
  sub?: string;
  accent?: "amber";
}) {
  return (
    <div className="card-surface p-4">
      <p className="text-xs text-content-muted">{label}</p>
      <p
        className={`mt-1 text-2xl font-bold ${
          accent === "amber" ? "text-amber-600 dark:text-amber-400" : "text-content"
        }`}
      >
        {value}
      </p>
      {sub && <p className="text-xs text-content-faint">{sub}</p>}
    </div>
  );
}

function Panel({
  title,
  children,
  className = "",
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`card-surface p-5 ${className}`}>
      <h2 className="mb-3 text-sm font-semibold text-content">{title}</h2>
      {children}
    </section>
  );
}

function Row({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: "amber";
}) {
  return (
    <li className="flex items-center justify-between">
      <span className="text-content-muted">{label}</span>
      <span
        className={`font-semibold ${
          accent === "amber" ? "text-amber-600 dark:text-amber-400" : "text-content"
        }`}
      >
        {value}
      </span>
    </li>
  );
}
