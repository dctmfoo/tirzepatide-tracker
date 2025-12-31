import { faker } from '@faker-js/faker';

// User factory types matching schema
export type User = {
  id: string;
  email: string;
  passwordHash: string;
  emailVerified: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type Profile = {
  id: string;
  userId: string;
  age: number;
  gender: string;
  heightCm: string;
  startingWeightKg: string;
  goalWeightKg: string;
  treatmentStartDate: string;
  preferredInjectionDay: number | null;
  reminderDaysBefore: number;
  createdAt: Date;
  updatedAt: Date;
};

export type UserPreference = {
  id: string;
  userId: string;
  weightUnit: string;
  heightUnit: string;
  dateFormat: string;
  weekStartsOn: number;
  theme: string;
  createdAt: Date;
  updatedAt: Date;
};

// Default user ID used in mock session
export const DEFAULT_TEST_USER_ID = 'test-user-id-123';

// Create a test user
export const createUser = (overrides: Partial<User> = {}): User => ({
  id: faker.string.uuid(),
  email: faker.internet.email().toLowerCase(),
  passwordHash: '$2a$10$mockhashedpassword123456789',
  emailVerified: faker.helpers.maybe(() => faker.date.past()) ?? null,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

// Create multiple users
export const createUsers = (count: number, overrides: Partial<User> = {}): User[] =>
  Array.from({ length: count }, () => createUser(overrides));

// Create a profile for a user
export const createProfile = (overrides: Partial<Profile> = {}): Profile => {
  const startWeight = faker.number.float({ min: 80, max: 150, fractionDigits: 2 });
  const goalWeight = faker.number.float({ min: 60, max: startWeight - 10, fractionDigits: 2 });

  return {
    id: faker.string.uuid(),
    userId: DEFAULT_TEST_USER_ID,
    age: faker.number.int({ min: 18, max: 70 }),
    gender: faker.helpers.arrayElement(['Male', 'Female', 'Other', 'Prefer not to say']),
    heightCm: faker.number.float({ min: 150, max: 200, fractionDigits: 2 }).toString(),
    startingWeightKg: startWeight.toString(),
    goalWeightKg: goalWeight.toString(),
    treatmentStartDate: faker.date.past({ years: 1 }).toISOString().split('T')[0],
    preferredInjectionDay: faker.helpers.maybe(() => faker.number.int({ min: 0, max: 6 })) ?? null,
    reminderDaysBefore: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
};

// Create user preferences
export const createPreferences = (overrides: Partial<UserPreference> = {}): UserPreference => ({
  id: faker.string.uuid(),
  userId: DEFAULT_TEST_USER_ID,
  weightUnit: faker.helpers.arrayElement(['kg', 'lbs', 'stone']),
  heightUnit: faker.helpers.arrayElement(['cm', 'ft-in']),
  dateFormat: faker.helpers.arrayElement(['DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD']),
  weekStartsOn: faker.helpers.arrayElement([0, 1]), // Sunday or Monday
  theme: 'dark',
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

// Create a complete user setup with profile and preferences
export const createCompleteUser = (overrides: {
  user?: Partial<User>;
  profile?: Partial<Profile>;
  preferences?: Partial<UserPreference>;
} = {}) => {
  const user = createUser(overrides.user);
  const profile = createProfile({ userId: user.id, ...overrides.profile });
  const preferences = createPreferences({ userId: user.id, ...overrides.preferences });

  return { user, profile, preferences };
};
