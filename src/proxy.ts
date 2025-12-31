/**
 * Next.js Proxy for Optimistic Authentication
 *
 * IMPORTANT: This proxy performs OPTIMISTIC checks only.
 * It reads from the session cookie but does NOT make database calls.
 * The actual security happens in the Data Access Layer (DAL).
 *
 * Purpose:
 * - Fast redirects for unauthenticated users (better UX)
 * - Redirect authenticated users away from auth pages
 * - Keep sessions alive
 *
 * Security note (CVE-2025-29927):
 * Never rely on proxy alone for auth. Always verify at the data layer.
 *
 * @see https://nextjs.org/docs/app/api-reference/file-conventions/proxy
 */
import { auth } from '@/lib/auth/config';
import { NextResponse } from 'next/server';

// Routes that require authentication
const protectedRoutes = [
  '/summary',
  '/results',
  '/jabs',
  '/calendar',
  '/settings',
  '/log',
  '/weight',
  '/onboarding',
];

// Routes only for unauthenticated users
const authRoutes = ['/login', '/register', '/forgot-password', '/reset-password'];

// NextAuth v5 auth() wrapper for proxy
export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;
  const pathname = nextUrl.pathname;

  // Check route types - auth routes checked first to avoid /login matching /log
  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));
  const isProtectedRoute = !isAuthRoute && protectedRoutes.some((route) => pathname.startsWith(route));
  const isApiRoute = pathname.startsWith('/api');

  // Skip API routes - they handle their own auth
  if (isApiRoute) {
    return NextResponse.next();
  }

  // Redirect authenticated users from auth routes to summary (check first!)
  if (isAuthRoute && isLoggedIn) {
    return NextResponse.redirect(new URL('/summary', nextUrl));
  }

  // Redirect unauthenticated users from protected routes to login
  if (isProtectedRoute && !isLoggedIn) {
    const loginUrl = new URL('/login', nextUrl);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Redirect root to summary for authenticated users
  if (pathname === '/' && isLoggedIn) {
    return NextResponse.redirect(new URL('/summary', nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files (images, etc.)
     * - ~offline (PWA offline page)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$|~offline).*)',
  ],
};
