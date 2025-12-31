export default function JabsLoading() {
  return (
    <div className="animate-pulse space-y-4 p-4">
      <div className="h-8 w-24 rounded bg-card" />
      <div className="grid grid-cols-2 gap-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-24 rounded-xl bg-card" />
        ))}
      </div>
      <div className="h-6 w-40 rounded bg-card" />
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-20 rounded-xl bg-card" />
        ))}
      </div>
    </div>
  );
}
