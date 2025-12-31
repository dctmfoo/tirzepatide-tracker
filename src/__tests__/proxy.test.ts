/**
 * Tests for the authentication proxy
 *
 * These tests verify that the proxy correctly handles:
 * - Protected route redirects for unauthenticated users
 * - Auth page redirects for authenticated users
 * - API route passthrough
 * - Callback URL preservation
 */
import { describe, it, expect, vi, beforeAll } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';

// Store the proxy callback
type ProxyCallback = (req: NextRequest & { auth?: unknown }) => NextResponse | undefined;
let proxyCallback: ProxyCallback;

// Mock the auth function from NextAuth - captures the callback
vi.mock('@/lib/auth/config', () => ({
  auth: (callback: ProxyCallback) => {
    proxyCallback = callback;
    return (req: NextRequest) => {
      const reqWithAuth = req as NextRequest & { auth?: unknown };
      return callback(reqWithAuth);
    };
  },
  signIn: vi.fn(),
  signOut: vi.fn(),
}));

// Helper to create a mock NextRequest with auth
function createRequest(pathname: string, isAuthenticated: boolean): NextRequest & { auth: unknown } {
  const url = new URL(pathname, 'http://localhost:3000');
  const request = new NextRequest(url);
  const auth = isAuthenticated ? { user: { id: 'user-123', email: 'test@example.com' } } : null;
  return Object.assign(request, { auth });
}

// Helper to check if response is a redirect
function isRedirect(response: NextResponse | undefined): boolean {
  if (!response) return false;
  return response.status === 307 || response.status === 308;
}

// Helper to get redirect location
function getRedirectLocation(response: NextResponse | undefined): string | null {
  if (!response) return null;
  return response.headers.get('location');
}

// Import proxy once to register the callback
beforeAll(async () => {
  await import('../proxy');
});

describe('Proxy', () => {
  describe('Protected Routes - Unauthenticated Users', () => {
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

    it.each(protectedRoutes)('redirects unauthenticated users from %s to /login', (route) => {
      const req = createRequest(route, false);
      const response = proxyCallback(req);

      expect(isRedirect(response)).toBe(true);
      const location = getRedirectLocation(response);
      expect(location).toContain('/login');
      expect(location).toContain(`callbackUrl=${encodeURIComponent(route)}`);
    });

    it('preserves nested paths in callback URL', () => {
      const req = createRequest('/jabs/new', false);
      const response = proxyCallback(req);

      expect(isRedirect(response)).toBe(true);
      expect(getRedirectLocation(response)).toContain('callbackUrl=%2Fjabs%2Fnew');
    });
  });

  describe('Protected Routes - Authenticated Users', () => {
    const protectedRoutes = ['/summary', '/results', '/jabs', '/calendar', '/settings', '/log', '/weight'];

    it.each(protectedRoutes)('allows authenticated users to access %s', (route) => {
      const req = createRequest(route, true);
      const response = proxyCallback(req);

      expect(isRedirect(response)).toBe(false);
    });
  });

  describe('Auth Routes - Authenticated Users', () => {
    const authRoutes = ['/login', '/register', '/forgot-password', '/reset-password'];

    it.each(authRoutes)('redirects authenticated users from %s to /summary', (route) => {
      const req = createRequest(route, true);
      const response = proxyCallback(req);

      expect(isRedirect(response)).toBe(true);
      expect(getRedirectLocation(response)).toContain('/summary');
    });
  });

  describe('Auth Routes - Unauthenticated Users', () => {
    it('allows unauthenticated users to access /login', () => {
      const req = createRequest('/login', false);
      const response = proxyCallback(req);

      expect(isRedirect(response)).toBe(false);
    });

    it('allows unauthenticated users to access /register', () => {
      const req = createRequest('/register', false);
      const response = proxyCallback(req);

      expect(isRedirect(response)).toBe(false);
    });

    it('allows unauthenticated users to access /forgot-password', () => {
      const req = createRequest('/forgot-password', false);
      const response = proxyCallback(req);

      expect(isRedirect(response)).toBe(false);
    });

    it('allows unauthenticated users to access /reset-password', () => {
      const req = createRequest('/reset-password', false);
      const response = proxyCallback(req);

      expect(isRedirect(response)).toBe(false);
    });
  });

  describe('API Routes', () => {
    it('passes through API routes without modification', () => {
      const req = createRequest('/api/weight', false);
      const response = proxyCallback(req);

      expect(isRedirect(response)).toBe(false);
    });

    it('passes through auth API routes', () => {
      const req = createRequest('/api/auth/signin', false);
      const response = proxyCallback(req);

      expect(isRedirect(response)).toBe(false);
    });
  });

  describe('Root Route', () => {
    it('redirects authenticated users from / to /summary', () => {
      const req = createRequest('/', true);
      const response = proxyCallback(req);

      expect(isRedirect(response)).toBe(true);
      expect(getRedirectLocation(response)).toContain('/summary');
    });

    it('allows unauthenticated users to access /', () => {
      const req = createRequest('/', false);
      const response = proxyCallback(req);

      expect(isRedirect(response)).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    it('handles nested protected routes', () => {
      const req = createRequest('/settings/profile/edit', false);
      const response = proxyCallback(req);

      expect(isRedirect(response)).toBe(true);
      expect(getRedirectLocation(response)).toContain('/login');
    });

    it('handles nested auth routes', () => {
      const req = createRequest('/login?error=invalid', true);
      const response = proxyCallback(req);

      expect(isRedirect(response)).toBe(true);
      expect(getRedirectLocation(response)).toContain('/summary');
    });

    it('handles unknown routes without redirect', () => {
      const req = createRequest('/unknown-page', false);
      const response = proxyCallback(req);

      expect(isRedirect(response)).toBe(false);
    });
  });
});
