import { test, expect } from '@playwright/test';

/**
 * Example E2E test file
 * E2E tests require the app to be running and a test database
 *
 * Run with: pnpm test:e2e
 */

test.describe('App Health Check', () => {
  test('homepage loads', async ({ page }) => {
    await page.goto('/');

    // Check that the page loaded (this will redirect to login or show app)
    await expect(page).toHaveURL(/\/(login|summary)?/);
  });

  test('login page is accessible', async ({ page }) => {
    await page.goto('/login');

    // Check that login form elements exist
    await expect(page.locator('form')).toBeVisible();
  });
});

// TODO: Add more E2E tests as UI pages are implemented
// - Onboarding flow tests
// - Weight logging tests
// - Injection logging tests
// - Results dashboard tests
// - Calendar tests
// - Settings tests
// - PWA offline tests
