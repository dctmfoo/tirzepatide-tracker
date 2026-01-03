export default function LogCalendarLoading() {
  return (
    <div className="flex min-h-[calc(100svh-140px)] flex-col gap-4 overflow-x-hidden p-4">
      {/* Header skeleton */}
      <header className="flex items-center justify-between">
        <div className="h-5 w-16 animate-pulse rounded bg-muted" />
        <div className="h-6 w-28 animate-pulse rounded bg-muted" />
        <div className="w-16" />
      </header>

      {/* Calendar grid skeleton */}
      <div className="rounded-[1.25rem] bg-card p-4 shadow-sm">
        {/* Month nav skeleton */}
        <div className="mb-4 flex items-center justify-between">
          <div className="h-9 w-9 animate-pulse rounded-full bg-muted" />
          <div className="h-6 w-32 animate-pulse rounded bg-muted" />
          <div className="h-9 w-9 animate-pulse rounded-full bg-muted" />
        </div>

        {/* Weekday headers skeleton */}
        <div className="mb-2 grid grid-cols-7 gap-1">
          {Array.from({ length: 7 }).map((_, i) => (
            <div
              key={i}
              className="h-4 animate-pulse rounded bg-muted text-center"
            />
          ))}
        </div>

        {/* Calendar cells skeleton */}
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: 35 }).map((_, i) => (
            <div
              key={i}
              className="aspect-square animate-pulse rounded-lg bg-muted"
            />
          ))}
        </div>

        {/* Legend skeleton */}
        <div className="mt-4 flex items-center justify-center gap-4 border-t border-border/40 pt-3">
          <div className="h-4 w-16 animate-pulse rounded bg-muted" />
          <div className="h-4 w-16 animate-pulse rounded bg-muted" />
          <div className="h-4 w-16 animate-pulse rounded bg-muted" />
        </div>
      </div>

      {/* Summary skeleton */}
      <div className="rounded-[1.25rem] bg-card p-4 shadow-sm">
        <div className="mb-3 h-3 w-24 animate-pulse rounded bg-muted" />
        <div className="grid grid-cols-3 gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      </div>
    </div>
  );
}
