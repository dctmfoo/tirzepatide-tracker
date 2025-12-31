import { faker } from '@faker-js/faker';
import { DEFAULT_TEST_USER_ID } from './user';

// Mounjaro dose levels
export const DOSES = [2.5, 5.0, 7.5, 10.0, 12.5, 15.0] as const;
export type DoseLevel = (typeof DOSES)[number];

// Injection sites matching spec
export const INJECTION_SITES = [
  'Abdomen - Left',
  'Abdomen - Right',
  'Thigh - Left',
  'Thigh - Right',
  'Upper Arm - Left',
  'Upper Arm - Right',
] as const;
export type InjectionSite = (typeof INJECTION_SITES)[number];

// Injection type matching schema
export type Injection = {
  id: string;
  userId: string;
  doseMg: string;
  injectionSite: string;
  injectionDate: Date;
  batchNumber: string | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
};

// Create a single injection
export const createInjection = (overrides: Partial<Injection> = {}): Injection => ({
  id: faker.string.uuid(),
  userId: DEFAULT_TEST_USER_ID,
  doseMg: faker.helpers.arrayElement(DOSES).toFixed(2),
  injectionSite: faker.helpers.arrayElement(INJECTION_SITES),
  injectionDate: faker.date.recent({ days: 7 }),
  batchNumber: faker.helpers.maybe(() => faker.string.alphanumeric(10).toUpperCase()) ?? null,
  notes: faker.helpers.maybe(() => faker.lorem.sentence()) ?? null,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

// Create multiple injections
export const createInjections = (
  count: number,
  overrides: Partial<Injection> = {}
): Injection[] =>
  Array.from({ length: count }, () => createInjection(overrides));

// Create a series of weekly injections with dose escalation
// Mounjaro titration: Start at 2.5mg, increase every 4 weeks
export const createInjectionSeries = (weeks: number): Injection[] => {
  const now = new Date();
  let currentDoseIndex = 0;

  return Array.from({ length: weeks }, (_, weekIndex) => {
    const weeksAgo = weeks - 1 - weekIndex;

    // Increase dose every 4 weeks (after 4 weeks at each dose)
    if (weekIndex > 0 && weekIndex % 4 === 0 && currentDoseIndex < DOSES.length - 1) {
      currentDoseIndex++;
    }

    // Rotate through injection sites
    const siteIndex = weekIndex % INJECTION_SITES.length;

    return createInjection({
      doseMg: DOSES[currentDoseIndex].toFixed(2),
      injectionSite: INJECTION_SITES[siteIndex],
      injectionDate: new Date(now.getTime() - weeksAgo * 7 * 24 * 60 * 60 * 1000),
    });
  });
};

// Create the latest injection (most recent)
export const createLatestInjection = (overrides: Partial<Injection> = {}): Injection =>
  createInjection({
    injectionDate: new Date(),
    ...overrides,
  });

// Create an injection due today (7 days after last)
export const createOverdueInjection = (daysOverdue: number = 1): Injection =>
  createInjection({
    injectionDate: new Date(Date.now() - (7 + daysOverdue) * 24 * 60 * 60 * 1000),
  });

// Helper to get next suggested injection site
export const getNextSuggestedSite = (lastSite: InjectionSite): InjectionSite => {
  const currentIndex = INJECTION_SITES.indexOf(lastSite);
  const nextIndex = (currentIndex + 1) % INJECTION_SITES.length;
  return INJECTION_SITES[nextIndex];
};

// Helper to calculate next injection due date
export const calculateNextDueDate = (
  lastInjectionDate: Date,
  preferredDay?: number
): Date => {
  const baseDue = new Date(lastInjectionDate);
  baseDue.setDate(baseDue.getDate() + 7);

  if (preferredDay === undefined || preferredDay === null) {
    return baseDue;
  }

  // Adjust to preferred day within ±2 day window
  const baseDayOfWeek = baseDue.getDay();
  const diff = preferredDay - baseDayOfWeek;

  if (Math.abs(diff) <= 2) {
    baseDue.setDate(baseDue.getDate() + diff);
  } else if (diff > 2) {
    // Preferred day is later in week, check if -7+diff is within window
    const altDiff = diff - 7;
    if (Math.abs(altDiff) <= 2) {
      baseDue.setDate(baseDue.getDate() + altDiff);
    }
  } else {
    // Preferred day is earlier in week, check if 7+diff is within window
    const altDiff = diff + 7;
    if (Math.abs(altDiff) <= 2) {
      baseDue.setDate(baseDue.getDate() + altDiff);
    }
  }

  return baseDue;
};

// Injection statistics helper
export const calculateInjectionStats = (injections: Injection[]) => {
  if (injections.length === 0) {
    return { totalInjections: 0, currentDose: null, daysOnTreatment: 0 };
  }

  const sorted = [...injections].sort(
    (a, b) => a.injectionDate.getTime() - b.injectionDate.getTime()
  );

  const first = sorted[0];
  const last = sorted[sorted.length - 1];
  const daysOnTreatment = Math.ceil(
    (last.injectionDate.getTime() - first.injectionDate.getTime()) / (24 * 60 * 60 * 1000)
  );

  return {
    totalInjections: injections.length,
    currentDose: parseFloat(last.doseMg),
    daysOnTreatment,
    weeksOnTreatment: Math.ceil(daysOnTreatment / 7),
  };
};
