# Mounjaro Tracker - Claude Code Context

## Atomic Commits (MANDATORY)

**Make small, focused commits after completing each logical unit of work.**

```bash
# Commit pattern
git add -A && git commit -m "type: short description"

# Types: feat, fix, docs, refactor, test, chore
# Examples:
# feat: add database schema for users and profiles
# feat: implement weight entry API routes
# fix: correct BMI calculation formula
# docs: update spec with implementation notes
# test: add unit tests for date utilities
```

**When to commit:**
- After creating/modifying a schema table
- After completing an API route
- After finishing a component
- After adding tests for a feature
- After updating documentation

**Never commit:**
- Half-finished features
- Code that doesn't compile/lint
- Without running `pnpm lint` first

---

## Living Documentation (CRITICAL)

**As you implement features, you MUST update the spec documents:**

1. **docs/mounjaro-tracker-spec-v2.md** - Mark completed items, add implementation notes
2. **docs/testing-spec.md** - Update with actual test file paths, add new test cases

### How to Update Specs

After completing any feature or component:
```
1. Read the relevant spec section
2. Add implementation notes (file paths, decisions made, deviations)
3. Mark success criteria as completed with checkmarks
4. Document any API changes or schema modifications
```

### Progress Tracking Format

In the spec files, use this format to track progress:
- `[ ]` - Not started
- `[~]` - In progress
- `[x]` - Completed
- `[!]` - Blocked or needs attention

Add implementation notes like:
```markdown
> **Implementation Note (YYYY-MM-DD):**
> Implemented in `path/to/file.ts`. Used X approach because Y.
```

---

## Project Summary

Progressive Web App for monitoring Mounjaro (Tirzepatide) treatment. Tracks weight, injections, side effects, daily logs, and lifestyle factors.

**Stack:** Next.js 14+ (App Router), TypeScript, Tailwind CSS, Drizzle ORM, PostgreSQL, Serwist PWA, Recharts, NextAuth.js, Resend

---

## Directory Structure

```
/app                    # Next.js App Router pages
  /(auth)               # Auth pages (login, register, etc)
  /(app)                # Main app pages (summary, results, etc)
  /(onboarding)         # Onboarding flow
  /api                  # API routes
  /~offline             # PWA offline fallback
  manifest.ts           # PWA manifest
  sw.ts                 # Service worker source
/components             # React components
  /ui                   # Base UI components
  /charts               # Recharts components
  /forms                # Form components
  /layout               # Layout components
/lib                    # Utilities and services
  /db                   # Drizzle ORM setup
  /auth                 # NextAuth config
  /email                # Resend templates
  /utils                # Helper functions
  /hooks                # Custom React hooks
/tests                  # Test utilities and mocks
/e2e                    # Playwright E2E tests
/docs                   # Specifications
/public                 # Static assets
```

---

## Commands

**Package Manager: pnpm** (2-3x faster than npm, uses 70% less disk space)

```bash
# Development
pnpm dev                # Start dev server (Turbopack)
pnpm build              # Production build
pnpm start              # Start production server
pnpm lint               # Run ESLint

# Database
pnpm db:generate        # Generate Drizzle migrations
pnpm db:push            # Push schema to database
pnpm db:studio          # Open Drizzle Studio

# Testing
pnpm test               # Run Vitest in watch mode
pnpm test:run           # Run tests once
pnpm test:coverage      # Run with coverage
pnpm test:e2e           # Run Playwright E2E tests

# Adding packages
pnpm add <package>      # Add dependency
pnpm add -D <package>   # Add dev dependency
```

---

## Code Style & Conventions

### TypeScript
- Strict mode enabled
- Prefer `type` over `interface` for object shapes
- Use Zod for runtime validation

### React/Next.js
- Server Components by default
- Add `'use client'` only when needed (hooks, interactivity)
- Use App Router patterns (not Pages Router)
- Collocate components with their pages when page-specific

### Styling
- Tailwind CSS for all styling
- Dark theme by default
- Mobile-first responsive design
- **Use design tokens from `globals.css` - NEVER hardcode hex colors**

#### Design Token System (MANDATORY)

Design tokens are defined in `src/app/globals.css` using CSS variables and mapped to Tailwind via `@theme inline`.

