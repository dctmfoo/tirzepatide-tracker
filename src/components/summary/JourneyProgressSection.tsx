import { Section, StatCard, ProgressBar } from '@/components/ui';

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
    return `${(kg * 2.20462).toFixed(1)} lbs`;
  }
  return `${kg.toFixed(1)}kg`;
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

  return (
    <Section title="Journey Progress">
      {/* Goal Progress Card */}
      <div className="rounded-lg bg-card p-4">
        <h3 className="mb-3 font-medium text-foreground">Goal Progress</h3>

        <div className="mb-2 flex justify-between text-sm text-muted-foreground">
          <span>{formatWeight(startWeight, weightUnit)}</span>
          <span className="font-medium text-foreground">{formatWeight(currentWeight, weightUnit)}</span>
          <span>{formatWeight(goalWeight, weightUnit)}</span>
        </div>
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Start</span>
          <span>Current</span>
          <span>Goal</span>
        </div>

        <div className="mt-3">
          <ProgressBar
            value={progressPercent || 0}
            max={100}
            color={progressPercent && progressPercent > 50 ? 'success' : 'primary'}
          />
        </div>

        <p className="mt-3 text-sm text-muted-foreground">
          {progressPercent !== null ? (
            <>
              <span className="text-foreground">{progressPercent.toFixed(1)}%</span> complete ·{' '}
              {formatWeight(remainingToGoal, weightUnit)} to go
              {estimatedDate && (
                <>
                  <br />
                  <span className="text-muted-foreground">At current pace: ~{estimatedDate}</span>
                </>
              )}
            </>
          ) : (
            'Log weights to track progress'
          )}
        </p>
      </div>

      {/* Treatment Timeline Card */}
      {treatmentStartDate && (
        <div className="mt-3 rounded-lg bg-card p-4">
          <h3 className="mb-3 font-medium text-foreground">Treatment Timeline</h3>
          <p className="text-foreground">
            Week {treatmentWeeks || 0} · Day {treatmentDays || 0}
          </p>
          <p className="text-sm text-muted-foreground">
            Started {formatDate(treatmentStartDate)}
          </p>

          {currentDose !== null && (
            <p className="mt-2 text-sm text-muted-foreground">
              {treatmentWeeks !== null && Math.floor(treatmentWeeks / 4) >= 1
                ? `${Math.floor((treatmentWeeks % 4) || 4)} weeks on current dose (${currentDose}mg)`
                : `Current dose: ${currentDose}mg`}
            </p>
          )}
        </div>
      )}

      {/* Milestone and Streak Cards */}
      <div className="mt-3 grid grid-cols-2 gap-3">
        <StatCard
          label="Next Milestone"
          value={nextMilestone ? formatWeight(nextMilestone.weight, weightUnit) : '—'}
          sublabel={
            nextMilestone
              ? `${formatWeight(nextMilestone.remaining, weightUnit)} away`
              : 'Set a goal to track'
          }
        />
        <StatCard
          label="Logging Streak"
          value={loggingStreak > 0 ? `${loggingStreak} days` : '—'}
          sublabel={loggingStreak > 0 ? 'Keep it up!' : 'Log daily to start'}
        />
      </div>
    </Section>
  );
}
