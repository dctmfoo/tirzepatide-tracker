import { describe, it, expect, beforeEach, vi } from 'vitest';
import { POST } from '../route';

// Mock auth module
const mockAuth = vi.fn();
vi.mock('@/lib/auth', () => ({
  auth: () => mockAuth(),
}));

// Mock database methods
const mockFindFirst = vi.fn();
const mockTransaction = vi.fn();

vi.mock('@/lib/db', () => ({
  db: {
    query: {
      profiles: {
        findFirst: (...args: unknown[]) => mockFindFirst(...args),
      },
    },
    transaction: (callback: (tx: unknown) => Promise<unknown>) => mockTransaction(callback),
  },
  schema: {
    profiles: {
      userId: 'userId',
    },
    userPreferences: {},
    weightEntries: {},
    injections: {},
  },
}));

// Mock drizzle-orm
vi.mock('drizzle-orm', () => ({
  eq: vi.fn((a, b) => ({ type: 'eq', field: a, value: b })),
}));

// Mock validation schema
vi.mock('@/lib/validations/onboarding', () => ({
  onboardingSchema: {
    safeParse: vi.fn((data) => {
      // Basic validation
      if (!data.age || !data.gender || !data.heightCm || !data.startingWeightKg || !data.goalWeightKg || !data.treatmentStartDate || !data.firstInjection) {
        return {
          success: false,
          error: { flatten: () => ({ formErrors: [], fieldErrors: {} }) },
        };
      }
      if (data.age < 18 || data.age > 120) {
        return {
          success: false,
          error: { flatten: () => ({ formErrors: [], fieldErrors: { age: ['Invalid age'] } }) },
        };
      }
      if (!['male', 'female', 'other', 'prefer_not_to_say'].includes(data.gender)) {
        return {
          success: false,
          error: { flatten: () => ({ formErrors: [], fieldErrors: { gender: ['Invalid gender'] } }) },
        };
      }
      return { success: true, data };
    }),
  },
}));

