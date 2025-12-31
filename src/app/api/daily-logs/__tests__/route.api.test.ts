import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { GET, POST } from '../route';

// Mock auth module
const mockAuth = vi.fn();
vi.mock('@/lib/auth', () => ({
  auth: () => mockAuth(),
}));

// Mock database query methods
const mockFindMany = vi.fn();
const mockFindFirst = vi.fn();
const mockInsert = vi.fn().mockReturnThis();
const mockValues = vi.fn().mockReturnThis();
const mockReturning = vi.fn();
const mockUpdate = vi.fn().mockReturnThis();
const mockSet = vi.fn().mockReturnThis();
const mockWhere = vi.fn().mockReturnThis();
const mockDelete = vi.fn().mockReturnThis();

vi.mock('@/lib/db', () => ({
  db: {
    query: {
      dailyLogs: {
        findMany: (...args: unknown[]) => mockFindMany(...args),
        findFirst: (...args: unknown[]) => mockFindFirst(...args),
      },
    },
    insert: () => mockInsert(),
    update: () => mockUpdate(),
    delete: () => mockDelete(),
  },
  schema: {
    dailyLogs: {
      id: 'id',
      userId: 'userId',
      logDate: 'logDate',
    },
    sideEffects: {
      dailyLogId: 'dailyLogId',
    },
    activityLogs: {
      dailyLogId: 'dailyLogId',
    },
    mentalLogs: {
      dailyLogId: 'dailyLogId',
    },
    dietLogs: {
      dailyLogId: 'dailyLogId',
    },
  },
}));

// Mock drizzle-orm operators
vi.mock('drizzle-orm', () => ({
  eq: vi.fn((a, b) => ({ type: 'eq', field: a, value: b })),
  and: vi.fn((...conditions) => ({ type: 'and', conditions })),
  gte: vi.fn((a, b) => ({ type: 'gte', field: a, value: b })),
  lte: vi.fn((a, b) => ({ type: 'lte', field: a, value: b })),
  desc: vi.fn((field) => ({ type: 'desc', field })),
}));

describe('GET /api/daily-logs', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when not authenticated', async () => {
    mockAuth.mockResolvedValue(null);

    const request = new NextRequest('http://localhost:3000/api/daily-logs');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });

  it('returns 401 when session has no user id', async () => {
    mockAuth.mockResolvedValue({ user: {} });

    const request = new NextRequest('http://localhost:3000/api/daily-logs');
    const response = await GET(request);

    expect(response.status).toBe(401);
  });

  it('returns empty logs array for user with no logs', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'test-user-id' } });
    mockFindMany.mockResolvedValue([]);

    const request = new NextRequest('http://localhost:3000/api/daily-logs');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.logs).toEqual([]);
    expect(data.pagination.limit).toBe(30);
    expect(data.pagination.offset).toBe(0);
    expect(data.pagination.hasMore).toBe(false);
  });

  it('returns logs with related data for authenticated user', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'test-user-id' } });

    const mockLogs = [
      {
        id: 'log-1',
        userId: 'test-user-id',
        logDate: '2025-01-15',
        sideEffects: [
          { id: 'se-1', effectType: 'Nausea', severity: 'Mild', notes: null },
        ],
        activityLog: { id: 'al-1', workoutType: 'Walking', durationMinutes: 30, steps: 5000, notes: null },
        mentalLog: { id: 'ml-1', moodLevel: 'Good', motivationLevel: 'High', cravingsLevel: 'Low', notes: null },
        dietLog: { id: 'dl-1', hungerLevel: 'Low', mealsCount: 3, proteinGrams: 80, waterLiters: '2.5', notes: null },
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];
    mockFindMany.mockResolvedValue(mockLogs);

    const request = new NextRequest('http://localhost:3000/api/daily-logs');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.logs).toHaveLength(1);
    expect(data.logs[0].logDate).toBe('2025-01-15');
    expect(data.logs[0].sideEffects).toHaveLength(1);
    expect(data.logs[0].activity.workoutType).toBe('Walking');
    expect(data.logs[0].mental.moodLevel).toBe('Good');
    expect(data.logs[0].diet.waterLiters).toBe(2.5);
  });

  it('respects limit parameter', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'test-user-id' } });
    mockFindMany.mockResolvedValue([]);

    const request = new NextRequest('http://localhost:3000/api/daily-logs?limit=10');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.pagination.limit).toBe(10);
  });

  it('caps limit at 100', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'test-user-id' } });
    mockFindMany.mockResolvedValue([]);

    const request = new NextRequest('http://localhost:3000/api/daily-logs?limit=200');
    const response = await GET(request);
    const data = await response.json();

    expect(data.pagination.limit).toBe(100);
  });

  it('respects offset parameter', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'test-user-id' } });
    mockFindMany.mockResolvedValue([]);

    const request = new NextRequest('http://localhost:3000/api/daily-logs?offset=20');
    const response = await GET(request);
    const data = await response.json();

    expect(data.pagination.offset).toBe(20);
  });

  it('indicates hasMore when results equal limit', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'test-user-id' } });

    const mockLogs = Array.from({ length: 10 }, (_, i) => ({
      id: `log-${i}`,
      userId: 'test-user-id',
      logDate: `2025-01-${15 - i}`,
      sideEffects: [],
      activityLog: null,
      mentalLog: null,
      dietLog: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));
    mockFindMany.mockResolvedValue(mockLogs);

    const request = new NextRequest('http://localhost:3000/api/daily-logs?limit=10');
    const response = await GET(request);
    const data = await response.json();

    expect(data.pagination.hasMore).toBe(true);
  });

  it('handles null diet log waterLiters', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'test-user-id' } });

    const mockLogs = [
      {
        id: 'log-1',
        userId: 'test-user-id',
        logDate: '2025-01-15',
        sideEffects: [],
        activityLog: null,
        mentalLog: null,
        dietLog: { id: 'dl-1', hungerLevel: 'Low', mealsCount: 2, proteinGrams: 50, waterLiters: null, notes: null },
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];
    mockFindMany.mockResolvedValue(mockLogs);

    const request = new NextRequest('http://localhost:3000/api/daily-logs');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.logs[0].diet.waterLiters).toBeNull();
  });
});

