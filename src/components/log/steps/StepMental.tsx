'use client';

import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import type { StepData } from '../useLogWizard';

const MOODS = [
  { value: 'Poor', emoji: '😞' },
  { value: 'Fair', emoji: '😐' },
  { value: 'Good', emoji: '🙂' },
  { value: 'Great', emoji: '😊' },
  { value: 'Excellent', emoji: '🤩' },
] as const;

const CRAVINGS_LEVELS = ['None', 'Low', 'Medium', 'High', 'Intense'] as const;
const MOTIVATION_LEVELS = ['Low', 'Medium', 'High'] as const;

type StepMentalProps = {
  stepData: StepData;
  updateStepData: <K extends keyof StepData>(step: K, data: StepData[K]) => void;
};

export function StepMental({ stepData, updateStepData }: StepMentalProps) {
  const mental = stepData.mental;

  const update = (field: string, value: string) => {
    updateStepData('mental', { ...mental, [field]: value || undefined });
  };

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-xl font-semibold text-foreground mb-2">
          How are you feeling today?
        </h2>
        <p className="text-muted-foreground text-sm">
          Track your mood to see patterns over time
        </p>
      </div>

      {/* Mood - Large emoji buttons */}
      <div>
        <ToggleGroup
          type="single"
          value={mental.moodLevel || ''}
          onValueChange={(v) => update('moodLevel', v)}
          className="flex justify-center gap-2 flex-wrap"
        >
          {MOODS.map(({ value, emoji }) => (
            <ToggleGroupItem
              key={value}
              value={value}
              aria-label={`Mood: ${value}`}
              className="flex flex-col items-center gap-1 h-20 w-16 rounded-xl data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
            >
              <span className="text-2xl">{emoji}</span>
              <span className="text-xs">{value}</span>
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>

      {/* Cravings */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-3">
          Cravings today?
        </label>
        <ToggleGroup
          type="single"
          value={mental.cravingsLevel || ''}
          onValueChange={(v) => update('cravingsLevel', v)}
          className="flex gap-2 flex-wrap"
        >
          {CRAVINGS_LEVELS.map((level) => (
            <ToggleGroupItem
              key={level}
              value={level}
              aria-label={`Cravings: ${level}`}
              className="flex-1 min-w-[60px] rounded-lg py-2 text-sm data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
            >
              {level}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>

      {/* Motivation */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-3">
          Motivation level?
        </label>
        <ToggleGroup
          type="single"
          value={mental.motivationLevel || ''}
          onValueChange={(v) => update('motivationLevel', v)}
          className="flex gap-2"
        >
          {MOTIVATION_LEVELS.map((level) => (
            <ToggleGroupItem
              key={level}
              value={level}
              aria-label={`Motivation: ${level}`}
              className="flex-1 rounded-lg py-3 text-sm data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
            >
              {level}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>

      {/* Optional notes */}
      <div>
        <label className="block text-sm text-muted-foreground mb-2">
          Notes (optional)
        </label>
        <textarea
          value={mental.notes || ''}
          onChange={(e) => update('notes', e.target.value)}
          placeholder="How are you feeling?"
          rows={2}
          className="w-full rounded-lg bg-card border border-border px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
        />
      </div>
    </div>
  );
}
