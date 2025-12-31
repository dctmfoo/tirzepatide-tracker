import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { GET } from '../summary/route';

// Mock auth module
const mockAuth = vi.fn();
vi.mock('@/lib/auth', () => ({
  auth: () => mockAuth(),
}));

// Mock database query methods
const mockFindFirst = vi.fn();
const mockSelect = vi.fn().mockReturnThis();
const mockFrom = vi.fn().mockReturnThis();
const mockWhere = vi.fn().mockReturnThis();
const mockOrderBy = vi.fn();
const mockLimit = vi.fn();

vi.mock('@/lib/db', () => ({
  db: {
    query: {
      profiles: {
        findFirst: (...args: unknown[]) => mockFindFirst('profiles', ...args),
      },
      weightEntries: {
        findFirst: (...args: unknown[]) => mockFindFirst('weightEntries', ...args),
      },
      injections: {
        findFirst: (...args: unknown[]) => mockFindFirst('injections', ...args),
      },
      dailyLogs: {
        findFirst: (...args: unknown[]) => mockFindFirst('dailyLogs', ...args),
      },
    },
    select: () => mockSelect(),
  },
  schema: {
    profiles: { userId: 'userId' },
    weightEntries: { userId: 'userId', recordedAt: 'recordedAt' },
    injections: { userId: 'userId', injectionDate: 'injectionDate' },
    dailyLogs: { logDate: 'logDate' },
  },
}));

// Mock drizzle-orm operators
vi.mock('drizzle-orm', () => ({
  eq: vi.fn((a, b) => ({ type: 'eq', field: a, value: b })),
  desc: vi.fn((field) => ({ type: 'desc', field })),
  asc: vi.fn((field) => ({ type: 'asc', field })),
  count: vi.fn(() => ({ type: 'count' })),
}));

