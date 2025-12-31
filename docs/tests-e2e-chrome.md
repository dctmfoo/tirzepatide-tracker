# E2E Chrome Testing - Bug Report Log

**Test Data:** `e2e/test-journey-12-weeks.json`
**Instructions:** `e2e/E2E-TESTING-INSTRUCTIONS.md`
**Target URL:** https://mj-tracker-xi.vercel.app

---

## Test Session Summary

| Session | Date | Batches Completed | Bugs Found | Status |
|---------|------|-------------------|------------|--------|
| 1 | 2025-12-31 | Setup + W1 D1-3 | 1 | Paused for review |

---

## Bug Statistics

| Severity | Count | Fixed | Open |
|----------|-------|-------|------|
| Critical | 0 | 0 | 0 |
| High | 0 | 0 | 0 |
| Medium | 1 | 1 | 0 |
| Low | 0 | 0 | 0 |
| **Total** | **1** | **1** | **0** |

---

## Bugs

<!--
Bug Template:

### Bug #X: [Short Title]
- **Batch:** Week X, Day Y
- **Page:** /page-name
- **Severity:** Critical | High | Medium | Low
- **Steps to Reproduce:**
  1. Step one
  2. Step two
- **Expected:** What should happen
- **Actual:** What actually happened
- **Screenshot:** [filename if taken]
- **Status:** Open | Investigating | Fixed | Won't Fix
- **Resolution:** (if fixed) Description of fix
-->

### Bug #1: Side Effect Type Change Causes Validation Failure
- **Batch:** Week 1, Day 3
- **Page:** /log
- **Severity:** Medium
- **Steps to Reproduce:**
  1. Navigate to /log page
  2. Add a side effect (e.g., select "Nausea" with "Mild" severity)
  3. Save the daily log - works correctly
  4. Return to /log page (form pre-populates with saved data)
  5. Change the side effect type from "Nausea" to "Fatigue"
  6. Click "Save Daily Log"
- **Expected:** Form should save with the updated side effect type
- **Actual:** "Validation failed" error appears, even though all sections show green checkmarks
- **Workaround:** Remove the side effect (click X), then re-add it with the new type
- **Status:** Fixed
- **Root Cause:** When loading side effects from the database, the `notes` field returned as `null`. When saving, this `null` value was sent to the API. The Zod validation schema used `z.string().optional()` which only accepts `string | undefined`, NOT `null`. This caused validation to fail on subsequent saves.
- **Resolution:**
  1. Updated `/log` page to convert `null` to `undefined` when preparing request body, and filter out incomplete side effects (those without a type selected)
  2. Updated API validation schemas in `/api/daily-logs/route.ts` and `/api/daily-logs/[date]/route.ts` to use `.nullable().optional()` to accept both `null` and `undefined`
  3. Added `.min(1)` validation to `effectType` to prevent empty strings
- **Fixed In:** `src/app/(app)/log/page.tsx:197-209`, `src/app/api/daily-logs/route.ts:8-12`, `src/app/api/daily-logs/[date]/route.ts:7-12`

---

## UX Observations

<!--
Not bugs, but observations about user experience that could be improved.
Format:
- **Page:** /page-name
- **Observation:** What was noticed
- **Suggestion:** Potential improvement
-->

### Observation #1: Daily Log Page Has No Date Picker
- **Page:** /log
- **Observation:** The /log page only allows logging for "today" - there's no date picker to log entries for past dates
- **Impact:** Makes historical data entry difficult; users must log each day on that specific day
- **Suggestion:** Add a date picker to allow backdating daily logs, or add a "Log for Date" option in the Calendar page

### Observation #2: Goal Progress Shows Rounded Current Weight
- **Page:** /summary
- **Observation:** Goal Progress bar shows "95kg" as current weight when actual current weight is 94.6kg
- **Impact:** Minor display inconsistency between "Current State" (94.6kg) and "Goal Progress" (95kg)
- **Suggestion:** Use same precision for weight display across all components

---

## Performance Notes

<!--
Track any slow pages or operations.
Format:
- **Page/Action:** What was slow
- **Time:** How long it took
- **Expected:** What's acceptable
-->

*No performance issues noted yet.*

---

## Session Logs

### Session 1
**Date:** 2025-12-31
**Tester:** AI Agent (Claude)
**Batches:**
- [x] Setup + Week 1 Days 1-3
- [ ] Week 1 Days 4-7

**Notes:**
- Successfully registered test account: testuser-e2e-20251231@example.com
- Completed onboarding with profile + first injection (Oct 6, 2025)
- Logged Day 1 weight (95.0 kg on Oct 6)
- Entered daily logs for Days 1-3 (note: /log page only supports today's date, so all logs saved as Dec 31)
- Weight entries correctly logged with historical dates (Oct 6: 95.0kg, Oct 8: 94.6kg)
- Found 1 bug: Side effect type change causes validation failure
- Found 2 UX observations: No date picker on /log, Goal Progress rounding issue

**Verification Checkpoints:**
- [x] Summary page shows correct current weight (94.6kg)
- [x] Results page shows chart with weight data points
- [x] Jabs page shows 1 injection (Oct 6, 2025)
- [x] Calendar shows injection/weight indicators on Oct 6

**PAUSED FOR REVIEW** - Awaiting approval to continue with Week 1 Days 4-7

---

## Changelog

| Date | Bug # | Change |
|------|-------|--------|
| 2025-12-31 | #1 | Bug reported: Side effect type change validation failure |
| 2025-12-31 | #1 | Bug fixed: null vs undefined mismatch in Zod validation |
