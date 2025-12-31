export default function SummaryLoading() {
  return (
    <div className="animate-pulse space-y-6 p-4">
      <div className="h-8 w-32 rounded bg-background-card" />
      <div className="space-y-3">
        <div className="h-32 rounded-lg bg-background-card" />
        <div className="h-20 rounded-lg bg-background-card" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="h-24 rounded-lg bg-background-card" />
        <div className="h-24 rounded-lg bg-background-card" />
      </div>
      <div className="h-40 rounded-lg bg-background-card" />
    </div>
  );
}