**Available tokens:**
```css
/* Backgrounds */
bg-background         /* #0a0a0a - main background */
bg-background-card    /* #1a2a3a - card/elevated surfaces */

/* Text */
text-foreground       /* #ffffff - primary text */
text-foreground-muted /* #9ca3af - secondary text */

/* Accents */
bg-accent-primary     /* #00d4ff - cyan, primary actions */
bg-accent-secondary   /* #a855f7 - purple, secondary actions */

/* Semantic */
text-error / bg-error     /* #ef4444 - errors */
text-success / bg-success /* #22c55e - success */
text-warning / bg-warning /* #eab308 - warnings */

/* Dose colors (for charts) */
bg-dose-2-5, bg-dose-5-0, bg-dose-7-5, etc.
```

**Usage examples:**
```tsx
// Correct - use tokens
<div className="bg-background-card text-foreground">
<button className="bg-accent-primary text-background">

// Wrong - never hardcode
<div className="bg-[#1a2a3a] text-white">
<button className="bg-[#00d4ff]">
```

### Database
- Drizzle ORM with PostgreSQL
- UUID primary keys
- Timestamps on all tables (`createdAt`, `updatedAt`)
- Soft delete where appropriate

### File Naming
- Components: PascalCase (`WeightChart.tsx`)
- Utilities: camelCase (`calculations.ts`)
- Tests: `*.test.ts` or `*.test.tsx`
- API tests: `*.api.test.ts`

---

## Key Files Reference

| Purpose | Location |
|---------|----------|
| Main spec | `docs/mounjaro-tracker-spec-v2.md` |
| Testing spec | `docs/testing-spec.md` |
| DB Schema | `src/lib/db/schema.ts` |
| Auth config | `src/lib/auth/config.ts` |
| **DAL (Data Access Layer)** | `src/lib/dal.ts` |
| **Proxy (Auth Redirects)** | `src/proxy.ts` |
| Theme colors | Spec line 302-321 |
| API routes | Spec line 1256-1306 |
| Page routes | Spec line 1217-1252 |

---

## Development Workflow

### Before Starting a Feature
1. Read the relevant section in `docs/mounjaro-tracker-spec-v2.md`
2. Check `docs/testing-spec.md` for test requirements
3. Plan the implementation approach

### During Implementation
1. Follow the spec exactly for UI/UX (especially Results page)
2. Write tests alongside code (TDD for utilities)
3. Use TypeScript strictly - no `any` types

### After Completing a Feature
1. **Update the spec** with implementation notes
2. Run `pnpm lint` and `pnpm test`
3. Verify mobile responsiveness
4. Test offline behavior if PWA-related

---

## Common Patterns

### Authentication Architecture (CVE-2025-29927 Compliant)

The app uses a **layered security model**:

| Layer | File | Purpose |
|-------|------|---------|
| **Proxy** | `src/proxy.ts` | Optimistic redirects (no DB calls) |
| **DAL** | `src/lib/dal.ts` | Session verification at data access |
| **API Routes** | `src/app/api/*/route.ts` | Auth checks before mutations |

**Security Note:** Proxy alone is NOT secure (CVE-2025-29927). Always verify auth at the data layer using DAL functions.

> **Next.js 16 Note:** The `middleware.ts` convention is deprecated. Use `proxy.ts` instead.

### Layout with DAL (Recommended)
```typescript
// app/(app)/layout.tsx
import { verifySessionWithProfile } from '@/lib/dal';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  // Verifies session AND profile, redirects if either is missing
  await verifySessionWithProfile();
  return <>{children}</>;
}
```

### API Route Handler
```typescript
// app/api/example/route.ts
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  // Access user ID: session.user.id
}
```

### DAL Functions Available
```typescript
import {
  verifySession,          // Returns session or redirects to /login
  getSession,             // Returns session or null (no redirect)
  getUserProfile,         // Returns profile or null
  verifySessionWithProfile, // Returns session+profile or redirects
  verifySessionForOnboarding, // For onboarding pages
  redirectIfAuthenticated,  // For auth pages (login, register)
  getUserPreferences,     // Returns preferences with defaults
} from '@/lib/dal';
```

### Client Component
```typescript
// components/example/ExampleClient.tsx
'use client';

import { useState } from 'react';

export function ExampleClient({ initialData }: Props) {
  const [data, setData] = useState(initialData);
  // ... implementation
}
```

---

