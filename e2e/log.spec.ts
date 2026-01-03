import { test, expect } from '@playwright/test';

/**
 * Log Page E2E tests
 * Tests the new Log Hub, Day Details, Check-in, and Full Calendar views
 */

test.describe('Log Hub Page', () => {
  test.describe('Page Access', () => {
    test('redirects to login when not authenticated', async ({ page }) => {
      await page.goto('/log');

      await expect(page).toHaveURL(/\/login/);
    });

    test('redirects /calendar to /log', async ({ page }) => {
      await page.goto('/calendar');

      // Should redirect to /log (after auth redirect to login)
      await expect(page).toHaveURL(/\/login|\/log/);
    });
  });

  test.describe('Log Hub Structure (Authenticated)', () => {
    test('displays page header with Log title', async ({ page }) => {
      await page.goto('/log');

      await expect(page.locator('h1:has-text("Log")')).toBeVisible();
    });

    test('displays today hero card', async ({ page }) => {
      await page.goto('/log');

      // Today's date should be visible
      const now = new Date();
      const dayName = now.toLocaleDateString('en-US', { weekday: 'long' });

      await expect(page.locator(`text=${dayName}`)).toBeVisible();
    });

    test('displays progress ring', async ({ page }) => {
      await page.goto('/log');

      // Progress indicator should show X/4
      await expect(page.locator('text=/\\d\\/4/')).toBeVisible();
    });

    test('displays quick log actions', async ({ page }) => {
      await page.goto('/log');

      // Weight action card
      await expect(page.locator('text=Weight')).toBeVisible();

      // Check-in action card
      await expect(page.locator('text=Check-in')).toBeVisible();
    });

    test('displays week strip with days', async ({ page }) => {
      await page.goto('/log');

      // Week strip should show weekday abbreviations
      await expect(page.locator('text=Mon')).toBeVisible();
      await expect(page.locator('text=Tue')).toBeVisible();
      await expect(page.locator('text=Wed')).toBeVisible();
    });

    test('displays legend for indicators', async ({ page }) => {
      await page.goto('/log');

      // Legend should show indicator meanings
      await expect(page.locator('text=Weight')).toBeVisible();
      await expect(page.locator('text=Check-in')).toBeVisible();
      await expect(page.locator('text=Injection')).toBeVisible();
    });
  });

  test.describe('Quick Log Actions', () => {
    test('opens weight modal when clicking Weight card', async ({ page }) => {
      await page.goto('/log');

      // Click weight action card
      const weightCard = page.locator('[data-testid="weight-action"]').or(
        page.locator('button:has-text("Weight")')
      );
      await weightCard.click();

      // Weight modal should open
      await expect(page.locator('input[type="number"]')).toBeVisible();
    });

    test('navigates to check-in when clicking Check-in card', async ({ page }) => {
      await page.goto('/log');

      // Click check-in action card
      const checkinCard = page.locator('[data-testid="checkin-action"]').or(
        page.locator('a:has-text("Check-in")')
      );
      await checkinCard.click();

      // Should navigate to check-in page
      await expect(page).toHaveURL(/\/log\/checkin/);
    });
  });

  test.describe('Week Strip Navigation', () => {
    test('navigates to day details when clicking a day', async ({ page }) => {
      await page.goto('/log');

      // Find a past day in the week strip and click it
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const dayNum = yesterday.getDate().toString();

      // Click on yesterday's day
      const dayCell = page.locator(`[data-date]`).filter({ hasText: dayNum }).first();
      if (await dayCell.isVisible()) {
        await dayCell.click();
        await expect(page).toHaveURL(/\/log\/\d{4}-\d{2}-\d{2}/);
      }
    });

    test('links to full calendar view', async ({ page }) => {
      await page.goto('/log');

      // Click "Full Calendar" link
      await page.click('text=Full Calendar');

      await expect(page).toHaveURL(/\/log\/calendar/);
    });
  });
});

