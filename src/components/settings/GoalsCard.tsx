import { Flag, ArrowRight } from 'lucide-react';

type GoalsCardProps = {
  startWeight: number | null;
  currentWeight: number | null;
  goalWeight: number | null;
  weightUnit: string;
  onEdit: () => void;
};

export function GoalsCard({
  startWeight,
  currentWeight,
  goalWeight,
  weightUnit,
  onEdit,
}: GoalsCardProps) {
  const formatWeight = (kg: number | null): string => {
    if (!kg) return '—';
    if (weightUnit === 'lbs') {
      return (kg * 2.205).toFixed(0);
    }
    if (weightUnit === 'stone') {
      const totalLbs = kg * 2.205;
      const stone = Math.floor(totalLbs / 14);
      const lbs = Math.round(totalLbs % 14);
      return `${stone}st ${lbs}`;
    }
    return kg.toFixed(0);
  };

  const getUnitLabel = (): string => {
    if (weightUnit === 'lbs') return 'lbs';
    if (weightUnit === 'stone') return '';
    return 'kg';
  };

  // Calculate progress percentage
  const calculateProgress = (): number => {
    if (!startWeight || !goalWeight || !currentWeight) return 0;
    const totalToLose = startWeight - goalWeight;
    if (totalToLose <= 0) return 0;
    const lost = startWeight - currentWeight;
    const progress = (lost / totalToLose) * 100;
    return Math.max(0, Math.min(100, progress));
  };

  const progress = calculateProgress();
  const weightLost = startWeight && currentWeight ? startWeight - currentWeight : 0;
  const weightToGo = currentWeight && goalWeight ? currentWeight - goalWeight : 0;

  const hasGoals = startWeight !== null && goalWeight !== null;

  return (
    <section className="relative overflow-hidden rounded-[1.25rem] bg-card p-5 shadow-sm">
      {/* Decorative gradient accent */}
      <div className="absolute right-0 top-0 h-24 w-24 rounded-bl-full bg-gradient-to-bl from-success/10 to-transparent" />

      <div className="relative mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-success/15">
            <Flag className="h-4 w-4 text-success" />
          </div>
          <h3 className="text-[1.0625rem] font-semibold text-card-foreground">Weight Goals</h3>
        </div>
        <button
          onClick={onEdit}
          className="text-[0.875rem] font-medium text-violet-500 transition-colors hover:text-violet-600"
        >
          Edit
        </button>
      </div>

      {hasGoals ? (
        <>
          <div className="relative flex gap-3">
            <div className="flex-1 rounded-2xl border border-border/40 bg-secondary/50 p-3 text-center">
              <p className="mb-0.5 text-[0.75rem] text-muted-foreground">Starting</p>
              <p className="font-display text-xl font-bold text-card-foreground">
                {formatWeight(startWeight)}
                {getUnitLabel() && (
                  <span className="ml-0.5 text-[0.75rem] font-normal text-muted-foreground">
                    {getUnitLabel()}
                  </span>
                )}
              </p>
            </div>
            <div className="flex items-center">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary/70">
                <ArrowRight className="h-4 w-4 text-success" />
              </div>
            </div>
            <div className="flex-1 rounded-2xl border border-success/30 bg-secondary/50 p-3 text-center">
              <p className="mb-0.5 text-[0.75rem] text-muted-foreground">Goal</p>
              <p className="font-display text-xl font-bold text-success">
                {formatWeight(goalWeight)}
                {getUnitLabel() && (
                  <span className="ml-0.5 text-[0.75rem] font-normal text-muted-foreground">
                    {getUnitLabel()}
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* Progress bar */}
          <div className="relative mt-4">
            <div className="mb-2 flex justify-between text-[0.75rem]">
              <span className="text-muted-foreground">Progress toward goal</span>
              <span className="font-semibold text-success">{Math.round(progress)}%</span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-secondary">
              <div
                className="h-2.5 rounded-full bg-gradient-to-r from-success to-emerald-400 transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
            {currentWeight && (
              <p className="mt-2 text-[0.75rem] text-muted-foreground">
                {weightLost > 0 ? `${weightLost.toFixed(1)} ${getUnitLabel()} lost` : 'Getting started'} ·{' '}
                {weightToGo > 0 ? `${weightToGo.toFixed(1)} ${getUnitLabel()} to go` : 'Goal reached!'}
              </p>
            )}
          </div>
        </>
      ) : (
        <div className="py-4 text-center">
          <p className="text-[0.9375rem] text-muted-foreground">
            Set your weight goals to track progress
          </p>
          <button
            onClick={onEdit}
            className="mt-2 text-[0.875rem] font-medium text-violet-500 transition-colors hover:text-violet-600"
          >
            Set Goals
          </button>
        </div>
      )}
    </section>
  );
}
