import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GET } from '../route';

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
  },
}));

// Mock drizzle-orm operators
vi.mock('drizzle-orm', () => ({
  eq: vi.fn((a, b) => ({ type: 'eq', field: a, value: b })),
  desc: vi.fn((field) => ({ type: 'desc', field })),
}));

describe('GET /api/weight/latest', () => {
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

  it('returns 404 when no weight entries found', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'test-user-id' } });
    mockFindFirst.mockResolvedValue(null);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('No weight entries found');
  });

  it('returns latest weight entry for authenticated user', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'test-user-id' } });

    const mockEntry = {
      id: 'latest-weight',
      userId: 'test-user-id',
      weightKg: '82.5',
      recordedAt: new Date('2025-01-15T08:00:00Z'),
      notes: 'Morning weigh-in',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    mockFindFirst.mockResolvedValue(mockEntry);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.id).toBe('latest-weight');
    expect(data.weightKg).toBe(82.5);
    expect(data.notes).toBe('Morning weigh-in');
  });

  it('returns entry with null notes', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'test-user-id' } });

    const mockEntry = {
      id: 'latest-weight',
      userId: 'test-user-id',
      weightKg: '85',
      recordedAt: new Date('2025-01-15'),
      notes: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    mockFindFirst.mockResolvedValue(mockEntry);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.notes).toBeNull();
  });

  it('converts weightKg from string to number correctly', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'test-user-id' } });

    const testWeights = ['75.5', '100', '65.25', '120.75', '88'];

    for (const weightStr of testWeights) {
      const mockEntry = {
        id: `weight-${weightStr}`,
        userId: 'test-user-id',
        weightKg: weightStr,
        recordedAt: new Date(),
        notes: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockFindFirst.mockResolvedValue(mockEntry);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.weightKg).toBe(Number(weightStr));
      expect(typeof data.weightKg).toBe('number');
    }
  });

  it('includes all expected fields in response', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'test-user-id' } });

    const mockEntry = {
      id: 'latest-weight',
      userId: 'test-user-id',
      weightKg: '85',
      recordedAt: new Date('2025-01-15T08:00:00Z'),
      notes: 'Test notes',
      createdAt: new Date('2025-01-15T08:00:00Z'),
      updatedAt: new Date('2025-01-15T08:00:00Z'),
    };
    mockFindFirst.mockResolvedValue(mockEntry);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty('id');
    expect(data).toHaveProperty('weightKg');
    expect(data).toHaveProperty('recordedAt');
    expect(data).toHaveProperty('notes');
    expect(data).toHaveProperty('createdAt');
    expect(data).toHaveProperty('updatedAt');
  });

  it('queries with correct ordering (desc by recordedAt)', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'test-user-id' } });

    const mockEntry = {
      id: 'latest-weight',
      userId: 'test-user-id',
      weightKg: '85',
      recordedAt: new Date(),
      notes: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    mockFindFirst.mockResolvedValue(mockEntry);

    await GET();

    expect(mockFindFirst).toHaveBeenCalled();
    // Verify the function was called with orderBy parameter
    const callArgs = mockFindFirst.mock.calls[0][0];
    expect(callArgs).toHaveProperty('orderBy');
  });
});
