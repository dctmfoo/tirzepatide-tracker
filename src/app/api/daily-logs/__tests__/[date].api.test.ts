import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { GET, PUT } from '../[date]/route';

// Mock auth module
const mockAuth = vi.fn();
vi.mock('@/lib/auth', () => ({
  auth: () => mockAuth(),
}));

// Mock database query methods
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
}));

// Helper to create route context
const createContext = (date: string) => ({
  params: Promise.resolve({ date }),
});

describe('GET /api/daily-logs/[date]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when not authenticated', async () => {
    mockAuth.mockResolvedValue(null);

    const request = new NextRequest('http://localhost:3000/api/daily-logs/2025-01-15');
    const response = await GET(request, createContext('2025-01-15'));
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });

  it('returns 401 when session has no user id', async () => {
    mockAuth.mockResolvedValue({ user: {} });

    const request = new NextRequest('http://localhost:3000/api/daily-logs/2025-01-15');
    const response = await GET(request, createContext('2025-01-15'));

    expect(response.status).toBe(401);
  });

  it('returns 400 for invalid date format', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'test-user-id' } });

    const request = new NextRequest('http://localhost:3000/api/daily-logs/01-15-2025');
    const response = await GET(request, createContext('01-15-2025'));
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Invalid date format. Use YYYY-MM-DD');
  });

  it('returns 400 for invalid date format with slashes', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'test-user-id' } });

    const request = new NextRequest('http://localhost:3000/api/daily-logs/2025/01/15');
    const response = await GET(request, createContext('2025/01/15'));

    expect(response.status).toBe(400);
  });

  it('returns 404 when log not found for date', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'test-user-id' } });
    mockFindFirst.mockResolvedValue(null);

    const request = new NextRequest('http://localhost:3000/api/daily-logs/2025-01-15');
    const response = await GET(request, createContext('2025-01-15'));
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('Log not found for this date');
  });

  it('returns log with all related data', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'test-user-id' } });

    const mockLog = {
      id: 'log-1',
      userId: 'test-user-id',
      logDate: '2025-01-15',
      sideEffects: [
        { id: 'se-1', effectType: 'Nausea', severity: 'Mild', notes: 'Morning only' },
        { id: 'se-2', effectType: 'Fatigue', severity: 'Moderate', notes: null },
      ],
      activityLog: {
        id: 'al-1',
        workoutType: 'Walking',
        durationMinutes: 30,
        steps: 5000,
        notes: 'Nice weather',
      },
      mentalLog: {
        id: 'ml-1',
        moodLevel: 'Good',
        motivationLevel: 'High',
        cravingsLevel: 'Low',
        notes: 'Feeling positive',
      },
      dietLog: {
        id: 'dl-1',
        hungerLevel: 'Low',
        mealsCount: 3,
        proteinGrams: 80,
        waterLiters: '2.5',
        notes: 'Ate well',
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    mockFindFirst.mockResolvedValue(mockLog);

    const request = new NextRequest('http://localhost:3000/api/daily-logs/2025-01-15');
    const response = await GET(request, createContext('2025-01-15'));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.id).toBe('log-1');
    expect(data.logDate).toBe('2025-01-15');
    expect(data.sideEffects).toHaveLength(2);
    expect(data.activity.workoutType).toBe('Walking');
    expect(data.mental.moodLevel).toBe('Good');
    expect(data.diet.waterLiters).toBe(2.5);
  });

  it('returns log with null related data', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'test-user-id' } });

    const mockLog = {
      id: 'log-1',
      userId: 'test-user-id',
      logDate: '2025-01-15',
      sideEffects: [],
      activityLog: null,
      mentalLog: null,
      dietLog: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    mockFindFirst.mockResolvedValue(mockLog);

    const request = new NextRequest('http://localhost:3000/api/daily-logs/2025-01-15');
    const response = await GET(request, createContext('2025-01-15'));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.sideEffects).toEqual([]);
    expect(data.activity).toBeNull();
    expect(data.mental).toBeNull();
    expect(data.diet).toBeNull();
  });

  it('converts waterLiters to number', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'test-user-id' } });

    const mockLog = {
      id: 'log-1',
      userId: 'test-user-id',
      logDate: '2025-01-15',
      sideEffects: [],
      activityLog: null,
      mentalLog: null,
      dietLog: { id: 'dl-1', hungerLevel: 'Low', mealsCount: 2, proteinGrams: 50, waterLiters: '3.75', notes: null },
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    mockFindFirst.mockResolvedValue(mockLog);

    const request = new NextRequest('http://localhost:3000/api/daily-logs/2025-01-15');
    const response = await GET(request, createContext('2025-01-15'));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.diet.waterLiters).toBe(3.75);
    expect(typeof data.diet.waterLiters).toBe('number');
  });
});