## Warnings & Gotchas

- **PWA disabled in dev**: Serwist is disabled in development mode
- **Async Server Components**: Vitest doesn't support testing async RSC yet - use E2E
- **Weight units**: Always store in kg, convert for display
- **Injection dates**: Use timestamps, not just dates (for time tracking)
- **Session**: Always check auth before DB operations

---

## Current Implementation Status

Track overall progress here:

- [x] Project scaffolding (Next.js 16, pnpm, Tailwind, TypeScript)
- [x] Database schema (13 tables - added password_reset_tokens)
- [x] Authentication (NextAuth v5 with credentials provider)
- [x] Password reset flow (forgot-password, reset-password API + pages)
- [x] API routes (all 27 endpoints complete)
- [x] Onboarding flow (single-screen setup)
- [x] Summary page (dashboard with all 4 sections)
- [x] Results page (chart with dose-colored segments)
- [x] Jabs page (injection history and log form)
- [x] Calendar page (month grid with day details and log modals)
- [x] Settings page (profile, treatment, preferences, data export)
- [x] Daily log forms (/log page with diet, activity, mental, side effects)
- [x] PWA configuration (Serwist service worker, manifest, offline page)
- [x] Email notifications (Resend integration with styled templates)
- [ ] Data export
- [x] Testing (unit) - 599 tests passing, 90% coverage (all API routes tested except edge runtime image export)
- [x] Testing (E2E) - 7 test files created for critical flows
- [x] Production deployment (Vercel)

### Completed API Routes (2025-12-31)

| Route | Methods | File |
|-------|---------|------|
| `/api/auth/register` | POST | `src/app/api/auth/register/route.ts` |
| `/api/auth/forgot-password` | POST | `src/app/api/auth/forgot-password/route.ts` |
| `/api/auth/reset-password` | POST | `src/app/api/auth/reset-password/route.ts` |
| `/api/profile` | GET, PUT | `src/app/api/profile/route.ts` |
| `/api/preferences` | GET, PUT | `src/app/api/preferences/route.ts` |
| `/api/weight` | GET, POST | `src/app/api/weight/route.ts` |
| `/api/weight/[id]` | GET, PUT, DELETE | `src/app/api/weight/[id]/route.ts` |
| `/api/weight/latest` | GET | `src/app/api/weight/latest/route.ts` |
| `/api/weight/stats` | GET | `src/app/api/weight/stats/route.ts` |
| `/api/injections` | GET, POST | `src/app/api/injections/route.ts` |
| `/api/injections/[id]` | GET, PUT, DELETE | `src/app/api/injections/[id]/route.ts` |
| `/api/injections/latest` | GET | `src/app/api/injections/latest/route.ts` |
| `/api/injections/next-due` | GET | `src/app/api/injections/next-due/route.ts` |
| `/api/daily-logs` | GET, POST | `src/app/api/daily-logs/route.ts` |
| `/api/daily-logs/[date]` | GET, PUT | `src/app/api/daily-logs/[date]/route.ts` |
| `/api/daily-logs/week-summary` | GET | `src/app/api/daily-logs/week-summary/route.ts` |
| `/api/stats/summary` | GET | `src/app/api/stats/summary/route.ts` |
| `/api/stats/results` | GET | `src/app/api/stats/results/route.ts` |
| `/api/calendar/[year]/[month]` | GET | `src/app/api/calendar/[year]/[month]/route.ts` |

| `/api/export/json` | GET | `src/app/api/export/json/route.ts` |
| `/api/export/text` | GET | `src/app/api/export/text/route.ts` |
| `/api/export/image` | GET | `src/app/api/export/image/route.tsx` |
| `/api/export/full` | GET | `src/app/api/export/full/route.ts` |
| `/api/notifications/preferences` | GET, PUT | `src/app/api/notifications/preferences/route.ts` |
| `/api/cron/send-notifications` | POST | `src/app/api/cron/send-notifications/route.ts` |
| `/api/onboarding/complete` | POST | `src/app/api/onboarding/complete/route.ts` |

### Onboarding Implementation (2025-12-31)

Single-screen onboarding with collapsible sections:
- **Files:**
  - `src/app/(onboarding)/layout.tsx` - Auth check, profile redirect
  - `src/app/(onboarding)/onboarding/page.tsx` - Onboarding page
  - `src/components/onboarding/` - Form components
  - `src/lib/validations/onboarding.ts` - Zod schemas + unit converters
