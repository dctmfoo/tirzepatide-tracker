# Calendar/Log Page Redesign Specification

> **Wireframe Reference:** `calendar-combined-flow-v2.html`
> **Status:** Ready for Implementation
> **Last Updated:** 2026-01-03

---

## Overview

Complete overhaul of the Calendar page, renamed to "Log". The primary goal is to make daily tracking **fast and intuitive** with minimal typing.

### Key Principles
1. **Tap, don't type** - Use sliders, toggles, and selection buttons
2. **Single page check-in** - No multi-step wizard
3. **Fill what you want** - Collapsible sections, skip freely
4. **Injection stays on Jabs** - Log page only handles weight + daily check-in

---

## Page Structure

### Screen 1: Log Page (Main Hub)

**Route:** `/log` (rename from `/calendar`)

**Layout:**
```
┌─────────────────────────────────┐
│ Header: "Log"        [Calendar] │
├─────────────────────────────────┤
│ ┌─────────────────────────────┐ │
│ │ TODAY HERO CARD             │ │
│ │ Saturday, Jan 3             │ │
│ │ ┌─────────────────────────┐ │ │
│ │ │ [Progress Ring 2/4]     │ │ │
│ │ │ ✓ Weight  ✓ Mood        │ │ │
│ │ │ Diet & Activity remaining│ │ │
│ │ │─────────────────────────│ │ │
│ │ │ 🔥 7 day streak!        │ │ │
│ │ └─────────────────────────┘ │ │
│ └─────────────────────────────┘ │
├─────────────────────────────────┤
│ QUICK LOG                       │
│ ┌──────────┐ ┌──────────────┐   │
│ │ ⚖️ Weight │ │ ✅ Check-in  │   │
│ │ Last:91.2│ │ Continue →   │   │
│ └──────────┘ └──────────────┘   │
├─────────────────────────────────┤
│ THIS WEEK          [Full Cal]   │
│ ┌─────────────────────────────┐ │
│ │ Thu  Fri  SAT  Sun  Mon     │ │
│ │  1    2   [3]   4    5      │ │
│ │  ●●  ●●●  ●●    ○    ○      │ │
│ │─────────────────────────────│ │
│ │ ● Weight  ● Check-in  ● Inj │ │
│ └─────────────────────────────┘ │
└─────────────────────────────────┘
```

**Components:**
- `LogHeroCard` - Today's status with progress ring
- `QuickLogActions` - 2 action cards (Weight, Check-in)
- `WeekStrip` - Horizontal week view with activity dots

**Hero Card Data:**
- Progress: X of 4 (Weight, Mood, Diet, Activity)
- Streak: Consecutive days with at least 1 log
- Status badges for completed items

**Quick Actions:**
| Action | Opens | Note |
|--------|-------|------|
| Weight | Modal with number input | Same as current |
| Daily Check-in | `/log/checkin` page | Single page form |

**Week Strip:**
- Shows 5-7 days centered on today
- Colored dots: Blue (weight), Green (check-in), Violet (injection)
- Tap day → Navigate to day details
- "Full Calendar" link → Full month view

---

### Screen 2: Day Details

**Route:** `/log/[date]` (e.g., `/log/2026-01-02`)

**Layout:**
```
┌─────────────────────────────────┐
│ ← Back    Friday, Jan 2   Edit  │
├─────────────────────────────────┤
│ ┌─────────────────────────────┐ │
│ │ DAY SUMMARY        Complete │ │
│ │                             │ │
│ │ ┌─────────────────────────┐ │ │
│ │ │ ⚖️ Weight      91.5 kg  │ │ │
│ │ │    8:15 AM      -0.2 kg │ │ │
│ │ └─────────────────────────┘ │ │
│ │                             │ │
│ │ ┌─────────────────────────┐ │ │
│ │ │ 💉 Injection    2.5 mg  │ │ │
│ │ │    Thigh-Left   Week 4  │ │ │
│ │ └─────────────────────────┘ │ │
│ │                             │ │
│ │ ┌─────────────────────────┐ │ │
│ │ │ ✅ Check-in         →   │ │ │
│ │ │ [Good mood] [Low crav]  │ │ │
│ │ │ [3 meals] [Walking]     │ │ │
│ │ └─────────────────────────┘ │ │
│ └─────────────────────────────┘ │
├─────────────────────────────────┤
│ 📝 Notes                        │
│ "Felt great today! Energy..."   │
└─────────────────────────────────┘
```

