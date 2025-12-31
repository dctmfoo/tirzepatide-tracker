import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { GET } from '../route';

// Mock auth
const mockAuth = vi.fn();
vi.mock('@/lib/auth', () => ({
  auth: () => mockAuth(),
}));

// Mock database
const mockSelect = vi.fn();
const mockFrom = vi.fn();
const mockWhere = vi.fn();
const mockFindMany = vi.fn();

vi.mock('@/lib/db', () => ({
  db: {
    select: () => {
      mockSelect();
      return {
        from: () => {
          mockFrom();
          return {
            where: (...args: unknown[]) => {
              mockWhere(...args);
              return Promise.resolve([]);
            },
          };
        },
      };
    },
    query: {
      dailyLogs: {
        findMany: (...args: unknown[]) => mockFindMany(...args),
      },
    },
  },
  schema: {
    weightEntries: {
      userId: 'userId',
      recordedAt: 'recordedAt',
    },
    injections: {
      userId: 'userId',
      injectionDate: 'injectionDate',
    },
    dailyLogs: {
      userId: 'userId',
      logDate: 'logDate',
    },
  },
}));

vi.mock('drizzle-orm', () => ({
  eq: vi.fn((a, b) => ({ type: 'eq', field: a, value: b })),
  and: vi.fn((...args) => ({ type: 'and', conditions: args })),
  gte: vi.fn((a, b) => ({ type: 'gte', field: a, value: b })),
  lte: vi.fn((a, b) => ({ type: 'lte', field: a, value: b })),
}));

const createRouteContext = (year: string, month: string) => ({
  params: Promise.resolve({ year, month }),
});

describe('GET /api/calendar/[year]/[month]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFindMany.mockResolvedValue([]);
  });

  it('returns 401 when not authenticated', async () => {
    mockAuth.mockResolvedValue(null);

    const request = new NextRequest('http://localhost/api/calendar/2025/01');
    const response = await GET(request, createRouteContext('2025', '01'));
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });

  it('returns 400 for invalid year', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-123' } });

    const request = new NextRequest('http://localhost/api/calendar/abc/01');
    const response = await GET(request, createRouteContext('abc', '01'));
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Invalid year or month');
  });

  it('returns 400 for invalid month (0)', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-123' } });

    const request = new NextRequest('http://localhost/api/calendar/2025/00');
    const response = await GET(request, createRouteContext('2025', '00'));
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Invalid year or month');
  });

  it('returns 400 for invalid month (13)', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-123' } });

    const request = new NextRequest('http://localhost/api/calendar/2025/13');
    const response = await GET(request, createRouteContext('2025', '13'));
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Invalid year or month');
  });

  it('returns calendar data for valid month', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-123' } });

    const request = new NextRequest('http://localhost/api/calendar/2025/01');
    const response = await GET(request, createRouteContext('2025', '01'));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.year).toBe(2025);
    expect(data.month).toBe(1);
    expect(data.days).toBeDefined();
    expect(data.summary).toBeDefined();
  });

  it('returns correct number of days for January', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-123' } });

    const request = new NextRequest('http://localhost/api/calendar/2025/01');
    const response = await GET(request, createRouteContext('2025', '01'));
    const data = await response.json();

    expect(data.days.length).toBe(31);
  });

  it('returns correct number of days for February (non-leap year)', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-123' } });

    const request = new NextRequest('http://localhost/api/calendar/2025/02');
    const response = await GET(request, createRouteContext('2025', '02'));
    const data = await response.json();

    expect(data.days.length).toBe(28);
  });

  it('returns correct number of days for February (leap year)', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-123' } });

    const request = new NextRequest('http://localhost/api/calendar/2024/02');
    const response = await GET(request, createRouteContext('2024', '02'));
    const data = await response.json();

    expect(data.days.length).toBe(29);
  });

  it('returns correct number of days for April (30 days)', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-123' } });

    const request = new NextRequest('http://localhost/api/calendar/2025/04');
    const response = await GET(request, createRouteContext('2025', '04'));
    const data = await response.json();

    expect(data.days.length).toBe(30);
  });

  it('returns days with correct structure', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-123' } });

    const request = new NextRequest('http://localhost/api/calendar/2025/01');
    const response = await GET(request, createRouteContext('2025', '01'));
    const data = await response.json();

    const firstDay = data.days[0];
    expect(firstDay).toHaveProperty('date');
    expect(firstDay).toHaveProperty('hasWeight');
    expect(firstDay).toHaveProperty('hasInjection');
    expect(firstDay).toHaveProperty('hasLog');
    expect(firstDay).toHaveProperty('sideEffectsCount');
  });

  it('returns correct date format for each day', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-123' } });

    const request = new NextRequest('http://localhost/api/calendar/2025/01');
    const response = await GET(request, createRouteContext('2025', '01'));
    const data = await response.json();

    expect(data.days[0].date).toBe('2025-01-01');
    expect(data.days[14].date).toBe('2025-01-15');
    expect(data.days[30].date).toBe('2025-01-31');
  });

  it('returns summary with correct structure', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-123' } });

    const request = new NextRequest('http://localhost/api/calendar/2025/01');
    const response = await GET(request, createRouteContext('2025', '01'));
    const data = await response.json();

    expect(data.summary).toHaveProperty('weightEntries');
    expect(data.summary).toHaveProperty('injections');
    expect(data.summary).toHaveProperty('logsCompleted');
    expect(data.summary).toHaveProperty('startWeight');
    expect(data.summary).toHaveProperty('endWeight');
    expect(data.summary).toHaveProperty('monthlyChange');
  });

  it('returns null for weight stats when no entries', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-123' } });

    const request = new NextRequest('http://localhost/api/calendar/2025/01');
    const response = await GET(request, createRouteContext('2025', '01'));
    const data = await response.json();

    expect(data.summary.startWeight).toBeNull();
    expect(data.summary.endWeight).toBeNull();
    expect(data.summary.monthlyChange).toBeNull();
  });

  it('handles single digit month correctly', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-123' } });

    const request = new NextRequest('http://localhost/api/calendar/2025/1');
    const response = await GET(request, createRouteContext('2025', '1'));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.month).toBe(1);
  });

  it('queries database with correct user ID', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'specific-user-123' } });

    const request = new NextRequest('http://localhost/api/calendar/2025/01');
    await GET(request, createRouteContext('2025', '01'));

    expect(mockWhere).toHaveBeenCalled();
  });

  it('returns zero counts for empty month', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-123' } });

    const request = new NextRequest('http://localhost/api/calendar/2025/01');
    const response = await GET(request, createRouteContext('2025', '01'));
    const data = await response.json();

    expect(data.summary.weightEntries).toBe(0);
    expect(data.summary.injections).toBe(0);
    expect(data.summary.logsCompleted).toBe(0);
  });

  it('handles December correctly (month 12)', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-123' } });

    const request = new NextRequest('http://localhost/api/calendar/2025/12');
    const response = await GET(request, createRouteContext('2025', '12'));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.month).toBe(12);
    expect(data.days.length).toBe(31);
  });

  it('initializes all days with default values', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-123' } });

    const request = new NextRequest('http://localhost/api/calendar/2025/01');
    const response = await GET(request, createRouteContext('2025', '01'));
    const data = await response.json();

    data.days.forEach((day: { hasWeight: boolean; hasInjection: boolean; hasLog: boolean; sideEffectsCount: number }) => {
      expect(day.hasWeight).toBe(false);
      expect(day.hasInjection).toBe(false);
      expect(day.hasLog).toBe(false);
      expect(day.sideEffectsCount).toBe(0);
    });
  });
});
