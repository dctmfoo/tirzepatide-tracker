'use client';

import { useState } from 'react';
import { AlertCircle, Plus } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';
import type { SideEffectSlider } from './useCheckinForm';

type SideEffectsSectionProps = {
  sideEffects: SideEffectSlider[];
  onSideEffectChange: (effectType: string, severity: number) => void;
  onAddCustom: (effectType: string) => void;
};

export function SideEffectsSection({
  sideEffects,
  onSideEffectChange,
  onAddCustom,
}: SideEffectsSectionProps) {
  const [customInput, setCustomInput] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);

  const handleAddCustom = () => {
    if (customInput.trim()) {
      onAddCustom(customInput.trim());
      setCustomInput('');
      setShowCustomInput(false);
    }
  };

  return (
    <section className="rounded-[1.25rem] bg-card p-4 shadow-sm">
      {/* Header */}
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-500/15">
          <AlertCircle className="h-4 w-4 text-rose-500" />
        </div>
        <h3 className="font-semibold text-foreground">Side Effects</h3>
        <span className="ml-auto text-[0.75rem] text-muted-foreground">0-5 scale</span>
      </div>

      {/* Sliders */}
      <div className="space-y-4">
        {sideEffects.map((effect) => (
          <div key={effect.effectType} className="flex items-center gap-3">
            <span className="w-24 text-[0.8125rem] text-foreground">{effect.effectType}</span>
            <Slider
              value={[effect.severity]}
              onValueChange={([value]) => onSideEffectChange(effect.effectType, value)}
              max={5}
              step={1}
              className="flex-1"
            />
            <span
              className={cn(
                'w-6 text-right font-display font-bold',
                effect.severity === 0 ? 'text-muted-foreground' : 'text-foreground'
              )}
            >
              {effect.severity}
            </span>
          </div>
        ))}
      </div>

      {/* Add Custom */}
      {showCustomInput ? (
        <div className="mt-4 flex gap-2">
          <input
            type="text"
            value={customInput}
            onChange={(e) => setCustomInput(e.target.value)}
            placeholder="Side effect name..."
            className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            onKeyDown={(e) => e.key === 'Enter' && handleAddCustom()}
            autoFocus
          />
          <button
            type="button"
            onClick={handleAddCustom}
            disabled={!customInput.trim()}
            className="rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
          >
            Add
          </button>
          <button
            type="button"
            onClick={() => {
              setShowCustomInput(false);
              setCustomInput('');
            }}
            className="rounded-lg border border-border px-3 py-2 text-sm text-muted-foreground"
          >
            Cancel
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setShowCustomInput(true)}
          className="mt-3 flex items-center gap-1 text-[0.75rem] font-medium text-primary"
        >
          <Plus className="h-3.5 w-3.5" />
          Add custom side effect
        </button>
      )}
    </section>
  );
}
