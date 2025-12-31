import { vi } from 'vitest';

// Session type matching the app's extended session
export type MockSession = {
  user: {
    id: string;
    email: string;
  };
  expires: string;
};

// Default mock session for authenticated users
export const mockSession: MockSession = {
  user: {
    id: 'test-user-id-123',
    email: 'test@example.com',
  },
  expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
};

// Create a mock auth function
const authMock = vi.fn<[], Promise<MockSession | null>>(() => Promise.resolve(mockSession));

// Helper to set unauthenticated state
export const mockUnauthenticated = () => {
  authMock.mockResolvedValue(null);
};

// Helper to set authenticated state with optional custom session
export const mockAuthenticated = (session: Partial<MockSession> = {}) => {
  authMock.mockResolvedValue({
    ...mockSession,
    ...session,
    user: {
      ...mockSession.user,
      ...session.user,
    },
  });
};

// Helper to set authenticated with specific user
export const mockAuthenticatedAs = (userId: string, email: string = 'test@example.com') => {
  authMock.mockResolvedValue({
    ...mockSession,
    user: {
      id: userId,
      email,
    },
  });
};

// Reset auth mock to default authenticated state
export const resetAuthMock = () => {
  authMock.mockReset();
  authMock.mockResolvedValue(mockSession);
};

// Mock signIn and signOut
const signInMock = vi.fn();
const signOutMock = vi.fn();

// Export mocks for direct access if needed
export const authMocks = {
  auth: authMock,
  signIn: signInMock,
  signOut: signOutMock,
};

// Mock the auth module
vi.mock('@/lib/auth', () => ({
  auth: authMock,
  signIn: signInMock,
  signOut: signOutMock,
  getRequiredSession: vi.fn(async () => {
    const session = await authMock();
    if (!session?.user) {
      throw new Error('Not authenticated');
    }
    return session;
  }),
  isAuthenticated: vi.fn(async () => {
    const session = await authMock();
    return !!session?.user;
  }),
}));

// Also mock the config directly for some test scenarios
vi.mock('@/lib/auth/config', () => ({
  auth: authMock,
  signIn: signInMock,
  signOut: signOutMock,
  handlers: {
    GET: vi.fn(),
    POST: vi.fn(),
  },
}));
