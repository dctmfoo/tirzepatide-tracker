import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GET } from '../route';

// Mock auth
const mockAuth = vi.fn();
vi.mock('@/lib/auth', () => ({
  auth: () => mockAuth(),
}));

// Mock database
const mockProfileFindFirst = vi.fn();
const mockSelect = vi.fn();
const mockFrom = vi.fn();
const mockWhere = vi.fn();
const mockOrderBy = vi.fn();

vi.mock('@/lib/db', () => ({
  db: {
    query: {
      profiles: {
        findFirst: (...args: unknown[]) => mockProfileFindFirst(...args),
      },
    },
    select: () => {
      mockSelect();
      return {
        from: () => {
          mockFrom();
          return {
            where: () => {
              mockWhere();
              return {
                orderBy: () => {
                  mockOrderBy();
                  return Promise.resolve([]);
                },
              };
            },
          };
        },
      };
    },
  },
  schema: {
    profiles: { userId: 'userId' },
    weightEntries: { userId: 'userId', recordedAt: 'recordedAt' },
    injections: { userId: 'userId', injectionDate: 'injectionDate' },
  },
}));

vi.mock('drizzle-orm', () => ({
  eq: vi.fn((a, b) => ({ type: 'eq', field: a, value: b })),
  asc: vi.fn((a) => ({ type: 'asc', field: a })),
  desc: vi.fn((a) => ({ type: 'desc', field: a })),
}));

describe('GET /api/export/text', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockProfileFindFirst.mockResolvedValue(null);
  });

  it('returns 401 when not authenticated', async () => {
    mockAuth.mockResolvedValue(null);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });

  it('returns text export for authenticated user', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-123' } });

    const response = await GET();

    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toBe('text/plain; charset=utf-8');
  });

  it('sets correct Content-Disposition header', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-123' } });

    const response = await GET();
    const disposition = response.headers.get('Content-Disposition');

    expect(disposition).toContain('attachment');
    expect(disposition).toContain('mounjaro-summary');
    expect(disposition).toContain('.txt');
  });

  it('includes header in text output', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-123' } });

    const response = await GET();
    const text = await response.text();

    expect(text).toContain('MOUNJARO TRACKER SUMMARY');
  });

  it('includes generated timestamp', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-123' } });

    const response = await GET();
    const text = await response.text();

    expect(text).toContain('Generated:');
  });

  it('includes weight progress section', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-123' } });

    const response = await GET();
    const text = await response.text();

    expect(text).toContain('WEIGHT PROGRESS');
  });

  it('includes treatment info section', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-123' } });

    const response = await GET();
    const text = await response.text();

    expect(text).toContain('TREATMENT INFO');
  });

  it('shows starting weight when profile exists', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-123' } });
    mockProfileFindFirst.mockResolvedValue({
      startingWeightKg: '95.5',
      goalWeightKg: '75.0',
      treatmentStartDate: '2025-01-01',
    });

    const response = await GET();
    const text = await response.text();

    expect(text).toContain('Starting Weight:');
    expect(text).toContain('95.5 kg');
  });

  it('shows goal weight when profile exists', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-123' } });
    mockProfileFindFirst.mockResolvedValue({
      startingWeightKg: '95.5',
      goalWeightKg: '75.0',
      treatmentStartDate: '2025-01-01',
    });

    const response = await GET();
    const text = await response.text();

    expect(text).toContain('Goal Weight:');
    expect(text).toContain('75.0 kg');
  });

  it('shows treatment start date when available', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-123' } });
    mockProfileFindFirst.mockResolvedValue({
      startingWeightKg: '95.5',
      goalWeightKg: '75.0',
      treatmentStartDate: '2025-01-01',
    });

    const response = await GET();
    const text = await response.text();

    expect(text).toContain('Started:');
    expect(text).toContain('2025-01-01');
  });

  it('shows total injections count', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-123' } });

    const response = await GET();
    const text = await response.text();

    expect(text).toContain('Total Injections:');
  });

  it('includes footer', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-123' } });

    const response = await GET();
    const text = await response.text();

    expect(text).toContain('Generated by Mounjaro Tracker');
  });

  it('uses decorative borders', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-123' } });

    const response = await GET();
    const text = await response.text();

    expect(text).toContain('═');
    expect(text).toContain('─');
  });
});
