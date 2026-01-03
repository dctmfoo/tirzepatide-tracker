import { Suspense } from 'react';
import { format } from 'date-fns';
import { verifySession } from '@/lib/dal';
import { getDailyLogData } from '@/lib/data/daily-log';
import { CheckinPageContent } from '@/components/log-hub/checkin';
import { Skeleton } from '@/components/ui/skeleton';

export const metadata = {
  title: 'Daily Check-in | MJ Tracker',
  description: 'Log your daily mood, side effects, diet, and activity',
};

function CheckinSkeleton() {
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

async function CheckinContent() {
  const session = await verifySession();
  const today = new Date();
  const dateStr = format(today, 'yyyy-MM-dd');
  const displayDate = format(today, 'EEE, MMM d');

  const existingData = await getDailyLogData(session.userId, dateStr);

  return (
    <CheckinPageContent
      date={dateStr}
      displayDate={displayDate}
      isToday={true}
      existingData={existingData}
    />
  );
}

export default function CheckinPage() {
  return (
    <Suspense fallback={<CheckinSkeleton />}>
      <CheckinContent />
    </Suspense>
  );
}
