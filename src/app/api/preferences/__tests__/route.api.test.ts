import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { GET, PUT } from '../route';

// Mock auth
const mockAuth = vi.fn();
vi.mock('@/lib/auth', () => ({
  auth: () => mockAuth(),
}));

// Mock database
const mockFindFirst = vi.fn();
const mockValues = vi.fn();
const mockSet = vi.fn();
const mockWhere = vi.fn();
const mockReturning = vi.fn();

vi.mock('@/lib/db', () => ({
  db: {
    query: {
      userPreferences: {
        findFirst: (...args: unknown[]) => mockFindFirst(...args),
      },
    },
    insert: () => ({
      values: (...args: unknown[]) => {
        mockValues(...args);
        return {
          returning: () => mockReturning(),
        };
      },
    }),
    update: () => ({
      set: (...args: unknown[]) => {
        mockSet(...args);
        return {
          where: (...whereArgs: unknown[]) => {
            mockWhere(...whereArgs);
            return {
              returning: () => mockReturning(),
            };
          },
        };
      },
    }),
  },
  schema: {
    userPreferences: {
      userId: 'userId',
    },
  },
}));

describe('GET /api/preferences', () => {
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

  it('returns existing preferences for authenticated user', async () => {
    const mockPreferences = {
      id: 'pref-123',
      userId: 'user-123',
      weightUnit: 'kg',
      heightUnit: 'cm',
      dateFormat: 'DD/MM/YYYY',
      weekStartsOn: 1,
      theme: 'dark',
      createdAt: new Date('2025-01-01'),
      updatedAt: new Date('2025-01-15'),
    };

    mockAuth.mockResolvedValue({ user: { id: 'user-123' } });
    mockFindFirst.mockResolvedValue(mockPreferences);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.id).toBe('pref-123');
    expect(data.weightUnit).toBe('kg');
    expect(data.heightUnit).toBe('cm');
    expect(data.dateFormat).toBe('DD/MM/YYYY');
    expect(data.weekStartsOn).toBe(1);
    expect(data.theme).toBe('dark');
  });

  it('creates default preferences if none exist', async () => {
    const newPreferences = {
      id: 'pref-new',
      userId: 'user-123',
      weightUnit: 'kg',
      heightUnit: 'cm',
      dateFormat: 'DD/MM/YYYY',
      weekStartsOn: 1,
      theme: 'dark',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    mockAuth.mockResolvedValue({ user: { id: 'user-123' } });
    mockFindFirst.mockResolvedValue(null);
    mockReturning.mockResolvedValue([newPreferences]);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(mockValues).toHaveBeenCalled();
    expect(data.weightUnit).toBe('kg');
    expect(data.heightUnit).toBe('cm');
    expect(data.theme).toBe('dark');
  });

  it('returns all preference fields', async () => {
    const mockPreferences = {
      id: 'pref-123',
      userId: 'user-123',
      weightUnit: 'lbs',
      heightUnit: 'ft-in',
      dateFormat: 'MM/DD/YYYY',
      weekStartsOn: 0,
      theme: 'light',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    mockAuth.mockResolvedValue({ user: { id: 'user-123' } });
    mockFindFirst.mockResolvedValue(mockPreferences);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty('id');
    expect(data).toHaveProperty('weightUnit');
    expect(data).toHaveProperty('heightUnit');
    expect(data).toHaveProperty('dateFormat');
    expect(data).toHaveProperty('weekStartsOn');
    expect(data).toHaveProperty('theme');
    expect(data).toHaveProperty('createdAt');
    expect(data).toHaveProperty('updatedAt');
  });
});

describe('PUT /api/preferences', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when not authenticated', async () => {
    mockAuth.mockResolvedValue(null);

    const request = new NextRequest('http://localhost/api/preferences', {
      method: 'PUT',
      body: JSON.stringify({ weightUnit: 'lbs' }),
    });

    const response = await PUT(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });

  it('returns 400 for invalid weightUnit', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-123' } });

    const request = new NextRequest('http://localhost/api/preferences', {
      method: 'PUT',
      body: JSON.stringify({ weightUnit: 'tons' }),
    });

    const response = await PUT(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Validation failed');
  });

  it('returns 400 for invalid heightUnit', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-123' } });

    const request = new NextRequest('http://localhost/api/preferences', {
      method: 'PUT',
      body: JSON.stringify({ heightUnit: 'meters' }),
    });

    const response = await PUT(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Validation failed');
  });

  it('returns 400 for invalid dateFormat', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-123' } });

    const request = new NextRequest('http://localhost/api/preferences', {
      method: 'PUT',
      body: JSON.stringify({ dateFormat: 'YYYY/MM/DD' }),
    });

    const response = await PUT(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Validation failed');
  });

  it('returns 400 for invalid weekStartsOn', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-123' } });

    const request = new NextRequest('http://localhost/api/preferences', {
      method: 'PUT',
      body: JSON.stringify({ weekStartsOn: 7 }),
    });

    const response = await PUT(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Validation failed');
  });

  it('returns 400 for invalid theme', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-123' } });

    const request = new NextRequest('http://localhost/api/preferences', {
      method: 'PUT',
      body: JSON.stringify({ theme: 'blue' }),
    });

    const response = await PUT(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Validation failed');
  });

  it('creates preferences with defaults if none exist', async () => {
    const newPreferences = {
      id: 'pref-new',
      userId: 'user-123',
      weightUnit: 'lbs',
      heightUnit: 'cm',
      dateFormat: 'DD/MM/YYYY',
      weekStartsOn: 1,
      theme: 'dark',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    mockAuth.mockResolvedValue({ user: { id: 'user-123' } });
    mockFindFirst.mockResolvedValue(null);
    mockReturning.mockResolvedValue([newPreferences]);

    const request = new NextRequest('http://localhost/api/preferences', {
      method: 'PUT',
      body: JSON.stringify({ weightUnit: 'lbs' }),
    });

    const response = await PUT(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(mockValues).toHaveBeenCalled();
    expect(data.weightUnit).toBe('lbs');
  });

  it('updates existing preferences', async () => {
    const existingPreferences = {
      id: 'pref-123',
      userId: 'user-123',
      weightUnit: 'kg',
      heightUnit: 'cm',
      dateFormat: 'DD/MM/YYYY',
      weekStartsOn: 1,
      theme: 'dark',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const updatedPreferences = {
      ...existingPreferences,
      weightUnit: 'lbs',
      theme: 'light',
      updatedAt: new Date(),
    };

    mockAuth.mockResolvedValue({ user: { id: 'user-123' } });
    mockFindFirst.mockResolvedValue(existingPreferences);
    mockReturning.mockResolvedValue([updatedPreferences]);

    const request = new NextRequest('http://localhost/api/preferences', {
      method: 'PUT',
      body: JSON.stringify({ weightUnit: 'lbs', theme: 'light' }),
    });

    const response = await PUT(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.weightUnit).toBe('lbs');
    expect(data.theme).toBe('light');
  });

  it('updates only provided fields', async () => {
    const existingPreferences = {
      id: 'pref-123',
      userId: 'user-123',
      weightUnit: 'kg',
      heightUnit: 'cm',
      dateFormat: 'DD/MM/YYYY',
      weekStartsOn: 1,
      theme: 'dark',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    mockAuth.mockResolvedValue({ user: { id: 'user-123' } });
    mockFindFirst.mockResolvedValue(existingPreferences);
    mockReturning.mockResolvedValue([{ ...existingPreferences, theme: 'light' }]);

    const request = new NextRequest('http://localhost/api/preferences', {
      method: 'PUT',
      body: JSON.stringify({ theme: 'light' }),
    });

    const response = await PUT(request);

    expect(response.status).toBe(200);
    expect(mockSet).toHaveBeenCalled();
    const setCall = mockSet.mock.calls[0][0];
    expect(setCall.theme).toBe('light');
    expect(setCall.weightUnit).toBeUndefined();
  });

  it('accepts all valid weightUnit values', async () => {
    const existingPreferences = {
      id: 'pref-123',
      userId: 'user-123',
      weightUnit: 'kg',
      heightUnit: 'cm',
      dateFormat: 'DD/MM/YYYY',
      weekStartsOn: 1,
      theme: 'dark',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    mockAuth.mockResolvedValue({ user: { id: 'user-123' } });
    mockFindFirst.mockResolvedValue(existingPreferences);

    const weightUnits = ['kg', 'lbs', 'stone'];

    for (const unit of weightUnits) {
      mockReturning.mockResolvedValue([{ ...existingPreferences, weightUnit: unit }]);

      const request = new NextRequest('http://localhost/api/preferences', {
        method: 'PUT',
        body: JSON.stringify({ weightUnit: unit }),
      });

      const response = await PUT(request);
      expect(response.status).toBe(200);
    }
  });

  it('accepts all valid dateFormat values', async () => {
    const existingPreferences = {
      id: 'pref-123',
      userId: 'user-123',
      weightUnit: 'kg',
      heightUnit: 'cm',
      dateFormat: 'DD/MM/YYYY',
      weekStartsOn: 1,
      theme: 'dark',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    mockAuth.mockResolvedValue({ user: { id: 'user-123' } });
    mockFindFirst.mockResolvedValue(existingPreferences);

    const dateFormats = ['DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD'];

    for (const format of dateFormats) {
      mockReturning.mockResolvedValue([{ ...existingPreferences, dateFormat: format }]);

      const request = new NextRequest('http://localhost/api/preferences', {
        method: 'PUT',
        body: JSON.stringify({ dateFormat: format }),
      });

      const response = await PUT(request);
      expect(response.status).toBe(200);
    }
  });

  it('accepts weekStartsOn 0-6', async () => {
    const existingPreferences = {
      id: 'pref-123',
      userId: 'user-123',
      weightUnit: 'kg',
      heightUnit: 'cm',
      dateFormat: 'DD/MM/YYYY',
      weekStartsOn: 1,
      theme: 'dark',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    mockAuth.mockResolvedValue({ user: { id: 'user-123' } });
    mockFindFirst.mockResolvedValue(existingPreferences);

    for (let day = 0; day <= 6; day++) {
      mockReturning.mockResolvedValue([{ ...existingPreferences, weekStartsOn: day }]);

      const request = new NextRequest('http://localhost/api/preferences', {
        method: 'PUT',
        body: JSON.stringify({ weekStartsOn: day }),
      });

      const response = await PUT(request);
      expect(response.status).toBe(200);
    }
  });
});
