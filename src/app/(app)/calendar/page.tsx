import { Suspense } from 'react';
import { verifySession } from '@/lib/dal';
import { getCalendarData } from '@/lib/data/calendar';
import { CalendarClient, CalendarSkeleton } from '@/components/calendar';

export const dynamic = 'force-dynamic';

async function CalendarContent() {
  const session = await verifySession();
  const today = new Date();
  const data = await getCalendarData(
    session.userId,
    today.getFullYear(),
    today.getMonth() + 1
  );

  return <CalendarClient initialData={data} />;
}

export default function CalendarPage() {
  return (
    <Suspense fallback={<CalendarSkeleton />}>
      <CalendarContent />
    </Suspense>
  );
}
