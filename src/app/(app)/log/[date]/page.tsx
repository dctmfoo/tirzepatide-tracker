import { Suspense } from 'react';
import Link from 'next/link';
import { verifySession } from '@/lib/dal';
import { getDailyLogData } from '@/lib/data/daily-log';
import { LogWizard, LogSkeleton } from '@/components/log';

export const dynamic = 'force-dynamic';

function isValidDate(dateString: string): boolean {
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(dateString)) return false;
  const date = new Date(dateString);
  return !isNaN(date.getTime());
}

type Props = {
  params: Promise<{ date: string }>;
};

async function LogDateContent({ dateParam }: { dateParam: string }) {
  const session = await verifySession();
  const initialData = await getDailyLogData(session.userId, dateParam);

  return (
    <LogWizard
      logDate={dateParam}
      initialData={initialData}
      redirectTo="/calendar"
      showBackButton={true}
    />
  );
}

export default async function LogDatePage({ params }: Props) {
  const { date: dateParam } = await params;

  // Validate date format
  if (!isValidDate(dateParam)) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center p-4">
        <p className="mb-4 text-error">Invalid date format. Use YYYY-MM-DD.</p>
        <Link href="/calendar" className="text-primary hover:underline">
          Back to Calendar
        </Link>
      </div>
    );
  }

  return (
    <Suspense fallback={<LogSkeleton />}>
      <LogDateContent dateParam={dateParam} />
    </Suspense>
  );
}