describe('GET /api/stats/summary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-01-15T12:00:00Z'));

    // Setup default mock chain for select queries
    mockSelect.mockReturnValue({ from: mockFrom });
    mockFrom.mockReturnValue({ where: mockWhere });
    mockWhere.mockImplementation(() => {
      return {
        orderBy: mockOrderBy,
        // For count queries that don't use orderBy, resolve directly with count result
        then: (resolve: (value: unknown[]) => void) => resolve([{ value: 0 }]),
      };
    });
    mockOrderBy.mockReturnValue({ limit: mockLimit });
    mockLimit.mockResolvedValue([]);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

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

  it('returns empty summary for new user with no data', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'test-user-id' } });
    mockFindFirst.mockResolvedValue(null);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.weight.starting).toBeNull();
    expect(data.weight.current).toBeNull();
    expect(data.weight.goal).toBeNull();
    expect(data.injection.totalCount).toBe(0);
    expect(data.injection.status).toBe('not_started');
    expect(data.treatment.days).toBeNull();
    expect(data.today.hasLog).toBe(false);
  });

  it('returns weight stats with profile and entries', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'test-user-id' } });

    mockFindFirst.mockImplementation((table: string) => {
      if (table === 'profiles') {
        return Promise.resolve({
          userId: 'test-user-id',
          startingWeightKg: '100.00',
          goalWeightKg: '80.00',
          treatmentStartDate: new Date('2025-01-01'),
        });
      }
      if (table === 'weightEntries') {
        return Promise.resolve({
          id: 'w-1',
          userId: 'test-user-id',
          weightKg: '95.00',
          recordedAt: new Date('2025-01-15'),
        });
      }
      return Promise.resolve(null);
    });

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.weight.starting).toBe(100);
    expect(data.weight.current).toBe(95);
    expect(data.weight.goal).toBe(80);
    expect(data.weight.totalLost).toBe(5); // 100 - 95
    expect(data.weight.remainingToGoal).toBe(15); // 95 - 80
  });

  it('calculates progress percentage correctly', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'test-user-id' } });

    mockFindFirst.mockImplementation((table: string) => {
      if (table === 'profiles') {
        return Promise.resolve({
          startingWeightKg: '100.00',
          goalWeightKg: '80.00',
          treatmentStartDate: new Date('2025-01-01'),
        });
      }
      if (table === 'weightEntries') {
        return Promise.resolve({
          weightKg: '90.00', // Lost 10kg out of 20kg goal
          recordedAt: new Date('2025-01-15'),
        });
      }
      return Promise.resolve(null);
    });

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    // Lost 10kg, need to lose 20kg total = 50%
    expect(data.weight.progressPercent).toBe(50);
  });

  it('returns injection stats with on_track status', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'test-user-id' } });

    mockFindFirst.mockImplementation((table: string) => {
      if (table === 'injections') {
        return Promise.resolve({
          id: 'inj-1',
          userId: 'test-user-id',
          doseMg: '5',
          injectionDate: new Date('2025-01-12'),
        });
      }
      return Promise.resolve(null);
    });

    // Mock the count query to return 1 injection
    mockWhere.mockImplementation(() => {
      return {
        orderBy: mockOrderBy,
        // Count query returns [{ value: count }] format
        then: (resolve: (value: unknown[]) => void) => resolve([{ value: 1 }]),
      };
    });
    mockLimit.mockResolvedValue([]);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.injection.currentDose).toBe(5);
    expect(data.injection.totalCount).toBe(1);
    expect(data.injection.daysUntil).toBe(4);
    expect(data.injection.status).toBe('on_track');
  });

  it('returns injection stats with due_soon status', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'test-user-id' } });

    mockFindFirst.mockImplementation((table: string) => {
      if (table === 'injections') {
        return Promise.resolve({
          id: 'inj-1',
          doseMg: '7.5',
          injectionDate: new Date('2025-01-09'),
        });
      }
      return Promise.resolve(null);
    });
    mockLimit.mockResolvedValue([{ id: 'inj-1' }]);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.injection.daysUntil).toBe(1);
    expect(data.injection.status).toBe('due_soon');
  });

  it('returns injection stats with due_today status', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'test-user-id' } });

    mockFindFirst.mockImplementation((table: string) => {
      if (table === 'injections') {
        return Promise.resolve({
          id: 'inj-1',
          doseMg: '10',
          injectionDate: new Date('2025-01-08T12:00:00Z'),
        });
      }
      return Promise.resolve(null);
    });
    mockLimit.mockResolvedValue([{ id: 'inj-1' }]);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.injection.daysUntil).toBe(0);
    expect(data.injection.status).toBe('due_today');
  });

  it('returns injection stats with overdue status', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'test-user-id' } });

    mockFindFirst.mockImplementation((table: string) => {
      if (table === 'injections') {
        return Promise.resolve({
          id: 'inj-1',
          doseMg: '12.5',
          injectionDate: new Date('2025-01-05'),
        });
      }
      return Promise.resolve(null);
    });
    mockLimit.mockResolvedValue([{ id: 'inj-1' }]);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.injection.daysUntil).toBe(-3);
    expect(data.injection.status).toBe('overdue');
  });

  it('returns treatment duration correctly', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'test-user-id' } });

    mockFindFirst.mockImplementation((table: string) => {
      if (table === 'profiles') {
        return Promise.resolve({
          treatmentStartDate: new Date('2025-01-01'),
          startingWeightKg: '100',
          goalWeightKg: '80',
        });
      }
      return Promise.resolve(null);
    });

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.treatment.days).toBe(14); // Jan 1 to Jan 15
    expect(data.treatment.weeks).toBe(2);
  });

  it('returns today log summary when log exists', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'test-user-id' } });

    mockFindFirst.mockImplementation((table: string) => {
      if (table === 'dailyLogs') {
        return Promise.resolve({
          id: 'log-1',
          logDate: '2025-01-15',
          sideEffects: [{ effectType: 'Nausea' }, { effectType: 'Fatigue' }],
          activityLog: { workoutType: 'Walking' },
          mentalLog: { moodLevel: 'Good' },
          dietLog: { mealsCount: 3 },
        });
      }
      return Promise.resolve(null);
    });

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.today.hasLog).toBe(true);
    expect(data.today.sideEffectsCount).toBe(2);
    expect(data.today.hasActivity).toBe(true);
    expect(data.today.hasMental).toBe(true);
    expect(data.today.hasDiet).toBe(true);
  });

  it('returns today log summary when no log exists', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'test-user-id' } });
    mockFindFirst.mockResolvedValue(null);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.today.hasLog).toBe(false);
    expect(data.today.sideEffectsCount).toBe(0);
    expect(data.today.hasActivity).toBe(false);
    expect(data.today.hasMental).toBe(false);
    expect(data.today.hasDiet).toBe(false);
  });

  it('returns recent weights formatted correctly', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'test-user-id' } });
    mockFindFirst.mockResolvedValue(null);

    const recentWeights = [
      { weightKg: '92.5', recordedAt: new Date('2025-01-15') },
      { weightKg: '93.0', recordedAt: new Date('2025-01-14') },
      { weightKg: '93.5', recordedAt: new Date('2025-01-13') },
    ];
    mockLimit.mockResolvedValue(recentWeights);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.recentWeights).toHaveLength(3);
    expect(data.recentWeights[0].weight).toBe(92.5);
    expect(data.recentWeights[1].weight).toBe(93);
  });

  it('limits recent weights to 7', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'test-user-id' } });
    mockFindFirst.mockResolvedValue(null);

    // Database returns at most 7 weights due to .limit(7) in the query
    // We simulate this by providing exactly 7 weights (what the DB would return)
    const recentWeights = Array.from({ length: 7 }, (_, i) => ({
      weightKg: `${90 + i}`,
      recordedAt: new Date(`2025-01-${15 - i}`),
    }));
    mockLimit.mockResolvedValue(recentWeights);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.recentWeights).toHaveLength(7);
    // Verify the limit function was called
    expect(mockLimit).toHaveBeenCalled();
  });

  it('returns complete response structure', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'test-user-id' } });

    mockFindFirst.mockImplementation((table: string) => {
      if (table === 'profiles') {
        return Promise.resolve({
          startingWeightKg: '95.00',
          goalWeightKg: '80.00',
          treatmentStartDate: new Date('2025-01-01'),
        });
      }
      if (table === 'weightEntries') {
        return Promise.resolve({
          weightKg: '90.00',
          recordedAt: new Date('2025-01-15'),
        });
      }
      return Promise.resolve(null);
    });

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty('weight');
    expect(data).toHaveProperty('injection');
    expect(data).toHaveProperty('treatment');
    expect(data).toHaveProperty('today');
    expect(data).toHaveProperty('recentWeights');
    expect(data.weight.starting).toBe(95);
    expect(data.weight.current).toBe(90);
    expect(data.weight.goal).toBe(80);
  });

  it('handles gained weight correctly (negative progress)', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'test-user-id' } });

    mockFindFirst.mockImplementation((table: string) => {
      if (table === 'profiles') {
        return Promise.resolve({
          startingWeightKg: '100.00',
          goalWeightKg: '80.00',
          treatmentStartDate: new Date('2025-01-01'),
        });
      }
      if (table === 'weightEntries') {
        return Promise.resolve({
          weightKg: '102.00', // Gained 2kg
          recordedAt: new Date('2025-01-15'),
        });
      }
      return Promise.resolve(null);
    });

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.weight.totalLost).toBe(-2); // Negative means gained
    expect(data.weight.progressPercent).toBe(-10); // Negative progress
  });
});