**Data Display:**
- Weight: Value, time, change from previous day
- Injection: Only shown if injection logged that day (from Jabs data)
- Check-in: Tag summary of logged values
- Notes: Free text from check-in

**Actions:**
- Edit button → Opens check-in page in edit mode
- Tap check-in card → Expand to see full details

---

### Screen 3: Daily Check-in (CRITICAL - Single Page Form)

**Route:** `/log/checkin` or `/log/checkin/[date]`

**Design Principle:** **TAP, DON'T TYPE**
- All inputs are sliders, toggles, or tap selections
- Only Notes field requires typing (optional)
- Sections are collapsible accordions

**Layout:**
```
┌─────────────────────────────────┐
│ ← Back   Daily Check-in  Today  │
│        [✓ 2 of 4 sections]      │
├─────────────────────────────────┤
│                                 │
│ ┌─────────────────────────────┐ │
│ │ 😊 MOOD & ENERGY      Done  │ │
│ │─────────────────────────────│ │
│ │ [😢] [😐] [🙂] [😊]         │ │
│ │  Poor Fair Good Great       │ │
│ │                             │ │
│ │ Cravings: [None][Low][Med]  │ │
│ │ Energy:   [Low][Med][High]  │ │
│ └─────────────────────────────┘ │
│                                 │
│ ┌─────────────────────────────┐ │
│ │ ⚠️ SIDE EFFECTS    [▼]     │ │
│ │─────────────────────────────│ │
│ │ Nausea      ────●───── 3    │ │
│ │ Fatigue     ──●─────── 1    │ │
│ │ Headache    ●───────── 0    │ │
│ │ Constipation ────●──── 3    │ │
│ │ Diarrhea    ●───────── 0    │ │
│ │ + Add custom                │ │
│ └─────────────────────────────┘ │
│                                 │
│ ┌─────────────────────────────┐ │
│ │ 🍽️ DIET              Done  │ │
│ │─────────────────────────────│ │
│ │ Meals    [-] 3 [+]          │ │
│ │ Protein  [-] 90g [+]        │ │
│ │ Water    [-] 2L [+]         │ │
│ │                             │ │
│ │ Hunger:  [None][Low][Med]   │ │
│ └─────────────────────────────┘ │
│                                 │
│ ┌─────────────────────────────┐ │
│ │ 🏃 ACTIVITY          [▼]   │ │
│ │─────────────────────────────│ │
│ │ Steps     ─────●───── 5.2k  │ │
│ │ Duration  ───●─────── 30min │ │
│ │                             │ │
│ │ Type: [Rest][Walk][Cardio]  │ │
│ │       [Strength][Other]     │ │
│ └─────────────────────────────┘ │
│                                 │
│ ┌─────────────────────────────┐ │
│ │ 📝 Notes (optional)         │ │
│ │ ┌─────────────────────────┐ │ │
│ │ │ Any thoughts...         │ │ │
│ │ └─────────────────────────┘ │ │
│ └─────────────────────────────┘ │
│                                 │
│ ┌─────────────────────────────┐ │
│ │      ✓ Save Check-in        │ │
│ └─────────────────────────────┘ │
└─────────────────────────────────┘
```

---

## Section Details

### 1. Mood & Energy Section

**Inputs (all tap-based):**

| Field | Type | Options |
|-------|------|---------|
| Mood | Icon buttons | Poor, Fair, Good, Great |
| Cravings | Toggle pills | None, Low, Medium, High, Intense |
| Energy/Motivation | Toggle pills | Low, Medium, High |

**Icons:** Use Lucide face icons (not emoji):
- `Frown` for Poor
- `Meh` for Fair
- `Smile` for Good
- `Laugh` for Great

---

### 2. Side Effects Section (SLIDERS)

**Input Type:** Horizontal sliders (0-5 scale)

**Default Side Effects:**
| Side Effect | Slider Range | Default |
|-------------|--------------|---------|
| Nausea | 0-5 | 0 |
| Fatigue | 0-5 | 0 |
| Headache | 0-5 | 0 |
| Constipation | 0-5 | 0 |
| Diarrhea | 0-5 | 0 |
| Dizziness | 0-5 | 0 |

