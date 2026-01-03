import { Skeleton } from '@/components/ui/skeleton';

export function ResultsSkeleton() {
  return (
    <div className="flex min-h-[calc(100svh-140px)] flex-col gap-4 overflow-x-hidden p-4">
      {/* Header + Period Tabs skeleton */}
      <header className="flex items-center justify-between">
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-9 w-36 rounded-xl" />
      </header>

      {/* Hero stat skeleton - matches new nested card structure */}
      <Skeleton className="h-48 rounded-[1.25rem]" />

      {/* Stat cards grid skeleton - 2x2 */}
      <div className="grid grid-cols-2 gap-3">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-[1.25rem]" />
        ))}
      </div>

      {/* Chart skeleton */}
      <Skeleton className="h-56 rounded-[1.25rem]" />

      {/* Insights skeleton */}
      <div className="space-y-3">
        <Skeleton className="h-5 w-20" />
        <Skeleton className="h-16 rounded-[1.25rem]" />
        <Skeleton className="h-16 rounded-[1.25rem]" />
      </div>
    </div>
  );
}
