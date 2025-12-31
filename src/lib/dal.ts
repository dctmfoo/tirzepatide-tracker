/**
 * Data Access Layer (DAL)
 *
 * Centralized authentication and data access functions.
 * Following Next.js best practices post-CVE-2025-29927:
 * - Auth should be verified at every data access point
 * - Use cache() to dedupe session checks per request
 * - Middleware is for optimistic redirects only
 */
import 'server-only';
import { cache } from 'react';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { db, schema } from '@/lib/db';
import { eq } from 'drizzle-orm';

export type SessionUser = {
  id: string;
  email: string;
};

export type VerifiedSession = {
  isAuth: true;
  userId: string;
  email: string;
};

/**
 * Verify the current session and return user info.
 * Cached per request to avoid duplicate auth checks.
 * Redirects to /login if not authenticated.
 */
export const verifySession = cache(async (): Promise<VerifiedSession> => {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/login');
  }

  return {
    isAuth: true,
    userId: session.user.id,
    email: session.user.email ?? '',
  };
});

/**
 * Get session without redirecting - returns null if not authenticated.
 * Useful for API routes that need to return 401 instead of redirect.
 */
export const getSession = cache(async (): Promise<VerifiedSession | null> => {
  const session = await auth();

  if (!session?.user?.id) {
    return null;
  }

  return {
    isAuth: true,
    userId: session.user.id,
    email: session.user.email ?? '',
  };
});

/**
 * Check if user has completed onboarding (has a profile).
 * Returns the profile if exists, null otherwise.
 */
export const getUserProfile = cache(async (userId: string) => {
  const profile = await db.query.profiles.findFirst({
    where: eq(schema.profiles.userId, userId),
  });

  return profile ?? null;
});

/**
 * Verify session and ensure user has completed onboarding.
 * Redirects to /login if not authenticated.
 * Redirects to /onboarding if profile doesn't exist.
 */
export const verifySessionWithProfile = cache(async () => {
  const session = await verifySession();

  const profile = await getUserProfile(session.userId);

  if (!profile) {
    redirect('/onboarding');
  }

  return {
    ...session,
    profile,
  };
});

/**
 * Get user preferences with defaults.
 */
export const getUserPreferences = cache(async (userId: string) => {
  const prefs = await db.query.userPreferences.findFirst({
    where: eq(schema.userPreferences.userId, userId),
  });

  // Return defaults if no preferences exist
  return (
    prefs ?? {
      userId,
      weightUnit: 'kg' as const,
      heightUnit: 'cm' as const,
      dateFormat: 'DD/MM/YYYY' as const,
      emailInjectionReminder: true,
      emailWeightReminder: false,
      emailWeeklyReport: true,
      reminderDaysBefore: 1,
    }
  );
});

/**
 * Verify session for onboarding pages.
 * Redirects to /login if not authenticated.
 * Redirects to /summary if profile already exists.
 */
export const verifySessionForOnboarding = cache(async () => {
  const session = await verifySession();

  const profile = await getUserProfile(session.userId);

  // If profile exists, onboarding is already complete
  if (profile) {
    redirect('/summary');
  }

  return session;
});

/**
 * Check if user is authenticated (for auth pages).
 * Redirects to /summary if already authenticated.
 * Does nothing if not authenticated.
 */
export const redirectIfAuthenticated = cache(async () => {
  const session = await getSession();

  if (session) {
    redirect('/summary');
  }
});
