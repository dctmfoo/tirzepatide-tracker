import { test, expect } from '@playwright/test';

/**
 * Jabs (Injection Logging) E2E tests
 * Tests injection history viewing and logging functionality
 */

test.describe('Jabs Page', () => {
  test.describe('Page Structure (Unauthenticated)', () => {
    test('redirects to login when not authenticated', async ({ page }) => {
      await page.goto('/jabs');

      await expect(page).toHaveURL(/\/login/);
    });
  });

  // These tests require authentication - in a real scenario, you'd set up auth fixtures
  test.describe('Page Structure (Authenticated)', () => {
    test.skip('displays page header', async ({ page }) => {
      // This test is skipped without auth - would need login fixture
      await page.goto('/jabs');

      await expect(page.locator('h1')).toContainText('Jabs');
    });

    test.skip('displays stat cards grid', async ({ page }) => {
      await page.goto('/jabs');

      // Check for stat card labels
      await expect(page.locator('text=Total Injections')).toBeVisible();
      await expect(page.locator('text=Current Dose')).toBeVisible();
      await expect(page.locator('text=Weeks on Current Dose')).toBeVisible();
      await expect(page.locator('text=Next Due')).toBeVisible();
    });

    test.skip('displays injection history section', async ({ page }) => {
      await page.goto('/jabs');

      await expect(page.locator('h2:has-text("Injection History")')).toBeVisible();
    });

    test.skip('displays log injection button', async ({ page }) => {
      await page.goto('/jabs');

      const logButton = page.locator('button:has-text("Log Injection")');
      await expect(logButton).toBeVisible();
    });
  });

  test.describe('Log Injection Modal', () => {
    test.skip('opens modal when clicking log button', async ({ page }) => {
      await page.goto('/jabs');

      await page.click('button:has-text("Log Injection")');

      // Modal should be visible
      await expect(page.locator('h2:has-text("Log Injection")')).toBeVisible();
    });

    test.skip('displays dose selection grid', async ({ page }) => {
      await page.goto('/jabs');
      await page.click('button:has-text("Log Injection")');

      // Check for dose buttons
      await expect(page.locator('button:has-text("2.5 mg")')).toBeVisible();
      await expect(page.locator('button:has-text("5 mg")')).toBeVisible();
      await expect(page.locator('button:has-text("7.5 mg")')).toBeVisible();
      await expect(page.locator('button:has-text("10 mg")')).toBeVisible();
      await expect(page.locator('button:has-text("12.5 mg")')).toBeVisible();
      await expect(page.locator('button:has-text("15 mg")')).toBeVisible();
    });

    test.skip('displays site selection dropdown', async ({ page }) => {
      await page.goto('/jabs');
      await page.click('button:has-text("Log Injection")');

      const siteSelect = page.locator('select').filter({ hasText: 'Abdomen' });
      await expect(siteSelect).toBeVisible();
    });

    test.skip('displays date/time input', async ({ page }) => {
      await page.goto('/jabs');
      await page.click('button:has-text("Log Injection")');

      const dateInput = page.locator('input[type="datetime-local"]');
      await expect(dateInput).toBeVisible();
    });

    test.skip('displays notes textarea', async ({ page }) => {
      await page.goto('/jabs');
      await page.click('button:has-text("Log Injection")');

      const notesInput = page.locator('textarea');
      await expect(notesInput).toBeVisible();
    });

    test.skip('closes modal when clicking close button', async ({ page }) => {
      await page.goto('/jabs');
      await page.click('button:has-text("Log Injection")');

      // Click close button (✕)
      await page.click('button:has-text("✕")');

      // Modal should be hidden
      await expect(page.locator('h2:has-text("Log Injection")')).not.toBeVisible();
    });

    test.skip('selects dose when clicking dose button', async ({ page }) => {
      await page.goto('/jabs');
      await page.click('button:has-text("Log Injection")');

      // Click on 5mg dose
      await page.click('button:has-text("5 mg")');

      // Button should be selected (has accent background)
      const doseButton = page.locator('button:has-text("5 mg")');
      await expect(doseButton).toHaveClass(/bg-accent-primary/);
    });

    test.skip('saves injection and closes modal', async ({ page }) => {
      await page.goto('/jabs');
      await page.click('button:has-text("Log Injection")');

      // Select dose
      await page.click('button:has-text("5 mg")');

      // Submit
      await page.click('button:has-text("Save Injection")');

      // Modal should close and data should refresh
      await expect(page.locator('h2:has-text("Log Injection")')).not.toBeVisible();
    });
  });

  test.describe('Empty State', () => {
    test.skip('shows empty state when no injections', async ({ page }) => {
      await page.goto('/jabs');

      // Empty state for new users
      await expect(page.locator('text=No injections logged yet')).toBeVisible();
      await expect(page.locator('button:has-text("Log Injection")')).toBeVisible();
    });
  });

  test.describe('Injection History', () => {
    test.skip('displays injection entries with details', async ({ page }) => {
      await page.goto('/jabs');

      // Should show injection entries with dose and site
      const historyItem = page.locator('[data-testid="injection-history-item"]').first();
      if (await historyItem.isVisible()) {
        await expect(historyItem.locator('text=/\\d+(\\.\\d+)?\\s*mg/')).toBeVisible();
      }
    });

    test.skip('shows edit button on history items', async ({ page }) => {
      await page.goto('/jabs');

      const historyItem = page.locator('[data-testid="injection-history-item"]').first();
      if (await historyItem.isVisible()) {
        await expect(historyItem.locator('button:has-text("Edit")')).toBeVisible();
      }
    });

    test.skip('shows dose change indicator', async ({ page }) => {
      await page.goto('/jabs');

      // Look for dose up indicator (may or may not be visible depending on data)
      await expect(page.locator('text=⬆️ Dose Up').first()).toBeVisible();
    });
  });

  test.describe('Bottom Navigation', () => {
    test.skip('shows bottom navigation bar', async ({ page }) => {
      await page.goto('/jabs');

      // Check for navigation links
      await expect(page.locator('a[href="/summary"]')).toBeVisible();
      await expect(page.locator('a[href="/jabs"]')).toBeVisible();
      await expect(page.locator('a[href="/results"]')).toBeVisible();
      await expect(page.locator('a[href="/calendar"]')).toBeVisible();
      await expect(page.locator('a[href="/settings"]')).toBeVisible();
    });

    test.skip('highlights jabs tab as active', async ({ page }) => {
      await page.goto('/jabs');

      const jabsLink = page.locator('a[href="/jabs"]');
      await expect(jabsLink).toHaveClass(/text-accent-primary|bg-accent-primary/);
    });
  });
});
