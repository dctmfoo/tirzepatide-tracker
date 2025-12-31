/**
 * Injection scheduling and site rotation logic
 */

import { addDays, daysBetween } from './dates';

// Mounjaro dose levels in mg
export const DOSES = [2.5, 5.0, 7.5, 10.0, 12.5, 15.0] as const;
export type DoseLevel = (typeof DOSES)[number];

// Standard injection sites for rotation
export const INJECTION_SITES = [
  'Abdomen - Left',
  'Abdomen - Right',
  'Thigh - Left',
  'Thigh - Right',
  'Upper Arm - Left',
  'Upper Arm - Right',
] as const;
export type InjectionSite = (typeof INJECTION_SITES)[number];

// Injection status types
export type InjectionStatus = 'upcoming' | 'reminder' | 'due_today' | 'overdue' | 'alert';

/**
 * Calculate the next injection due date
 * Base interval is 7 days, but can adjust to preferred day within ±2 day window
 */
export function getNextInjectionDue(
  lastInjectionDate: Date,
  preferredDayOfWeek?: number // 0-6, Sunday-Saturday
): Date {
  const baseDue = addDays(lastInjectionDate, 7);

  if (preferredDayOfWeek === undefined || preferredDayOfWeek === null) {
    return baseDue;
  }

  const baseDayOfWeek = baseDue.getDay();
  const diff = preferredDayOfWeek - baseDayOfWeek;

  // Check if preferred day is within ±2 day window
  if (Math.abs(diff) <= 2) {
    return addDays(baseDue, diff);
  }

  // Try wrapping around the week
  if (diff > 2) {
    const altDiff = diff - 7;
    if (Math.abs(altDiff) <= 2) {
      return addDays(baseDue, altDiff);
    }
  } else if (diff < -2) {
    const altDiff = diff + 7;
    if (Math.abs(altDiff) <= 2) {
      return addDays(baseDue, altDiff);
    }
  }

  // Preferred day is too far, return base due date
  return baseDue;
}

/**
 * Get injection status based on days since last injection
 * - Days 1-5: upcoming (green/normal)
 * - Day 6: reminder (yellow/warning)
 * - Day 7: due_today (orange/action needed)
 * - Day 8: overdue (red/urgent)
 * - Day 9+: alert (red/critical)
 */
export function getInjectionStatus(lastInjectionDate: Date, today: Date = new Date()): InjectionStatus {
  const daysSince = daysBetween(lastInjectionDate, today);

  if (daysSince <= 5) return 'upcoming';
  if (daysSince === 6) return 'reminder';
  if (daysSince === 7) return 'due_today';
  if (daysSince === 8) return 'overdue';
  return 'alert';
}

/**
 * Get suggested next injection site (rotation pattern)
 */
export function getSuggestedSite(lastSite: string): InjectionSite {
  const currentIndex = INJECTION_SITES.indexOf(lastSite as InjectionSite);
  if (currentIndex === -1) {
    return INJECTION_SITES[0];
  }
  const nextIndex = (currentIndex + 1) % INJECTION_SITES.length;
  return INJECTION_SITES[nextIndex];
}

/**
 * Get all injection sites as options
 */
export function getInjectionSiteOptions(): { value: string; label: string }[] {
  return INJECTION_SITES.map((site) => ({
    value: site,
    label: site,
  }));
}

/**
 * Get dose options for forms
 */
export function getDoseOptions(): { value: number; label: string }[] {
  return DOSES.map((dose) => ({
    value: dose,
    label: `${dose} mg`,
  }));
}

/**
 * Get the next dose in the titration schedule
 * Mounjaro titration: start at 2.5mg, increase every 4 weeks
 */
export function getNextTitrationDose(currentDose: number): DoseLevel | null {
  const currentIndex = DOSES.indexOf(currentDose as DoseLevel);
  if (currentIndex === -1 || currentIndex >= DOSES.length - 1) {
    return null; // Already at max or invalid dose
  }
  return DOSES[currentIndex + 1];
}

/**
 * Check if dose increase is recommended based on treatment duration
 * Returns true if patient has been on current dose for 4+ weeks
 */
export function isDoseIncreaseRecommended(
  currentDose: number,
  weeksOnCurrentDose: number
): boolean {
  // Can't increase if already at max
  if (currentDose >= 15) return false;

  // Standard titration is every 4 weeks
  return weeksOnCurrentDose >= 4;
}

/**
 * Calculate weeks on current dose
 */
export function calculateWeeksOnCurrentDose(
  injections: { doseMg: number | string; injectionDate: Date }[]
): number {
  if (injections.length === 0) return 0;

  // Sort by date descending
  const sorted = [...injections].sort(
    (a, b) => new Date(b.injectionDate).getTime() - new Date(a.injectionDate).getTime()
  );

  const currentDose = Number(sorted[0].doseMg);
  let firstAtCurrentDose = sorted[0].injectionDate;

  // Find when this dose started
  for (const inj of sorted) {
    if (Number(inj.doseMg) === currentDose) {
      firstAtCurrentDose = inj.injectionDate;
    } else {
      break;
    }
  }

  const days = daysBetween(new Date(firstAtCurrentDose), new Date());
  return Math.floor(days / 7);
}

/**
 * Format dose for display
 */
export function formatDose(doseMg: number | string): string {
  const dose = typeof doseMg === 'string' ? parseFloat(doseMg) : doseMg;
  return `${dose.toFixed(1)} mg`;
}

/**
 * Get status color for injection status
 */
export function getInjectionStatusColor(status: InjectionStatus): string {
  switch (status) {
    case 'upcoming':
      return 'text-success';
    case 'reminder':
      return 'text-warning';
    case 'due_today':
      return 'text-accent-primary';
    case 'overdue':
      return 'text-error';
    case 'alert':
      return 'text-error';
    default:
      return 'text-foreground';
  }
}

/**
 * Get status message for injection status
 */
export function getInjectionStatusMessage(status: InjectionStatus, dueDate: Date): string {
  switch (status) {
    case 'upcoming':
      return `Next injection due ${dueDate.toLocaleDateString()}`;
    case 'reminder':
      return 'Injection due tomorrow';
    case 'due_today':
      return 'Injection due today';
    case 'overdue':
      return 'Injection overdue by 1 day';
    case 'alert':
      const days = daysBetween(dueDate, new Date());
      return `Injection overdue by ${days} days`;
    default:
      return '';
  }
}
