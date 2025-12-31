import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GET } from '../latest/route';

// Mock auth module
const mockAuth = vi.fn();
vi.mock('@/lib/auth', () => ({
  auth: () => mockAuth(),
}));

// Mock database query methods
const mockFindFirst = vi.fn();

vi.mock('@/lib/db', () => ({
  db: {
    query: {
      injections: {
        findFirst: (...args: unknown[]) => mockFindFirst(...args),
      },
    },
  },
  schema: {
    injections: {
      userId: 'userId',
      injectionDate: 'injectionDate',
    },
  },
}));

// Mock drizzle-orm operators
vi.mock('drizzle-orm', () => ({
  eq: vi.fn((a, b) => ({ type: 'eq', field: a, value: b })),
  desc: vi.fn((field) => ({ type: 'desc', field })),
}));

describe('GET /api/injections/latest', () => {
  beforeEach(() => {
    vi.clearAllMocks();
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

  it('returns 404 when no injections found', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'test-user-id' } });
    mockFindFirst.mockResolvedValue(null);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('No injections found');
  });

  it('returns latest injection for authenticated user', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'test-user-id' } });

    const mockInjection = {
      id: 'latest-inj',
      userId: 'test-user-id',
      doseMg: '10',
      injectionSite: 'thigh_right',
      injectionDate: new Date('2025-01-15T08:00:00Z'),
      batchNumber: 'BATCH-LATEST',
      notes: 'Most recent injection',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    mockFindFirst.mockResolvedValue(mockInjection);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.id).toBe('latest-inj');
    expect(data.doseMg).toBe(10);
    expect(data.injectionSite).toBe('thigh_right');
    expect(data.batchNumber).toBe('BATCH-LATEST');
    expect(data.notes).toBe('Most recent injection');
  });

  it('returns injection with null optional fields', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'test-user-id' } });

    const mockInjection = {
      id: 'latest-inj',
      userId: 'test-user-id',
      doseMg: '5',
      injectionSite: 'abdomen',
      injectionDate: new Date('2025-01-15'),
      batchNumber: null,
      notes: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    mockFindFirst.mockResolvedValue(mockInjection);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.batchNumber).toBeNull();
    expect(data.notes).toBeNull();
  });

  it('returns correct dose conversion from string to number', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'test-user-id' } });

    const doses = ['2.5', '5', '7.5', '10', '12.5', '15'];

    for (const doseStr of doses) {
      const mockInjection = {
        id: `inj-${doseStr}`,
        userId: 'test-user-id',
        doseMg: doseStr,
        injectionSite: 'abdomen',
        injectionDate: new Date(),
        batchNumber: null,
        notes: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockFindFirst.mockResolvedValue(mockInjection);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.doseMg).toBe(Number(doseStr));
      expect(typeof data.doseMg).toBe('number');
    }
  });
});
