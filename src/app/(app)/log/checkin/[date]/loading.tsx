import { Skeleton } from '@/components/ui/skeleton';

export default function CheckinDateLoading() {
  return (
    <div className="flex min-h-[calc(100svh-140px)] flex-col gap-3 p-4">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-6 w-16" />
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-6 w-12" />
      </div>

      {/* Progress skeleton */}
      <div className="flex justify-center">
        <Skeleton className="h-7 w-32 rounded-full" />
      </div>

      {/* Section skeletons */}
      {[1, 2, 3, 4, 5].map((i) => (
        <Skeleton key={i} className="h-32 rounded-[1.25rem]" />
      ))}

      {/* Button skeleton */}
      <Skeleton className="h-14 rounded-xl" />
    </div>
  );
}
