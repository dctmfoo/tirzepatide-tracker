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
const mockSet = vi.fn();
const mockWhere = vi.fn();
const mockReturning = vi.fn();

vi.mock('@/lib/db', () => ({
  db: {
    query: {
      profiles: {
        findFirst: (...args: unknown[]) => mockFindFirst(...args),
      },
    },
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
    profiles: {
      userId: 'userId',
    },
  },
}));

describe('GET /api/profile', () => {
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

  it('returns 404 when profile not found', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-123' } });
    mockFindFirst.mockResolvedValue(null);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('Profile not found');
  });

  it('returns profile data for authenticated user', async () => {
    const mockProfile = {
      id: 'profile-123',
      userId: 'user-123',
      age: 35,
      gender: 'male',
      heightCm: '175',
      startingWeightKg: '95.5',
      goalWeightKg: '75.0',
      treatmentStartDate: '2025-01-01',
      preferredInjectionDay: 3,
      reminderDaysBefore: 1,
      createdAt: new Date('2025-01-01'),
      updatedAt: new Date('2025-01-15'),
    };

    mockAuth.mockResolvedValue({ user: { id: 'user-123' } });
    mockFindFirst.mockResolvedValue(mockProfile);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.id).toBe('profile-123');
    expect(data.age).toBe(35);
    expect(data.gender).toBe('male');
    expect(data.heightCm).toBe(175);
    expect(data.startingWeightKg).toBe(95.5);
    expect(data.goalWeightKg).toBe(75);
    expect(data.treatmentStartDate).toBe('2025-01-01');
    expect(data.preferredInjectionDay).toBe(3);
  });

  it('converts string decimal fields to numbers', async () => {
    const mockProfile = {
      id: 'profile-123',
      heightCm: '168.5',
      startingWeightKg: '92.25',
      goalWeightKg: '70.00',
      age: 27,
      gender: 'female',
      treatmentStartDate: '2025-01-01',
      preferredInjectionDay: null,
      reminderDaysBefore: 2,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    mockAuth.mockResolvedValue({ user: { id: 'user-123' } });
    mockFindFirst.mockResolvedValue(mockProfile);

    const response = await GET();
    const data = await response.json();

    expect(typeof data.heightCm).toBe('number');
    expect(typeof data.startingWeightKg).toBe('number');
    expect(typeof data.goalWeightKg).toBe('number');
    expect(data.heightCm).toBe(168.5);
    expect(data.startingWeightKg).toBe(92.25);
    expect(data.goalWeightKg).toBe(70);
  });
});

