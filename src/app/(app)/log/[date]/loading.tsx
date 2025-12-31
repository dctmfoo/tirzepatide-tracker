export default function LogDateLoading() {
  return (
    <div className="animate-pulse space-y-4 p-4">
      {/* Header skeleton */}
      <div className="flex items-center gap-3">
        <div className="h-8 w-8 rounded-lg bg-card" />
        <div className="flex-1 space-y-2">
          <div className="h-6 w-32 rounded bg-card" />
          <div className="h-4 w-48 rounded bg-card" />
        </div>
      </div>

      {/* Section skeletons */}
      <div className="space-y-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-16 rounded-xl bg-card" />
        ))}
      </div>
    </div>
  );
}
