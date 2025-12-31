import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { GET, PUT, DELETE } from '../route';

// Mock auth module
const mockAuth = vi.fn();
vi.mock('@/lib/auth', () => ({
  auth: () => mockAuth(),
}));

// Mock database query methods
const mockFindFirst = vi.fn();
const mockUpdate = vi.fn().mockReturnThis();
const mockSet = vi.fn().mockReturnThis();
const mockWhere = vi.fn().mockReturnThis();
const mockReturning = vi.fn();
const mockDelete = vi.fn().mockReturnThis();

vi.mock('@/lib/db', () => ({
  db: {
    query: {
      weightEntries: {
        findFirst: (...args: unknown[]) => mockFindFirst(...args),
      },
    },
    update: () => mockUpdate(),
    delete: () => mockDelete(),
  },
  schema: {
    weightEntries: {
      id: 'id',
      userId: 'userId',
    },
  },
}));

// Mock drizzle-orm operators
vi.mock('drizzle-orm', () => ({
  eq: vi.fn((a, b) => ({ type: 'eq', field: a, value: b })),
  and: vi.fn((...conditions) => ({ type: 'and', conditions })),
}));

// Helper to create route context
const createContext = (id: string) => ({
  params: Promise.resolve({ id }),
});

describe('GET /api/weight/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when not authenticated', async () => {
    mockAuth.mockResolvedValue(null);

    const request = new NextRequest('http://localhost:3000/api/weight/test-id');
    const response = await GET(request, createContext('test-id'));
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });

  it('returns 401 when session has no user id', async () => {
    mockAuth.mockResolvedValue({ user: {} });

    const request = new NextRequest('http://localhost:3000/api/weight/test-id');
    const response = await GET(request, createContext('test-id'));

    expect(response.status).toBe(401);
  });

  it('returns 404 when weight entry not found', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'test-user-id' } });
    mockFindFirst.mockResolvedValue(null);

    const request = new NextRequest('http://localhost:3000/api/weight/nonexistent-id');
    const response = await GET(request, createContext('nonexistent-id'));
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('Weight entry not found');
  });

  it('returns weight entry for authenticated user', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'test-user-id' } });

    const mockEntry = {
      id: 'weight-1',
      userId: 'test-user-id',
      weightKg: '85.5',
      recordedAt: new Date('2025-01-15T08:00:00Z'),
      notes: 'Morning weigh-in',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    mockFindFirst.mockResolvedValue(mockEntry);

    const request = new NextRequest('http://localhost:3000/api/weight/weight-1');
    const response = await GET(request, createContext('weight-1'));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.id).toBe('weight-1');
    expect(data.weightKg).toBe(85.5);
    expect(data.notes).toBe('Morning weigh-in');
  });

  it('converts weightKg from string to number', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'test-user-id' } });

    const mockEntry = {
      id: 'weight-1',
      userId: 'test-user-id',
      weightKg: '92.3',
      recordedAt: new Date(),
      notes: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    mockFindFirst.mockResolvedValue(mockEntry);

    const request = new NextRequest('http://localhost:3000/api/weight/weight-1');
    const response = await GET(request, createContext('weight-1'));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(typeof data.weightKg).toBe('number');
    expect(data.weightKg).toBe(92.3);
  });

  it('returns entry with null notes', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'test-user-id' } });

    const mockEntry = {
      id: 'weight-1',
      userId: 'test-user-id',
      weightKg: '80',
      recordedAt: new Date(),
      notes: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    mockFindFirst.mockResolvedValue(mockEntry);

    const request = new NextRequest('http://localhost:3000/api/weight/weight-1');
    const response = await GET(request, createContext('weight-1'));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.notes).toBeNull();
  });
});

