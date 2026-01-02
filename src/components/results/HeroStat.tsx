import { TrendingDown, TrendingUp } from 'lucide-react';
import { ProgressRing } from '@/components/ui';

type HeroStatProps = {
  totalChange: number;
  percentChange: number;
  startDate: Date | null;
  goalProgress: number | null; // 0-100, null if no goal
  unit?: string;
};

export function HeroStat({
  totalChange,
  percentChange,
  startDate: _startDate,
  goalProgress,
  unit = 'kg',
}: HeroStatProps) {
  void _startDate; // Reserved for future use
  const isLoss = totalChange < 0;
  const displayValue = Math.abs(totalChange).toFixed(1);
  const displayPercent = Math.abs(percentChange).toFixed(1);

  return (
    <div className="overflow-hidden rounded-xl border border-success/20 bg-gradient-to-br from-success/15 to-success/5 p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            {isLoss ? (
              <TrendingDown className="h-4 w-4 text-success" />
            ) : (
              <TrendingUp className="h-4 w-4 text-destructive" />
            )}
            <span>Total {isLoss ? 'Lost' : 'Gained'}</span>
          </p>

          <div className="mt-1 flex items-baseline gap-1">
            <span
              className={`text-3xl font-bold tabular-nums ${isLoss ? 'text-success' : 'text-destructive'}`}
            >
              {displayValue}
            </span>
            <span className="text-base text-muted-foreground">{unit}</span>
            <span className={`ml-2 text-sm font-medium ${isLoss ? 'text-success' : 'text-destructive'}`}>
              ({displayPercent}%)
            </span>
          </div>
        </div>

        {goalProgress !== null && (
          <div className="flex shrink-0 flex-col items-center">
            <ProgressRing value={goalProgress} size={56} strokeWidth={5} />
            <p className="mt-1 text-[10px] text-muted-foreground">to goal</p>
          </div>
        )}
      </div>
    </div>
  );
}
