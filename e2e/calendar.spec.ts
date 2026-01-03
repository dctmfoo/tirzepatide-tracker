import { test, expect } from '@playwright/test';

/**
 * Calendar Page E2E tests
 * Tests that old /calendar route redirects to /log
 *
 * Note: Main calendar/log functionality tests are in log.spec.ts
 */

test.describe('Calendar Page Redirect', () => {
  test('redirects /calendar to /log (or login if not authenticated)', async ({ page }) => {
    await page.goto('/calendar');

    // Should redirect to /log or /login (if not authenticated)
    await expect(page).toHaveURL(/\/log|\/login/);
  });
});
