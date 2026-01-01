export function LogSkeleton() {
  return (
    <div className="animate-pulse p-4">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div className="h-8 w-32 rounded bg-background-card" />
        <div className="h-4 w-20 rounded bg-background-card" />
      </div>
      <div className="mb-6 h-4 w-48 rounded bg-background-card" />

      {/* Sections */}
      <div className="space-y-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="rounded-xl bg-background-card p-4">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded bg-background" />
              <div className="h-5 w-32 rounded bg-background" />
            </div>
          </div>
        ))}
      </div>

      {/* Save button skeleton */}
      <div className="fixed bottom-20 left-0 right-0 px-4 pb-4 pt-6">
        <div className="h-14 w-full rounded-xl bg-background-card" />
      </div>
    </div>
  );
}