// Helper to create request
const createRequest = (body: unknown) => {
  return new Request('http://localhost:3000/api/onboarding/complete', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
};

// Valid onboarding data
const validOnboardingData = {
  age: 35,
  gender: 'male',
  heightCm: 180,
  startingWeightKg: 95,
  goalWeightKg: 80,
  treatmentStartDate: '2025-01-01',
  weightUnit: 'kg',
  heightUnit: 'cm',
  firstInjection: {
    doseMg: 2.5,
    injectionSite: 'thigh_left',
    injectionDate: '2025-01-01T10:00:00Z',
  },
};

describe('POST /api/onboarding/complete', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Authentication', () => {
    it('returns 401 when not authenticated', async () => {
      mockAuth.mockResolvedValue(null);

      const request = createRequest(validOnboardingData);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('returns 401 when session has no user id', async () => {
      mockAuth.mockResolvedValue({ user: {} });

      const request = createRequest(validOnboardingData);
      const response = await POST(request);

      expect(response.status).toBe(401);
    });
  });

  describe('Profile Already Exists', () => {
    it('returns 409 when profile already exists', async () => {
      mockAuth.mockResolvedValue({ user: { id: 'test-user-id' } });
      mockFindFirst.mockResolvedValue({
        id: 'existing-profile-id',
        userId: 'test-user-id',
      });

      const request = createRequest(validOnboardingData);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(409);
      expect(data.error).toContain('already exists');
    });
  });

  describe('Validation', () => {
    it('returns 400 for missing age', async () => {
      mockAuth.mockResolvedValue({ user: { id: 'test-user-id' } });
      mockFindFirst.mockResolvedValue(null);

      const invalidData = { ...validOnboardingData, age: undefined };
      const request = createRequest(invalidData);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Validation failed');
    });

    it('returns 400 for age below minimum (18)', async () => {
      mockAuth.mockResolvedValue({ user: { id: 'test-user-id' } });
      mockFindFirst.mockResolvedValue(null);

      const invalidData = { ...validOnboardingData, age: 17 };
      const request = createRequest(invalidData);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Validation failed');
    });

    it('returns 400 for age above maximum (120)', async () => {
      mockAuth.mockResolvedValue({ user: { id: 'test-user-id' } });
      mockFindFirst.mockResolvedValue(null);

      const invalidData = { ...validOnboardingData, age: 121 };
      const request = createRequest(invalidData);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Validation failed');
    });

    it('returns 400 for invalid gender', async () => {
      mockAuth.mockResolvedValue({ user: { id: 'test-user-id' } });
      mockFindFirst.mockResolvedValue(null);

      const invalidData = { ...validOnboardingData, gender: 'invalid' };
      const request = createRequest(invalidData);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Validation failed');
    });

    it('returns 400 for missing heightCm', async () => {
      mockAuth.mockResolvedValue({ user: { id: 'test-user-id' } });
      mockFindFirst.mockResolvedValue(null);

      const invalidData = { ...validOnboardingData, heightCm: undefined };
      const request = createRequest(invalidData);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Validation failed');
    });

    it('returns 400 for missing startingWeightKg', async () => {
      mockAuth.mockResolvedValue({ user: { id: 'test-user-id' } });
      mockFindFirst.mockResolvedValue(null);

      const invalidData = { ...validOnboardingData, startingWeightKg: undefined };
      const request = createRequest(invalidData);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Validation failed');
    });

    it('returns 400 for missing goalWeightKg', async () => {
      mockAuth.mockResolvedValue({ user: { id: 'test-user-id' } });
      mockFindFirst.mockResolvedValue(null);

      const invalidData = { ...validOnboardingData, goalWeightKg: undefined };
      const request = createRequest(invalidData);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Validation failed');
    });

    it('returns 400 for missing firstInjection', async () => {
      mockAuth.mockResolvedValue({ user: { id: 'test-user-id' } });
      mockFindFirst.mockResolvedValue(null);

      const invalidData = { ...validOnboardingData, firstInjection: undefined };
      const request = createRequest(invalidData);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Validation failed');
    });
  });

  describe('Successful Onboarding', () => {
    it('completes onboarding with valid data', async () => {
      mockAuth.mockResolvedValue({ user: { id: 'test-user-id' } });
      mockFindFirst.mockResolvedValue(null);

      const mockTx = {
        insert: vi.fn().mockReturnThis(),
        values: vi.fn().mockReturnThis(),
        returning: vi.fn(),
      };
      mockTx.insert.mockReturnValue({ values: mockTx.values });
      mockTx.values.mockReturnValue({ returning: mockTx.returning });
      mockTx.returning
        .mockResolvedValueOnce([{ id: 'profile-id', age: 35, gender: 'male' }])
        .mockResolvedValueOnce([{ id: 'pref-id', weightUnit: 'kg', heightUnit: 'cm' }])
        .mockResolvedValueOnce([{ id: 'weight-id', weightKg: '95', recordedAt: new Date() }])
        .mockResolvedValueOnce([{ id: 'inj-id', doseMg: '2.5', injectionSite: 'thigh_left', injectionDate: new Date() }]);

      mockTransaction.mockImplementation(async (callback) => {
        return callback(mockTx);
      });

      const request = createRequest(validOnboardingData);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.profile).toBeDefined();
      expect(data.preferences).toBeDefined();
      expect(data.weightEntry).toBeDefined();
      expect(data.injection).toBeDefined();
      expect(data.redirectTo).toBe('/summary');
    });

    it('accepts all valid gender options', async () => {
      mockAuth.mockResolvedValue({ user: { id: 'test-user-id' } });
      mockFindFirst.mockResolvedValue(null);

      const mockTx = {
        insert: vi.fn().mockReturnThis(),
        values: vi.fn().mockReturnThis(),
        returning: vi.fn(),
      };
      mockTx.insert.mockReturnValue({ values: mockTx.values });
      mockTx.values.mockReturnValue({ returning: mockTx.returning });

      const validGenders = ['male', 'female', 'other', 'prefer_not_to_say'];

      for (const gender of validGenders) {
        mockTx.returning
          .mockResolvedValueOnce([{ id: 'profile-id', age: 35, gender }])
          .mockResolvedValueOnce([{ id: 'pref-id', weightUnit: 'kg', heightUnit: 'cm' }])
          .mockResolvedValueOnce([{ id: 'weight-id', weightKg: '95', recordedAt: new Date() }])
          .mockResolvedValueOnce([{ id: 'inj-id', doseMg: '2.5', injectionSite: 'thigh_left', injectionDate: new Date() }]);

        mockTransaction.mockImplementation(async (callback) => callback(mockTx));

        const request = createRequest({ ...validOnboardingData, gender });
        const response = await POST(request);

        expect(response.status).toBe(200);
      }
    });

    it('returns profile data in response', async () => {
      mockAuth.mockResolvedValue({ user: { id: 'test-user-id' } });
      mockFindFirst.mockResolvedValue(null);

      const mockTx = {
        insert: vi.fn().mockReturnThis(),
        values: vi.fn().mockReturnThis(),
        returning: vi.fn(),
      };
      mockTx.insert.mockReturnValue({ values: mockTx.values });
      mockTx.values.mockReturnValue({ returning: mockTx.returning });
      mockTx.returning
        .mockResolvedValueOnce([{ id: 'profile-id', age: 35, gender: 'male' }])
        .mockResolvedValueOnce([{ id: 'pref-id', weightUnit: 'kg', heightUnit: 'cm' }])
        .mockResolvedValueOnce([{ id: 'weight-id', weightKg: '95', recordedAt: new Date() }])
        .mockResolvedValueOnce([{ id: 'inj-id', doseMg: '2.5', injectionSite: 'thigh_left', injectionDate: new Date() }]);

      mockTransaction.mockImplementation(async (callback) => callback(mockTx));

      const request = createRequest(validOnboardingData);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.profile.id).toBe('profile-id');
      expect(data.profile.age).toBe(35);
      expect(data.profile.gender).toBe('male');
    });

    it('returns preferences data in response', async () => {
      mockAuth.mockResolvedValue({ user: { id: 'test-user-id' } });
      mockFindFirst.mockResolvedValue(null);

      const mockTx = {
        insert: vi.fn().mockReturnThis(),
        values: vi.fn().mockReturnThis(),
        returning: vi.fn(),
      };
      mockTx.insert.mockReturnValue({ values: mockTx.values });
      mockTx.values.mockReturnValue({ returning: mockTx.returning });
      mockTx.returning
        .mockResolvedValueOnce([{ id: 'profile-id', age: 35, gender: 'male' }])
        .mockResolvedValueOnce([{ id: 'pref-id', weightUnit: 'kg', heightUnit: 'cm' }])
        .mockResolvedValueOnce([{ id: 'weight-id', weightKg: '95', recordedAt: new Date() }])
        .mockResolvedValueOnce([{ id: 'inj-id', doseMg: '2.5', injectionSite: 'thigh_left', injectionDate: new Date() }]);

      mockTransaction.mockImplementation(async (callback) => callback(mockTx));

      const request = createRequest(validOnboardingData);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.preferences.id).toBe('pref-id');
      expect(data.preferences.weightUnit).toBe('kg');
      expect(data.preferences.heightUnit).toBe('cm');
    });
  });

  describe('Error Handling', () => {
    it('returns 500 for database errors during profile check', async () => {
      mockAuth.mockResolvedValue({ user: { id: 'test-user-id' } });
      mockFindFirst.mockRejectedValue(new Error('Database error'));

      const request = createRequest(validOnboardingData);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Internal server error');
    });

    it('returns 500 for transaction errors', async () => {
      mockAuth.mockResolvedValue({ user: { id: 'test-user-id' } });
      mockFindFirst.mockResolvedValue(null);
      mockTransaction.mockRejectedValue(new Error('Transaction failed'));

      const request = createRequest(validOnboardingData);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Internal server error');
    });
  });
});
