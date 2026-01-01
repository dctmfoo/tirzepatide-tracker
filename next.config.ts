import { spawnSync } from 'node:child_process';
import withSerwistInit from '@serwist/next';
import type { NextConfig } from 'next';

// Use git commit hash for cache busting
const revision = spawnSync('git', ['rev-parse', 'HEAD'], {
  encoding: 'utf-8',
}).stdout?.trim() ?? crypto.randomUUID();

const withSerwist = withSerwistInit({
  swSrc: 'src/app/sw.ts',
  swDest: 'public/sw.js',
  additionalPrecacheEntries: [{ url: '/~offline', revision }],
  // Disable in development for convenience
  disable: process.env.NODE_ENV === 'development',
  // Prevent forced page reload when reconnecting (avoids form data loss)
  reloadOnOnline: false,
});

const nextConfig: NextConfig = {
  // Empty turbopack config to acknowledge we're using webpack config
  // Serwist doesn't support Turbopack yet - see https://github.com/serwist/serwist/issues/54
  turbopack: {},
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
      },
      {
        source: '/sw.js',
        headers: [
          { key: 'Content-Type', value: 'application/javascript; charset=utf-8' },
          { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' },
          { key: 'Content-Security-Policy', value: "default-src 'self'; script-src 'self'" },
        ],
      },
    ];
  },
};

export default withSerwist(nextConfig);
