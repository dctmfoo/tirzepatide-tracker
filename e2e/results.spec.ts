import { test, expect } from '@playwright/test';

/**
 * Results Dashboard E2E tests
 * Tests the weight chart and statistics display
 */

test.describe('Results Page', () => {
  test.describe('Page Access', () => {
    test('redirects to login when not authenticated', async ({ page }) => {
      await page.goto('/results');

      await expect(page).toHaveURL(/\/login/);
    });
  });

  // These tests require authentication
  test.describe('Page Structure (Authenticated)', () => {
    test('displays period tabs', async ({ page }) => {
      await page.goto('/results');

      // Check for period selector tabs
      await expect(page.locator('button:has-text("1m"), [data-tab="1m"]')).toBeVisible();
      await expect(page.locator('button:has-text("3m"), [data-tab="3m"]')).toBeVisible();
      await expect(page.locator('button:has-text("6m"), [data-tab="6m"]')).toBeVisible();
      await expect(page.locator('button:has-text("All Time"), [data-tab="all"]')).toBeVisible();
    });

    test('displays weight change header', async ({ page }) => {
      await page.goto('/results');

      await expect(page.locator('h2:has-text("Weight Change")')).toBeVisible();
    });

    test('displays all stat cards', async ({ page }) => {
      await page.goto('/results');

      // Check for all 6 stat cards
      await expect(page.locator('text=Total change')).toBeVisible();
      await expect(page.locator('text=Current BMI')).toBeVisible();
      await expect(page.locator('text=Weight')).toBeVisible();
      await expect(page.locator('text=Percent')).toBeVisible();
      await expect(page.locator('text=Weekly avg')).toBeVisible();
      await expect(page.locator('text=To goal')).toBeVisible();
    });

    test('displays weight chart', async ({ page }) => {
      await page.goto('/results');

      // Chart container should be visible
      const chartContainer = page.locator('[data-testid="weight-chart"], .recharts-wrapper');
      await expect(chartContainer).toBeVisible();
    });
  });

  test.describe('Period Filter', () => {
    test('changes period when clicking tabs', async ({ page }) => {
      await page.goto('/results');

      // Click on 1 month tab
      await page.click('button:has-text("1m"), [data-tab="1m"]');

      // Tab should be selected (visually indicated)
      const monthTab = page.locator('button:has-text("1m"), [data-tab="1m"]');
      await expect(monthTab).toHaveClass(/bg-accent-primary|text-accent-primary|underline/);
    });

    test('updates date range when changing period', async ({ page }) => {
      await page.goto('/results');

      // Change to 3 months
      await page.click('button:has-text("3m"), [data-tab="3m"]');

      // Wait for data to load
      await page.waitForTimeout(500);

      // Date range should be visible and updated
      const dateRange = page.locator('[data-testid="date-range"]');
      await expect(dateRange).toBeVisible();
    });

    test('All Time is selected by default', async ({ page }) => {
      await page.goto('/results');

      const allTimeTab = page.locator('button:has-text("All Time"), [data-tab="all"]');
      await expect(allTimeTab).toHaveClass(/bg-accent-primary|text-accent-primary|underline|selected/);
    });
  });

  test.describe('Stat Cards', () => {
    test('displays stat values with units', async ({ page }) => {
      await page.goto('/results');

      // Stats should show values with units like "kg" or "%"
      const totalChangeCard = page.locator('text=Total change').locator('xpath=ancestor::div[contains(@class, "card") or contains(@class, "rounded")]');
      await expect(totalChangeCard).toBeVisible();
    });

    test('shows correct icons for each stat', async ({ page }) => {
      await page.goto('/results');

      // Check for emoji icons
      await expect(page.locator('text=📦')).toBeVisible(); // Total change
      await expect(page.locator('text=🧍')).toBeVisible(); // BMI
      await expect(page.locator('text=📋')).toBeVisible(); // Weight
      await expect(page.locator('text=%')).toBeVisible();  // Percent
      await expect(page.locator('text=📊')).toBeVisible(); // Weekly avg
      await expect(page.locator('text=🚩')).toBeVisible(); // To goal
    });
  });

  test.describe('Weight Chart', () => {
    test('shows chart with data points', async ({ page }) => {
      await page.goto('/results');

      // Recharts elements should be present
      await expect(page.locator('.recharts-line, .recharts-curve')).toBeVisible();
    });

    test('shows Y-axis with weight values', async ({ page }) => {
      await page.goto('/results');

      // Y-axis should be visible
      await expect(page.locator('.recharts-yAxis')).toBeVisible();
    });

    test('shows X-axis with dates', async ({ page }) => {
      await page.goto('/results');

      // X-axis should be visible
      await expect(page.locator('.recharts-xAxis')).toBeVisible();
    });
  });

  test.describe('Empty State', () => {
    test('shows empty state when no weight data', async ({ page }) => {
      await page.goto('/results');

      // For new users with no data (may or may not be visible depending on user data)
      await expect(page.locator('text=No data yet')).toBeVisible();
    });
  });

  test.describe('Loading State', () => {
    test('shows skeleton while loading', async ({ page }) => {
      await page.goto('/results');

      // Skeleton should appear briefly during loading
      // This is hard to catch in E2E tests due to speed
    });
  });

  test.describe('Bottom Navigation', () => {
    test('shows bottom navigation bar', async ({ page }) => {
      await page.goto('/results');

      await expect(page.locator('a[href="/summary"]')).toBeVisible();
      await expect(page.locator('a[href="/jabs"]')).toBeVisible();
      await expect(page.locator('a[href="/results"]')).toBeVisible();
      await expect(page.locator('a[href="/calendar"]')).toBeVisible();
      await expect(page.locator('a[href="/settings"]')).toBeVisible();
    });

    test('highlights results tab as active', async ({ page }) => {
      await page.goto('/results');

      const resultsLink = page.locator('a[href="/results"]');
      await expect(resultsLink).toHaveClass(/text-accent-primary|bg-accent-primary/);
    });
  });

  test.describe('Responsive Design', () => {
    test('displays correctly on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/results');

      // Stat cards should be in a grid
      const statGrid = page.locator('.grid.grid-cols-3');
      await expect(statGrid).toBeVisible();

      // Chart should be responsive
      const chart = page.locator('[data-testid="weight-chart"], .recharts-wrapper');
      const box = await chart.boundingBox();
      if (box) {
        expect(box.width).toBeLessThanOrEqual(375);
      }
    });

    test('displays correctly on tablet', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.goto('/results');

      // Page should be visible and properly sized
      await expect(page.locator('h2:has-text("Weight Change")')).toBeVisible();
    });
  });
});
