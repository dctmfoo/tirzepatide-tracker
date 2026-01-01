'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import type { StepData } from '../useLogWizard';
import type { SideEffectData } from '@/lib/data/daily-log';

const SIDE_EFFECTS = [
  'Nausea',
  'Fatigue',
  'Diarrhea',
  'Constipation',
  'Headache',
  'Dizziness',
  'Injection site reaction',
  'Loss of appetite',
  'Acid reflux',
  'Other',
] as const;

const SEVERITY_LEVELS = ['None', 'Mild', 'Moderate', 'Severe'] as const;

const SEVERITY_STYLES: Record<string, string> = {
  None: 'data-[state=on]:bg-primary data-[state=on]:text-primary-foreground',
  Mild: 'data-[state=on]:bg-primary data-[state=on]:text-primary-foreground',
  Moderate: 'data-[state=on]:bg-warning data-[state=on]:text-warning-foreground',
  Severe: 'data-[state=on]:bg-destructive data-[state=on]:text-destructive-foreground',
};

type StepSideEffectsProps = {
  stepData: StepData;
  updateStepData: <K extends keyof StepData>(step: K, data: StepData[K]) => void;
};

export function StepSideEffects({ stepData, updateStepData }: StepSideEffectsProps) {
  const sideEffects = stepData.sideEffects;

  const addEffect = () => {
    updateStepData('sideEffects', [...sideEffects, { effectType: '', severity: 'Mild' }]);
  };

  const updateEffect = (index: number, field: keyof SideEffectData, value: string) => {
    const updated = [...sideEffects];
    updated[index] = { ...updated[index], [field]: value };
    updateStepData('sideEffects', updated);
  };

  const removeEffect = (index: number) => {
    updateStepData('sideEffects', sideEffects.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-semibold text-foreground mb-2">
          Any side effects?
        </h2>
        <p className="text-muted-foreground text-sm">
          Track how the medication affects you
        </p>
      </div>

      {sideEffects.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground mb-4">No side effects logged</p>
          <button
            type="button"
            onClick={addEffect}
            className="px-6 py-3 rounded-lg bg-primary text-primary-foreground font-medium transition-colors hover:bg-primary/90"
          >
            + Add Side Effect
          </button>
        </div>
      ) : (
        <>
          {sideEffects.map((effect, index) => (
            <div key={index} className="bg-card rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-medium text-foreground">Effect {index + 1}</span>
                <button
                  type="button"
                  onClick={() => removeEffect(index)}
                  className="text-destructive text-sm hover:text-destructive/80"
                >
                  Remove
                </button>
              </div>

              <Select
                value={effect.effectType}
                onValueChange={(v) => updateEffect(index, 'effectType', v)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select type..." />
                </SelectTrigger>
                <SelectContent>
                  {SIDE_EFFECTS.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <ToggleGroup
                type="single"
                value={effect.severity}
                onValueChange={(v) => v && updateEffect(index, 'severity', v)}
                className="flex gap-2"
              >
                {SEVERITY_LEVELS.map((severity) => (
                  <ToggleGroupItem
                    key={severity}
                    value={severity}
                    aria-label={`Severity: ${severity}`}
                    className={`flex-1 rounded-lg py-2 text-sm ${SEVERITY_STYLES[severity]}`}
                  >
                    {severity}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>

              <textarea
                value={effect.notes || ''}
                onChange={(e) => updateEffect(index, 'notes', e.target.value)}
                placeholder="Notes (optional)"
                rows={1}
                className="w-full rounded-lg bg-background border border-border px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
              />
            </div>
          ))}

          <button
            type="button"
            onClick={addEffect}
            className="w-full py-3 rounded-lg border-2 border-dashed border-border text-muted-foreground hover:border-primary hover:text-primary transition-colors"
          >
            + Add Another
          </button>
        </>
      )}
    </div>
  );
}
