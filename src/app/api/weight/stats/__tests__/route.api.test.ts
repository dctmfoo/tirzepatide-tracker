import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { GET } from '../route';

// Mock auth module
const mockAuth = vi.fn();
vi.mock('@/lib/auth', () => ({
  auth: () => mockAuth(),
}));

// Mock database methods
const mockSelect = vi.fn().mockReturnThis();
const mockFrom = vi.fn().mockReturnThis();
const mockWhere = vi.fn().mockReturnThis();
const mockOrderBy = vi.fn();
const mockFindFirst = vi.fn();

vi.mock('@/lib/db', () => ({
  db: {
    select: () => mockSelect(),
    query: {
      profiles: {
        findFirst: (...args: unknown[]) => mockFindFirst(...args),
      },
      weightEntries: {
        findFirst: (...args: unknown[]) => mockFindFirst(...args),
      },
    },
  },
  schema: {
    weightEntries: {
      userId: 'userId',
      recordedAt: 'recordedAt',
    },
    profiles: {
      userId: 'userId',
    },
  },
}));

// Mock drizzle-orm operators
vi.mock('drizzle-orm', () => ({
  eq: vi.fn((a, b) => ({ type: 'eq', field: a, value: b })),
  and: vi.fn((...conditions) => ({ type: 'and', conditions })),
  gte: vi.fn((a, b) => ({ type: 'gte', field: a, value: b })),
  lte: vi.fn((a, b) => ({ type: 'lte', field: a, value: b })),
  asc: vi.fn((field) => ({ type: 'asc', field })),
  desc: vi.fn((field) => ({ type: 'desc', field })),
}));

