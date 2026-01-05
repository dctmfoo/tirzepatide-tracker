# Fix Plan: PR #12 - Injection Site Format Issues

**Date:** 2026-01-05
**PR:** https://github.com/dctmfoo/tirzepatide-tracker/pull/12
**Branch:** `fix/injection-site-tracking-and-date-display`
**Reviewer:** Claude Code Review
**Confidence Score:** 2/5 (Critical issues found)

---

## Executive Summary

PR #12 successfully fixes the core injection site format issue in the main API and data layers. However, **Claude Code Review identified 5 additional issues** where the old format is still being used, causing validation failures and blocking critical user flows (onboarding and injection logging via modal).

**Critical Impact:**
- 🚨 New users **CANNOT** complete onboarding
- 🚨 Existing users **CANNOT** log injections via the modal
- ⚠️ Legacy data displays inconsistent labels

---

## Background Context

### The Format Change
**Old Format (deprecated):** `'abdomen'`, `'thigh_left'`, `'thigh_right'`, `'arm_left'`, `'arm_right'`
**New Format (correct):** `'Abdomen - Left'`, `'Abdomen - Right'`, `'Thigh - Left'`, `'Thigh - Right'`, `'Upper Arm - Left'`, `'Upper Arm - Right'`

### What PR #12 Fixed
✅ API validation (`src/app/api/injections/route.ts`)
✅ Main injection form (`src/app/(app)/jabs/new/page.tsx`)
✅ Summary page data layer (`src/lib/data/jabs.ts`)
✅ Display components with backward compatibility
✅ Test data updated

### What Still Needs Fixing
❌ LogInjectionModal (modal popup for quick logging)
❌ Onboarding validation schema
❌ Onboarding forms (both regular and card flow)
❌ Incomplete backward compatibility mappings
❌ Missing test coverage for migration

---

## Issues Breakdown

### Issue #1: LogInjectionModal uses old format
**Severity:** 🚨 Critical - Blocking
**File:** `src/components/jabs/LogInjectionModal.tsx`
**Lines:** 14-19

**Problem:**
The modal component hardcodes the old site format in its `VALID_SITES` constant:
```typescript
const VALID_SITES = [
  { value: 'abdomen', label: 'Abdomen' },
  { value: 'thigh_left', label: 'Thigh - Left' },
  { value: 'thigh_right', label: 'Thigh - Right' },
  { value: 'arm_left', label: 'Arm - Left' },
  { value: 'arm_right', label: 'Arm - Right' },
];
```

**Impact:**
When users click the "Log Injection" button and submit the modal form, the API rejects the old format and returns a 400 validation error.

**Fix Steps:**
1. Add imports at top of file:
   ```typescript
   import {
     INJECTION_SITES,
     getInjectionSiteOptions,
     getSuggestedSite,
   } from '@/lib/utils/injection-logic';
   ```

2. Remove the `VALID_SITES` constant (lines 14-19)

3. Update state initialization (around line 26-27):
   ```typescript
   // BEFORE
   const [site, setSite] = useState('abdomen');
   const [suggestedSite, setSuggestedSite] = useState('abdomen');

   // AFTER
   const [site, setSite] = useState(INJECTION_SITES[0]);
   const [suggestedSite, setSuggestedSite] = useState(INJECTION_SITES[0]);
   ```

4. Update the form select rendering (around line 80-90):
   ```typescript
   // BEFORE
   {VALID_SITES.map((s) => (
     <option key={s.value} value={s.value}>
       {s.label}
     </option>
   ))}

   // AFTER
   {getInjectionSiteOptions().map((s) => (
     <option key={s.value} value={s.value}>
       {s.label}
       {s.value === suggestedSite ? ' (Suggested)' : ''}
     </option>
   ))}
   ```

5. Update the useEffect that fetches suggested site (around line 35-50):
   ```typescript
   // Find the line that calls a local getSuggestedSite function
   // Replace with the imported one:
   const suggested = getSuggestedSite(data.injectionSite);
   ```

---

### Issue #2: Onboarding validation mismatch
**Severity:** 🚨 Critical - Blocking
**File:** `src/lib/validations/onboarding.ts`
**Lines:** 8-15

**Problem:**
The onboarding schema validates against the old format, but the API now expects the new format. This creates a validation mismatch.

Current code:
```typescript
const INJECTION_SITES = [
  'abdomen_left',
  'abdomen_right',
  'thigh_left',
  'thigh_right',
  'arm_left',
  'arm_right',
] as const;
```

