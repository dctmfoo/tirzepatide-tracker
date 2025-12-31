import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GET } from '../route';

// Mock auth
const mockAuth = vi.fn();
vi.mock('@/lib/auth', () => ({
  auth: () => mockAuth(),
}));

// Mock database
const mockProfileFindFirst = vi.fn();
const mockPreferencesFindFirst = vi.fn();
const mockDailyLogsFindMany = vi.fn();
const mockSelect = vi.fn();
const mockFrom = vi.fn();
const mockWhere = vi.fn();
const mockOrderBy = vi.fn();

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
    select: () => {
      mockSelect();
      return {
        from: () => {
          mockFrom();
          return {
            where: () => {
              mockWhere();
              return {
                orderBy: () => {
                  mockOrderBy();
                  return Promise.resolve([]);
                },
              };
            },
          };
        },
      };
    },
  },
  schema: {
    profiles: { userId: 'userId' },
    userPreferences: { userId: 'userId' },
    weightEntries: { userId: 'userId', recordedAt: 'recordedAt' },
    injections: { userId: 'userId', injectionDate: 'injectionDate' },
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
  });

  it('returns 401 when not authenticated', async () => {
    mockAuth.mockResolvedValue(null);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });

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
    expect(data.profile.heightCm).toBe(175);
    expect(data.profile.startingWeightKg).toBe(95.5);
  });

  it('returns null for profile when not set', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-123', email: 'test@example.com' } });
    mockProfileFindFirst.mockResolvedValue(null);

    const response = await GET();
    const data = await response.json();

    expect(data.profile).toBeNull();
  });

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
    expect(data.preferences.theme).toBe('dark');
  });

  it('includes empty arrays when no entries exist', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-123', email: 'test@example.com' } });

    const response = await GET();
    const data = await response.json();

    expect(data.weightEntries).toEqual([]);
    expect(data.injections).toEqual([]);
    expect(data.dailyLogs).toEqual([]);
  });

  it('formats response as pretty-printed JSON', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-123', email: 'test@example.com' } });

    const response = await GET();
    const text = await response.text();

    // Pretty-printed JSON contains newlines
    expect(text).toContain('\n');
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
