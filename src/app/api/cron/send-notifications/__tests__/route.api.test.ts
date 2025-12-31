import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from '../route';

// Mock email module
const mockSendEmail = vi.fn();
const mockIsEmailConfigured = vi.fn();
vi.mock('@/lib/email', () => ({
  sendEmail: (...args: unknown[]) => mockSendEmail(...args),
  isEmailConfigured: () => mockIsEmailConfigured(),
  injectionReminderTemplate: vi.fn().mockReturnValue({ subject: 'Injection Reminder', html: '<p>reminder</p>' }),
  injectionOverdueTemplate: vi.fn().mockReturnValue({ subject: 'Injection Overdue', html: '<p>overdue</p>' }),
  weightReminderTemplate: vi.fn().mockReturnValue({ subject: 'Weight Reminder', html: '<p>weight</p>' }),
  weeklySummaryTemplate: vi.fn().mockReturnValue({ subject: 'Weekly Summary', html: '<p>summary</p>' }),
}));

// Mock database methods
const mockFindMany = vi.fn();
const mockFindFirst = vi.fn();
const mockSelect = vi.fn().mockReturnThis();
const mockFrom = vi.fn().mockReturnThis();
const mockWhere = vi.fn().mockReturnThis();
const mockOrderBy = vi.fn();
const mockInsert = vi.fn().mockReturnThis();
const mockValues = vi.fn();

vi.mock('@/lib/db', () => ({
  db: {
    query: {
      users: {
        findMany: (...args: unknown[]) => mockFindMany(...args),
      },
      injections: {
        findFirst: (...args: unknown[]) => mockFindFirst(...args),
      },
      weightEntries: {
        findFirst: (...args: unknown[]) => mockFindFirst(...args),
      },
    },
    select: () => mockSelect(),
    insert: () => mockInsert(),
  },
  schema: {
    injections: {
      userId: 'userId',
      injectionDate: 'injectionDate',
    },
    weightEntries: {
      userId: 'userId',
      recordedAt: 'recordedAt',
    },
    emailLogs: {},
  },
}));

// Mock drizzle-orm
vi.mock('drizzle-orm', () => ({
  eq: vi.fn((a, b) => ({ type: 'eq', field: a, value: b })),
  desc: vi.fn((field) => ({ type: 'desc', field })),
}));

// Store original env
const originalEnv = process.env;