describe('PUT /api/profile', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when not authenticated', async () => {
    mockAuth.mockResolvedValue(null);

    const request = new NextRequest('http://localhost/api/profile', {
      method: 'PUT',
      body: JSON.stringify({ age: 30 }),
    });

    const response = await PUT(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });

  it('returns 400 for invalid age (too young)', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-123' } });

    const request = new NextRequest('http://localhost/api/profile', {
      method: 'PUT',
      body: JSON.stringify({ age: 15 }),
    });

    const response = await PUT(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Validation failed');
  });

  it('returns 400 for invalid gender value', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-123' } });

    const request = new NextRequest('http://localhost/api/profile', {
      method: 'PUT',
      body: JSON.stringify({ gender: 'invalid' }),
    });

    const response = await PUT(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Validation failed');
  });

  it('returns 400 for invalid height (too short)', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-123' } });

    const request = new NextRequest('http://localhost/api/profile', {
      method: 'PUT',
      body: JSON.stringify({ heightCm: 50 }),
    });

    const response = await PUT(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Validation failed');
  });

  it('returns 400 for invalid treatment start date format', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-123' } });

    const request = new NextRequest('http://localhost/api/profile', {
      method: 'PUT',
      body: JSON.stringify({ treatmentStartDate: '01-01-2025' }),
    });

    const response = await PUT(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Validation failed');
  });

  it('returns 404 when profile not found', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-123' } });
    mockFindFirst.mockResolvedValue(null);

    const request = new NextRequest('http://localhost/api/profile', {
      method: 'PUT',
      body: JSON.stringify({ age: 30 }),
    });

    const response = await PUT(request);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('Profile not found');
  });

  it('updates profile with valid data', async () => {
    const existingProfile = {
      id: 'profile-123',
      userId: 'user-123',
      age: 35,
      gender: 'male',
      heightCm: '175',
      startingWeightKg: '95.5',
      goalWeightKg: '75.0',
      treatmentStartDate: '2025-01-01',
      preferredInjectionDay: 3,
      reminderDaysBefore: 1,
      createdAt: new Date('2025-01-01'),
      updatedAt: new Date('2025-01-15'),
    };

    const updatedProfile = {
      ...existingProfile,
      age: 36,
      goalWeightKg: '72.0',
      updatedAt: new Date(),
    };

    mockAuth.mockResolvedValue({ user: { id: 'user-123' } });
    mockFindFirst.mockResolvedValue(existingProfile);
    mockReturning.mockResolvedValue([updatedProfile]);

    const request = new NextRequest('http://localhost/api/profile', {
      method: 'PUT',
      body: JSON.stringify({ age: 36, goalWeightKg: 72 }),
    });

    const response = await PUT(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.age).toBe(36);
    expect(data.goalWeightKg).toBe(72);
  });

  it('updates only provided fields', async () => {
    const existingProfile = {
      id: 'profile-123',
      userId: 'user-123',
      age: 35,
      gender: 'male',
      heightCm: '175',
      startingWeightKg: '95.5',
      goalWeightKg: '75.0',
      treatmentStartDate: '2025-01-01',
      preferredInjectionDay: 3,
      reminderDaysBefore: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    mockAuth.mockResolvedValue({ user: { id: 'user-123' } });
    mockFindFirst.mockResolvedValue(existingProfile);
    mockReturning.mockResolvedValue([{ ...existingProfile, heightCm: '180' }]);

    const request = new NextRequest('http://localhost/api/profile', {
      method: 'PUT',
      body: JSON.stringify({ heightCm: 180 }),
    });

    const response = await PUT(request);

    expect(response.status).toBe(200);
    expect(mockSet).toHaveBeenCalled();
    const setCall = mockSet.mock.calls[0][0];
    expect(setCall.heightCm).toBe('180');
    expect(setCall.age).toBeUndefined();
  });

  it('accepts valid gender values', async () => {
    const existingProfile = {
      id: 'profile-123',
      userId: 'user-123',
      age: 35,
      gender: 'male',
      heightCm: '175',
      startingWeightKg: '95.5',
      goalWeightKg: '75.0',
      treatmentStartDate: '2025-01-01',
      preferredInjectionDay: null,
      reminderDaysBefore: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    mockAuth.mockResolvedValue({ user: { id: 'user-123' } });
    mockFindFirst.mockResolvedValue(existingProfile);

    const genders = ['male', 'female', 'other', 'prefer_not_to_say'];

    for (const gender of genders) {
      mockReturning.mockResolvedValue([{ ...existingProfile, gender }]);

      const request = new NextRequest('http://localhost/api/profile', {
        method: 'PUT',
        body: JSON.stringify({ gender }),
      });

      const response = await PUT(request);
      expect(response.status).toBe(200);
    }
  });

  it('accepts null for preferredInjectionDay', async () => {
    const existingProfile = {
      id: 'profile-123',
      userId: 'user-123',
      age: 35,
      gender: 'male',
      heightCm: '175',
      startingWeightKg: '95.5',
      goalWeightKg: '75.0',
      treatmentStartDate: '2025-01-01',
      preferredInjectionDay: 3,
      reminderDaysBefore: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    mockAuth.mockResolvedValue({ user: { id: 'user-123' } });
    mockFindFirst.mockResolvedValue(existingProfile);
    mockReturning.mockResolvedValue([{ ...existingProfile, preferredInjectionDay: null }]);

    const request = new NextRequest('http://localhost/api/profile', {
      method: 'PUT',
      body: JSON.stringify({ preferredInjectionDay: null }),
    });

    const response = await PUT(request);

    expect(response.status).toBe(200);
  });

  it('validates preferredInjectionDay is 0-6', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-123' } });

    const request = new NextRequest('http://localhost/api/profile', {
      method: 'PUT',
      body: JSON.stringify({ preferredInjectionDay: 7 }),
    });

    const response = await PUT(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Validation failed');
  });

  it('validates reminderDaysBefore is 0-7', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-123' } });

    const request = new NextRequest('http://localhost/api/profile', {
      method: 'PUT',
      body: JSON.stringify({ reminderDaysBefore: 10 }),
    });

    const response = await PUT(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Validation failed');
  });
});
