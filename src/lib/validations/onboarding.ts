import { z } from 'zod';
import { INJECTION_SITES as INJECTION_SITES_FROM_LOGIC } from '@/lib/utils/injection-logic';

// Re-export for backward compatibility with components
export { INJECTION_SITES_FROM_LOGIC as INJECTION_SITES };
export type { InjectionSite } from '@/lib/utils/injection-logic';

// Valid dose values for Mounjaro
export const VALID_DOSES = [2.5, 5, 7.5, 10, 12.5, 15] as const;
export type DoseValue = (typeof VALID_DOSES)[number];

// Gender options
export const GENDERS = ['male', 'female', 'other'] as const;
export type Gender = (typeof GENDERS)[number];

export const GENDER_LABELS: Record<Gender, string> = {
  male: 'Male',
  female: 'Female',
  other: 'Other',
};

// Unit options
export const WEIGHT_UNITS = ['kg', 'lbs'] as const;
export type WeightUnit = (typeof WEIGHT_UNITS)[number];

export const HEIGHT_UNITS = ['cm', 'ft-in'] as const;
export type HeightUnit = (typeof HEIGHT_UNITS)[number];

// First injection schema
export const firstInjectionSchema = z.object({
  doseMg: z.number().refine((d) => VALID_DOSES.includes(d as DoseValue), {
    message: 'Please select a valid dose',
  }),
  injectionSite: z.enum(INJECTION_SITES_FROM_LOGIC, {
    message: 'Please select an injection site',
  }),
  injectionDate: z.string().min(1, 'Please select an injection date'),
});

// Complete onboarding form schema
export const onboardingSchema = z
  .object({
    // Profile - About You
    age: z
      .number({ message: 'Age is required' })
      .int('Age must be a whole number')
      .min(18, 'You must be at least 18 years old')
      .max(120, 'Please enter a valid age'),
    gender: z.enum(GENDERS, {
      message: 'Please select your gender',
    }),
    heightCm: z
      .number({ message: 'Height is required' })
      .min(100, 'Height must be at least 100cm')
      .max(250, 'Height must be less than 250cm'),
    heightUnit: z.enum(HEIGHT_UNITS).default('cm'),

    // Goals
    startingWeightKg: z
      .number({ message: 'Starting weight is required' })
      .min(20, 'Weight must be at least 20kg')
      .max(500, 'Weight must be less than 500kg'),
    goalWeightKg: z
      .number({ message: 'Goal weight is required' })
      .min(20, 'Goal weight must be at least 20kg')
      .max(500, 'Goal weight must be less than 500kg'),
    weightUnit: z.enum(WEIGHT_UNITS).default('kg'),
    treatmentStartDate: z
      .string({ message: 'Treatment start date is required' })
      .min(1, 'Please select a treatment start date'),

    // First Injection
    firstInjection: firstInjectionSchema,
  })
  .refine((data) => data.goalWeightKg < data.startingWeightKg, {
    message: 'Goal weight must be less than your starting weight',
    path: ['goalWeightKg'],
  });

export type OnboardingFormData = z.infer<typeof onboardingSchema>;
export type FirstInjectionData = z.infer<typeof firstInjectionSchema>;

// Unit conversion utilities
export function kgToLbs(kg: number): number {
  return kg * 2.20462;
}

export function lbsToKg(lbs: number): number {
  return lbs / 2.20462;
}

export function cmToFeetInches(cm: number): { feet: number; inches: number } {
  const totalInches = cm / 2.54;
  const feet = Math.floor(totalInches / 12);
  const inches = Math.round(totalInches % 12);
  return { feet, inches };
}

export function feetInchesToCm(feet: number, inches: number): number {
  return (feet * 12 + inches) * 2.54;
}

// Format weight for display
export function formatWeight(kg: number, unit: WeightUnit): string {
  if (unit === 'lbs') {
    return `${kgToLbs(kg).toFixed(1)} lbs`;
  }
  return `${kg.toFixed(1)} kg`;
}

// Format height for display
export function formatHeight(cm: number, unit: HeightUnit): string {
  if (unit === 'ft-in') {
    const { feet, inches } = cmToFeetInches(cm);
    return `${feet}'${inches}"`;
  }
  return `${cm.toFixed(0)} cm`;
}
