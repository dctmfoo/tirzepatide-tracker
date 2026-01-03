import { Suspense } from 'react';
import Link from 'next/link';
import { ChevronLeft, Pencil } from 'lucide-react';
import { verifySession } from '@/lib/dal';
import { getDayDetailsData } from '@/lib/data/day-details';
import { DaySummaryCard } from '@/components/log-hub';

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

function DayDetailsSkeleton() {
  return (
    <div className="flex min-h-[calc(100svh-140px)] flex-col gap-4 overflow-x-hidden p-4">
      {/* Header skeleton */}
      <header className="flex items-center justify-between">
        <div className="h-6 w-16 animate-pulse rounded bg-secondary" />
        <div className="h-6 w-32 animate-pulse rounded bg-secondary" />
        <div className="h-6 w-12 animate-pulse rounded bg-secondary" />
      </header>

      {/* Summary card skeleton */}
      <div className="rounded-[1.25rem] bg-card p-5 shadow-sm">
        <div className="mb-4 h-5 w-28 animate-pulse rounded bg-secondary" />
        <div className="space-y-3">
          <div className="h-20 animate-pulse rounded-2xl bg-secondary/50" />
          <div className="h-20 animate-pulse rounded-2xl bg-secondary/50" />
          <div className="h-20 animate-pulse rounded-2xl bg-secondary/50" />
        </div>
      </div>
    </div>
  );
}

async function DayDetailsContent({ dateParam }: { dateParam: string }) {
  const session = await verifySession();
  const data = await getDayDetailsData(session.userId, dateParam);

  return (
    <div className="flex min-h-[calc(100svh-140px)] flex-col gap-4 overflow-x-hidden p-4">
      {/* Header */}
      <header className="flex items-center justify-between">
        <Link
          href="/log"
          className="flex items-center gap-1 text-muted-foreground transition-colors hover:text-foreground"
        >
          <ChevronLeft className="h-5 w-5" />
          <span className="text-[0.875rem] font-medium">Back</span>
        </Link>

        <h1 className="text-[1.0625rem] font-semibold">{data.formattedDate}</h1>

        <Link
          href={`/log/checkin/${dateParam}`}
          className="flex items-center gap-1 text-primary transition-colors hover:text-primary/80"
        >
          <Pencil className="h-4 w-4" />
          <span className="text-[0.875rem] font-medium">Edit</span>
        </Link>
      </header>

      {/* Day Summary */}
      <DaySummaryCard data={data} />
    </div>
  );
}

export default async function LogDatePage({ params }: Props) {
  const { date: dateParam } = await params;

  // Validate date format
  if (!isValidDate(dateParam)) {
    return (
      <div className="flex min-h-[calc(100svh-140px)] flex-col items-center justify-center gap-4 p-4">
        <p className="text-destructive">Invalid date format. Use YYYY-MM-DD.</p>
        <Link
          href="/log"
          className="flex items-center gap-1 text-primary hover:underline"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to Log
        </Link>
      </div>
    );
  }

  return (
    <Suspense fallback={<DayDetailsSkeleton />}>
      <DayDetailsContent dateParam={dateParam} />
    </Suspense>
  );
}
