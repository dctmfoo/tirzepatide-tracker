# Mounjaro Tracker - E2E Testing Instructions

**Purpose:** Step-by-step guide for an AI agent to execute realistic end-to-end testing using browser automation.

**Data File:** `e2e/test-journey-12-weeks.json`

**Target URL:** https://mj-tracker-xi.vercel.app

---

## Session Structure

Testing is done in **small batches** (2-3 days at a time) to allow human review between sessions.

### Batch Sizes
- **Initial Setup:** Registration + Onboarding + Day 1 (first injection + weight + daily log)
- **Subsequent Batches:** 2-3 days per session
- **Week Boundaries:** Always pause at end of each week for summary review

---

## Phase 1: Account Setup (One-time)

### Step 1.1: Open Browser and Navigate
```
1. Get browser tab context (create new tab if needed)
2. Navigate to: https://mj-tracker-xi.vercel.app
3. Wait for page to load
4. Take screenshot: "01-landing-page.png"
```

### Step 1.2: Register New Account
```
1. Click "Register" or "Sign up" link
2. Wait for registration page to load
3. Fill in form:
   - Email: testuser-e2e-20251231@example.com
   - Password: TestMounjaro2025!
   - Confirm Password: TestMounjaro2025!
4. Click "Register" / "Sign up" button
5. Wait for redirect (should go to /onboarding)
6. Take screenshot: "02-after-register.png"
```

### Step 1.3: Complete Onboarding
```
1. Should be on /onboarding page
2. Fill in "About You" section:
   - Age: 32
   - Gender: Female
   - Height: 165 cm
3. Fill in "Goals" section:
   - Starting Weight: 95.0 kg
   - Goal Weight: 70.0 kg
   - Treatment Start Date: 2025-10-06
4. Fill in "First Injection" section:
   - Dose: 2.5 mg
   - Site: Abdomen - Left
   - Date: 2025-10-06
   - Time: 08:00
   - Notes: "First injection"
5. Click "Complete Setup" / "Get Started" button
6. Wait for redirect to /summary
7. Take screenshot: "03-after-onboarding.png"
```

**PAUSE FOR REVIEW:** Confirm registration and onboarding completed successfully.

---

## Phase 2: Daily Data Entry

### Entry Workflow Per Day

For each day in the test data, follow this sequence:

#### A. Weight Entry (if weight data exists for that day)
```
1. Navigate to /weight/new
2. Enter weight value (in kg)
3. Set date to the day's date
4. Add notes if provided
5. Click "Save" / "Log Weight"
6. Verify success (toast or redirect)
```

#### B. Daily Log Entry
```
1. Navigate to /log
2. Expand "Diet" section:
   - Hunger Level: [from data]
   - Meals Count: [from data]
   - Protein (g): [from data]
   - Water (L): [from data]
3. Expand "Activity" section:
   - Workout Type: [from data]
   - Duration (min): [from data] (if provided)
   - Steps: [from data]
4. Expand "Mental" section:
   - Motivation: [from data]
   - Cravings: [from data]
   - Mood: [from data]
5. Expand "Side Effects" section:
   - For each side effect: Add type and severity
6. Click "Save" / "Submit"
7. Verify success
```

#### C. Injection Entry (only on injection days - Day 1 of each week)
```
1. Navigate to /jabs/new
2. Select dose (tap the dose button, e.g., "2.5 mg")
3. Select injection site from dropdown
4. Set date and time
5. Add notes if provided
6. Click "Save" / "Log Injection"
7. Verify success
```

---

## Phase 3: Batch Execution Schedule

### Batch 1: Setup + Week 1, Days 1-3
```
Actions:
1. Register account (Step 1.2)
2. Complete onboarding (Step 1.3) - includes Day 1 injection + weight
3. Enter Day 1 daily log via /log
4. Enter Day 2: daily log only (no weight)
5. Enter Day 3: weight + daily log

Pause Point: Take screenshots of /summary and /results
```

### Batch 2: Week 1, Days 4-7
```
Actions:
1. Login if needed
2. Day 4: daily log only
3. Day 5: weight + daily log
4. Day 6: daily log only
5. Day 7: weight + daily log

Pause Point:
- Take screenshots of /summary, /results, /jabs, /calendar
- This completes Week 1
```

### Batch 3: Week 2, Days 1-3
```
Actions:
1. Day 1 (injection day): injection + weight + daily log
2. Day 2: daily log only
3. Day 3: weight + daily log

Pause Point: Screenshots
```

### Pattern for Remaining Weeks

Continue with 3-4 day batches:
- **Days 1-3** of each week
- **Days 4-7** of each week

Always pause at week boundaries for full review.

---

## Data Reference Quick Guide

### Dose Schedule
| Weeks | Dose |
|-------|------|
| 1-4 | 2.5 mg |
| 5-8 | 5.0 mg |
| 9-12 | 7.5 mg |

### Injection Days
- Always Day 1 of each week (Mondays)
- Site rotation: Abdomen-L → Abdomen-R → Thigh-L → Thigh-R → Arm-L → Arm-R → repeat

### Weight Entry Days
Typically: Day 1 (Mon), Day 3 (Wed), Day 5 (Fri), Day 7 (Sun)

### Hunger Level Values
`None` | `Low` | `Moderate` | `High` | `Intense`

