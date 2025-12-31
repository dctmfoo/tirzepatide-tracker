import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GET } from '../route';

// Mock auth
const mockAuth = vi.fn();
vi.mock('@/lib/auth', () => ({
  auth: () => mockAuth(),
}));

// Mock database - using separate mock functions for each data type
const mockProfileFindFirst = vi.fn();
const mockPreferencesFindFirst = vi.fn();
const mockDailyLogsFindMany = vi.fn();

// Separate mock resolvers for weights and injections
let mockWeightData: unknown[] = [];
let mockInjectionData: unknown[] = [];

vi.mock('@/lib/db', () => ({
  db: {
    query: {
      profiles: {
        findFirst: (...args: unknown[]) => mockProfileFindFirst(...args),
      },
      userPreferences: {
        findFirst: (...args: unknown[]) => mockPreferencesFindFirst(...args),
      },
      dailyLogs: {
        findMany: (...args: unknown[]) => mockDailyLogsFindMany(...args),
      },
    },
    select: () => ({
      from: (table: { userId: string }) => ({
        where: () => ({
          orderBy: () => {
            // Return different data based on which table is being queried
            if (table.userId === 'weightUserId') {
              return Promise.resolve(mockWeightData);
            }
            if (table.userId === 'injectionUserId') {
              return Promise.resolve(mockInjectionData);
            }
            return Promise.resolve([]);
          },
        }),
      }),
    }),
  },
  schema: {
    profiles: { userId: 'userId' },
    userPreferences: { userId: 'userId' },
    weightEntries: { userId: 'weightUserId', recordedAt: 'recordedAt' },
    injections: { userId: 'injectionUserId', injectionDate: 'injectionDate' },
    dailyLogs: { userId: 'userId', logDate: 'logDate' },
  },
}));

vi.mock('drizzle-orm', () => ({
  eq: vi.fn((a, b) => ({ type: 'eq', field: a, value: b })),
  asc: vi.fn((a) => ({ type: 'asc', field: a })),
}));