**Impact:**
New users completing onboarding will submit data in old format, which the API rejects. **Complete blocker for new user registration.**

**Fix Steps:**
1. Add import at top of file:
   ```typescript
   import { INJECTION_SITES, type InjectionSite } from '@/lib/utils/injection-logic';
   ```

2. Remove the local `INJECTION_SITES` constant (lines 8-15)

3. Remove the `INJECTION_SITE_LABELS` mapping (no longer needed)

4. Update the Zod schema (around line 25):
   ```typescript
   // BEFORE
   injectionSite: z.enum(INJECTION_SITES),

   // AFTER
   injectionSite: z.enum(INJECTION_SITES),
   // (This stays the same but now references the imported constant)
   ```

5. Update the type export:
   ```typescript
   // BEFORE
   export type InjectionSite = (typeof INJECTION_SITES)[number];

   // AFTER
   // Remove this line - use the imported InjectionSite type instead
   ```

**Verification:**
After this fix, the validation schema will match exactly what the API expects.

---

### Issue #3: OnboardingForm & OnboardingCardFlow use old defaults
**Severity:** 🚨 Critical - Blocking
**Files:**
- `src/components/onboarding/OnboardingForm.tsx` (line 22)
- `src/components/onboarding/OnboardingCardFlow.tsx` (line 218)

**Problem:**
Both components default to `'abdomen_left'` which will fail the new API validation.

**Impact:**
Even after fixing Issue #2, the forms will try to submit old format data.

**Fix Steps for OnboardingForm.tsx:**
1. Add import at top:
   ```typescript
   import { INJECTION_SITES } from '@/lib/utils/injection-logic';
   ```

2. Find line 22 (or search for `abdomen_left`):
   ```typescript
   // BEFORE
   injectionSite: 'abdomen_left',

   // AFTER
   injectionSite: INJECTION_SITES[0],
   ```

**Fix Steps for OnboardingCardFlow.tsx:**
1. Add import at top:
   ```typescript
   import { INJECTION_SITES } from '@/lib/utils/injection-logic';
   ```

2. Find line 218 (or search for `abdomen_left`):
   ```typescript
   // BEFORE
   injectionSite: 'abdomen_left',

   // AFTER
   injectionSite: INJECTION_SITES[0],
   ```

**Note:** These fixes depend on Issue #2 being fixed first (the validation schema must accept the new format).

---

### Issue #4: Incomplete backward compatibility mapping
**Severity:** ⚠️ Medium - Data Inconsistency
**Files:**
- `src/components/jabs/InjectionHistoryItem.tsx` (lines 24-25)
- Potentially: `src/components/calendar/DayDetail.tsx`

**Problem:**
The backward compatibility mapping has:
```typescript
arm_left: 'Arm - Left',
arm_right: 'Arm - Right',
```

But should be:
```typescript
arm_left: 'Upper Arm - Left',
arm_right: 'Upper Arm - Right',
```

This doesn't match the canonical format in `INJECTION_SITES`.

**Impact:**
Legacy data for arm injections will display "Arm - Left" instead of "Upper Arm - Left", causing inconsistent labels across the UI.

**Fix Steps for InjectionHistoryItem.tsx:**
1. Find the `formatSite()` function or site mapping object (around lines 24-25)

2. Update the mapping:
   ```typescript
   // BEFORE
   arm_left: 'Arm - Left',
   arm_right: 'Arm - Right',

   // AFTER
   arm_left: 'Upper Arm - Left',
   arm_right: 'Upper Arm - Right',
   ```

**Fix Steps for DayDetail.tsx (if it exists):**
1. Search for `arm_left` or `arm_right` in the file
2. Apply the same mapping fix as above

**Verification:**
Search across all files for `'Arm - Left'` and `'Arm - Right'` (without "Upper") to ensure consistency.

---

### Issue #5: Missing migration/backward compatibility tests
**Severity:** ⚠️ Medium - Technical Debt
**Files:** Need to create/update test files

**Problem:**
No tests verify that:
1. Old format data is rejected by the API
2. Old format data displays correctly via backward compatibility
3. New format flows work end-to-end (onboarding → injection → rotation)

**Impact:**
Risk of regression in future changes, no safety net for format migration logic.

**Fix Steps:**

