import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { GET } from '../next-due/route';

// Mock auth module
const mockAuth = vi.fn();
vi.mock('@/lib/auth', () => ({
  auth: () => mockAuth(),
}));

// Mock database query methods
const mockFindFirstInjections = vi.fn();
const mockFindFirstProfiles = vi.fn();

vi.mock('@/lib/db', () => ({
  db: {
    query: {
      injections: {
        findFirst: (...args: unknown[]) => mockFindFirstInjections(...args),
      },
      profiles: {
        findFirst: (...args: unknown[]) => mockFindFirstProfiles(...args),
      },
    },
  },
  schema: {
    injections: {
      userId: 'userId',
      injectionDate: 'injectionDate',
    },
    profiles: {
      userId: 'userId',
    },
  },
}));

// Mock drizzle-orm operators
vi.mock('drizzle-orm', () => ({
  eq: vi.fn((a, b) => ({ type: 'eq', field: a, value: b })),
  desc: vi.fn((field) => ({ type: 'desc', field })),
}));

describe('GET /api/injections/next-due', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Use fixed time for predictable test results
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-01-15T12:00:00Z'));
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

  it('returns not_started status when no previous injections', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'test-user-id' } });
    mockFindFirstInjections.mockResolvedValue(null);
    mockFindFirstProfiles.mockResolvedValue(null);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.status).toBe('not_started');
    expect(data.lastInjection).toBeNull();
  });

  it('uses treatment start date when no previous injections and profile exists', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'test-user-id' } });
    mockFindFirstInjections.mockResolvedValue(null);
    mockFindFirstProfiles.mockResolvedValue({
      userId: 'test-user-id',
      treatmentStartDate: new Date('2025-01-20'),
      preferredInjectionDay: 'monday',
    });

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.status).toBe('not_started');
    expect(data.daysUntilDue).toBe(5); // Jan 20 - Jan 15 = 5 days
    expect(data.preferredDay).toBe('monday');
  });

  it('returns on_track status when next due is more than 2 days away', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'test-user-id' } });

    // Last injection was 3 days ago, so next due is 4 days away
    const lastInjectionDate = new Date('2025-01-12T10:00:00Z');
    mockFindFirstInjections.mockResolvedValue({
      id: 'last-inj',
      userId: 'test-user-id',
      doseMg: '5',
      injectionDate: lastInjectionDate,
    });
    mockFindFirstProfiles.mockResolvedValue({
      preferredInjectionDay: 'saturday',
    });

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.status).toBe('on_track');
    expect(data.daysUntilDue).toBe(4);
    expect(data.lastInjection).toBeDefined();
    expect(data.lastInjection.id).toBe('last-inj');
    expect(data.lastInjection.doseMg).toBe(5);
    expect(data.lastInjection.daysSince).toBe(3);
  });

  it('returns due_soon status when 1-2 days until due', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'test-user-id' } });

    // Last injection was 6 days ago, so next due is 1 day away
    const lastInjectionDate = new Date('2025-01-09T10:00:00Z');
    mockFindFirstInjections.mockResolvedValue({
      id: 'last-inj',
      userId: 'test-user-id',
      doseMg: '7.5',
      injectionDate: lastInjectionDate,
    });
    mockFindFirstProfiles.mockResolvedValue(null);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.status).toBe('due_soon');
    expect(data.daysUntilDue).toBe(1);
  });

  it('returns due_today status when exactly 7 days since last injection', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'test-user-id' } });

    // Last injection was exactly 7 days ago
    const lastInjectionDate = new Date('2025-01-08T12:00:00Z');
    mockFindFirstInjections.mockResolvedValue({
      id: 'last-inj',
      userId: 'test-user-id',
      doseMg: '10',
      injectionDate: lastInjectionDate,
    });
    mockFindFirstProfiles.mockResolvedValue(null);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.status).toBe('due_today');
    expect(data.daysUntilDue).toBe(0);
  });

  it('returns overdue status when more than 7 days since last injection', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'test-user-id' } });

    // Last injection was 10 days ago, so 3 days overdue
    const lastInjectionDate = new Date('2025-01-05T10:00:00Z');
    mockFindFirstInjections.mockResolvedValue({
      id: 'last-inj',
      userId: 'test-user-id',
      doseMg: '12.5',
      injectionDate: lastInjectionDate,
    });
    mockFindFirstProfiles.mockResolvedValue(null);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.status).toBe('overdue');
    expect(data.daysUntilDue).toBe(-3);
  });

  it('includes preferred day from profile', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'test-user-id' } });

    mockFindFirstInjections.mockResolvedValue({
      id: 'last-inj',
      userId: 'test-user-id',
      doseMg: '5',
      injectionDate: new Date('2025-01-14T10:00:00Z'),
    });
    mockFindFirstProfiles.mockResolvedValue({
      preferredInjectionDay: 'wednesday',
    });

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.preferredDay).toBe('wednesday');
  });

  it('returns null preferredDay when profile has none', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'test-user-id' } });

    mockFindFirstInjections.mockResolvedValue({
      id: 'last-inj',
      userId: 'test-user-id',
      doseMg: '5',
      injectionDate: new Date('2025-01-14T10:00:00Z'),
    });
    mockFindFirstProfiles.mockResolvedValue({
      preferredInjectionDay: null,
    });

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.preferredDay).toBeNull();
  });

  it('calculates next due date correctly', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'test-user-id' } });

    const lastInjectionDate = new Date('2025-01-10T10:00:00Z');
    mockFindFirstInjections.mockResolvedValue({
      id: 'last-inj',
      userId: 'test-user-id',
      doseMg: '5',
      injectionDate: lastInjectionDate,
    });
    mockFindFirstProfiles.mockResolvedValue(null);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    // Next due = Jan 10 + 7 days = Jan 17
    const nextDueDate = new Date(data.nextDueDate);
    expect(nextDueDate.getUTCDate()).toBe(17);
    expect(nextDueDate.getUTCMonth()).toBe(0); // January
  });

  it('includes daysSince in lastInjection response', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'test-user-id' } });

    // 5 days ago
    const lastInjectionDate = new Date('2025-01-10T10:00:00Z');
    mockFindFirstInjections.mockResolvedValue({
      id: 'last-inj',
      userId: 'test-user-id',
      doseMg: '5',
      injectionDate: lastInjectionDate,
    });
    mockFindFirstProfiles.mockResolvedValue(null);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.lastInjection.daysSince).toBe(5);
  });
});
