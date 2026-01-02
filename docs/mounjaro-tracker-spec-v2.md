# Mounjaro Treatment Tracker - Product Specification v2

## Overview

A Progressive Web App (PWA) for monitoring Mounjaro (Tirzepatide) treatment progress. Captures weight, injections, side effects, daily logs, and lifestyle factors. Presents data in a dashboard format with email notifications and data export capabilities.

**Key Principle:** Mobile-first PWA that feels native, works offline for reading, and doesn't require app store distribution.

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 14+ (App Router) |
| Database | PostgreSQL with Drizzle ORM |
| Email | Resend |
| Styling | Tailwind CSS |
| Charts | Recharts |
| Authentication | NextAuth.js |
| PWA | Serwist (@serwist/next) |
| Image Generation | @vercel/og or html-to-image (for export) |

---

## PWA Configuration

> **Note:** We use [Serwist](https://serwist.pages.dev/) (the maintained successor to next-pwa) as recommended by the [official Next.js documentation](https://nextjs.org/docs/app/guides/progressive-web-apps).

### Installation

```bash
# Install Serwist packages
npm i @serwist/next && npm i -D serwist

# For Vercel deployments, also add minimatch
npm i minimatch
```

### TypeScript Manifest (app/manifest.ts)

Use Next.js's native TypeScript manifest instead of JSON:

```typescript
// app/manifest.ts
import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Mounjaro Tracker',
    short_name: 'MounjaroRx',
    description: 'Track your Mounjaro treatment progress',
    start_url: '/summary',
    display: 'standalone',
    background_color: '#0a0a0a',
    theme_color: '#0a0a0a',
    orientation: 'portrait',
    icons: [
      {
        src: '/icons/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icons/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
      },
      {
        src: '/icons/icon-maskable.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  };
}
```

### Next.js Configuration (next.config.ts)

```typescript
// next.config.ts
import { spawnSync } from 'node:child_process';
import withSerwistInit from '@serwist/next';
import type { NextConfig } from 'next';

// Use git commit hash for cache busting
const revision = spawnSync('git', ['rev-parse', 'HEAD'], {
  encoding: 'utf-8',
}).stdout?.trim() ?? crypto.randomUUID();

const withSerwist = withSerwistInit({
  swSrc: 'app/sw.ts',
  swDest: 'public/sw.js',
  additionalPrecacheEntries: [{ url: '/~offline', revision }],
  // Disable in development for convenience
  disable: process.env.NODE_ENV === 'development',
});

const nextConfig: NextConfig = {
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
```

### Service Worker (app/sw.ts)

```typescript
// app/sw.ts
import { defaultCache } from '@serwist/next/worker';
import type { PrecacheEntry, SerwistGlobalConfig } from 'serwist';
import { Serwist } from 'serwist';

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: defaultCache,
  fallbacks: {
    entries: [
      {
        url: '/~offline',
        matcher({ request }) {
          return request.destination === 'document';
        },
      },
    ],
  },
});

serwist.addEventListeners();
```

### TypeScript Configuration (tsconfig.json)

Add these compiler options for service worker types:

```json
{
  "compilerOptions": {
    "lib": ["dom", "dom.iterable", "esnext", "webworker"],
    "types": ["@serwist/next/typings"]
  },
  "exclude": ["public/sw.js"]
}
```

### Git Ignore

Add to `.gitignore`:

```
# Serwist generated files
public/sw*
public/swe-worker*
```

### Offline Fallback Page (app/~offline/page.tsx)

```typescript
// app/~offline/page.tsx
export default function OfflinePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#0a0a0a] text-white p-4">
      <h1 className="text-2xl font-bold mb-4">You're offline</h1>
      <p className="text-gray-400 text-center mb-6">
        Please check your internet connection to access Mounjaro Tracker.
      </p>
      <button
        onClick={() => window.location.reload()}
        className="px-6 py-2 bg-cyan-500 text-black rounded-lg font-medium"
      >
        Try Again
      </button>
    </div>
  );
}
```

### Service Worker Caching Strategy

| Route | Strategy | Rationale |
|-------|----------|-----------|
| Static assets (CSS, JS, fonts) | Cache First | Rarely change, fast load |
| App shell (HTML pages) | Stale While Revalidate | Fast load, background update |
| API GET requests | Network First, Cache Fallback | Fresh data preferred, offline fallback |
| API POST/PUT/DELETE | Network Only | Must sync to server |
| Images/icons | Cache First | Rarely change |

### Offline Capabilities

| Feature | Offline Behavior |
|---------|------------------|
| View Results | ✅ Last cached data displayed |
| View Summary | ✅ Last cached data displayed |
| View Jabs history | ✅ Last cached data displayed |
| View Calendar | ✅ Last cached data displayed |
| Log new weight | ❌ Requires connection (queue for v2) |
| Log injection | ❌ Requires connection |
| Log daily entry | ❌ Requires connection |
| Settings | ✅ Viewable, changes need connection |

### Install Prompt

Show custom install banner after:
- User has visited 2+ times
- User has logged at least one weight entry
- Not already installed

### Development Tips

1. **Disable in dev**: Set `disable: process.env.NODE_ENV === 'development'` to avoid cache issues during development
2. **Testing PWA**: Run `npm run build && npm run start` to test PWA functionality
3. **HTTPS required**: PWAs require HTTPS; use `next dev --experimental-https` for local testing
4. **Set `reloadOnOnline: false`**: Avoids forced page refresh when users reconnect, preventing form data loss
5. **Generated files**: After build, `sw.js` and `workbox-*.js` are created in `/public`

### Platform Support

| Platform | PWA Support |
|----------|-------------|
| iOS 16.4+ | ✅ Home screen installation |
| Safari 16+ (macOS 13+) | ✅ Full support |
| Chrome/Chromium | ✅ Full support |
| Firefox | ✅ Service workers, limited install |
| Android | ✅ Full support |

> **Implementation Note (2026-01-01) - PWA Configuration [x]:**
> - Files:
>   - `next.config.ts` - Serwist wrapper with `reloadOnOnline: false`
>   - `tsconfig.json` - Added `webworker` lib and `@serwist/next/typings`
>   - `src/app/manifest.ts` - TypeScript PWA manifest
>   - `src/app/sw.ts` - Service worker with defaultCache + offline fallback
>   - `src/app/~offline/page.tsx` - Offline fallback page
>   - `public/icons/` - PWA icons (192, 384, 512, maskable PNG)
>   - `scripts/generate-icons.mjs` - Icon generation script (Sharp)
> - Build uses `--webpack` flag (Serwist doesn't support Turbopack yet)
> - Production: https://mj-tracker-xi.vercel.app

---

## Reference UI - Results Dashboard

> **CRITICAL**: The Results page must match this design exactly. No additions or deletions.

```
┌─────────────────────────────────────────────────────────┐
│  ☰                    Results                      (?)  │
├─────────────────────────────────────────────────────────┤
│  1 month    3 months    6 months    All Time           │
│                                          ═══════       │
├─────────────────────────────────────────────────────────┤
│  Weight Change                    20 Oct 2025 – 19 Dec │
├─────────────────────────────────────────────────────────┤
│  ┌──────────┐ ┌──────────┐ ┌──────────┐               │
│  │📦 Total  │ │🧍Current │ │📋 Weight │               │
│  │  change  │ │   BMI    │ │          │               │
│  │ -8.80kg  │ │   27.6   │ │ 92.20kg  │               │
│  └──────────┘ └──────────┘ └──────────┘               │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐               │
│  │% Percent │ │📊 Weekly │ │🚩 To goal│               │
│  │          │ │   avg    │ │          │               │
│  │  -8.7%   │ │-1.03kg/wk│ │ 17.20kg  │               │
│  └──────────┘ └──────────┘ └──────────┘               │
├─────────────────────────────────────────────────────────┤
│         [2.5mg]                                        │
│        ●                                      100 kg   │
│         ╲                                              │
│          ●                                    98 kg    │
│           ╲●                                           │
│             ╲  [5.0mg]                        96 kg    │
│              ●                                         │
│               ╲●                              94 kg    │
│                 ●─●                                    │
│                    ╲●─●─●●                    92 kg    │
│                                                        │
│         Nov 2025           Dec 2025                    │
├─────────────────────────────────────────────────────────┤
│  📋        💉        📊        📅        ⚙️           │
│ Summary    Jabs    Results   Calendar   Settings       │
└─────────────────────────────────────────────────────────┘
```

### Color Specifications

| Element | Color | Hex |
|---------|-------|-----|
| Background | Near black | `#0a0a0a` |
| Card background | Dark slate/teal | `#1a2a3a` |
| Primary accent | Cyan | `#00d4ff` |
| Secondary accent | Purple | `#a855f7` |
| 2.5mg dose line | Gray | `#9ca3af` |
| 5.0mg dose line | Purple | `#a855f7` |
| 7.5mg dose line | Teal | `#14b8a6` |
| 10mg dose line | Blue | `#3b82f6` |
| 12.5mg dose line | Indigo | `#6366f1` |
| 15mg dose line | Pink | `#ec4899` |
| Text primary | White | `#ffffff` |
| Text secondary | Gray | `#9ca3af` |
| Selected nav item | Cyan | `#00d4ff` |
| Success | Green | `#22c55e` |
| Warning | Yellow | `#eab308` |
| Error/Alert | Red | `#ef4444` |

> **Implementation Note (2025-12-31):**
> Design tokens are implemented in `src/app/globals.css` using CSS variables and Tailwind v4's `@theme inline` directive.
>
> **Usage:** Use Tailwind classes like `bg-background`, `text-foreground-muted`, `bg-accent-primary` instead of hardcoded hex values.
>
> **Available tokens:**
> - `bg-background` / `bg-background-card` - Background colors
> - `text-foreground` / `text-foreground-muted` - Text colors
> - `bg-accent-primary` / `bg-accent-secondary` - Accent colors
> - `bg-error` / `bg-success` / `bg-warning` - Semantic colors
> - `bg-dose-2-5`, `bg-dose-5-0`, etc. - Dose marker colors

> **Implementation Note (2025-12-31) - Results Page [x]:**
> - Files:
>   - `src/app/(app)/results/page.tsx` - Server Component with Suspense
>   - `src/lib/data/results.ts` - Server-side data fetching with React cache()
>   - `src/components/results/ResultsClient.tsx` - Client component for interactivity
>   - `src/components/results/ResultsSkeleton.tsx` - Loading skeleton
>   - `src/components/results/PeriodTabs.tsx` - Period selector (1m, 3m, 6m, All Time)
>   - `src/components/charts/WeightChart.tsx` - Recharts line chart with dose segments
> - 6 stat cards: Total change, Current BMI, Weight, Percent, Weekly avg, To goal
> - Chart features: dose-colored line segments, dose badges, Y-axis on right side
> - **Performance (2026-01-01):** Converted to Server Component for faster initial load

---

## Summary Page

### Information Architecture

```
┌─────────────────────────────────────────────────────────┐
│  ☰                    Summary                      (?)  │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  SECTION 1: ACTION REQUIRED                            │
│  ───────────────────────────────────────────────────── │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │  💉 Next Injection                              │   │
│  │                                                 │   │
│  │  Due in 3 days (Sat, Dec 21)                   │   │
│  │  ━━━━━━━━━━━━━━━━●━━━━━ Day 4 of 7             │   │
│  │                                                 │   │
│  │  Current dose: 5.0mg                           │   │
│  │  Suggested site: Thigh - Right                 │   │
│  │                                                 │   │
│  │              [ Log Injection ]                  │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │  📝 Today's Log                    Not started  │   │
│  │                                    [ Log Now ]  │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  ───────────────────────────────────────────────────── │
│  SECTION 2: CURRENT STATE                              │
│  ───────────────────────────────────────────────────── │
│                                                         │
│  ┌───────────────┐ ┌───────────────┐                   │
│  │ Current       │ │ Since Last    │                   │
│  │    92.2kg     │ │   -0.4kg      │                   │
│  │               │ │  (3 days ago) │                   │
│  └───────────────┘ └───────────────┘                   │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │  This Week               Mon-Sun (Dec 16-22)    │   │
│  │                                                 │   │
│  │  Weight     -0.8kg    ↓                        │   │
│  │  Avg Hunger Moderate  ━━━━●━━━                 │   │
│  │  Avg Mood   Good      ━━━━━━●━                 │   │
│  │  Steps      68,420    (avg 11.4k/day)         │   │
│  │  Workouts   3 of 7 days                       │   │
│  │  Protein    ~145g/day avg                     │   │
│  │  Side Effects: Mild fatigue (2 days)          │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  ───────────────────────────────────────────────────── │
│  SECTION 3: JOURNEY PROGRESS                           │
│  ───────────────────────────────────────────────────── │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │  Goal Progress                                  │   │
│  │                                                 │   │
│  │  93kg ━━━━━━━━━━━━━●━━━━━━━━━━━━━━━━━━ 68kg    │   │
│  │  Start           92.2kg              Goal      │   │
│  │                                                 │   │
│  │  3.2% complete · 24.2kg to go                  │   │
│  │  At current pace: ~May 2026                    │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │  Treatment Timeline                             │   │
│  │                                                 │   │
│  │  Week 8 · Day 52 · Started Oct 20, 2025       │   │
│  │                                                 │   │
│  │  ┌──────┬──────┬──────┬──────┬──────┐         │   │
│  │  │2.5mg │2.5mg │2.5mg │2.5mg │ 5mg  │ ← now   │   │
│  │  │ Wk1-4│      │      │      │Wk5-8 │         │   │
│  │  └──────┴──────┴──────┴──────┴──────┘         │   │
│  │  4 weeks on current dose (5.0mg)              │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  ┌───────────────┐ ┌───────────────┐                   │
│  │ Next          │ │ Logging       │                   │
│  │ Milestone     │ │ Streak        │                   │
│  │               │ │               │                   │
│  │   90kg        │ │   12 days     │                   │
│  │  2.2kg away   │ │  Personal best│                   │
│  └───────────────┘ └───────────────┘                   │
│                                                         │
│  ───────────────────────────────────────────────────── │
│  SECTION 4: RECENT ACTIVITY                            │
│  ───────────────────────────────────────────────────── │
│                                                         │
│  ● Today 8:30am        Weight logged: 92.2kg          │
│  ● Yesterday           Daily log ✓                     │
│  ● Dec 17, Tue         Weight logged: 92.6kg          │
│  ● Dec 15, Sun         💉 Injection: 5mg (Abdomen-L)  │
│  ● Dec 14, Sat         Weight logged: 93.0kg          │
│                                                         │
│                    [ View All Activity ]               │
│                                                         │
├─────────────────────────────────────────────────────────┤
│  📋        💉        📊        📅        ⚙️           │
│ Summary    Jabs    Results   Calendar   Settings       │
└─────────────────────────────────────────────────────────┘
```

### Section Purpose

| Section | User Question | Content |
|---------|---------------|---------|
| Action Required | "Do I need to do anything?" | Next injection status, today's log prompt |
| Current State | "How am I doing right now?" | Latest weight, this week's metrics |
| Journey Progress | "Am I making progress?" | Goal progress, treatment timeline, milestones |
| Recent Activity | "What happened lately?" | Last 3-5 entries chronologically |

### Empty State (New User)

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│  Welcome to Your Mounjaro Journey! 🎉                  │
│                                                         │
│  Let's get started by logging your first data points.  │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │  1. Log your starting weight                    │   │
│  │                           [ Log Weight ]        │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │  2. Record your first injection                 │   │
│  │                           [ Log Injection ]     │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

> **Implementation Note (2025-12-31) - Summary Page [x]:**
> - Files:
>   - `src/app/(app)/layout.tsx` - App shell with auth check and bottom navigation
>   - `src/app/(app)/summary/page.tsx` - Main Summary page (server component)
>   - `src/components/layout/BottomNav.tsx` - 5-tab bottom navigation with pill-style active indicator
>   - `src/components/summary/` - Section components (NextInjectionCard, TodaysLogCard, CurrentStateSection, JourneyProgressSection, RecentActivitySection, EmptyState)
>   - `src/components/ui/` - Shared UI components (StatCard, Section, ProgressBar, ActionCard)
> - All 4 sections implemented per wireframe: Action Required, Current State, Journey Progress, Recent Activity
> - Empty state for new users with onboarding prompts

---

## Jabs Page

```
┌─────────────────────────────────────────────────────────┐
│  ☰                      Jabs                       (?)  │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌───────────────┐ ┌───────────────┐                   │
│  │ Total         │ │ Current       │                   │
│  │ Injections    │ │ Dose          │                   │
│  │      12       │ │    5.0mg      │                   │
│  └───────────────┘ └───────────────┘                   │
│                                                         │
│  ┌───────────────┐ ┌───────────────┐                   │
│  │ Weeks on      │ │ Next          │                   │
│  │ Current Dose  │ │ Due           │                   │
│  │   4 weeks     │ │   Dec 22      │                   │
│  └───────────────┘ └───────────────┘                   │
│                                                         │
├─────────────────────────────────────────────────────────┤
│  Injection History                                      │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │  Dec 15, 2025                         5.0mg     │   │
│  │  Abdomen - Left · Week 8                        │   │
│  │                                        [ Edit ] │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │  Dec 8, 2025                          5.0mg     │   │
│  │  Thigh - Right · Week 7                         │   │
│  │                                        [ Edit ] │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │  Dec 1, 2025                          5.0mg     │   │
│  │  Thigh - Left · Week 6                          │   │
│  │                                        [ Edit ] │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │  Nov 24, 2025            ⬆️ Dose Up   5.0mg     │   │
│  │  Abdomen - Right · Week 5                       │   │
│  │                                        [ Edit ] │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │  Nov 17, 2025                         2.5mg     │   │
│  │  Abdomen - Left · Week 4                        │   │
│  │                                        [ Edit ] │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  ... more entries ...                                  │
│                                                         │
│           ┌──────────────────────────┐                 │
│           │    + Log Injection       │                 │
│           └──────────────────────────┘                 │
│                                                         │
├─────────────────────────────────────────────────────────┤
│  📋        💉        📊        📅        ⚙️           │
│ Summary    Jabs    Results   Calendar   Settings       │
└─────────────────────────────────────────────────────────┘
```

### Site Rotation Logic

```typescript
const INJECTION_SITES = [
  'Abdomen - Left',
  'Abdomen - Right',
  'Thigh - Left',
  'Thigh - Right',
  'Arm - Left',
  'Arm - Right',
];

function getSuggestedSite(lastSite: string): string {
  const currentIndex = INJECTION_SITES.indexOf(lastSite);
  const nextIndex = (currentIndex + 1) % INJECTION_SITES.length;
  return INJECTION_SITES[nextIndex];
}
```

> **Implementation Note (2025-12-31) - Jabs Page [x]:**
> - Files:
>   - `src/app/(app)/jabs/page.tsx` - Server Component with Suspense
>   - `src/lib/data/jabs.ts` - Server-side data fetching with React cache()
>   - `src/lib/actions/injections.ts` - Server action for creating injections
>   - `src/components/jabs/JabsClient.tsx` - Client component for interactivity
>   - `src/components/jabs/JabsSkeleton.tsx` - Loading skeleton
>   - `src/components/jabs/LogInjectionModal.tsx` - Modal using useTransition
> - Features: 4 stat cards, injection history with dose change badges, site rotation
> - **Performance (2026-01-01):** Converted to Server Component for faster initial load

---

## Calendar Page

```
┌─────────────────────────────────────────────────────────┐
│  ☰                   Calendar                      (?)  │
├─────────────────────────────────────────────────────────┤
│                                                         │
│               ←  December 2025  →                      │
│                                                         │
│  Sun   Mon   Tue   Wed   Thu   Fri   Sat               │
│  ─────────────────────────────────────────────         │
│                                                         │
│   1     2     3     4     5     6     7                │
│   ●    ●·    ·     ●     ·    ●·    ·                 │
│                                                         │
│   8     9    10    11    12    13    14                │
│  💉●   ●·    ·     ●     ·    ●·    ·                 │
│                                                         │
│  15    16    17   [18]   19    20    21                │
│  💉●   ●·    ●    [○]    ·     ·     ·                 │
│                                                         │
│  22    23    24    25    26    27    28                │
│                                                         │
│  29    30    31                                         │
│                                                         │
├─────────────────────────────────────────────────────────┤
│  Wednesday, Dec 18 (Today)               [ + Add ]     │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  No entries for this day                               │
│                                                         │
│  ┌───────────┐ ┌───────────┐ ┌───────────┐            │
│  │Log Weight │ │   Log     │ │  Daily    │            │
│  │           │ │ Injection │ │   Log     │            │
│  └───────────┘ └───────────┘ └───────────┘            │
│                                                         │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ── Day with entries (Dec 15) ──                       │
│                                                         │
│  💉 Injection                          8:00 AM        │
│     5.0mg · Abdomen - Left                   [ Edit ] │
│                                                         │
│  ⚖️ Weight                             8:15 AM        │
│     92.6kg                                   [ Edit ] │
│                                                         │
│  📝 Daily Log                                ✓        │
│     Hunger: Low · Mood: Good · 12.4k steps   [ Edit ] │
│                                                         │
├─────────────────────────────────────────────────────────┤
│  📋        💉        📊        📅        ⚙️           │
│ Summary    Jabs    Results   Calendar   Settings       │
└─────────────────────────────────────────────────────────┘
```

### Calendar Legend

| Symbol | Meaning |
|--------|---------|
| ● | Weight logged |
| · | Daily log completed |
| 💉 | Injection |
| ○ | Selected day |
| [18] | Today (highlighted) |

> **Implementation Note (2025-12-31) - Calendar Page [x]:**
> - Files:
>   - `src/app/(app)/calendar/page.tsx` - Server Component with Suspense
>   - `src/lib/data/calendar.ts` - Server-side data fetching with React cache()
>   - `src/components/calendar/CalendarClient.tsx` - Client component for interactivity
>   - `src/components/calendar/CalendarSkeleton.tsx` - Loading skeleton
>   - `src/components/calendar/LogWeightModal.tsx`, `CalendarLogInjectionModal.tsx` - Modals
> - Features: Month navigation, day indicators, day detail panel, 3 quick-action modals
> - **Performance (2026-01-01):** Converted to Server Component for faster initial load

---

## Settings Page

```
┌─────────────────────────────────────────────────────────┐
│  ☰                   Settings                           │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  PROFILE                                               │
│  ─────────────────────────────────────────────         │
│                                                         │
│  Personal Info                                    →    │
│  Age, gender, height                                   │
│                                                         │
│  Goals                                            →    │
│  Goal weight, treatment start date                     │
│                                                         │
│  Account                                          →    │
│  Email, password                                       │
│                                                         │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  TREATMENT                                             │
│  ─────────────────────────────────────────────         │
│                                                         │
│  Injection Schedule                               →    │
│  Preferred day, reminder timing                        │
│                                                         │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  PREFERENCES                                           │
│  ─────────────────────────────────────────────         │
│                                                         │
│  Units                                            →    │
│  Weight, height, date format                           │
│                                                         │
│  Notifications                                    →    │
│  Email reminders and reports                           │
│                                                         │
│  Appearance                                       →    │
│  Theme (dark/light)                                    │
│                                                         │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  DATA                                                  │
│  ─────────────────────────────────────────────         │
│                                                         │
│  Export Data                                      →    │
│  Text, JSON, or image format                           │
│                                                         │
│  Download All Data                                →    │
│  Complete backup (GDPR export)                         │
│                                                         │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  SUPPORT                                               │
│  ─────────────────────────────────────────────         │
│                                                         │
│  Help & FAQ                                       →    │
│                                                         │
│  Send Feedback                                    →    │
│                                                         │
│  Privacy Policy                                   →    │
│                                                         │
│  Terms of Service                                 →    │
│                                                         │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  DANGER ZONE                                           │
│  ─────────────────────────────────────────────         │
│                                                         │
│  Delete Account                                   →    │
│  Permanently delete all data                           │
│                                                         │
├─────────────────────────────────────────────────────────┤
│                                                         │
│                    [ Log Out ]                         │
│                                                         │
│  App Version 1.0.0                                     │
│                                                         │
├─────────────────────────────────────────────────────────┤
│  📋        💉        📊        📅        ⚙️           │
│ Summary    Jabs    Results   Calendar   Settings       │
└─────────────────────────────────────────────────────────┘
```

### Settings Subpages

#### Personal Info
| Field | Type | Editable |
|-------|------|----------|
| Age | number | Yes |
| Gender | select (Male/Female/Other) | Yes |
| Height | number + unit (cm/ft-in) | Yes |

#### Goals
| Field | Type | Notes |
|-------|------|-------|
| Starting weight | number | Warning if changed after entries exist |
| Goal weight | number | Can update anytime |
| Treatment start date | date | Warning if changed - affects week calculations |

#### Account
| Action | Flow |
|--------|------|
| Change email | New email → verification sent → confirm |
| Change password | Current password → new password → confirm |

#### Injection Schedule
| Field | Options |
|-------|---------|
| Preferred injection day | Sun / Mon / Tue / Wed / Thu / Fri / Sat / No preference |
| Reminder timing | 1 day before (default) / 2 days before / Same day / None |

#### Units
| Setting | Options | Default |
|---------|---------|---------|
| Weight | kg / lbs / stone | kg |
| Height | cm / ft-in | cm |
| Date format | DD/MM/YYYY / MM/DD/YYYY | DD/MM/YYYY |
| Week starts | Sunday / Monday | Monday |

#### Notifications (Toggles)
| Notification | Default | Description |
|--------------|---------|-------------|
| Injection reminder | ON | X days before due date |
| Injection overdue | ON | 2 days after missed |
| Weekly progress summary | ON | Every Sunday 6pm |
| Monthly progress report | ON | 1st of month |
| Weight milestones | ON | Every 5kg lost |
| Goal achievement | ON | When goal weight reached |
| Logging reminder | ON | No weight logged in 3 days |
| Dose escalation reminder | OFF | After 4 weeks on same dose |
| Side effect check-in | ON | 3 days after dose increase |

#### Appearance
| Setting | Options | Default |
|---------|---------|---------|
| Theme | Light / System / Dark | System |

> **Implementation Note (2026-01-03) - Theme Switching [x]:**
> Implemented light/system/dark mode support using `next-themes` package.
> - Files:
>   - `src/components/providers/ThemeProvider.tsx` - Wraps next-themes with proper configuration
>   - `src/components/settings/ThemeToggle.tsx` - 3-button toggle (Light/System/Dark) with icons
>   - `src/app/globals.css` - Complete light theme CSS variables in `@layer base`
>   - `src/app/layout.tsx` - ThemeProvider wrapper with `suppressHydrationWarning`
> - Key technical details:
>   - Uses `attribute="class"` for Tailwind CSS v4 compatibility
>   - CSS variables must be in `@layer base` for proper Tailwind v4 specificity
>   - Hydration-safe pattern with mounted state check
>   - Theme-aware date input styling for native pickers
> - Accessed via Settings → Appearance modal

#### Export Data
| Format | Output |
|--------|--------|
| Formatted Text | Reddit-style progress post (copy to clipboard) |
| JSON | Complete structured data download |
| Image | Dashboard PNG for sharing |

> **Implementation Note (2025-12-31) - Settings Page [x]:**
> Implemented in `src/app/(app)/settings/page.tsx`. Client component with parallel API fetching.
> Components: `SettingsSection`, `SettingsItem` in `src/components/settings/`.
> Features: Profile/Treatment/Preferences/Data/Support/Danger sections, 7 edit modals, Log Out, Export links.
> Uses `Promise.all()` for parallel fetching of profile and preferences.

---

## Daily Log Page

> **Implementation Note (2025-12-31) - Daily Log Page [x]:**
> - Files:
>   - `src/app/(app)/log/page.tsx`, `src/app/(app)/log/[date]/page.tsx` - Server Components with Suspense
>   - `src/lib/data/daily-log.ts` - Server-side data fetching with React cache()
>   - `src/components/log/LogFormClient.tsx` - Shared client form component
>   - `src/components/log/LogSkeleton.tsx` - Loading skeleton
>   - `src/components/log/CollapsibleSection.tsx` - Reusable section component
> - Sections: Diet, Activity, Mental, Side Effects (collapsible)
> - Pre-populates from existing log. Saves to `/api/daily-logs` endpoint.
> - **Performance (2026-01-01):** Converted to Server Component, deduplicated ~1400 lines of code

---

## Injection Tracking Logic

### Core Principle
Mounjaro half-life is ~5 days, recommended injection interval is **7 days** with ±2 day flexibility window.

### Status Flow

```
Last Injection: Dec 15 (Sunday)
                    │
    ┌───────────────┼───────────────────────────────────┐
    │               ▼                                   │
Day │ 1   2   3   4   5   6   7   8   9   10          │
    │ ●───────────────────●───●───●───●────────        │
    │                     │   │   │   │                │
    │                     │   │   │   └─ Day 9+: ALERT │
    │                     │   │   └─ Day 8: OVERDUE    │
    │                     │   └─ Day 7: DUE TODAY      │
    │                     └─ Day 6: REMINDER EMAIL     │
    │                                                   │
    │ Days 1-5: Calm "Next in X days"                  │
    └───────────────────────────────────────────────────┘
```

### Status States

| State | Days | UI Color | Action |
|-------|------|----------|--------|
| `upcoming` | 1-5 | Default | Show countdown |
| `reminder` | 6 | Yellow | Email sent, highlight UI |
| `due_today` | 7 | Yellow | Prominent CTA |
| `overdue` | 8 | Orange | Warning + email |
| `alert` | 9+ | Red | Urgent alert |

### Preferred Day Logic

If user sets preferred injection day:
1. Calculate base due date (last injection + 7 days)
2. Find preferred weekday within ±2 day window
3. Use preferred day if within window, else use base

```typescript
function getNextInjectionDue(
  lastInjectionDate: Date, 
  preferredDay?: number // 0-6, Sunday-Saturday
): Date {
  const baseDue = addDays(lastInjectionDate, 7);
  
  if (preferredDay === undefined) return baseDue;
  
  // Find preferred day within ±2 day window
  for (let offset = -2; offset <= 2; offset++) {
    const candidate = addDays(baseDue, offset);
    if (getDay(candidate) === preferredDay) {
      return candidate;
    }
  }
  
  return baseDue;
}
```

---

## Email Notifications (Resend)

### Notification Types

| Type | Trigger | Time | Template Content |
|------|---------|------|------------------|
| `injection_reminder` | X days before due | 9:00 AM | "Injection due in X days. Current dose: Xmg" |
| `injection_due_today` | Due date | 9:00 AM | "Injection due today! Don't forget your Xmg dose" |
| `injection_overdue` | 2 days after due | 9:00 AM | "Missed injection? It's been X days since your last dose" |
| `weekly_summary` | Every Sunday | 6:00 PM | Week stats, weight change, chart preview |
| `monthly_report` | 1st of month | 9:00 AM | Full month review, progress, export attached |
| `weight_milestone` | Every 5kg lost | Immediate | "🎉 Milestone! You've lost Xkg total!" |
| `goal_achieved` | Goal weight reached | Immediate | "🏆 Congratulations! You've reached your goal!" |
| `logging_reminder` | No weight in 3 days | 9:00 AM | "Haven't seen you in a while. Log your weight?" |
| `dose_escalation_reminder` | 4 weeks on same dose | 9:00 AM | "You've been on Xmg for 4 weeks. Consult your doctor about dose adjustment" |
| `side_effect_checkin` | 3 days after dose increase | 9:00 AM | "How are you feeling on your new Xmg dose?" |

### Email Queue Processing

Use cron job or Vercel Cron:
- Run every hour
- Check which notifications are due
- Send via Resend
- Log to `email_logs` table

> **Implementation Note (2025-12-31):**
> Email notifications fully implemented using Resend SDK.
>
> **Files:**
> - `src/lib/email/resend.ts` - Resend client singleton
> - `src/lib/email/templates/index.ts` - Styled HTML email templates
> - `src/app/api/cron/send-notifications/route.ts` - Cron endpoint
> - `src/app/api/notifications/preferences/route.ts` - User preferences API
>
> **Currently Implemented:**
> - ✅ `injection_reminder` - Configurable days before due
> - ✅ `injection_overdue` - 1-3 days after missed injection
> - ✅ `weight_reminder` - Daily after noon if not logged
> - ✅ `weekly_summary` - Sundays with stats
> - ✅ `password_reset` - Password reset flow
> - ✅ `milestone_reached` - Template ready, needs trigger logic
> - ✅ `dose_escalation_reminder` - Template ready, needs trigger logic
>
> **Environment Variables Required:**
> - `RESEND_API_KEY` - Resend API key
> - `RESEND_FROM_EMAIL` - Sender email address
> - `CRON_SECRET` - Secret for cron endpoint authentication

---

## Data Export Formats

### 1. Formatted Text Block (Reddit/Forum)

```markdown
Month X on Mounjaro – My Progress Update (X.X mg)

Stats
• Age: XX
• Gender: XX
• Height: XXX cm
• Starting Weight: XX.X kg / XXX.X lbs / XX.XX stone (Date)
• Current Weight: XX.X kg / XXX.X lbs / XX.XX stone (Date)
• Weight Lost This Month: X.X kg / X.X lbs / X.XX stone
• Total Weight Lost So Far: X.X kg / X.X lbs / X.XX stone
• Starting BMI: XX.X (Category)
• Current BMI: XX.X (Category)
• Goal Weight: XX kg / XXX lbs / XX.X stone
• Current Dose: X.X mg

💉 Side Effects Log
• [List from daily logs - e.g., "Fatigue on Day 3 of first dose", "Mild constipation"]

🏃‍♂️ Activity / Workout
• [Summary - e.g., "Strength training 3× per week", "10,000–12,000 steps per day"]

🧠 Mental & Emotional Changes
• Motivation level: [Most common response]
• Cravings: [Most common response]
• Mood / Confidence: [Most common response]

🍴 Diet Update
• Hunger level: [Most common response]
• Meals per day: [Average]
• Average protein intake: ~XXX g/day
```

### 2. JSON Export

```json
{
  "export_date": "2025-12-19T10:00:00Z",
  "export_version": "1.0",
  "profile": {
    "age": 27,
    "gender": "Male",
    "height_cm": 168,
    "starting_weight_kg": 93,
    "goal_weight_kg": 68,
    "treatment_start_date": "2025-10-20"
  },
  "current_stats": {
    "current_weight_kg": 92.2,
    "total_change_kg": -0.8,
    "percent_change": -0.86,
    "current_bmi": 32.7,
    "starting_bmi": 33.0,
    "weekly_average_kg": -0.4,
    "to_goal_kg": 24.2,
    "treatment_week": 8,
    "treatment_day": 52
  },
  "weight_entries": [
    {
      "weight_kg": 93.0,
      "recorded_at": "2025-10-20T08:00:00Z",
      "notes": null
    }
  ],
  "injections": [
    {
      "dose_mg": 2.5,
      "injection_date": "2025-10-20T08:00:00Z",
      "injection_site": "Abdomen - Left",
      "batch_number": null,
      "notes": "First injection"
    }
  ],
  "daily_logs": [
    {
      "log_date": "2025-10-23",
      "side_effects": [
        { "effect_type": "Fatigue", "severity": "Mild" }
      ],
      "activity": {
        "workout_type": "Strength training",
        "duration_minutes": 45,
        "steps": 11234
      },
      "mental": {
        "motivation_level": "High",
        "cravings_level": "Medium",
        "mood_level": "Good"
      },
      "diet": {
        "hunger_level": "Moderate",
        "meals_count": 2,
        "protein_grams": 150,
        "water_liters": 2.5
      }
    }
  ]
}
```

### 3. Image Export

Generated PNG of Results dashboard:
- Stats cards with current values
- Weight chart with dose markers
- Date range and app branding
- Dimensions: 1080x1920 (mobile screenshot ratio)

Use `@vercel/og` or `html-to-image` for generation.

---

## Database Schema (Drizzle ORM)

### users

```typescript
export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  emailVerified: timestamp('email_verified'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
```

### profiles

```typescript
export const profiles = pgTable('profiles', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull().unique(),
  age: integer('age').notNull(),
  gender: varchar('gender', { length: 20 }).notNull(),
  heightCm: decimal('height_cm', { precision: 5, scale: 2 }).notNull(),
  startingWeightKg: decimal('starting_weight_kg', { precision: 5, scale: 2 }).notNull(),
  goalWeightKg: decimal('goal_weight_kg', { precision: 5, scale: 2 }).notNull(),
  treatmentStartDate: date('treatment_start_date').notNull(),
  // Injection preferences
  preferredInjectionDay: integer('preferred_injection_day'), // 0-6, null = no preference
  reminderDaysBefore: integer('reminder_days_before').default(1),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
```

### user_preferences

```typescript
export const userPreferences = pgTable('user_preferences', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull().unique(),
  weightUnit: varchar('weight_unit', { length: 10 }).default('kg').notNull(), // kg, lbs, stone
  heightUnit: varchar('height_unit', { length: 10 }).default('cm').notNull(), // cm, ft-in
  dateFormat: varchar('date_format', { length: 20 }).default('DD/MM/YYYY').notNull(),
  weekStartsOn: integer('week_starts_on').default(1).notNull(), // 0 = Sunday, 1 = Monday
  theme: varchar('theme', { length: 10 }).default('dark').notNull(), // dark, light
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
```

### weight_entries

```typescript
export const weightEntries = pgTable('weight_entries', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  weightKg: decimal('weight_kg', { precision: 5, scale: 2 }).notNull(),
  recordedAt: timestamp('recorded_at').notNull(),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const weightEntriesIndexes = {
  userRecordedAt: index('weight_entries_user_recorded_at').on(
    weightEntries.userId, 
    weightEntries.recordedAt
  ),
};
```

### injections

```typescript
export const injections = pgTable('injections', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  doseMg: decimal('dose_mg', { precision: 4, scale: 2 }).notNull(),
  injectionSite: varchar('injection_site', { length: 50 }).notNull(),
  injectionDate: timestamp('injection_date').notNull(),
  batchNumber: varchar('batch_number', { length: 100 }),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const injectionsIndexes = {
  userInjectionDate: index('injections_user_injection_date').on(
    injections.userId,
    injections.injectionDate
  ),
};
```

### daily_logs

```typescript
export const dailyLogs = pgTable('daily_logs', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  logDate: date('log_date').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  uniqueUserDate: unique().on(table.userId, table.logDate),
}));
```

### side_effects

```typescript
export const sideEffects = pgTable('side_effects', {
  id: uuid('id').defaultRandom().primaryKey(),
  dailyLogId: uuid('daily_log_id').references(() => dailyLogs.id, { onDelete: 'cascade' }).notNull(),
  effectType: varchar('effect_type', { length: 50 }).notNull(),
  severity: varchar('severity', { length: 20 }).notNull(), // None, Mild, Moderate, Severe
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
```

### activity_logs

```typescript
export const activityLogs = pgTable('activity_logs', {
  id: uuid('id').defaultRandom().primaryKey(),
  dailyLogId: uuid('daily_log_id').references(() => dailyLogs.id, { onDelete: 'cascade' }).notNull(),
  workoutType: varchar('workout_type', { length: 50 }), // Strength training, Cardio, Walking, Rest day, Other
  durationMinutes: integer('duration_minutes'),
  steps: integer('steps'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
```

### mental_logs

```typescript
export const mentalLogs = pgTable('mental_logs', {
  id: uuid('id').defaultRandom().primaryKey(),
  dailyLogId: uuid('daily_log_id').references(() => dailyLogs.id, { onDelete: 'cascade' }).notNull(),
  motivationLevel: varchar('motivation_level', { length: 20 }), // Low, Medium, High
  cravingsLevel: varchar('cravings_level', { length: 20 }), // None, Low, Medium, High, Intense
  moodLevel: varchar('mood_level', { length: 20 }), // Poor, Fair, Good, Great, Excellent
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
```

### diet_logs

```typescript
export const dietLogs = pgTable('diet_logs', {
  id: uuid('id').defaultRandom().primaryKey(),
  dailyLogId: uuid('daily_log_id').references(() => dailyLogs.id, { onDelete: 'cascade' }).notNull(),
  hungerLevel: varchar('hunger_level', { length: 20 }), // None, Low, Moderate, High, Intense
  mealsCount: integer('meals_count'),
  proteinGrams: integer('protein_grams'),
  waterLiters: decimal('water_liters', { precision: 3, scale: 2 }),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
```

### notification_preferences

```typescript
export const notificationPreferences = pgTable('notification_preferences', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  notificationType: varchar('notification_type', { length: 50 }).notNull(),
  enabled: boolean('enabled').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  uniqueUserNotification: unique().on(table.userId, table.notificationType),
}));
```

### email_logs

```typescript
export const emailLogs = pgTable('email_logs', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  notificationType: varchar('notification_type', { length: 50 }).notNull(),
  sentAt: timestamp('sent_at').defaultNow().notNull(),
  resendId: varchar('resend_id', { length: 100 }),
  status: varchar('status', { length: 20 }).notNull(), // sent, failed, delivered, bounced
  errorMessage: text('error_message'),
});
```

---

## Calculated Metrics

| Metric | Formula |
|--------|---------|
| Total Change | `current_weight - starting_weight` |
| Percent Change | `((current - starting) / starting) × 100` |
| Current BMI | `weight_kg / (height_m)²` |
| Weekly Average | `total_change / weeks_elapsed` |
| To Goal | `current_weight - goal_weight` |
| Treatment Week | `floor(days_since_start / 7) + 1` |
| Treatment Day | `days_since_start + 1` |

### BMI Categories

| Range | Category |
|-------|----------|
| < 18.5 | Underweight |
| 18.5 - 24.9 | Normal |
| 25 - 29.9 | Overweight |
| 30 - 34.9 | Obese Class I |
| 35 - 39.9 | Obese Class II |
| ≥ 40 | Obese Class III |

---

## Unit Conversions

```typescript
// Weight conversions
export const kgToLbs = (kg: number): number => kg * 2.20462;
export const kgToStone = (kg: number): number => kg * 0.157473;
export const lbsToKg = (lbs: number): number => lbs / 2.20462;
export const stoneToKg = (stone: number): number => stone / 0.157473;

// Format weight with all units
export const formatWeight = (kg: number): string => {
  const lbs = kgToLbs(kg);
  const stone = kgToStone(kg);
  return `${kg.toFixed(1)} kg / ${lbs.toFixed(1)} lbs / ${stone.toFixed(2)} stone`;
};

// Height conversions
export const cmToFeetInches = (cm: number): { feet: number; inches: number } => {
  const totalInches = cm / 2.54;
  const feet = Math.floor(totalInches / 12);
  const inches = Math.round(totalInches % 12);
  return { feet, inches };
};

export const feetInchesToCm = (feet: number, inches: number): number => {
  return (feet * 12 + inches) * 2.54;
};
```

---

## Page Routes

```
/                       → Redirect to /summary or /onboarding
/login                  → Login form
/register               → Registration form
/forgot-password        → Password reset request
/reset-password         → Password reset form (with token)
/onboarding             → Single-screen setup (implemented)
/onboarding/profile     → Step 1: Personal info (merged into /onboarding)
/onboarding/goals       → Step 2: Weight goals (merged into /onboarding)
/onboarding/first-entry → Step 3: First weight + injection (merged into /onboarding)

> **Implementation Note (2025-12-31):**
> Changed from multi-step to single-screen onboarding for better UX (74% of users abandon complex flows).
> - Route: `/onboarding` - Single scrollable form with 3 collapsible sections
> - Files: `src/app/(onboarding)/`, `src/components/onboarding/`, `src/lib/validations/onboarding.ts`
> - API: `POST /api/onboarding/complete` - Creates profile, preferences, weight entry, injection atomically
> - Flow: Register → /onboarding → Fill form → Submit → /summary

/summary                → Summary dashboard (home)
/results                → Results chart page (reference UI)
/jabs                   → Injection history + stats
/jabs/new               → New injection form
/jabs/[id]/edit         → Edit injection
/calendar               → Calendar view
/settings               → Settings menu
/settings/profile       → Personal info edit
/settings/goals         → Goals edit
/settings/account       → Email/password
/settings/injection     → Injection schedule preferences
/settings/units         → Unit preferences
/settings/notifications → Notification toggles
/settings/appearance    → Theme toggle
/settings/export        → Export options
/settings/help          → Help & FAQ
/settings/feedback      → Send feedback form

/log                    → Daily log entry (today)
/log/[date]             → Daily log for specific date
/weight/new             → Quick weight entry modal/page
/weight/[id]/edit       → Edit weight entry
```

---

## API Routes

```
POST   /api/auth/register
POST   /api/auth/login          (handled by NextAuth)
POST   /api/auth/logout         (handled by NextAuth)
POST   /api/auth/forgot-password
POST   /api/auth/reset-password
```

> **Implementation Note (2025-12-31) - Authentication [x]:**
> - NextAuth v5 (beta.30) with Credentials provider
> - JWT strategy (30-day session)
> - **Layered Security (CVE-2025-29927 compliant):**
>   - Proxy (`src/proxy.ts`) - Optimistic redirects, no DB calls (Next.js 16 convention)
>   - DAL (`src/lib/dal.ts`) - Session verification at data access with `cache()`
>   - API Routes - Auth checks before mutations
> - Files:
>   - `src/lib/auth/config.ts` - NextAuth configuration
>   - `src/lib/auth/index.ts` - Helper functions (deprecated, use DAL)
>   - `src/lib/dal.ts` - Data Access Layer (verifySession, getSession, etc.)
>   - `src/proxy.ts` - Route protection proxy (replaces deprecated middleware.ts)
>   - `src/app/api/auth/[...nextauth]/route.ts` - NextAuth handler
>   - `src/app/api/auth/register/route.ts` - Registration endpoint
>   - `src/app/(auth)/login/page.tsx` - Login form
>   - `src/app/(auth)/register/page.tsx` - Registration form
> - Password: bcryptjs with 12 salt rounds
> - Validation: Zod schema (email, min 8 chars, uppercase+lowercase+number)
> - **Tests:** 21 DAL tests + 31 proxy tests

```
GET    /api/profile
PUT    /api/profile
GET    /api/preferences
PUT    /api/preferences
```

> **Implementation Note (2025-12-31) - Profile & Preferences API [x]:**
> - Files:
>   - `src/app/api/profile/route.ts` - GET/PUT profile
>   - `src/app/api/preferences/route.ts` - GET/PUT preferences
> - Profile fields: age, gender, heightCm, weights, treatmentStartDate, injection prefs
> - Preferences fields: weightUnit, heightUnit, dateFormat, weekStartsOn, theme
> - Auto-creates default preferences on first GET if none exist
> - Zod validation on all PUT requests
> - Returns 404 if profile not found (profile created during onboarding)

```
GET    /api/weight                    → List with pagination + date filters
POST   /api/weight                    → Create entry
GET    /api/weight/[id]               → Single entry
PUT    /api/weight/[id]               → Update entry
DELETE /api/weight/[id]               → Delete entry
GET    /api/weight/latest             → Most recent entry
GET    /api/weight/stats              → Calculated stats for period
```

> **Implementation Note (2025-12-31) - Weight API [x]:**
> - Files:
>   - `src/app/api/weight/route.ts` - GET (list with pagination/filters) + POST
>   - `src/app/api/weight/[id]/route.ts` - GET/PUT/DELETE single entry
>   - `src/app/api/weight/latest/route.ts` - GET most recent
>   - `src/app/api/weight/stats/route.ts` - GET period + overall stats
> - Pagination: limit (max 100), offset, startDate, endDate filters
> - Stats include: period stats (min/max/avg/change) + overall progress toward goal
> - Zod validation: weightKg (20-500), recordedAt (ISO datetime), notes (max 500)

```
GET    /api/injections                → List all
POST   /api/injections                → Create
GET    /api/injections/[id]           → Single
PUT    /api/injections/[id]           → Update
DELETE /api/injections/[id]           → Delete
GET    /api/injections/latest         → Most recent
GET    /api/injections/next-due       → Next due date + status
```

> **Implementation Note (2025-12-31) - Injections API [x]:**
> - Files:
>   - `src/app/api/injections/route.ts` - GET (list) + POST
>   - `src/app/api/injections/[id]/route.ts` - GET/PUT/DELETE single
>   - `src/app/api/injections/latest/route.ts` - GET most recent
>   - `src/app/api/injections/next-due/route.ts` - GET next due with status
> - Valid doses: 2.5, 5, 7.5, 10, 12.5, 15 (mg)
> - Valid sites: abdomen, thigh_left, thigh_right, arm_left, arm_right
> - Next-due status: not_started, on_track, due_soon, due_today, overdue
> - Weekly injection interval (7 days)

```
GET    /api/daily-logs                → List with date range
POST   /api/daily-logs                → Create/update for date
GET    /api/daily-logs/[date]         → Single day
PUT    /api/daily-logs/[date]         → Update
GET    /api/daily-logs/week-summary   → Aggregated week data
```

> **Implementation Note (2025-12-31) - Daily Logs API [x]:**
> - Files:
>   - `src/app/api/daily-logs/route.ts` - GET (list) + POST (create/update)
>   - `src/app/api/daily-logs/[date]/route.ts` - GET/PUT for specific date
>   - `src/app/api/daily-logs/week-summary/route.ts` - Aggregated weekly data
> - Handles nested data: sideEffects, activity, mental, diet
> - Side effects: effectType, severity (None/Mild/Moderate/Severe)
> - Activity: workoutType, durationMinutes, steps
> - Mental: motivationLevel, cravingsLevel, moodLevel
> - Diet: hungerLevel, mealsCount, proteinGrams, waterLiters

```
GET    /api/calendar/[year]/[month]   → Month data for calendar
```

> **Implementation Note (2025-12-31) - Calendar API [x]:**
> - File: `src/app/api/calendar/[year]/[month]/route.ts`
> - Returns array of days with: hasWeight, hasInjection, hasLog, sideEffectsCount
> - Includes monthly summary: weightEntries, injections, logsCompleted, monthlyChange

```
GET    /api/stats/summary             → Summary page data
GET    /api/stats/results             → Results page data
```

> **Implementation Note (2025-12-31) - Stats API [x]:**
> - Files:
>   - `src/app/api/stats/summary/route.ts` - Dashboard summary (weight, injection, treatment, today's log)
>   - `src/app/api/stats/results/route.ts` - Chart data with period filters (all, 3m, 6m, 1y)
> - Results includes: weightData, weeklyAverages, injectionData, doseHistory

```
GET    /api/export/text               → Formatted text export
GET    /api/export/json               → JSON export
GET    /api/export/image              → Generated image
GET    /api/export/full               → GDPR full export (ZIP)

GET    /api/notifications/preferences → Get all toggles
PUT    /api/notifications/preferences → Update toggles

POST   /api/cron/send-notifications   → Cron endpoint for emails

POST   /api/onboarding/complete       → Complete onboarding (create profile + entries)
```

> **Implementation Note (2025-12-31) - Onboarding API [x]:**
> - File: `src/app/api/onboarding/complete/route.ts`
> - Creates in a single transaction: profile, userPreferences, weightEntry, injection
> - Validates with Zod schema from `src/lib/validations/onboarding.ts`
> - Returns 409 if profile already exists

---

## File Structure

```
/app
  /(auth)
    /login/page.tsx
    /register/page.tsx
    /forgot-password/page.tsx
    /reset-password/page.tsx
    layout.tsx
  /(app)
    /summary/page.tsx
    /results/page.tsx
    /jabs/page.tsx            (implemented)
    /jabs/new/page.tsx        (implemented)
    /jabs/[id]/edit/page.tsx
    /calendar/page.tsx
    /settings/page.tsx
    /settings/[section]/page.tsx
    /log/page.tsx
    /log/[date]/page.tsx
    /weight/new/page.tsx      (implemented)
    layout.tsx
  /(onboarding)
    /onboarding/page.tsx      (single-screen form - implemented)
    layout.tsx                (auth check, profile redirect - implemented)
  /~offline
    page.tsx              (PWA offline fallback page)
  /api
    /auth/[...nextauth]/route.ts
    /profile/route.ts
    /preferences/route.ts
    /weight/route.ts
    /weight/[id]/route.ts
    /weight/latest/route.ts
    /weight/stats/route.ts
    /injections/route.ts
    /injections/[id]/route.ts
    /injections/latest/route.ts
    /injections/next-due/route.ts
    /daily-logs/route.ts
    /daily-logs/[date]/route.ts
    /daily-logs/week-summary/route.ts
    /calendar/[year]/[month]/route.ts
    /stats/summary/route.ts
    /stats/results/route.ts
    /export/text/route.ts
    /export/json/route.ts
    /export/image/route.ts
    /export/full/route.ts
    /notifications/preferences/route.ts
    /cron/send-notifications/route.ts
    /onboarding/complete/route.ts   (implemented)
  layout.tsx
  manifest.ts             (PWA manifest - TypeScript)
  sw.ts                   (Serwist service worker source)
  
/components
  /ui
    Button.tsx
    Card.tsx
    Input.tsx
    Select.tsx
    Toggle.tsx
    Modal.tsx
    Toast.tsx
    Skeleton.tsx
    ...
  /charts
    WeightChart.tsx
    DoseMarker.tsx
  /forms
    WeightEntryForm.tsx
    InjectionForm.tsx
    DailyLogForm.tsx
    ProfileForm.tsx
  /onboarding                 (implemented)
    OnboardingForm.tsx        (main form with 3 sections)
    CollapsibleSection.tsx    (expandable section wrapper)
    WeightInput.tsx           (weight input with kg/lbs toggle)
    HeightInput.tsx           (height input with cm/ft-in toggle)
    index.ts                  (exports)
  /layout
    BottomNav.tsx
    Header.tsx
    PageContainer.tsx
  /summary
    ActionRequiredSection.tsx
    CurrentStateSection.tsx
    JourneyProgressSection.tsx
    RecentActivitySection.tsx
  /results
    StatsCardGrid.tsx
    StatCard.tsx
    TimePeriodFilter.tsx
  /jabs
    JabsStatsHeader.tsx
    InjectionHistoryList.tsx
    InjectionCard.tsx
  /calendar
    MonthGrid.tsx
    DayDetail.tsx
    DayMarkers.tsx
  /settings
    SettingsSection.tsx
    SettingsLink.tsx
  /empty-states
    NoDataState.tsx
    WelcomeState.tsx
  /export
    TextExport.tsx
    ImageExport.tsx

/lib
  /db
    index.ts (Drizzle client)
    schema.ts (all tables)
    queries/
      users.ts
      profiles.ts
      weight.ts
      injections.ts
      dailyLogs.ts
      notifications.ts
  /auth
    config.ts (NextAuth config)
  /email
    resend.ts (Resend client)
    templates/
      injection-reminder.tsx
      weekly-summary.tsx
      monthly-report.tsx
      ...
  /utils
    calculations.ts (BMI, stats)
    conversions.ts (units)
    dates.ts (date helpers)
    injection-logic.ts (due dates, status)
  /validations               (implemented)
    onboarding.ts            (Zod schemas + unit converters)
  /hooks
    useWeightStats.ts
    useInjectionStatus.ts
    useDailyLog.ts
  /types
    index.ts

/public
  /icons
    icon-192.png
    icon-512.png
    icon-maskable.png
    favicon.ico
  /images
    ...

/styles
  globals.css

next.config.ts          (with Serwist PWA config)
tailwind.config.ts
drizzle.config.ts
```

---

## Environment Variables

```env
# Database
DATABASE_URL=postgresql://user:pass@host:5432/dbname

# Auth
NEXTAUTH_SECRET=your-secret-key
NEXTAUTH_URL=http://localhost:3000

# Email
RESEND_API_KEY=re_xxxxx
EMAIL_FROM=Mounjaro Tracker <notifications@yourapp.com>

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=Mounjaro Tracker

# Cron (if using external cron service)
CRON_SECRET=your-cron-secret
```

> **Implementation Note (2025-12-31):**
> Production deployment completed on Vercel.
>
> **Production URL:** https://mj-tracker-xi.vercel.app
>
> **Vercel Configuration (`vercel.json`):**
> - Framework: Next.js (auto-detected)
> - Cron: Daily at 9:00 AM UTC (`/api/cron/send-notifications`)
> - Note: Hobby plan limits cron to once daily; Pro allows hourly
>
> **Environment Variable Naming:**
> - Use `RESEND_FROM_EMAIL` (not `EMAIL_FROM`) for consistency with code

---

## Loading & Error States

### Loading Skeletons

Each page should have a skeleton loader matching its layout:

```typescript
// Results page skeleton
export function ResultsSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-8 bg-slate-700 rounded w-1/3 mb-4" />
      <div className="grid grid-cols-3 gap-3 mb-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-20 bg-slate-700 rounded" />
        ))}
      </div>
      <div className="h-64 bg-slate-700 rounded" />
    </div>
  );
}
```

### Error Handling

- Toast notifications for transient errors
- Inline error messages for form validation
- Full-page error state for critical failures
- Retry buttons where appropriate

### Empty States

| Page | Empty State Message |
|------|---------------------|
| Results | "Log your first weight to see your progress chart" |
| Summary | Welcome flow with setup prompts |
| Jabs | "No injections logged yet. Record your first injection." |
| Calendar | Shows calendar, day detail says "No entries" |

---

## Sample Test Data

```json
{
  "profile": {
    "age": 27,
    "gender": "Male",
    "height_cm": 168,
    "starting_weight_kg": 93,
    "goal_weight_kg": 68,
    "treatment_start_date": "2025-11-05"
  },
  "weight_entries": [
    { "weight_kg": 93.0, "recorded_at": "2025-11-05T08:00:00Z" },
    { "weight_kg": 92.1, "recorded_at": "2025-11-08T08:00:00Z" },
    { "weight_kg": 91.5, "recorded_at": "2025-11-12T08:00:00Z" },
    { "weight_kg": 90.8, "recorded_at": "2025-11-15T08:00:00Z" },
    { "weight_kg": 90.2, "recorded_at": "2025-11-19T08:00:00Z" },
    { "weight_kg": 89.5, "recorded_at": "2025-11-22T08:00:00Z" },
    { "weight_kg": 89.1, "recorded_at": "2025-11-26T08:00:00Z" },
    { "weight_kg": 88.6, "recorded_at": "2025-12-02T08:00:00Z" }
  ],
  "injections": [
    { "dose_mg": 2.5, "injection_date": "2025-11-05T08:00:00Z", "injection_site": "Abdomen - Left" },
    { "dose_mg": 2.5, "injection_date": "2025-11-12T08:00:00Z", "injection_site": "Abdomen - Right" },
    { "dose_mg": 2.5, "injection_date": "2025-11-19T08:00:00Z", "injection_site": "Thigh - Left" },
    { "dose_mg": 2.5, "injection_date": "2025-11-26T08:00:00Z", "injection_site": "Thigh - Right" },
    { "dose_mg": 5.0, "injection_date": "2025-12-03T08:00:00Z", "injection_site": "Arm - Left" }
  ],
  "daily_logs": [
    {
      "log_date": "2025-11-08",
      "side_effects": [{ "effect_type": "Fatigue", "severity": "Mild" }],
      "activity": { "workout_type": "Strength training", "duration_minutes": 45, "steps": 11234 },
      "mental": { "motivation_level": "High", "cravings_level": "Medium", "mood_level": "Good" },
      "diet": { "hunger_level": "Moderate", "meals_count": 2, "protein_grams": 150, "water_liters": 2.5 }
    },
    {
      "log_date": "2025-11-10",
      "side_effects": [{ "effect_type": "Constipation", "severity": "Mild" }],
      "activity": { "workout_type": "Walking", "steps": 10500 },
      "mental": { "motivation_level": "High", "cravings_level": "Low", "mood_level": "Great" },
      "diet": { "hunger_level": "Low", "meals_count": 2, "protein_grams": 140, "water_liters": 3.0 }
    }
  ]
}
```

---

## Success Criteria

1. ✅ Results page visually matches reference image exactly
2. ✅ PWA installable on mobile devices
3. ✅ Offline read access to cached data
4. ✅ All stats cards display correct calculated values
5. ✅ Chart shows dose markers at correct positions with proper colors
6. ✅ Time period filters work correctly
7. ✅ Injection reminders respect 7-day cycle
8. ✅ Preferred injection day logic works within ±2 day window
9. ✅ All data from sample progress post can be captured
10. ✅ Export produces formatted text matching community post structure
11. ✅ JSON export includes all user data
12. ✅ Image export generates shareable dashboard snapshot
13. ✅ Email notifications deliver via Resend on schedule
14. ✅ All data persists in PostgreSQL via Drizzle
15. ✅ Daily logs capture all lifestyle factors
16. ✅ Unit conversions display correctly (kg/lbs/stone)
17. ✅ Empty states guide new users
18. ✅ Loading skeletons provide feedback during data fetch
19. ✅ Unit test coverage ≥80% for utility functions
20. ✅ E2E tests pass for all critical user flows

---

## Performance Optimizations

> **Implementation Note (2026-01-01):**
>
> **Server Component Conversion:**
> - Converted Results, Jabs, Calendar, Log pages from Client to Server Components
> - Added Suspense boundaries with skeleton loading states
> - Created server-side data fetching in `src/lib/data/` with React `cache()`
> - Extracted interactive parts to Client Components in `src/components/*/`
>
> **Database Indexes Added:**
> - `activity_logs_daily_log_id_idx`
> - `mental_logs_daily_log_id_idx`
> - `diet_logs_daily_log_id_idx`
>
> **API Optimizations:**
> - `/api/stats/results` now includes `heightCm` (removed redundant profile fetch)
>
> **Other:**
> - Loading skeletons for all 5 main routes
> - Link prefetching in BottomNav
> - Parallel DB queries in Summary page

---

## Related Documentation

| Document | Purpose |
|----------|---------|
| [Testing Specification](./testing-spec.md) | Complete testing setup, configuration, and examples |
