import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET } from '../week-summary/route';

// Mock auth module
const mockAuth = vi.fn();
vi.mock('@/lib/auth', () => ({
  auth: () => mockAuth(),
}));

// Mock database query methods
const mockFindMany = vi.fn();

vi.mock('@/lib/db', () => ({
  db: {
    query: {
      dailyLogs: {
        findMany: (...args: unknown[]) => mockFindMany(...args),
      },
    },
  },
  schema: {
    dailyLogs: {
      userId: 'userId',
      logDate: 'logDate',
    },
  },
}));

// Mock drizzle-orm operators
vi.mock('drizzle-orm', () => ({
  eq: vi.fn((a, b) => ({ type: 'eq', field: a, value: b })),
  and: vi.fn((...conditions) => ({ type: 'and', conditions })),
  gte: vi.fn((a, b) => ({ type: 'gte', field: a, value: b })),
  lte: vi.fn((a, b) => ({ type: 'lte', field: a, value: b })),
}));

describe('GET /api/daily-logs/week-summary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    // Set to Wednesday, Jan 15, 2025
    vi.setSystemTime(new Date('2025-01-15T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns 401 when not authenticated', async () => {
    mockAuth.mockResolvedValue(null);

    const request = new NextRequest('http://localhost:3000/api/daily-logs/week-summary');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });

  it('returns 401 when session has no user id', async () => {
    mockAuth.mockResolvedValue({ user: {} });

    const request = new NextRequest('http://localhost:3000/api/daily-logs/week-summary');
    const response = await GET(request);

    expect(response.status).toBe(401);
  });

  it('returns empty summary for week with no logs', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'test-user-id' } });
    mockFindMany.mockResolvedValue([]);

    const request = new NextRequest('http://localhost:3000/api/daily-logs/week-summary');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.daysLogged).toBe(0);
    expect(data.sideEffects).toEqual([]);
    expect(data.activity.workoutDays).toBe(0);
    expect(data.activity.totalMinutes).toBe(0);
    expect(data.mental.moods).toEqual([]);
    expect(data.diet.daysLogged).toBe(0);
  });

  it('calculates correct week start (Monday) for current week', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'test-user-id' } });
    mockFindMany.mockResolvedValue([]);

    const request = new NextRequest('http://localhost:3000/api/daily-logs/week-summary');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    // Jan 15 is Wednesday, so week starts Monday Jan 13
    expect(data.weekStart).toBe('2025-01-13');
    expect(data.weekEnd).toBe('2025-01-19');
  });

  it('uses weekOf parameter to calculate different week', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'test-user-id' } });
    mockFindMany.mockResolvedValue([]);

    const request = new NextRequest('http://localhost:3000/api/daily-logs/week-summary?weekOf=2025-01-01');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    // Jan 1 is Wednesday, so week starts Monday Dec 30, 2024
    expect(data.weekStart).toBe('2024-12-30');
    expect(data.weekEnd).toBe('2025-01-05');
  });

  it('counts days logged correctly', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'test-user-id' } });

    const mockLogs = [
      { id: 'log-1', logDate: '2025-01-13', sideEffects: [], activityLog: null, mentalLog: null, dietLog: null },
      { id: 'log-2', logDate: '2025-01-14', sideEffects: [], activityLog: null, mentalLog: null, dietLog: null },
      { id: 'log-3', logDate: '2025-01-15', sideEffects: [], activityLog: null, mentalLog: null, dietLog: null },
    ];
    mockFindMany.mockResolvedValue(mockLogs);

    const request = new NextRequest('http://localhost:3000/api/daily-logs/week-summary');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.daysLogged).toBe(3);
  });

  it('aggregates side effects correctly', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'test-user-id' } });

    const mockLogs = [
      {
        id: 'log-1',
        logDate: '2025-01-13',
        sideEffects: [
          { effectType: 'Nausea', severity: 'Mild' },
          { effectType: 'Fatigue', severity: 'Moderate' },
        ],
        activityLog: null,
        mentalLog: null,
        dietLog: null,
      },
      {
        id: 'log-2',
        logDate: '2025-01-14',
        sideEffects: [
          { effectType: 'Nausea', severity: 'Severe' },
        ],
        activityLog: null,
        mentalLog: null,
        dietLog: null,
      },
    ];
    mockFindMany.mockResolvedValue(mockLogs);

    const request = new NextRequest('http://localhost:3000/api/daily-logs/week-summary');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.sideEffects).toHaveLength(2);

    const nausea = data.sideEffects.find((se: { type: string }) => se.type === 'Nausea');
    expect(nausea.occurrences).toBe(2);
    expect(nausea.severities).toContain('Mild');
    expect(nausea.severities).toContain('Severe');

    const fatigue = data.sideEffects.find((se: { type: string }) => se.type === 'Fatigue');
    expect(fatigue.occurrences).toBe(1);
  });

  it('calculates activity summary correctly', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'test-user-id' } });

    const mockLogs = [
      {
        id: 'log-1',
        logDate: '2025-01-13',
        sideEffects: [],
        activityLog: { workoutType: 'Walking', durationMinutes: 30, steps: 5000, notes: null },
        mentalLog: null,
        dietLog: null,
      },
      {
        id: 'log-2',
        logDate: '2025-01-14',
        sideEffects: [],
        activityLog: { workoutType: 'Cardio', durationMinutes: 45, steps: 3000, notes: null },
        mentalLog: null,
        dietLog: null,
      },
      {
        id: 'log-3',
        logDate: '2025-01-15',
        sideEffects: [],
        activityLog: { workoutType: 'Rest day', durationMinutes: null, steps: 2000, notes: null },
        mentalLog: null,
        dietLog: null,
      },
    ];
    mockFindMany.mockResolvedValue(mockLogs);

    const request = new NextRequest('http://localhost:3000/api/daily-logs/week-summary');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.activity.workoutDays).toBe(2); // Only days with duration
    expect(data.activity.totalMinutes).toBe(75); // 30 + 45
    expect(data.activity.avgMinutesPerWorkout).toBe(38); // 75/2 rounded
    expect(data.activity.totalSteps).toBe(10000); // 5000 + 3000 + 2000
    expect(data.activity.avgDailySteps).toBe(3333); // 10000/3 rounded
    expect(data.activity.workoutTypes['Walking']).toBe(1);
    expect(data.activity.workoutTypes['Cardio']).toBe(1);
    expect(data.activity.workoutTypes['Rest day']).toBe(1);
  });

  it('collects mental data correctly', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'test-user-id' } });

    const mockLogs = [
      {
        id: 'log-1',
        logDate: '2025-01-13',
        sideEffects: [],
        activityLog: null,
        mentalLog: { moodLevel: 'Good', motivationLevel: 'High', cravingsLevel: 'Low', notes: null },
        dietLog: null,
      },
      {
        id: 'log-2',
        logDate: '2025-01-14',
        sideEffects: [],
        activityLog: null,
        mentalLog: { moodLevel: 'Great', motivationLevel: 'Medium', cravingsLevel: 'None', notes: null },
        dietLog: null,
      },
    ];
    mockFindMany.mockResolvedValue(mockLogs);

    const request = new NextRequest('http://localhost:3000/api/daily-logs/week-summary');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.mental.moods).toContain('Good');
    expect(data.mental.moods).toContain('Great');
    expect(data.mental.motivations).toContain('High');
    expect(data.mental.motivations).toContain('Medium');
    expect(data.mental.cravings).toContain('Low');
    expect(data.mental.cravings).toContain('None');
  });

  it('calculates diet summary correctly', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'test-user-id' } });

    const mockLogs = [
      {
        id: 'log-1',
        logDate: '2025-01-13',
        sideEffects: [],
        activityLog: null,
        mentalLog: null,
        dietLog: { hungerLevel: 'Low', mealsCount: 3, proteinGrams: 80, waterLiters: '2.5', notes: null },
      },
      {
        id: 'log-2',
        logDate: '2025-01-14',
        sideEffects: [],
        activityLog: null,
        mentalLog: null,
        dietLog: { hungerLevel: 'Moderate', mealsCount: 4, proteinGrams: 100, waterLiters: '3.0', notes: null },
      },
    ];
    mockFindMany.mockResolvedValue(mockLogs);

    const request = new NextRequest('http://localhost:3000/api/daily-logs/week-summary');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.diet.daysLogged).toBe(2);
    expect(data.diet.totalMeals).toBe(7); // 3 + 4
    expect(data.diet.avgMealsPerDay).toBe(3.5); // 7/2
    expect(data.diet.totalProteinGrams).toBe(180); // 80 + 100
    expect(data.diet.avgProteinPerDay).toBe(90); // 180/2
    expect(data.diet.totalWaterLiters).toBe(5.5); // 2.5 + 3.0
    expect(data.diet.avgWaterPerDay).toBe(2.75); // 5.5/2
  });

  it('handles logs with null related data', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'test-user-id' } });

    const mockLogs = [
      {
        id: 'log-1',
        logDate: '2025-01-13',
        sideEffects: [],
        activityLog: null,
        mentalLog: null,
        dietLog: null,
      },
    ];
    mockFindMany.mockResolvedValue(mockLogs);

    const request = new NextRequest('http://localhost:3000/api/daily-logs/week-summary');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.daysLogged).toBe(1);
    expect(data.activity.workoutDays).toBe(0);
    expect(data.diet.daysLogged).toBe(0);
  });

  it('handles Sunday correctly for week start calculation', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'test-user-id' } });
    mockFindMany.mockResolvedValue([]);

    // Sunday Jan 19, 2025
    const request = new NextRequest('http://localhost:3000/api/daily-logs/week-summary?weekOf=2025-01-19');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    // Sunday belongs to the week starting Monday Jan 13
    expect(data.weekStart).toBe('2025-01-13');
    expect(data.weekEnd).toBe('2025-01-19');
  });

  it('handles Monday correctly for week start calculation', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'test-user-id' } });
    mockFindMany.mockResolvedValue([]);

    // Monday Jan 13, 2025
    const request = new NextRequest('http://localhost:3000/api/daily-logs/week-summary?weekOf=2025-01-13');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.weekStart).toBe('2025-01-13');
    expect(data.weekEnd).toBe('2025-01-19');
  });

  it('handles partial diet data', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'test-user-id' } });

    const mockLogs = [
      {
        id: 'log-1',
        logDate: '2025-01-13',
        sideEffects: [],
        activityLog: null,
        mentalLog: null,
        dietLog: { hungerLevel: 'Low', mealsCount: null, proteinGrams: null, waterLiters: null, notes: null },
      },
    ];
    mockFindMany.mockResolvedValue(mockLogs);

    const request = new NextRequest('http://localhost:3000/api/daily-logs/week-summary');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.diet.daysLogged).toBe(1);
    expect(data.diet.totalMeals).toBe(0);
    expect(data.diet.totalProteinGrams).toBe(0);
    expect(data.diet.totalWaterLiters).toBe(0);
  });

  it('handles partial mental data with null fields', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'test-user-id' } });

    const mockLogs = [
      {
        id: 'log-1',
        logDate: '2025-01-13',
        sideEffects: [],
        activityLog: null,
        mentalLog: { moodLevel: 'Good', motivationLevel: null, cravingsLevel: null, notes: null },
        dietLog: null,
      },
    ];
    mockFindMany.mockResolvedValue(mockLogs);

    const request = new NextRequest('http://localhost:3000/api/daily-logs/week-summary');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.mental.moods).toEqual(['Good']);
    expect(data.mental.motivations).toEqual([]);
    expect(data.mental.cravings).toEqual([]);
  });
});
