import { Skeleton } from '@/components/ui/skeleton';

export function LogSkeleton() {
  return (
    <div className="min-h-[calc(100svh-140px)]">
      {/* Header */}
      <div className="px-4 py-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-4 w-20" />
        </div>
      </div>

      {/* Progress indicator */}
      <div className="border-b border-border px-4 py-3">
        <div className="mb-2 flex items-center justify-center gap-2">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-2 w-2 rounded-full" />
          ))}
        </div>
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-20" />
        </div>
      </div>

      {/* Step content */}
      <div className="space-y-6 px-4 py-6">
        <div className="space-y-2 text-center">
          <Skeleton className="mx-auto h-6 w-48" />
          <Skeleton className="mx-auto h-4 w-64" />
        </div>

        <div className="flex justify-center gap-3">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-20 w-16 rounded-xl" />
          ))}
        </div>

        <div className="space-y-3">
          <Skeleton className="h-4 w-24" />
          <div className="flex gap-2">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-10 flex-1 rounded-lg" />
            ))}
          </div>
        </div>
      </div>

      {/* Footer buttons skeleton */}
      <div className="fixed bottom-[calc(6.5rem+env(safe-area-inset-bottom))] left-0 right-0 z-40 px-4 pt-6">
        <div className="flex gap-3">
          <Skeleton className="h-14 flex-1 rounded-xl" />
          <Skeleton className="h-14 flex-1 rounded-xl" />
        </div>
      </div>
    </div>
  );
}