- **Flow:** Register → /onboarding → Fill form → Submit → /summary
- **Sections:** About You (age, gender, height), Goals (weights, start date), First Injection

### Summary Page Implementation (2025-12-31)

Dashboard with 4 sections per wireframe (spec lines 337-469):
- **Files:**
  - `src/app/(app)/layout.tsx` - Auth check, profile redirect, bottom nav
  - `src/app/(app)/summary/page.tsx` - Main Summary page (SSR)
  - `src/components/layout/BottomNav.tsx` - 5-tab bottom navigation
  - `src/components/summary/` - Section components
  - `src/components/ui/` - Shared UI components (StatCard, Section, ProgressBar, ActionCard)
- **Sections:** Action Required (injection + log), Current State (weight cards), Journey Progress (goal + timeline), Recent Activity
- **Features:** Empty state for new users, responsive layout, unit conversion display

### Results Page Implementation (2025-12-31)

Chart-focused analytics page matching reference design:
- **Files:**
  - `src/app/(app)/results/page.tsx` - Main Results page (client component)
  - `src/components/results/PeriodTabs.tsx` - Period selector (1m, 3m, 6m, All Time)
  - `src/components/results/ResultsStatCard.tsx` - Stat card component
  - `src/components/charts/WeightChart.tsx` - Recharts line chart with dose segments
- **Features:**
  - Period filtering with underline indicator
  - 6 stat cards: Total change, Current BMI, Weight, Percent, Weekly avg, To goal
  - Line chart with dose-colored segments (gray 2.5mg, purple 5.0mg, etc.)
  - Dose badges showing dose transition points
  - Y-axis on right side, responsive layout
  - Updated BottomNav with pill-style active indicator

### Jabs Page Implementation (2025-12-31)

Injection management page matching spec wireframe (lines 493-576):
- **Files:**
  - `src/app/(app)/jabs/page.tsx` - Main Jabs page (client component)
  - `src/components/jabs/JabsStatCard.tsx` - Stat card component
  - `src/components/jabs/InjectionHistoryItem.tsx` - History list item
  - `src/components/jabs/index.ts` - Barrel exports
- **Features:**
  - 4 stat cards: Total Injections, Current Dose, Weeks on Current Dose, Next Due
  - Scrollable injection history with dose change indicators (⬆️ Dose Up)
  - Edit buttons on each history entry
  - Log Injection modal with dose grid, site dropdown, date picker, notes
  - Site rotation suggestion based on last injection
  - Empty state for new users
  - Skeleton loading state

### Calendar Page Implementation (2025-12-31)

Calendar view with month navigation and day details (spec lines 579-643):
- **Files:**
  - `src/app/(app)/calendar/page.tsx` - Main Calendar page (client component)
  - `src/components/calendar/CalendarGrid.tsx` - Month grid with navigation
  - `src/components/calendar/DayDetail.tsx` - Selected day panel with entries
  - `src/components/calendar/index.ts` - Barrel exports
- **Features:**
  - Month navigation (← / →) with year rollover
  - 7-column calendar grid with weekday headers
  - Day indicators: 💉 (injection), ● (weight), · (daily log)
  - Today highlighting with ring, selected day with accent background
  - Legend showing indicator meanings
  - Day detail panel showing entries for selected date
  - Quick action buttons: Log Weight, Log Injection, Daily Log
  - Three modals for logging entries with form validation
  - Skeleton loading state
  - Fetches calendar data from `/api/calendar/[year]/[month]`
  - Fetches daily log details when day selected

### Settings Page Implementation (2025-12-31)

Settings page with grouped sections and edit modals (spec lines 646-765):
- **Files:**
  - `src/app/(app)/settings/page.tsx` - Main Settings page (client component)
  - `src/components/settings/SettingsSection.tsx` - Section container
  - `src/components/settings/SettingsItem.tsx` - Clickable setting row
  - `src/components/settings/index.ts` - Barrel exports
- **Sections:**
  - Profile: Personal Info, Goals, Account
  - Treatment: Injection Schedule
  - Preferences: Units, Notifications, Appearance
  - Data: Export Data, Download All Data
  - Support: Help, Feedback, Privacy, Terms
  - Danger Zone: Delete Account
