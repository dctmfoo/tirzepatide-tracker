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
- Dark theme by default (`bg-[#0a0a0a]`)
- Mobile-first responsive design
- Use CSS variables for theme colors

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
| DB Schema | `lib/db/schema.ts` |
| Auth config | `lib/auth/config.ts` |
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

### API Route Handler
```typescript
// app/api/example/route.ts
import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth/config';
import { db } from '@/lib/db';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  // ... implementation
}
```

### Server Component with Data
```typescript
// app/(app)/example/page.tsx
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';

export default async function ExamplePage() {
  const session = await getServerSession();
  if (!session) redirect('/login');

  const data = await db.query.example.findMany();
  return <ExampleComponent data={data} />;
}
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
- [~] Database schema
- [ ] Authentication
- [ ] API routes
- [ ] Summary page
- [ ] Results page (reference UI)
- [ ] Jabs page
- [ ] Calendar page
- [ ] Settings page
- [ ] Daily log forms
- [ ] PWA configuration
- [ ] Email notifications
- [ ] Data export
- [ ] Testing (unit)
- [ ] Testing (E2E)
- [ ] Production deployment

---

## Agent Instructions

When working on this project:

1. **Read specs first** - Always check the spec before implementing
2. **Update as you go** - Mark progress in specs after completing work
3. **Test early** - Write tests for utilities before components
4. **Mobile-first** - Test responsive design frequently
5. **Stay focused** - One feature at a time, use `/clear` between features
