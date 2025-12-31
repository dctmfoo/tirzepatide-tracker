import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET } from '../results/route';

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

vi.mock('@/lib/db', () => ({
  db: {
    query: {
      profiles: {
        findFirst: (...args: unknown[]) => mockFindFirst('profiles', ...args),
      },
      weightEntries: {
        findFirst: (...args: unknown[]) => mockFindFirst('weightEntries', ...args),
      },
    },
    select: () => mockSelect(),
  },
  schema: {
    profiles: { userId: 'userId' },
    weightEntries: { userId: 'userId', recordedAt: 'recordedAt' },
    injections: { userId: 'userId', injectionDate: 'injectionDate' },
  },
}));

// Mock drizzle-orm operators
vi.mock('drizzle-orm', () => ({
  eq: vi.fn((a, b) => ({ type: 'eq', field: a, value: b })),
  and: vi.fn((...conditions) => ({ type: 'and', conditions })),
  gte: vi.fn((a, b) => ({ type: 'gte', field: a, value: b })),
  lte: vi.fn((a, b) => ({ type: 'lte', field: a, value: b })),
  asc: vi.fn((field) => ({ type: 'asc', field })),
}));

describe('GET /api/stats/results', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-01-15T12:00:00Z'));

    mockSelect.mockReturnValue({ from: mockFrom });
    mockFrom.mockReturnValue({ where: mockWhere });
    mockWhere.mockReturnValue({ orderBy: mockOrderBy });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns 401 when not authenticated', async () => {
    mockAuth.mockResolvedValue(null);

    const request = new NextRequest('http://localhost:3000/api/stats/results');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });

  it('returns 401 when session has no user id', async () => {
    mockAuth.mockResolvedValue({ user: {} });

    const request = new NextRequest('http://localhost:3000/api/stats/results');
    const response = await GET(request);

    expect(response.status).toBe(401);
  });

  it('returns empty results for user with no data', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'test-user-id' } });
    mockOrderBy.mockResolvedValue([]);
    mockFindFirst.mockResolvedValue(null);

    const request = new NextRequest('http://localhost:3000/api/stats/results');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.weight.data).toEqual([]);
    expect(data.weight.weeklyAverages).toEqual([]);
    expect(data.weight.stats.start).toBeNull();
    expect(data.injections.data).toEqual([]);
    expect(data.injections.total).toBe(0);
  });

  it('returns weight data formatted for charts', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'test-user-id' } });

    const weightEntries = [
      { id: 'w-1', weightKg: '95.00', recordedAt: new Date('2025-01-10') },
      { id: 'w-2', weightKg: '94.50', recordedAt: new Date('2025-01-12') },
      { id: 'w-3', weightKg: '94.00', recordedAt: new Date('2025-01-15') },
    ];

    let callCount = 0;
    mockOrderBy.mockImplementation(() => {
      callCount++;
      if (callCount === 1) return Promise.resolve(weightEntries);
      return Promise.resolve([]);
    });
    mockFindFirst.mockResolvedValue(null);

    const request = new NextRequest('http://localhost:3000/api/stats/results');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.weight.data).toHaveLength(3);
    expect(data.weight.data[0].weight).toBe(95);
    expect(data.weight.data[2].weight).toBe(94);
  });

  it('calculates weight stats correctly', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'test-user-id' } });

    const weightEntries = [
      { weightKg: '100.00', recordedAt: new Date('2025-01-01') },
      { weightKg: '98.00', recordedAt: new Date('2025-01-05') },
      { weightKg: '95.00', recordedAt: new Date('2025-01-10') },
      { weightKg: '93.00', recordedAt: new Date('2025-01-15') },
    ];

    let callCount = 0;
    mockOrderBy.mockImplementation(() => {
      callCount++;
      if (callCount === 1) return Promise.resolve(weightEntries);
      return Promise.resolve([]);
    });
    mockFindFirst.mockResolvedValue(null);

    const request = new NextRequest('http://localhost:3000/api/stats/results');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.weight.stats.start).toBe(100);
    expect(data.weight.stats.current).toBe(93);
    expect(data.weight.stats.min).toBe(93);
    expect(data.weight.stats.max).toBe(100);
    expect(data.weight.stats.avg).toBe(96.5);
    expect(data.weight.stats.change).toBe(-7);
  });

  it('calculates percent change correctly', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'test-user-id' } });

    const weightEntries = [
      { weightKg: '100.00', recordedAt: new Date('2025-01-01') },
      { weightKg: '90.00', recordedAt: new Date('2025-01-15') },
    ];

    let callCount = 0;
    mockOrderBy.mockImplementation(() => {
      callCount++;
      if (callCount === 1) return Promise.resolve(weightEntries);
      return Promise.resolve([]);
    });
    mockFindFirst.mockResolvedValue(null);

    const request = new NextRequest('http://localhost:3000/api/stats/results');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.weight.stats.percentChange).toBe(-10);
  });

  it('returns injection data formatted for charts', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'test-user-id' } });

    const injections = [
      { id: 'inj-1', doseMg: '2.5', injectionDate: new Date('2025-01-01'), injectionSite: 'abdomen' },
      { id: 'inj-2', doseMg: '2.5', injectionDate: new Date('2025-01-08'), injectionSite: 'thigh_left' },
      { id: 'inj-3', doseMg: '5', injectionDate: new Date('2025-01-15'), injectionSite: 'abdomen' },
    ];

    let callCount = 0;
    mockOrderBy.mockImplementation(() => {
      callCount++;
      if (callCount === 1) return Promise.resolve([]);
      if (callCount === 2) return Promise.resolve(injections);
      return Promise.resolve([]);
    });
    mockFindFirst.mockResolvedValue(null);

    const request = new NextRequest('http://localhost:3000/api/stats/results');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.injections.data).toHaveLength(3);
    expect(data.injections.data[0].dose).toBe(2.5);
    expect(data.injections.data[0].site).toBe('abdomen');
    expect(data.injections.total).toBe(3);
    expect(data.injections.currentDose).toBe(5);
  });

  it('calculates dose history showing only changes', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'test-user-id' } });

    const injections = [
      { doseMg: '2.5', injectionDate: new Date('2025-01-01'), injectionSite: 'abdomen' },
      { doseMg: '2.5', injectionDate: new Date('2025-01-08'), injectionSite: 'thigh_left' },
      { doseMg: '5', injectionDate: new Date('2025-01-15'), injectionSite: 'abdomen' },
      { doseMg: '5', injectionDate: new Date('2025-01-22'), injectionSite: 'thigh_right' },
      { doseMg: '7.5', injectionDate: new Date('2025-01-29'), injectionSite: 'abdomen' },
    ];

    let callCount = 0;
    mockOrderBy.mockImplementation(() => {
      callCount++;
      if (callCount === 1) return Promise.resolve([]);
      if (callCount === 2) return Promise.resolve(injections);
      return Promise.resolve([]);
    });
    mockFindFirst.mockResolvedValue(null);

    const request = new NextRequest('http://localhost:3000/api/stats/results');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.injections.doseHistory).toHaveLength(3);
    expect(data.injections.doseHistory[0].dose).toBe(2.5);
    expect(data.injections.doseHistory[1].dose).toBe(5);
    expect(data.injections.doseHistory[2].dose).toBe(7.5);
  });

  it('calculates weekly averages correctly', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'test-user-id' } });

    const weightEntries = [
      { weightKg: '95.00', recordedAt: new Date('2025-01-13') },
      { weightKg: '94.00', recordedAt: new Date('2025-01-14') },
      { weightKg: '94.50', recordedAt: new Date('2025-01-15') },
    ];

    let callCount = 0;
    mockOrderBy.mockImplementation(() => {
      callCount++;
      if (callCount === 1) return Promise.resolve(weightEntries);
      return Promise.resolve([]);
    });
    mockFindFirst.mockResolvedValue(null);

    const request = new NextRequest('http://localhost:3000/api/stats/results');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.weight.weeklyAverages).toHaveLength(1);
    expect(data.weight.weeklyAverages[0].weekStart).toBe('2025-01-13');
    expect(data.weight.weeklyAverages[0].avgWeight).toBe(94.5);
  });

  it('handles multiple weeks in weekly averages', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'test-user-id' } });

    const weightEntries = [
      { weightKg: '96.00', recordedAt: new Date('2025-01-06') },
      { weightKg: '95.00', recordedAt: new Date('2025-01-07') },
      { weightKg: '94.00', recordedAt: new Date('2025-01-13') },
      { weightKg: '93.00', recordedAt: new Date('2025-01-14') },
    ];

    let callCount = 0;
    mockOrderBy.mockImplementation(() => {
      callCount++;
      if (callCount === 1) return Promise.resolve(weightEntries);
      return Promise.resolve([]);
    });
    mockFindFirst.mockResolvedValue(null);

    const request = new NextRequest('http://localhost:3000/api/stats/results');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.weight.weeklyAverages).toHaveLength(2);
    expect(data.weight.weeklyAverages[0].avgWeight).toBe(95.5);
    expect(data.weight.weeklyAverages[1].avgWeight).toBe(93.5);
  });

  it('respects period=3m filter', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'test-user-id' } });
    mockOrderBy.mockResolvedValue([]);
    mockFindFirst.mockResolvedValue(null);

    const request = new NextRequest('http://localhost:3000/api/stats/results?period=3m');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    const startDate = new Date(data.period.start);
    const expectedStart = new Date('2024-10-15');
    expect(startDate.getMonth()).toBe(expectedStart.getMonth());
  });

  it('respects period=6m filter', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'test-user-id' } });
    mockOrderBy.mockResolvedValue([]);
    mockFindFirst.mockResolvedValue(null);

    const request = new NextRequest('http://localhost:3000/api/stats/results?period=6m');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    const startDate = new Date(data.period.start);
    const expectedStart = new Date('2024-07-15');
    expect(startDate.getMonth()).toBe(expectedStart.getMonth());
  });

  it('respects period=1y filter', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'test-user-id' } });
    mockOrderBy.mockResolvedValue([]);
    mockFindFirst.mockResolvedValue(null);

    const request = new NextRequest('http://localhost:3000/api/stats/results?period=1y');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    const startDate = new Date(data.period.start);
    expect(startDate.getFullYear()).toBe(2024);
  });

  it('respects period=all (no date filter)', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'test-user-id' } });

    const firstEntry = { recordedAt: new Date('2024-01-01') };
    mockOrderBy.mockResolvedValue([]);
    mockFindFirst.mockImplementation((table: string) => {
      if (table === 'weightEntries') return Promise.resolve(firstEntry);
      return Promise.resolve(null);
    });

    const request = new NextRequest('http://localhost:3000/api/stats/results?period=all');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.period.start).toContain('2024-01-01');
  });

  it('includes profile goal and starting weight', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'test-user-id' } });
    mockOrderBy.mockResolvedValue([]);
    mockFindFirst.mockImplementation((table: string) => {
      if (table === 'profiles') {
        return Promise.resolve({
          startingWeightKg: '100.00',
          goalWeightKg: '80.00',
        });
      }
      return Promise.resolve(null);
    });

    const request = new NextRequest('http://localhost:3000/api/stats/results');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.weight.goal).toBe(80);
    expect(data.weight.starting).toBe(100);
  });

  it('returns null currentDose when no injections', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'test-user-id' } });
    mockOrderBy.mockResolvedValue([]);
    mockFindFirst.mockResolvedValue(null);

    const request = new NextRequest('http://localhost:3000/api/stats/results');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.injections.currentDose).toBeNull();
    expect(data.injections.doseHistory).toEqual([]);
  });
});
