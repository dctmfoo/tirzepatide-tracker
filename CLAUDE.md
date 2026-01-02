# Mounjaro Tracker - Claude Code Context

## Project Summary

Progressive Web App for monitoring Mounjaro (Tirzepatide) treatment. Tracks weight, injections, side effects, daily logs, and lifestyle factors.

**Stack:** Next.js 14+ (App Router), TypeScript, Tailwind CSS, Drizzle ORM, PostgreSQL, Serwist PWA, Recharts, NextAuth.js, Resend

**Production:** https://mj-tracker-xi.vercel.app

---

## UI Modernization Patterns (Applied to Summary, Results, Jabs)

When updating other pages, follow these patterns:

### 1. Responsive Viewport Sizing (CRITICAL)
```tsx
// Use svh (Small Viewport Height) for stable mobile sizing
<div className="flex min-h-[calc(100svh-140px)] flex-col gap-4 overflow-x-hidden p-4">
```
- `100svh` prevents layout shifts when mobile browser UI hides/shows
- `140px` accounts for header (~56px) + bottom nav (~84px)
- Always add `overflow-x-hidden` to prevent horizontal scroll

### 2. Lucide Icons (No Emojis)
```tsx
import { Syringe, Scale, Calendar, TrendingUp } from 'lucide-react';

// Icon in colored container
<div className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-500/15">
  <Syringe className="h-5 w-5 text-violet-500" />
</div>
```

### 3. Stat Cards with Icons
Reference: `src/components/summary/SummaryStatCard.tsx`
- Icon + iconColor prop
- Decorative circle in corner
- Value with optional unit
- Subtext for context

### 4. Hero Cards with Gradients
```tsx
// Status-based gradient backgrounds
<div className="overflow-hidden rounded-xl border border-success/20 bg-gradient-to-br from-success/15 to-success/5 p-4">
```

### 5. shadcn Components
- Use `Button` for all CTAs (not custom styled links)
- Use `Section` wrapper for content groupings
- Use `ProgressRing` from `@/components/ui` for circular progress

### 6. Color Coding by Status
```tsx
const colors = {
  success: 'bg-success/15 text-success',    // On track, completed
  warning: 'bg-warning/15 text-warning',    // Due soon, caution
  destructive: 'bg-destructive/15 text-destructive', // Overdue, error
  primary: 'bg-primary/15 text-primary',    // Default accent
  violet: 'bg-violet-500/15 text-violet-500', // Injections
  blue: 'bg-blue-500/15 text-blue-500',     // Logs
  amber: 'bg-amber-500/15 text-amber-500',  // Dose/medication
};
```

### 7. Skeleton Loaders
Match the same `min-h-[calc(100svh-140px)]` and structure as content.

**Reference Files:**
- `src/components/summary/` - SummaryStatCard, NextInjectionCard patterns
- `src/components/results/` - HeroStat, ResultsStatCard patterns
- `src/components/jabs/` - JabsStatCard, InjectionHistoryItem patterns

---

## Quick Reference

| Resource | Location |
|----------|----------|
| Main spec | `docs/mounjaro-tracker-spec-v2.md` |
| Testing spec | `docs/testing-spec.md` |
| DB Schema | `src/lib/db/schema.ts` |
| Auth config | `src/lib/auth/config.ts` |
| DAL | `src/lib/dal.ts` |
| Proxy | `src/proxy.ts` |

---

## Commands

```bash
# Development
pnpm dev                # Start dev server (Turbopack)
pnpm build              # Production build
pnpm lint               # Run ESLint

# Database
pnpm db:generate        # Generate migrations
pnpm db:push            # Push schema to database
pnpm db:studio          # Open Drizzle Studio

# Testing
pnpm test               # Vitest watch mode
pnpm test:run           # Run tests once
pnpm test:e2e           # Playwright E2E tests
```

---

## Directory Structure

```
src/
  app/
    (auth)/             # Login, register, password reset
    (app)/              # Main app pages (summary, results, jabs, calendar, settings, log)
    (onboarding)/       # Onboarding flow
    api/                # API routes
    ~offline/           # PWA offline fallback
  components/           # React components
  lib/
    db/                 # Drizzle ORM setup
    auth/               # NextAuth config
    dal.ts              # Data Access Layer
    email/              # Resend templates
    push/               # Push notification utilities
    utils/              # Helper functions
    data/               # Server-side data fetching
tests/                  # Test utilities and mocks
e2e/                    # Playwright E2E tests
docs/                   # Specifications
```

