import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { GET, PUT, DELETE } from '../[id]/route';

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
      injections: {
        findFirst: (...args: unknown[]) => mockFindFirst(...args),
      },
    },
    update: () => mockUpdate(),
    delete: () => mockDelete(),
  },
  schema: {
    injections: {
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

describe('GET /api/injections/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when not authenticated', async () => {
    mockAuth.mockResolvedValue(null);

    const request = new NextRequest('http://localhost:3000/api/injections/test-id');
    const response = await GET(request, createContext('test-id'));
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });

  it('returns 401 when session has no user id', async () => {
    mockAuth.mockResolvedValue({ user: {} });

    const request = new NextRequest('http://localhost:3000/api/injections/test-id');
    const response = await GET(request, createContext('test-id'));

    expect(response.status).toBe(401);
  });

  it('returns 404 when injection not found', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'test-user-id' } });
    mockFindFirst.mockResolvedValue(null);

    const request = new NextRequest('http://localhost:3000/api/injections/nonexistent-id');
    const response = await GET(request, createContext('nonexistent-id'));
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('Injection not found');
  });

  it('returns injection for authenticated user', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'test-user-id' } });

    const mockInjection = {
      id: 'inj-1',
      userId: 'test-user-id',
      doseMg: '7.5',
      injectionSite: 'Thigh - Left',
      injectionDate: new Date('2025-01-15T10:00:00Z'),
      batchNumber: 'BATCH001',
      notes: 'Weekly injection',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    mockFindFirst.mockResolvedValue(mockInjection);

    const request = new NextRequest('http://localhost:3000/api/injections/inj-1');
    const response = await GET(request, createContext('inj-1'));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.id).toBe('inj-1');
    expect(data.doseMg).toBe(7.5);
    expect(data.injectionSite).toBe('Thigh - Left');
    expect(data.batchNumber).toBe('BATCH001');
    expect(data.notes).toBe('Weekly injection');
  });
});

