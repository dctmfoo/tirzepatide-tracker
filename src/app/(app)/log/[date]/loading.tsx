import { Skeleton } from '@/components/ui/skeleton';

export default function LogDateLoading() {
  return (
    <div className="flex min-h-[calc(100svh-140px)] flex-col gap-4 p-4">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-6 w-16" />
        <Skeleton className="h-7 w-40" />
        <Skeleton className="h-6 w-12" />
      </div>

      {/* Day summary card skeleton */}
      <div className="rounded-[1.25rem] bg-card p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>

        {/* Weight entry skeleton */}
        <Skeleton className="mb-3 h-20 rounded-2xl" />

        {/* Check-in summary skeleton */}
        <Skeleton className="h-24 rounded-2xl" />
      </div>

      {/* Notes section skeleton */}
      <Skeleton className="h-20 rounded-[1.25rem]" />
    </div>
  );
}
