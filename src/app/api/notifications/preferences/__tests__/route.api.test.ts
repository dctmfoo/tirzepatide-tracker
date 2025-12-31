import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GET, PUT } from '../route';

// Mock auth module
const mockAuth = vi.fn();
vi.mock('@/lib/auth', () => ({
  auth: () => mockAuth(),
}));

// Mock database methods
const mockSelect = vi.fn().mockReturnThis();
const mockFrom = vi.fn().mockReturnThis();
const mockWhere = vi.fn();
const mockFindFirst = vi.fn();
const mockInsert = vi.fn().mockReturnThis();
const mockValues = vi.fn();
const mockUpdate = vi.fn().mockReturnThis();
const mockSet = vi.fn().mockReturnThis();
const mockUpdateWhere = vi.fn();

vi.mock('@/lib/db', () => ({
  db: {
    select: () => mockSelect(),
    query: {
      notificationPreferences: {
        findFirst: (...args: unknown[]) => mockFindFirst(...args),
      },
    },
    insert: () => mockInsert(),
    update: () => mockUpdate(),
  },
  schema: {
    notificationPreferences: {
      userId: 'userId',
      notificationType: 'notificationType',
      id: 'id',
    },
  },
}));

// Mock drizzle-orm
vi.mock('drizzle-orm', () => ({
  eq: vi.fn((a, b) => ({ type: 'eq', field: a, value: b })),
  and: vi.fn((...conditions) => ({ type: 'and', conditions })),
}));

// Helper to create PUT request
const createPutRequest = (body: unknown) => {
  return new Request('http://localhost:3000/api/notifications/preferences', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
};

describe('GET /api/notifications/preferences', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSelect.mockReturnValue({ from: mockFrom });
    mockFrom.mockReturnValue({ where: mockWhere });
  });

  it('returns 401 when not authenticated', async () => {
    mockAuth.mockResolvedValue(null);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });

  it('returns 401 when session has no user id', async () => {
    mockAuth.mockResolvedValue({ user: {} });

    const response = await GET();

    expect(response.status).toBe(401);
  });

  it('returns all notification types with defaults when no preferences exist', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'test-user-id' } });
    mockWhere.mockResolvedValue([]);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.preferences).toHaveLength(4);

    const types = data.preferences.map((p: { notificationType: string }) => p.notificationType);
    expect(types).toContain('injection_reminder');
    expect(types).toContain('weight_reminder');
    expect(types).toContain('weekly_summary');
    expect(types).toContain('milestone_reached');

    // All should default to enabled
    data.preferences.forEach((p: { enabled: boolean }) => {
      expect(p.enabled).toBe(true);
    });
  });

  it('returns existing preferences with saved values', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'test-user-id' } });
    mockWhere.mockResolvedValue([
      { notificationType: 'injection_reminder', enabled: true },
      { notificationType: 'weight_reminder', enabled: false },
    ]);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);

    const injectionPref = data.preferences.find(
      (p: { notificationType: string }) => p.notificationType === 'injection_reminder'
    );
    const weightPref = data.preferences.find(
      (p: { notificationType: string }) => p.notificationType === 'weight_reminder'
    );

    expect(injectionPref.enabled).toBe(true);
    expect(weightPref.enabled).toBe(false);
  });

  it('includes descriptions for each notification type', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'test-user-id' } });
    mockWhere.mockResolvedValue([]);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);

    data.preferences.forEach((p: { description: string }) => {
      expect(p.description).toBeDefined();
      expect(typeof p.description).toBe('string');
      expect(p.description.length).toBeGreaterThan(0);
    });
  });

  it('handles database errors gracefully', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'test-user-id' } });
    mockWhere.mockRejectedValue(new Error('Database error'));

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Internal server error');
  });
});