describe('PUT /api/weight/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUpdate.mockReturnValue({ set: mockSet });
    mockSet.mockReturnValue({ where: mockWhere });
    mockWhere.mockReturnValue({ returning: mockReturning });
  });

  it('returns 401 when not authenticated', async () => {
    mockAuth.mockResolvedValue(null);

    const request = new NextRequest('http://localhost:3000/api/weight/test-id', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ weightKg: 85 }),
    });
    const response = await PUT(request, createContext('test-id'));
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });

  it('returns 404 when weight entry not found', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'test-user-id' } });
    mockFindFirst.mockResolvedValue(null);

    const request = new NextRequest('http://localhost:3000/api/weight/nonexistent-id', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ weightKg: 85 }),
    });
    const response = await PUT(request, createContext('nonexistent-id'));
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('Weight entry not found');
  });

  it('returns 400 for weight below minimum (20kg)', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'test-user-id' } });
    mockFindFirst.mockResolvedValue({ id: 'weight-1', userId: 'test-user-id' });

    const request = new NextRequest('http://localhost:3000/api/weight/weight-1', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ weightKg: 15 }),
    });
    const response = await PUT(request, createContext('weight-1'));

    expect(response.status).toBe(400);
  });

  it('returns 400 for weight above maximum (500kg)', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'test-user-id' } });
    mockFindFirst.mockResolvedValue({ id: 'weight-1', userId: 'test-user-id' });

    const request = new NextRequest('http://localhost:3000/api/weight/weight-1', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ weightKg: 550 }),
    });
    const response = await PUT(request, createContext('weight-1'));

    expect(response.status).toBe(400);
  });

  it('returns 400 for invalid datetime format', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'test-user-id' } });
    mockFindFirst.mockResolvedValue({ id: 'weight-1', userId: 'test-user-id' });

    const request = new NextRequest('http://localhost:3000/api/weight/weight-1', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ recordedAt: 'not-a-date' }),
    });
    const response = await PUT(request, createContext('weight-1'));

    expect(response.status).toBe(400);
  });

  it('returns 400 for notes exceeding 500 characters', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'test-user-id' } });
    mockFindFirst.mockResolvedValue({ id: 'weight-1', userId: 'test-user-id' });

    const longNotes = 'a'.repeat(501);
    const request = new NextRequest('http://localhost:3000/api/weight/weight-1', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notes: longNotes }),
    });
    const response = await PUT(request, createContext('weight-1'));

    expect(response.status).toBe(400);
  });

  it('updates weight entry with valid weightKg', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'test-user-id' } });

    const existingEntry = {
      id: 'weight-1',
      userId: 'test-user-id',
      weightKg: '85',
      recordedAt: new Date('2025-01-15'),
      notes: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    mockFindFirst.mockResolvedValue(existingEntry);

    const updatedEntry = {
      ...existingEntry,
      weightKg: '82.5',
      updatedAt: new Date(),
    };
    mockReturning.mockResolvedValue([updatedEntry]);

    const request = new NextRequest('http://localhost:3000/api/weight/weight-1', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ weightKg: 82.5 }),
    });
    const response = await PUT(request, createContext('weight-1'));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.weightKg).toBe(82.5);
  });

  it('updates weight entry with valid recordedAt', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'test-user-id' } });

    const existingEntry = {
      id: 'weight-1',
      userId: 'test-user-id',
      weightKg: '85',
      recordedAt: new Date('2025-01-15'),
      notes: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    mockFindFirst.mockResolvedValue(existingEntry);

    const newDate = new Date('2025-01-20T10:00:00Z');
    const updatedEntry = {
      ...existingEntry,
      recordedAt: newDate,
      updatedAt: new Date(),
    };
    mockReturning.mockResolvedValue([updatedEntry]);

    const request = new NextRequest('http://localhost:3000/api/weight/weight-1', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ recordedAt: '2025-01-20T10:00:00Z' }),
    });
    const response = await PUT(request, createContext('weight-1'));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.recordedAt).toBeDefined();
  });

  it('updates weight entry with multiple fields', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'test-user-id' } });

    const existingEntry = {
      id: 'weight-1',
      userId: 'test-user-id',
      weightKg: '85',
      recordedAt: new Date('2025-01-15'),
      notes: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    mockFindFirst.mockResolvedValue(existingEntry);

    const updatedEntry = {
      ...existingEntry,
      weightKg: '80.5',
      notes: 'Post-workout weigh-in',
      updatedAt: new Date(),
    };
    mockReturning.mockResolvedValue([updatedEntry]);

    const request = new NextRequest('http://localhost:3000/api/weight/weight-1', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        weightKg: 80.5,
        notes: 'Post-workout weigh-in',
      }),
    });
    const response = await PUT(request, createContext('weight-1'));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.weightKg).toBe(80.5);
    expect(data.notes).toBe('Post-workout weigh-in');
  });

  it('allows clearing notes with null', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'test-user-id' } });

    const existingEntry = {
      id: 'weight-1',
      userId: 'test-user-id',
      weightKg: '85',
      recordedAt: new Date('2025-01-15'),
      notes: 'Old notes',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    mockFindFirst.mockResolvedValue(existingEntry);

    const updatedEntry = {
      ...existingEntry,
      notes: null,
      updatedAt: new Date(),
    };
    mockReturning.mockResolvedValue([updatedEntry]);

    const request = new NextRequest('http://localhost:3000/api/weight/weight-1', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notes: null }),
    });
    const response = await PUT(request, createContext('weight-1'));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.notes).toBeNull();
  });

  it('validates weight at boundary (20kg minimum)', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'test-user-id' } });

    const existingEntry = {
      id: 'weight-1',
      userId: 'test-user-id',
      weightKg: '85',
      recordedAt: new Date(),
      notes: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    mockFindFirst.mockResolvedValue(existingEntry);

    const updatedEntry = { ...existingEntry, weightKg: '20', updatedAt: new Date() };
    mockReturning.mockResolvedValue([updatedEntry]);

    const request = new NextRequest('http://localhost:3000/api/weight/weight-1', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ weightKg: 20 }),
    });
    const response = await PUT(request, createContext('weight-1'));

    expect(response.status).toBe(200);
  });

  it('validates weight at boundary (500kg maximum)', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'test-user-id' } });

    const existingEntry = {
      id: 'weight-1',
      userId: 'test-user-id',
      weightKg: '85',
      recordedAt: new Date(),
      notes: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    mockFindFirst.mockResolvedValue(existingEntry);

    const updatedEntry = { ...existingEntry, weightKg: '500', updatedAt: new Date() };
    mockReturning.mockResolvedValue([updatedEntry]);

    const request = new NextRequest('http://localhost:3000/api/weight/weight-1', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ weightKg: 500 }),
    });
    const response = await PUT(request, createContext('weight-1'));

    expect(response.status).toBe(200);
  });
});

