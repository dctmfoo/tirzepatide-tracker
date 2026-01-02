import { Skeleton } from '@/components/ui/skeleton';

export function CalendarSkeleton() {
  return (
    <div className="p-4">
      {/* Header */}
      <Skeleton className="mb-4 h-6 w-24" />

      {/* Month header */}
      <div className="flex items-center justify-center gap-4 py-4">
        <Skeleton className="h-8 w-8 rounded" />
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-8 w-8 rounded" />
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-1 py-2">
        {[...Array(7)].map((_, i) => (
          <Skeleton key={i} className="h-4" />
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {[...Array(35)].map((_, i) => (
          <Skeleton key={i} className="aspect-square rounded-lg" />
        ))}
      </div>

      {/* Day detail skeleton */}
      <div className="mt-6 space-y-3">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-16 rounded-lg" />
        <div className="flex gap-2">
          <Skeleton className="h-10 flex-1 rounded-lg" />
          <Skeleton className="h-10 flex-1 rounded-lg" />
          <Skeleton className="h-10 flex-1 rounded-lg" />
        </div>
      </div>
    </div>
  );
}
