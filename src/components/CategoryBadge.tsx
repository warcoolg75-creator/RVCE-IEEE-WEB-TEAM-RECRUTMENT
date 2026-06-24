import { UNCATEGORIZED } from "@/utils/constants";

/**
 * Color-coded category pill. Colors are assigned per-category from a fixed
 * palette so a given category always looks the same. Uncategorized is muted.
 */
const PALETTE = [
  "bg-indigo-500/12 text-indigo-600 dark:text-indigo-300 ring-indigo-500/25",
  "bg-emerald-500/12 text-emerald-600 dark:text-emerald-300 ring-emerald-500/25",
  "bg-amber-500/12 text-amber-600 dark:text-amber-300 ring-amber-500/25",
  "bg-sky-500/12 text-sky-600 dark:text-sky-300 ring-sky-500/25",
  "bg-rose-500/12 text-rose-600 dark:text-rose-300 ring-rose-500/25",
  "bg-violet-500/12 text-violet-600 dark:text-violet-300 ring-violet-500/25",
  "bg-teal-500/12 text-teal-600 dark:text-teal-300 ring-teal-500/25",
  "bg-fuchsia-500/12 text-fuchsia-600 dark:text-fuchsia-300 ring-fuchsia-500/25",
  "bg-cyan-500/12 text-cyan-600 dark:text-cyan-300 ring-cyan-500/25",
  "bg-orange-500/12 text-orange-600 dark:text-orange-300 ring-orange-500/25",
];

const MUTED = "bg-content-faint/10 text-content-muted ring-border";

function colorFor(category: string): string {
  if (category === UNCATEGORIZED) return MUTED;
  let h = 0;
  for (let i = 0; i < category.length; i++) h = (h * 31 + category.charCodeAt(i)) >>> 0;
  return PALETTE[h % PALETTE.length];
}

export function CategoryBadge({
  category,
  className = "",
}: {
  category: string;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${colorFor(
        category
      )} ${className}`}
    >
      {category}
    </span>
  );
}
