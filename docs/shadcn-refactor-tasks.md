# shadcn/ui Refactoring Tasks

Remaining component replacements after Dialog migration (completed 2026-01-02).

---

## Completed (2026-01-02)

- [x] **Tabs** - `src/components/results/PeriodTabs.tsx` - Radix Tabs with keyboard navigation
- [x] **Switch** - `src/app/(app)/settings/page.tsx` - Push notification toggle
- [x] **Checkbox** - `src/app/(app)/settings/page.tsx` - Email/Weekly report options
- [x] **Button** - Multiple files (auth pages, settings, jabs, wizard footer, onboarding)
- [x] **Alert** - Error messages across auth pages, settings modals, onboarding

---

## Known Issues

### iOS/Android Keyboard Hides Modal Content

**Status:** UNRESOLVED

**Problem:** On iOS Safari (and possibly Android), when opening a bottom-sheet modal (e.g., Goals, Personal Info in Settings), the virtual keyboard covers the input fields, making it impossible to see what you're typing.

**File:** `src/components/ui/dialog.tsx`

**Attempted fixes that didn't work:**

1. `interactive-widget=resizes-content` meta tag in viewport (Chrome/Firefox only, Safari doesn't support)
2. `visualViewport` API resize listener to adjust modal height
3. `scrollIntoView({ block: 'center' })` on input focus
4. Using `svh` (small viewport height) units instead of `vh`
5. `max-h-[85svh]` with `overflow-y-auto` on DialogContent

**Root cause:** iOS Safari does NOT resize the viewport when the keyboard appears. Instead, it scrolls the page, which conflicts with fixed-position bottom sheets.

**Research links:**
- https://github.com/radix-ui/primitives/issues/2323
- https://www.htmhell.dev/adventcalendar/2024/4/
- https://dev.to/franciscomoretti/fix-mobile-keyboard-overlap-with-visualviewport-3a4a

**Potential solutions to try:**

1. **Change modal positioning:** Instead of `bottom-0` fixed bottom sheet, use a centered modal on mobile that can scroll with the page
2. **Drawer component:** Use a proper drawer component (like Vaul) that handles iOS keyboard natively
3. **Page-based forms:** Replace modals with full-page form routes on mobile
4. **Input repositioning:** Move inputs to top of modal so keyboard doesn't cover them
5. **Native-like approach:** Use `position: absolute` inside a scrollable container instead of `position: fixed`

**To reproduce:**
1. Open app on iOS Safari (or Android Chrome)
2. Go to Settings → Personal Info or Goals
3. Tap on any input field
4. Keyboard appears and covers the input/button area

---

## Remaining Tasks

### 6. Accordion Component (CollapsibleSection)

**Install:** `npx shadcn@latest add accordion -y`

**File:** `src/components/onboarding/CollapsibleSection.tsx`

**Current issues:**
- Custom animation logic
- Missing `aria-controls`

**Replace with:**
```tsx
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

<Accordion type="single" collapsible>
  <AccordionItem value={id}>
    <AccordionTrigger>
      {title}
      {isComplete && <CheckIcon />}
    </AccordionTrigger>
    <AccordionContent>{children}</AccordionContent>
  </AccordionItem>
</Accordion>
```

**Also update:** `src/components/onboarding/OnboardingForm.tsx` (parent)

---

### 7. Skeleton Component

**Install:** `npx shadcn@latest add skeleton -y`

**Files:**
- `src/components/results/ResultsSkeleton.tsx`
- `src/components/jabs/JabsSkeleton.tsx`
- `src/components/calendar/CalendarSkeleton.tsx`
- `src/components/log/LogSkeleton.tsx`
- `src/app/(app)/settings/page.tsx` (SettingsSkeleton function)

**Pattern:**
```tsx
// Before
<div className="h-12 rounded bg-card animate-pulse" />

// After
import { Skeleton } from '@/components/ui/skeleton';
<Skeleton className="h-12 rounded" />
```

---

### 8. Input Component (Optional)

**Install:** `npx shadcn@latest add input -y`

**Benefit:** Consistent focus rings, validation states

**Files:** All forms with `<input>` elements

**Pattern:**
```tsx
// Before
<input className="w-full rounded-lg bg-card px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />

// After
import { Input } from '@/components/ui/input';
<Input className="bg-card" />
```

---

### 9. Consolidate StatCard Variants

**Not a shadcn task** - code cleanup

**Files:**
- `src/components/ui/StatCard.tsx`
- `src/components/jabs/JabsStatCard.tsx`
- `src/components/results/ResultsStatCard.tsx`

**Action:** Merge into single `StatCard` component with props for variants:
```tsx
type StatCardProps = {
  label: string;
  value: string | number | null;
  sublabel?: string;
  icon?: React.ReactNode;
  unit?: string;
};
```

---

## Priority Order

1. **Critical:** Fix iOS keyboard modal issue (see Known Issues above)
2. **Low:** Skeleton, Input, Accordion (polish)
3. **Cleanup:** StatCard consolidation

---

## Testing Checklist

After each component replacement:
- [ ] `pnpm build` passes
- [ ] `pnpm test:run` passes
- [ ] Manual test on mobile (touch targets, animations)
- [ ] Keyboard navigation works (Tab, Enter, Space, Arrow keys)
- [ ] Screen reader announces correctly
- [ ] **iOS Safari:** Test with virtual keyboard on modals with inputs