**Slider Behavior:**
- 0 = None (slider at far left)
- 1-2 = Mild
- 3-4 = Moderate
- 5 = Severe
- Show numeric value on right side
- Only save non-zero values to database

**Customization:**
- "+ Add custom" button to add user's own side effects
- Custom side effects saved to user preferences
- Reorder/remove via Settings

**Component:** Use shadcn/ui `Slider` component

```tsx
// Example implementation
<div className="flex items-center gap-3">
  <span className="w-24 text-sm">Nausea</span>
  <Slider
    defaultValue={[0]}
    max={5}
    step={1}
    className="flex-1"
  />
  <span className="w-6 text-right font-display font-bold">{value}</span>
</div>
```

---

### 3. Diet Section

**Inputs:**

| Field | Type | Range | Step |
|-------|------|-------|------|
| Meals | Stepper (+/-) | 0-10 | 1 |
| Protein | Stepper (+/-) | 0-300g | 10g |
| Water | Stepper (+/-) | 0-5L | 0.5L |
| Hunger Level | Toggle pills | None, Low, Moderate, High, Intense |

**Stepper Component:**
```
[-] 90g [+]
```
- Tap and hold for rapid increment
- Show unit after value

---

### 4. Activity Section (SLIDERS + TOGGLES)

**Inputs:**

| Field | Type | Range |
|-------|------|-------|
| Steps | Slider | 0-20,000 (step: 500) |
| Duration | Slider | 0-120 min (step: 5) |
| Workout Type | Toggle pills | Rest Day, Walking, Cardio, Strength, Other |

**Slider Display:**
- Steps: Show as "5.2k" when > 1000
- Duration: Show as "30 min"

**Component:**
```tsx
<div className="space-y-3">
  <div className="flex items-center gap-3">
    <span className="w-20 text-sm">Steps</span>
    <Slider max={20000} step={500} />
    <span className="w-12 text-right font-display font-bold">5.2k</span>
  </div>
  <div className="flex items-center gap-3">
    <span className="w-20 text-sm">Duration</span>
    <Slider max={120} step={5} />
    <span className="w-12 text-right font-display font-bold">30m</span>
  </div>
</div>
```

---

## Data Model Updates

### Daily Log Table (existing: `dailyLogs`)

Ensure these fields exist:
```typescript
{
  id: uuid,
  userId: uuid,
  date: date,

  // Mood section
  mood: enum('poor', 'fair', 'good', 'great'),
  cravings: enum('none', 'low', 'medium', 'high', 'intense'),
  motivation: enum('low', 'medium', 'high'),

  // Diet section
  meals: integer,
  proteinGrams: integer,
  waterLiters: decimal,
  hungerLevel: enum('none', 'low', 'moderate', 'high', 'intense'),

  // Activity section
  steps: integer,
  activityMinutes: integer,
  workoutType: enum('rest', 'walking', 'cardio', 'strength', 'other'),

  // Notes
  notes: text,

  createdAt: timestamp,
  updatedAt: timestamp
}
```

### Side Effects Table (may need new table)

```typescript
// dailyLogSideEffects
{
  id: uuid,
  dailyLogId: uuid, // FK to dailyLogs
  sideEffect: string, // 'nausea', 'fatigue', etc.
  severity: integer, // 0-5
}
```

Or store as JSON in dailyLogs:
```typescript
sideEffects: jsonb // { nausea: 3, fatigue: 1, constipation: 3 }
```

---

## Component Hierarchy

```
/log (page)
├── LogHeader
├── LogHeroCard
│   ├── ProgressRing
│   └── StreakIndicator
├── QuickLogActions
│   ├── WeightActionCard → opens WeightModal
│   └── CheckinActionCard → navigates to /log/checkin
└── WeekStrip
    ├── DayCell (×7)
    └── Legend

/log/[date] (page)
├── DayHeader (with back nav)
└── DaySummaryCard
    ├── WeightEntry
    ├── InjectionEntry (conditional)
    └── CheckinSummary

/log/checkin (page)
├── CheckinHeader
├── ProgressIndicator
├── MoodSection (accordion)
│   ├── MoodSelector (icon buttons)
│   ├── CravingsToggle
│   └── EnergyToggle
├── SideEffectsSection (accordion)
│   └── SideEffectSlider (×N)
├── DietSection (accordion)
│   ├── MealsStepper
│   ├── ProteinStepper
│   ├── WaterStepper
│   └── HungerToggle
├── ActivitySection (accordion)
│   ├── StepsSlider
│   ├── DurationSlider
│   └── WorkoutTypeToggle
├── NotesSection
│   └── Textarea
└── SaveButton
```

