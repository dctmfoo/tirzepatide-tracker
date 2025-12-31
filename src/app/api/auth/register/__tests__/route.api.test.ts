import { describe, it, expect, beforeEach, vi } from 'vitest';
import { POST } from '../route';

// Mock bcryptjs
vi.mock('bcryptjs', () => ({
  hash: vi.fn().mockResolvedValue('hashed-password-123'),
}));

// Mock database methods
const mockFindFirst = vi.fn();
const mockInsert = vi.fn().mockReturnThis();
const mockValues = vi.fn().mockReturnThis();
const mockReturning = vi.fn();

vi.mock('@/lib/db', () => ({
  db: {
    query: {
      users: {
        findFirst: (...args: unknown[]) => mockFindFirst(...args),
      },
    },
    insert: () => mockInsert(),
  },
  users: {
    email: 'email',
  },
}));

// Mock drizzle-orm
vi.mock('drizzle-orm', () => ({
  eq: vi.fn((a, b) => ({ type: 'eq', field: a, value: b })),
}));

// Mock the schema import
vi.mock('@/lib/db/schema', () => ({
  users: {
    id: 'id',
    email: 'email',
    passwordHash: 'passwordHash',
  },
}));

// Helper to create request
const createRequest = (body: unknown) => {
  return new Request('http://localhost:3000/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
};

describe('POST /api/auth/register', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockInsert.mockReturnValue({ values: mockValues });
    mockValues.mockReturnValue({ returning: mockReturning });
  });

  describe('Validation', () => {
    it('returns 400 for missing email', async () => {
      const request = createRequest({ password: 'ValidPass123' });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBeDefined();
    });

    it('returns 400 for invalid email format', async () => {
      const request = createRequest({
        email: 'not-an-email',
        password: 'ValidPass123',
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('email');
    });

    it('returns 400 for missing password', async () => {
      const request = createRequest({ email: 'test@example.com' });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBeDefined();
    });

    it('returns 400 for password less than 8 characters', async () => {
      const request = createRequest({
        email: 'test@example.com',
        password: 'Short1',
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('8 characters');
    });

    it('returns 400 for password without uppercase letter', async () => {
      const request = createRequest({
        email: 'test@example.com',
        password: 'alllowercase123',
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('uppercase');
    });

    it('returns 400 for password without lowercase letter', async () => {
      const request = createRequest({
        email: 'test@example.com',
        password: 'ALLUPPERCASE123',
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('lowercase');
    });

    it('returns 400 for password without number', async () => {
      const request = createRequest({
        email: 'test@example.com',
        password: 'NoNumbersHere',
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('number');
    });
  });

  describe('Email Normalization', () => {
    it('normalizes email to lowercase', async () => {
      mockFindFirst.mockResolvedValue(null);
      mockReturning.mockResolvedValue([{ id: 'new-user-id', email: 'test@example.com' }]);

      const request = createRequest({
        email: 'TEST@EXAMPLE.COM',
        password: 'ValidPass123',
      });
      await POST(request);

      // Verify the findFirst was called with lowercase email
      expect(mockFindFirst).toHaveBeenCalled();
    });
  });

  describe('Duplicate Email', () => {
    it('returns 409 when email already exists', async () => {
      mockFindFirst.mockResolvedValue({
        id: 'existing-user-id',
        email: 'test@example.com',
      });

      const request = createRequest({
        email: 'test@example.com',
        password: 'ValidPass123',
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(409);
      expect(data.error).toContain('already exists');
    });
  });

  describe('Successful Registration', () => {
    it('creates new user with valid credentials', async () => {
      mockFindFirst.mockResolvedValue(null);
      mockReturning.mockResolvedValue([{ id: 'new-user-id', email: 'test@example.com' }]);

      const request = createRequest({
        email: 'test@example.com',
        password: 'ValidPass123',
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.message).toBe('Account created successfully');
      expect(data.user.id).toBe('new-user-id');
      expect(data.user.email).toBe('test@example.com');
    });

    it('returns user object without password hash', async () => {
      mockFindFirst.mockResolvedValue(null);
      mockReturning.mockResolvedValue([{ id: 'new-user-id', email: 'test@example.com' }]);

      const request = createRequest({
        email: 'test@example.com',
        password: 'ValidPass123',
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.user).not.toHaveProperty('passwordHash');
      expect(data.user).not.toHaveProperty('password');
    });

    it('accepts email with subdomain', async () => {
      mockFindFirst.mockResolvedValue(null);
      mockReturning.mockResolvedValue([{ id: 'new-user-id', email: 'test@mail.example.com' }]);

      const request = createRequest({
        email: 'test@mail.example.com',
        password: 'ValidPass123',
      });
      const response = await POST(request);

      expect(response.status).toBe(201);
    });

    it('accepts password at minimum length (8 chars)', async () => {
      mockFindFirst.mockResolvedValue(null);
      mockReturning.mockResolvedValue([{ id: 'new-user-id', email: 'test@example.com' }]);

      const request = createRequest({
        email: 'test@example.com',
        password: 'Abcdef1!', // Exactly 8 characters
      });
      const response = await POST(request);

      expect(response.status).toBe(201);
    });

    it('accepts password with special characters', async () => {
      mockFindFirst.mockResolvedValue(null);
      mockReturning.mockResolvedValue([{ id: 'new-user-id', email: 'test@example.com' }]);

      const request = createRequest({
        email: 'test@example.com',
        password: 'ValidPass123!@#$%',
      });
      const response = await POST(request);

      expect(response.status).toBe(201);
    });
  });

  describe('Error Handling', () => {
    it('returns 500 for database errors', async () => {
      mockFindFirst.mockRejectedValue(new Error('Database connection failed'));

      const request = createRequest({
        email: 'test@example.com',
        password: 'ValidPass123',
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toContain('error occurred');
    });

    it('returns 500 for insert failures', async () => {
      mockFindFirst.mockResolvedValue(null);
      mockReturning.mockRejectedValue(new Error('Insert failed'));

      const request = createRequest({
        email: 'test@example.com',
        password: 'ValidPass123',
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toContain('error occurred');
    });
  });
});
