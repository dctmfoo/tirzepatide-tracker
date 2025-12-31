import { StatCard, Section } from '@/components/ui';

type CurrentStateSectionProps = {
  currentWeight: number | null;
  lastWeightChange: number | null;
  lastWeightDate: string | null;
  weeklyStats?: {
    weightChange: number | null;
    avgHunger?: string;
    avgMood?: string;
    totalSteps?: number;
    workoutDays?: number;
    avgProtein?: number;
    sideEffects?: string;
  };
  weightUnit?: string;
};

function formatWeight(kg: number | null, unit: string = 'kg'): string {
  if (kg === null) return '—';
  if (unit === 'lbs') {
    return `${(kg * 2.20462).toFixed(1)} lbs`;
  }
  return `${kg.toFixed(1)}kg`;
}

function formatWeightChange(kg: number | null, unit: string = 'kg'): string {
  if (kg === null) return '—';
  const sign = kg >= 0 ? '+' : '';
  if (unit === 'lbs') {
    return `${sign}${(kg * 2.20462).toFixed(1)} lbs`;
  }
  return `${sign}${kg.toFixed(1)}kg`;
}

function formatRelativeDate(dateString: string | null): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'today';
  if (diffDays === 1) return 'yesterday';
  return `${diffDays} days ago`;
}

export function CurrentStateSection({
  currentWeight,
  lastWeightChange,
  lastWeightDate,
  weeklyStats,
  weightUnit = 'kg',
}: CurrentStateSectionProps) {
  return (
    <Section title="Current State">
      <div className="grid grid-cols-2 gap-3">
        <StatCard
          label="Current"
          value={formatWeight(currentWeight, weightUnit)}
          variant="large"
        />
        <StatCard
          label="Since Last"
          value={formatWeightChange(lastWeightChange, weightUnit)}
          sublabel={lastWeightDate ? `(${formatRelativeDate(lastWeightDate)})` : undefined}
        />
      </div>

      {weeklyStats && (
        <div className="mt-3 rounded-lg bg-background-card p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-medium text-foreground">This Week</h3>
            <span className="text-xs text-foreground-muted">
              {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} week
            </span>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-foreground-muted">Weight</span>
              <span className={`font-medium ${weeklyStats.weightChange && weeklyStats.weightChange < 0 ? 'text-success' : 'text-foreground'}`}>
                {formatWeightChange(weeklyStats.weightChange, weightUnit)} ↓
              </span>
            </div>
            {weeklyStats.avgHunger && (
              <div className="flex justify-between">
                <span className="text-foreground-muted">Avg Hunger</span>
                <span className="text-foreground">{weeklyStats.avgHunger}</span>
              </div>
            )}
            {weeklyStats.avgMood && (
              <div className="flex justify-between">
                <span className="text-foreground-muted">Avg Mood</span>
                <span className="text-foreground">{weeklyStats.avgMood}</span>
              </div>
            )}
            {weeklyStats.totalSteps !== undefined && (
              <div className="flex justify-between">
                <span className="text-foreground-muted">Steps</span>
                <span className="text-foreground">
                  {weeklyStats.totalSteps.toLocaleString()} (avg {Math.round(weeklyStats.totalSteps / 7).toLocaleString()}/day)
                </span>
              </div>
            )}
            {weeklyStats.workoutDays !== undefined && (
              <div className="flex justify-between">
                <span className="text-foreground-muted">Workouts</span>
                <span className="text-foreground">{weeklyStats.workoutDays} of 7 days</span>
              </div>
            )}
            {weeklyStats.avgProtein !== undefined && (
              <div className="flex justify-between">
                <span className="text-foreground-muted">Protein</span>
                <span className="text-foreground">~{weeklyStats.avgProtein}g/day avg</span>
              </div>
            )}
            {weeklyStats.sideEffects && (
              <div className="flex justify-between">
                <span className="text-foreground-muted">Side Effects</span>
                <span className="text-foreground">{weeklyStats.sideEffects}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </Section>
  );
}
