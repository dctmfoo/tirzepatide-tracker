import { Suspense } from 'react';
import Link from 'next/link';
import { Calendar } from 'lucide-react';
import { verifySession } from '@/lib/dal';

export const dynamic = 'force-dynamic';

// Placeholder content - will be replaced with LogHeroCard, QuickLogActions, WeekStrip in Phase 2
async function LogContent() {
  await verifySession();

  const today = new Date();
  const formattedDate = today.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

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

      {/* Placeholder Hero Card */}
      <section className="rounded-[1.25rem] bg-card p-5 shadow-sm">
        <div className="text-center">
          <h2 className="text-lg font-medium">{formattedDate}</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Log Hub coming soon - Phase 2
          </p>
        </div>
      </section>

      {/* Placeholder Quick Actions */}
      <section className="grid grid-cols-2 gap-3">
        <div className="rounded-[1.25rem] bg-card p-4 shadow-sm">
          <div className="text-center">
            <p className="text-sm font-medium">Weight</p>
            <p className="text-xs text-muted-foreground">Coming soon</p>
          </div>
        </div>
        <Link
          href="/log/checkin"
          className="rounded-[1.25rem] bg-card p-4 shadow-sm transition-colors hover:bg-card/80"
        >
          <div className="text-center">
            <p className="text-sm font-medium">Check-in</p>
            <p className="text-xs text-muted-foreground">Daily log</p>
          </div>
        </Link>
      </section>

      {/* Placeholder Week Strip */}
      <section className="rounded-[1.25rem] bg-card p-5 shadow-sm">
        <h3 className="mb-3 text-[0.75rem] font-semibold uppercase tracking-wider text-muted-foreground">
          This Week
        </h3>
        <p className="text-sm text-muted-foreground">Week strip coming soon - Phase 2</p>
      </section>
    </div>
  );
}

function LogSkeleton() {
  return (
    <div className="flex min-h-[calc(100svh-140px)] flex-col gap-4 overflow-x-hidden p-4">
      <div className="flex items-center justify-between">
        <div className="h-7 w-12 animate-pulse rounded bg-muted" />
        <div className="h-10 w-10 animate-pulse rounded-full bg-muted" />
      </div>

      <div className="h-32 animate-pulse rounded-[1.25rem] bg-muted" />

      <div className="grid grid-cols-2 gap-3">
        <div className="h-20 animate-pulse rounded-[1.25rem] bg-muted" />
        <div className="h-20 animate-pulse rounded-[1.25rem] bg-muted" />
      </div>

      <div className="h-24 animate-pulse rounded-[1.25rem] bg-muted" />
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
