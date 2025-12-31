export default function ResultsLoading() {
  return (
    <div className="animate-pulse space-y-4 p-4">
      <div className="h-10 w-full rounded bg-card" />
      <div className="h-6 w-48 rounded bg-card" />
      <div className="grid grid-cols-3 gap-3">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-20 rounded-xl bg-card" />
        ))}
      </div>
      <div className="h-72 rounded-lg bg-card" />
    </div>
  );
}