- **Modals:**
  - Personal Info (age, gender, height)
  - Goals (goal weight, treatment start date)
  - Injection Schedule (preferred day, reminder timing)
  - Units (weight, height, date format)
  - Notifications (email reminders, weekly report toggles)
  - Export (text, JSON, image options)
  - Delete Account (confirmation required)
- **Features:**
  - Log Out button with NextAuth signOut
  - App version display
  - Skeleton loading state
  - Unit conversion display (kg/lbs/stone, cm/ft-in)

### Performance Optimizations (2025-12-31)

- **Loading skeletons**: All 5 main routes have `loading.tsx` for instant navigation feedback
- **Link prefetching**: BottomNav uses `prefetch={true}` on all navigation links
- **Parallel queries**: Summary page uses `Promise.all()` for 6 parallel DB queries (was 10+ sequential)

### Daily Log Page Implementation (2025-12-31)

The `/log` page for daily wellness tracking:
- **Files:**
  - `src/app/(app)/log/page.tsx` - Main log form page for today (client component)
  - `src/app/(app)/log/loading.tsx` - Loading skeleton
  - `src/app/(app)/log/[date]/page.tsx` - Date-specific log page (client component)
  - `src/app/(app)/log/[date]/loading.tsx` - Loading skeleton for date page
- **Sections (collapsible):**
  - Diet: Hunger level, meals count, protein grams, water liters
  - Activity: Workout type, duration minutes, steps
  - Mental: Motivation, cravings, mood levels
  - Side Effects: Dynamic list with type and severity
- **Features:**
  - `/log` - logs for today, redirects to /summary on save
  - `/log/[date]` - logs for any date (YYYY-MM-DD format), back button to /calendar
  - Pre-populates from existing log for the date
  - Completion indicators on each section
  - Saves all sections in single API call to `/api/daily-logs`
  - Calendar page navigates to `/log/[date]` when "Daily Log" button is clicked

### Quick Entry Pages Implementation (2025-12-31)

Dedicated pages for quick data entry from Summary dashboard:

**`/jabs/new` - New Injection Page:**
- **File:** `src/app/(app)/jabs/new/page.tsx`
- **Features:**
  - Dose selection grid (2.5mg - 15mg)
  - Site rotation suggestions based on last injection
  - Date/time picker, optional notes
  - Fetches last injection for smart defaults
  - Redirects to `/jabs` on successful save

**`/weight/new` - New Weight Page:**
- **File:** `src/app/(app)/weight/new/page.tsx`
- **Features:**
  - Weight input with kg/lbs toggle
  - Respects user's unit preference from `/api/preferences`
  - Date picker, optional notes
  - Converts lbs to kg before saving
  - Redirects to `/summary` on successful save

### Email Notifications Implementation (2025-12-31)

Resend integration with styled HTML email templates:

**Files:**
- `src/lib/email/resend.ts` - Resend client singleton with error handling
- `src/lib/email/templates/index.ts` - Styled HTML email templates
- `src/lib/email/index.ts` - Barrel exports
- `src/app/api/cron/send-notifications/route.ts` - Cron job for scheduled emails
- `src/app/api/notifications/preferences/route.ts` - User notification preferences

**Email Templates:**
- `injectionReminderTemplate` - Reminder before injection due date
- `injectionOverdueTemplate` - Warning when injection is overdue
- `weightReminderTemplate` - Daily weight logging reminder
- `weeklySummaryTemplate` - Weekly progress report
- `passwordResetTemplate` - Password reset link
- `milestoneReachedTemplate` - Achievement notifications
- `doseEscalationReminderTemplate` - Dose review reminder

**Notification Types:**
| Type | Trigger | Description |
|------|---------|-------------|
| `injection_reminder` | X days before due | Configurable via `reminderDaysBefore` |
| `injection_overdue` | 1-3 days after due | Overdue warning |
| `weight_reminder` | After noon if not logged | Daily weight reminder |
| `weekly_summary` | Sundays | Weekly progress summary |
| `milestone_reached` | On achievement | Weight loss milestones |

**Environment Variables:**
```
RESEND_API_KEY=re_xxxxxxxxxxxxx
RESEND_FROM_EMAIL=Mounjaro Tracker <notifications@yourdomain.com>
CRON_SECRET=your-cron-secret-key
```

