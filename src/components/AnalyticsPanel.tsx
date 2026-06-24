import { useMemo, useState } from "react";
import { addDays, addMonths, format, isSameMonth, startOfMonth } from "date-fns";
import { useData } from "@/store/DataContext";
import { ChevronDownIcon, UsersIcon, SparkleIcon, CalendarIcon, TagIcon } from "./icons";

/**
 * Collapsible "Event Insights" analytics panel shown on the Feed between the
 * hero and the toolbar. All stats are derived from the normalized dataset.
 */
export function AnalyticsPanel() {
  const { events } = useData();
  const [open, setOpen] = useState(false);

  const stats = useMemo(() => {
    const now = Date.now();
    const monthAnchor = new Date(now);
    const next30 = addDays(now, 30).getTime();

    let thisMonth = 0;
    const clubCounts = new Map<string, number>();
    const upcomingCategory = new Map<string, number>();

    // Six upcoming month buckets for the mini chart.
    const buckets = Array.from({ length: 6 }, (_, i) => {
      const d = startOfMonth(addMonths(monthAnchor, i));
      return { key: format(d, "yyyy-MM"), label: format(d, "MMM"), count: 0 };
    });
    const bucketIndex = new Map(buckets.map((b, i) => [b.key, i]));

    for (const e of events) {
      clubCounts.set(e.organizer, (clubCounts.get(e.organizer) ?? 0) + 1);
      if (e.startTime === null) continue;
      if (isSameMonth(e.startTime, monthAnchor)) thisMonth++;
      if (e.startTime >= now && e.startTime <= next30) {
        upcomingCategory.set(e.category, (upcomingCategory.get(e.category) ?? 0) + 1);
      }
      const idx = bucketIndex.get(format(e.startTime, "yyyy-MM"));
      if (idx !== undefined) buckets[idx].count++;
    }

    const top = (m: Map<string, number>) =>
      [...m.entries()].sort((a, b) => b[1] - a[1])[0] ?? null;

    return {
      total: events.length,
      thisMonth,
      mostActiveClub: top(clubCounts),
      trendingCategory: top(upcomingCategory),
      buckets,
    };
  }, [events]);

  const maxBucket = Math.max(1, ...stats.buckets.map((b) => b.count));

  return (
    <section className="mb-5" aria-label="Event insights">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center justify-between rounded-2xl border border-border bg-surface-raised px-4 py-3 text-sm font-semibold text-content transition-colors hover:border-brand/50"
      >
        <span className="flex items-center gap-2">📊 Event Insights</span>
        <ChevronDownIcon
          width={18}
          height={18}
          aria-hidden="true"
          className={`text-content-faint transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {/* grid-rows trick gives a smooth height transition without max-height hacks */}
      <div
        className={`grid transition-all duration-300 ease-out ${
          open ? "mt-3 grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="overflow-hidden">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatCard
              icon={<SparkleIcon width={16} height={16} aria-hidden="true" />}
              label="Total events"
              value={stats.total.toLocaleString()}
            />
            <StatCard
              icon={<CalendarIcon width={16} height={16} aria-hidden="true" />}
              label="This month"
              value={stats.thisMonth.toLocaleString()}
            />
            <StatCard
              icon={<UsersIcon width={16} height={16} aria-hidden="true" />}
              label="Most active club"
              value={stats.mostActiveClub?.[0] ?? "—"}
              sub={stats.mostActiveClub ? `${stats.mostActiveClub[1]} events` : undefined}
            />
            <StatCard
              icon={<TagIcon width={16} height={16} aria-hidden="true" />}
              label="Trending (30 days)"
              value={stats.trendingCategory?.[0] ?? "—"}
              sub={
                stats.trendingCategory ? `${stats.trendingCategory[1]} upcoming` : "none upcoming"
              }
            />
          </div>

          <div className="mt-3 rounded-2xl border border-border bg-surface-raised p-4">
            <p className="mb-3 text-xs font-medium text-content-muted">
              Events per month · next 6 months
            </p>
            <div className="flex items-end gap-2" style={{ height: 96 }}>
              {stats.buckets.map((b) => (
                <div key={b.key} className="flex flex-1 flex-col items-center gap-1">
                  <span className="text-[10px] font-semibold text-content-faint">{b.count}</span>
                  <div
                    className="w-full rounded-t bg-brand/80 transition-[height] duration-500 ease-out"
                    style={{ height: `${(b.count / maxBucket) * 64}px`, minHeight: 2 }}
                    role="img"
                    aria-label={`${b.label}: ${b.count} events`}
                  />
                  <span className="text-[10px] text-content-faint">{b.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function StatCard({
  icon,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-surface-raised p-4">
      <div className="flex items-center gap-1.5 text-content-faint">
        {icon}
        <span className="text-xs font-medium">{label}</span>
      </div>
      <p className="mt-1.5 truncate text-lg font-bold text-content" title={value}>
        {value}
      </p>
      {sub && <p className="text-xs text-content-faint">{sub}</p>}
    </div>
  );
}
