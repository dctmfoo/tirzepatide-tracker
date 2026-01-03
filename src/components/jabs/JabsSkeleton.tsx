import { Skeleton } from '@/components/ui/skeleton';

export function JabsSkeleton() {
  return (
    <div className="flex min-h-[calc(100svh-140px)] flex-col gap-4 overflow-x-hidden p-4">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-16" />
        <Skeleton className="h-10 w-10 rounded-full" />
      </div>

      {/* Last Injection Hero Card skeleton */}
      <Skeleton className="h-48 rounded-[1.25rem]" />

      {/* Stats Grid - 3 columns */}
      <div className="grid grid-cols-3 gap-3">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-[1.25rem]" />
        ))}
      </div>

      {/* Section header skeleton */}
      <Skeleton className="mt-2 h-5 w-16" />

      {/* History items skeleton */}
      <div className="space-y-3">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-[1.25rem]" />
        ))}
      </div>
    </div>
  );
}
