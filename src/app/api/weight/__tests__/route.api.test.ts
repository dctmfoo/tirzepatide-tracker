import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { GET, POST } from '../route';

// Mock auth module
const mockAuth = vi.fn();
vi.mock('@/lib/auth', () => ({
  auth: () => mockAuth(),
}));

// Mock database
const mockSelect = vi.fn().mockReturnThis();
const mockFrom = vi.fn().mockReturnThis();
const mockWhere = vi.fn().mockReturnThis();
const mockOrderBy = vi.fn().mockReturnThis();
const mockLimit = vi.fn().mockReturnThis();
const mockOffset = vi.fn().mockReturnThis();
const mockInsert = vi.fn().mockReturnThis();
const mockValues = vi.fn().mockReturnThis();
const mockReturning = vi.fn();

vi.mock('@/lib/db', () => ({
  db: {
    select: () => mockSelect(),
    insert: () => mockInsert(),
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
  and: vi.fn((...conditions) => ({ type: 'and', conditions })),
  gte: vi.fn((a, b) => ({ type: 'gte', field: a, value: b })),
  lte: vi.fn((a, b) => ({ type: 'lte', field: a, value: b })),
  desc: vi.fn((field) => ({ type: 'desc', field })),
}));

describe('GET /api/weight', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Setup default chain
    mockSelect.mockReturnValue({ from: mockFrom });
    mockFrom.mockReturnValue({ where: mockWhere });
    mockWhere.mockReturnValue({ orderBy: mockOrderBy });
    mockOrderBy.mockReturnValue({ limit: mockLimit });
    mockLimit.mockReturnValue({ offset: mockOffset });
    mockOffset.mockResolvedValue([]);
  });

  it('returns 401 when not authenticated', async () => {
    mockAuth.mockResolvedValue(null);

    const request = new NextRequest('http://localhost:3000/api/weight');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });

  it('returns 401 when session has no user id', async () => {
    mockAuth.mockResolvedValue({ user: {} });

    const request = new NextRequest('http://localhost:3000/api/weight');
    const response = await GET(request);

    expect(response.status).toBe(401);
  });

  it('returns weight entries for authenticated user', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'test-user-id' } });

    const mockEntries = [
      {
        id: 'entry-1',
        userId: 'test-user-id',
        weightKg: '92.50',
        recordedAt: new Date('2025-01-15'),
        notes: 'Morning weight',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'entry-2',
        userId: 'test-user-id',
        weightKg: '92.00',
        recordedAt: new Date('2025-01-14'),
        notes: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];
    mockOffset.mockResolvedValue(mockEntries);

    const request = new NextRequest('http://localhost:3000/api/weight');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.entries).toHaveLength(2);
    expect(data.entries[0].weightKg).toBe(92.5);
    expect(data.entries[0].notes).toBe('Morning weight');
    expect(data.pagination).toBeDefined();
    expect(data.pagination.limit).toBe(50);
    expect(data.pagination.offset).toBe(0);
  });

  it('respects limit parameter', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'test-user-id' } });
    mockOffset.mockResolvedValue([]);

    const request = new NextRequest('http://localhost:3000/api/weight?limit=10');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.pagination.limit).toBe(10);
  });

  it('caps limit at 100', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'test-user-id' } });
    mockOffset.mockResolvedValue([]);

    const request = new NextRequest('http://localhost:3000/api/weight?limit=200');
    const response = await GET(request);
    const data = await response.json();

    expect(data.pagination.limit).toBe(100);
  });

  it('respects offset parameter', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'test-user-id' } });
    mockOffset.mockResolvedValue([]);

    const request = new NextRequest('http://localhost:3000/api/weight?offset=20');
    const response = await GET(request);
    const data = await response.json();

    expect(data.pagination.offset).toBe(20);
  });

  it('indicates hasMore when results equal limit', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'test-user-id' } });

    // Return exactly 10 items (same as limit)
    const mockEntries = Array.from({ length: 10 }, (_, i) => ({
      id: `entry-${i}`,
      userId: 'test-user-id',
      weightKg: '92.00',
      recordedAt: new Date(),
      notes: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));
    mockOffset.mockResolvedValue(mockEntries);

    const request = new NextRequest('http://localhost:3000/api/weight?limit=10');
    const response = await GET(request);
    const data = await response.json();

    expect(data.pagination.hasMore).toBe(true);
  });
});

describe('POST /api/weight', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockInsert.mockReturnValue({ values: mockValues });
    mockValues.mockReturnValue({ returning: mockReturning });
  });

  it('returns 401 when not authenticated', async () => {
    mockAuth.mockResolvedValue(null);

    const request = new Request('http://localhost:3000/api/weight', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ weightKg: 92.5 }),
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });

  it('returns 400 for missing weight', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'test-user-id' } });

    const request = new Request('http://localhost:3000/api/weight', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Validation failed');
  });

  it('returns 400 for weight below minimum', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'test-user-id' } });

    const request = new Request('http://localhost:3000/api/weight', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ weightKg: 10 }),
    });
    const response = await POST(request);

    expect(response.status).toBe(400);
  });

  it('returns 400 for weight above maximum', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'test-user-id' } });

    const request = new Request('http://localhost:3000/api/weight', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ weightKg: 600 }),
    });
    const response = await POST(request);

    expect(response.status).toBe(400);
  });

  it('creates weight entry with valid data', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'test-user-id' } });

    const createdEntry = {
      id: 'new-entry-id',
      userId: 'test-user-id',
      weightKg: '92.50',
      recordedAt: new Date('2025-01-15T10:00:00Z'),
      notes: 'Morning weight',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    mockReturning.mockResolvedValue([createdEntry]);

    const request = new Request('http://localhost:3000/api/weight', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        weightKg: 92.5,
        recordedAt: '2025-01-15T10:00:00Z',
        notes: 'Morning weight',
      }),
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.id).toBe('new-entry-id');
    expect(data.weightKg).toBe(92.5);
    expect(data.notes).toBe('Morning weight');
  });

  it('uses current time when recordedAt not provided', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'test-user-id' } });

    const createdEntry = {
      id: 'new-entry-id',
      userId: 'test-user-id',
      weightKg: '92.50',
      recordedAt: new Date(),
      notes: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    mockReturning.mockResolvedValue([createdEntry]);

    const request = new Request('http://localhost:3000/api/weight', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ weightKg: 92.5 }),
    });
    const response = await POST(request);

    expect(response.status).toBe(201);
  });

  it('validates notes length', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'test-user-id' } });

    const longNotes = 'a'.repeat(501);
    const request = new Request('http://localhost:3000/api/weight', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ weightKg: 92.5, notes: longNotes }),
    });
    const response = await POST(request);

    expect(response.status).toBe(400);
  });
});
