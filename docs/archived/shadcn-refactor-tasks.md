# shadcn/ui Refactoring Tasks

Remaining component replacements after Dialog migration (completed 2026-01-02).

---

## Completed (2026-01-02)

- [x] **Tabs** - `src/components/results/PeriodTabs.tsx` - Radix Tabs with keyboard navigation
- [x] **Switch** - `src/app/(app)/settings/page.tsx` - Push notification toggle
- [x] **Checkbox** - `src/app/(app)/settings/page.tsx` - Email/Weekly report options
- [x] **Button** - Multiple files (auth pages, settings, jabs, wizard footer, onboarding)
- [x] **Alert** - Error messages across auth pages, settings modals, onboarding
- [x] **Accordion** - `src/components/onboarding/CollapsibleSection.tsx` - Using Radix Accordion primitives with Lucide icons
- [x] **Skeleton** - All skeleton components (`ResultsSkeleton`, `JabsSkeleton`, `CalendarSkeleton`, `LogSkeleton`, `SettingsSkeleton`, `SummarySkeleton`)
- [x] **StatCard Consolidation** - Merged `SummaryStatCard`, `JabsStatCard`, `ResultsStatCard` into unified `src/components/ui/StatCard.tsx`
- [x] **iOS Keyboard Fix** - Implemented Vaul Drawer with ResponsiveModal wrapper for Settings modals

---

## Known Issues

### iOS/Android Keyboard Hides Modal Content

**Status:** RESOLVED (2026-01-02)

**Solution implemented:**
1. Installed Vaul drawer library (`pnpm add vaul`)
2. Created `src/components/ui/drawer.tsx` - Vaul-based drawer component
3. Created `src/hooks/use-media-query.ts` - Media query hook for responsive detection
4. Created `src/components/ui/responsive-modal.tsx` - Wrapper that uses Dialog on desktop, Drawer on mobile
5. Updated Settings page modals to use ResponsiveModal

**How it works:**
- On desktop (>=640px): Uses standard Dialog component (centered modal)
- On mobile (<640px): Uses Vaul Drawer component which handles iOS keyboard natively

---

## Remaining Tasks

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

## Priority Order

1. **Optional:** Input component (polish)

---

## Testing Checklist

After each component replacement:
- [x] `pnpm build` passes
- [x] `pnpm test:run` passes (599 tests)
- [ ] Manual test on mobile (touch targets, animations)
- [ ] Keyboard navigation works (Tab, Enter, Space, Arrow keys)
- [ ] Screen reader announces correctly
- [ ] **iOS Safari:** Test with virtual keyboard on modals with inputs
