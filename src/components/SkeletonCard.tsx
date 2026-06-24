/** Shimmering placeholder shown while the dataset loads/normalizes. */
export function SkeletonCard() {
  return (
    <div className="card-surface p-5">
      <div className="mb-3 flex items-center justify-between">
        <Shimmer className="h-5 w-20 rounded-full" />
        <Shimmer className="h-8 w-8 rounded-full" />
      </div>
      <Shimmer className="h-4 w-4/5 rounded" />
      <Shimmer className="mt-2 h-3 w-1/3 rounded" />
      <div className="mt-4 space-y-2">
        <Shimmer className="h-3 w-full rounded" />
        <Shimmer className="h-3 w-11/12 rounded" />
      </div>
      <div className="mt-5 space-y-2">
        <Shimmer className="h-3 w-1/2 rounded" />
        <Shimmer className="h-3 w-2/5 rounded" />
      </div>
    </div>
  );
}

function Shimmer({ className = "" }: { className?: string }) {
  return (
    <div className={`relative overflow-hidden bg-surface-subtle ${className}`}>
      <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-content/5 to-transparent" />
    </div>
  );
}

export function SkeletonGrid({ count = 9 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}