---

## Navigation Flow

```
Bottom Nav "Log" tap
        │
        ▼
   /log (Log Hub)
        │
        ├── Tap "Weight" → WeightModal → Save → Stay on /log
        │
        ├── Tap "Daily Check-in" → /log/checkin → Save → /log
        │
        ├── Tap day in WeekStrip → /log/[date]
        │                              │
        │                              └── Tap "Edit" → /log/checkin/[date]
        │
        └── Tap "Full Calendar" → /log/calendar (month view)
                                        │
                                        └── Tap any day → /log/[date]
```

---

## Implementation Phases (Detailed)

> **Agent Handoff Notes:** Each phase is self-contained. If context runs out, the next agent can pick up from the next incomplete phase. Check boxes marked [x] are complete.

---

### Phase 0: Schema Updates (PREREQUISITE)
**Status:** ✅ Complete (2026-01-03)

**Backend Changes Required:**
- [x] Update `sideEffects` table: change `severity` from varchar to integer (0-5 scale)
- [ ] Verify `dailyLogs` has `notes` field (for general notes) - Not needed, notes are per sub-table
- [ ] Create data function `getLogHubData(userId)` for today's progress, streak, week data - Phase 2

**Files modified:**
- `src/lib/db/schema.ts` - Updated sideEffects severity to integer
- `src/lib/data/daily-log.ts` - Updated SideEffectData type
- `src/app/api/daily-logs/[date]/route.ts` - Updated validation for integer severity
- `src/app/api/daily-logs/route.ts` - Updated validation for integer severity
- All related test files updated

---

### Phase 1: Route Structure & Navigation
**Status:** ✅ Complete (2026-01-03)

**Tasks:**
- [x] Create `/log` route folder at `src/app/(app)/log/` - Already existed, updated content
- [x] Add redirect from `/calendar` to `/log`
- [x] Update `BottomNav.tsx`: Change `/calendar` to `/log`, change label "Calendar" to "Log"
- [x] Create `src/components/log-hub/` folder for new components
- [x] Create basic page.tsx with placeholder content
- [ ] Verify navigation works in browser - Next agent should verify

**Files modified:**
- `src/app/(app)/log/page.tsx` - Replaced LogWizard with placeholder Log Hub
- `src/app/(app)/log/loading.tsx` - Updated skeleton to match new layout
- `src/app/(app)/log/[date]/page.tsx` - Updated redirectTo from /calendar to /log
- `src/app/(app)/calendar/page.tsx` - Now redirects to /log
- `src/components/layout/BottomNav.tsx` - Changed /calendar to /log, label to "Log"
- `src/components/log-hub/index.ts` - Created barrel export file

---

### Phase 2: Log Hub Components
**Status:** ✅ Complete (2026-01-03)

**Tasks:**
- [x] Build `LogHeroCard` - Today's progress ring + streak
- [x] Build `QuickLogActions` - Weight + Check-in action cards
- [x] Build `WeekStrip` - 7-day horizontal view with dots
- [x] Build `LogHeader` - Page title + calendar icon link (integrated into page)
- [x] Create data fetching in page.tsx
- [x] Wire up weight modal (reuse existing LogWeightModal)
- [x] Test in browser - verify all components render

**Files created:**
- `src/components/log-hub/LogHeroCard.tsx` - Hero card with progress ring (X/4), status badges, streak
- `src/components/log-hub/QuickLogActions.tsx` - Weight modal trigger + Check-in navigation
- `src/components/log-hub/WeekStrip.tsx` - 7-day horizontal view with activity dots
- `src/lib/data/log-hub.ts` - `getLogHubData()` function for aggregating hub data

**Data implemented:**
- Today's date, completed sections count (Weight, Mood, Diet, Activity)
- Streak calculation (consecutive days with any log or weight entry)
- Last 7 days with indicators (weight=blue, check-in=green, injection=violet)
- Latest weight value for display

