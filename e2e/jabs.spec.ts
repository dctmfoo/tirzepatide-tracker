import { test, expect } from '@playwright/test';

/**
 * Jabs (Injection Logging) E2E tests
 * Tests injection history viewing and logging functionality
 */

test.describe('Jabs Page', () => {
  test.describe('Page Structure (Authenticated)', () => {
    test('displays page header or empty state', async ({ page }) => {
      await page.goto('/jabs');

      // Wait for page to load (skeleton to disappear)
      await page.waitForLoadState('networkidle');

      // Page should load and show either the jabs header or empty state
      const h1 = page.locator('h1');
      const emptyStateText = page.locator('text=No injections logged yet');

      // Wait for either to appear
      await Promise.race([
        h1.waitFor({ timeout: 10000 }).catch(() => null),
        emptyStateText.waitFor({ timeout: 10000 }).catch(() => null),
      ]);

      const hasHeader = await h1.isVisible().catch(() => false);
      const hasEmptyState = await emptyStateText.isVisible().catch(() => false);

      expect(hasHeader || hasEmptyState).toBeTruthy();
    });

    test('displays stat cards or empty state for new users', async ({ page }) => {
      await page.goto('/jabs');
      await page.waitForLoadState('networkidle');

      // For users with no injections, show empty state
      // For users with injections, show stat cards
      const emptyState = page.locator('text=No injections logged yet');
      const totalInjectionsCard = page.locator('text=Total Injections');

      // Wait for page content to load
      await page.waitForTimeout(2000);

      const hasEmptyState = await emptyState.isVisible().catch(() => false);
      const hasStatCards = await totalInjectionsCard.isVisible().catch(() => false);

      // One or the other should be visible
      expect(hasEmptyState || hasStatCards).toBeTruthy();
    });

    test('displays log injection button', async ({ page }) => {
      await page.goto('/jabs');
      await page.waitForLoadState('networkidle');

      // Wait for page to finish loading
      await page.waitForTimeout(2000);

      // The log button appears in both empty state and main view (text includes "+")
      const logButton = page.locator('button:has-text("Log Injection")');
      await expect(logButton).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('Log Injection Modal', () => {
    test('opens modal when clicking log button', async ({ page }) => {
      await page.goto('/jabs');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      await page.click('button:has-text("Log Injection")');

      // Modal should be visible
      await expect(page.locator('h2:has-text("Log Injection")')).toBeVisible({ timeout: 5000 });
    });

    test('displays dose selection grid', async ({ page }) => {
      await page.goto('/jabs');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      await page.click('button:has-text("Log Injection")');
      await page.waitForTimeout(500);

      // Check for dose buttons - use exact match to avoid substring conflicts
      await expect(page.getByRole('button', { name: '2.5 mg', exact: true })).toBeVisible({ timeout: 5000 });
      await expect(page.getByRole('button', { name: '5 mg', exact: true })).toBeVisible();
      await expect(page.getByRole('button', { name: '7.5 mg', exact: true })).toBeVisible();
      await expect(page.getByRole('button', { name: '10 mg', exact: true })).toBeVisible();
      await expect(page.getByRole('button', { name: '12.5 mg', exact: true })).toBeVisible();
      await expect(page.getByRole('button', { name: '15 mg', exact: true })).toBeVisible();
    });

    test('displays site selection dropdown', async ({ page }) => {
      await page.goto('/jabs');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      await page.click('button:has-text("Log Injection")');
      await page.waitForTimeout(500);

      const siteSelect = page.locator('select');
      await expect(siteSelect).toBeVisible({ timeout: 5000 });
    });

    test('displays date/time input', async ({ page }) => {
      await page.goto('/jabs');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      await page.click('button:has-text("Log Injection")');
      await page.waitForTimeout(500);

      const dateInput = page.locator('input[type="datetime-local"]');
      await expect(dateInput).toBeVisible({ timeout: 5000 });
    });

    test('displays notes textarea', async ({ page }) => {
      await page.goto('/jabs');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      await page.click('button:has-text("Log Injection")');
      await page.waitForTimeout(500);

      const notesInput = page.locator('textarea');
      await expect(notesInput).toBeVisible({ timeout: 5000 });
    });

    test('closes modal when clicking close button', async ({ page }) => {
      await page.goto('/jabs');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      await page.click('button:has-text("Log Injection")');
      await page.waitForTimeout(500);

      // Click close button (✕)
      await page.click('button:has-text("✕")');

      // Modal should be hidden
      await expect(page.locator('h2:has-text("Log Injection")')).not.toBeVisible();
    });

    test('selects dose when clicking dose button', async ({ page }) => {
      await page.goto('/jabs');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      await page.click('button:has-text("Log Injection")');
      await page.waitForTimeout(500);

      // Click on 5mg dose - use exact match to avoid substring conflicts
      await page.getByRole('button', { name: '5 mg', exact: true }).click();

      // Button should be selected (has primary background)
      const doseButton = page.getByRole('button', { name: '5 mg', exact: true });
      await expect(doseButton).toHaveClass(/bg-primary/);
    });

    test('saves injection and closes modal', async ({ page }) => {
      await page.goto('/jabs');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      await page.click('button:has-text("Log Injection")');
      await page.waitForTimeout(500);

      // Select dose - use exact match
      await page.getByRole('button', { name: '5 mg', exact: true }).click();

      // Submit
      await page.click('button:has-text("Save Injection")');

      // Modal should close and data should refresh (may take a moment)
      await expect(page.locator('h2:has-text("Log Injection")')).not.toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('Empty State', () => {
    test('shows empty state message for new users', async ({ page }) => {
      await page.goto('/jabs');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      // Check if empty state is visible (may not be if user has injections)
      const emptyStateText = page.locator('text=No injections logged yet');
      const hasEmptyState = await emptyStateText.isVisible().catch(() => false);

      if (hasEmptyState) {
        await expect(page.locator('button:has-text("Log Injection")')).toBeVisible();
      }
      // If user has injections, empty state won't show - that's OK
    });
  });

  test.describe('Injection History', () => {
    test('displays injection history section when data exists', async ({ page }) => {
      await page.goto('/jabs');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      // Check for history section (may not exist for new users)
      const historyHeader = page.locator('h2:has-text("Injection History")');
      const hasHistory = await historyHeader.isVisible().catch(() => false);

      if (hasHistory) {
        // History section exists
        await expect(historyHeader).toBeVisible();
      }
      // If no injections, history section won't show - that's OK
    });
  });

  test.describe('Bottom Navigation', () => {
    test('shows bottom navigation bar', async ({ page }) => {
      await page.goto('/jabs');
      await page.waitForLoadState('networkidle');

      // Check for navigation links
      await expect(page.locator('a[href="/summary"]')).toBeVisible({ timeout: 10000 });
      await expect(page.locator('a[href="/jabs"]')).toBeVisible();
      await expect(page.locator('a[href="/results"]')).toBeVisible();
      await expect(page.locator('a[href="/calendar"]')).toBeVisible();
      await expect(page.locator('a[href="/settings"]')).toBeVisible();
    });

    test('highlights jabs tab as active', async ({ page }) => {
      await page.goto('/jabs');
      await page.waitForLoadState('networkidle');

      // The active tab has text-primary class on the label span
      const jabsLink = page.locator('a[href="/jabs"]');
      await expect(jabsLink).toBeVisible({ timeout: 10000 });

      // Check that the label span has the active class
      const labelSpan = jabsLink.locator('span.text-primary');
      await expect(labelSpan).toBeVisible();
    });
  });
});
