import { Target, Calendar, Flag, Flame, Pill } from 'lucide-react';
import { Section, ProgressRing, StatCard } from '@/components/ui';

type JourneyProgressSectionProps = {
  startWeight: number | null;
  currentWeight: number | null;
  goalWeight: number | null;
  progressPercent: number | null;
  remainingToGoal: number | null;
  treatmentStartDate: string | null;
  treatmentDays: number | null;
  treatmentWeeks: number | null;
  currentDose: number | null;
  nextMilestone?: { weight: number; remaining: number };
  loggingStreak?: number;
  weightUnit?: string;
};

function formatWeight(kg: number | null, unit: string = 'kg'): string {
  if (kg === null) return '—';
  if (unit === 'lbs') {
    return `${(kg * 2.20462).toFixed(0)}`;
  }
  return `${kg.toFixed(1)}`;
}

function formatWeightWithUnit(kg: number | null, unit: string = 'kg'): string {
  if (kg === null) return '—';
  const unitLabel = unit === 'lbs' ? 'lbs' : 'kg';
  if (unit === 'lbs') {
    return `${(kg * 2.20462).toFixed(1)} ${unitLabel}`;
  }
  return `${kg.toFixed(1)}${unitLabel}`;
}

function formatDate(dateString: string | null): string {
  if (!dateString) return '';
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function estimateGoalDate(remainingKg: number | null, weeksElapsed: number | null, weightLost: number | null): string | null {
  if (!remainingKg || !weeksElapsed || !weightLost || weeksElapsed === 0) return null;

  const weeklyRate = weightLost / weeksElapsed;
  if (weeklyRate <= 0) return null;

  const weeksRemaining = remainingKg / weeklyRate;
  const targetDate = new Date();
  targetDate.setDate(targetDate.getDate() + weeksRemaining * 7);

  return targetDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

export function JourneyProgressSection({
  startWeight,
  currentWeight,
  goalWeight,
  progressPercent,
  remainingToGoal,
  treatmentStartDate,
  treatmentDays,
  treatmentWeeks,
  currentDose,
  nextMilestone,
  loggingStreak = 0,
  weightUnit = 'kg',
}: JourneyProgressSectionProps) {
  const weightLost = startWeight && currentWeight ? startWeight - currentWeight : null;
  const estimatedDate = estimateGoalDate(remainingToGoal, treatmentWeeks, weightLost);
  const unitLabel = weightUnit === 'lbs' ? 'lbs' : 'kg';

  return (
    <Section title="Journey Progress">
      {/* Goal Progress Hero Card */}
      <div className="overflow-hidden rounded-xl border border-success/20 bg-gradient-to-br from-success/15 to-success/5 p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Target className="h-4 w-4 text-success" />
              <span>Goal Progress</span>
            </p>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-bold tabular-nums text-success">
                {progressPercent !== null ? `${progressPercent.toFixed(0)}%` : '—'}
              </span>
              <span className="text-sm text-muted-foreground">
                {remainingToGoal !== null ? `${formatWeightWithUnit(remainingToGoal, weightUnit)} to go` : ''}
              </span>
            </div>
            {/* Weight range display */}
            <div className="mt-2 flex justify-between text-xs text-muted-foreground">
              <span>{formatWeight(startWeight, weightUnit)}{unitLabel} start</span>
              <span>{formatWeight(goalWeight, weightUnit)}{unitLabel} goal</span>
            </div>
            {estimatedDate && (
              <p className="mt-1 text-xs text-muted-foreground">
                At current pace: ~{estimatedDate}
              </p>
            )}
          </div>
          {progressPercent !== null && (
            <ProgressRing value={progressPercent} size={64} strokeWidth={6} />
          )}
        </div>
      </div>

      {/* Treatment Timeline Card */}
      {treatmentStartDate && (
        <div className="mt-3 overflow-hidden rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-violet-500/15">
              <Calendar className="h-4 w-4 text-violet-500" />
            </div>
            <div>
              <p className="font-semibold text-foreground">Week {treatmentWeeks || 0}</p>
              <p className="text-sm text-muted-foreground">
                Started {formatDate(treatmentStartDate)}
              </p>
            </div>
          </div>
          {currentDose !== null && (
            <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
              <Pill className="h-3.5 w-3.5" />
              <span>{currentDose}mg dose</span>
            </div>
          )}
        </div>
      )}

      {/* Milestone and Streak Cards */}
      <div className="mt-3 grid grid-cols-2 gap-3">
        <StatCard
          icon={Flag}
          iconColor="amber"
          label="Next Milestone"
          value={nextMilestone ? formatWeight(nextMilestone.weight, weightUnit) : null}
          unit={nextMilestone ? unitLabel : undefined}
          subtext={
            nextMilestone
              ? `${formatWeightWithUnit(nextMilestone.remaining, weightUnit)} away`
              : 'Set a goal'
          }
        />
        <StatCard
          icon={Flame}
          iconColor="orange"
          label="Streak"
          value={loggingStreak > 0 ? loggingStreak : null}
          unit={loggingStreak > 0 ? 'days' : undefined}
          subtext={loggingStreak > 0 ? 'Keep it up!' : 'Log daily'}
        />
      </div>
    </Section>
  );
}
