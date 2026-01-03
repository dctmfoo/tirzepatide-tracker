export default function LogLoading() {
  return (
    <div className="flex min-h-[calc(100svh-140px)] flex-col gap-4 overflow-x-hidden p-4">
      <div className="flex items-center justify-between">
        <div className="h-7 w-12 animate-pulse rounded bg-muted" />
        <div className="h-10 w-10 animate-pulse rounded-full bg-muted" />
      </div>

      <div className="h-32 animate-pulse rounded-[1.25rem] bg-muted" />

      <div className="grid grid-cols-2 gap-3">
        <div className="h-20 animate-pulse rounded-[1.25rem] bg-muted" />
        <div className="h-20 animate-pulse rounded-[1.25rem] bg-muted" />
      </div>

      <div className="h-24 animate-pulse rounded-[1.25rem] bg-muted" />
    </div>
  );
}
