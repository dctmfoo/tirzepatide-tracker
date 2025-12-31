import { faker } from '@faker-js/faker';
import { DEFAULT_TEST_USER_ID } from './user';

// Weight entry type matching schema
export type WeightEntry = {
  id: string;
  userId: string;
  weightKg: string;
  recordedAt: Date;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
};

// Create a single weight entry
export const createWeightEntry = (overrides: Partial<WeightEntry> = {}): WeightEntry => ({
  id: faker.string.uuid(),
  userId: DEFAULT_TEST_USER_ID,
  weightKg: faker.number.float({ min: 50, max: 150, fractionDigits: 2 }).toString(),
  recordedAt: faker.date.recent({ days: 30 }),
  notes: faker.helpers.maybe(() => faker.lorem.sentence()) ?? null,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

// Create multiple weight entries
export const createWeightEntries = (
  count: number,
  overrides: Partial<WeightEntry> = {}
): WeightEntry[] =>
  Array.from({ length: count }, () => createWeightEntry(overrides));

// Create a realistic weight loss progression
export const createWeightProgression = (
  startWeight: number,
  entries: number,
  weeklyLoss: number = 0.5
): WeightEntry[] => {
  const now = new Date();
  return Array.from({ length: entries }, (_, i) => {
    const daysAgo = (entries - 1 - i) * 3; // Every 3 days
    const weightLoss = (daysAgo / 7) * weeklyLoss;
    const variation = faker.number.float({ min: -0.3, max: 0.3, fractionDigits: 2 });

    return createWeightEntry({
      weightKg: (startWeight - weightLoss + variation).toFixed(2),
      recordedAt: new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000),
    });
  });
};

// Create entries for a specific date range
export const createWeightEntriesInRange = (
  startDate: Date,
  endDate: Date,
  intervalDays: number = 1
): WeightEntry[] => {
  const entries: WeightEntry[] = [];
  const current = new Date(startDate);

  while (current <= endDate) {
    entries.push(
      createWeightEntry({
        recordedAt: new Date(current),
      })
    );
    current.setDate(current.getDate() + intervalDays);
  }

  return entries;
};

// Create a weight entry for today
export const createTodayWeightEntry = (overrides: Partial<WeightEntry> = {}): WeightEntry =>
  createWeightEntry({
    recordedAt: new Date(),
    ...overrides,
  });

// Weight statistics helper
export const calculateWeightStats = (entries: WeightEntry[]) => {
  if (entries.length === 0) {
    return { min: 0, max: 0, avg: 0, change: 0 };
  }

  const weights = entries.map((e) => parseFloat(e.weightKg));
  const sorted = [...entries].sort(
    (a, b) => a.recordedAt.getTime() - b.recordedAt.getTime()
  );

  const min = Math.min(...weights);
  const max = Math.max(...weights);
  const avg = weights.reduce((a, b) => a + b, 0) / weights.length;
  const first = parseFloat(sorted[0].weightKg);
  const last = parseFloat(sorted[sorted.length - 1].weightKg);
  const change = last - first;

  return { min, max, avg: Number(avg.toFixed(2)), change: Number(change.toFixed(2)) };
};