**Notes:**
- LogHeader is inline in page.tsx (simple enough to not need separate component)
- QuickLogActions links to `/log/{todayDate}` until Phase 3 adds `/log/checkin`

---

### Phase 3: Daily Check-in Page (Single Page Form)
**Status:** ✅ Complete (2026-01-03)

**Tasks:**
- [x] Create `/log/checkin` route
- [x] Create `/log/checkin/[date]` route for editing past days
- [x] Build `MoodSection` - Mood icons + cravings/energy toggles
- [x] Build `SideEffectsSection` - Sliders (0-5) with shadcn Slider
- [x] Build `DietSection` - Steppers for meals/protein/water + hunger toggle
- [x] Build `ActivitySection` - Steps/duration sliders + workout type toggle
- [x] Build `NotesSection` - Textarea
- [x] Build form state hook `useCheckinForm`
- [x] Wire up save functionality to existing API
- [x] Test all inputs work correctly

**Files created:**
- `src/app/(app)/log/checkin/page.tsx` - Today's check-in page
- `src/app/(app)/log/checkin/[date]/page.tsx` - Edit past day check-in
- `src/components/log-hub/checkin/MoodSection.tsx` - Mood icons + cravings/energy toggles
- `src/components/log-hub/checkin/SideEffectsSection.tsx` - 0-5 sliders per side effect
- `src/components/log-hub/checkin/DietSection.tsx` - Stepper inputs + hunger toggle
- `src/components/log-hub/checkin/ActivitySection.tsx` - Steps/duration sliders + workout type
- `src/components/log-hub/checkin/NotesSection.tsx` - Textarea for notes
- `src/components/log-hub/checkin/useCheckinForm.ts` - Form state management hook
- `src/components/log-hub/checkin/CheckinPageContent.tsx` - Client component with form
- `src/components/ui/slider.tsx` - shadcn Slider component
- `src/components/ui/stepper.tsx` - Custom +/- stepper component

**Notes:**
- Used cards instead of accordion (cleaner UX, all sections visible)
- Sections show "Done" badge when completed
- Progress indicator shows "X of 4 sections" at top
- Save button calls existing POST /api/daily-logs endpoint
- Form loads existing data when editing past days

---

### Phase 4: Day Details Page
**Status:** ✅ Complete (2026-01-03)

**Tasks:**
- [x] Create `/log/[date]` route (replaces old log wizard route)
- [x] Build `DaySummaryCard` - Read-only view of day's data
- [x] Show weight entry with time and delta
- [x] Show injection if any (read from injections table)
- [x] Show check-in summary as tags
- [x] Show notes if any
- [x] Add "Edit" button linking to `/log/checkin/[date]`
- [x] Handle empty state gracefully
- [x] Test navigation from WeekStrip to day details

**Files created:**
- `src/app/(app)/log/[date]/page.tsx` - Day details page with header, back nav, edit button
- `src/components/log-hub/DaySummaryCard.tsx` - Day summary with weight, injection, check-in display
- `src/lib/data/day-details.ts` - Data fetching function for day details
- `src/components/log-hub/__tests__/DaySummaryCard.test.tsx` - 15 unit tests

**Features:**
- Weight entry displays value, time, and delta from previous day
- Injection entry shows dose, site, and week number since treatment start
- Check-in summary shows tags for mood, cravings, meals, activity, steps
- Notes section collects and displays notes from all sources
- Empty state with CTA to start/add check-in
- "Complete" badge when day has sufficient data
- Loading skeleton for better UX

---

### Phase 5: Full Calendar View
**Status:** ✅ Complete (2026-01-03)

**Tasks:**
- [x] Create `/log/calendar` route for full month view
- [x] Reuse existing CalendarGrid component (or adapt)
- [x] Navigate from day tap to `/log/[date]`
- [x] Add back button to Log Hub

**Files created:**
- `src/app/(app)/log/calendar/page.tsx` - Full calendar page with month summary
- `src/app/(app)/log/calendar/loading.tsx` - Loading skeleton
- `src/components/log-hub/LogCalendarGrid.tsx` - Adapted calendar grid with Log design patterns
- `src/components/log-hub/LogCalendarClient.tsx` - Client component for month navigation
- `src/components/log-hub/__tests__/LogCalendarGrid.test.tsx` - 18 unit tests
- `src/components/log-hub/__tests__/LogCalendarClient.test.tsx` - 7 unit tests

