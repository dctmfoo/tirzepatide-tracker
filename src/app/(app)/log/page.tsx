import { Suspense } from 'react';
import Link from 'next/link';
import { Calendar } from 'lucide-react';
import { verifySession } from '@/lib/dal';
import { getLogHubData } from '@/lib/data/log-hub';
import { LogHeroCard, QuickLogActions, WeekStrip } from '@/components/log-hub';

export const dynamic = 'force-dynamic';

async function LogContent() {
  const session = await verifySession();
  const data = await getLogHubData(session.userId);

  // Determine if user has logged any check-in today
  const hasCheckinToday =
    data.today.progress.mood ||
    data.today.progress.diet ||
    data.today.progress.activity;

  return (
    <div className="flex min-h-[calc(100svh-140px)] flex-col gap-4 overflow-x-hidden p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Log</h1>
        <Link
          href="/log/calendar"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-muted-foreground transition-colors hover:bg-secondary/80"
        >
          <Calendar className="h-5 w-5" />
        </Link>
      </div>

      {/* Hero Card */}
      <LogHeroCard
        formattedDate={data.today.formattedDate}
        progress={data.today.progress}
        completed={data.today.completed}
        total={data.today.total}
        streak={data.streak}
      />

      {/* Quick Actions */}
      <QuickLogActions
        todayDate={data.today.date}
        lastWeightValue={data.lastWeight?.value ?? null}
        hasCheckinToday={hasCheckinToday}
      />

      {/* Week Strip */}
      <WeekStrip weekDays={data.weekDays} todayDate={data.today.date} />
    </div>
  );
}

function LogSkeleton() {
  return (
    <div className="flex min-h-[calc(100svh-140px)] flex-col gap-4 overflow-x-hidden p-4">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div className="h-7 w-12 animate-pulse rounded bg-muted" />
        <div className="h-10 w-10 animate-pulse rounded-full bg-muted" />
      </div>

      {/* Hero card skeleton */}
      <div className="rounded-[1.25rem] bg-card p-5 shadow-sm">
        <div className="mb-4 space-y-2">
          <div className="h-6 w-40 animate-pulse rounded bg-muted" />
          <div className="h-4 w-28 animate-pulse rounded bg-muted" />
        </div>
        <div className="rounded-2xl border border-border/40 bg-secondary/50 p-4">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 animate-pulse rounded-full bg-muted" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-24 animate-pulse rounded bg-muted" />
              <div className="h-3 w-32 animate-pulse rounded bg-muted" />
            </div>
          </div>
        </div>
      </div>

      {/* Quick actions skeleton */}
      <div>
        <div className="mb-3 h-3 w-20 animate-pulse rounded bg-muted" />
        <div className="grid grid-cols-2 gap-3">
          <div className="h-24 animate-pulse rounded-[1.25rem] bg-muted" />
          <div className="h-24 animate-pulse rounded-[1.25rem] bg-muted" />
        </div>
      </div>

      {/* Week strip skeleton */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <div className="h-3 w-20 animate-pulse rounded bg-muted" />
          <div className="h-3 w-24 animate-pulse rounded bg-muted" />
        </div>
        <div className="h-24 animate-pulse rounded-[1.25rem] bg-muted" />
      </div>
    </div>
  );
}

export default function LogPage() {
  return (
    <Suspense fallback={<LogSkeleton />}>
      <LogContent />
    </Suspense>
  );
}
