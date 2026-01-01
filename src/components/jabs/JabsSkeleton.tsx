export function JabsSkeleton() {
  return (
    <div className="animate-pulse space-y-4 p-4">
      {/* Header skeleton */}
      <div className="h-6 w-20 rounded bg-background-card" />

      {/* Stat cards grid skeleton */}
      <div className="grid grid-cols-2 gap-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-24 rounded-xl bg-background-card" />
        ))}
      </div>

      {/* Section header skeleton */}
      <div className="h-6 w-40 rounded bg-background-card" />

      {/* History items skeleton */}
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-20 rounded-xl bg-background-card" />
        ))}
      </div>
    </div>
  );
}
