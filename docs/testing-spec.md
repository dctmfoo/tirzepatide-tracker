# Mounjaro Tracker - Testing Specification

> **Reference**: This document supplements the main [Product Specification](./mounjaro-tracker-spec-v2.md). Read the main spec first to understand the app architecture, features, and file structure.

---

## Quick Start Checklist

When setting up tests for this project, complete these steps in order:

- [x] Install testing dependencies (see [Installation](#installation))
- [x] Create configuration files (see [Configuration Files](#configuration-files))
- [x] Set up test utilities and mocks (see [Test Utilities](#test-utilities))
- [x] Write unit tests for utility functions first (see [Unit Tests](#1-unit-tests))
- [ ] Add component tests for UI components (see [Component Tests](#2-component-tests))
- [~] Add API route tests (see [API Route Tests](#3-api-route-tests))
- [ ] Add E2E tests for critical flows (see [E2E Tests](#4-e2e-tests))
- [ ] Configure CI pipeline (see [CI/CD Integration](#cicd-integration))

> **Implementation Note (2025-12-31):**
> Testing infrastructure is now set up and operational. Current status:
> - **285 tests passing** (126 unit + 159 API)
> - Configuration: `vitest.config.ts`, `playwright.config.ts`
> - Test utilities: `tests/setup.ts`, `tests/mocks/*`, `tests/factories/*`, `tests/utils/*`
> - Unit tests: `src/lib/utils/__tests__/*` (conversions, calculations, dates, injection-logic)
> - API tests:
>   - `src/app/api/weight/__tests__/*` (14 tests)
>   - `src/app/api/injections/__tests__/*` (55 tests)
>   - `src/app/api/daily-logs/__tests__/*` (58 tests)
>   - `src/app/api/stats/__tests__/*` (32 tests)
> - E2E placeholder: `e2e/example.spec.ts`
> - Utility functions created: `src/lib/utils/{conversions,calculations,dates,injection-logic}.ts`

---

## Testing Stack

| Tool | Version | Purpose |
|------|---------|---------|
| Vitest | ^4.0.0 | Unit & component test runner |
| @testing-library/react | ^16.0.0 | Component testing utilities |
| @testing-library/dom | ^10.0.0 | Required peer dependency for RTL v16+ |
| @testing-library/jest-dom | ^6.0.0 | Custom DOM matchers for testing |
| @testing-library/user-event | ^14.0.0 | User interaction simulation |
| Playwright | ^1.57.0 | E2E browser testing |
| next-test-api-route-handler | ^5.0.0 | API route testing (v5+ for Next.js 14+) |
| @faker-js/faker | ^10.0.0 | Test data generation (requires Node.js 20+) |

---

## Installation

```bash
# Unit & Component Testing
npm install -D vitest @vitejs/plugin-react jsdom \
  @testing-library/react @testing-library/dom @testing-library/jest-dom \
  @testing-library/user-event vite-tsconfig-paths \
  next-test-api-route-handler @faker-js/faker

# E2E Testing
npm init playwright@latest

# Install Playwright browsers
npx playwright install
```

> **Note:** @faker-js/faker v10+ requires Node.js 20 or above. If using Jest with CJS, stick with v9 due to [compatibility issues](https://github.com/faker-js/faker/issues/3606).

Add to `package.json`:

```json
{
  "scripts": {
    "test": "vitest",
    "test:run": "vitest run",
    "test:coverage": "vitest run --coverage",
    "test:ui": "vitest --ui",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:e2e:headed": "playwright test --headed",
    "test:all": "vitest run && playwright test"
  }
}
```

---

## Configuration Files

### vitest.config.ts

```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  test: {
    // Global test settings
    globals: true,

    // Environment configuration
    environment: 'jsdom',
    environmentMatchGlobs: [
      // Use node environment for API route tests
      ['**/*.api.test.ts', 'node'],
      ['**/api/**/*.test.ts', 'node'],
    ],

    // Setup files
    setupFiles: ['./tests/setup.ts'],

    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'tests/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/types/',
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
```

### playwright.config.ts

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html'],
    ['json', { outputFile: 'test-results/results.json' }],
  ],

  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
  ],

  // Auto-start dev server for E2E tests
  webServer: {
    command: 'npm run build && npm run start',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});
```

### tests/setup.ts

```typescript
import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({}),
}));

// Mock Next.js headers (for API routes)
vi.mock('next/headers', () => ({
  cookies: () => ({
    get: vi.fn(),
    set: vi.fn(),
    delete: vi.fn(),
  }),
  headers: () => new Headers(),
}));

// Suppress console errors in tests (optional)
// vi.spyOn(console, 'error').mockImplementation(() => {});
```

---

## Directory Structure

```
/tests
  /setup.ts                    # Global test setup
  /mocks
    /db.ts                     # Drizzle database mocks
    /auth.ts                   # NextAuth session mocks
    /resend.ts                 # Email service mocks
  /factories
    /user.ts                   # User test data factory
    /weight.ts                 # Weight entry factory
    /injection.ts              # Injection factory
    /daily-log.ts              # Daily log factory
  /utils
    /render.tsx                # Custom render with providers
    /api-helpers.ts            # API test helpers

/lib
  /utils
    /__tests__
      /calculations.test.ts
      /conversions.test.ts
      /dates.test.ts
      /injection-logic.test.ts

/components
  /ui/__tests__
    /Button.test.tsx
    /Card.test.tsx
  /charts/__tests__
    /WeightChart.test.tsx
  /forms/__tests__
    /WeightEntryForm.test.tsx
    /InjectionForm.test.tsx
  /results/__tests__
    /StatCard.test.tsx
    /StatsCardGrid.test.tsx

/app
  /api
    /weight/__tests__
      /route.api.test.ts
      /[id].api.test.ts
    /injections/__tests__
      /route.api.test.ts
      /[id].api.test.ts
      /latest.api.test.ts
      /next-due.api.test.ts
    /daily-logs/__tests__
      /route.api.test.ts
      /[date].api.test.ts
      /week-summary.api.test.ts
    /stats/__tests__
      /summary.api.test.ts
      /results.api.test.ts

/e2e
  /onboarding.spec.ts
  /weight-logging.spec.ts
  /injection-logging.spec.ts
  /results-dashboard.spec.ts
  /calendar.spec.ts
  /settings.spec.ts
  /pwa.spec.ts
```

---

## Test Utilities

### tests/mocks/db.ts

```typescript
import { vi } from 'vitest';

// Mock Drizzle database client
export const mockDb = {
  select: vi.fn().mockReturnThis(),
  from: vi.fn().mockReturnThis(),
  where: vi.fn().mockReturnThis(),
  orderBy: vi.fn().mockReturnThis(),
  limit: vi.fn().mockReturnThis(),
  insert: vi.fn().mockReturnThis(),
  values: vi.fn().mockReturnThis(),
  returning: vi.fn().mockReturnThis(),
  update: vi.fn().mockReturnThis(),
  set: vi.fn().mockReturnThis(),
  delete: vi.fn().mockReturnThis(),
  execute: vi.fn(),
};

// Reset all mocks between tests
export const resetDbMocks = () => {
  Object.values(mockDb).forEach((mock) => {
    if (typeof mock.mockReset === 'function') {
      mock.mockReset();
      mock.mockReturnThis();
    }
  });
};

// Mock the database module
vi.mock('@/lib/db', () => ({
  db: mockDb,
}));
```

### tests/mocks/auth.ts

```typescript
import { vi } from 'vitest';
import type { Session } from 'next-auth';
import { getServerSession } from 'next-auth';

export const mockSession: Session = {
  user: {
    id: 'test-user-id',
    email: 'test@example.com',
    name: 'Test User',
  },
  expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
};

export const mockUnauthenticated = () => {
  vi.mocked(getServerSession).mockResolvedValue(null);
};

export const mockAuthenticated = (session: Partial<Session> = {}) => {
  vi.mocked(getServerSession).mockResolvedValue({
    ...mockSession,
    ...session,
  });
};

vi.mock('next-auth', async () => {
  const actual = await vi.importActual('next-auth');
  return {
    ...actual,
    getServerSession: vi.fn(() => Promise.resolve(mockSession)),
  };
});
```

### tests/factories/weight.ts

```typescript
import { faker } from '@faker-js/faker';

export interface WeightEntry {
  id: string;
  userId: string;
  weightKg: number;
  recordedAt: Date;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export const createWeightEntry = (overrides: Partial<WeightEntry> = {}): WeightEntry => ({
  id: faker.string.uuid(),
  userId: 'test-user-id',
  weightKg: faker.number.float({ min: 50, max: 150, fractionDigits: 2 }),
  recordedAt: faker.date.recent({ days: 30 }),
  notes: faker.helpers.maybe(() => faker.lorem.sentence()) ?? null,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

export const createWeightEntries = (count: number, overrides: Partial<WeightEntry> = {}): WeightEntry[] =>
  Array.from({ length: count }, () => createWeightEntry(overrides));

// Create a realistic weight loss progression
export const createWeightProgression = (
  startWeight: number,
  entries: number,
  weeklyLoss: number = 0.5
): WeightEntry[] => {
  const now = new Date();
  return Array.from({ length: entries }, (_, i) => {
    const daysAgo = (entries - 1 - i) * 3; // Every 3 days
    const weightLoss = (daysAgo / 7) * weeklyLoss;
    return createWeightEntry({
      weightKg: Number((startWeight - weightLoss).toFixed(2)),
      recordedAt: new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000),
    });
  });
};
```

### tests/factories/injection.ts

```typescript
import { faker } from '@faker-js/faker';

const INJECTION_SITES = [
  'Abdomen - Left',
  'Abdomen - Right',
  'Thigh - Left',
  'Thigh - Right',
  'Arm - Left',
  'Arm - Right',
] as const;

const DOSES = [2.5, 5.0, 7.5, 10.0, 12.5, 15.0] as const;

export interface Injection {
  id: string;
  userId: string;
  doseMg: number;
  injectionSite: string;
  injectionDate: Date;
  batchNumber: string | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export const createInjection = (overrides: Partial<Injection> = {}): Injection => ({
  id: faker.string.uuid(),
  userId: 'test-user-id',
  doseMg: faker.helpers.arrayElement(DOSES),
  injectionSite: faker.helpers.arrayElement(INJECTION_SITES),
  injectionDate: faker.date.recent({ days: 7 }),
  batchNumber: faker.helpers.maybe(() => faker.string.alphanumeric(10)) ?? null,
  notes: faker.helpers.maybe(() => faker.lorem.sentence()) ?? null,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

// Create a series of weekly injections with dose escalation
export const createInjectionSeries = (weeks: number): Injection[] => {
  const now = new Date();
  let currentDose = 2.5;

  return Array.from({ length: weeks }, (_, i) => {
    const weeksAgo = weeks - 1 - i;
    // Increase dose every 4 weeks
    if (i > 0 && i % 4 === 0 && currentDose < 15) {
      const doseIndex = DOSES.indexOf(currentDose as typeof DOSES[number]);
      currentDose = DOSES[Math.min(doseIndex + 1, DOSES.length - 1)];
    }

    return createInjection({
      doseMg: currentDose,
      injectionSite: INJECTION_SITES[i % INJECTION_SITES.length],
      injectionDate: new Date(now.getTime() - weeksAgo * 7 * 24 * 60 * 60 * 1000),
    });
  });
};
```

### tests/utils/render.tsx

```typescript
import { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Add any providers your app needs (e.g., ThemeProvider, QueryClientProvider)
const AllProviders = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>;
};

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => {
  return {
    user: userEvent.setup(),
    ...render(ui, { wrapper: AllProviders, ...options }),
  };
};

export * from '@testing-library/react';
export { customRender as render };
```

---

## 1. Unit Tests

### Priority Order

Test these utility modules first (pure functions, easy to test):

1. `lib/utils/conversions.ts` - Unit conversions
2. `lib/utils/calculations.ts` - BMI, stats calculations
3. `lib/utils/dates.ts` - Date formatting, week calculations
4. `lib/utils/injection-logic.ts` - Injection scheduling logic

### Example: lib/utils/__tests__/conversions.test.ts

```typescript
import { describe, it, expect } from 'vitest';
import {
  kgToLbs,
  kgToStone,
  lbsToKg,
  stoneToKg,
  cmToFeetInches,
  feetInchesToCm,
  formatWeight,
} from '../conversions';

describe('Weight Conversions', () => {
  describe('kgToLbs', () => {
    it('converts kilograms to pounds correctly', () => {
      expect(kgToLbs(1)).toBeCloseTo(2.20462, 4);
      expect(kgToLbs(100)).toBeCloseTo(220.462, 2);
      expect(kgToLbs(0)).toBe(0);
    });

    it('handles decimal values', () => {
      expect(kgToLbs(92.5)).toBeCloseTo(203.93, 1);
    });
  });

  describe('kgToStone', () => {
    it('converts kilograms to stone correctly', () => {
      expect(kgToStone(1)).toBeCloseTo(0.157473, 4);
      expect(kgToStone(100)).toBeCloseTo(15.7473, 2);
    });
  });

  describe('lbsToKg', () => {
    it('converts pounds to kilograms correctly', () => {
      expect(lbsToKg(220.462)).toBeCloseTo(100, 1);
    });

    it('is inverse of kgToLbs', () => {
      const kg = 85.5;
      expect(lbsToKg(kgToLbs(kg))).toBeCloseTo(kg, 4);
    });
  });

  describe('formatWeight', () => {
    it('formats weight in all three units', () => {
      const result = formatWeight(92.2);
      expect(result).toContain('92.2 kg');
      expect(result).toContain('lbs');
      expect(result).toContain('stone');
    });
  });
});

describe('Height Conversions', () => {
  describe('cmToFeetInches', () => {
    it('converts centimeters to feet and inches', () => {
      const result = cmToFeetInches(168);
      expect(result.feet).toBe(5);
      expect(result.inches).toBe(6);
    });

    it('handles edge cases', () => {
      expect(cmToFeetInches(152.4)).toEqual({ feet: 5, inches: 0 });
      expect(cmToFeetInches(182.88)).toEqual({ feet: 6, inches: 0 });
    });
  });

  describe('feetInchesToCm', () => {
    it('converts feet and inches to centimeters', () => {
      expect(feetInchesToCm(5, 6)).toBeCloseTo(167.64, 1);
    });

    it('is inverse of cmToFeetInches', () => {
      const cm = 175;
      const { feet, inches } = cmToFeetInches(cm);
      expect(feetInchesToCm(feet, inches)).toBeCloseTo(cm, 0);
    });
  });
});
```

### Example: lib/utils/__tests__/calculations.test.ts

```typescript
import { describe, it, expect } from 'vitest';
import {
  calculateBMI,
  getBMICategory,
  calculateTotalChange,
  calculatePercentChange,
  calculateWeeklyAverage,
  calculateTreatmentWeek,
  calculateTreatmentDay,
} from '../calculations';

describe('BMI Calculations', () => {
  describe('calculateBMI', () => {
    it('calculates BMI correctly', () => {
      // BMI = weight(kg) / height(m)^2
      expect(calculateBMI(70, 175)).toBeCloseTo(22.86, 1);
      expect(calculateBMI(92, 168)).toBeCloseTo(32.6, 1);
    });

    it('handles edge cases', () => {
      expect(calculateBMI(0, 175)).toBe(0);
      expect(() => calculateBMI(70, 0)).toThrow();
    });
  });

  describe('getBMICategory', () => {
    it('returns correct category for each BMI range', () => {
      expect(getBMICategory(17)).toBe('Underweight');
      expect(getBMICategory(22)).toBe('Normal');
      expect(getBMICategory(27)).toBe('Overweight');
      expect(getBMICategory(32)).toBe('Obese Class I');
      expect(getBMICategory(37)).toBe('Obese Class II');
      expect(getBMICategory(42)).toBe('Obese Class III');
    });

    it('handles boundary values', () => {
      expect(getBMICategory(18.5)).toBe('Normal');
      expect(getBMICategory(24.9)).toBe('Normal');
      expect(getBMICategory(25)).toBe('Overweight');
      expect(getBMICategory(30)).toBe('Obese Class I');
    });
  });
});

describe('Progress Calculations', () => {
  describe('calculateTotalChange', () => {
    it('calculates weight change correctly', () => {
      expect(calculateTotalChange(100, 92)).toBe(-8);
      expect(calculateTotalChange(80, 85)).toBe(5);
    });
  });

  describe('calculatePercentChange', () => {
    it('calculates percentage change correctly', () => {
      expect(calculatePercentChange(100, 92)).toBeCloseTo(-8, 1);
      expect(calculatePercentChange(100, 110)).toBeCloseTo(10, 1);
    });

    it('handles zero starting weight', () => {
      expect(() => calculatePercentChange(0, 50)).toThrow();
    });
  });

  describe('calculateWeeklyAverage', () => {
    it('calculates weekly average loss correctly', () => {
      // Lost 8kg over 8 weeks
      expect(calculateWeeklyAverage(-8, 8)).toBe(-1);
      expect(calculateWeeklyAverage(-4, 4)).toBe(-1);
    });

    it('handles zero weeks', () => {
      expect(calculateWeeklyAverage(-8, 0)).toBe(0);
    });
  });
});

describe('Treatment Timeline', () => {
  describe('calculateTreatmentWeek', () => {
    it('calculates treatment week correctly', () => {
      const startDate = new Date('2025-01-01');

      expect(calculateTreatmentWeek(startDate, new Date('2025-01-01'))).toBe(1);
      expect(calculateTreatmentWeek(startDate, new Date('2025-01-07'))).toBe(1);
      expect(calculateTreatmentWeek(startDate, new Date('2025-01-08'))).toBe(2);
      expect(calculateTreatmentWeek(startDate, new Date('2025-02-01'))).toBe(5);
    });
  });

  describe('calculateTreatmentDay', () => {
    it('calculates treatment day correctly', () => {
      const startDate = new Date('2025-01-01');

      expect(calculateTreatmentDay(startDate, new Date('2025-01-01'))).toBe(1);
      expect(calculateTreatmentDay(startDate, new Date('2025-01-02'))).toBe(2);
      expect(calculateTreatmentDay(startDate, new Date('2025-02-01'))).toBe(32);
    });
  });
});
```

### Example: lib/utils/__tests__/injection-logic.test.ts

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  getNextInjectionDue,
  getInjectionStatus,
  getSuggestedSite,
  INJECTION_SITES,
} from '../injection-logic';

describe('Injection Logic', () => {
  beforeEach(() => {
    // Mock current date for consistent tests
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-01-15'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('getNextInjectionDue', () => {
    it('returns date 7 days after last injection by default', () => {
      const lastInjection = new Date('2025-01-08');
      const expected = new Date('2025-01-15');

      expect(getNextInjectionDue(lastInjection)).toEqual(expected);
    });

    it('adjusts to preferred day within ±2 day window', () => {
      const lastInjection = new Date('2025-01-08'); // Wednesday
      // Base due: Jan 15 (Wednesday)
      // Preferred: Sunday (0)
      // Jan 12 (Sun) is -3 days, Jan 19 (Sun) is +4 days
      // Neither within ±2, so returns base

      const result = getNextInjectionDue(lastInjection, 0);
      expect(result).toEqual(new Date('2025-01-15'));
    });

    it('uses preferred day when within window', () => {
      const lastInjection = new Date('2025-01-08'); // Wednesday
      // Base due: Jan 15 (Wednesday)
      // Preferred: Friday (5) = Jan 17, which is +2 days (within window)

      const result = getNextInjectionDue(lastInjection, 5);
      expect(result).toEqual(new Date('2025-01-17'));
    });
  });

  describe('getInjectionStatus', () => {
    it('returns "upcoming" for days 1-5', () => {
      const lastInjection = new Date('2025-01-12'); // 3 days ago
      expect(getInjectionStatus(lastInjection)).toBe('upcoming');
    });

    it('returns "reminder" for day 6', () => {
      const lastInjection = new Date('2025-01-09'); // 6 days ago
      expect(getInjectionStatus(lastInjection)).toBe('reminder');
    });

    it('returns "due_today" for day 7', () => {
      const lastInjection = new Date('2025-01-08'); // 7 days ago
      expect(getInjectionStatus(lastInjection)).toBe('due_today');
    });

    it('returns "overdue" for day 8', () => {
      const lastInjection = new Date('2025-01-07'); // 8 days ago
      expect(getInjectionStatus(lastInjection)).toBe('overdue');
    });

    it('returns "alert" for day 9+', () => {
      const lastInjection = new Date('2025-01-05'); // 10 days ago
      expect(getInjectionStatus(lastInjection)).toBe('alert');
    });
  });

  describe('getSuggestedSite', () => {
    it('rotates through injection sites', () => {
      expect(getSuggestedSite('Abdomen - Left')).toBe('Abdomen - Right');
      expect(getSuggestedSite('Abdomen - Right')).toBe('Thigh - Left');
      expect(getSuggestedSite('Arm - Right')).toBe('Abdomen - Left'); // Wraps around
    });

    it('returns first site for unknown input', () => {
      expect(getSuggestedSite('Unknown')).toBe(INJECTION_SITES[0]);
    });
  });
});
```

---

## 2. Component Tests

### Example: components/results/__tests__/StatCard.test.tsx

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@/tests/utils/render';
import { StatCard } from '../StatCard';

describe('StatCard', () => {
  it('renders label and value', () => {
    render(<StatCard label="Total change" value="-8.80kg" icon="scale" />);

    expect(screen.getByText('Total change')).toBeInTheDocument();
    expect(screen.getByText('-8.80kg')).toBeInTheDocument();
  });

  it('applies correct styling for negative values', () => {
    render(<StatCard label="Change" value="-5kg" trend="down" />);

    const value = screen.getByText('-5kg');
    expect(value).toHaveClass('text-green-500'); // Weight loss is positive
  });

  it('applies correct styling for positive values', () => {
    render(<StatCard label="Change" value="+2kg" trend="up" />);

    const value = screen.getByText('+2kg');
    expect(value).toHaveClass('text-red-500'); // Weight gain is negative
  });

  it('renders icon when provided', () => {
    render(<StatCard label="BMI" value="27.6" icon="body" />);

    expect(screen.getByTestId('stat-icon')).toBeInTheDocument();
  });
});
```

### Example: components/forms/__tests__/WeightEntryForm.test.tsx

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@/tests/utils/render';
import { WeightEntryForm } from '../WeightEntryForm';

describe('WeightEntryForm', () => {
  const mockOnSubmit = vi.fn();

  beforeEach(() => {
    mockOnSubmit.mockClear();
  });

  it('renders weight input field', () => {
    render(<WeightEntryForm onSubmit={mockOnSubmit} />);

    expect(screen.getByLabelText(/weight/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument();
  });

  it('validates required weight field', async () => {
    const { user } = render(<WeightEntryForm onSubmit={mockOnSubmit} />);

    await user.click(screen.getByRole('button', { name: /save/i }));

    expect(await screen.findByText(/weight is required/i)).toBeInTheDocument();
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('validates weight is within valid range', async () => {
    const { user } = render(<WeightEntryForm onSubmit={mockOnSubmit} />);

    await user.type(screen.getByLabelText(/weight/i), '500');
    await user.click(screen.getByRole('button', { name: /save/i }));

    expect(await screen.findByText(/weight must be between/i)).toBeInTheDocument();
  });

  it('submits valid weight entry', async () => {
    const { user } = render(<WeightEntryForm onSubmit={mockOnSubmit} />);

    await user.type(screen.getByLabelText(/weight/i), '92.5');
    await user.click(screen.getByRole('button', { name: /save/i }));

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(
        expect.objectContaining({ weight: 92.5 })
      );
    });
  });

  it('allows optional notes', async () => {
    const { user } = render(<WeightEntryForm onSubmit={mockOnSubmit} />);

    await user.type(screen.getByLabelText(/weight/i), '92.5');
    await user.type(screen.getByLabelText(/notes/i), 'Morning weight');
    await user.click(screen.getByRole('button', { name: /save/i }));

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          weight: 92.5,
          notes: 'Morning weight',
        })
      );
    });
  });

  it('shows loading state during submission', async () => {
    mockOnSubmit.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
    const { user } = render(<WeightEntryForm onSubmit={mockOnSubmit} />);

    await user.type(screen.getByLabelText(/weight/i), '92.5');
    await user.click(screen.getByRole('button', { name: /save/i }));

    expect(screen.getByRole('button', { name: /saving/i })).toBeDisabled();
  });
});
```

---

## 3. API Route Tests

### Example: app/api/weight/__tests__/route.api.test.ts

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { testApiHandler } from 'next-test-api-route-handler';
import * as appHandler from '../route';
import { mockDb, resetDbMocks } from '@/tests/mocks/db';
import { mockAuthenticated, mockUnauthenticated } from '@/tests/mocks/auth';
import { createWeightEntry, createWeightEntries } from '@/tests/factories/weight';

describe('GET /api/weight', () => {
  beforeEach(() => {
    resetDbMocks();
    mockAuthenticated();
  });

  it('returns 401 when not authenticated', async () => {
    mockUnauthenticated();

    await testApiHandler({
      appHandler,
      test: async ({ fetch }) => {
        const res = await fetch({ method: 'GET' });
        expect(res.status).toBe(401);
      },
    });
  });

  it('returns weight entries for authenticated user', async () => {
    const entries = createWeightEntries(5);
    mockDb.execute.mockResolvedValue(entries);

    await testApiHandler({
      appHandler,
      test: async ({ fetch }) => {
        const res = await fetch({ method: 'GET' });
        const data = await res.json();

        expect(res.status).toBe(200);
        expect(data.entries).toHaveLength(5);
      },
    });
  });

  it('filters by date range', async () => {
    const entries = createWeightEntries(3);
    mockDb.execute.mockResolvedValue(entries);

    await testApiHandler({
      appHandler,
      url: '/api/weight?from=2025-01-01&to=2025-01-31',
      test: async ({ fetch }) => {
        const res = await fetch({ method: 'GET' });

        expect(res.status).toBe(200);
        expect(mockDb.where).toHaveBeenCalled();
      },
    });
  });
});

describe('POST /api/weight', () => {
  beforeEach(() => {
    resetDbMocks();
    mockAuthenticated();
  });

  it('creates a new weight entry', async () => {
    const newEntry = createWeightEntry({ weightKg: 92.5 });
    mockDb.execute.mockResolvedValue([newEntry]);

    await testApiHandler({
      appHandler,
      test: async ({ fetch }) => {
        const res = await fetch({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ weight: 92.5 }),
        });
        const data = await res.json();

        expect(res.status).toBe(201);
        expect(data.entry.weightKg).toBe(92.5);
      },
    });
  });

  it('validates weight is required', async () => {
    await testApiHandler({
      appHandler,
      test: async ({ fetch }) => {
        const res = await fetch({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({}),
        });

        expect(res.status).toBe(400);
      },
    });
  });

  it('validates weight is a number', async () => {
    await testApiHandler({
      appHandler,
      test: async ({ fetch }) => {
        const res = await fetch({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ weight: 'abc' }),
        });

        expect(res.status).toBe(400);
      },
    });
  });
});
```

---

## 4. E2E Tests

### Example: e2e/onboarding.spec.ts

```typescript
import { test, expect } from '@playwright/test';

test.describe('Onboarding Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Start fresh - clear any existing session
    await page.goto('/');
  });

  test('completes full onboarding flow', async ({ page }) => {
    // Step 1: Navigate to register
    await page.goto('/register');
    await page.fill('[name="email"]', 'test@example.com');
    await page.fill('[name="password"]', 'SecurePass123!');
    await page.fill('[name="confirmPassword"]', 'SecurePass123!');
    await page.click('button[type="submit"]');

    // Should redirect to onboarding
    await expect(page).toHaveURL('/onboarding/profile');

    // Step 2: Profile info
    await page.fill('[name="age"]', '27');
    await page.selectOption('[name="gender"]', 'Male');
    await page.fill('[name="height"]', '168');
    await page.click('button:has-text("Next")');

    await expect(page).toHaveURL('/onboarding/goals');

    // Step 3: Goals
    await page.fill('[name="startingWeight"]', '93');
    await page.fill('[name="goalWeight"]', '68');
    await page.fill('[name="treatmentStartDate"]', '2025-01-01');
    await page.click('button:has-text("Next")');

    await expect(page).toHaveURL('/onboarding/first-entry');

    // Step 4: First entry
    await page.fill('[name="weight"]', '93');
    await page.fill('[name="dose"]', '2.5');
    await page.selectOption('[name="injectionSite"]', 'Abdomen - Left');
    await page.click('button:has-text("Complete Setup")');

    // Should redirect to summary
    await expect(page).toHaveURL('/summary');
    await expect(page.locator('h1')).toContainText('Summary');
  });

  test('validates required fields', async ({ page }) => {
    await page.goto('/onboarding/profile');

    // Try to proceed without filling fields
    await page.click('button:has-text("Next")');

    // Should show validation errors
    await expect(page.locator('text=Age is required')).toBeVisible();
    await expect(page.locator('text=Gender is required')).toBeVisible();
    await expect(page.locator('text=Height is required')).toBeVisible();

    // Should stay on same page
    await expect(page).toHaveURL('/onboarding/profile');
  });
});
```

### Example: e2e/weight-logging.spec.ts

```typescript
import { test, expect } from '@playwright/test';

test.describe('Weight Logging', () => {
  test.beforeEach(async ({ page }) => {
    // Login with test user
    await page.goto('/login');
    await page.fill('[name="email"]', 'test@example.com');
    await page.fill('[name="password"]', 'testpassword');
    await page.click('button[type="submit"]');
    await page.waitForURL('/summary');
  });

  test('logs weight from summary page', async ({ page }) => {
    await page.goto('/summary');

    // Click log weight button
    await page.click('button:has-text("Log Weight")');

    // Fill weight form
    await page.fill('[name="weight"]', '91.5');
    await page.fill('[name="notes"]', 'Morning weight after workout');
    await page.click('button:has-text("Save")');

    // Should see success message
    await expect(page.locator('text=Weight logged successfully')).toBeVisible();

    // Weight should appear in recent activity
    await expect(page.locator('text=91.5kg')).toBeVisible();
  });

  test('logs weight from calendar page', async ({ page }) => {
    await page.goto('/calendar');

    // Click on today's date
    const today = new Date().getDate().toString();
    await page.click(`[data-date="${today}"]`);

    // Click log weight button
    await page.click('button:has-text("Log Weight")');

    await page.fill('[name="weight"]', '91.8');
    await page.click('button:has-text("Save")');

    // Should see weight marker on calendar
    await expect(page.locator(`[data-date="${today}"] .weight-marker`)).toBeVisible();
  });

  test('edits existing weight entry', async ({ page }) => {
    await page.goto('/calendar');

    // Find an existing weight entry and click edit
    await page.click('[data-testid="weight-entry"] >> button:has-text("Edit")');

    // Update weight
    await page.fill('[name="weight"]', '92.0');
    await page.click('button:has-text("Save")');

    // Should see updated value
    await expect(page.locator('text=92.0kg')).toBeVisible();
  });
});
```

### Example: e2e/results-dashboard.spec.ts

```typescript
import { test, expect } from '@playwright/test';

test.describe('Results Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.fill('[name="email"]', 'test@example.com');
    await page.fill('[name="password"]', 'testpassword');
    await page.click('button[type="submit"]');
  });

  test('displays all stat cards', async ({ page }) => {
    await page.goto('/results');

    // Check all 6 stat cards are visible
    await expect(page.locator('text=Total change')).toBeVisible();
    await expect(page.locator('text=Current BMI')).toBeVisible();
    await expect(page.locator('text=Weight')).toBeVisible();
    await expect(page.locator('text=Percent')).toBeVisible();
    await expect(page.locator('text=Weekly avg')).toBeVisible();
    await expect(page.locator('text=To goal')).toBeVisible();
  });

  test('filters data by time period', async ({ page }) => {
    await page.goto('/results');

    // Default should be "All Time"
    await expect(page.locator('[data-tab="all-time"]')).toHaveAttribute('aria-selected', 'true');

    // Click 1 month filter
    await page.click('[data-tab="1-month"]');
    await expect(page.locator('[data-tab="1-month"]')).toHaveAttribute('aria-selected', 'true');

    // Date range should update
    const dateRange = page.locator('[data-testid="date-range"]');
    await expect(dateRange).toContainText(new Date().toLocaleDateString('en-GB', { month: 'short' }));
  });

  test('displays weight chart with dose markers', async ({ page }) => {
    await page.goto('/results');

    // Chart should be visible
    await expect(page.locator('[data-testid="weight-chart"]')).toBeVisible();

    // Dose markers should be visible (at least one)
    const doseMarkerCount = await page.locator('.dose-marker').count();
    expect(doseMarkerCount).toBeGreaterThan(0);
  });

  test('chart is responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/results');

    // Chart should still be visible and properly sized
    const chart = page.locator('[data-testid="weight-chart"]');
    await expect(chart).toBeVisible();

    const box = await chart.boundingBox();
    expect(box?.width).toBeLessThanOrEqual(375);
  });
});
```

### Example: e2e/pwa.spec.ts

```typescript
import { test, expect } from '@playwright/test';

test.describe('PWA Features', () => {
  test('has valid web manifest', async ({ page }) => {
    await page.goto('/');

    // Check manifest link exists
    const manifestLink = page.locator('link[rel="manifest"]');
    await expect(manifestLink).toHaveAttribute('href', '/manifest.webmanifest');

    // Fetch and validate manifest
    const manifestResponse = await page.request.get('/manifest.webmanifest');
    expect(manifestResponse.ok()).toBeTruthy();

    const manifest = await manifestResponse.json();
    expect(manifest.name).toBe('Mounjaro Tracker');
    expect(manifest.short_name).toBe('MounjaroRx');
    expect(manifest.display).toBe('standalone');
    expect(manifest.icons).toHaveLength(3);
  });

  test('registers service worker', async ({ page }) => {
    await page.goto('/');

    // Wait for service worker to register
    const swRegistration = await page.evaluate(async () => {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.ready;
        return !!registration;
      }
      return false;
    });

    expect(swRegistration).toBe(true);
  });

  test('shows offline page when disconnected', async ({ page, context }) => {
    // First, visit the page to cache it
    await page.goto('/summary');
    await page.waitForLoadState('networkidle');

    // Go offline
    await context.setOffline(true);

    // Try to navigate to a non-cached page
    await page.goto('/settings/export');

    // Should show offline fallback
    await expect(page.locator('text=You\'re offline')).toBeVisible();

    // Go back online
    await context.setOffline(false);
  });

  test('caches visited pages for offline access', async ({ page, context }) => {
    // Visit pages to cache them
    await page.goto('/summary');
    await page.waitForLoadState('networkidle');
    await page.goto('/results');
    await page.waitForLoadState('networkidle');

    // Go offline
    await context.setOffline(true);

    // Cached pages should still work
    await page.goto('/summary');
    await expect(page.locator('h1')).toContainText('Summary');

    await page.goto('/results');
    await expect(page.locator('h1')).toContainText('Results');

    await context.setOffline(false);
  });
});
```

---

## CI/CD Integration

### GitHub Actions: .github/workflows/test.yml

```yaml
name: Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run unit tests
        run: npm run test:run -- --coverage

      - name: Upload coverage
        uses: codecov/codecov-action@v4
        with:
          files: ./coverage/coverage-final.json

  e2e-tests:
    runs-on: ubuntu-latest
    needs: unit-tests
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright browsers
        run: npx playwright install --with-deps

      - name: Build application
        run: npm run build
        env:
          DATABASE_URL: ${{ secrets.TEST_DATABASE_URL }}

      - name: Run E2E tests
        run: npm run test:e2e
        env:
          DATABASE_URL: ${{ secrets.TEST_DATABASE_URL }}

      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 30
```

---

## Test Coverage Targets

| Category | Target | Priority |
|----------|--------|----------|
| Utility functions | 95% | P0 |
| Business logic (injection-logic) | 90% | P0 |
| Form components | 85% | P1 |
| API routes | 80% | P1 |
| UI components | 75% | P2 |
| E2E critical paths | 100% | P0 |

### Critical E2E Paths (Must Have)

1. Onboarding flow (new user registration → first entry)
2. Weight logging flow
3. Injection logging flow
4. Results dashboard viewing
5. Time period filtering
6. PWA offline behavior

---

## Running Tests

```bash
# Run all unit tests in watch mode
npm test

# Run unit tests once (CI mode)
npm run test:run

# Run tests with coverage
npm run test:coverage

# Run tests with UI
npm run test:ui

# Run E2E tests
npm run test:e2e

# Run E2E tests with UI
npm run test:e2e:ui

# Run E2E tests headed (see browser)
npm run test:e2e:headed

# Run all tests
npm run test:all
```

---

## Next Steps for Implementation

1. ~~**First**: Set up the testing infrastructure~~ ✅ DONE
   - ~~Install dependencies~~ ✅
   - ~~Create config files~~ ✅ (`vitest.config.ts`, `playwright.config.ts`)
   - ~~Set up test utilities and mocks~~ ✅ (`tests/setup.ts`, `tests/mocks/*`, `tests/factories/*`)

2. ~~**Second**: Write unit tests for utility functions~~ ✅ DONE
   - ~~These are pure functions, easiest to test~~ ✅ (126 tests)
   - Created utility functions: `conversions.ts`, `calculations.ts`, `dates.ts`, `injection-logic.ts`

3. **Third**: Add component tests for forms ⏳ PENDING (blocked by UI)
   - Forms have complex validation logic
   - Critical for user experience
   - **Waiting for**: UI components to be implemented
   - **Priority files when ready**:
     - `components/forms/WeightEntryForm.test.tsx`
     - `components/forms/InjectionForm.test.tsx`
     - `components/forms/DailyLogForm.test.tsx`

4. ~~**Fourth**: Add API route tests~~ 🔄 IN PROGRESS (P1 complete)
   - ~~Test CRUD operations~~ ✅ (weight routes done - 14 tests)
   - **P1 API tests complete** (2025-12-31):
     - [x] `/api/injections/*` - 55 tests (route, [id], latest, next-due)
     - [x] `/api/daily-logs/*` - 58 tests (route, [date], week-summary)
     - [x] `/api/stats/*` - 32 tests (summary, results)
   - **P2 API routes to test**:
     - [ ] `/api/profile` - GET, PUT
     - [ ] `/api/preferences` - GET, PUT
     - [ ] `/api/calendar/*` - month data
     - [ ] `/api/export/*` - json, text, image, full

5. **Fifth**: Add E2E tests for critical flows ⏳ PENDING (blocked by UI)
   - Placeholder created: `e2e/example.spec.ts`
   - **Waiting for**: UI pages to be implemented
   - **Priority flows when ready**:
     - Onboarding flow (register → onboarding → summary)
     - Weight logging flow
     - Injection logging flow
     - Results dashboard viewing

6. **Finally**: Set up CI/CD pipeline ⏳ PENDING
   - Run tests on every PR
   - GitHub Actions workflow template in spec
   - Block merges on test failures