**Cron Setup:**
- Call `POST /api/cron/send-notifications` with `Authorization: Bearer {CRON_SECRET}`
- Recommended: Run every hour via Vercel Cron or external scheduler

### Vercel Deployment (2025-12-31)

Production deployment on Vercel with automated cron job:

**URLs:**
- **Production:** https://mj-tracker-xi.vercel.app
- **Dashboard:** https://vercel.com/dctmfoos-projects/mj-tracker

**Configuration:**
- `vercel.json` - Framework and cron configuration
- Cron: Daily at 9:00 AM UTC (Hobby plan limit)
- All environment variables configured for production

**Environment Variables (Vercel):**
| Variable | Environment |
|----------|-------------|
| `DATABASE_URL` | Preview, Production |
| `NEXTAUTH_SECRET` | Preview, Production |
| `NEXTAUTH_URL` | Preview, Production |
| `RESEND_API_KEY` | Preview, Production |
| `RESEND_FROM_EMAIL` | Preview, Production |
| `NEXT_PUBLIC_APP_URL` | Preview, Production |
| `NEXT_PUBLIC_APP_NAME` | Preview, Production |
| `CRON_SECRET` | Preview, Production |

**Commands:**
```bash
vercel              # Deploy preview
vercel --prod       # Deploy production
vercel env ls       # List environment variables
vercel logs         # View deployment logs
```

### Backend API Status: COMPLETE

All API routes are now implemented. Next: Testing or UI pages.

### Authentication Architecture (2025-12-31)

Implemented layered authentication following Next.js best practices (post-CVE-2025-29927):

**Files:**
- `src/proxy.ts` - Optimistic redirects (no DB calls) - Next.js 16 convention
- `src/lib/dal.ts` - Data Access Layer with cached session verification
- `src/lib/auth/config.ts` - NextAuth v5 configuration
- `src/lib/auth/index.ts` - Auth exports (deprecated helpers point to DAL)

**Pattern:**
```
User Request → Proxy (optimistic) → Layout (DAL) → API Route (auth check)
```

**Proxy Routes:**
| Route Type | Behavior |
|------------|----------|
| Protected (`/summary`, `/results`, etc.) | Redirect to `/login` if unauthenticated |
| Auth (`/login`, `/register`, etc.) | Redirect to `/summary` if authenticated |
| API (`/api/*`) | Pass through (API handles own auth) |
| Root (`/`) | Redirect to `/summary` if authenticated |

**DAL Functions:**
- `verifySession()` - Returns session or redirects to /login
- `getSession()` - Returns session or null (for API routes)
- `verifySessionWithProfile()` - Returns session+profile or redirects
- `verifySessionForOnboarding()` - For onboarding pages
- `redirectIfAuthenticated()` - For auth pages
- `getUserProfile()` - Returns profile or null
- `getUserPreferences()` - Returns preferences with defaults

**Tests:**
- `src/lib/__tests__/dal.test.ts` - 21 tests for DAL functions
- `src/__tests__/proxy.test.ts` - 31 tests for proxy routes

### Testing Infrastructure (2026-01-01)

**599 tests passing** - Testing infrastructure is complete with 90% coverage.

| Category | Files | Tests |
|----------|-------|-------|
| Unit Tests | `src/lib/utils/__tests__/*` | 126 |
| DAL Tests | `src/lib/__tests__/dal.test.ts` | 21 |
| Proxy Tests | `src/__tests__/proxy.test.ts` | 31 |
| API Tests - Auth | `src/app/api/auth/**/__tests__/*` | 43 |
| API Tests - Weight | `src/app/api/weight/**/__tests__/*` | 50 |
| API Tests - Injections | `src/app/api/injections/__tests__/*` | 55 |
| API Tests - Daily Logs | `src/app/api/daily-logs/__tests__/*` | 58 |
| API Tests - Stats | `src/app/api/stats/__tests__/*` | 32 |
| API Tests - Profile | `src/app/api/profile/__tests__/*` | 16 |
| API Tests - Preferences | `src/app/api/preferences/__tests__/*` | 16 |
| API Tests - Calendar | `src/app/api/calendar/__tests__/*` | 18 |
| API Tests - Export | `src/app/api/export/**/__tests__/*` | 76 |
| API Tests - Other | Notifications, Onboarding, Cron | 46 |
| E2E Tests | `e2e/*.spec.ts` | 7 test files |

