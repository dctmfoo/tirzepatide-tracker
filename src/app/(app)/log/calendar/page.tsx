import { Suspense } from 'react';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { verifySession } from '@/lib/dal';
import { getCalendarData } from '@/lib/data/calendar';
import { LogCalendarClient } from '@/components/log-hub/LogCalendarClient';

export const dynamic = 'force-dynamic';

async function CalendarContent() {
  const session = await verifySession();

  // Get current month's data
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth() + 1;

  const calendarData = await getCalendarData(session.userId, year, month);

  return (
    <div className="flex min-h-[calc(100svh-140px)] flex-col gap-4 overflow-x-hidden p-4">
      {/* Header */}
      <header className="flex items-center justify-between">
        <Link
          href="/log"
          className="flex items-center gap-1 text-muted-foreground transition-colors hover:text-foreground"
        >
          <ChevronLeft className="h-5 w-5" />
          <span className="text-sm font-medium">Back</span>
        </Link>
        <h1 className="text-lg font-semibold">Full Calendar</h1>
        <div className="w-16" /> {/* Spacer for centering */}
      </header>

      {/* Calendar Grid */}
      <LogCalendarClient initialData={calendarData} />

      {/* Month Summary */}
      <section className="rounded-[1.25rem] bg-card p-4 shadow-sm">
        <h3 className="mb-3 text-[0.75rem] font-semibold uppercase tracking-wider text-muted-foreground">
          This Month
        </h3>
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-xl bg-secondary/50 p-3 text-center">
            <div className="text-xl font-bold text-blue-500">
              {calendarData.summary.weightEntries}
            </div>
            <div className="text-[0.6875rem] text-muted-foreground">
              Weight logs
            </div>
          </div>
          <div className="rounded-xl bg-secondary/50 p-3 text-center">
            <div className="text-xl font-bold text-emerald-500">
              {calendarData.summary.logsCompleted}
            </div>
            <div className="text-[0.6875rem] text-muted-foreground">
              Check-ins
            </div>
          </div>
          <div className="rounded-xl bg-secondary/50 p-3 text-center">
            <div className="text-xl font-bold text-violet-500">
              {calendarData.summary.injections}
            </div>
            <div className="text-[0.6875rem] text-muted-foreground">
              Injections
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function CalendarSkeleton() {
  return (
    <div className="flex min-h-[calc(100svh-140px)] flex-col gap-4 overflow-x-hidden p-4">
      {/* Header skeleton */}
      <header className="flex items-center justify-between">
        <div className="h-5 w-16 animate-pulse rounded bg-muted" />
        <div className="h-6 w-28 animate-pulse rounded bg-muted" />
        <div className="w-16" />
      </header>

      {/* Calendar grid skeleton */}
      <div className="rounded-[1.25rem] bg-card p-4 shadow-sm">
        {/* Month nav skeleton */}
        <div className="mb-4 flex items-center justify-between">
          <div className="h-9 w-9 animate-pulse rounded-full bg-muted" />
          <div className="h-6 w-32 animate-pulse rounded bg-muted" />
          <div className="h-9 w-9 animate-pulse rounded-full bg-muted" />
        </div>

        {/* Weekday headers skeleton */}
        <div className="mb-2 grid grid-cols-7 gap-1">
          {Array.from({ length: 7 }).map((_, i) => (
            <div
              key={i}
              className="h-4 animate-pulse rounded bg-muted text-center"
            />
          ))}
        </div>

        {/* Calendar cells skeleton */}
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: 35 }).map((_, i) => (
            <div
              key={i}
              className="aspect-square animate-pulse rounded-lg bg-muted"
            />
          ))}
        </div>

        {/* Legend skeleton */}
        <div className="mt-4 flex items-center justify-center gap-4 border-t border-border/40 pt-3">
          <div className="h-4 w-16 animate-pulse rounded bg-muted" />
          <div className="h-4 w-16 animate-pulse rounded bg-muted" />
          <div className="h-4 w-16 animate-pulse rounded bg-muted" />
        </div>
      </div>

      {/* Summary skeleton */}
      <div className="rounded-[1.25rem] bg-card p-4 shadow-sm">
        <div className="mb-3 h-3 w-24 animate-pulse rounded bg-muted" />
        <div className="grid grid-cols-3 gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="h-16 animate-pulse rounded-xl bg-muted"
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function LogCalendarPage() {
  return (
    <Suspense fallback={<CalendarSkeleton />}>
      <CalendarContent />
    </Suspense>
  );
}
