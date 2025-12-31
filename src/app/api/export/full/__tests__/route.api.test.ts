import { describe, it, expect, vi } from 'vitest';
import { GET } from '../route';

/**
 * Note: The /api/export/full route makes 8 parallel database calls using Promise.all
 * which is complex to mock properly. These tests focus on authentication.
 * Full export functionality should be verified with integration tests.
 */

// Use vi.hoisted to properly hoist mock functions
const { mockAuth } = vi.hoisted(() => ({
  mockAuth: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({
  auth: () => mockAuth(),
}));

// Mock database with minimal structure - just enough for auth check
vi.mock('@/lib/db', () => ({
  db: {
    query: {
      users: { findFirst: () => Promise.resolve(null) },
      profiles: { findFirst: () => Promise.resolve(null) },
      userPreferences: { findFirst: () => Promise.resolve(null) },
      dailyLogs: { findMany: () => Promise.resolve([]) },
    },
    select: () => ({
      from: () => ({
        where: () => ({
          orderBy: () => Promise.resolve([]),
        }),
      }),
    }),
  },
  schema: {
    users: { id: 'id' },
    profiles: { userId: 'userId' },
    userPreferences: { userId: 'userId' },
    weightEntries: { userId: 'userId', recordedAt: 'recordedAt' },
    injections: { userId: 'userId', injectionDate: 'injectionDate' },
    dailyLogs: { userId: 'userId', logDate: 'logDate' },
    notificationPreferences: { userId: 'userId' },
    emailLogs: { userId: 'userId', sentAt: 'sentAt' },
  },
}));

vi.mock('drizzle-orm', () => ({
  eq: vi.fn(),
  asc: vi.fn(),
}));

describe('GET /api/export/full', () => {
  it('returns 401 when not authenticated', async () => {
    mockAuth.mockResolvedValue(null);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });

  it('requires authentication to access GDPR export', async () => {
    mockAuth.mockResolvedValue({ user: null });

    const response = await GET();

    expect(response.status).toBe(401);
  });

  // Note: Full response structure tests would require integration testing
  // due to the complexity of mocking 8 parallel database calls in Promise.all
});