describe('POST /api/daily-logs', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockInsert.mockReturnValue({ values: mockValues });
    mockValues.mockReturnValue({ returning: mockReturning });
    mockUpdate.mockReturnValue({ set: mockSet });
    mockSet.mockReturnValue({ where: mockWhere });
    mockDelete.mockReturnValue({ where: mockWhere });
    mockWhere.mockResolvedValue(undefined);
  });

  it('returns 401 when not authenticated', async () => {
    mockAuth.mockResolvedValue(null);

    const request = new Request('http://localhost:3000/api/daily-logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ logDate: '2025-01-15' }),
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });

  it('returns 400 for missing logDate', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'test-user-id' } });

    const request = new Request('http://localhost:3000/api/daily-logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Validation failed');
  });

  it('returns 400 for invalid logDate format', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'test-user-id' } });

    const request = new Request('http://localhost:3000/api/daily-logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ logDate: '01-15-2025' }),
    });
    const response = await POST(request);

    expect(response.status).toBe(400);
  });

  it('creates new daily log with minimal data', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'test-user-id' } });
    mockFindFirst
      .mockResolvedValueOnce(null) // No existing log
      .mockResolvedValueOnce({
        id: 'new-log-id',
        userId: 'test-user-id',
        logDate: '2025-01-15',
        sideEffects: [],
        activityLog: null,
        mentalLog: null,
        dietLog: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    mockReturning.mockResolvedValue([{ id: 'new-log-id', userId: 'test-user-id', logDate: '2025-01-15' }]);

    const request = new Request('http://localhost:3000/api/daily-logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ logDate: '2025-01-15' }),
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.id).toBe('new-log-id');
    expect(data.logDate).toBe('2025-01-15');
  });

  it('creates daily log with side effects', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'test-user-id' } });
    mockFindFirst
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({
        id: 'new-log-id',
        userId: 'test-user-id',
        logDate: '2025-01-15',
        sideEffects: [{ id: 'se-1', effectType: 'Nausea', severity: 'Mild', notes: null }],
        activityLog: null,
        mentalLog: null,
        dietLog: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    mockReturning.mockResolvedValue([{ id: 'new-log-id', userId: 'test-user-id', logDate: '2025-01-15' }]);

    const request = new Request('http://localhost:3000/api/daily-logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        logDate: '2025-01-15',
        sideEffects: [{ effectType: 'Nausea', severity: 'Mild' }],
      }),
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.sideEffects).toHaveLength(1);
    expect(data.sideEffects[0].effectType).toBe('Nausea');
  });

  it('validates side effect severity enum', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'test-user-id' } });

    const request = new Request('http://localhost:3000/api/daily-logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        logDate: '2025-01-15',
        sideEffects: [{ effectType: 'Nausea', severity: 'InvalidSeverity' }],
      }),
    });
    const response = await POST(request);

    expect(response.status).toBe(400);
  });

  it('creates daily log with activity data', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'test-user-id' } });
    mockFindFirst
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({
        id: 'new-log-id',
        userId: 'test-user-id',
        logDate: '2025-01-15',
        sideEffects: [],
        activityLog: { id: 'al-1', workoutType: 'Cardio', durationMinutes: 45, steps: 8000, notes: null },
        mentalLog: null,
        dietLog: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    mockReturning.mockResolvedValue([{ id: 'new-log-id', userId: 'test-user-id', logDate: '2025-01-15' }]);

    const request = new Request('http://localhost:3000/api/daily-logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        logDate: '2025-01-15',
        activity: { workoutType: 'Cardio', durationMinutes: 45, steps: 8000 },
      }),
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.activity.workoutType).toBe('Cardio');
    expect(data.activity.durationMinutes).toBe(45);
  });

  it('validates workout type enum', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'test-user-id' } });

    const request = new Request('http://localhost:3000/api/daily-logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        logDate: '2025-01-15',
        activity: { workoutType: 'InvalidWorkout' },
      }),
    });
    const response = await POST(request);

    expect(response.status).toBe(400);
  });

  it('creates daily log with mental data', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'test-user-id' } });
    mockFindFirst
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({
        id: 'new-log-id',
        userId: 'test-user-id',
        logDate: '2025-01-15',
        sideEffects: [],
        activityLog: null,
        mentalLog: { id: 'ml-1', moodLevel: 'Great', motivationLevel: 'High', cravingsLevel: 'None', notes: null },
        dietLog: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    mockReturning.mockResolvedValue([{ id: 'new-log-id', userId: 'test-user-id', logDate: '2025-01-15' }]);

    const request = new Request('http://localhost:3000/api/daily-logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        logDate: '2025-01-15',
        mental: { moodLevel: 'Great', motivationLevel: 'High', cravingsLevel: 'None' },
      }),
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.mental.moodLevel).toBe('Great');
  });

  it('creates daily log with diet data', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'test-user-id' } });
    mockFindFirst
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({
        id: 'new-log-id',
        userId: 'test-user-id',
        logDate: '2025-01-15',
        sideEffects: [],
        activityLog: null,
        mentalLog: null,
        dietLog: { id: 'dl-1', hungerLevel: 'Moderate', mealsCount: 3, proteinGrams: 100, waterLiters: '2.5', notes: null },
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    mockReturning.mockResolvedValue([{ id: 'new-log-id', userId: 'test-user-id', logDate: '2025-01-15' }]);

    const request = new Request('http://localhost:3000/api/daily-logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        logDate: '2025-01-15',
        diet: { hungerLevel: 'Moderate', mealsCount: 3, proteinGrams: 100, waterLiters: 2.5 },
      }),
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.diet.waterLiters).toBe(2.5);
  });

  it('updates existing log for same date', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'test-user-id' } });
    mockFindFirst
      .mockResolvedValueOnce({ id: 'existing-log-id', userId: 'test-user-id', logDate: '2025-01-15' })
      .mockResolvedValueOnce({
        id: 'existing-log-id',
        userId: 'test-user-id',
        logDate: '2025-01-15',
        sideEffects: [],
        activityLog: null,
        mentalLog: null,
        dietLog: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

    const request = new Request('http://localhost:3000/api/daily-logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ logDate: '2025-01-15' }),
    });
    const response = await POST(request);

    expect(response.status).toBe(201);
    expect(mockUpdate).toHaveBeenCalled();
  });

  it('validates activity duration max', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'test-user-id' } });

    const request = new Request('http://localhost:3000/api/daily-logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        logDate: '2025-01-15',
        activity: { durationMinutes: 1500 }, // Max is 1440
      }),
    });
    const response = await POST(request);

    expect(response.status).toBe(400);
  });

  it('validates diet mealsCount max', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'test-user-id' } });

    const request = new Request('http://localhost:3000/api/daily-logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        logDate: '2025-01-15',
        diet: { mealsCount: 15 }, // Max is 10
      }),
    });
    const response = await POST(request);

    expect(response.status).toBe(400);
  });

  it('validates diet waterLiters max', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'test-user-id' } });

    const request = new Request('http://localhost:3000/api/daily-logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        logDate: '2025-01-15',
        diet: { waterLiters: 15 }, // Max is 10
      }),
    });
    const response = await POST(request);

    expect(response.status).toBe(400);
  });
});
