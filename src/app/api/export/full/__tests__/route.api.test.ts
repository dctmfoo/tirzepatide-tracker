import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GET } from '../route';

// Use vi.hoisted to properly hoist mock functions
const {
  mockAuth,
  mockUser,
  mockProfile,
  mockPreferences,
  mockWeightEntries,
  mockInjections,
  mockDailyLogs,
  mockNotificationPrefs,
  mockEmailLogs,
} = vi.hoisted(() => ({
  mockAuth: vi.fn(),
  mockUser: { value: null as unknown },
  mockProfile: { value: null as unknown },
  mockPreferences: { value: null as unknown },
  mockWeightEntries: { value: [] as unknown[] },
  mockInjections: { value: [] as unknown[] },
  mockDailyLogs: { value: [] as unknown[] },
  mockNotificationPrefs: { value: [] as unknown[] },
  mockEmailLogs: { value: [] as unknown[] },
}));

vi.mock('@/lib/auth', () => ({
  auth: () => mockAuth(),
}));

vi.mock('@/lib/db', () => ({
  db: {
    query: {
      users: {
        findFirst: () => Promise.resolve(mockUser.value),
      },
      profiles: {
        findFirst: () => Promise.resolve(mockProfile.value),
      },
      userPreferences: {
        findFirst: () => Promise.resolve(mockPreferences.value),
      },
      dailyLogs: {
        findMany: () => Promise.resolve(mockDailyLogs.value),
      },
    },
    select: () => ({
      from: (table: { _table?: string }) => ({
        where: () => {
          const tableName = table?._table;
          // notificationPreferences doesn't have orderBy in the route
          if (tableName === 'notificationPreferences') {
            return Promise.resolve(mockNotificationPrefs.value);
          }
          // Other tables have orderBy chain
          return {
            orderBy: () => {
              if (tableName === 'weightEntries') return Promise.resolve(mockWeightEntries.value);
              if (tableName === 'injections') return Promise.resolve(mockInjections.value);
              if (tableName === 'emailLogs') return Promise.resolve(mockEmailLogs.value);
              return Promise.resolve([]);
            },
            // Also make it thenable directly in case it's awaited before orderBy
            then: (resolve: (value: unknown[]) => void) => {
              if (tableName === 'notificationPreferences') {
                resolve(mockNotificationPrefs.value);
              }
              return Promise.resolve([]);
            },
          };
        },
      }),
    }),
  },
  schema: {
    users: { id: 'id' },
    profiles: { userId: 'userId' },
    userPreferences: { userId: 'userId' },
    weightEntries: { _table: 'weightEntries', userId: 'userId', recordedAt: 'recordedAt' },
    injections: { _table: 'injections', userId: 'userId', injectionDate: 'injectionDate' },
    dailyLogs: { userId: 'userId', logDate: 'logDate' },
    notificationPreferences: { _table: 'notificationPreferences', userId: 'userId' },
    emailLogs: { _table: 'emailLogs', userId: 'userId', sentAt: 'sentAt' },
  },
}));

vi.mock('drizzle-orm', () => ({
  eq: vi.fn(),
  asc: vi.fn(),
}));

