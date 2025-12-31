import { vi } from 'vitest';
import { mockSession, type MockSession } from './auth';

// Default mock profile
export const mockProfile = {
  id: 'profile-id-123',
  userId: 'test-user-id-123',
  age: 35,
  gender: 'female' as const,
  heightCm: 165,
  startingWeightKg: '95.0',
  goalWeightKg: '75.0',
  treatmentStartDate: new Date('2024-01-15'),
  createdAt: new Date('2024-01-15'),
  updatedAt: new Date('2024-01-15'),
};

// Default mock preferences
export const mockPreferences = {
  userId: 'test-user-id-123',
  weightUnit: 'kg' as const,
  heightUnit: 'cm' as const,
  dateFormat: 'DD/MM/YYYY' as const,
  emailInjectionReminder: true,
  emailWeightReminder: false,
  emailWeeklyReport: true,
  reminderDaysBefore: 1,
};

// Mock DAL functions
const verifySessionMock = vi.fn(async () => ({
  isAuth: true as const,
  userId: mockSession.user.id,
  email: mockSession.user.email,
}));

const getSessionMock = vi.fn(async (): Promise<{
  isAuth: true;
  userId: string;
  email: string;
} | null> => ({
  isAuth: true as const,
  userId: mockSession.user.id,
  email: mockSession.user.email,
}));

const getUserProfileMock = vi.fn(async (): Promise<typeof mockProfile | null> => mockProfile);

const verifySessionWithProfileMock = vi.fn(async () => ({
  isAuth: true as const,
  userId: mockSession.user.id,
  email: mockSession.user.email,
  profile: mockProfile,
}));

const getUserPreferencesMock = vi.fn(async () => mockPreferences);

const verifySessionForOnboardingMock = vi.fn(async () => ({
  isAuth: true as const,
  userId: mockSession.user.id,
  email: mockSession.user.email,
}));

const redirectIfAuthenticatedMock = vi.fn(async () => undefined);

// Helper to mock unauthenticated state
export const mockDalUnauthenticated = () => {
  verifySessionMock.mockImplementation(async () => {
    throw new Error('NEXT_REDIRECT');
  });
  getSessionMock.mockResolvedValue(null);
  verifySessionWithProfileMock.mockImplementation(async () => {
    throw new Error('NEXT_REDIRECT');
  });
  verifySessionForOnboardingMock.mockImplementation(async () => {
    throw new Error('NEXT_REDIRECT');
  });
  redirectIfAuthenticatedMock.mockResolvedValue(undefined);
};

// Helper to mock authenticated state with no profile
export const mockDalAuthenticatedNoProfile = () => {
  verifySessionMock.mockResolvedValue({
    isAuth: true,
    userId: mockSession.user.id,
    email: mockSession.user.email,
  });
  getSessionMock.mockResolvedValue({
    isAuth: true,
    userId: mockSession.user.id,
    email: mockSession.user.email,
  });
  getUserProfileMock.mockResolvedValue(null);
  verifySessionWithProfileMock.mockImplementation(async () => {
    throw new Error('NEXT_REDIRECT');
  });
  verifySessionForOnboardingMock.mockResolvedValue({
    isAuth: true,
    userId: mockSession.user.id,
    email: mockSession.user.email,
  });
  redirectIfAuthenticatedMock.mockImplementation(async () => {
    throw new Error('NEXT_REDIRECT');
  });
};

// Helper to mock fully authenticated state with profile
export const mockDalAuthenticated = (session: Partial<MockSession> = {}) => {
  const userId = session.user?.id ?? mockSession.user.id;
  const email = session.user?.email ?? mockSession.user.email;

  verifySessionMock.mockResolvedValue({
    isAuth: true,
    userId,
    email,
  });
  getSessionMock.mockResolvedValue({
    isAuth: true,
    userId,
    email,
  });
  getUserProfileMock.mockResolvedValue({ ...mockProfile, userId });
  verifySessionWithProfileMock.mockResolvedValue({
    isAuth: true,
    userId,
    email,
    profile: { ...mockProfile, userId },
  });
  verifySessionForOnboardingMock.mockImplementation(async () => {
    throw new Error('NEXT_REDIRECT');
  });
  redirectIfAuthenticatedMock.mockImplementation(async () => {
    throw new Error('NEXT_REDIRECT');
  });
};

// Reset all DAL mocks
export const resetDalMocks = () => {
  verifySessionMock.mockReset();
  getSessionMock.mockReset();
  getUserProfileMock.mockReset();
  verifySessionWithProfileMock.mockReset();
  getUserPreferencesMock.mockReset();
  verifySessionForOnboardingMock.mockReset();
  redirectIfAuthenticatedMock.mockReset();

  // Reset to default authenticated state
  verifySessionMock.mockResolvedValue({
    isAuth: true,
    userId: mockSession.user.id,
    email: mockSession.user.email,
  });
  getSessionMock.mockResolvedValue({
    isAuth: true,
    userId: mockSession.user.id,
    email: mockSession.user.email,
  });
  getUserProfileMock.mockResolvedValue(mockProfile);
  verifySessionWithProfileMock.mockResolvedValue({
    isAuth: true,
    userId: mockSession.user.id,
    email: mockSession.user.email,
    profile: mockProfile,
  });
  getUserPreferencesMock.mockResolvedValue(mockPreferences);
  verifySessionForOnboardingMock.mockResolvedValue({
    isAuth: true,
    userId: mockSession.user.id,
    email: mockSession.user.email,
  });
  redirectIfAuthenticatedMock.mockResolvedValue(undefined);
};

// Export mocks
export const dalMocks = {
  verifySession: verifySessionMock,
  getSession: getSessionMock,
  getUserProfile: getUserProfileMock,
  verifySessionWithProfile: verifySessionWithProfileMock,
  getUserPreferences: getUserPreferencesMock,
  verifySessionForOnboarding: verifySessionForOnboardingMock,
  redirectIfAuthenticated: redirectIfAuthenticatedMock,
};

// Mock the DAL module
vi.mock('@/lib/dal', () => ({
  verifySession: verifySessionMock,
  getSession: getSessionMock,
  getUserProfile: getUserProfileMock,
  verifySessionWithProfile: verifySessionWithProfileMock,
  getUserPreferences: getUserPreferencesMock,
  verifySessionForOnboarding: verifySessionForOnboardingMock,
  redirectIfAuthenticated: redirectIfAuthenticatedMock,
}));
