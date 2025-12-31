import Link from 'next/link';

type EmptyStateProps = {
  hasWeight: boolean;
  hasInjection: boolean;
};

export function EmptyState({ hasWeight, hasInjection }: EmptyStateProps) {
  return (
    <div className="space-y-6 p-4">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-foreground">
          Welcome to Your Mounjaro Journey!
        </h1>
        <p className="mt-2 text-foreground-muted">
          Let&apos;s get started by logging your first data points.
        </p>
      </div>

      <div className="space-y-3">
        <div className="rounded-lg bg-background-card p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className={hasWeight ? 'text-success' : 'text-foreground-muted'}>
                {hasWeight ? '✓' : '1.'}
              </span>
              <span className="text-foreground">Log your starting weight</span>
            </div>
            {!hasWeight && (
              <Link
                href="/weight/new"
                className="rounded-lg bg-accent-primary px-4 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90"
              >
                Log Weight
              </Link>
            )}
          </div>
        </div>

        <div className="rounded-lg bg-background-card p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className={hasInjection ? 'text-success' : 'text-foreground-muted'}>
                {hasInjection ? '✓' : '2.'}
              </span>
              <span className="text-foreground">Record your first injection</span>
            </div>
            {!hasInjection && (
              <Link
                href="/jabs/new"
                className="rounded-lg border border-accent-primary px-4 py-2 text-sm font-medium text-accent-primary transition-colors hover:bg-accent-primary hover:text-background"
              >
                Log Injection
              </Link>
            )}
          </div>
        </div>
      </div>

      {hasWeight && hasInjection && (
        <div className="rounded-lg bg-success/20 p-4 text-center">
          <p className="text-success">You&apos;re all set! Your journey begins now.</p>
        </div>
      )}
    </div>
  );
}
