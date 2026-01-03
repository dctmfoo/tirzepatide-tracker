'use client';

import { Minus, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

type StepperProps = {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  label: string;
  formatValue?: (value: number) => string;
  className?: string;
};

export function Stepper({
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  unit,
  label,
  formatValue,
  className,
}: StepperProps) {
  const handleDecrement = () => {
    const newValue = Math.max(min, value - step);
    onChange(newValue);
  };

  const handleIncrement = () => {
    const newValue = Math.min(max, value + step);
    onChange(newValue);
  };

  const displayValue = formatValue ? formatValue(value) : String(value);

  return (
    <div
      className={cn(
        'rounded-xl bg-secondary/50 border border-border/40 p-3 text-center',
        className
      )}
    >
      <p className="text-[0.6875rem] text-muted-foreground mb-1">{label}</p>
      <div className="flex items-center justify-center gap-2">
        <button
          type="button"
          onClick={handleDecrement}
          disabled={value <= min}
          className="flex h-7 w-7 items-center justify-center rounded-full bg-muted text-muted-foreground transition-colors hover:bg-muted/80 disabled:opacity-50"
          aria-label={`Decrease ${label}`}
        >
          <Minus className="h-3.5 w-3.5" />
        </button>
        <span className="font-display text-xl font-bold text-foreground min-w-[2rem]">
          {displayValue}
          {unit && (
            <span className="text-[0.6875rem] font-normal text-muted-foreground">
              {unit}
            </span>
          )}
        </span>
        <button
          type="button"
          onClick={handleIncrement}
          disabled={value >= max}
          className="flex h-7 w-7 items-center justify-center rounded-full bg-muted text-muted-foreground transition-colors hover:bg-muted/80 disabled:opacity-50"
          aria-label={`Increase ${label}`}
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