#### A. Update API Route Tests
**File:** `src/app/api/injections/__tests__/route.api.test.ts`

Add these test cases:

```typescript
describe('POST /api/injections - Site Format Validation', () => {
  it('rejects old format injection sites', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'test-user-id' } });

    const oldFormatSites = ['abdomen', 'thigh_left', 'thigh_right', 'arm_left', 'arm_right'];

    for (const site of oldFormatSites) {
      const request = new Request('http://localhost:3000/api/injections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ doseMg: '5', injectionSite: site }),
      });
      const response = await POST(request);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe('Validation failed');
    }
  });

  it('accepts all new format injection sites', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'test-user-id' } });

    const newFormatSites = [
      'Abdomen - Left',
      'Abdomen - Right',
      'Thigh - Left',
      'Thigh - Right',
      'Upper Arm - Left',
      'Upper Arm - Right',
    ];

    for (const site of newFormatSites) {
      mockReturning.mockResolvedValue([{
        id: 'test-id',
        userId: 'test-user-id',
        doseMg: '5',
        injectionSite: site,
        injectionDate: new Date(),
        batchNumber: null,
        notes: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }]);

      const request = new Request('http://localhost:3000/api/injections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ doseMg: '5', injectionSite: site }),
      });
      const response = await POST(request);

      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data.injectionSite).toBe(site);
    }
  });
});
```

#### B. Create Component Tests
**File:** `src/components/jabs/__tests__/LastInjectionHeroCard.test.tsx` (create new)

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LastInjectionHeroCard } from '../LastInjectionHeroCard';

describe('LastInjectionHeroCard - Backward Compatibility', () => {
  it('displays legacy abdomen format correctly', () => {
    render(
      <LastInjectionHeroCard
        date={new Date('2026-01-04')}
        daysAgo={0}
        weekNumber={2}
        doseMg={2.5}
        phase={1}
        site="abdomen"
        suggestedSite="Abdomen - Right"
      />
    );

    expect(screen.getByText('Abdomen')).toBeInTheDocument();
    expect(screen.getByText('Next: Abdomen - Right')).toBeInTheDocument();
  });

  it('displays legacy arm format with Upper prefix', () => {
    render(
      <LastInjectionHeroCard
        date={new Date('2026-01-04')}
        daysAgo={0}
        weekNumber={2}
        doseMg={2.5}
        phase={1}
        site="arm_left"
        suggestedSite="Upper Arm - Right"
      />
    );

    expect(screen.getByText('Upper Arm - Left')).toBeInTheDocument();
  });

  it('displays new format without modification', () => {
    render(
      <LastInjectionHeroCard
        date={new Date('2026-01-04')}
        daysAgo={0}
        weekNumber={2}
        doseMg={2.5}
        phase={1}
        site="Abdomen - Left"
        suggestedSite="Abdomen - Right"
      />
    );

    expect(screen.getByText('Abdomen - Left')).toBeInTheDocument();
    expect(screen.getByText('Next: Abdomen - Right')).toBeInTheDocument();
  });
});
```

#### C. Create E2E Integration Test
**File:** `e2e/onboarding-to-injection-flow.spec.ts` (create new)

```typescript
import { test, expect } from '@playwright/test';

test.describe('Onboarding to Injection Flow', () => {
  test('completes onboarding and logs first injection with new format', async ({ page }) => {
    // 1. Complete onboarding
    await page.goto('/onboarding');

    // Fill out form (adjust selectors as needed)
    await page.fill('input[name="startingWeight"]', '200');
    await page.fill('input[name="goalWeight"]', '180');
    await page.selectOption('select[name="injectionSite"]', 'Abdomen - Left');
    await page.fill('input[name="firstInjectionDate"]', '2026-01-04');
    await page.selectOption('select[name="startingDose"]', '2.5');

    await page.click('button[type="submit"]');

    // 2. Verify redirected to summary
    await expect(page).toHaveURL('/summary');

    // 3. Navigate to jabs page
    await page.goto('/jabs');

    // 4. Verify suggested site is correct (should be Abdomen - Right)
    await expect(page.locator('text=Next: Abdomen - Right')).toBeVisible();

    // 5. Log second injection via modal
    await page.click('button:has-text("Log Injection")');
    await page.selectOption('select[name="site"]', 'Abdomen - Right');
    await page.click('button:has-text("Save")');

    // 6. Verify injection was logged
    await expect(page.locator('text=Abdomen - Right')).toBeVisible();

    // 7. Verify next suggested site rotated (should be Thigh - Left)
    await expect(page.locator('text=Next: Thigh - Left')).toBeVisible();
  });
});
```

---

## Implementation Order & Dependencies

```
Phase 1: Critical Path (MUST BE DONE IN ORDER)
┌──────────────────────────────────────────────────┐
│ Step 1: Fix Issue #2 (Onboarding Validation)    │ ← Start here
│         File: src/lib/validations/onboarding.ts  │
│         Time: 10 minutes                         │
└──────────────────────────────────────────────────┘
                        ↓
