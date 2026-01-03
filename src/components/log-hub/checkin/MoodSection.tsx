'use client';

import { Smile, Frown, Meh, Laugh, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { MoodLevel, CravingsLevel, MotivationLevel } from './useCheckinForm';

const MOOD_OPTIONS: { value: MoodLevel; label: string; icon: typeof Smile; colorClass: string }[] = [
  { value: 'Poor', label: 'Poor', icon: Frown, colorClass: 'text-destructive' },
  { value: 'Fair', label: 'Fair', icon: Meh, colorClass: 'text-amber-500' },
  { value: 'Good', label: 'Good', icon: Smile, colorClass: 'text-emerald-500' },
  { value: 'Great', label: 'Great', icon: Laugh, colorClass: 'text-success' },
];

const CRAVINGS_OPTIONS: CravingsLevel[] = ['None', 'Low', 'Medium', 'High', 'Intense'];
const ENERGY_OPTIONS: MotivationLevel[] = ['Low', 'Medium', 'High'];

type MoodSectionProps = {
  moodLevel: MoodLevel | null;
  cravingsLevel: CravingsLevel | null;
  motivationLevel: MotivationLevel | null;
  onMoodChange: (value: MoodLevel | null) => void;
  onCravingsChange: (value: CravingsLevel | null) => void;
  onMotivationChange: (value: MotivationLevel | null) => void;
  isComplete: boolean;
};

export function MoodSection({
  moodLevel,
  cravingsLevel,
  motivationLevel,
  onMoodChange,
  onCravingsChange,
  onMotivationChange,
  isComplete,
}: MoodSectionProps) {
  return (
    <section className="rounded-[1.25rem] bg-card p-4 shadow-sm">
      {/* Header */}
      <div className="mb-3 flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/15">
          <Smile className="h-4 w-4 text-emerald-500" />
        </div>
        <h3 className="font-semibold text-foreground">Mood & Energy</h3>
        {isComplete && (
          <span className="ml-auto inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[0.6875rem] font-medium bg-success/15 text-success">
            <Check className="h-3 w-3" />
            Done
          </span>
        )}
      </div>

      {/* Mood Icons */}
      <div className="mb-3 flex gap-2">
        {MOOD_OPTIONS.map(({ value, label, icon: Icon, colorClass }) => (
          <button
            key={value}
            type="button"
            onClick={() => onMoodChange(moodLevel === value ? null : value)}
            className={cn(
              'flex flex-1 flex-col items-center gap-1 rounded-lg border-2 p-2 transition-colors',
              moodLevel === value
                ? 'border-primary bg-primary/10'
                : 'border-transparent hover:bg-muted/50'
            )}
          >
            <Icon className={cn('h-5 w-5', colorClass)} strokeWidth={1.5} />
            <span
              className={cn(
                'text-[0.6875rem]',
                moodLevel === value ? 'font-medium text-foreground' : 'text-muted-foreground'
              )}
            >
              {label}
            </span>
          </button>
        ))}
      </div>

      {/* Cravings & Energy Row */}
      <div className="flex gap-4">
        {/* Cravings */}
        <div className="flex-1">
          <span className="text-[0.6875rem] text-muted-foreground">Cravings</span>
          <div className="mt-1 flex flex-wrap gap-1">
            {CRAVINGS_OPTIONS.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => onCravingsChange(cravingsLevel === option ? null : option)}
                className={cn(
                  'rounded px-2 py-1 text-[0.6875rem] border transition-colors',
                  cravingsLevel === option
                    ? 'bg-primary text-primary-foreground border-transparent'
                    : 'border-border/60 text-muted-foreground hover:border-border'
                )}
              >
                {option}
              </button>
            ))}
          </div>
        </div>

        {/* Energy/Motivation */}
        <div className="flex-1">
          <span className="text-[0.6875rem] text-muted-foreground">Energy</span>
          <div className="mt-1 flex gap-1">
            {ENERGY_OPTIONS.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => onMotivationChange(motivationLevel === option ? null : option)}
                className={cn(
                  'rounded px-2 py-1 text-[0.6875rem] border transition-colors',
                  motivationLevel === option
                    ? 'bg-primary text-primary-foreground border-transparent'
                    : 'border-border/60 text-muted-foreground hover:border-border'
                )}
              >
                {option}
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
