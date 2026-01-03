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

## Implementation Checklist

### Phase 1: Core Structure
- [ ] Create `/log` route (redirect from `/calendar`)
- [ ] Build `LogHeroCard` component
- [ ] Build `WeekStrip` component
- [ ] Build `QuickLogActions` component

### Phase 2: Check-in Page
- [ ] Create `/log/checkin` route
- [ ] Build accordion section components
- [ ] Implement `MoodSelector` with Lucide icons
- [ ] Implement `SideEffectSlider` components
- [ ] Implement `Stepper` component for diet
- [ ] Implement activity sliders
- [ ] Wire up form state and save

### Phase 3: Day Details
- [ ] Create `/log/[date]` route
- [ ] Build `DaySummaryCard` component
- [ ] Display weight, injection (if any), check-in data
- [ ] Add edit functionality

### Phase 4: Polish
- [ ] Add streak calculation logic
- [ ] Add progress ring animation
- [ ] Add loading skeletons matching design system
- [ ] Ensure dark mode support
- [ ] Test on mobile viewport

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