describe('GET /api/weight/stats', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSelect.mockReturnValue({ from: mockFrom });
    mockFrom.mockReturnValue({ where: mockWhere });
    mockWhere.mockReturnValue({ orderBy: mockOrderBy });
  });

  it('returns 401 when not authenticated', async () => {
    mockAuth.mockResolvedValue(null);

    const request = new NextRequest('http://localhost:3000/api/weight/stats');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });

  it('returns 401 when session has no user id', async () => {
    mockAuth.mockResolvedValue({ user: {} });

    const request = new NextRequest('http://localhost:3000/api/weight/stats');
    const response = await GET(request);

    expect(response.status).toBe(401);
  });

  it('returns empty stats when no weight entries exist', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'test-user-id' } });
    mockOrderBy.mockResolvedValue([]);

    const request = new NextRequest('http://localhost:3000/api/weight/stats');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.count).toBe(0);
    expect(data.startWeight).toBeNull();
    expect(data.endWeight).toBeNull();
    expect(data.minWeight).toBeNull();
    expect(data.maxWeight).toBeNull();
    expect(data.avgWeight).toBeNull();
    expect(data.totalChange).toBeNull();
    expect(data.percentChange).toBeNull();
  });

  it('calculates period stats correctly for single entry', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'test-user-id' } });

    const entries = [
      { id: '1', weightKg: '85', recordedAt: new Date('2025-01-15') },
    ];
    mockOrderBy.mockResolvedValue(entries);

    // Mock profile and weight queries for overall stats
    mockFindFirst
      .mockResolvedValueOnce({ startingWeightKg: '90', goalWeightKg: '75' }) // profile
      .mockResolvedValueOnce({ weightKg: '85', recordedAt: new Date('2025-01-01') }) // first ever
      .mockResolvedValueOnce({ weightKg: '85', recordedAt: new Date('2025-01-15') }); // latest

    const request = new NextRequest('http://localhost:3000/api/weight/stats');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.period.count).toBe(1);
    expect(data.period.startWeight).toBe(85);
    expect(data.period.endWeight).toBe(85);
    expect(data.period.minWeight).toBe(85);
    expect(data.period.maxWeight).toBe(85);
    expect(data.period.avgWeight).toBe(85);
    expect(data.period.totalChange).toBe(0);
    expect(data.period.percentChange).toBe(0);
  });

  it('calculates period stats correctly for multiple entries', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'test-user-id' } });

    const entries = [
      { id: '1', weightKg: '90', recordedAt: new Date('2025-01-01') },
      { id: '2', weightKg: '88', recordedAt: new Date('2025-01-08') },
      { id: '3', weightKg: '86', recordedAt: new Date('2025-01-15') },
      { id: '4', weightKg: '85', recordedAt: new Date('2025-01-22') },
    ];
    mockOrderBy.mockResolvedValue(entries);

    mockFindFirst
      .mockResolvedValueOnce({ startingWeightKg: '90', goalWeightKg: '75' })
      .mockResolvedValueOnce({ weightKg: '90', recordedAt: new Date('2025-01-01') })
      .mockResolvedValueOnce({ weightKg: '85', recordedAt: new Date('2025-01-22') });

    const request = new NextRequest('http://localhost:3000/api/weight/stats');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.period.count).toBe(4);
    expect(data.period.startWeight).toBe(90);
    expect(data.period.endWeight).toBe(85);
    expect(data.period.minWeight).toBe(85);
    expect(data.period.maxWeight).toBe(90);
    expect(data.period.avgWeight).toBe(87.25); // (90+88+86+85)/4
    expect(data.period.totalChange).toBe(-5); // 85-90
    expect(data.period.percentChange).toBeCloseTo(-5.56, 1); // (-5/90)*100
  });

  it('calculates overall stats with profile data', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'test-user-id' } });

    const entries = [
      { id: '1', weightKg: '85', recordedAt: new Date('2025-01-15') },
    ];
    mockOrderBy.mockResolvedValue(entries);

    mockFindFirst
      .mockResolvedValueOnce({ startingWeightKg: '95', goalWeightKg: '75' }) // profile
      .mockResolvedValueOnce({ weightKg: '95', recordedAt: new Date('2024-12-01') }) // first ever
      .mockResolvedValueOnce({ weightKg: '85', recordedAt: new Date('2025-01-15') }); // latest

    const request = new NextRequest('http://localhost:3000/api/weight/stats');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.overall.startingWeight).toBe(95);
    expect(data.overall.currentWeight).toBe(85);
    expect(data.overall.goalWeight).toBe(75);
    expect(data.overall.totalLost).toBe(10); // 95-85
    expect(data.overall.remainingToGoal).toBe(10); // 85-75
    expect(data.overall.progressPercent).toBe(50); // (10/20)*100
  });

  it('handles date range filtering with startDate parameter', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'test-user-id' } });

    const entries = [
      { id: '1', weightKg: '86', recordedAt: new Date('2025-01-10') },
      { id: '2', weightKg: '85', recordedAt: new Date('2025-01-15') },
    ];
    mockOrderBy.mockResolvedValue(entries);

    mockFindFirst
      .mockResolvedValueOnce({ startingWeightKg: '90', goalWeightKg: '75' })
      .mockResolvedValueOnce({ weightKg: '90', recordedAt: new Date('2025-01-01') })
      .mockResolvedValueOnce({ weightKg: '85', recordedAt: new Date('2025-01-15') });

    const request = new NextRequest(
      'http://localhost:3000/api/weight/stats?startDate=2025-01-10'
    );
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.period.count).toBe(2);
  });

  it('handles date range filtering with endDate parameter', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'test-user-id' } });

    const entries = [
      { id: '1', weightKg: '88', recordedAt: new Date('2025-01-05') },
      { id: '2', weightKg: '87', recordedAt: new Date('2025-01-10') },
    ];
    mockOrderBy.mockResolvedValue(entries);

    mockFindFirst
      .mockResolvedValueOnce({ startingWeightKg: '90', goalWeightKg: '75' })
      .mockResolvedValueOnce({ weightKg: '90', recordedAt: new Date('2025-01-01') })
      .mockResolvedValueOnce({ weightKg: '85', recordedAt: new Date('2025-01-20') });

    const request = new NextRequest(
      'http://localhost:3000/api/weight/stats?endDate=2025-01-15'
    );
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.period.count).toBe(2);
  });

  it('handles date range filtering with both startDate and endDate', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'test-user-id' } });

    const entries = [
      { id: '1', weightKg: '87', recordedAt: new Date('2025-01-10') },
      { id: '2', weightKg: '86', recordedAt: new Date('2025-01-15') },
    ];
    mockOrderBy.mockResolvedValue(entries);

    mockFindFirst
      .mockResolvedValueOnce({ startingWeightKg: '90', goalWeightKg: '75' })
      .mockResolvedValueOnce({ weightKg: '90', recordedAt: new Date('2025-01-01') })
      .mockResolvedValueOnce({ weightKg: '85', recordedAt: new Date('2025-01-25') });

    const request = new NextRequest(
      'http://localhost:3000/api/weight/stats?startDate=2025-01-08&endDate=2025-01-20'
    );
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.period.count).toBe(2);
  });

  it('handles user without profile (uses first weight as starting weight)', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'test-user-id' } });

    const entries = [
      { id: '1', weightKg: '85', recordedAt: new Date('2025-01-15') },
    ];
    mockOrderBy.mockResolvedValue(entries);

    mockFindFirst
      .mockResolvedValueOnce(null) // no profile
      .mockResolvedValueOnce({ weightKg: '90', recordedAt: new Date('2025-01-01') }) // first ever
      .mockResolvedValueOnce({ weightKg: '85', recordedAt: new Date('2025-01-15') }); // latest

    const request = new NextRequest('http://localhost:3000/api/weight/stats');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.overall.startingWeight).toBe(90);
    expect(data.overall.currentWeight).toBe(85);
    expect(data.overall.goalWeight).toBeNull();
    expect(data.overall.progressPercent).toBeNull(); // Can't calculate without goal
  });

  it('handles weight gain (positive change)', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'test-user-id' } });

    const entries = [
      { id: '1', weightKg: '80', recordedAt: new Date('2025-01-01') },
      { id: '2', weightKg: '82', recordedAt: new Date('2025-01-08') },
      { id: '3', weightKg: '85', recordedAt: new Date('2025-01-15') },
    ];
    mockOrderBy.mockResolvedValue(entries);

    mockFindFirst
      .mockResolvedValueOnce({ startingWeightKg: '80', goalWeightKg: '75' })
      .mockResolvedValueOnce({ weightKg: '80', recordedAt: new Date('2025-01-01') })
      .mockResolvedValueOnce({ weightKg: '85', recordedAt: new Date('2025-01-15') });

    const request = new NextRequest('http://localhost:3000/api/weight/stats');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.period.totalChange).toBe(5); // 85-80 = +5
    expect(data.period.percentChange).toBeCloseTo(6.25, 1); // (5/80)*100
    expect(data.overall.totalLost).toBe(-5); // Started at 80, now at 85
  });

  it('calculates correct progress percentage at 100% goal reached', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'test-user-id' } });

    const entries = [
      { id: '1', weightKg: '75', recordedAt: new Date('2025-01-15') },
    ];
    mockOrderBy.mockResolvedValue(entries);

    mockFindFirst
      .mockResolvedValueOnce({ startingWeightKg: '90', goalWeightKg: '75' })
      .mockResolvedValueOnce({ weightKg: '90', recordedAt: new Date('2024-12-01') })
      .mockResolvedValueOnce({ weightKg: '75', recordedAt: new Date('2025-01-15') });

    const request = new NextRequest('http://localhost:3000/api/weight/stats');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.overall.progressPercent).toBe(100);
    expect(data.overall.remainingToGoal).toBe(0);
  });

  it('calculates correct progress percentage when past goal', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'test-user-id' } });

    const entries = [
      { id: '1', weightKg: '73', recordedAt: new Date('2025-01-15') },
    ];
    mockOrderBy.mockResolvedValue(entries);

    mockFindFirst
      .mockResolvedValueOnce({ startingWeightKg: '90', goalWeightKg: '75' })
      .mockResolvedValueOnce({ weightKg: '90', recordedAt: new Date('2024-12-01') })
      .mockResolvedValueOnce({ weightKg: '73', recordedAt: new Date('2025-01-15') });

    const request = new NextRequest('http://localhost:3000/api/weight/stats');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    // Lost 17kg out of 15kg goal, so 113.3% progress
    expect(data.overall.progressPercent).toBeCloseTo(113.3, 0);
    expect(data.overall.remainingToGoal).toBe(-2); // 2kg below goal
  });

  it('rounds values to 2 decimal places', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'test-user-id' } });

    const entries = [
      { id: '1', weightKg: '85.333', recordedAt: new Date('2025-01-01') },
      { id: '2', weightKg: '84.666', recordedAt: new Date('2025-01-08') },
      { id: '3', weightKg: '84.111', recordedAt: new Date('2025-01-15') },
    ];
    mockOrderBy.mockResolvedValue(entries);

    mockFindFirst
      .mockResolvedValueOnce({ startingWeightKg: '85.333', goalWeightKg: '75' })
      .mockResolvedValueOnce({ weightKg: '85.333', recordedAt: new Date('2025-01-01') })
      .mockResolvedValueOnce({ weightKg: '84.111', recordedAt: new Date('2025-01-15') });

    const request = new NextRequest('http://localhost:3000/api/weight/stats');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    // Verify decimal precision
    expect(String(data.period.startWeight).split('.')[1]?.length || 0).toBeLessThanOrEqual(2);
    expect(String(data.period.avgWeight).split('.')[1]?.length || 0).toBeLessThanOrEqual(2);
  });
});
