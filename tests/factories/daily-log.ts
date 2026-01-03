import { faker } from '@faker-js/faker';
import { DEFAULT_TEST_USER_ID } from './user';

// Severity and level constants matching schema
// Severity is now 0-5 integer scale: 0=None, 1-2=Mild, 3-4=Moderate, 5=Severe
export const SEVERITY_LEVELS = [0, 1, 2, 3, 4, 5] as const;
export const MOTIVATION_LEVELS = ['Low', 'Medium', 'High'] as const;
export const CRAVINGS_LEVELS = ['None', 'Low', 'Medium', 'High', 'Intense'] as const;
export const MOOD_LEVELS = ['Poor', 'Fair', 'Good', 'Great', 'Excellent'] as const;
export const HUNGER_LEVELS = ['None', 'Low', 'Moderate', 'High', 'Intense'] as const;
export const WORKOUT_TYPES = [
  'Strength training',
  'Cardio',
  'Walking',
  'Rest day',
  'Other',
] as const;

// Side effect types commonly tracked with Mounjaro
export const SIDE_EFFECT_TYPES = [
  'Nausea',
  'Vomiting',
  'Diarrhea',
  'Constipation',
  'Fatigue',
  'Headache',
  'Dizziness',
  'Injection site reaction',
  'Decreased appetite',
  'Abdominal pain',
] as const;

// Types matching schema
export type DailyLog = {
  id: string;
  userId: string;
  logDate: string;
  createdAt: Date;
  updatedAt: Date;
};

export type SideEffect = {
  id: string;
  dailyLogId: string;
  effectType: string;
  severity: number; // 0-5 scale
  notes: string | null;
  createdAt: Date;
};

export type ActivityLog = {
  id: string;
  dailyLogId: string;
  workoutType: string | null;
  durationMinutes: number | null;
  steps: number | null;
  notes: string | null;
  createdAt: Date;
};

export type MentalLog = {
  id: string;
  dailyLogId: string;
  motivationLevel: string | null;
  cravingsLevel: string | null;
  moodLevel: string | null;
  notes: string | null;
  createdAt: Date;
};

export type DietLog = {
  id: string;
  dailyLogId: string;
  hungerLevel: string | null;
  mealsCount: number | null;
  proteinGrams: number | null;
  waterLiters: string | null;
  notes: string | null;
  createdAt: Date;
};

