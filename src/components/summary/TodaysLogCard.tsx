'use client';

import Link from 'next/link';

type TodaysLogCardProps = {
  hasLog: boolean;
  hasDiet?: boolean;
  hasActivity?: boolean;
  hasMental?: boolean;
  sideEffectsCount?: number;
};

export function TodaysLogCard({
  hasLog,
  hasDiet,
  hasActivity,
  hasMental,
  sideEffectsCount = 0,
}: TodaysLogCardProps) {
  const completedItems = [hasDiet, hasActivity, hasMental].filter(Boolean).length;

  return (
    <div className="rounded-lg bg-background-card p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">📝</span>
          <h3 className="font-medium text-foreground">Today&apos;s Log</h3>
        </div>
        <span
          className={`text-sm ${hasLog ? 'text-success' : 'text-foreground-muted'}`}
        >
          {hasLog ? (
            <>
              {completedItems}/3 complete
              {sideEffectsCount > 0 && ` · ${sideEffectsCount} side effect${sideEffectsCount > 1 ? 's' : ''}`}
            </>
          ) : (
            'Not started'
          )}
        </span>
      </div>

      {!hasLog && (
        <div className="mt-3">
          <Link
            href="/log"
            className="inline-block rounded-lg border border-accent-primary px-4 py-2 text-sm font-medium text-accent-primary transition-colors hover:bg-accent-primary hover:text-background"
          >
            Log Now
          </Link>
        </div>
      )}

      {hasLog && (
        <div className="mt-3 flex gap-2 text-xs text-foreground-muted">
          <span className={hasDiet ? 'text-success' : ''}>
            {hasDiet ? '✓' : '○'} Diet
          </span>
          <span className={hasActivity ? 'text-success' : ''}>
            {hasActivity ? '✓' : '○'} Activity
          </span>
          <span className={hasMental ? 'text-success' : ''}>
            {hasMental ? '✓' : '○'} Mental
          </span>
        </div>
      )}
    </div>
  );
}
