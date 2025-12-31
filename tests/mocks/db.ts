import { vi } from 'vitest';

// Mock Drizzle database client
// This creates a chainable mock that returns itself for query builder methods
export const mockDb = {
  // Query builder methods
  select: vi.fn().mockReturnThis(),
  from: vi.fn().mockReturnThis(),
  where: vi.fn().mockReturnThis(),
  orderBy: vi.fn().mockReturnThis(),
  limit: vi.fn().mockReturnThis(),
  offset: vi.fn().mockReturnThis(),
  leftJoin: vi.fn().mockReturnThis(),
  innerJoin: vi.fn().mockReturnThis(),
  groupBy: vi.fn().mockReturnThis(),

  // Mutation methods
  insert: vi.fn().mockReturnThis(),
  values: vi.fn().mockReturnThis(),
  returning: vi.fn().mockReturnThis(),
  onConflictDoUpdate: vi.fn().mockReturnThis(),
  onConflictDoNothing: vi.fn().mockReturnThis(),

  update: vi.fn().mockReturnThis(),
  set: vi.fn().mockReturnThis(),

  delete: vi.fn().mockReturnThis(),

  // Execute the query
  execute: vi.fn(),

  // For relational queries (db.query.tableName.findMany)
  query: {
    users: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
    },
    profiles: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
    },
    weights: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
    },
    injections: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
    },
    dailyLogs: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
    },
    sideEffectLogs: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
    },
    mealLogs: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
    },
    preferences: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
    },
    notificationPreferences: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
    },
  },

  // Transaction support
  transaction: vi.fn((callback) => callback(mockDb)),
};

// Reset all mocks between tests
export const resetDbMocks = () => {
  // Reset all chainable methods
  const chainableMethods = [
    'select', 'from', 'where', 'orderBy', 'limit', 'offset',
    'leftJoin', 'innerJoin', 'groupBy',
    'insert', 'values', 'returning', 'onConflictDoUpdate', 'onConflictDoNothing',
    'update', 'set', 'delete',
  ];

  chainableMethods.forEach((method) => {
    const mock = mockDb[method as keyof typeof mockDb];
    if (typeof mock === 'function' && 'mockReset' in mock) {
      (mock as ReturnType<typeof vi.fn>).mockReset();
      (mock as ReturnType<typeof vi.fn>).mockReturnThis();
    }
  });

  // Reset execute
  mockDb.execute.mockReset();

  // Reset query methods
  Object.values(mockDb.query).forEach((table) => {
    if (typeof table === 'object') {
      Object.values(table).forEach((method) => {
        if (typeof method === 'function' && 'mockReset' in method) {
          (method as ReturnType<typeof vi.fn>).mockReset();
        }
      });
    }
  });

  // Reset transaction
  mockDb.transaction.mockReset();
  mockDb.transaction.mockImplementation((callback) => callback(mockDb));
};

// Helper to set up mock responses for common patterns
export const mockDbResponse = {
  // Mock a successful select query
  selectReturns: (data: unknown[]) => {
    mockDb.execute.mockResolvedValue(data);
    return mockDb;
  },

  // Mock a successful insert with returning
  insertReturns: (data: unknown) => {
    mockDb.execute.mockResolvedValue([data]);
    return mockDb;
  },

  // Mock a successful update with returning
  updateReturns: (data: unknown) => {
    mockDb.execute.mockResolvedValue([data]);
    return mockDb;
  },

  // Mock a successful delete
  deleteReturns: (count: number = 1) => {
    mockDb.execute.mockResolvedValue({ rowCount: count });
    return mockDb;
  },

  // Mock a query error
  throwsError: (message: string) => {
    mockDb.execute.mockRejectedValue(new Error(message));
    return mockDb;
  },
};

// Mock the database module
vi.mock('@/lib/db', () => ({
  db: mockDb,
  schema: {},
}));
