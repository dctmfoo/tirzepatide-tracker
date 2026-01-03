import { TrendingDown, TrendingUp } from 'lucide-react';
import { ProgressRing } from '@/components/ui';

type HeroStatProps = {
  totalChange: number;
  percentChange: number;
  currentWeight: number | null;
  goalWeight: number | null;
  goalProgress: number | null; // 0-100, null if no goal
  toGoal: number | null;
  unit?: string;
};

export function HeroStat({
  totalChange,
  percentChange,
  currentWeight,
  goalWeight,
  goalProgress,
  toGoal,
  unit = 'kg',
}: HeroStatProps) {
  const isLoss = totalChange < 0;
  const displayValue = Math.abs(totalChange).toFixed(1);
  const displayPercent = Math.abs(percentChange).toFixed(1);

  return (
    <section className="rounded-[1.25rem] bg-card p-5 shadow-sm">
      {/* Status Header */}
      <div className="mb-5">
        <h2 className="text-xl font-bold tracking-tight text-card-foreground">
          {isLoss ? 'Down' : 'Up'} {displayValue} {unit}
        </h2>
        <p className="mt-0.5 text-[0.9375rem] font-normal text-muted-foreground">
          {displayPercent}% from starting weight
        </p>
      </div>

      {/* Nested Goal Progress Card */}
      <div className="rounded-2xl border border-border/40 bg-secondary/50 p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <h3 className="text-[1.0625rem] font-semibold text-card-foreground">
              Goal Progress
            </h3>
            <p className="mt-0.5 text-[0.9375rem] text-muted-foreground">
              {currentWeight !== null ? `${currentWeight.toFixed(1)} ${unit} now` : '—'}
              {goalWeight !== null ? ` · ${goalWeight} ${unit} target` : ''}
            </p>

            {/* Progress bar */}
            {goalProgress !== null && (
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-border">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-muted-foreground/30 via-success/70 to-success transition-all duration-500"
                  style={{ width: `${Math.min(100, Math.max(0, goalProgress))}%` }}
                />
              </div>
            )}

            {/* Status text */}
            <div className="mt-3 flex items-center gap-1.5 text-[0.875rem] font-medium text-success">
              {isLoss ? (
                <TrendingDown className="h-4 w-4" />
              ) : (
                <TrendingUp className="h-4 w-4 text-destructive" />
              )}
              <span className={isLoss ? 'text-success' : 'text-destructive'}>
                {toGoal !== null && toGoal > 0
                  ? `${toGoal.toFixed(1)} ${unit} to go`
                  : toGoal !== null && toGoal <= 0
                    ? 'Goal reached!'
                    : 'Set a goal to track progress'}
              </span>
            </div>
          </div>

          {/* Progress Ring */}
          {goalProgress !== null && (
            <ProgressRing value={goalProgress} size={68} strokeWidth={5} />
          )}
        </div>
      </div>
    </section>
  );
}
