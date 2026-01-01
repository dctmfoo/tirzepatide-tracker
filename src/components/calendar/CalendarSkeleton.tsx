export function CalendarSkeleton() {
  return (
    <div className="animate-pulse p-4">
      {/* Header */}
      <div className="mb-4 h-6 w-24 rounded bg-background-card" />

      {/* Month header */}
      <div className="flex items-center justify-center gap-4 py-4">
        <div className="h-8 w-8 rounded bg-background-card" />
        <div className="h-6 w-40 rounded bg-background-card" />
        <div className="h-8 w-8 rounded bg-background-card" />
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-1 py-2">
        {[...Array(7)].map((_, i) => (
          <div key={i} className="h-4 rounded bg-background-card" />
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {[...Array(35)].map((_, i) => (
          <div key={i} className="aspect-square rounded-lg bg-background-card" />
        ))}
      </div>

      {/* Day detail skeleton */}
      <div className="mt-6 space-y-3">
        <div className="h-6 w-32 rounded bg-background-card" />
        <div className="h-16 rounded-lg bg-background-card" />
        <div className="flex gap-2">
          <div className="h-10 flex-1 rounded-lg bg-background-card" />
          <div className="h-10 flex-1 rounded-lg bg-background-card" />
          <div className="h-10 flex-1 rounded-lg bg-background-card" />
        </div>
      </div>
    </div>
  );
}
