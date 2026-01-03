import { Skeleton } from '@/components/ui/skeleton';

export default function SettingsLoading() {
  return (
    <div className="flex min-h-[calc(100svh-140px)] flex-col gap-4 overflow-x-hidden p-4">
      {/* Header skeleton */}
      <Skeleton className="h-8 w-24" />

      {/* Profile card skeleton */}
      <div className="rounded-[1.25rem] bg-card p-5 shadow-sm">
        <div className="mb-5 flex items-center gap-4">
          <Skeleton className="h-14 w-14 rounded-full" />
          <div className="flex-1">
            <Skeleton className="mb-2 h-6 w-32" />
            <Skeleton className="h-4 w-48" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-2xl" />
          ))}
        </div>
      </div>

      {/* Goals card skeleton */}
      <Skeleton className="h-48 rounded-[1.25rem]" />

      {/* Settings sections skeleton */}
      {[...Array(4)].map((_, i) => (
        <div key={i}>
          <Skeleton className="mb-3 h-3 w-20" />
          <div className="divide-y divide-border/40 overflow-hidden rounded-[1.25rem] bg-card shadow-sm">
            {[...Array(2)].map((_, j) => (
              <div key={j} className="flex items-center gap-3 px-4 py-3.5">
                <Skeleton className="h-9 w-9 rounded-xl" />
                <Skeleton className="h-5 w-32" />
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Log out button skeleton */}
      <Skeleton className="h-12 w-full rounded-xl" />
    </div>
  );
}