describe('GET /api/export/full', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUser.value = null;
    mockProfile.value = null;
    mockPreferences.value = null;
    mockWeightEntries.value = [];
    mockInjections.value = [];
    mockDailyLogs.value = [];
    mockNotificationPrefs.value = [];
    mockEmailLogs.value = [];
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
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('returns 401 when user is null', async () => {
      mockAuth.mockResolvedValue({ user: null });

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });
  });

  describe('Response Headers', () => {
    it('returns JSON content type', async () => {
      mockAuth.mockResolvedValue({ user: { id: 'user-123', email: 'test@example.com' } });

      const response = await GET();

      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toBe('application/json');
    });

    it('sets Content-Disposition for file download', async () => {
      mockAuth.mockResolvedValue({ user: { id: 'user-123', email: 'test@example.com' } });

      const response = await GET();
      const disposition = response.headers.get('Content-Disposition');

      expect(disposition).toContain('attachment');
      expect(disposition).toContain('mounjaro-tracker-gdpr-export');
      expect(disposition).toContain('.json');
      const today = new Date().toISOString().split('T')[0];
      expect(disposition).toContain(today);
    });
  });

  describe('GDPR Metadata', () => {
    it('includes GDPR-compliant metadata', async () => {
      mockAuth.mockResolvedValue({ user: { id: 'user-123', email: 'test@example.com' } });

      const response = await GET();
      const data = JSON.parse(await response.text());

      expect(data._meta).toBeDefined();
      expect(data._meta.exportType).toBe('GDPR Full Data Export');
      expect(data._meta.dataController).toBe('Mounjaro Tracker');
      expect(data._meta.dataSubject).toBe('test@example.com');
      expect(data._meta.format).toBe('JSON');
      expect(data._meta.version).toBe('1.0');
    });

    it('includes export timestamp in ISO format', async () => {
      mockAuth.mockResolvedValue({ user: { id: 'user-123', email: 'test@example.com' } });

      const response = await GET();
      const data = JSON.parse(await response.text());

      expect(data._meta.exportedAt).toBeDefined();
      // Should be a valid ISO timestamp
      expect(() => new Date(data._meta.exportedAt)).not.toThrow();
    });

    it('includes data counts summary', async () => {
      mockAuth.mockResolvedValue({ user: { id: 'user-123', email: 'test@example.com' } });
      mockWeightEntries.value = [{ id: 'w1' }, { id: 'w2' }];
      mockInjections.value = [{ id: 'i1' }];
      mockDailyLogs.value = [{ id: 'd1', sideEffects: [] }];

      const response = await GET();
      const data = JSON.parse(await response.text());

      expect(data._dataCounts).toBeDefined();
      expect(data._dataCounts.weightEntries).toBe(2);
      expect(data._dataCounts.injections).toBe(1);
      expect(data._dataCounts.dailyLogs).toBe(1);
    });
  });

  describe('Account Data', () => {
    it('exports user account information', async () => {
      mockAuth.mockResolvedValue({ user: { id: 'user-123', email: 'test@example.com' } });
      mockUser.value = {
        id: 'user-123',
        email: 'test@example.com',
        emailVerified: new Date('2025-01-01'),
        createdAt: new Date('2025-01-01'),
        updatedAt: new Date('2025-01-02'),
      };

      const response = await GET();
      const data = JSON.parse(await response.text());

      expect(data.account).toBeDefined();
      expect(data.account.id).toBe('user-123');
      expect(data.account.email).toBe('test@example.com');
      expect(data.account.emailVerified).toBeDefined();
      expect(data.account.createdAt).toBeDefined();
      expect(data.account.updatedAt).toBeDefined();
    });

    it('handles null user gracefully', async () => {
      mockAuth.mockResolvedValue({ user: { id: 'user-123', email: 'test@example.com' } });
      mockUser.value = null;

      const response = await GET();
      const data = JSON.parse(await response.text());

      expect(data.account.id).toBeUndefined();
      expect(data.account.email).toBeUndefined();
    });
  });

  describe('Profile Data', () => {
    it('exports user profile when exists', async () => {
      mockAuth.mockResolvedValue({ user: { id: 'user-123', email: 'test@example.com' } });
      mockProfile.value = {
        id: 'profile-123',
        age: 35,
        gender: 'male',
        heightCm: '180',
        startingWeightKg: '95.5',
        goalWeightKg: '75.0',
        treatmentStartDate: '2025-01-01',
        preferredInjectionDay: 'monday',
        reminderDaysBefore: 2,
        createdAt: new Date('2025-01-01'),
        updatedAt: new Date('2025-01-02'),
      };

      const response = await GET();
      const data = JSON.parse(await response.text());

      expect(data.profile).toBeDefined();
      expect(data.profile.id).toBe('profile-123');
      expect(data.profile.age).toBe(35);
      expect(data.profile.gender).toBe('male');
      expect(data.profile.heightCm).toBe(180);
      expect(data.profile.startingWeightKg).toBe(95.5);
      expect(data.profile.goalWeightKg).toBe(75);
      expect(data.profile.treatmentStartDate).toBe('2025-01-01');
      expect(data.profile.preferredInjectionDay).toBe('monday');
      expect(data.profile.reminderDaysBefore).toBe(2);
    });

    it('returns null profile when not exists', async () => {
      mockAuth.mockResolvedValue({ user: { id: 'user-123', email: 'test@example.com' } });
      mockProfile.value = null;

      const response = await GET();
      const data = JSON.parse(await response.text());

      expect(data.profile).toBeNull();
    });
  });

  describe('Preferences Data', () => {
    it('exports user preferences when exists', async () => {
      mockAuth.mockResolvedValue({ user: { id: 'user-123', email: 'test@example.com' } });
      mockPreferences.value = {
        id: 'pref-123',
        weightUnit: 'kg',
        heightUnit: 'cm',
        dateFormat: 'YYYY-MM-DD',
        weekStartsOn: 'monday',
        theme: 'dark',
        createdAt: new Date('2025-01-01'),
        updatedAt: new Date('2025-01-02'),
      };

      const response = await GET();
      const data = JSON.parse(await response.text());

      expect(data.preferences).toBeDefined();
      expect(data.preferences.id).toBe('pref-123');
      expect(data.preferences.weightUnit).toBe('kg');
      expect(data.preferences.heightUnit).toBe('cm');
      expect(data.preferences.dateFormat).toBe('YYYY-MM-DD');
      expect(data.preferences.weekStartsOn).toBe('monday');
      expect(data.preferences.theme).toBe('dark');
    });

    it('returns null preferences when not exists', async () => {
      mockAuth.mockResolvedValue({ user: { id: 'user-123', email: 'test@example.com' } });
      mockPreferences.value = null;

      const response = await GET();
      const data = JSON.parse(await response.text());

      expect(data.preferences).toBeNull();
    });
  });

  describe('Weight Entries', () => {
    it('exports all weight entries with proper formatting', async () => {
      mockAuth.mockResolvedValue({ user: { id: 'user-123', email: 'test@example.com' } });
      mockWeightEntries.value = [
        {
          id: 'w1',
          weightKg: '93.5',
          recordedAt: new Date('2025-01-08'),
          notes: 'Morning weight',
          createdAt: new Date('2025-01-08'),
          updatedAt: new Date('2025-01-08'),
        },
        {
          id: 'w2',
          weightKg: '92.0',
          recordedAt: new Date('2025-01-15'),
          notes: null,
          createdAt: new Date('2025-01-15'),
          updatedAt: new Date('2025-01-15'),
        },
      ];

      const response = await GET();
      const data = JSON.parse(await response.text());

      expect(data.weightEntries).toHaveLength(2);
      expect(data.weightEntries[0].id).toBe('w1');
      expect(data.weightEntries[0].weightKg).toBe(93.5);
      expect(data.weightEntries[0].notes).toBe('Morning weight');
      expect(data.weightEntries[1].weightKg).toBe(92);
      expect(data.weightEntries[1].notes).toBeNull();
    });

    it('returns empty array when no weight entries', async () => {
      mockAuth.mockResolvedValue({ user: { id: 'user-123', email: 'test@example.com' } });
      mockWeightEntries.value = [];

      const response = await GET();
      const data = JSON.parse(await response.text());

      expect(data.weightEntries).toEqual([]);
      expect(data._dataCounts.weightEntries).toBe(0);
    });
  });

  describe('Injections', () => {
    it('exports all injections with proper formatting', async () => {
      mockAuth.mockResolvedValue({ user: { id: 'user-123', email: 'test@example.com' } });
      mockInjections.value = [
        {
          id: 'i1',
          doseMg: '2.5',
          injectionSite: 'thigh_left',
          injectionDate: new Date('2025-01-01'),
          batchNumber: 'BATCH123',
          notes: 'First injection',
          createdAt: new Date('2025-01-01'),
          updatedAt: new Date('2025-01-01'),
        },
        {
          id: 'i2',
          doseMg: '5.0',
          injectionSite: 'abdomen_right',
          injectionDate: new Date('2025-01-08'),
          batchNumber: null,
          notes: null,
          createdAt: new Date('2025-01-08'),
          updatedAt: new Date('2025-01-08'),
        },
      ];

      const response = await GET();
      const data = JSON.parse(await response.text());

      expect(data.injections).toHaveLength(2);
      expect(data.injections[0].id).toBe('i1');
      expect(data.injections[0].doseMg).toBe(2.5);
      expect(data.injections[0].injectionSite).toBe('thigh_left');
      expect(data.injections[0].batchNumber).toBe('BATCH123');
      expect(data.injections[1].doseMg).toBe(5);
      expect(data.injections[1].batchNumber).toBeNull();
    });

    it('returns empty array when no injections', async () => {
      mockAuth.mockResolvedValue({ user: { id: 'user-123', email: 'test@example.com' } });
      mockInjections.value = [];

      const response = await GET();
      const data = JSON.parse(await response.text());

      expect(data.injections).toEqual([]);
      expect(data._dataCounts.injections).toBe(0);
    });
  });

  describe('Daily Logs', () => {
    it('exports daily logs with all related data', async () => {
      mockAuth.mockResolvedValue({ user: { id: 'user-123', email: 'test@example.com' } });
      mockDailyLogs.value = [
        {
          id: 'log1',
          logDate: '2025-01-15',
          createdAt: new Date('2025-01-15'),
          updatedAt: new Date('2025-01-15'),
          sideEffects: [
            {
              id: 'se1',
              effectType: 'nausea',
              severity: 3,
              notes: 'Mild nausea',
              createdAt: new Date('2025-01-15'),
            },
          ],
          activityLog: {
            id: 'act1',
            workoutType: 'walking',
            durationMinutes: 30,
            steps: 5000,
            notes: 'Morning walk',
            createdAt: new Date('2025-01-15'),
          },
          mentalLog: {
            id: 'ment1',
            motivationLevel: 4,
            cravingsLevel: 2,
            moodLevel: 4,
            notes: 'Feeling good',
            createdAt: new Date('2025-01-15'),
          },
          dietLog: {
            id: 'diet1',
            hungerLevel: 3,
            mealsCount: 3,
            proteinGrams: 80,
            waterLiters: '2.5',
            notes: 'Good protein intake',
            createdAt: new Date('2025-01-15'),
          },
        },
      ];

      const response = await GET();
      const data = JSON.parse(await response.text());

      expect(data.dailyLogs).toHaveLength(1);
      const log = data.dailyLogs[0];

      // Main log
      expect(log.id).toBe('log1');
      expect(log.logDate).toBe('2025-01-15');

      // Side effects
      expect(log.sideEffects).toHaveLength(1);
      expect(log.sideEffects[0].effectType).toBe('nausea');
      expect(log.sideEffects[0].severity).toBe(3);

      // Activity
      expect(log.activityLog).toBeDefined();
      expect(log.activityLog.workoutType).toBe('walking');
      expect(log.activityLog.durationMinutes).toBe(30);
      expect(log.activityLog.steps).toBe(5000);

      // Mental
      expect(log.mentalLog).toBeDefined();
      expect(log.mentalLog.motivationLevel).toBe(4);
      expect(log.mentalLog.cravingsLevel).toBe(2);
      expect(log.mentalLog.moodLevel).toBe(4);

      // Diet
      expect(log.dietLog).toBeDefined();
      expect(log.dietLog.hungerLevel).toBe(3);
      expect(log.dietLog.mealsCount).toBe(3);
      expect(log.dietLog.proteinGrams).toBe(80);
      expect(log.dietLog.waterLiters).toBe(2.5);
    });

    it('handles daily logs with null related data', async () => {
      mockAuth.mockResolvedValue({ user: { id: 'user-123', email: 'test@example.com' } });
      mockDailyLogs.value = [
        {
          id: 'log1',
          logDate: '2025-01-15',
          createdAt: new Date('2025-01-15'),
          updatedAt: new Date('2025-01-15'),
          sideEffects: [],
          activityLog: null,
          mentalLog: null,
          dietLog: null,
        },
      ];

      const response = await GET();
      const data = JSON.parse(await response.text());

      const log = data.dailyLogs[0];
      expect(log.sideEffects).toEqual([]);
      expect(log.activityLog).toBeNull();
      expect(log.mentalLog).toBeNull();
      expect(log.dietLog).toBeNull();
    });

    it('returns empty array when no daily logs', async () => {
      mockAuth.mockResolvedValue({ user: { id: 'user-123', email: 'test@example.com' } });
      mockDailyLogs.value = [];

      const response = await GET();
      const data = JSON.parse(await response.text());

      expect(data.dailyLogs).toEqual([]);
      expect(data._dataCounts.dailyLogs).toBe(0);
    });
  });

  describe('Notification Preferences', () => {
    it('exports notification preferences', async () => {
      mockAuth.mockResolvedValue({ user: { id: 'user-123', email: 'test@example.com' } });
      mockNotificationPrefs.value = [
        {
          id: 'np1',
          notificationType: 'injection_reminder',
          enabled: true,
          createdAt: new Date('2025-01-01'),
          updatedAt: new Date('2025-01-01'),
        },
        {
          id: 'np2',
          notificationType: 'weight_reminder',
          enabled: false,
          createdAt: new Date('2025-01-01'),
          updatedAt: new Date('2025-01-02'),
        },
      ];

      const response = await GET();
      const data = JSON.parse(await response.text());

      expect(data.notificationPreferences).toHaveLength(2);
      expect(data.notificationPreferences[0].notificationType).toBe('injection_reminder');
      expect(data.notificationPreferences[0].enabled).toBe(true);
      expect(data.notificationPreferences[1].notificationType).toBe('weight_reminder');
      expect(data.notificationPreferences[1].enabled).toBe(false);
      expect(data._dataCounts.notificationPreferences).toBe(2);
    });
  });

  describe('Email Logs', () => {
    it('exports email log history', async () => {
      mockAuth.mockResolvedValue({ user: { id: 'user-123', email: 'test@example.com' } });
      mockEmailLogs.value = [
        {
          id: 'el1',
          notificationType: 'injection_reminder',
          sentAt: new Date('2025-01-01'),
          status: 'sent',
          resendId: 'resend-123',
        },
        {
          id: 'el2',
          notificationType: 'weekly_summary',
          sentAt: new Date('2025-01-08'),
          status: 'sent',
          resendId: 'resend-456',
        },
      ];

      const response = await GET();
      const data = JSON.parse(await response.text());

      expect(data.emailLogs).toHaveLength(2);
      expect(data.emailLogs[0].notificationType).toBe('injection_reminder');
      expect(data.emailLogs[0].status).toBe('sent');
      expect(data.emailLogs[0].resendId).toBe('resend-123');
      expect(data._dataCounts.emailsSent).toBe(2);
    });
  });

  describe('Complete Export', () => {
    it('exports all data types together', async () => {
      mockAuth.mockResolvedValue({ user: { id: 'user-123', email: 'test@example.com' } });

      mockUser.value = { id: 'user-123', email: 'test@example.com' };
      mockProfile.value = { id: 'p1', age: 35, heightCm: '180', startingWeightKg: '95', goalWeightKg: '75' };
      mockPreferences.value = { id: 'pref1', weightUnit: 'kg' };
      mockWeightEntries.value = [{ id: 'w1', weightKg: '90' }];
      mockInjections.value = [{ id: 'i1', doseMg: '5.0' }];
      mockDailyLogs.value = [{ id: 'd1', logDate: '2025-01-15', sideEffects: [] }];
      mockNotificationPrefs.value = [{ id: 'np1', enabled: true }];
      mockEmailLogs.value = [{ id: 'el1', status: 'sent' }];

      const response = await GET();
      const data = JSON.parse(await response.text());

      // All sections should be present
      expect(data._meta).toBeDefined();
      expect(data.account).toBeDefined();
      expect(data.profile).toBeDefined();
      expect(data.preferences).toBeDefined();
      expect(data.weightEntries).toHaveLength(1);
      expect(data.injections).toHaveLength(1);
      expect(data.dailyLogs).toHaveLength(1);
      expect(data.notificationPreferences).toHaveLength(1);
      expect(data.emailLogs).toHaveLength(1);
      expect(data._dataCounts).toBeDefined();
    });
  });

  describe('JSON Formatting', () => {
    it('returns pretty-printed JSON with 2-space indentation', async () => {
      mockAuth.mockResolvedValue({ user: { id: 'user-123', email: 'test@example.com' } });

      const response = await GET();
      const text = await response.text();

      // Check for indentation (2 spaces)
      expect(text).toContain('\n  ');
      // Should be valid JSON
      expect(() => JSON.parse(text)).not.toThrow();
    });
  });
});
