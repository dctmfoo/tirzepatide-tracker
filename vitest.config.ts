import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  resolve: {
    alias: {
      // Mock server-only for testing (it's a marker package that throws on client)
      'server-only': path.resolve(__dirname, 'tests/mocks/server-only.ts'),
    },
  },
  test: {
    // Global test settings
    globals: true,

    // Environment configuration
    environment: 'jsdom',

    // Setup files
    setupFiles: ['./tests/setup.ts'],

    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'tests/',
        'e2e/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/types/',
        '.next/',
      ],
      thresholds: {
        statements: 80,
        branches: 80,
        functions: 80,
        lines: 80,
      },
    },

    // Test file patterns
    include: ['**/*.{test,spec}.{ts,tsx}'],
    exclude: ['node_modules', '.next', 'e2e'],

    // Timeouts
    testTimeout: 10000,
    hookTimeout: 10000,
  },
});
