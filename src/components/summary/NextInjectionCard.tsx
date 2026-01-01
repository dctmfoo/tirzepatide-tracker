'use client';

import Link from 'next/link';
import { ProgressBar } from '@/components/ui';

type NextInjectionCardProps = {
  nextDue: string | null;
  daysUntil: number | null;
  currentDose: number | null;
  status: string;
  suggestedSite?: string;
};

function formatDate(dateString: string | null): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

function getStatusText(status: string, daysUntil: number | null): string {
  if (status === 'not_started') return 'No injections recorded';
  if (status === 'overdue') return `Overdue by ${Math.abs(daysUntil || 0)} days`;
  if (status === 'due_today') return 'Due today';
  if (status === 'due_soon') return `Due in ${daysUntil} day${daysUntil === 1 ? '' : 's'}`;
  return `Due in ${daysUntil} days`;
}

function getStatusColor(status: string): 'success' | 'warning' | 'primary' {
  if (status === 'overdue') return 'warning';
  if (status === 'due_today' || status === 'due_soon') return 'warning';
  return 'primary';
}

export function NextInjectionCard({
  nextDue,
  daysUntil,
  currentDose,
  status,
  suggestedSite = 'Thigh - Right',
}: NextInjectionCardProps) {
  const dayInCycle = daysUntil !== null ? 7 - daysUntil : 0;
  const progressValue = Math.max(0, Math.min(dayInCycle, 7));

  return (
    <div className="rounded-lg bg-card p-4">
      <div className="flex items-center gap-3">
        <span className="text-2xl">💉</span>
        <h3 className="font-medium text-foreground">Next Injection</h3>
      </div>

      <div className="mt-3 space-y-3">
        <p className="text-foreground">
          {status === 'not_started' ? (
            'Log your first injection to get started'
          ) : (
            <>
              {getStatusText(status, daysUntil)}
              {nextDue && status !== 'overdue' && (
                <span className="text-muted-foreground"> ({formatDate(nextDue)})</span>
              )}
            </>
          )}
        </p>

        {status !== 'not_started' && (
          <>
            <ProgressBar
              value={progressValue}
              max={7}
              label={`Day ${dayInCycle} of 7`}
              color={getStatusColor(status)}
            />

            <div className="flex flex-col gap-1 text-sm text-muted-foreground">
              {currentDose && <span>Current dose: {currentDose}mg</span>}
              <span>Suggested site: {suggestedSite}</span>
            </div>
          </>
        )}

        {(status === 'not_started' || status === 'due_today' || status === 'overdue') && (
          <Link
            href="/jabs/new"
            className="mt-2 inline-block rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
          >
            Log Injection
          </Link>
        )}
      </div>
    </div>
  );
}