┌──────────────────────────────────────────────────┐
│ Step 2: Fix Issue #3 (Onboarding Forms)         │ ← Depends on Step 1
│         Files: OnboardingForm.tsx                │
│                OnboardingCardFlow.tsx            │
│         Time: 15 minutes                         │
└──────────────────────────────────────────────────┘
                        ↓
┌──────────────────────────────────────────────────┐
│ Step 3: Fix Issue #1 (LogInjectionModal)        │ ← Can do after Step 1
│         File: LogInjectionModal.tsx              │
│         Time: 20 minutes                         │
└──────────────────────────────────────────────────┘

Phase 2: Data Quality (Can be done in parallel with Phase 1)
┌──────────────────────────────────────────────────┐
│ Step 4: Fix Issue #4 (Backward Compatibility)   │ ← Independent
│         Files: InjectionHistoryItem.tsx          │
│                DayDetail.tsx (if exists)         │
│         Time: 10 minutes                         │
└──────────────────────────────────────────────────┘

Phase 3: Testing (After all fixes complete)
┌──────────────────────────────────────────────────┐
│ Step 5: Add Issue #5 (Tests)                    │ ← After all fixes
│         Files: Create/update test files          │
│         Time: 1 hour                             │
└──────────────────────────────────────────────────┘
```

**Total Estimated Time:** 2-3 hours

---

## Verification Checklist

After implementing all fixes, verify:

### Functional Testing
- [ ] Navigate to `/register` → Complete onboarding → No errors
- [ ] Click "Log Injection" button → Submit form → Injection saved successfully
- [ ] Check Jabs page → Suggested site shows correct format
- [ ] Check Summary page → Suggested site shows correct format
- [ ] Log 3 injections in sequence → Verify site rotation works
- [ ] Check injection history → All sites display with consistent labels

### Unit Testing
- [ ] Run `pnpm test:run` → All tests pass
- [ ] Check test output → New format validation tests pass
- [ ] Check test output → Backward compatibility tests pass

### E2E Testing
- [ ] Run `pnpm test:e2e` → Onboarding flow test passes
- [ ] Verify test creates injection with new format
- [ ] Verify test confirms site rotation

### Code Quality
- [ ] Run `pnpm lint` → No new errors
- [ ] Run `pnpm tsc --noEmit` → No type errors
- [ ] Check browser console → No validation errors

### Edge Cases
- [ ] User with existing old format data → Displays correctly
- [ ] User logs injection with each of 6 sites → All display correctly
- [ ] Complete full rotation (6 injections) → Returns to first site

---

## Rollback Plan

If critical issues are discovered after merge:

1. **Immediate:** Revert PR #12
   ```bash
   git revert <commit-hash>
   git push origin main
   ```

2. **Database:** Old format data will still work (backward compatibility preserved)

3. **Fix Forward:** Apply fixes from this document in a new PR

---

## Additional Notes

### Why These Issues Weren't Caught in PR #12
1. Modal component not tested manually (hidden behind button click)
2. Onboarding flow skipped during testing (existing user account used)
3. Backward compatibility mapping inconsistency (cosmetic, low priority)
4. Test coverage gaps (technical debt)

### Lessons Learned
1. Always test all user flows, not just the main path
2. Search for ALL usages of old format before marking as complete
3. Add tests for format migrations proactively
4. Use global search to find hardcoded format patterns

---

## Contact & References

- **PR:** https://github.com/dctmfoo/tirzepatide-tracker/pull/12
- **Original Issue:** Injection site tracking broken, showing wrong suggestions
- **Related Files:** See "Issues Breakdown" section for complete file list
- **Injection Sites Source of Truth:** `src/lib/utils/injection-logic.ts:12-19`

---

**Document Version:** 1.0
**Last Updated:** 2026-01-05
**Status:** Ready for Implementation
