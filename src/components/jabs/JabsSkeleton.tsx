export function JabsSkeleton() {
  return (
    <div className="flex min-h-[calc(100svh-140px)] animate-pulse flex-col gap-4 overflow-x-hidden p-4">
      {/* Header skeleton */}
      <div className="h-7 w-16 rounded bg-card" />

      {/* Stat cards grid skeleton */}
      <div className="grid grid-cols-2 gap-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-20 rounded-xl border border-border bg-card" />
        ))}
      </div>

      {/* Section header skeleton */}
      <div className="mt-2 h-5 w-32 rounded bg-card" />

      {/* History items skeleton */}
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-24 rounded-xl border border-border bg-card" />
        ))}
      </div>
    </div>
  );
}
