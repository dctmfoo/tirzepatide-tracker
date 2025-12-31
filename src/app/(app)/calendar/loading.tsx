export default function CalendarLoading() {
  return (
    <div className="animate-pulse p-4">
      <div className="h-8 w-28 rounded bg-background-card" />
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
      {/* Day detail */}
      <div className="mt-4 space-y-3">
        <div className="h-6 w-48 rounded bg-background-card" />
        <div className="grid grid-cols-3 gap-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-16 rounded-xl bg-background-card" />
          ))}
        </div>
      </div>
    </div>
  );
}
