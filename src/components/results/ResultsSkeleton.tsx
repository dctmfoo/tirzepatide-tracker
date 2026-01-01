export function ResultsSkeleton() {
  return (
    <div className="animate-pulse space-y-4 p-4">
      {/* Period tabs skeleton */}
      <div className="h-10 w-full rounded bg-background-card" />

      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div className="h-6 w-32 rounded bg-background-card" />
        <div className="h-4 w-24 rounded bg-background-card" />
      </div>

      {/* Stat cards grid skeleton */}
      <div className="grid grid-cols-3 gap-3">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-20 rounded-xl bg-background-card" />
        ))}
      </div>

      {/* Chart skeleton */}
      <div className="h-72 rounded-lg bg-background-card" />
    </div>
  );
}
