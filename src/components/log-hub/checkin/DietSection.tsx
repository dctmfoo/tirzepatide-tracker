'use client';

import { UtensilsCrossed, Check } from 'lucide-react';
import { Stepper } from '@/components/ui/stepper';
import { cn } from '@/lib/utils';
import type { HungerLevel } from './useCheckinForm';

const HUNGER_OPTIONS: HungerLevel[] = ['None', 'Low', 'Moderate', 'High', 'Intense'];

type DietSectionProps = {
  mealsCount: number;
  proteinGrams: number;
  waterLiters: number;
  hungerLevel: HungerLevel | null;
  onMealsChange: (value: number) => void;
  onProteinChange: (value: number) => void;
  onWaterChange: (value: number) => void;
  onHungerChange: (value: HungerLevel | null) => void;
  isComplete: boolean;
};

export function DietSection({
  mealsCount,
  proteinGrams,
  waterLiters,
  hungerLevel,
  onMealsChange,
  onProteinChange,
  onWaterChange,
  onHungerChange,
  isComplete,
}: DietSectionProps) {
  return (
    <section className="rounded-[1.25rem] bg-card p-4 shadow-sm">
      {/* Header */}
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/15">
          <UtensilsCrossed className="h-4 w-4 text-amber-600" />
        </div>
        <h3 className="font-semibold text-foreground">Diet & Nutrition</h3>
        {isComplete && (
          <span className="ml-auto inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[0.6875rem] font-medium bg-success/15 text-success">
            <Check className="h-3 w-3" />
            Done
          </span>
        )}
      </div>

      {/* Steppers Grid */}
      <div className="mb-4 grid grid-cols-3 gap-3">
        <Stepper
          label="Meals"
          value={mealsCount}
          onChange={onMealsChange}
          min={0}
          max={10}
          step={1}
        />
        <Stepper
          label="Protein"
          value={proteinGrams}
          onChange={onProteinChange}
          min={0}
          max={300}
          step={10}
          unit="g"
        />
        <Stepper
          label="Water"
          value={waterLiters}
          onChange={onWaterChange}
          min={0}
          max={5}
          step={0.5}
          unit="L"
          formatValue={(v) => v.toFixed(1).replace('.0', '')}
        />
      </div>

      {/* Hunger Level */}
      <div>
        <span className="text-[0.75rem] text-muted-foreground">Hunger Level</span>
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {HUNGER_OPTIONS.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => onHungerChange(hungerLevel === option ? null : option)}
              className={cn(
                'rounded-lg px-2.5 py-1.5 text-[0.75rem] border transition-colors',
                hungerLevel === option
                  ? 'bg-primary text-primary-foreground border-transparent'
                  : 'border-border/60 text-muted-foreground hover:border-border'
              )}
            >
              {option}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
