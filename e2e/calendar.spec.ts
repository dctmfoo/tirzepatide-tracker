import { test, expect } from '@playwright/test';

/**
 * Calendar Page E2E tests
 * Tests calendar view, day selection, and logging modals
 */

test.describe('Calendar Page', () => {
  test.describe('Page Access', () => {
    test('redirects to login when not authenticated', async ({ page }) => {
      await page.goto('/calendar');

      await expect(page).toHaveURL(/\/login/);
    });
  });

  // These tests require authentication
  test.describe('Page Structure (Authenticated)', () => {
    test('displays month navigation', async ({ page }) => {
      await page.goto('/calendar');

      // Navigation arrows
      await expect(page.locator('button:has-text("←"), button[aria-label*="previous"]')).toBeVisible();
      await expect(page.locator('button:has-text("→"), button[aria-label*="next"]')).toBeVisible();
    });

    test('displays current month and year', async ({ page }) => {
      await page.goto('/calendar');

      const now = new Date();
      const monthName = now.toLocaleDateString('en-US', { month: 'long' });
      const year = now.getFullYear().toString();

      await expect(page.locator(`text=${monthName}`)).toBeVisible();
      await expect(page.locator(`text=${year}`)).toBeVisible();
    });

    test('displays weekday headers', async ({ page }) => {
      await page.goto('/calendar');

      // Short weekday names
      await expect(page.locator('text=Mon')).toBeVisible();
      await expect(page.locator('text=Tue')).toBeVisible();
      await expect(page.locator('text=Wed')).toBeVisible();
      await expect(page.locator('text=Thu')).toBeVisible();
      await expect(page.locator('text=Fri')).toBeVisible();
      await expect(page.locator('text=Sat')).toBeVisible();
      await expect(page.locator('text=Sun')).toBeVisible();
    });

    test('displays calendar grid', async ({ page }) => {
      await page.goto('/calendar');

      // Calendar should have day cells
      const dayCells = page.locator('[data-date], .calendar-day');
      expect(await dayCells.count()).toBeGreaterThan(20); // At least 28 days in a month
    });

    test('displays legend', async ({ page }) => {
      await page.goto('/calendar');

      // Legend showing indicator meanings
      await expect(page.locator('text=💉')).toBeVisible(); // Injection indicator
      await expect(page.locator('text=●')).toBeVisible();  // Weight indicator
    });
  });

  test.describe('Month Navigation', () => {
    test('navigates to previous month', async ({ page }) => {
      await page.goto('/calendar');

      // Click previous month button
      await page.click('button:has-text("←"), button[aria-label*="previous"]');

      // Month should change to previous month
      const now = new Date();
      const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1);
      const prevMonthName = prevMonth.toLocaleDateString('en-US', { month: 'long' });

      await expect(page.locator(`text=${prevMonthName}`)).toBeVisible();
    });

    test('navigates to next month', async ({ page }) => {
      await page.goto('/calendar');

      // First go to previous month
      await page.click('button:has-text("←"), button[aria-label*="previous"]');

      // Then go forward
      await page.click('button:has-text("→"), button[aria-label*="next"]');

      // Should be back to current month
      const now = new Date();
      const currentMonth = now.toLocaleDateString('en-US', { month: 'long' });
      await expect(page.locator(`text=${currentMonth}`)).toBeVisible();
    });

    test('handles year rollover', async ({ page }) => {
      await page.goto('/calendar');

      // Navigate back 12 months to go to previous year
      for (let i = 0; i < 12; i++) {
        await page.click('button:has-text("←"), button[aria-label*="previous"]');
        await page.waitForTimeout(100); // Small delay between clicks
      }

      // Year should have changed
      const lastYear = new Date().getFullYear() - 1;
      await expect(page.locator(`text=${lastYear}`)).toBeVisible();
    });
  });

  test.describe('Day Selection', () => {
    test('highlights today', async ({ page }) => {
      await page.goto('/calendar');

      const today = new Date().getDate().toString();
      const todayCell = page.locator(`[data-date="${today}"], .calendar-day:has-text("${today}")`).first();

      // Today should have special styling (ring or highlight)
      await expect(todayCell).toHaveClass(/ring|border|today/);
    });

    test('selects a day when clicked', async ({ page }) => {
      await page.goto('/calendar');

      const dayToClick = '15';
      await page.click(`[data-date="${dayToClick}"], .calendar-day:has-text("${dayToClick}")`);

      // Day should be selected (accent background)
      const selectedDay = page.locator(`[data-date="${dayToClick}"], .calendar-day:has-text("${dayToClick}")`).first();
      await expect(selectedDay).toHaveClass(/bg-accent|selected/);
    });

    test('shows day detail panel when day is selected', async ({ page }) => {
      await page.goto('/calendar');

      await page.click('[data-date="15"], .calendar-day:has-text("15")');

      // Day detail panel should appear
      await expect(page.locator('[data-testid="day-detail"], .day-detail')).toBeVisible();
    });
  });

  test.describe('Day Detail Panel', () => {
    test('displays quick action buttons', async ({ page }) => {
      await page.goto('/calendar');
      await page.click('[data-date="15"], .calendar-day:has-text("15")');

      // Quick action buttons
      await expect(page.locator('button:has-text("Log Weight")')).toBeVisible();
      await expect(page.locator('button:has-text("Log Injection")')).toBeVisible();
      await expect(page.locator('button:has-text("Daily Log")')).toBeVisible();
    });

    test('shows entries for selected day', async ({ page }) => {
      await page.goto('/calendar');
      await page.click('[data-date="15"], .calendar-day:has-text("15")');

      // Entry list area should exist
      await expect(page.locator('[data-testid="day-entries"], .day-entries')).toBeVisible();
    });
  });

  test.describe('Log Weight Modal', () => {
    test('opens when clicking Log Weight button', async ({ page }) => {
      await page.goto('/calendar');
      await page.click('[data-date="15"], .calendar-day:has-text("15")');
      await page.click('button:has-text("Log Weight")');

      // Modal should open
      await expect(page.locator('h2:has-text("Log Weight"), text=Log Weight')).toBeVisible();
    });

    test('has weight input field', async ({ page }) => {
      await page.goto('/calendar');
      await page.click('[data-date="15"], .calendar-day:has-text("15")');
      await page.click('button:has-text("Log Weight")');

      await expect(page.locator('input[type="number"], input[name*="weight"]')).toBeVisible();
    });

    test('closes when clicking cancel or close', async ({ page }) => {
      await page.goto('/calendar');
      await page.click('[data-date="15"], .calendar-day:has-text("15")');
      await page.click('button:has-text("Log Weight")');

      // Close modal
      await page.click('button:has-text("Cancel"), button:has-text("✕")');

      // Modal should be closed
      await expect(page.locator('h2:has-text("Log Weight")')).not.toBeVisible();
    });
  });

  test.describe('Log Injection Modal', () => {
    test('opens when clicking Log Injection button', async ({ page }) => {
      await page.goto('/calendar');
      await page.click('[data-date="15"], .calendar-day:has-text("15")');
      await page.click('button:has-text("Log Injection")');

      await expect(page.locator('h2:has-text("Log Injection")')).toBeVisible();
    });

    test('has dose selection', async ({ page }) => {
      await page.goto('/calendar');
      await page.click('[data-date="15"], .calendar-day:has-text("15")');
      await page.click('button:has-text("Log Injection")');

      // Dose buttons should be visible
      await expect(page.locator('button:has-text("2.5 mg")')).toBeVisible();
    });
  });

  test.describe('Daily Log Modal', () => {
    test('opens when clicking Daily Log button', async ({ page }) => {
      await page.goto('/calendar');
      await page.click('[data-date="15"], .calendar-day:has-text("15")');
      await page.click('button:has-text("Daily Log")');

      await expect(page.locator('h2:has-text("Daily Log")')).toBeVisible();
    });
  });

  test.describe('Calendar Indicators', () => {
    test('shows injection indicator on injection days', async ({ page }) => {
      await page.goto('/calendar');

      // Look for injection emoji indicator (may or may not be visible depending on data)
      await expect(page.locator('.calendar-day:has-text("💉")').first()).toBeVisible();
    });

    test('shows weight indicator on weight log days', async ({ page }) => {
      await page.goto('/calendar');

      // Look for weight dot indicator (may or may not be visible depending on data)
      await expect(page.locator('.calendar-day:has-text("●")').first()).toBeVisible();
    });
  });

  test.describe('Bottom Navigation', () => {
    test('shows bottom navigation bar', async ({ page }) => {
      await page.goto('/calendar');

      await expect(page.locator('a[href="/summary"]')).toBeVisible();
      await expect(page.locator('a[href="/jabs"]')).toBeVisible();
      await expect(page.locator('a[href="/results"]')).toBeVisible();
      await expect(page.locator('a[href="/calendar"]')).toBeVisible();
      await expect(page.locator('a[href="/settings"]')).toBeVisible();
    });

    test('highlights calendar tab as active', async ({ page }) => {
      await page.goto('/calendar');

      const calendarLink = page.locator('a[href="/calendar"]');
      await expect(calendarLink).toHaveClass(/text-accent-primary|bg-accent-primary/);
    });
  });

  test.describe('Responsive Design', () => {
    test('calendar grid adjusts on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/calendar');

      // Calendar should still be visible and usable
      const calendarGrid = page.locator('.grid, [data-testid="calendar-grid"]');
      await expect(calendarGrid).toBeVisible();
    });
  });
});
