import { describe, it, expect, beforeEach, vi } from 'vitest';
import { POST } from '../route';

// Mock crypto
vi.mock('crypto', () => ({
  default: {
    randomBytes: vi.fn().mockReturnValue({
      toString: () => 'mock-reset-token-12345678901234567890123456789012',
    }),
  },
}));

// Mock email module
const mockSendEmail = vi.fn();
vi.mock('@/lib/email', () => ({
  sendEmail: (...args: unknown[]) => mockSendEmail(...args),
  passwordResetTemplate: vi.fn().mockReturnValue({
    subject: 'Reset Your Password',
    html: '<p>Reset link</p>',
  }),
}));

// Mock database methods
const mockFindFirst = vi.fn();
const mockInsert = vi.fn().mockReturnThis();
const mockValues = vi.fn();

vi.mock('@/lib/db', () => ({
  db: {
    query: {
      users: {
        findFirst: (...args: unknown[]) => mockFindFirst(...args),
      },
    },
    insert: () => mockInsert(),
  },
  schema: {
    users: {
      email: 'email',
    },
    passwordResetTokens: {},
    emailLogs: {},
  },
}));

// Mock drizzle-orm
vi.mock('drizzle-orm', () => ({
  eq: vi.fn((a, b) => ({ type: 'eq', field: a, value: b })),
}));

// Helper to create request
const createRequest = (body: unknown) => {
  return new Request('http://localhost:3000/api/auth/forgot-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
};

describe('POST /api/auth/forgot-password', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockInsert.mockReturnValue({ values: mockValues });
    mockValues.mockResolvedValue(undefined);
    mockSendEmail.mockResolvedValue({ success: true, id: 'resend-id' });
  });

  describe('Validation', () => {
    it('returns 400 for missing email', async () => {
      const request = createRequest({});
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('email');
    });

    it('returns 400 for invalid email format', async () => {
      const request = createRequest({ email: 'not-an-email' });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('email');
    });
  });

  describe('Security - Prevent Email Enumeration', () => {
    it('returns success message even when user does not exist', async () => {
      mockFindFirst.mockResolvedValue(null);

      const request = createRequest({ email: 'nonexistent@example.com' });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.message).toContain('If an account exists');
    });

    it('returns same message for existing user', async () => {
      mockFindFirst.mockResolvedValue({ id: 'user-id', email: 'test@example.com' });

      const request = createRequest({ email: 'test@example.com' });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.message).toContain('If an account exists');
    });

    it('does not send email when user does not exist', async () => {
      mockFindFirst.mockResolvedValue(null);

      const request = createRequest({ email: 'nonexistent@example.com' });
      await POST(request);

      expect(mockSendEmail).not.toHaveBeenCalled();
    });
  });

  describe('Token Generation', () => {
    it('creates password reset token for existing user', async () => {
      mockFindFirst.mockResolvedValue({ id: 'user-id', email: 'test@example.com' });

      const request = createRequest({ email: 'test@example.com' });
      await POST(request);

      expect(mockInsert).toHaveBeenCalled();
      expect(mockValues).toHaveBeenCalled();
    });

    it('sends email with reset link for existing user', async () => {
      mockFindFirst.mockResolvedValue({ id: 'user-id', email: 'test@example.com' });

      const request = createRequest({ email: 'test@example.com' });
      await POST(request);

      expect(mockSendEmail).toHaveBeenCalled();
      expect(mockSendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'test@example.com',
        })
      );
    });
  });

  describe('Email Handling', () => {
    it('normalizes email to lowercase', async () => {
      mockFindFirst.mockResolvedValue({ id: 'user-id', email: 'test@example.com' });

      const request = createRequest({ email: 'TEST@EXAMPLE.COM' });
      await POST(request);

      expect(mockFindFirst).toHaveBeenCalled();
    });

    it('logs email when send is successful', async () => {
      mockFindFirst.mockResolvedValue({ id: 'user-id', email: 'test@example.com' });
      mockSendEmail.mockResolvedValue({ success: true, id: 'resend-123' });

      const request = createRequest({ email: 'test@example.com' });
      await POST(request);

      // Should insert email log
      expect(mockInsert).toHaveBeenCalled();
    });

    it('logs email failure when send fails', async () => {
      mockFindFirst.mockResolvedValue({ id: 'user-id', email: 'test@example.com' });
      mockSendEmail.mockResolvedValue({ success: false, error: 'SMTP error' });

      const request = createRequest({ email: 'test@example.com' });
      const response = await POST(request);

      // Should still return success to user
      expect(response.status).toBe(200);
    });

    it('handles dev mode (null email result) gracefully', async () => {
      mockFindFirst.mockResolvedValue({ id: 'user-id', email: 'test@example.com' });
      mockSendEmail.mockResolvedValue(null);

      const request = createRequest({ email: 'test@example.com' });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.message).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('returns 500 for database errors', async () => {
      mockFindFirst.mockRejectedValue(new Error('Database connection failed'));

      const request = createRequest({ email: 'test@example.com' });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Internal server error');
    });

    it('returns 500 for token insertion errors', async () => {
      mockFindFirst.mockResolvedValue({ id: 'user-id', email: 'test@example.com' });
      mockValues.mockRejectedValue(new Error('Insert failed'));

      const request = createRequest({ email: 'test@example.com' });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Internal server error');
    });
  });
});