// Create a daily log
export const createDailyLog = (overrides: Partial<DailyLog> = {}): DailyLog => ({
  id: faker.string.uuid(),
  userId: DEFAULT_TEST_USER_ID,
  logDate: faker.date.recent({ days: 7 }).toISOString().split('T')[0],
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

// Create a side effect entry
export const createSideEffect = (overrides: Partial<SideEffect> = {}): SideEffect => ({
  id: faker.string.uuid(),
  dailyLogId: faker.string.uuid(),
  effectType: faker.helpers.arrayElement(SIDE_EFFECT_TYPES),
  severity: faker.helpers.arrayElement(SEVERITY_LEVELS),
  notes: faker.helpers.maybe(() => faker.lorem.sentence()) ?? null,
  createdAt: new Date(),
  ...overrides,
});

// Create multiple side effects for a daily log
export const createSideEffects = (
  dailyLogId: string,
  count: number = 2
): SideEffect[] =>
  Array.from({ length: count }, () =>
    createSideEffect({
      dailyLogId,
      effectType: faker.helpers.arrayElement(SIDE_EFFECT_TYPES),
    })
  );

// Create an activity log
export const createActivityLog = (overrides: Partial<ActivityLog> = {}): ActivityLog => ({
  id: faker.string.uuid(),
  dailyLogId: faker.string.uuid(),
  workoutType: faker.helpers.arrayElement(WORKOUT_TYPES),
  durationMinutes: faker.number.int({ min: 15, max: 120 }),
  steps: faker.number.int({ min: 2000, max: 15000 }),
  notes: faker.helpers.maybe(() => faker.lorem.sentence()) ?? null,
  createdAt: new Date(),
  ...overrides,
});

// Create a mental log
export const createMentalLog = (overrides: Partial<MentalLog> = {}): MentalLog => ({
  id: faker.string.uuid(),
  dailyLogId: faker.string.uuid(),
  motivationLevel: faker.helpers.arrayElement(MOTIVATION_LEVELS),
  cravingsLevel: faker.helpers.arrayElement(CRAVINGS_LEVELS),
  moodLevel: faker.helpers.arrayElement(MOOD_LEVELS),
  notes: faker.helpers.maybe(() => faker.lorem.sentence()) ?? null,
  createdAt: new Date(),
  ...overrides,
});

// Create a diet log
export const createDietLog = (overrides: Partial<DietLog> = {}): DietLog => ({
  id: faker.string.uuid(),
  dailyLogId: faker.string.uuid(),
  hungerLevel: faker.helpers.arrayElement(HUNGER_LEVELS),
  mealsCount: faker.number.int({ min: 1, max: 5 }),
  proteinGrams: faker.number.int({ min: 50, max: 200 }),
  waterLiters: faker.number.float({ min: 1, max: 4, fractionDigits: 2 }).toString(),
  notes: faker.helpers.maybe(() => faker.lorem.sentence()) ?? null,
  createdAt: new Date(),
  ...overrides,
});

// Create a complete daily log with all sub-logs
export const createCompleteDailyLog = (
  overrides: {
    dailyLog?: Partial<DailyLog>;
    sideEffects?: Partial<SideEffect>[];
    activity?: Partial<ActivityLog>;
    mental?: Partial<MentalLog>;
    diet?: Partial<DietLog>;
  } = {}
) => {
  const dailyLog = createDailyLog(overrides.dailyLog);

  const sideEffects =
    overrides.sideEffects?.map((se) => createSideEffect({ dailyLogId: dailyLog.id, ...se })) ||
    createSideEffects(dailyLog.id, faker.number.int({ min: 0, max: 3 }));

  const activity = createActivityLog({ dailyLogId: dailyLog.id, ...overrides.activity });
  const mental = createMentalLog({ dailyLogId: dailyLog.id, ...overrides.mental });
  const diet = createDietLog({ dailyLogId: dailyLog.id, ...overrides.diet });

  return { dailyLog, sideEffects, activity, mental, diet };
};

// Create daily logs for a week
export const createWeekOfDailyLogs = (startDate: Date = new Date()): DailyLog[] => {
  return Array.from({ length: 7 }, (_, i) => {
    const date = new Date(startDate);
    date.setDate(date.getDate() - (6 - i));
    return createDailyLog({
      logDate: date.toISOString().split('T')[0],
    });
  });
};

// Create a daily log for today
export const createTodayDailyLog = (overrides: Partial<DailyLog> = {}): DailyLog =>
  createDailyLog({
    logDate: new Date().toISOString().split('T')[0],
    ...overrides,
  });

// Week summary stats helper
export const calculateWeekSummary = (
  activities: ActivityLog[],
  mentals: MentalLog[],
  diets: DietLog[]
) => {
  const avgSteps =
    activities.filter((a) => a.steps).reduce((sum, a) => sum + (a.steps || 0), 0) /
    (activities.filter((a) => a.steps).length || 1);

  const avgProtein =
    diets.filter((d) => d.proteinGrams).reduce((sum, d) => sum + (d.proteinGrams || 0), 0) /
    (diets.filter((d) => d.proteinGrams).length || 1);

  const avgWater =
    diets.filter((d) => d.waterLiters).reduce((sum, d) => sum + parseFloat(d.waterLiters || '0'), 0) /
    (diets.filter((d) => d.waterLiters).length || 1);

  return {
    avgSteps: Math.round(avgSteps),
    avgProtein: Math.round(avgProtein),
    avgWater: Number(avgWater.toFixed(2)),
    workoutDays: activities.filter((a) => a.workoutType && a.workoutType !== 'Rest day').length,
  };
};
