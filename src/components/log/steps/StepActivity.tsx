'use client';

import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import type { StepData } from '../useLogWizard';

const WORKOUT_TYPES = ['Strength training', 'Cardio', 'Walking', 'Rest day', 'Other'] as const;

type StepActivityProps = {
  stepData: StepData;
  updateStepData: <K extends keyof StepData>(step: K, data: StepData[K]) => void;
};

export function StepActivity({ stepData, updateStepData }: StepActivityProps) {
  const activity = stepData.activity;

  const update = (field: string, value: string | number | undefined) => {
    updateStepData('activity', { ...activity, [field]: value });
  };

  const handleNumberChange = (field: string, value: string) => {
    if (value === '') {
      update(field, undefined);
    } else {
      const parsed = parseInt(value, 10);
      if (!isNaN(parsed)) {
        update(field, parsed);
      }
    }
  };

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-xl font-semibold text-foreground mb-2">
          Activity
        </h2>
        <p className="text-muted-foreground text-sm">
          Track your physical activity
        </p>
      </div>

      {/* Workout Type */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-3">
          Workout Type
        </label>
        <ToggleGroup
          type="single"
          value={activity.workoutType || ''}
          onValueChange={(v) => update('workoutType', v || undefined)}
          className="flex gap-2 flex-wrap"
        >
          {WORKOUT_TYPES.map((type) => (
            <ToggleGroupItem
              key={type}
              value={type}
              aria-label={`Workout: ${type}`}
              className="rounded-lg px-4 py-2 text-sm data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
            >
              {type}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>

      {/* Numeric inputs */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-muted-foreground mb-2">
            Duration (min)
          </label>
          <input
            type="number"
            value={activity.durationMinutes ?? ''}
            onChange={(e) => handleNumberChange('durationMinutes', e.target.value)}
            placeholder="0"
            min="0"
            className="w-full rounded-lg bg-card border border-border px-3 py-3 text-center text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div>
          <label className="block text-sm text-muted-foreground mb-2">
            Steps
          </label>
          <input
            type="number"
            value={activity.steps ?? ''}
            onChange={(e) => handleNumberChange('steps', e.target.value)}
            placeholder="0"
            min="0"
            className="w-full rounded-lg bg-card border border-border px-3 py-3 text-center text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      </div>

      {/* Optional notes */}
      <div>
        <label className="block text-sm text-muted-foreground mb-2">
          Notes (optional)
        </label>
        <textarea
          value={activity.notes || ''}
          onChange={(e) => update('notes', e.target.value || undefined)}
          placeholder="Any activity notes..."
          rows={2}
          className="w-full rounded-lg bg-card border border-border px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
        />
      </div>
    </div>
  );
}