describe('PUT /api/daily-logs/[date]', () => {
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

    const request = new NextRequest('http://localhost:3000/api/daily-logs/2025-01-15', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    const response = await PUT(request, createContext('2025-01-15'));
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });

  it('returns 400 for invalid date format', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'test-user-id' } });

    const request = new NextRequest('http://localhost:3000/api/daily-logs/invalid-date', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    const response = await PUT(request, createContext('invalid-date'));
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Invalid date format. Use YYYY-MM-DD');
  });

  it('creates new log if none exists for date', async () => {
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

    const request = new NextRequest('http://localhost:3000/api/daily-logs/2025-01-15', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ activity: { workoutType: 'Walking' } }),
    });
    const response = await PUT(request, createContext('2025-01-15'));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.id).toBe('new-log-id');
    expect(mockInsert).toHaveBeenCalled();
  });

  it('updates existing log', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'test-user-id' } });
    mockFindFirst
      .mockResolvedValueOnce({ id: 'existing-log-id', userId: 'test-user-id', logDate: '2025-01-15' })
      .mockResolvedValueOnce({
        id: 'existing-log-id',
        userId: 'test-user-id',
        logDate: '2025-01-15',
        sideEffects: [],
        activityLog: { workoutType: 'Cardio', durationMinutes: 45 },
        mentalLog: null,
        dietLog: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

    const request = new NextRequest('http://localhost:3000/api/daily-logs/2025-01-15', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ activity: { workoutType: 'Cardio', durationMinutes: 45 } }),
    });
    const response = await PUT(request, createContext('2025-01-15'));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(mockUpdate).toHaveBeenCalled();
    expect(data.activity.workoutType).toBe('Cardio');
  });

  it('updates side effects', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'test-user-id' } });
    mockFindFirst
      .mockResolvedValueOnce({ id: 'log-id', userId: 'test-user-id', logDate: '2025-01-15' })
      .mockResolvedValueOnce({
        id: 'log-id',
        userId: 'test-user-id',
        logDate: '2025-01-15',
        sideEffects: [{ id: 'se-1', effectType: 'Headache', severity: 'Moderate', notes: null }],
        activityLog: null,
        mentalLog: null,
        dietLog: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

    const request = new NextRequest('http://localhost:3000/api/daily-logs/2025-01-15', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sideEffects: [{ effectType: 'Headache', severity: 'Moderate' }],
      }),
    });
    const response = await PUT(request, createContext('2025-01-15'));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.sideEffects).toHaveLength(1);
    expect(mockDelete).toHaveBeenCalled();
  });

  it('clears side effects with empty array', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'test-user-id' } });
    mockFindFirst
      .mockResolvedValueOnce({ id: 'log-id', userId: 'test-user-id', logDate: '2025-01-15' })
      .mockResolvedValueOnce({
        id: 'log-id',
        userId: 'test-user-id',
        logDate: '2025-01-15',
        sideEffects: [],
        activityLog: null,
        mentalLog: null,
        dietLog: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

    const request = new NextRequest('http://localhost:3000/api/daily-logs/2025-01-15', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sideEffects: [] }),
    });
    const response = await PUT(request, createContext('2025-01-15'));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.sideEffects).toEqual([]);
  });

  it('validates side effect severity', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'test-user-id' } });

    const request = new NextRequest('http://localhost:3000/api/daily-logs/2025-01-15', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sideEffects: [{ effectType: 'Nausea', severity: 'VeryBad' }],
      }),
    });
    const response = await PUT(request, createContext('2025-01-15'));

    expect(response.status).toBe(400);
  });

  it('validates activity workout type', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'test-user-id' } });

    const request = new NextRequest('http://localhost:3000/api/daily-logs/2025-01-15', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        activity: { workoutType: 'Swimming' }, // Not a valid type
      }),
    });
    const response = await PUT(request, createContext('2025-01-15'));

    expect(response.status).toBe(400);
  });

  it('validates mental mood level', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'test-user-id' } });

    const request = new NextRequest('http://localhost:3000/api/daily-logs/2025-01-15', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mental: { moodLevel: 'Amazing' }, // Not a valid level
      }),
    });
    const response = await PUT(request, createContext('2025-01-15'));

    expect(response.status).toBe(400);
  });

  it('validates diet hunger level', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'test-user-id' } });

    const request = new NextRequest('http://localhost:3000/api/daily-logs/2025-01-15', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        diet: { hungerLevel: 'Starving' }, // Not a valid level
      }),
    });
    const response = await PUT(request, createContext('2025-01-15'));

    expect(response.status).toBe(400);
  });

  it('allows nullable fields in activity', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'test-user-id' } });
    mockFindFirst
      .mockResolvedValueOnce({ id: 'log-id', userId: 'test-user-id', logDate: '2025-01-15' })
      .mockResolvedValueOnce({
        id: 'log-id',
        userId: 'test-user-id',
        logDate: '2025-01-15',
        sideEffects: [],
        activityLog: { workoutType: null, durationMinutes: null, steps: 5000, notes: null },
        mentalLog: null,
        dietLog: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

    const request = new NextRequest('http://localhost:3000/api/daily-logs/2025-01-15', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        activity: { workoutType: null, durationMinutes: null, steps: 5000 },
      }),
    });
    const response = await PUT(request, createContext('2025-01-15'));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.activity.steps).toBe(5000);
  });

  it('updates all log sections at once', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'test-user-id' } });
    mockFindFirst
      .mockResolvedValueOnce({ id: 'log-id', userId: 'test-user-id', logDate: '2025-01-15' })
      .mockResolvedValueOnce({
        id: 'log-id',
        userId: 'test-user-id',
        logDate: '2025-01-15',
        sideEffects: [{ id: 'se-1', effectType: 'Nausea', severity: 'Mild', notes: null }],
        activityLog: { workoutType: 'Walking', durationMinutes: 30, steps: 5000, notes: null },
        mentalLog: { moodLevel: 'Good', motivationLevel: 'High', cravingsLevel: 'Low', notes: null },
        dietLog: { hungerLevel: 'Low', mealsCount: 3, proteinGrams: 80, waterLiters: '2.5', notes: null },
        createdAt: new Date(),
        updatedAt: new Date(),
      });

    const request = new NextRequest('http://localhost:3000/api/daily-logs/2025-01-15', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sideEffects: [{ effectType: 'Nausea', severity: 'Mild' }],
        activity: { workoutType: 'Walking', durationMinutes: 30, steps: 5000 },
        mental: { moodLevel: 'Good', motivationLevel: 'High', cravingsLevel: 'Low' },
        diet: { hungerLevel: 'Low', mealsCount: 3, proteinGrams: 80, waterLiters: 2.5 },
      }),
    });
    const response = await PUT(request, createContext('2025-01-15'));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.sideEffects).toHaveLength(1);
    expect(data.activity).toBeDefined();
    expect(data.mental).toBeDefined();
    expect(data.diet).toBeDefined();
  });
});
