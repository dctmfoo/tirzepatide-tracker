'use client';

const STEP_LABELS = ['Mood', 'Side Effects', 'Diet', 'Activity'];

type WizardProgressProps = {
  current: number;
  total: number;
  autoSaveStatus: 'idle' | 'saving' | 'saved' | 'error';
};

export function WizardProgress({ current, total, autoSaveStatus }: WizardProgressProps) {
  return (
    <div className="px-4 py-3 border-b border-border">
      {/* Progress dots */}
      <div className="flex items-center justify-center gap-2 mb-2">
        {Array.from({ length: total }).map((_, i) => (
          <div
            key={i}
            className={`h-2 w-2 rounded-full transition-colors ${
              i <= current ? 'bg-primary' : 'bg-muted'
            }`}
          />
        ))}
      </div>

      {/* Step label + auto-save status */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-foreground font-medium">
          {STEP_LABELS[current]}
        </span>
        <span className="text-muted-foreground">
          {autoSaveStatus === 'saving' && (
            <span className="animate-pulse">Saving...</span>
          )}
          {autoSaveStatus === 'saved' && (
            <span className="text-success">Saved</span>
          )}
          {autoSaveStatus === 'error' && (
            <span className="text-destructive">Save failed</span>
          )}
          {autoSaveStatus === 'idle' && `Step ${current + 1} of ${total}`}
        </span>
      </div>
    </div>
  );
}