describe('POST /api/cron/send-notifications', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSelect.mockReturnValue({ from: mockFrom });
    mockFrom.mockReturnValue({ where: mockWhere });
    mockWhere.mockReturnValue({ orderBy: mockOrderBy });
    mockOrderBy.mockResolvedValue([]);
    mockInsert.mockReturnValue({ values: mockValues });
    mockValues.mockResolvedValue(undefined);
    mockSendEmail.mockResolvedValue({ success: true, id: 'email-id' });
    mockIsEmailConfigured.mockReturnValue(true);

    // Reset env
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('Authorization', () => {
    // Note: CRON_SECRET is read at module load time, so in test environment it's undefined.
    // These tests verify behavior when no CRON_SECRET is configured (dev mode).

    it('allows request when no CRON_SECRET is configured (dev mode)', async () => {
      mockFindMany.mockResolvedValue([]);

      const request = new NextRequest('http://localhost:3000/api/cron/send-notifications', {
        method: 'POST',
      });
      const response = await POST(request);

      expect(response.status).toBe(200);
    });

    it('allows request with any auth header when no CRON_SECRET is configured', async () => {
      mockFindMany.mockResolvedValue([]);

      const request = new NextRequest('http://localhost:3000/api/cron/send-notifications', {
        method: 'POST',
        headers: {
          Authorization: 'Bearer any-value',
        },
      });
      const response = await POST(request);

      expect(response.status).toBe(200);
    });

    it('processes request without auth header in dev mode', async () => {
      mockFindMany.mockResolvedValue([]);

      const request = new NextRequest('http://localhost:3000/api/cron/send-notifications', {
        method: 'POST',
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });
  });

  describe('Successful Execution', () => {
    it('returns success response with results', async () => {
      delete process.env.CRON_SECRET;
      mockFindMany.mockResolvedValue([]);

      const request = new NextRequest('http://localhost:3000/api/cron/send-notifications', {
        method: 'POST',
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.timestamp).toBeDefined();
      expect(data.results).toBeDefined();
      expect(data.results.injectionReminders).toBe(0);
      expect(data.results.injectionOverdue).toBe(0);
      expect(data.results.weightReminders).toBe(0);
      expect(data.results.weeklySummaries).toBe(0);
      expect(data.results.errors).toEqual([]);
    });

    it('includes emailConfigured flag in response', async () => {
      delete process.env.CRON_SECRET;
      mockFindMany.mockResolvedValue([]);
      mockIsEmailConfigured.mockReturnValue(true);

      const request = new NextRequest('http://localhost:3000/api/cron/send-notifications', {
        method: 'POST',
      });
      const response = await POST(request);
      const data = await response.json();

      expect(data.emailConfigured).toBe(true);
    });

    it('skips users without profiles', async () => {
      delete process.env.CRON_SECRET;
      mockFindMany.mockResolvedValue([
        {
          id: 'user-1',
          email: 'test@example.com',
          profile: null, // No profile
          preferences: null,
          notificationPreferences: [],
        },
      ]);

      const request = new NextRequest('http://localhost:3000/api/cron/send-notifications', {
        method: 'POST',
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.results.injectionReminders).toBe(0);
    });
  });

  describe('Notification Preferences', () => {
    it('respects disabled injection_reminder preference', async () => {
      delete process.env.CRON_SECRET;
      mockFindMany.mockResolvedValue([
        {
          id: 'user-1',
          email: 'test@example.com',
          profile: { reminderDaysBefore: 1 },
          preferences: null,
          notificationPreferences: [
            { notificationType: 'injection_reminder', enabled: false },
          ],
        },
      ]);

      const request = new NextRequest('http://localhost:3000/api/cron/send-notifications', {
        method: 'POST',
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.results.injectionReminders).toBe(0);
    });

    it('respects disabled weight_reminder preference', async () => {
      delete process.env.CRON_SECRET;
      mockFindMany.mockResolvedValue([
        {
          id: 'user-1',
          email: 'test@example.com',
          profile: { reminderDaysBefore: 1 },
          preferences: null,
          notificationPreferences: [
            { notificationType: 'weight_reminder', enabled: false },
          ],
        },
      ]);

      const request = new NextRequest('http://localhost:3000/api/cron/send-notifications', {
        method: 'POST',
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.results.weightReminders).toBe(0);
    });

    it('respects disabled weekly_summary preference', async () => {
      delete process.env.CRON_SECRET;
      mockFindMany.mockResolvedValue([
        {
          id: 'user-1',
          email: 'test@example.com',
          profile: { reminderDaysBefore: 1 },
          preferences: null,
          notificationPreferences: [
            { notificationType: 'weekly_summary', enabled: false },
          ],
        },
      ]);

      const request = new NextRequest('http://localhost:3000/api/cron/send-notifications', {
        method: 'POST',
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.results.weeklySummaries).toBe(0);
    });
  });

  describe('Error Handling', () => {
    it('catches and logs errors for individual user notifications', async () => {
      delete process.env.CRON_SECRET;
      mockFindMany.mockResolvedValue([
        {
          id: 'user-1',
          email: 'test@example.com',
          profile: { reminderDaysBefore: 1 },
          preferences: null,
          notificationPreferences: [],
        },
      ]);
      mockFindFirst.mockRejectedValue(new Error('Database error'));

      const request = new NextRequest('http://localhost:3000/api/cron/send-notifications', {
        method: 'POST',
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.results.errors.length).toBeGreaterThan(0);
    });

    it('returns 500 for unhandled database errors', async () => {
      delete process.env.CRON_SECRET;
      mockFindMany.mockRejectedValue(new Error('Critical database error'));

      const request = new NextRequest('http://localhost:3000/api/cron/send-notifications', {
        method: 'POST',
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Internal server error');
    });

    it('continues processing other users when one fails', async () => {
      delete process.env.CRON_SECRET;
      mockFindMany.mockResolvedValue([
        {
          id: 'user-1',
          email: 'user1@example.com',
          profile: { reminderDaysBefore: 1 },
          preferences: null,
          notificationPreferences: [],
        },
        {
          id: 'user-2',
          email: 'user2@example.com',
          profile: { reminderDaysBefore: 1 },
          preferences: null,
          notificationPreferences: [],
        },
      ]);
      mockFindFirst
        .mockRejectedValueOnce(new Error('Error for user 1'))
        .mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/cron/send-notifications', {
        method: 'POST',
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.results.errors.length).toBeGreaterThan(0);
    });
  });

  describe('Email Logging', () => {
    it('handles dev mode (null email result) gracefully', async () => {
      delete process.env.CRON_SECRET;
      mockFindMany.mockResolvedValue([
        {
          id: 'user-1',
          email: 'test@example.com',
          profile: { reminderDaysBefore: 1 },
          preferences: null,
          notificationPreferences: [],
        },
      ]);
      mockFindFirst.mockResolvedValue({
        id: 'inj-1',
        injectionDate: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000), // 6 days ago
        doseMg: '5',
      });
      mockSendEmail.mockResolvedValue(null); // Dev mode

      const request = new NextRequest('http://localhost:3000/api/cron/send-notifications', {
        method: 'POST',
      });
      const response = await POST(request);

      expect(response.status).toBe(200);
    });
  });
});