describe('PUT /api/notifications/preferences', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSelect.mockReturnValue({ from: mockFrom });
    mockFrom.mockReturnValue({ where: mockWhere });
    mockInsert.mockReturnValue({ values: mockValues });
    mockValues.mockResolvedValue(undefined);
    mockUpdate.mockReturnValue({ set: mockSet });
    mockSet.mockReturnValue({ where: mockUpdateWhere });
    mockUpdateWhere.mockResolvedValue(undefined);
  });

  it('returns 401 when not authenticated', async () => {
    mockAuth.mockResolvedValue(null);

    const request = createPutRequest({
      preferences: [{ notificationType: 'injection_reminder', enabled: false }],
    });
    const response = await PUT(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });

  it('returns 400 for invalid notification type', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'test-user-id' } });

    const request = createPutRequest({
      preferences: [{ notificationType: 'invalid_type', enabled: false }],
    });
    const response = await PUT(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Validation failed');
  });

  it('returns 400 for missing enabled field', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'test-user-id' } });

    const request = createPutRequest({
      preferences: [{ notificationType: 'injection_reminder' }],
    });
    const response = await PUT(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Validation failed');
  });

  it('returns 400 for non-boolean enabled value', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'test-user-id' } });

    const request = createPutRequest({
      preferences: [{ notificationType: 'injection_reminder', enabled: 'yes' }],
    });
    const response = await PUT(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Validation failed');
  });

  it('creates new preference when none exists', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'test-user-id' } });
    mockFindFirst.mockResolvedValue(null);
    mockWhere.mockResolvedValue([
      { notificationType: 'injection_reminder', enabled: false },
    ]);

    const request = createPutRequest({
      preferences: [{ notificationType: 'injection_reminder', enabled: false }],
    });
    const response = await PUT(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(mockInsert).toHaveBeenCalled();
  });

  it('updates existing preference', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'test-user-id' } });
    mockFindFirst.mockResolvedValue({
      id: 'pref-id',
      notificationType: 'injection_reminder',
      enabled: true,
    });
    mockWhere.mockResolvedValue([
      { notificationType: 'injection_reminder', enabled: false },
    ]);

    const request = createPutRequest({
      preferences: [{ notificationType: 'injection_reminder', enabled: false }],
    });
    const response = await PUT(request);

    expect(response.status).toBe(200);
    expect(mockUpdate).toHaveBeenCalled();
  });

  it('updates multiple preferences at once', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'test-user-id' } });
    mockFindFirst
      .mockResolvedValueOnce({ id: 'pref-1', notificationType: 'injection_reminder', enabled: true })
      .mockResolvedValueOnce({ id: 'pref-2', notificationType: 'weight_reminder', enabled: true });
    mockWhere.mockResolvedValue([
      { notificationType: 'injection_reminder', enabled: false },
      { notificationType: 'weight_reminder', enabled: false },
    ]);

    const request = createPutRequest({
      preferences: [
        { notificationType: 'injection_reminder', enabled: false },
        { notificationType: 'weight_reminder', enabled: false },
      ],
    });
    const response = await PUT(request);

    expect(response.status).toBe(200);
    expect(mockUpdate).toHaveBeenCalledTimes(2);
  });

  it('returns updated preferences in response', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'test-user-id' } });
    mockFindFirst.mockResolvedValue(null);
    mockWhere.mockResolvedValue([
      { notificationType: 'injection_reminder', enabled: false },
      { notificationType: 'weight_reminder', enabled: true },
    ]);

    const request = createPutRequest({
      preferences: [{ notificationType: 'injection_reminder', enabled: false }],
    });
    const response = await PUT(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.preferences).toBeDefined();
    expect(data.preferences).toHaveLength(4);
  });

  it('handles all valid notification types', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'test-user-id' } });
    mockFindFirst.mockResolvedValue(null);
    mockWhere.mockResolvedValue([]);

    const validTypes = [
      'injection_reminder',
      'weight_reminder',
      'weekly_summary',
      'milestone_reached',
    ];

    for (const type of validTypes) {
      const request = createPutRequest({
        preferences: [{ notificationType: type, enabled: false }],
      });
      const response = await PUT(request);

      expect(response.status).toBe(200);
    }
  });

  it('handles database errors gracefully', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'test-user-id' } });
    mockFindFirst.mockRejectedValue(new Error('Database error'));

    const request = createPutRequest({
      preferences: [{ notificationType: 'injection_reminder', enabled: false }],
    });
    const response = await PUT(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Internal server error');
  });
});