describe('PUT /api/injections/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUpdate.mockReturnValue({ set: mockSet });
    mockSet.mockReturnValue({ where: mockWhere });
    mockWhere.mockReturnValue({ returning: mockReturning });
  });

  it('returns 401 when not authenticated', async () => {
    mockAuth.mockResolvedValue(null);

    const request = new NextRequest('http://localhost:3000/api/injections/test-id', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ doseMg: '10' }),
    });
    const response = await PUT(request, createContext('test-id'));
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });

  it('returns 404 when injection not found', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'test-user-id' } });
    mockFindFirst.mockResolvedValue(null);

    const request = new NextRequest('http://localhost:3000/api/injections/nonexistent-id', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ doseMg: '10' }),
    });
    const response = await PUT(request, createContext('nonexistent-id'));
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('Injection not found');
  });

  it('returns 400 for invalid doseMg value', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'test-user-id' } });
    mockFindFirst.mockResolvedValue({ id: 'inj-1', userId: 'test-user-id' });

    const request = new NextRequest('http://localhost:3000/api/injections/inj-1', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ doseMg: '99' }),
    });
    const response = await PUT(request, createContext('inj-1'));

    expect(response.status).toBe(400);
  });

  it('returns 400 for invalid injectionSite value', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'test-user-id' } });
    mockFindFirst.mockResolvedValue({ id: 'inj-1', userId: 'test-user-id' });

    const request = new NextRequest('http://localhost:3000/api/injections/inj-1', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ injectionSite: 'forehead' }),
    });
    const response = await PUT(request, createContext('inj-1'));

    expect(response.status).toBe(400);
  });

  it('updates injection with valid doseMg', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'test-user-id' } });

    const existingInjection = {
      id: 'inj-1',
      userId: 'test-user-id',
      doseMg: '5',
      injectionSite: 'Abdomen - Left',
      injectionDate: new Date('2025-01-15'),
      batchNumber: null,
      notes: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    mockFindFirst.mockResolvedValue(existingInjection);

    const updatedInjection = {
      ...existingInjection,
      doseMg: '10',
      updatedAt: new Date(),
    };
    mockReturning.mockResolvedValue([updatedInjection]);

    const request = new NextRequest('http://localhost:3000/api/injections/inj-1', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ doseMg: '10' }),
    });
    const response = await PUT(request, createContext('inj-1'));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.doseMg).toBe(10);
  });

  it('updates injection with valid injectionSite', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'test-user-id' } });

    const existingInjection = {
      id: 'inj-1',
      userId: 'test-user-id',
      doseMg: '5',
      injectionSite: 'Abdomen - Left',
      injectionDate: new Date('2025-01-15'),
      batchNumber: null,
      notes: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    mockFindFirst.mockResolvedValue(existingInjection);

    const updatedInjection = {
      ...existingInjection,
      injectionSite: 'Thigh - Right',
      updatedAt: new Date(),
    };
    mockReturning.mockResolvedValue([updatedInjection]);

    const request = new NextRequest('http://localhost:3000/api/injections/inj-1', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ injectionSite: 'Thigh - Right' }),
    });
    const response = await PUT(request, createContext('inj-1'));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.injectionSite).toBe('Thigh - Right');
  });

  it('updates injection with multiple fields', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'test-user-id' } });

    const existingInjection = {
      id: 'inj-1',
      userId: 'test-user-id',
      doseMg: '5',
      injectionSite: 'Abdomen - Left',
      injectionDate: new Date('2025-01-15'),
      batchNumber: null,
      notes: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    mockFindFirst.mockResolvedValue(existingInjection);

    const updatedInjection = {
      ...existingInjection,
      doseMg: '7.5',
      injectionSite: 'Upper Arm - Left',
      batchNumber: 'NEW-BATCH',
      notes: 'Updated notes',
      updatedAt: new Date(),
    };
    mockReturning.mockResolvedValue([updatedInjection]);

    const request = new NextRequest('http://localhost:3000/api/injections/inj-1', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        doseMg: '7.5',
        injectionSite: 'Upper Arm - Left',
        batchNumber: 'NEW-BATCH',
        notes: 'Updated notes',
      }),
    });
    const response = await PUT(request, createContext('inj-1'));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.doseMg).toBe(7.5);
    expect(data.injectionSite).toBe('Upper Arm - Left');
    expect(data.batchNumber).toBe('NEW-BATCH');
    expect(data.notes).toBe('Updated notes');
  });

  it('allows clearing optional fields with null', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'test-user-id' } });

    const existingInjection = {
      id: 'inj-1',
      userId: 'test-user-id',
      doseMg: '5',
      injectionSite: 'Abdomen - Left',
      injectionDate: new Date('2025-01-15'),
      batchNumber: 'OLD-BATCH',
      notes: 'Old notes',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    mockFindFirst.mockResolvedValue(existingInjection);

    const updatedInjection = {
      ...existingInjection,
      batchNumber: null,
      notes: null,
      updatedAt: new Date(),
    };
    mockReturning.mockResolvedValue([updatedInjection]);

    const request = new NextRequest('http://localhost:3000/api/injections/inj-1', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        batchNumber: null,
        notes: null,
      }),
    });
    const response = await PUT(request, createContext('inj-1'));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.batchNumber).toBeNull();
    expect(data.notes).toBeNull();
  });

  it('validates batchNumber length on update', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'test-user-id' } });
    mockFindFirst.mockResolvedValue({ id: 'inj-1', userId: 'test-user-id' });

    const longBatchNumber = 'a'.repeat(101);
    const request = new NextRequest('http://localhost:3000/api/injections/inj-1', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ batchNumber: longBatchNumber }),
    });
    const response = await PUT(request, createContext('inj-1'));

    expect(response.status).toBe(400);
  });

  it('validates notes length on update', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'test-user-id' } });
    mockFindFirst.mockResolvedValue({ id: 'inj-1', userId: 'test-user-id' });

    const longNotes = 'a'.repeat(501);
    const request = new NextRequest('http://localhost:3000/api/injections/inj-1', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notes: longNotes }),
    });
    const response = await PUT(request, createContext('inj-1'));

    expect(response.status).toBe(400);
  });
});

describe('DELETE /api/injections/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDelete.mockReturnValue({ where: mockWhere });
    mockWhere.mockResolvedValue(undefined);
  });

  it('returns 401 when not authenticated', async () => {
    mockAuth.mockResolvedValue(null);

    const request = new NextRequest('http://localhost:3000/api/injections/test-id', {
      method: 'DELETE',
    });
    const response = await DELETE(request, createContext('test-id'));
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });

  it('returns 404 when injection not found', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'test-user-id' } });
    mockFindFirst.mockResolvedValue(null);

    const request = new NextRequest('http://localhost:3000/api/injections/nonexistent-id', {
      method: 'DELETE',
    });
    const response = await DELETE(request, createContext('nonexistent-id'));
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('Injection not found');
  });

  it('deletes injection successfully', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'test-user-id' } });

    const existingInjection = {
      id: 'inj-1',
      userId: 'test-user-id',
      doseMg: '5',
      injectionSite: 'Abdomen - Left',
      injectionDate: new Date(),
      batchNumber: null,
      notes: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    mockFindFirst.mockResolvedValue(existingInjection);

    const request = new NextRequest('http://localhost:3000/api/injections/inj-1', {
      method: 'DELETE',
    });
    const response = await DELETE(request, createContext('inj-1'));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
  });

  it('prevents deleting injection belonging to another user', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'test-user-id' } });
    // Simulates the query finding nothing because of user ID mismatch
    mockFindFirst.mockResolvedValue(null);

    const request = new NextRequest('http://localhost:3000/api/injections/other-user-inj', {
      method: 'DELETE',
    });
    const response = await DELETE(request, createContext('other-user-inj'));
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('Injection not found');
  });
});
