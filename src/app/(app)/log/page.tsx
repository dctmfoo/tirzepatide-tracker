import { Suspense } from 'react';
import { verifySession } from '@/lib/dal';
import { getDailyLogData } from '@/lib/data/daily-log';
import { LogFormClient, LogSkeleton } from '@/components/log';

export const dynamic = 'force-dynamic';

function getTodayString(): string {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
}

async function LogContent() {
  const session = await verifySession();
  const logDate = getTodayString();
  const initialData = await getDailyLogData(session.userId, logDate);

  return (
    <LogFormClient
      logDate={logDate}
      initialData={initialData}
      redirectTo="/summary"
      showBackButton={false}
    />
  );
}

export default function LogPage() {
  return (
    <Suspense fallback={<LogSkeleton />}>
      <LogContent />
    </Suspense>
  );
}