**Missing Test Coverage:**
| Route | Reason |
|-------|--------|
| `/api/export/image` | Uses edge runtime + `ImageResponse` (OG image generation) - requires special test setup |

**Test Configuration:**
- `vitest.config.ts` - Unit/component test config (includes `server-only` alias)
- `playwright.config.ts` - E2E test config
- `tests/setup.ts` - Global test setup with Next.js mocks

**Test Utilities:**
- `tests/mocks/db.ts` - Drizzle database mocks
- `tests/mocks/auth.ts` - NextAuth session mocks
- `tests/mocks/dal.ts` - DAL function mocks
- `tests/mocks/server-only.ts` - Mock for `server-only` package
- `tests/factories/*` - Test data factories (user, weight, injection, daily-log)
- `tests/utils/*` - Custom render, API helpers

**Utility Functions Created:**
- `src/lib/utils/conversions.ts` - Weight/height unit conversions
- `src/lib/utils/calculations.ts` - BMI, stats, progress calculations
- `src/lib/utils/dates.ts` - Date formatting and utilities
- `src/lib/utils/injection-logic.ts` - Injection scheduling, site rotation

**Commands:**
```bash
pnpm test           # Watch mode
pnpm test:run       # Run once
pnpm test:coverage  # With coverage
pnpm test:e2e       # E2E tests (requires running app)
```

**Test Completion Summary (2026-01-01):**

| Category | Status | Notes |
|----------|--------|-------|
| Unit tests | ✅ Complete | 126 tests for utility functions |
| Auth/Proxy tests | ✅ Complete | 52 tests for DAL + proxy |
| API tests - All routes | ✅ Complete | 421 tests (all routes except edge runtime) |
| E2E tests | ✅ Created | 7 test files for critical flows |
| Component tests | ⏭️ Skipped | Forms inline in pages, tested via E2E |
| CI/CD pipeline | ⏳ Pending | GitHub Actions not configured |

**Remaining Work:**

| Priority | Task | Notes |
|----------|------|-------|
| P3 | `/api/export/image` tests | Requires edge runtime test setup (low priority - OG image gen) |
| P3 | CI/CD pipeline | GitHub Actions workflow for automated testing |

> **Note on Component Tests:** Forms are implemented inline within page components (e.g., Log Injection modal in `jabs/page.tsx`) rather than as separate reusable components. This architectural choice means form logic is tested via E2E tests instead of isolated component tests.

### PWA Implementation (2026-01-01)

Progressive Web App configuration using Serwist (recommended by Next.js, successor to next-pwa):

**Files:**
| File | Purpose |
|------|---------|
| `next.config.ts` | Serwist wrapper with security headers |
| `tsconfig.json` | Added `webworker` lib and `@serwist/next/typings` |
| `src/app/manifest.ts` | TypeScript PWA manifest |
| `src/app/sw.ts` | Service worker with caching strategies |
| `src/app/~offline/page.tsx` | Offline fallback page |
| `public/icons/` | PWA icons (192, 384, 512, maskable) |
| `scripts/generate-icons.mjs` | Icon generation script (uses Sharp) |

**Build Configuration:**
- Uses `--webpack` flag for builds (Serwist doesn't support Turbopack yet)
- `pnpm build` - Production build with service worker
- `pnpm build:turbo` - Turbopack build (no PWA)
- `pnpm generate:icons` - Regenerate placeholder icons

**Caching Strategy (via `defaultCache`):**
| Route Type | Strategy |
|------------|----------|
| Static assets | Cache First |
| HTML pages | Stale While Revalidate |
| API GET | Network First (Cache Fallback) |
| API mutations | Network Only |

**Offline Capabilities:**
- Cached pages viewable offline
- Offline fallback page shown for uncached routes
- Form submissions require connection

**Testing PWA:**
```bash
pnpm build && pnpm start  # PWA only works in production
# Open Chrome DevTools > Application > Service Workers
# Use Lighthouse PWA audit
```

---

## Agent Instructions

When working on this project:

1. **Read specs first** - Always check the spec before implementing
2. **Update as you go** - Mark progress in specs after completing work
3. **Test early** - Write tests for utilities before components
4. **Mobile-first** - Test responsive design frequently
5. **Stay focused** - One feature at a time, use `/clear` between features