describe('DELETE /api/weight/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDelete.mockReturnValue({ where: mockWhere });
    mockWhere.mockResolvedValue(undefined);
  });

  it('returns 401 when not authenticated', async () => {
    mockAuth.mockResolvedValue(null);

    const request = new NextRequest('http://localhost:3000/api/weight/test-id', {
      method: 'DELETE',
    });
    const response = await DELETE(request, createContext('test-id'));
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });

  it('returns 404 when weight entry not found', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'test-user-id' } });
    mockFindFirst.mockResolvedValue(null);

    const request = new NextRequest('http://localhost:3000/api/weight/nonexistent-id', {
      method: 'DELETE',
    });
    const response = await DELETE(request, createContext('nonexistent-id'));
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('Weight entry not found');
  });

  it('deletes weight entry successfully', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'test-user-id' } });

    const existingEntry = {
      id: 'weight-1',
      userId: 'test-user-id',
      weightKg: '85',
      recordedAt: new Date(),
      notes: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    mockFindFirst.mockResolvedValue(existingEntry);

    const request = new NextRequest('http://localhost:3000/api/weight/weight-1', {
      method: 'DELETE',
    });
    const response = await DELETE(request, createContext('weight-1'));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
  });

  it('prevents deleting weight entry belonging to another user', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'test-user-id' } });
    // Query returns null because user ID doesn't match
    mockFindFirst.mockResolvedValue(null);

    const request = new NextRequest('http://localhost:3000/api/weight/other-user-entry', {
      method: 'DELETE',
    });
    const response = await DELETE(request, createContext('other-user-entry'));
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('Weight entry not found');
  });
});
