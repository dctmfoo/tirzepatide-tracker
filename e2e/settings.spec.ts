import { test, expect } from '@playwright/test';

/**
 * Settings Page E2E tests
 * Tests settings sections, modals, and logout functionality
 */

test.describe('Settings Page', () => {
  test.describe('Page Access', () => {
    test('redirects to login when not authenticated', async ({ page }) => {
      await page.goto('/settings');

      await expect(page).toHaveURL(/\/login/);
    });
  });

  // These tests require authentication
  test.describe('Page Structure (Authenticated)', () => {
    test.skip('displays page header', async ({ page }) => {
      await page.goto('/settings');

      await expect(page.locator('h1')).toContainText('Settings');
    });

    test.skip('displays Profile section', async ({ page }) => {
      await page.goto('/settings');

      await expect(page.locator('text=Profile')).toBeVisible();
      await expect(page.locator('text=Personal Info')).toBeVisible();
      await expect(page.locator('text=Goals')).toBeVisible();
      await expect(page.locator('text=Account')).toBeVisible();
    });

    test.skip('displays Treatment section', async ({ page }) => {
      await page.goto('/settings');

      await expect(page.locator('text=Treatment')).toBeVisible();
      await expect(page.locator('text=Injection Schedule')).toBeVisible();
    });

    test.skip('displays Preferences section', async ({ page }) => {
      await page.goto('/settings');

      await expect(page.locator('text=Preferences')).toBeVisible();
      await expect(page.locator('text=Units')).toBeVisible();
      await expect(page.locator('text=Notifications')).toBeVisible();
      await expect(page.locator('text=Appearance')).toBeVisible();
    });

    test.skip('displays Data section', async ({ page }) => {
      await page.goto('/settings');

      await expect(page.locator('text=Data')).toBeVisible();
      await expect(page.locator('text=Export Data')).toBeVisible();
      await expect(page.locator('text=Download All Data')).toBeVisible();
    });

    test.skip('displays Support section', async ({ page }) => {
      await page.goto('/settings');

      await expect(page.locator('text=Support')).toBeVisible();
      await expect(page.locator('text=Help')).toBeVisible();
      await expect(page.locator('text=Feedback')).toBeVisible();
      await expect(page.locator('text=Privacy')).toBeVisible();
      await expect(page.locator('text=Terms')).toBeVisible();
    });

    test.skip('displays Danger Zone section', async ({ page }) => {
      await page.goto('/settings');

      await expect(page.locator('text=Danger Zone')).toBeVisible();
      await expect(page.locator('text=Delete Account')).toBeVisible();
    });

    test.skip('displays Log Out button', async ({ page }) => {
      await page.goto('/settings');

      await expect(page.locator('button:has-text("Log Out")')).toBeVisible();
    });

    test.skip('displays app version', async ({ page }) => {
      await page.goto('/settings');

      await expect(page.locator('text=Version')).toBeVisible();
    });
  });

  test.describe('Personal Info Modal', () => {
    test.skip('opens when clicking Personal Info', async ({ page }) => {
      await page.goto('/settings');

      await page.click('text=Personal Info');

      // Modal should open
      await expect(page.locator('h2:has-text("Personal Info")')).toBeVisible();
    });

    test.skip('has age, gender, and height fields', async ({ page }) => {
      await page.goto('/settings');
      await page.click('text=Personal Info');

      await expect(page.locator('input[name*="age"], label:has-text("Age")')).toBeVisible();
      await expect(page.locator('select[name*="gender"], label:has-text("Gender")')).toBeVisible();
      await expect(page.locator('input[name*="height"], label:has-text("Height")')).toBeVisible();
    });

    test.skip('closes when clicking cancel', async ({ page }) => {
      await page.goto('/settings');
      await page.click('text=Personal Info');
      await page.click('button:has-text("Cancel"), button:has-text("✕")');

      await expect(page.locator('h2:has-text("Personal Info")')).not.toBeVisible();
    });
  });

  test.describe('Goals Modal', () => {
    test.skip('opens when clicking Goals', async ({ page }) => {
      await page.goto('/settings');

      await page.click('text=Goals');

      await expect(page.locator('h2:has-text("Goals")')).toBeVisible();
    });

    test.skip('has goal weight and treatment start date fields', async ({ page }) => {
      await page.goto('/settings');
      await page.click('text=Goals');

      await expect(page.locator('input[name*="goal"], label:has-text("Goal")')).toBeVisible();
      await expect(page.locator('input[type="date"], label:has-text("Start")')).toBeVisible();
    });
  });

  test.describe('Injection Schedule Modal', () => {
    test.skip('opens when clicking Injection Schedule', async ({ page }) => {
      await page.goto('/settings');

      await page.click('text=Injection Schedule');

      await expect(page.locator('h2:has-text("Injection Schedule")')).toBeVisible();
    });

    test.skip('has preferred day and reminder timing options', async ({ page }) => {
      await page.goto('/settings');
      await page.click('text=Injection Schedule');

      await expect(page.locator('select, label:has-text("Preferred Day")')).toBeVisible();
    });
  });

  test.describe('Units Modal', () => {
    test.skip('opens when clicking Units', async ({ page }) => {
      await page.goto('/settings');

      await page.click('text=Units');

      await expect(page.locator('h2:has-text("Units")')).toBeVisible();
    });

    test.skip('has weight and height unit options', async ({ page }) => {
      await page.goto('/settings');
      await page.click('text=Units');

      // Should have unit selectors
      await expect(page.locator('text=kg, text=lbs, text=stone')).toBeVisible();
    });
  });

  test.describe('Notifications Modal', () => {
    test.skip('opens when clicking Notifications', async ({ page }) => {
      await page.goto('/settings');

      await page.click('text=Notifications');

      await expect(page.locator('h2:has-text("Notifications")')).toBeVisible();
    });

    test.skip('has email reminder toggles', async ({ page }) => {
      await page.goto('/settings');
      await page.click('text=Notifications');

      // Toggle switches for reminders
      await expect(page.locator('input[type="checkbox"], [role="switch"]')).toBeVisible();
    });
  });

  test.describe('Export Modal', () => {
    test.skip('opens when clicking Export Data', async ({ page }) => {
      await page.goto('/settings');

      await page.click('text=Export Data');

      await expect(page.locator('h2:has-text("Export")')).toBeVisible();
    });

    test.skip('has export format options', async ({ page }) => {
      await page.goto('/settings');
      await page.click('text=Export Data');

      // Export format options
      await expect(page.locator('text=JSON')).toBeVisible();
      await expect(page.locator('text=Text')).toBeVisible();
    });
  });

  test.describe('Delete Account Modal', () => {
    test.skip('opens when clicking Delete Account', async ({ page }) => {
      await page.goto('/settings');

      await page.click('text=Delete Account');

      // Confirmation dialog should appear
      await expect(page.locator('text=delete, text=confirmation')).toBeVisible();
    });

    test.skip('requires confirmation', async ({ page }) => {
      await page.goto('/settings');
      await page.click('text=Delete Account');

      // Should have a confirmation input or checkbox
      await expect(page.locator('input, button:has-text("Confirm")')).toBeVisible();
    });
  });

  test.describe('Logout', () => {
    test.skip('logs out when clicking Log Out button', async ({ page }) => {
      await page.goto('/settings');

      await page.click('button:has-text("Log Out")');

      // Should redirect to login
      await page.waitForURL(/\/login/);
      await expect(page).toHaveURL(/\/login/);
    });
  });

  test.describe('Bottom Navigation', () => {
    test.skip('shows bottom navigation bar', async ({ page }) => {
      await page.goto('/settings');

      await expect(page.locator('a[href="/summary"]')).toBeVisible();
      await expect(page.locator('a[href="/jabs"]')).toBeVisible();
      await expect(page.locator('a[href="/results"]')).toBeVisible();
      await expect(page.locator('a[href="/calendar"]')).toBeVisible();
      await expect(page.locator('a[href="/settings"]')).toBeVisible();
    });

    test.skip('highlights settings tab as active', async ({ page }) => {
      await page.goto('/settings');

      const settingsLink = page.locator('a[href="/settings"]');
      await expect(settingsLink).toHaveClass(/text-accent-primary|bg-accent-primary/);
    });
  });

  test.describe('Responsive Design', () => {
    test.skip('displays correctly on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/settings');

      // All sections should be visible
      await expect(page.locator('text=Profile')).toBeVisible();
      await expect(page.locator('text=Preferences')).toBeVisible();
    });
  });
});
