/**
 * Weight and height unit conversion utilities
 * All internal storage uses metric (kg, cm)
 */

// Conversion constants
const KG_TO_LBS = 2.20462;
const KG_TO_STONE = 0.157473;
const CM_TO_INCH = 0.393701;
const INCHES_PER_FOOT = 12;

// Weight conversions
export function kgToLbs(kg: number): number {
  return kg * KG_TO_LBS;
}

export function lbsToKg(lbs: number): number {
  return lbs / KG_TO_LBS;
}

export function kgToStone(kg: number): number {
  return kg * KG_TO_STONE;
}

export function stoneToKg(stone: number): number {
  return stone / KG_TO_STONE;
}

// Stone and pounds combined (e.g., "14st 7lb")
export function kgToStoneLbs(kg: number): { stone: number; lbs: number } {
  const totalLbs = kgToLbs(kg);
  const stone = Math.floor(totalLbs / 14);
  const lbs = totalLbs % 14;
  return { stone, lbs: Number(lbs.toFixed(1)) };
}

export function stoneLbsToKg(stone: number, lbs: number): number {
  const totalLbs = stone * 14 + lbs;
  return lbsToKg(totalLbs);
}

// Height conversions
export function cmToFeetInches(cm: number): { feet: number; inches: number } {
  const totalInches = cm * CM_TO_INCH;
  const feet = Math.floor(totalInches / INCHES_PER_FOOT);
  const inches = Math.round(totalInches % INCHES_PER_FOOT);
  return { feet, inches };
}

export function feetInchesToCm(feet: number, inches: number = 0): number {
  const totalInches = feet * INCHES_PER_FOOT + inches;
  return totalInches / CM_TO_INCH;
}

// Format weight for display in all units
export function formatWeight(
  kg: number,
  primaryUnit: 'kg' | 'lbs' | 'stone' = 'kg'
): string {
  const lbs = kgToLbs(kg);
  const { stone, lbs: remainingLbs } = kgToStoneLbs(kg);

  switch (primaryUnit) {
    case 'lbs':
      return `${lbs.toFixed(1)} lbs (${kg.toFixed(1)} kg)`;
    case 'stone':
      return `${stone}st ${remainingLbs.toFixed(0)}lb (${kg.toFixed(1)} kg)`;
    case 'kg':
    default:
      return `${kg.toFixed(1)} kg (${lbs.toFixed(1)} lbs)`;
  }
}

// Format height for display
export function formatHeight(
  cm: number,
  primaryUnit: 'cm' | 'ft-in' = 'cm'
): string {
  const { feet, inches } = cmToFeetInches(cm);

  switch (primaryUnit) {
    case 'ft-in':
      return `${feet}'${inches}" (${cm.toFixed(0)} cm)`;
    case 'cm':
    default:
      return `${cm.toFixed(0)} cm (${feet}'${inches}")`;
  }
}

// Convert weight based on unit preference
export function convertWeight(
  value: number,
  fromUnit: 'kg' | 'lbs' | 'stone',
  toUnit: 'kg' | 'lbs' | 'stone'
): number {
  if (fromUnit === toUnit) return value;

  // Convert to kg first
  let kg: number;
  switch (fromUnit) {
    case 'lbs':
      kg = lbsToKg(value);
      break;
    case 'stone':
      kg = stoneToKg(value);
      break;
    case 'kg':
    default:
      kg = value;
  }

  // Convert from kg to target unit
  switch (toUnit) {
    case 'lbs':
      return kgToLbs(kg);
    case 'stone':
      return kgToStone(kg);
    case 'kg':
    default:
      return kg;
  }
}
