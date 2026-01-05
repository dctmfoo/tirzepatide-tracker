'use client';

import Link from 'next/link';
import { CheckCircle2, Clock, AlertTriangle, Link2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProgressRing } from '@/components/ui';
import { cn } from '@/lib/utils';

type HeroStatusCardProps = {
  weekNumber: number;
  statusMessage?: string;
  nextInjection: {
    daysUntil: number | null;
    nextDate: Date | null;
    currentDose: number | null;
    suggestedSite: string;
    status: 'on_track' | 'due_soon' | 'due_today' | 'overdue' | 'not_started';
  };
  cycleProgress: number; // 0-100, percentage through 7-day cycle
};

function getStatusConfig(status: string, daysUntil: number | null) {
  // Dynamic status text based on actual days
  const getStatusText = () => {
    if (daysUntil === null) return 'Not scheduled';
    if (daysUntil < 0) return `${Math.abs(daysUntil)} day${Math.abs(daysUntil) > 1 ? 's' : ''} overdue`;
    if (daysUntil === 0) return 'Due today';
    if (daysUntil === 1) return 'Due tomorrow';
    return `Due in ${daysUntil} days`;
  };

  switch (status) {
    case 'overdue':
      return {
        title: 'Injection overdue',
        subtitle: 'Time to get back on track',
        icon: AlertTriangle,
        statusColor: 'text-destructive',
        statusText: getStatusText(),
      };
    case 'due_today':
      return {
        title: 'Injection due today',
        subtitle: 'Stay consistent',
        icon: Clock,
        statusColor: 'text-warning',
        statusText: getStatusText(),
      };
    case 'due_soon':
      return {
        title: "You're on track",
        subtitle: 'Everything is on schedule',
        icon: CheckCircle2,
        statusColor: 'text-success',
        statusText: getStatusText(),
      };
    case 'not_started':
      return {
        title: 'Get started',
        subtitle: 'Log your first injection',
        icon: CheckCircle2,
        statusColor: 'text-muted-foreground',
        statusText: 'Log your first injection',
      };
    default:
      return {
        title: "You're on track",
        subtitle: 'Everything is on schedule',
        icon: CheckCircle2,
        statusColor: 'text-success',
        statusText: getStatusText(),
      };
  }
}

function formatNextInjectionDate(
  date: Date | null,
  daysUntil: number | null
): string {
  if (!date || daysUntil === null) return 'Not scheduled';

  // Format: "Wed, Jan 15"
  const formatted = new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  }).format(date);

  return formatted;
}

function formatDaysContext(days: number | null): string {
  if (days === null) return '';
  if (days < 0) return `(${Math.abs(days)} days overdue)`;
  if (days === 0) return '(Today)';
  if (days === 1) return '(Tomorrow)';
  return `(in ${days} days)`;
}

export function HeroStatusCard({
  weekNumber,
  statusMessage,
  nextInjection,
  cycleProgress,
}: HeroStatusCardProps) {
  const config = getStatusConfig(nextInjection.status, nextInjection.daysUntil);
  const StatusIcon = config.icon;
  const showLogButton =
    nextInjection.status === 'not_started' ||
    nextInjection.status === 'due_today' ||
    nextInjection.status === 'overdue';

  return (
    <section className="rounded-[1.25rem] bg-card p-5 shadow-sm">
      {/* Status Header */}
      <div className="mb-5">
        <h2 className="text-xl font-bold tracking-tight text-card-foreground">
          {config.title}
        </h2>
        <p className="mt-0.5 text-[0.9375rem] font-normal text-muted-foreground">
          Week {weekNumber} · {statusMessage || config.subtitle}
        </p>
      </div>

      {/* Next Injection Card (nested) */}
      <div className="rounded-2xl border border-border/40 bg-secondary/50 p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h3 className="text-[1.0625rem] font-semibold text-card-foreground">
              Next Injection
            </h3>
            <p className="mt-0.5 text-[0.9375rem] text-muted-foreground">
              {formatNextInjectionDate(nextInjection.nextDate, nextInjection.daysUntil)}{' '}
              {formatDaysContext(nextInjection.daysUntil)}
              {nextInjection.currentDose && ` · ${nextInjection.currentDose} mg`}
            </p>

            {/* Injection Site */}
            {nextInjection.status !== 'not_started' && (
              <div className="mt-3 flex items-center gap-1.5 text-[0.875rem] text-muted-foreground">
                <Link2 className="h-4 w-4" />
                <span>{nextInjection.suggestedSite}</span>
              </div>
            )}

            {/* Status */}
            <div
              className={cn(
                'mt-3 flex items-center gap-1.5 text-[0.875rem] font-medium',
                config.statusColor
              )}
            >
              <StatusIcon className="h-4 w-4" />
              <span>{config.statusText}</span>
            </div>
          </div>

          {/* Progress Ring */}
          {nextInjection.status !== 'not_started' && (
            <div className="flex-shrink-0">
              <ProgressRing value={cycleProgress} size={68} strokeWidth={5} />
            </div>
          )}
        </div>

        {/* Log Injection Button */}
        {showLogButton && (
          <Button className="mt-4 w-full" asChild>
            <Link href="/jabs/new">Log Injection</Link>
          </Button>
        )}
      </div>
    </section>
  );
}
