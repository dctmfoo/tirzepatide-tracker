/**
 * BMI and weight statistics calculations
 */

// BMI Categories (WHO classification)
export type BMICategory =
  | 'Underweight'
  | 'Normal'
  | 'Overweight'
  | 'Obese Class I'
  | 'Obese Class II'
  | 'Obese Class III';

/**
 * Calculate BMI from weight (kg) and height (cm)
 * Formula: BMI = weight(kg) / height(m)^2
 */
export function calculateBMI(weightKg: number, heightCm: number): number {
  if (heightCm <= 0) {
    throw new Error('Height must be greater than 0');
  }
  if (weightKg < 0) {
    throw new Error('Weight cannot be negative');
  }
  if (weightKg === 0) return 0;

  const heightM = heightCm / 100;
  return weightKg / (heightM * heightM);
}

/**
 * Get BMI category based on WHO classification
 */
export function getBMICategory(bmi: number): BMICategory {
  if (bmi < 18.5) return 'Underweight';
  if (bmi < 25) return 'Normal';
  if (bmi < 30) return 'Overweight';
  if (bmi < 35) return 'Obese Class I';
  if (bmi < 40) return 'Obese Class II';
  return 'Obese Class III';
}

/**
 * Calculate total weight change
 */
export function calculateTotalChange(startWeight: number, currentWeight: number): number {
  return currentWeight - startWeight;
}

/**
 * Calculate percentage change in weight
 */
export function calculatePercentChange(startWeight: number, currentWeight: number): number {
  if (startWeight <= 0) {
    throw new Error('Starting weight must be greater than 0');
  }
  return ((currentWeight - startWeight) / startWeight) * 100;
}

/**
 * Calculate weekly average weight loss/gain
 */
export function calculateWeeklyAverage(totalChange: number, weeks: number): number {
  if (weeks <= 0) return 0;
  return totalChange / weeks;
}

/**
 * Calculate treatment week (1-indexed)
 */
export function calculateTreatmentWeek(startDate: Date, currentDate: Date = new Date()): number {
  const diffTime = currentDate.getTime() - startDate.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return Math.floor(diffDays / 7) + 1;
}

/**
 * Calculate treatment day (1-indexed)
 */
export function calculateTreatmentDay(startDate: Date, currentDate: Date = new Date()): number {
  const diffTime = currentDate.getTime() - startDate.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return diffDays + 1;
}

/**
 * Calculate weight to goal
 */
export function calculateToGoal(currentWeight: number, goalWeight: number): number {
  return currentWeight - goalWeight;
}

/**
 * Calculate progress percentage towards goal
 */
export function calculateGoalProgress(
  startWeight: number,
  currentWeight: number,
  goalWeight: number
): number {
  const totalToLose = startWeight - goalWeight;
  if (totalToLose <= 0) return 100; // Already at or below goal

  const lost = startWeight - currentWeight;
  const progress = (lost / totalToLose) * 100;

  // Clamp between 0 and 100
  return Math.max(0, Math.min(100, progress));
}

/**
 * Calculate statistics from weight entries
 */
export function calculateWeightStats(weights: number[]): {
  min: number | null;
  max: number | null;
  avg: number | null;
  first: number | null;
  last: number | null;
  change: number | null;
} {
  if (weights.length === 0) {
    return { min: null, max: null, avg: null, first: null, last: null, change: null };
  }

  const min = Math.min(...weights);
  const max = Math.max(...weights);
  const avg = weights.reduce((a, b) => a + b, 0) / weights.length;
  const first = weights[0];
  const last = weights[weights.length - 1];
  const change = last - first;

  return {
    min: Number(min.toFixed(2)),
    max: Number(max.toFixed(2)),
    avg: Number(avg.toFixed(2)),
    first: Number(first.toFixed(2)),
    last: Number(last.toFixed(2)),
    change: Number(change.toFixed(2)),
  };
}