---

## Code Style

- **TypeScript:** Strict mode, prefer `type` over `interface`, use Zod for validation
- **React:** Server Components by default, `'use client'` only when needed
- **Styling:** Tailwind CSS, dark theme, mobile-first, **use design tokens from globals.css**
- **Database:** Drizzle ORM, UUID primary keys, timestamps on all tables
- **File Naming:** Components PascalCase, utilities camelCase, tests `*.test.ts`

### Design Tokens (MANDATORY)

```tsx
// Correct - use tokens
<div className="bg-background-card text-foreground">
<button className="bg-accent-primary text-background">

// Wrong - never hardcode
<div className="bg-[#1a2a3a] text-white">
```

Available: `bg-background`, `bg-background-card`, `text-foreground`, `text-foreground-muted`, `bg-accent-primary`, `bg-accent-secondary`, `bg-error`, `bg-success`, `bg-warning`, `bg-dose-*`

---

## Authentication Pattern (CVE-2025-29927 Compliant)

```
Request → Proxy (optimistic) → Layout (DAL) → API Route (auth check)
```

| Layer | File | Purpose |
|-------|------|---------|
| Proxy | `src/proxy.ts` | Optimistic redirects (no DB) |
| DAL | `src/lib/dal.ts` | Session verification at data access |
| API Routes | `src/app/api/*/route.ts` | Auth checks before mutations |

### DAL Functions

```typescript
import {
  verifySession,            // Returns session or redirects to /login
  getSession,               // Returns session or null
  verifySessionWithProfile, // Returns session+profile or redirects
  getUserPreferences,       // Returns preferences with defaults
} from '@/lib/dal';
```

### Layout Example

```typescript
// app/(app)/layout.tsx
import { verifySessionWithProfile } from '@/lib/dal';

export default async function AppLayout({ children }) {
  await verifySessionWithProfile();
  return <>{children}</>;
}
```

### API Route Example

```typescript
import { auth } from '@/lib/auth';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  // ...
}
```

---

## Warnings & Gotchas

- **PWA disabled in dev** - Serwist only works in production builds
- **Async Server Components** - Vitest can't test async RSC, use E2E
- **Weight units** - Always store in kg, convert for display
- **Injection dates** - Use timestamps, not just dates
- **Build flag** - Use `--webpack` for builds (Serwist doesn't support Turbopack)

---

## Atomic Commits (MANDATORY)

```bash
git add -A && git commit -m "type: short description"

# Types: feat, fix, docs, refactor, test, chore
```

**When to commit:** After completing schema, API route, component, tests, or docs.
**Never commit:** Half-finished features, code that doesn't lint.

---

## Living Documentation (CRITICAL)

**After completing any feature, update the specs:**

1. `docs/mounjaro-tracker-spec-v2.md` - Add implementation notes, mark items complete
2. `docs/testing-spec.md` - Update with test file paths, add new test cases

### Progress Format

```markdown
> **Implementation Note (YYYY-MM-DD):**
> Implemented in `path/to/file.ts`. Used X approach because Y.
```

---

## Current Status

| Feature | Status |
|---------|--------|
| Database schema | ✅ 14 tables |
| Authentication | ✅ NextAuth v5, layered security |
| API routes | ✅ 29 endpoints |
| All pages | ✅ Summary, Results, Jabs, Calendar, Settings, Log |
| PWA | ✅ Serwist, push notifications |
| Email notifications | ✅ Resend integration |
| Testing | ✅ 599 unit tests, 7 E2E test files |
| Deployment | ✅ Vercel with cron |

See `docs/mounjaro-tracker-spec-v2.md` for detailed implementation notes.

---

## Agent Instructions

1. **Read specs first** - Always check the spec before implementing
2. **Update as you go** - Mark progress in specs after completing work
3. **Test early** - Write tests alongside code
4. **Mobile-first** - Test responsive design frequently
5. **Stay focused** - One feature at a time
