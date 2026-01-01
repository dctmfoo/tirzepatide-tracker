export function ResultsSkeleton() {
  return (
    <div className="animate-pulse space-y-6 overflow-x-hidden p-4">
      {/* Header skeleton */}
      <div className="h-8 w-24 rounded bg-card" />

      {/* Period tabs skeleton */}
      <div className="grid h-10 w-full grid-cols-4 gap-1 rounded-lg bg-card p-1">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="rounded-md bg-muted" />
        ))}
      </div>

      {/* Hero stat skeleton */}
      <div className="h-28 rounded-2xl bg-card" />

      {/* Stat cards grid skeleton - 2x2 */}
      <div className="grid grid-cols-2 gap-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-24 rounded-xl bg-card" />
        ))}
      </div>

      {/* Chart skeleton */}
      <div className="h-72 rounded-xl bg-card" />

      {/* Insights skeleton */}
      <div className="space-y-3">
        <div className="h-5 w-20 rounded bg-card" />
        <div className="h-20 rounded-xl bg-card" />
      </div>
    </div>
  );
}
