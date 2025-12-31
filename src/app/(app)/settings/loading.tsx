export default function SettingsLoading() {
  return (
    <div className="animate-pulse space-y-6 p-4">
      <div className="h-8 w-28 rounded bg-background-card" />
      {[...Array(4)].map((_, i) => (
        <div key={i}>
          <div className="mb-2 h-4 w-24 rounded bg-background-card" />
          <div className="space-y-1 rounded-xl bg-background-card p-4">
            {[...Array(3)].map((_, j) => (
              <div key={j} className="h-12 rounded bg-background/50" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