describe('GET /api/export/json', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockProfileFindFirst.mockResolvedValue(null);
    mockPreferencesFindFirst.mockResolvedValue(null);
    mockDailyLogsFindMany.mockResolvedValue([]);
    mockWeightData = [];
    mockInjectionData = [];
  });

  describe('Authentication', () => {
    it('returns 401 when not authenticated', async () => {
      mockAuth.mockResolvedValue(null);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('returns 401 when session has no user id', async () => {
      mockAuth.mockResolvedValue({ user: {} });

      const response = await GET();

      expect(response.status).toBe(401);
    });
  });

  describe('Response Headers', () => {
    it('returns JSON export for authenticated user', async () => {
      mockAuth.mockResolvedValue({ user: { id: 'user-123', email: 'test@example.com' } });

      const response = await GET();

      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toBe('application/json');
    });

    it('sets correct Content-Disposition header', async () => {
      mockAuth.mockResolvedValue({ user: { id: 'user-123', email: 'test@example.com' } });

      const response = await GET();
      const disposition = response.headers.get('Content-Disposition');

      expect(disposition).toContain('attachment');
      expect(disposition).toContain('mounjaro-tracker-export');
      expect(disposition).toContain('.json');
    });

    it('formats response as pretty-printed JSON', async () => {
      mockAuth.mockResolvedValue({ user: { id: 'user-123', email: 'test@example.com' } });

      const response = await GET();
      const text = await response.text();

      // Pretty-printed JSON contains newlines
      expect(text).toContain('\n');
    });
  });

  describe('Export Metadata', () => {
    it('includes exportedAt timestamp in response', async () => {
      mockAuth.mockResolvedValue({ user: { id: 'user-123', email: 'test@example.com' } });

      const response = await GET();
      const data = await response.json();

      expect(data.exportedAt).toBeDefined();
      expect(new Date(data.exportedAt).getTime()).not.toBeNaN();
    });

    it('includes user email in response', async () => {
      mockAuth.mockResolvedValue({ user: { id: 'user-123', email: 'test@example.com' } });

      const response = await GET();
      const data = await response.json();

      expect(data.user.email).toBe('test@example.com');
    });
  });

  describe('Profile Data', () => {
    it('includes profile data when available', async () => {
      mockAuth.mockResolvedValue({ user: { id: 'user-123', email: 'test@example.com' } });
      mockProfileFindFirst.mockResolvedValue({
        age: 35,
        gender: 'male',
        heightCm: '175',
        startingWeightKg: '95.5',
        goalWeightKg: '75.0',
        treatmentStartDate: '2025-01-01',
        preferredInjectionDay: 3,
        reminderDaysBefore: 1,
      });

      const response = await GET();
      const data = await response.json();

      expect(data.profile).not.toBeNull();
      expect(data.profile.age).toBe(35);
      expect(data.profile.gender).toBe('male');
      expect(data.profile.heightCm).toBe(175);
      expect(data.profile.startingWeightKg).toBe(95.5);
      expect(data.profile.goalWeightKg).toBe(75);
      expect(data.profile.treatmentStartDate).toBe('2025-01-01');
      expect(data.profile.preferredInjectionDay).toBe(3);
      expect(data.profile.reminderDaysBefore).toBe(1);
    });

    it('returns null for profile when not set', async () => {
      mockAuth.mockResolvedValue({ user: { id: 'user-123', email: 'test@example.com' } });
      mockProfileFindFirst.mockResolvedValue(null);

      const response = await GET();
      const data = await response.json();

      expect(data.profile).toBeNull();
    });

    it('converts decimal strings to numbers', async () => {
      mockAuth.mockResolvedValue({ user: { id: 'user-123', email: 'test@example.com' } });
      mockProfileFindFirst.mockResolvedValue({
        age: 35,
        gender: 'male',
        heightCm: '175.5',
        startingWeightKg: '95.25',
        goalWeightKg: '75.00',
        treatmentStartDate: '2025-01-01',
        preferredInjectionDay: null,
        reminderDaysBefore: 1,
      });

      const response = await GET();
      const data = await response.json();

      expect(typeof data.profile.heightCm).toBe('number');
      expect(typeof data.profile.startingWeightKg).toBe('number');
      expect(typeof data.profile.goalWeightKg).toBe('number');
    });
  });

  describe('Preferences Data', () => {
    it('includes preferences data when available', async () => {
      mockAuth.mockResolvedValue({ user: { id: 'user-123', email: 'test@example.com' } });
      mockPreferencesFindFirst.mockResolvedValue({
        weightUnit: 'kg',
        heightUnit: 'cm',
        dateFormat: 'DD/MM/YYYY',
        weekStartsOn: 1,
        theme: 'dark',
      });

      const response = await GET();
      const data = await response.json();

      expect(data.preferences).not.toBeNull();
      expect(data.preferences.weightUnit).toBe('kg');
      expect(data.preferences.heightUnit).toBe('cm');
      expect(data.preferences.dateFormat).toBe('DD/MM/YYYY');
      expect(data.preferences.weekStartsOn).toBe(1);
      expect(data.preferences.theme).toBe('dark');
    });

    it('returns null for preferences when not set', async () => {
      mockAuth.mockResolvedValue({ user: { id: 'user-123', email: 'test@example.com' } });
      mockPreferencesFindFirst.mockResolvedValue(null);

      const response = await GET();
      const data = await response.json();

      expect(data.preferences).toBeNull();
    });
  });

  describe('Weight Entries', () => {
    it('includes empty arrays when no entries exist', async () => {
      mockAuth.mockResolvedValue({ user: { id: 'user-123', email: 'test@example.com' } });

      const response = await GET();
      const data = await response.json();

      expect(data.weightEntries).toEqual([]);
    });

    it('includes weight entries with correct structure', async () => {
      mockAuth.mockResolvedValue({ user: { id: 'user-123', email: 'test@example.com' } });
      mockWeightData = [
        {
          weightKg: '85.5',
          recordedAt: new Date('2025-01-15T08:00:00Z'),
          notes: 'Morning weigh-in',
        },
        {
          weightKg: '84.2',
          recordedAt: new Date('2025-01-16T08:00:00Z'),
          notes: null,
        },
      ];

      const response = await GET();
      const data = await response.json();

      expect(data.weightEntries).toHaveLength(2);
      expect(data.weightEntries[0].weightKg).toBe(85.5);
      expect(data.weightEntries[0].notes).toBe('Morning weigh-in');
      expect(data.weightEntries[1].weightKg).toBe(84.2);
      expect(data.weightEntries[1].notes).toBeNull();
    });
  });

  describe('Injections', () => {
    it('includes injections with correct structure', async () => {
      mockAuth.mockResolvedValue({ user: { id: 'user-123', email: 'test@example.com' } });
      mockInjectionData = [
        {
          doseMg: '2.5',
          injectionSite: 'thigh_left',
          injectionDate: new Date('2025-01-01'),
          batchNumber: 'BATCH001',
          notes: 'First injection',
        },
        {
          doseMg: '5.0',
          injectionSite: 'abdomen',
          injectionDate: new Date('2025-01-08'),
          batchNumber: null,
          notes: null,
        },
      ];

      const response = await GET();
      const data = await response.json();

      expect(data.injections).toHaveLength(2);
      expect(data.injections[0].doseMg).toBe(2.5);
      expect(data.injections[0].injectionSite).toBe('thigh_left');
      expect(data.injections[0].batchNumber).toBe('BATCH001');
      expect(data.injections[1].doseMg).toBe(5);
      expect(data.injections[1].batchNumber).toBeNull();
    });
  });

  describe('Daily Logs', () => {
    it('includes daily logs with side effects', async () => {
      mockAuth.mockResolvedValue({ user: { id: 'user-123', email: 'test@example.com' } });
      mockDailyLogsFindMany.mockResolvedValue([
        {
          logDate: '2025-01-15',
          sideEffects: [
            { effectType: 'nausea', severity: 3, notes: 'Mild nausea after eating' },
            { effectType: 'fatigue', severity: 2, notes: null },
          ],
          activityLog: null,
          mentalLog: null,
          dietLog: null,
        },
      ]);

      const response = await GET();
      const data = await response.json();

      expect(data.dailyLogs).toHaveLength(1);
      expect(data.dailyLogs[0].sideEffects).toHaveLength(2);
      expect(data.dailyLogs[0].sideEffects[0].effectType).toBe('nausea');
      expect(data.dailyLogs[0].sideEffects[0].severity).toBe(3);
    });

    it('includes daily logs with activity log', async () => {
      mockAuth.mockResolvedValue({ user: { id: 'user-123', email: 'test@example.com' } });
      mockDailyLogsFindMany.mockResolvedValue([
        {
          logDate: '2025-01-15',
          sideEffects: [],
          activityLog: {
            workoutType: 'cardio',
            durationMinutes: 45,
            steps: 8500,
            notes: 'Morning jog',
          },
          mentalLog: null,
          dietLog: null,
        },
      ]);

      const response = await GET();
      const data = await response.json();

      expect(data.dailyLogs[0].activity).not.toBeNull();
      expect(data.dailyLogs[0].activity.workoutType).toBe('cardio');
      expect(data.dailyLogs[0].activity.durationMinutes).toBe(45);
      expect(data.dailyLogs[0].activity.steps).toBe(8500);
    });

    it('includes daily logs with mental log', async () => {
      mockAuth.mockResolvedValue({ user: { id: 'user-123', email: 'test@example.com' } });
      mockDailyLogsFindMany.mockResolvedValue([
        {
          logDate: '2025-01-15',
          sideEffects: [],
          activityLog: null,
          mentalLog: {
            motivationLevel: 4,
            cravingsLevel: 2,
            moodLevel: 5,
            notes: 'Feeling great',
          },
          dietLog: null,
        },
      ]);

      const response = await GET();
      const data = await response.json();

      expect(data.dailyLogs[0].mental).not.toBeNull();
      expect(data.dailyLogs[0].mental.motivationLevel).toBe(4);
      expect(data.dailyLogs[0].mental.cravingsLevel).toBe(2);
      expect(data.dailyLogs[0].mental.moodLevel).toBe(5);
    });

    it('includes daily logs with diet log', async () => {
      mockAuth.mockResolvedValue({ user: { id: 'user-123', email: 'test@example.com' } });
      mockDailyLogsFindMany.mockResolvedValue([
        {
          logDate: '2025-01-15',
          sideEffects: [],
          activityLog: null,
          mentalLog: null,
          dietLog: {
            hungerLevel: 3,
            mealsCount: 3,
            proteinGrams: 120,
            waterLiters: '2.5',
            notes: 'Good protein intake',
          },
        },
      ]);

      const response = await GET();
      const data = await response.json();

      expect(data.dailyLogs[0].diet).not.toBeNull();
      expect(data.dailyLogs[0].diet.hungerLevel).toBe(3);
      expect(data.dailyLogs[0].diet.mealsCount).toBe(3);
      expect(data.dailyLogs[0].diet.proteinGrams).toBe(120);
      expect(data.dailyLogs[0].diet.waterLiters).toBe(2.5);
    });

    it('handles null water liters in diet log', async () => {
      mockAuth.mockResolvedValue({ user: { id: 'user-123', email: 'test@example.com' } });
      mockDailyLogsFindMany.mockResolvedValue([
        {
          logDate: '2025-01-15',
          sideEffects: [],
          activityLog: null,
          mentalLog: null,
          dietLog: {
            hungerLevel: 3,
            mealsCount: 3,
            proteinGrams: 100,
            waterLiters: null,
            notes: null,
          },
        },
      ]);

      const response = await GET();
      const data = await response.json();

      expect(data.dailyLogs[0].diet.waterLiters).toBeNull();
    });

    it('includes complete daily log with all sub-logs', async () => {
      mockAuth.mockResolvedValue({ user: { id: 'user-123', email: 'test@example.com' } });
      mockDailyLogsFindMany.mockResolvedValue([
        {
          logDate: '2025-01-15',
          sideEffects: [{ effectType: 'nausea', severity: 2, notes: null }],
          activityLog: { workoutType: 'strength', durationMinutes: 60, steps: 5000, notes: null },
          mentalLog: { motivationLevel: 4, cravingsLevel: 1, moodLevel: 4, notes: null },
          dietLog: { hungerLevel: 2, mealsCount: 4, proteinGrams: 150, waterLiters: '3.0', notes: null },
        },
      ]);

      const response = await GET();
      const data = await response.json();

      expect(data.dailyLogs[0].sideEffects).toHaveLength(1);
      expect(data.dailyLogs[0].activity).not.toBeNull();
      expect(data.dailyLogs[0].mental).not.toBeNull();
      expect(data.dailyLogs[0].diet).not.toBeNull();
    });
  });

  describe('Error Handling', () => {
    it('returns 500 for database errors', async () => {
      mockAuth.mockResolvedValue({ user: { id: 'user-123', email: 'test@example.com' } });
      mockProfileFindFirst.mockRejectedValue(new Error('Database error'));

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Internal server error');
    });
  });
});