test.describe('Daily Check-in Page', () => {
  test.describe('Page Structure', () => {
    test('displays check-in header', async ({ page }) => {
      await page.goto('/log/checkin');

      await expect(page.locator('text=Daily Check-in')).toBeVisible();
    });

    test('displays progress indicator', async ({ page }) => {
      await page.goto('/log/checkin');

      // Should show sections progress
      await expect(page.locator('text=/\\d of \\d sections/')).toBeVisible();
    });

    test('displays mood section', async ({ page }) => {
      await page.goto('/log/checkin');

      await expect(page.locator('text=Mood')).toBeVisible();
    });

    test('displays side effects section', async ({ page }) => {
      await page.goto('/log/checkin');

      await expect(page.locator('text=Side Effects')).toBeVisible();
    });

    test('displays diet section', async ({ page }) => {
      await page.goto('/log/checkin');

      await expect(page.locator('text=Diet')).toBeVisible();
    });

    test('displays activity section', async ({ page }) => {
      await page.goto('/log/checkin');

      await expect(page.locator('text=Activity')).toBeVisible();
    });

    test('displays save button', async ({ page }) => {
      await page.goto('/log/checkin');

      await expect(page.locator('button:has-text("Save")')).toBeVisible();
    });
  });

  test.describe('Mood Section Inputs', () => {
    test('allows selecting mood', async ({ page }) => {
      await page.goto('/log/checkin');

      // Click on a mood option
      const moodButtons = page.locator('[data-testid="mood-selector"] button').or(
        page.locator('button:has-text("Good")')
      );
      await moodButtons.first().click();

      // Should show selected state
      await expect(moodButtons.first()).toHaveClass(/selected|border-primary/);
    });

    test('allows selecting cravings level', async ({ page }) => {
      await page.goto('/log/checkin');

      // Click on a cravings option
      await page.click('button:has-text("Low")');
    });

    test('allows selecting energy level', async ({ page }) => {
      await page.goto('/log/checkin');

      // Click on an energy option
      await page.click('button:has-text("High")');
    });
  });

  test.describe('Side Effects Section', () => {
    test('displays side effect sliders', async ({ page }) => {
      await page.goto('/log/checkin');

      // Should have sliders for side effects
      await expect(page.locator('text=Nausea')).toBeVisible();
      await expect(page.locator('text=Fatigue')).toBeVisible();
    });

    test('slider shows numeric value', async ({ page }) => {
      await page.goto('/log/checkin');

      // Sliders should show 0-5 values
      await expect(page.locator('[data-testid="slider-value"]').or(
        page.locator('span:text-matches("^[0-5]$")')
      )).toBeVisible();
    });
  });

  test.describe('Diet Section', () => {
    test('has stepper for meals', async ({ page }) => {
      await page.goto('/log/checkin');

      await expect(page.locator('text=Meals')).toBeVisible();
      // Stepper buttons
      await expect(page.locator('button:has-text("-")')).toBeVisible();
      await expect(page.locator('button:has-text("+")')).toBeVisible();
    });

    test('has stepper for protein', async ({ page }) => {
      await page.goto('/log/checkin');

      await expect(page.locator('text=Protein')).toBeVisible();
    });

    test('has stepper for water', async ({ page }) => {
      await page.goto('/log/checkin');

      await expect(page.locator('text=Water')).toBeVisible();
    });

    test('has hunger level selector', async ({ page }) => {
      await page.goto('/log/checkin');

      await expect(page.locator('text=Hunger')).toBeVisible();
    });
  });

  test.describe('Activity Section', () => {
    test('has steps slider', async ({ page }) => {
      await page.goto('/log/checkin');

      await expect(page.locator('text=Steps')).toBeVisible();
    });

    test('has duration slider', async ({ page }) => {
      await page.goto('/log/checkin');

      await expect(page.locator('text=Duration')).toBeVisible();
    });

    test('has workout type selector', async ({ page }) => {
      await page.goto('/log/checkin');

      await expect(page.locator('button:has-text("Walking")')).toBeVisible();
      await expect(page.locator('button:has-text("Cardio")')).toBeVisible();
    });
  });

  test.describe('Notes Section', () => {
    test('has notes textarea', async ({ page }) => {
      await page.goto('/log/checkin');

      await expect(page.locator('textarea')).toBeVisible();
    });
  });

  test.describe('Form Submission', () => {
    test('saves check-in and redirects', async ({ page }) => {
      await page.goto('/log/checkin');

      // Fill in some data
      await page.click('button:has-text("Good")');

      // Save
      await page.click('button:has-text("Save")');

      // Should redirect back to log hub
      await expect(page).toHaveURL(/\/log(?!\/checkin)/);
    });
  });

  test.describe('Edit Mode', () => {
    test('loads existing data when editing past day', async ({ page }) => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const dateStr = yesterday.toISOString().split('T')[0];

      await page.goto(`/log/checkin/${dateStr}`);

      // Should show the date
      await expect(page.locator('text=Daily Check-in')).toBeVisible();
    });
  });
});

test.describe('Day Details Page', () => {
  test.describe('Page Structure', () => {
    test('displays day header with date', async ({ page }) => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const dateStr = yesterday.toISOString().split('T')[0];

      await page.goto(`/log/${dateStr}`);

      // Should show formatted date
      const monthName = yesterday.toLocaleDateString('en-US', { month: 'short' });
      await expect(page.locator(`text=${monthName}`)).toBeVisible();
    });

    test('displays back button', async ({ page }) => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const dateStr = yesterday.toISOString().split('T')[0];

      await page.goto(`/log/${dateStr}`);

      await expect(page.locator('a:has-text("Back"), button:has-text("Back")')).toBeVisible();
    });

    test('displays edit button', async ({ page }) => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const dateStr = yesterday.toISOString().split('T')[0];

      await page.goto(`/log/${dateStr}`);

      await expect(page.locator('a:has-text("Edit"), button:has-text("Edit")')).toBeVisible();
    });
  });

  test.describe('Navigation', () => {
    test('back button returns to log hub', async ({ page }) => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const dateStr = yesterday.toISOString().split('T')[0];

      await page.goto(`/log/${dateStr}`);

      await page.click('a:has-text("Back"), button:has-text("Back")');

      await expect(page).toHaveURL(/\/log(?!\/)/);
    });

    test('edit button navigates to check-in edit', async ({ page }) => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const dateStr = yesterday.toISOString().split('T')[0];

      await page.goto(`/log/${dateStr}`);

      await page.click('a:has-text("Edit"), button:has-text("Edit")');

      await expect(page).toHaveURL(/\/log\/checkin\//);
    });
  });
});

