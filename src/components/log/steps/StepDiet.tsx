'use client';

import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import type { StepData } from '../useLogWizard';

const HUNGER_LEVELS = ['None', 'Low', 'Moderate', 'High', 'Intense'] as const;

type StepDietProps = {
  stepData: StepData;
  updateStepData: <K extends keyof StepData>(step: K, data: StepData[K]) => void;
};

export function StepDiet({ stepData, updateStepData }: StepDietProps) {
  const diet = stepData.diet;

  const update = (field: string, value: string | number | undefined) => {
    updateStepData('diet', { ...diet, [field]: value });
  };

  const handleNumberChange = (field: string, value: string, isFloat = false) => {
    if (value === '') {
      update(field, undefined);
    } else {
      const parsed = isFloat ? parseFloat(value) : parseInt(value, 10);
      if (!isNaN(parsed)) {
        update(field, parsed);
      }
    }
  };

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-xl font-semibold text-foreground mb-2">
          Diet & Nutrition
        </h2>
        <p className="text-muted-foreground text-sm">
          Track your eating habits
        </p>
      </div>

      {/* Hunger Level */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-3">
          Hunger Level
        </label>
        <ToggleGroup
          type="single"
          value={diet.hungerLevel || ''}
          onValueChange={(v) => update('hungerLevel', v || undefined)}
          className="flex gap-2 flex-wrap"
        >
          {HUNGER_LEVELS.map((level) => (
            <ToggleGroupItem
              key={level}
              value={level}
              aria-label={`Hunger: ${level}`}
              className="flex-1 min-w-[60px] rounded-lg py-2 text-sm data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
            >
              {level}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>

      {/* Numeric inputs */}
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-sm text-muted-foreground mb-2">
            Meals
          </label>
          <input
            type="number"
            value={diet.mealsCount ?? ''}
            onChange={(e) => handleNumberChange('mealsCount', e.target.value)}
            placeholder="0"
            min="0"
            max="10"
            className="w-full rounded-lg bg-card border border-border px-3 py-3 text-center text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div>
          <label className="block text-sm text-muted-foreground mb-2">
            Protein (g)
          </label>
          <input
            type="number"
            value={diet.proteinGrams ?? ''}
            onChange={(e) => handleNumberChange('proteinGrams', e.target.value)}
            placeholder="0"
            min="0"
            className="w-full rounded-lg bg-card border border-border px-3 py-3 text-center text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div>
          <label className="block text-sm text-muted-foreground mb-2">
            Water (L)
          </label>
          <input
            type="number"
            step="0.1"
            value={diet.waterLiters ?? ''}
            onChange={(e) => handleNumberChange('waterLiters', e.target.value, true)}
            placeholder="0"
            min="0"
            max="10"
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
          value={diet.notes || ''}
          onChange={(e) => update('notes', e.target.value || undefined)}
          placeholder="Any diet notes..."
          rows={2}
          className="w-full rounded-lg bg-card border border-border px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
        />
      </div>
    </div>
  );
}
