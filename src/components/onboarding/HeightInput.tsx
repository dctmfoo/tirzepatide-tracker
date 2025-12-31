'use client';

import { useCallback, useMemo } from 'react';
import {
  cmToFeetInches,
  feetInchesToCm,
  type HeightUnit,
  HEIGHT_UNITS,
} from '@/lib/validations/onboarding';

type HeightInputProps = {
  label: string;
  value: number | undefined;
  unit: HeightUnit;
  onChange: (valueCm: number | undefined) => void;
  onUnitChange: (unit: HeightUnit) => void;
  error?: string;
  id: string;
};

export function HeightInput({
  label,
  value,
  unit,
  onChange,
  onUnitChange,
  error,
  id,
}: HeightInputProps) {
  // Convert cm value to display values based on unit
  const displayValues = useMemo(() => {
    if (value === undefined) {
      return { cm: '', feet: '', inches: '' };
    }
    if (unit === 'ft-in') {
      const { feet, inches } = cmToFeetInches(value);
      return { cm: '', feet: feet.toString(), inches: inches.toString() };
    }
    return { cm: value.toString(), feet: '', inches: '' };
  }, [value, unit]);

  const handleCmChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value;
      if (inputValue === '') {
        onChange(undefined);
        return;
      }
      const numValue = parseFloat(inputValue);
      if (isNaN(numValue)) return;
      onChange(numValue);
    },
    [onChange]
  );

  const handleFeetChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value;
      const feet = inputValue === '' ? 0 : parseInt(inputValue, 10);
      if (isNaN(feet)) return;

      const currentInches =
        value !== undefined ? cmToFeetInches(value).inches : 0;
      const newCm = feetInchesToCm(feet, currentInches);
      onChange(newCm);
    },
    [onChange, value]
  );

  const handleInchesChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value;
      const inches = inputValue === '' ? 0 : parseInt(inputValue, 10);
      if (isNaN(inches) || inches < 0 || inches > 11) return;

      const currentFeet = value !== undefined ? cmToFeetInches(value).feet : 0;
      const newCm = feetInchesToCm(currentFeet, inches);
      onChange(newCm);
    },
    [onChange, value]
  );

  const handleUnitChange = useCallback(
    (newUnit: HeightUnit) => {
      onUnitChange(newUnit);
    },
    [onUnitChange]
  );

  const inputClasses = `w-full px-4 py-3 bg-background border rounded-lg text-foreground placeholder-foreground-muted/50 focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all ${
    error ? 'border-destructive' : 'border-input'
  }`;

  return (
    <div className="space-y-2">
      <label htmlFor={id} className="block text-sm font-medium text-muted-foreground">
        {label}
      </label>
      <div className="flex gap-2">
        {unit === 'cm' ? (
          <div className="relative flex-1">
            <input
              id={id}
              type="number"
              inputMode="numeric"
              min="100"
              max="250"
              value={displayValues.cm}
              onChange={handleCmChange}
              placeholder="170"
              className={`${inputClasses} pr-12`}
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
              cm
            </span>
          </div>
        ) : (
          <div className="flex flex-1 gap-2">
            <div className="relative flex-1">
              <input
                id={id}
                type="number"
                inputMode="numeric"
                min="3"
                max="8"
                value={displayValues.feet}
                onChange={handleFeetChange}
                placeholder="5"
                className={`${inputClasses} pr-10`}
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                ft
              </span>
            </div>
            <div className="relative flex-1">
              <input
                id={`${id}-inches`}
                type="number"
                inputMode="numeric"
                min="0"
                max="11"
                value={displayValues.inches}
                onChange={handleInchesChange}
                placeholder="8"
                className={`${inputClasses} pr-10`}
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                in
              </span>
            </div>
          </div>
        )}

        {/* Unit toggle - segmented control */}
        <div className="flex bg-background border border-input rounded-lg overflow-hidden shrink-0">
          {HEIGHT_UNITS.map((u) => (
            <button
              key={u}
              type="button"
              onClick={() => handleUnitChange(u)}
              className={`px-3 py-3 text-sm font-medium transition-colors ${
                unit === u
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-foreground/5'
              }`}
            >
              {u === 'ft-in' ? 'ft' : u}
            </button>
          ))}
        </div>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
