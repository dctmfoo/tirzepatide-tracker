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
    injections: {
      userId: 'userId',
      injectionDate: 'injectionDate',
    },
  },
}));

// Mock drizzle-orm operators
vi.mock('drizzle-orm', () => ({
  eq: vi.fn((a, b) => ({ type: 'eq', field: a, value: b })),
  and: vi.fn((...conditions) => ({ type: 'and', conditions })),
  desc: vi.fn((field) => ({ type: 'desc', field })),
}));

describe('GET /api/injections', () => {
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

    const request = new NextRequest('http://localhost:3000/api/injections');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });

  it('returns 401 when session has no user id', async () => {
    mockAuth.mockResolvedValue({ user: {} });

    const request = new NextRequest('http://localhost:3000/api/injections');
    const response = await GET(request);

    expect(response.status).toBe(401);
  });

  it('returns injections for authenticated user', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'test-user-id' } });

    const mockInjections = [
      {
        id: 'inj-1',
        userId: 'test-user-id',
        doseMg: '5',
        injectionSite: 'Abdomen - Left',
        injectionDate: new Date('2025-01-15'),
        batchNumber: 'ABC123',
        notes: 'First injection',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'inj-2',
        userId: 'test-user-id',
        doseMg: '5',
        injectionSite: 'Thigh - Left',
        injectionDate: new Date('2025-01-08'),
        batchNumber: null,
        notes: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];
    mockOffset.mockResolvedValue(mockInjections);

    const request = new NextRequest('http://localhost:3000/api/injections');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.injections).toHaveLength(2);
    expect(data.injections[0].doseMg).toBe(5);
    expect(data.injections[0].injectionSite).toBe('Abdomen - Left');
    expect(data.injections[0].batchNumber).toBe('ABC123');
    expect(data.pagination).toBeDefined();
    expect(data.pagination.limit).toBe(50);
    expect(data.pagination.offset).toBe(0);
  });

  it('respects limit parameter', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'test-user-id' } });
    mockOffset.mockResolvedValue([]);

    const request = new NextRequest('http://localhost:3000/api/injections?limit=10');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.pagination.limit).toBe(10);
  });

  it('caps limit at 100', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'test-user-id' } });
    mockOffset.mockResolvedValue([]);

    const request = new NextRequest('http://localhost:3000/api/injections?limit=200');
    const response = await GET(request);
    const data = await response.json();

    expect(data.pagination.limit).toBe(100);
  });

  it('respects offset parameter', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'test-user-id' } });
    mockOffset.mockResolvedValue([]);

    const request = new NextRequest('http://localhost:3000/api/injections?offset=20');
    const response = await GET(request);
    const data = await response.json();

    expect(data.pagination.offset).toBe(20);
  });

  it('indicates hasMore when results equal limit', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'test-user-id' } });

    const mockInjections = Array.from({ length: 10 }, (_, i) => ({
      id: `inj-${i}`,
      userId: 'test-user-id',
      doseMg: '5',
      injectionSite: 'Abdomen - Left',
      injectionDate: new Date(),
      batchNumber: null,
      notes: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));
    mockOffset.mockResolvedValue(mockInjections);

    const request = new NextRequest('http://localhost:3000/api/injections?limit=10');
    const response = await GET(request);
    const data = await response.json();

    expect(data.pagination.hasMore).toBe(true);
  });

  it('indicates no more results when less than limit', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'test-user-id' } });

    const mockInjections = Array.from({ length: 5 }, (_, i) => ({
      id: `inj-${i}`,
      userId: 'test-user-id',
      doseMg: '5',
      injectionSite: 'Abdomen - Left',
      injectionDate: new Date(),
      batchNumber: null,
      notes: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));
    mockOffset.mockResolvedValue(mockInjections);

    const request = new NextRequest('http://localhost:3000/api/injections?limit=10');
    const response = await GET(request);
    const data = await response.json();

    expect(data.pagination.hasMore).toBe(false);
  });
});

