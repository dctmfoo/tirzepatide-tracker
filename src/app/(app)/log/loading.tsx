export default function LogLoading() {
  return (
    <div className="animate-pulse space-y-4 p-4">
      <div className="flex items-center justify-between">
        <div className="h-8 w-32 rounded bg-card" />
        <div className="h-5 w-24 rounded bg-card" />
      </div>
      <div className="h-4 w-48 rounded bg-card" />
      <div className="space-y-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-16 rounded-xl bg-card" />
        ))}
      </div>
      <div className="h-14 rounded-xl bg-card" />
    </div>
  );
}
