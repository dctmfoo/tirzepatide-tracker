import { describe, it, expect, beforeEach, vi } from 'vitest';
import { POST } from '../route';

// Mock bcryptjs
vi.mock('bcryptjs', () => ({
  default: {
    hash: vi.fn().mockResolvedValue('new-hashed-password'),
  },
}));

// Mock database methods
const mockFindFirst = vi.fn();
const mockUpdate = vi.fn().mockReturnThis();
const mockSet = vi.fn().mockReturnThis();
const mockWhere = vi.fn();

vi.mock('@/lib/db', () => ({
  db: {
    query: {
      passwordResetTokens: {
        findFirst: (...args: unknown[]) => mockFindFirst(...args),
      },
    },
    update: () => mockUpdate(),
  },
  schema: {
    users: {
      id: 'id',
      passwordHash: 'passwordHash',
      updatedAt: 'updatedAt',
    },
    passwordResetTokens: {
      id: 'id',
      token: 'token',
      usedAt: 'usedAt',
      expiresAt: 'expiresAt',
    },
  },
}));

// Mock drizzle-orm
vi.mock('drizzle-orm', () => ({
  eq: vi.fn((a, b) => ({ type: 'eq', field: a, value: b })),
  and: vi.fn((...conditions) => ({ type: 'and', conditions })),
  isNull: vi.fn((field) => ({ type: 'isNull', field })),
  gt: vi.fn((a, b) => ({ type: 'gt', field: a, value: b })),
}));

// Helper to create request
const createRequest = (body: unknown) => {
  return new Request('http://localhost:3000/api/auth/reset-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
};

describe('POST /api/auth/reset-password', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUpdate.mockReturnValue({ set: mockSet });
    mockSet.mockReturnValue({ where: mockWhere });
    mockWhere.mockResolvedValue(undefined);
  });

  describe('Validation', () => {
    it('returns 400 for missing token', async () => {
      const request = createRequest({
        password: 'NewValidPass123',
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Validation failed');
    });

    it('returns 400 for empty token', async () => {
      const request = createRequest({
        token: '',
        password: 'NewValidPass123',
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Validation failed');
    });

    it('returns 400 for missing password', async () => {
      const request = createRequest({
        token: 'valid-token',
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Validation failed');
    });

    it('returns 400 for password less than 8 characters', async () => {
      const request = createRequest({
        token: 'valid-token',
        password: 'Short1',
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Validation failed');
    });

    it('returns 400 for password without uppercase letter', async () => {
      const request = createRequest({
        token: 'valid-token',
        password: 'alllowercase123',
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Validation failed');
    });

    it('returns 400 for password without lowercase letter', async () => {
      const request = createRequest({
        token: 'valid-token',
        password: 'ALLUPPERCASE123',
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Validation failed');
    });

    it('returns 400 for password without number', async () => {
      const request = createRequest({
        token: 'valid-token',
        password: 'NoNumbersHere',
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Validation failed');
    });
  });

  describe('Token Validation', () => {
    it('returns 400 for non-existent token', async () => {
      mockFindFirst.mockResolvedValue(null);

      const request = createRequest({
        token: 'nonexistent-token',
        password: 'NewValidPass123',
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Invalid or expired');
    });

    it('returns 400 for already used token', async () => {
      // Token not found because query includes isNull(usedAt)
      mockFindFirst.mockResolvedValue(null);

      const request = createRequest({
        token: 'already-used-token',
        password: 'NewValidPass123',
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Invalid or expired');
    });

    it('returns 400 for expired token', async () => {
      // Token not found because query includes gt(expiresAt, now)
      mockFindFirst.mockResolvedValue(null);

      const request = createRequest({
        token: 'expired-token',
        password: 'NewValidPass123',
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Invalid or expired');
    });
  });

  describe('Successful Password Reset', () => {
    it('resets password with valid token', async () => {
      const validToken = {
        id: 'token-id',
        userId: 'user-id',
        token: 'valid-token',
        usedAt: null,
        expiresAt: new Date(Date.now() + 3600000), // 1 hour from now
      };
      mockFindFirst.mockResolvedValue(validToken);

      const request = createRequest({
        token: 'valid-token',
        password: 'NewValidPass123',
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.message).toContain('Password reset successfully');
    });

    it('updates user password', async () => {
      const validToken = {
        id: 'token-id',
        userId: 'user-id',
        token: 'valid-token',
        usedAt: null,
        expiresAt: new Date(Date.now() + 3600000),
      };
      mockFindFirst.mockResolvedValue(validToken);

      const request = createRequest({
        token: 'valid-token',
        password: 'NewValidPass123',
      });
      await POST(request);

      // Verify password update was called
      expect(mockUpdate).toHaveBeenCalled();
      expect(mockSet).toHaveBeenCalled();
    });

    it('marks token as used', async () => {
      const validToken = {
        id: 'token-id',
        userId: 'user-id',
        token: 'valid-token',
        usedAt: null,
        expiresAt: new Date(Date.now() + 3600000),
      };
      mockFindFirst.mockResolvedValue(validToken);

      const request = createRequest({
        token: 'valid-token',
        password: 'NewValidPass123',
      });
      await POST(request);

      // Update should be called twice: once for user, once for token
      expect(mockUpdate).toHaveBeenCalledTimes(2);
    });

    it('accepts password at minimum length (8 chars)', async () => {
      const validToken = {
        id: 'token-id',
        userId: 'user-id',
        token: 'valid-token',
        usedAt: null,
        expiresAt: new Date(Date.now() + 3600000),
      };
      mockFindFirst.mockResolvedValue(validToken);

      const request = createRequest({
        token: 'valid-token',
        password: 'Abcdef1!', // Exactly 8 characters
      });
      const response = await POST(request);

      expect(response.status).toBe(200);
    });

    it('accepts password with special characters', async () => {
      const validToken = {
        id: 'token-id',
        userId: 'user-id',
        token: 'valid-token',
        usedAt: null,
        expiresAt: new Date(Date.now() + 3600000),
      };
      mockFindFirst.mockResolvedValue(validToken);

      const request = createRequest({
        token: 'valid-token',
        password: 'NewPass123!@#$%',
      });
      const response = await POST(request);

      expect(response.status).toBe(200);
    });
  });

  describe('Error Handling', () => {
    it('returns 500 for database errors during token lookup', async () => {
      mockFindFirst.mockRejectedValue(new Error('Database connection failed'));

      const request = createRequest({
        token: 'valid-token',
        password: 'NewValidPass123',
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Internal server error');
    });

    it('returns 500 for database errors during password update', async () => {
      const validToken = {
        id: 'token-id',
        userId: 'user-id',
        token: 'valid-token',
        usedAt: null,
        expiresAt: new Date(Date.now() + 3600000),
      };
      mockFindFirst.mockResolvedValue(validToken);
      mockWhere.mockRejectedValue(new Error('Update failed'));

      const request = createRequest({
        token: 'valid-token',
        password: 'NewValidPass123',
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Internal server error');
    });
  });
});
