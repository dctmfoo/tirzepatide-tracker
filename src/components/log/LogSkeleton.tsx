export function LogSkeleton() {
  return (
    <div className="animate-pulse">
      {/* Header */}
      <div className="px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="h-8 w-32 rounded bg-card" />
          <div className="h-4 w-20 rounded bg-card" />
        </div>
      </div>

      {/* Progress indicator */}
      <div className="px-4 py-3 border-b border-border">
        <div className="flex items-center justify-center gap-2 mb-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-2 w-2 rounded-full bg-card" />
          ))}
        </div>
        <div className="flex items-center justify-between">
          <div className="h-4 w-16 rounded bg-card" />
          <div className="h-4 w-20 rounded bg-card" />
        </div>
      </div>

      {/* Step content */}
      <div className="px-4 py-6 space-y-6">
        <div className="text-center space-y-2">
          <div className="h-6 w-48 mx-auto rounded bg-card" />
          <div className="h-4 w-64 mx-auto rounded bg-card" />
        </div>

        <div className="flex justify-center gap-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-20 w-16 rounded-xl bg-card" />
          ))}
        </div>

        <div className="space-y-3">
          <div className="h-4 w-24 rounded bg-card" />
          <div className="flex gap-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex-1 h-10 rounded-lg bg-card" />
            ))}
          </div>
        </div>
      </div>

      {/* Footer buttons skeleton */}
      <div className="fixed bottom-20 left-0 right-0 px-4 pb-4 pt-6">
        <div className="flex gap-3">
          <div className="flex-1 h-14 rounded-xl bg-card" />
          <div className="flex-1 h-14 rounded-xl bg-card" />
        </div>
      </div>
    </div>
  );
}