describe('POST /api/injections', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockInsert.mockReturnValue({ values: mockValues });
    mockValues.mockReturnValue({ returning: mockReturning });
  });

  it('returns 401 when not authenticated', async () => {
    mockAuth.mockResolvedValue(null);

    const request = new Request('http://localhost:3000/api/injections', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ doseMg: '5', injectionSite: 'Abdomen - Left' }),
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });

  it('returns 400 for missing doseMg', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'test-user-id' } });

    const request = new Request('http://localhost:3000/api/injections', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ injectionSite: 'Abdomen - Left' }),
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Validation failed');
  });

  it('returns 400 for missing injectionSite', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'test-user-id' } });

    const request = new Request('http://localhost:3000/api/injections', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ doseMg: '5' }),
    });
    const response = await POST(request);

    expect(response.status).toBe(400);
  });

  it('returns 400 for invalid doseMg value', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'test-user-id' } });

    const request = new Request('http://localhost:3000/api/injections', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ doseMg: '20', injectionSite: 'Abdomen - Left' }),
    });
    const response = await POST(request);

    expect(response.status).toBe(400);
  });

  it('returns 400 for invalid injectionSite value', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'test-user-id' } });

    const request = new Request('http://localhost:3000/api/injections', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ doseMg: '5', injectionSite: 'invalid_site' }),
    });
    const response = await POST(request);

    expect(response.status).toBe(400);
  });

  it('creates injection with valid data', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'test-user-id' } });

    const createdInjection = {
      id: 'new-inj-id',
      userId: 'test-user-id',
      doseMg: '5',
      injectionSite: 'Abdomen - Left',
      injectionDate: new Date('2025-01-15T10:00:00Z'),
      batchNumber: 'ABC123',
      notes: 'Morning injection',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    mockReturning.mockResolvedValue([createdInjection]);

    const request = new Request('http://localhost:3000/api/injections', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        doseMg: '5',
        injectionSite: 'Abdomen - Left',
        injectionDate: '2025-01-15T10:00:00Z',
        batchNumber: 'ABC123',
        notes: 'Morning injection',
      }),
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.id).toBe('new-inj-id');
    expect(data.doseMg).toBe(5);
    expect(data.injectionSite).toBe('Abdomen - Left');
    expect(data.batchNumber).toBe('ABC123');
    expect(data.notes).toBe('Morning injection');
  });

  it('creates injection with all valid dose values', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'test-user-id' } });

    const validDoses = ['2.5', '5', '7.5', '10', '12.5', '15'];

    for (const dose of validDoses) {
      const createdInjection = {
        id: `inj-${dose}`,
        userId: 'test-user-id',
        doseMg: dose,
        injectionSite: 'Abdomen - Left',
        injectionDate: new Date(),
        batchNumber: null,
        notes: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockReturning.mockResolvedValue([createdInjection]);

      const request = new Request('http://localhost:3000/api/injections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ doseMg: dose, injectionSite: 'Abdomen - Left' }),
      });
      const response = await POST(request);

      expect(response.status).toBe(201);
    }
  });

  it('creates injection with all valid injection sites', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'test-user-id' } });

    const validSites = [
      'Abdomen - Left',
      'Abdomen - Right',
      'Thigh - Left',
      'Thigh - Right',
      'Upper Arm - Left',
      'Upper Arm - Right',
    ];

    for (const site of validSites) {
      const createdInjection = {
        id: `inj-${site}`,
        userId: 'test-user-id',
        doseMg: '5',
        injectionSite: site,
        injectionDate: new Date(),
        batchNumber: null,
        notes: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockReturning.mockResolvedValue([createdInjection]);

      const request = new Request('http://localhost:3000/api/injections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ doseMg: '5', injectionSite: site }),
      });
      const response = await POST(request);

      expect(response.status).toBe(201);
    }
  });

  it('uses current time when injectionDate not provided', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'test-user-id' } });

    const createdInjection = {
      id: 'new-inj-id',
      userId: 'test-user-id',
      doseMg: '5',
      injectionSite: 'Abdomen - Left',
      injectionDate: new Date(),
      batchNumber: null,
      notes: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    mockReturning.mockResolvedValue([createdInjection]);

    const request = new Request('http://localhost:3000/api/injections', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ doseMg: '5', injectionSite: 'Abdomen - Left' }),
    });
    const response = await POST(request);

    expect(response.status).toBe(201);
  });

  it('validates batchNumber length', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'test-user-id' } });

    const longBatchNumber = 'a'.repeat(101);
    const request = new Request('http://localhost:3000/api/injections', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        doseMg: '5',
        injectionSite: 'Abdomen - Left',
        batchNumber: longBatchNumber,
      }),
    });
    const response = await POST(request);

    expect(response.status).toBe(400);
  });

  it('validates notes length', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'test-user-id' } });

    const longNotes = 'a'.repeat(501);
    const request = new Request('http://localhost:3000/api/injections', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        doseMg: '5',
        injectionSite: 'Abdomen - Left',
        notes: longNotes,
      }),
    });
    const response = await POST(request);

    expect(response.status).toBe(400);
  });
});
