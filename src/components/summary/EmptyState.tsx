import Link from 'next/link';
import { Scale, Syringe, CheckCircle2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

type EmptyStateProps = {
  hasWeight: boolean;
  hasInjection: boolean;
};

export function EmptyState({ hasWeight, hasInjection }: EmptyStateProps) {
  return (
    <div className="space-y-6 p-4">
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/15">
          <Sparkles className="h-8 w-8 text-primary" />
        </div>
        <h1 className="text-2xl font-bold text-foreground">
          Welcome to Your Journey!
        </h1>
        <p className="mt-2 text-muted-foreground">
          Let&apos;s get started by logging your first data points.
        </p>
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-4 overflow-hidden rounded-xl border border-border bg-card p-4">
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${hasWeight ? 'bg-success/15' : 'bg-muted'}`}>
            {hasWeight ? (
              <CheckCircle2 className="h-5 w-5 text-success" />
            ) : (
              <Scale className="h-5 w-5 text-muted-foreground" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-medium text-foreground">Log your starting weight</p>
            {hasWeight && (
              <p className="text-sm text-success">Completed</p>
            )}
          </div>
          {!hasWeight && (
            <Button size="sm" asChild>
              <Link href="/weight/new">Log Weight</Link>
            </Button>
          )}
        </div>

        <div className="flex items-center gap-4 overflow-hidden rounded-xl border border-border bg-card p-4">
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${hasInjection ? 'bg-success/15' : 'bg-muted'}`}>
            {hasInjection ? (
              <CheckCircle2 className="h-5 w-5 text-success" />
            ) : (
              <Syringe className="h-5 w-5 text-muted-foreground" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-medium text-foreground">Record your first injection</p>
            {hasInjection && (
              <p className="text-sm text-success">Completed</p>
            )}
          </div>
          {!hasInjection && (
            <Button size="sm" variant="outline" asChild>
              <Link href="/jabs/new">Log Injection</Link>
            </Button>
          )}
        </div>
      </div>

      {hasWeight && hasInjection && (
        <div className="overflow-hidden rounded-xl border border-success/20 bg-gradient-to-br from-success/15 to-success/5 p-4 text-center">
          <p className="font-medium text-success">You&apos;re all set! Your journey begins now.</p>
        </div>
      )}
    </div>
  );
}
