'use client';

import { MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';

type JourneyProgressCardProps = {
  startWeight: number | null;
  currentWeight: number | null;
  goalWeight: number | null;
  progressPercent: number | null;
  remainingToGoal: number | null;
  nextMilestone?: { weight: number; remaining: number } | null;
  weightUnit?: string;
};

function formatWeight(kg: number | null, unit: string = 'kg'): string {
  if (kg === null) return '—';
  if (unit === 'lbs') {
    return `${Math.round(kg * 2.20462)}`;
  }
  return `${kg.toFixed(1)}`;
}

export function JourneyProgressCard({
  startWeight,
  currentWeight,
  goalWeight,
  progressPercent,
  remainingToGoal,
  nextMilestone,
  weightUnit = 'kg',
}: JourneyProgressCardProps) {
  const unitLabel = weightUnit === 'lbs' ? 'lbs' : 'kg';

  // Calculate position percentage (inverted because we're going from high to low)
  const positionPercent =
    startWeight && currentWeight && goalWeight
      ? ((startWeight - currentWeight) / (startWeight - goalWeight)) * 100
      : 0;

  // Clamp between 0 and 100
  const clampedPosition = Math.min(100, Math.max(0, positionPercent));

  // Calculate label alignment based on position to prevent edge overflow
  // Near left edge: align to start, near right edge: align to end, otherwise center
  const isNearLeftEdge = clampedPosition < 25;
  const isNearRightEdge = clampedPosition > 75;

  const getLabelAlignment = () => {
    if (isNearLeftEdge) {
      return {
        left: '0',
        transform: 'translateX(0)',
        alignItems: 'flex-start' as const,
      };
    }
    if (isNearRightEdge) {
      return {
        left: '0',
        transform: 'translateX(-100%)',
        alignItems: 'flex-end' as const,
      };
    }
    return {
      left: '50%',
      transform: 'translateX(-50%)',
      alignItems: 'center' as const,
    };
  };

  const labelAlignment = getLabelAlignment();

  return (
    <section className="rounded-[1.25rem] bg-card p-5 shadow-sm">
      {/* Header */}
      <div className="mb-5 flex items-center justify-between">
        <h3 className="text-[1.0625rem] font-semibold text-card-foreground">
          Journey Progress
        </h3>
        <Button
          variant="ghost"
          size="icon"
          className="-mr-1.5 h-8 w-8 text-muted-foreground"
        >
          <MoreHorizontal className="h-5 w-5" />
        </Button>
      </div>

      {/* Weight Progress Slider */}
      <div className="relative pb-16 pt-1">
        {/* Start and Goal weights */}
        <div className="mb-3 flex justify-between text-[0.875rem] font-medium text-muted-foreground">
          <span>
            {formatWeight(startWeight, weightUnit)} {unitLabel}
          </span>
          <span>
            {formatWeight(goalWeight, weightUnit)} {unitLabel}
          </span>
        </div>

        {/* Progress Track */}
        <div className="relative">
          {/* Track background */}
          <div className="h-[3px] rounded-full bg-border"></div>

          {/* Progress fill */}
          <div
            className="absolute left-0 top-0 h-[3px] rounded-full bg-gradient-to-r from-muted-foreground/30 via-muted-foreground/50 to-success"
            style={{ width: `${clampedPosition}%` }}
          ></div>

          {/* Current position marker with label below */}
          {currentWeight && (
            <div
              className="absolute top-1/2 -translate-y-1/2"
              style={{ left: `${clampedPosition}%` }}
            >
              {/* Dot */}
              <div className="-ml-2 h-4 w-4 rounded-full border-[3px] border-card bg-success shadow-md"></div>
              {/* Weight label + "You are here" - below the track with edge-aware positioning */}
              <div
                className="absolute top-5 flex flex-col"
                style={{
                  left: labelAlignment.left,
                  transform: labelAlignment.transform,
                  alignItems: labelAlignment.alignItems,
                }}
              >
                <span className="inline-block whitespace-nowrap rounded-lg bg-card px-2.5 py-1 font-display text-[0.875rem] font-bold text-card-foreground shadow-sm ring-1 ring-border/50">
                  {formatWeight(currentWeight, weightUnit)} {unitLabel}
                </span>
                <span className="mt-1 whitespace-nowrap text-[0.75rem] font-medium text-muted-foreground">
                  You are here
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Completion Status Box */}
      <div className="mt-4 rounded-2xl bg-success-light/60 p-4">
        <div className="flex items-baseline gap-2">
          <span className="font-display text-[1.125rem] font-bold text-success">
            {progressPercent !== null ? `${Math.round(progressPercent)}%` : '—'}
          </span>
          <span className="text-[0.9375rem] font-normal text-muted-foreground">
            complete
            {remainingToGoal !== null &&
              ` · ${formatWeight(remainingToGoal, weightUnit)} ${unitLabel} to go`}
          </span>
        </div>
        {nextMilestone && (
          <p className="mt-1.5 text-[0.875rem] font-medium text-warning">
            ✨ {formatWeight(nextMilestone.remaining, weightUnit)} {unitLabel} to
            next milestone
          </p>
        )}
        {!nextMilestone && progressPercent !== null && progressPercent < 20 && (
          <p className="mt-1.5 text-[0.875rem] font-medium text-warning">
            ✨ First milestone coming soon
          </p>
        )}
      </div>
    </section>
  );
}
