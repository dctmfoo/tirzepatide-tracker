'use client';

import { useCallback } from 'react';
import {
  kgToLbs,
  lbsToKg,
  type WeightUnit,
  WEIGHT_UNITS,
} from '@/lib/validations/onboarding';

type WeightInputProps = {
  label: string;
  value: number | undefined;
  unit: WeightUnit;
  onChange: (valueKg: number | undefined) => void;
  onUnitChange: (unit: WeightUnit) => void;
  error?: string;
  placeholder?: string;
  id: string;
};

export function WeightInput({
  label,
  value,
  unit,
  onChange,
  onUnitChange,
  error,
  placeholder = '0.0',
  id,
}: WeightInputProps) {
  // Convert kg value to display value based on unit
  const displayValue = value !== undefined ? (unit === 'lbs' ? kgToLbs(value) : value) : '';

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value;
      if (inputValue === '') {
        onChange(undefined);
        return;
      }

      const numValue = parseFloat(inputValue);
      if (isNaN(numValue)) return;

      // Always store in kg
      const kgValue = unit === 'lbs' ? lbsToKg(numValue) : numValue;
      onChange(kgValue);
    },
    [onChange, unit]
  );

  const handleUnitChange = useCallback(
    (newUnit: WeightUnit) => {
      onUnitChange(newUnit);
    },
    [onUnitChange]
  );

  return (
    <div className="space-y-2">
      <label htmlFor={id} className="block text-sm font-medium text-muted-foreground">
        {label}
      </label>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <input
            id={id}
            type="number"
            inputMode="decimal"
            step="0.1"
            min="0"
            value={displayValue}
            onChange={handleInputChange}
            placeholder={placeholder}
            className={`w-full px-4 py-3 bg-background border rounded-lg text-foreground placeholder-foreground-muted/50 focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all pr-16 ${
              error ? 'border-destructive' : 'border-input'
            }`}
          />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
            {unit}
          </span>
        </div>

        {/* Unit toggle - segmented control */}
        <div className="flex bg-background border border-input rounded-lg overflow-hidden">
          {WEIGHT_UNITS.map((u) => (
            <button
              key={u}
              type="button"
              onClick={() => handleUnitChange(u)}
              className={`px-4 py-3 text-sm font-medium transition-colors min-w-[56px] ${
                unit === u
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-foreground/5'
              }`}
            >
              {u}
            </button>
          ))}
        </div>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
