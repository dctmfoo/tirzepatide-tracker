import { Skeleton } from '@/components/ui/skeleton';

export function ResultsSkeleton() {
  return (
    <div className="space-y-6 overflow-x-hidden p-4">
      {/* Header skeleton */}
      <Skeleton className="h-8 w-24" />

      {/* Period tabs skeleton */}
      <Skeleton className="h-10 w-full rounded-lg p-1">
        <div className="grid h-full w-full grid-cols-4 gap-1">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="rounded-md bg-muted" />
          ))}
        </div>
      </Skeleton>

      {/* Hero stat skeleton */}
      <Skeleton className="h-28 rounded-2xl" />

      {/* Stat cards grid skeleton - 2x2 */}
      <div className="grid grid-cols-2 gap-3">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>

      {/* Chart skeleton */}
      <Skeleton className="h-72 rounded-xl" />

      {/* Insights skeleton */}
      <div className="space-y-3">
        <Skeleton className="h-5 w-20" />
        <Skeleton className="h-20 rounded-xl" />
      </div>
    </div>
  );
}