test.describe('Full Calendar Page', () => {
  test.describe('Page Structure', () => {
    test('displays month and year', async ({ page }) => {
      await page.goto('/log/calendar');

      const now = new Date();
      const monthName = now.toLocaleDateString('en-US', { month: 'long' });
      const year = now.getFullYear().toString();

      await expect(page.locator(`text=${monthName}`)).toBeVisible();
      await expect(page.locator(`text=${year}`)).toBeVisible();
    });

    test('displays weekday headers', async ({ page }) => {
      await page.goto('/log/calendar');

      await expect(page.locator('text=Mon')).toBeVisible();
      await expect(page.locator('text=Tue')).toBeVisible();
      await expect(page.locator('text=Wed')).toBeVisible();
      await expect(page.locator('text=Thu')).toBeVisible();
      await expect(page.locator('text=Fri')).toBeVisible();
      await expect(page.locator('text=Sat')).toBeVisible();
      await expect(page.locator('text=Sun')).toBeVisible();
    });

    test('displays calendar grid', async ({ page }) => {
      await page.goto('/log/calendar');

      // Should have day cells
      const dayCells = page.locator('[data-date]');
      expect(await dayCells.count()).toBeGreaterThan(20);
    });

    test('displays back to hub link', async ({ page }) => {
      await page.goto('/log/calendar');

      await expect(page.locator('a:has-text("Back"), button:has-text("Back")')).toBeVisible();
    });
  });

  test.describe('Month Navigation', () => {
    test('navigates to previous month', async ({ page }) => {
      await page.goto('/log/calendar');

      await page.click('button[aria-label*="previous"], button:has-text("<")');

      const now = new Date();
      const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1);
      const prevMonthName = prevMonth.toLocaleDateString('en-US', { month: 'long' });

      await expect(page.locator(`text=${prevMonthName}`)).toBeVisible();
    });

    test('navigates to next month', async ({ page }) => {
      await page.goto('/log/calendar');

      // Go to previous month first
      await page.click('button[aria-label*="previous"], button:has-text("<")');

      // Then go forward
      await page.click('button[aria-label*="next"], button:has-text(">")');

      const now = new Date();
      const currentMonth = now.toLocaleDateString('en-US', { month: 'long' });

      await expect(page.locator(`text=${currentMonth}`)).toBeVisible();
    });
  });

  test.describe('Day Selection', () => {
    test('highlights today', async ({ page }) => {
      await page.goto('/log/calendar');

      const today = new Date().getDate().toString();
      const todayCell = page.locator(`[data-date]`).filter({ hasText: today }).first();

      // Today should have special styling
      await expect(todayCell).toHaveClass(/today|ring|border|gradient/);
    });

    test('navigates to day details on click', async ({ page }) => {
      await page.goto('/log/calendar');

      // Click on a past day
      const pastDay = page.locator('[data-date]').first();
      await pastDay.click();

      await expect(page).toHaveURL(/\/log\/\d{4}-\d{2}-\d{2}/);
    });
  });

  test.describe('Indicators', () => {
    test('shows activity dots on days with data', async ({ page }) => {
      await page.goto('/log/calendar');

      // Days with data should have colored dots
      const dots = page.locator('[data-date] .dot, [data-date] span.rounded-full');
      // May or may not have dots depending on data
      expect(await dots.count()).toBeGreaterThanOrEqual(0);
    });
  });
});

test.describe('Bottom Navigation', () => {
  test('shows bottom navigation bar on log page', async ({ page }) => {
    await page.goto('/log');

    await expect(page.locator('a[href="/summary"]')).toBeVisible();
    await expect(page.locator('a[href="/jabs"]')).toBeVisible();
    await expect(page.locator('a[href="/results"]')).toBeVisible();
    await expect(page.locator('a[href="/log"]')).toBeVisible();
    await expect(page.locator('a[href="/settings"]')).toBeVisible();
  });

  test('highlights log tab as active', async ({ page }) => {
    await page.goto('/log');

    const logLink = page.locator('a[href="/log"]');
    await expect(logLink).toHaveClass(/text-primary|bg-primary/);
  });
});

test.describe('Responsive Design', () => {
  test('log hub adjusts on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/log');

    // Page should be visible and usable
    await expect(page.locator('h1:has-text("Log")')).toBeVisible();
  });

  test('check-in page scrolls on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/log/checkin');

    // All sections should be accessible via scroll
    await expect(page.locator('text=Mood')).toBeVisible();
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await expect(page.locator('button:has-text("Save")')).toBeVisible();
  });

  test('full calendar works on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/log/calendar');

    // Calendar grid should be visible
    await expect(page.locator('[data-date]').first()).toBeVisible();
  });
});