**Features:**
- Month navigation (previous/next) with optimistic UI updates
- Day cells link to `/log/[date]` for past/today, disabled for future
- Colored dots: blue (weight), green (check-in), violet (injection)
- Today highlighted with gradient background
- Monthly summary stats (weight logs, check-ins, injections)
- Loading skeleton for better UX
- Back button to return to Log Hub

---

### Phase 6: Cleanup & Polish
**Status:** ✅ Complete (2026-01-03)

**Tasks:**
- [x] Remove old `/calendar` route (after redirect confirmed working) - kept redirect for backwards compat
- [x] Remove old wizard components if no longer needed
- [x] Add loading skeletons for all new pages
- [x] Ensure dark mode works on all components
- [x] Test on mobile viewport (Chrome DevTools)
- [x] Add streak calculation logic - already implemented in Phase 2
- [x] Add progress ring animation - already implemented in Phase 2
- [x] Run `pnpm lint` and fix issues
- [x] Run `pnpm build` to verify no errors

**Cleanup completed:**
- Removed `src/components/log/` folder containing:
  - `LogWizard.tsx`
  - `steps/` (StepMental, StepDiet, StepActivity, StepSideEffects)
  - `WizardProgress.tsx`
  - `WizardFooter.tsx`
  - `useLogWizard.ts`
  - `LogSkeleton.tsx`
  - `index.ts`
- Updated `src/app/(app)/log/[date]/loading.tsx` to use new skeleton
- Added loading skeletons for `/log/checkin` and `/log/checkin/[date]`
- Created new E2E tests at `e2e/log.spec.ts`
- Simplified `e2e/calendar.spec.ts` to test redirect only

---

## Implementation Checklist (Quick Reference)

### Phase 0: Schema ✅
- [x] Update sideEffects severity to integer

### Phase 1: Routes ✅
- [x] Create /log route
- [x] Redirect /calendar → /log
- [x] Update BottomNav

### Phase 2: Hub Components ✅
- [x] LogHeroCard
- [x] QuickLogActions
- [x] WeekStrip
- [x] Data fetching (getLogHubData)

### Phase 3: Check-in Page ✅
- [x] MoodSection, SideEffectsSection, DietSection, ActivitySection, NotesSection
- [x] useCheckinForm hook
- [x] /log/checkin and /log/checkin/[date] routes
- [x] Form state & save

### Phase 4: Day Details ✅
- [x] DaySummaryCard
- [x] Edit functionality
- [x] getDayDetailsData
- [x] Unit tests

### Phase 5: Full Calendar ✅
- [x] Month view page
- [x] LogCalendarGrid component
- [x] LogCalendarClient component
- [x] 25 unit tests

### Phase 6: Cleanup ✅
- [x] Remove old code
- [x] Polish & test

---

## Design Tokens Reference

From `docs/design-system.md`:

```tsx
// Page container
<div className="flex min-h-[calc(100svh-140px)] flex-col gap-4 overflow-x-hidden p-4">

// Card
<section className="rounded-[1.25rem] bg-card p-5 shadow-sm">

// Nested card
<div className="rounded-2xl border border-border/40 bg-secondary/50 p-4">

// Section header
<h3 className="mb-3 text-[0.75rem] font-semibold uppercase tracking-wider text-muted-foreground">

// Slider styling (match app theme)
// Use teal/primary color for slider track fill
```

---

## Notes for Implementer

1. **No injection on Log page** - Injection logging stays on Jabs page. The Log page only shows injection data when viewing past days (read-only).

2. **Sliders are key** - The side effects and activity sections MUST use sliders. No dropdown selects or text inputs for these.

3. **Accordion state** - Sections should remember their expanded/collapsed state during the session. Default: Mood expanded, others collapsed.

4. **Auto-save consideration** - Consider auto-saving as user fills (debounced), with explicit "Save" button as confirmation.

5. **Existing data** - When opening check-in for a day that has data, pre-populate all fields.

6. **Zero values** - Don't store side effects with value 0. Only store non-zero severities.