### Motivation/Cravings/Mood Values
- Motivation: `Low` | `Medium` | `High`
- Cravings: `None` | `Low` | `Medium` | `High` | `Intense`
- Mood: `Poor` | `Fair` | `Good` | `Great` | `Excellent`

### Side Effect Severities
`Mild` | `Moderate` | `Severe`

### Common Side Effects in Data
- Nausea (especially after dose escalation)
- Fatigue (first few days of new dose)
- Constipation (occasional)
- Diarrhea (occasional after dose increase)

---

## Verification Checkpoints

After each batch, verify:

### Summary Page (/summary)
- [ ] Next Injection card shows correct due date
- [ ] Current weight displays correctly
- [ ] "Since last" shows accurate change
- [ ] Week summary shows logged data
- [ ] Recent activity shows latest entries

### Results Page (/results)
- [ ] Chart shows weight data points
- [ ] Dose-colored segments appear correctly
- [ ] Stats cards show accurate calculations
- [ ] Period filters work (1m, 3m, 6m, All)

### Jabs Page (/jabs)
- [ ] Total injections count is correct
- [ ] Current dose shows correctly
- [ ] Injection history lists all entries
- [ ] Dose change badges appear (e.g., "Dose Up")

### Calendar Page (/calendar)
- [ ] Navigate to correct month
- [ ] Day indicators show: 💉 (injection), ● (weight), · (daily log)
- [ ] Clicking a day shows correct entries

---

## Bug Reporting

**Bug Report File:** `docs/tests-e2e-chrome.md`

When encountering any bugs, issues, or unexpected behavior, the AI agent MUST document them in the bug report file using this format:

```markdown
### Bug #[number]: [Short Title]
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
```

### What to Report
- Form validation errors that don't match expected behavior
- UI elements not responding to clicks
- Data not saving correctly
- Incorrect calculations or displays
- Missing UI elements
- Broken navigation
- Slow or unresponsive pages (>3 seconds)
- Any crashes or error messages

### Severity Guide
| Severity | Definition |
|----------|------------|
| Critical | App crashes, data loss, cannot proceed |
| High | Major feature broken, workaround difficult |
| Medium | Feature partially works, workaround exists |
| Low | Minor visual issue, doesn't affect functionality |

---

## Error Handling

### If login fails
- Clear cookies/session
- Re-register with same credentials
- Continue from last successful batch

### If form submission fails
- Take screenshot of error
- Note the specific field/values
- Retry with corrected data
- Report issue if persistent

### If page doesn't load
- Wait 5 seconds, retry
- Take screenshot of error state
- Try navigating via bottom nav
- Report if still failing

---

## Screenshot Naming Convention

```
{batch}-{page}-{description}.png

Examples:
01-landing-page.png
02-after-register.png
03-after-onboarding.png
w1d3-summary-after-entry.png
w1d7-results-week-complete.png
w2d1-jabs-after-escalation.png
```

---

## Commands for AI Agent

Start a session by telling the agent:

```
"Execute E2E test batch: [batch description]"

Examples:
- "Execute E2E test batch: Setup + Week 1 Days 1-3"
- "Execute E2E test batch: Week 1 Days 4-7"
- "Execute E2E test batch: Week 2 Days 1-3"
- "Execute E2E test batch: Week 5 (dose escalation week)"
```

Resume after review:
```
"Continue E2E test from Week X, Day Y"
```

---

## Progress Tracking

| Batch | Dates | Status | Notes |
|-------|-------|--------|-------|
| Setup | - | ⬜ | Register + Onboard |
| W1 D1-3 | Oct 6-8 | ⬜ | First injection |
| W1 D4-7 | Oct 9-12 | ⬜ | Complete week 1 |
| W2 D1-3 | Oct 13-15 | ⬜ | Second injection |
| W2 D4-7 | Oct 16-19 | ⬜ | |
| W3 D1-3 | Oct 20-22 | ⬜ | |
| W3 D4-7 | Oct 23-26 | ⬜ | |
| W4 D1-3 | Oct 27-29 | ⬜ | |
| W4 D4-7 | Oct 30 - Nov 2 | ⬜ | Last 2.5mg week |
| W5 D1-3 | Nov 3-5 | ⬜ | **DOSE UP: 5.0mg** |
| W5 D4-7 | Nov 6-9 | ⬜ | |
| W6 D1-3 | Nov 10-12 | ⬜ | |
| W6 D4-7 | Nov 13-16 | ⬜ | |
| W7 D1-3 | Nov 17-19 | ⬜ | |
| W7 D4-7 | Nov 20-23 | ⬜ | |
| W8 D1-3 | Nov 24-26 | ⬜ | |
| W8 D4-7 | Nov 27-30 | ⬜ | Last 5.0mg week |
| W9 D1-3 | Dec 1-3 | ⬜ | **DOSE UP: 7.5mg** |
| W9 D4-7 | Dec 4-7 | ⬜ | |
| W10 D1-3 | Dec 8-10 | ⬜ | |
| W10 D4-7 | Dec 11-14 | ⬜ | |
| W11 D1-3 | Dec 15-17 | ⬜ | |
| W11 D4-7 | Dec 18-21 | ⬜ | |
| W12 D1-3 | Dec 22-24 | ⬜ | Holiday week |
| W12 D4-7 | Dec 25-28 | ⬜ | **FINAL** |

Status: ⬜ Not started | 🔄 In progress | ✅ Complete | ❌ Issues
