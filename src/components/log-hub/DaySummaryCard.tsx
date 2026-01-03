'use client';

import Link from 'next/link';
import {
  Scale,
  Syringe,
  ClipboardCheck,
  ChevronRight,
  Clock,
  TrendingDown,
  TrendingUp,
  Minus,
} from 'lucide-react';
import type { DayDetailsData } from '@/lib/data/day-details';

type DaySummaryCardProps = {
  data: DayDetailsData;
};

/**
 * Format time from Date object
 */
function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

/**
 * Format weight delta with sign
 */
function formatDelta(delta: number): string {
  const sign = delta > 0 ? '+' : '';
  return `${sign}${delta.toFixed(1)} kg`;
}

/**
 * Get delta styling based on direction
 */
function getDeltaStyle(delta: number): { icon: typeof TrendingDown; className: string } {
  if (delta < 0) {
    return { icon: TrendingDown, className: 'text-success' };
  } else if (delta > 0) {
    return { icon: TrendingUp, className: 'text-muted-foreground' };
  }
  return { icon: Minus, className: 'text-muted-foreground' };
}

/**
 * Weight entry row component
 */
function WeightEntry({ data }: { data: NonNullable<DayDetailsData['weight']> }) {
  const deltaStyle = data.delta !== undefined ? getDeltaStyle(data.delta) : null;
  const DeltaIcon = deltaStyle?.icon;

  return (
    <div className="rounded-2xl border border-border/40 bg-secondary/50 p-4">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-500/15">
          <Scale className="h-5 w-5 text-blue-500" />
        </div>
        <div className="flex-1">
          <div className="flex items-baseline justify-between">
            <h4 className="font-semibold">Weight</h4>
            <span className="font-display text-lg font-bold">
              {data.weightKg.toFixed(1)} kg
            </span>
          </div>
          <div className="mt-1 flex items-center gap-3 text-[0.8125rem] text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {formatTime(data.recordedAt)}
            </span>
            {data.delta !== undefined && DeltaIcon && (
              <span className={`flex items-center gap-1 ${deltaStyle.className}`}>
                <DeltaIcon className="h-3.5 w-3.5" />
                {formatDelta(data.delta)}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Injection entry row component
 */
function InjectionEntry({ data }: { data: NonNullable<DayDetailsData['injection']> }) {
  // Format injection site for display
  const siteDisplay = data.injectionSite
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  return (
    <div className="rounded-2xl border border-border/40 bg-secondary/50 p-4">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-violet-500/15">
          <Syringe className="h-5 w-5 text-violet-500" />
        </div>
        <div className="flex-1">
          <div className="flex items-baseline justify-between">
            <h4 className="font-semibold">Injection</h4>
            <span className="font-display text-lg font-bold">
              {data.doseMg} mg
            </span>
          </div>
          <div className="mt-1 flex items-center gap-3 text-[0.8125rem] text-muted-foreground">
            <span>{siteDisplay}</span>
            <span className="text-violet-500">Week {data.weekNumber}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Check-in summary with tags
 */
function CheckinSummary({
  data,
  date,
}: {
  data: NonNullable<DayDetailsData['checkin']>;
  date: string;
}) {
  const tags: { label: string; color: string }[] = [];

  // Mood tag
  if (data.mental?.moodLevel) {
    const moodColors: Record<string, string> = {
      poor: 'bg-destructive/15 text-destructive',
      fair: 'bg-amber-500/15 text-amber-600',
      good: 'bg-success/15 text-success',
      great: 'bg-success/15 text-success',
    };
    tags.push({
      label: `${data.mental.moodLevel.charAt(0).toUpperCase() + data.mental.moodLevel.slice(1)} mood`,
      color: moodColors[data.mental.moodLevel.toLowerCase()] || 'bg-secondary text-muted-foreground',
    });
  }

  // Cravings tag
  if (data.mental?.cravingsLevel) {
    const level = data.mental.cravingsLevel.toLowerCase();
    const cravingsColors: Record<string, string> = {
      none: 'bg-success/15 text-success',
      low: 'bg-success/15 text-success',
      medium: 'bg-amber-500/15 text-amber-600',
      high: 'bg-destructive/15 text-destructive',
      intense: 'bg-destructive/15 text-destructive',
    };
    tags.push({
      label: `${data.mental.cravingsLevel} cravings`,
      color: cravingsColors[level] || 'bg-secondary text-muted-foreground',
    });
  }

  // Meals tag
  if (data.diet?.mealsCount !== undefined) {
    tags.push({
      label: `${data.diet.mealsCount} meals`,
      color: 'bg-amber-500/15 text-amber-600',
    });
  }

  // Activity tag
  if (data.activity?.workoutType) {
    tags.push({
      label: data.activity.workoutType,
      color: 'bg-cyan-500/15 text-cyan-600',
    });
  }

  // Steps tag (if present and significant)
  if (data.activity?.steps && data.activity.steps >= 1000) {
    const stepsK = (data.activity.steps / 1000).toFixed(1);
    tags.push({
      label: `${stepsK}k steps`,
      color: 'bg-cyan-500/15 text-cyan-600',
    });
  }

  return (
    <Link
      href={`/log/checkin/${date}`}
      className="block rounded-2xl border border-border/40 bg-secondary/50 p-4 transition-colors hover:bg-secondary/70"
    >
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-500/15">
          <ClipboardCheck className="h-5 w-5 text-emerald-500" />
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold">Check-in</h4>
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </div>
          {tags.length > 0 ? (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {tags.map((tag, index) => (
                <span
                  key={index}
                  className={`rounded-full px-2 py-0.5 text-[0.6875rem] font-medium ${tag.color}`}
                >
                  {tag.label}
                </span>
              ))}
            </div>
          ) : (
            <p className="mt-1 text-[0.8125rem] text-muted-foreground">
              View check-in details
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}

/**
 * Empty state for check-in
 */
function EmptyCheckin({ date, isToday }: { date: string; isToday: boolean }) {
  return (
    <Link
      href={`/log/checkin/${date}`}
      className="block rounded-2xl border border-dashed border-border/60 bg-secondary/30 p-4 transition-colors hover:border-primary/40 hover:bg-secondary/50"
    >
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-500/10">
          <ClipboardCheck className="h-5 w-5 text-emerald-400/70" />
        </div>
        <div className="flex-1">
          <h4 className="font-medium text-muted-foreground">
            {isToday ? 'Start check-in' : 'Add check-in'}
          </h4>
          <p className="text-[0.75rem] text-muted-foreground/70">
            Log mood, diet, activity & more
          </p>
        </div>
        <ChevronRight className="h-5 w-5 text-muted-foreground/50" />
      </div>
    </Link>
  );
}

/**
 * Notes section
 */
function NotesSection({ notes }: { notes: string[] }) {
  if (notes.length === 0) return null;

  return (
    <section className="rounded-[1.25rem] bg-card p-5 shadow-sm">
      <h3 className="mb-3 text-[0.75rem] font-semibold uppercase tracking-wider text-muted-foreground">
        Notes
      </h3>
      <div className="space-y-2">
        {notes.map((note, index) => (
          <p
            key={index}
            className="text-[0.875rem] leading-relaxed text-foreground/90"
          >
            {note}
          </p>
        ))}
      </div>
    </section>
  );
}

/**
 * Empty state when no data for the day
 */
function EmptyState({ date, isToday }: { date: string; isToday: boolean }) {
  return (
    <div className="rounded-[1.25rem] bg-card p-6 text-center shadow-sm">
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-secondary">
        <ClipboardCheck className="h-8 w-8 text-muted-foreground/50" />
      </div>
      <h3 className="mb-2 font-semibold">No data logged</h3>
      <p className="mb-4 text-[0.875rem] text-muted-foreground">
        {isToday
          ? "You haven't logged anything today yet."
          : 'Nothing was logged on this day.'}
      </p>
      <Link
        href={`/log/checkin/${date}`}
        className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-[0.875rem] font-medium text-primary-foreground transition-colors hover:bg-primary/90"
      >
        <ClipboardCheck className="h-4 w-4" />
        {isToday ? 'Start Check-in' : 'Add Check-in'}
      </Link>
    </div>
  );
}

export function DaySummaryCard({ data }: DaySummaryCardProps) {
  const { weight, injection, checkin, hasAnyData, allNotes, date, isToday } = data;

  // Calculate completion status
  const completedSections = [
    !!weight,
    !!injection,
    !!checkin?.mental,
    !!checkin?.diet || !!checkin?.activity,
  ].filter(Boolean).length;

  const isComplete = completedSections >= 3;

  if (!hasAnyData) {
    return (
      <div className="space-y-4">
        <EmptyState date={date} isToday={isToday} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Day Summary Card */}
      <section className="rounded-[1.25rem] bg-card p-5 shadow-sm">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-semibold">Day Summary</h3>
          {isComplete && (
            <span className="rounded-full bg-success/15 px-2 py-0.5 text-[0.6875rem] font-medium text-success">
              Complete
            </span>
          )}
        </div>

        {/* Entries */}
        <div className="space-y-3">
          {weight && <WeightEntry data={weight} />}
          {injection && <InjectionEntry data={injection} />}
          {checkin ? (
            <CheckinSummary data={checkin} date={date} />
          ) : (
            <EmptyCheckin date={date} isToday={isToday} />
          )}
        </div>
      </section>

      {/* Notes Section */}
      <NotesSection notes={allNotes} />
    </div>
  );
}
