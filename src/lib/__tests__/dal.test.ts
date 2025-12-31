/**
 * Tests for the Data Access Layer (DAL)
 *
 * These tests verify that authentication and authorization
 * functions work correctly following the DAL pattern.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock next/navigation before importing DAL
const mockRedirect = vi.fn();
vi.mock('next/navigation', () => ({
  redirect: (url: string) => {
    mockRedirect(url);
    // Simulate redirect by throwing (Next.js behavior)
    throw new Error(`NEXT_REDIRECT:${url}`);
  },
}));

// Mock auth
const mockAuth = vi.fn();
vi.mock('@/lib/auth', () => ({
  auth: () => mockAuth(),
}));

// Mock db
const mockProfileFindFirst = vi.fn();
const mockPreferencesFindFirst = vi.fn();
vi.mock('@/lib/db', () => ({
  db: {
    query: {
      profiles: {
        findFirst: () => mockProfileFindFirst(),
      },
      userPreferences: {
        findFirst: () => mockPreferencesFindFirst(),
      },
    },
  },
  schema: {
    profiles: { userId: 'userId' },
    userPreferences: { userId: 'userId' },
  },
}));

// Mock React cache to just pass through the function
vi.mock('react', () => ({
  cache: <T extends (...args: unknown[]) => unknown>(fn: T) => fn,
}));

// Import DAL after mocks
import {
  verifySession,
  getSession,
  getUserProfile,
  verifySessionWithProfile,
  verifySessionForOnboarding,
  redirectIfAuthenticated,
  getUserPreferences,
} from '../dal';

beforeEach(() => {
  vi.clearAllMocks();
  mockRedirect.mockClear();
});

describe('DAL - Data Access Layer', () => {
  describe('verifySession', () => {
    it('should return session info for authenticated user', async () => {
      mockAuth.mockResolvedValue({
        user: { id: 'user-123', email: 'test@example.com' },
      });

      const result = await verifySession();

      expect(result).toEqual({
        isAuth: true,
        userId: 'user-123',
        email: 'test@example.com',
      });
      expect(mockRedirect).not.toHaveBeenCalled();
    });

    it('should redirect to /login when not authenticated', async () => {
      mockAuth.mockResolvedValue(null);

      await expect(verifySession()).rejects.toThrow('NEXT_REDIRECT:/login');
      expect(mockRedirect).toHaveBeenCalledWith('/login');
    });

    it('should redirect to /login when session has no user', async () => {
      mockAuth.mockResolvedValue({ user: null });

      await expect(verifySession()).rejects.toThrow('NEXT_REDIRECT:/login');
    });

    it('should redirect to /login when session user has no id', async () => {
      mockAuth.mockResolvedValue({ user: { email: 'test@example.com' } });

      await expect(verifySession()).rejects.toThrow('NEXT_REDIRECT:/login');
    });

    it('should handle missing email gracefully', async () => {
      mockAuth.mockResolvedValue({
        user: { id: 'user-123' },
      });

      const result = await verifySession();

      expect(result).toEqual({
        isAuth: true,
        userId: 'user-123',
        email: '',
      });
    });
  });

  describe('getSession', () => {
    it('should return session info for authenticated user', async () => {
      mockAuth.mockResolvedValue({
        user: { id: 'user-123', email: 'test@example.com' },
      });

      const result = await getSession();

      expect(result).toEqual({
        isAuth: true,
        userId: 'user-123',
        email: 'test@example.com',
      });
    });

    it('should return null when not authenticated', async () => {
      mockAuth.mockResolvedValue(null);

      const result = await getSession();

      expect(result).toBeNull();
      expect(mockRedirect).not.toHaveBeenCalled();
    });

    it('should return null when session has no user', async () => {
      mockAuth.mockResolvedValue({ user: null });

      const result = await getSession();

      expect(result).toBeNull();
    });

    it('should return null when session user has no id', async () => {
      mockAuth.mockResolvedValue({ user: { email: 'test@example.com' } });

      const result = await getSession();

      expect(result).toBeNull();
    });
  });

  describe('getUserProfile', () => {
    it('should return profile when it exists', async () => {
      const mockProfile = {
        id: 'profile-123',
        userId: 'user-123',
        age: 35,
        gender: 'female',
      };
      mockProfileFindFirst.mockResolvedValue(mockProfile);

      const result = await getUserProfile('user-123');

      expect(result).toEqual(mockProfile);
    });

    it('should return null when profile does not exist', async () => {
      mockProfileFindFirst.mockResolvedValue(undefined);

      const result = await getUserProfile('user-123');

      expect(result).toBeNull();
    });
  });

  describe('getUserPreferences', () => {
    it('should return preferences when they exist', async () => {
      const mockPrefs = {
        userId: 'user-123',
        weightUnit: 'lbs',
        heightUnit: 'ft',
        dateFormat: 'MM/DD/YYYY',
      };
      mockPreferencesFindFirst.mockResolvedValue(mockPrefs);

      const result = await getUserPreferences('user-123');

      expect(result).toEqual(mockPrefs);
    });

    it('should return defaults when preferences do not exist', async () => {
      mockPreferencesFindFirst.mockResolvedValue(undefined);

      const result = await getUserPreferences('user-123');

      expect(result).toEqual({
        userId: 'user-123',
        weightUnit: 'kg',
        heightUnit: 'cm',
        dateFormat: 'DD/MM/YYYY',
        emailInjectionReminder: true,
        emailWeightReminder: false,
        emailWeeklyReport: true,
        reminderDaysBefore: 1,
      });
    });
  });

  describe('verifySessionWithProfile', () => {
    it('should return session and profile for authenticated user with profile', async () => {
      mockAuth.mockResolvedValue({
        user: { id: 'user-123', email: 'test@example.com' },
      });
      const mockProfile = {
        id: 'profile-123',
        userId: 'user-123',
        age: 35,
      };
      mockProfileFindFirst.mockResolvedValue(mockProfile);

      const result = await verifySessionWithProfile();

      expect(result).toEqual({
        isAuth: true,
        userId: 'user-123',
        email: 'test@example.com',
        profile: mockProfile,
      });
    });

    it('should redirect to /login when not authenticated', async () => {
      mockAuth.mockResolvedValue(null);

      await expect(verifySessionWithProfile()).rejects.toThrow('NEXT_REDIRECT:/login');
    });

    it('should redirect to /onboarding when profile does not exist', async () => {
      mockAuth.mockResolvedValue({
        user: { id: 'user-123', email: 'test@example.com' },
      });
      mockProfileFindFirst.mockResolvedValue(undefined);

      await expect(verifySessionWithProfile()).rejects.toThrow('NEXT_REDIRECT:/onboarding');
    });
  });

  describe('verifySessionForOnboarding', () => {
    it('should return session when authenticated without profile', async () => {
      mockAuth.mockResolvedValue({
        user: { id: 'user-123', email: 'test@example.com' },
      });
      mockProfileFindFirst.mockResolvedValue(undefined);

      const result = await verifySessionForOnboarding();

      expect(result).toEqual({
        isAuth: true,
        userId: 'user-123',
        email: 'test@example.com',
      });
    });

    it('should redirect to /login when not authenticated', async () => {
      mockAuth.mockResolvedValue(null);

      await expect(verifySessionForOnboarding()).rejects.toThrow('NEXT_REDIRECT:/login');
    });

    it('should redirect to /summary when profile already exists', async () => {
      mockAuth.mockResolvedValue({
        user: { id: 'user-123', email: 'test@example.com' },
      });
      mockProfileFindFirst.mockResolvedValue({ id: 'profile-123' });

      await expect(verifySessionForOnboarding()).rejects.toThrow('NEXT_REDIRECT:/summary');
    });
  });

  describe('redirectIfAuthenticated', () => {
    it('should not redirect when not authenticated', async () => {
      mockAuth.mockResolvedValue(null);

      await redirectIfAuthenticated();

      expect(mockRedirect).not.toHaveBeenCalled();
    });

    it('should redirect to /summary when authenticated', async () => {
      mockAuth.mockResolvedValue({
        user: { id: 'user-123', email: 'test@example.com' },
      });

      await expect(redirectIfAuthenticated()).rejects.toThrow('NEXT_REDIRECT:/summary');
    });
  });
});
