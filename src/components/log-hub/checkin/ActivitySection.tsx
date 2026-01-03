'use client';

import { Activity } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';
import type { WorkoutType } from './useCheckinForm';

const WORKOUT_OPTIONS: WorkoutType[] = ['Rest day', 'Walking', 'Cardio', 'Strength training', 'Other'];

// Display labels for workout types
const WORKOUT_LABELS: Record<WorkoutType, string> = {
  'Rest day': 'Rest',
  'Walking': 'Walking',
  'Cardio': 'Cardio',
  'Strength training': 'Strength',
  'Other': 'Other',
};

type ActivitySectionProps = {
  steps: number;
  durationMinutes: number;
  workoutType: WorkoutType | null;
  onStepsChange: (value: number) => void;
  onDurationChange: (value: number) => void;
  onWorkoutTypeChange: (value: WorkoutType | null) => void;
};

// Format steps for display (e.g., 5200 -> "5.2k")
function formatSteps(steps: number): string {
  if (steps >= 1000) {
    return `${(steps / 1000).toFixed(1).replace('.0', '')}k`;
  }
  return String(steps);
}

// Format duration for display (e.g., 30 -> "30m")
function formatDuration(minutes: number): string {
  return `${minutes}m`;
}

export function ActivitySection({
  steps,
  durationMinutes,
  workoutType,
  onStepsChange,
  onDurationChange,
  onWorkoutTypeChange,
}: ActivitySectionProps) {
  return (
    <section className="rounded-[1.25rem] bg-card p-4 shadow-sm">
      {/* Header */}
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-500/15">
          <Activity className="h-4 w-4 text-cyan-500" />
        </div>
        <h3 className="font-semibold text-foreground">Activity</h3>
      </div>

      {/* Sliders */}
      <div className="mb-4 space-y-4">
        {/* Steps */}
        <div className="flex items-center gap-3">
          <span className="w-16 text-[0.8125rem] text-foreground">Steps</span>
          <Slider
            value={[steps]}
            onValueChange={([value]) => onStepsChange(value)}
            max={20000}
            step={500}
            className="flex-1"
          />
          <span className="w-12 text-right font-display font-bold text-foreground">
            {formatSteps(steps)}
          </span>
        </div>

        {/* Duration */}
        <div className="flex items-center gap-3">
          <span className="w-16 text-[0.8125rem] text-foreground">Duration</span>
          <Slider
            value={[durationMinutes]}
            onValueChange={([value]) => onDurationChange(value)}
            max={120}
            step={5}
            className="flex-1"
          />
          <span className="w-12 text-right font-display font-bold text-foreground">
            {formatDuration(durationMinutes)}
          </span>
        </div>
      </div>

      {/* Workout Type */}
      <div>
        <span className="text-[0.75rem] text-muted-foreground">Workout Type</span>
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {WORKOUT_OPTIONS.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => onWorkoutTypeChange(workoutType === option ? null : option)}
              className={cn(
                'rounded-lg px-2.5 py-1.5 text-[0.75rem] border transition-colors',
                workoutType === option
                  ? 'bg-primary text-primary-foreground border-transparent'
                  : 'border-border/60 text-muted-foreground hover:border-border'
              )}
            >
              {WORKOUT_LABELS[option]}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
