import { test as setup, expect } from '@playwright/test';
import path from 'path';

const authFile = path.join(__dirname, '../playwright/.auth/user.json');

/**
 * Global setup that creates/logs in a test user and saves session state.
 * This runs before all authenticated tests.
 */
setup('authenticate', async ({ page }) => {
  // Use a unique email per test run to avoid password conflicts from previous runs
  const testEmail = `e2e-test-${Date.now()}@example.com`;
  const testPassword = 'TestPassword123!';

  // Step 1: Try to register the user
  await page.goto('/register');
  await expect(page.locator('h1')).toContainText('Create account');

  await page.fill('input#email', testEmail);
  await page.fill('input#password', testPassword);
  await page.fill('input#confirmPassword', testPassword);

  // Click and wait for response
  await Promise.all([
    page.waitForResponse(
      (resp) => resp.url().includes('/api/auth/register'),
      { timeout: 10000 }
    ).catch(() => null),
    page.click('button[type="submit"]'),
  ]);

  // Wait for navigation or error
  await page.waitForTimeout(2000);

  // Check if we got redirected (registration + auto-login succeeded)
  const urlAfterRegister = page.url();
  if (urlAfterRegister.includes('/onboarding')) {
    // New user - complete onboarding
    await completeOnboarding(page);
    await page.context().storageState({ path: authFile });
    return;
  }

  if (urlAfterRegister.includes('/summary')) {
    // Already has profile
    await page.context().storageState({ path: authFile });
    return;
  }

  // Step 2: Registration might have failed (user exists), try login
  await page.goto('/login');
  await expect(page.locator('h1')).toContainText('Welcome back');

  await page.fill('input#email', testEmail);
  await page.fill('input#password', testPassword);
  await page.click('button[type="submit"]');

  // Wait for redirect or error
  try {
    await page.waitForURL(/\/(summary|onboarding)/, { timeout: 10000 });
  } catch {
    // Check if there's an error message
    const errorVisible = await page.locator('text=Invalid email or password').isVisible();
    if (errorVisible) {
      throw new Error('Auth setup failed: Could not register or login test user. The user may exist with a different password.');
    }
    throw new Error(`Auth setup failed: Unexpected URL ${page.url()}`);
  }

  // Complete onboarding if needed
  if (page.url().includes('/onboarding')) {
    await completeOnboarding(page);
  }

  // Save the authentication state
  await page.context().storageState({ path: authFile });
});

async function completeOnboarding(page: import('@playwright/test').Page) {
  await expect(page.locator('h1')).toContainText('Welcome to Mounjaro Tracker');

  // About You section
  await page.fill('input#age', '30');
  await page.selectOption('select#gender', 'male');

  // Height
  const heightInput = page.locator('input#height');
  if (await heightInput.isVisible()) {
    await heightInput.fill('175');
  }

  // Goals section
  const startingWeight = page.locator('input#startingWeight');
  if (await startingWeight.isVisible()) {
    await startingWeight.fill('90');
  }

  const goalWeight = page.locator('input#goalWeight');
  if (await goalWeight.isVisible()) {
    await goalWeight.fill('75');
  }

  // First Injection section
  const doseSelect = page.locator('select#dose');
  if (await doseSelect.isVisible()) {
    await doseSelect.selectOption('2.5');
  }

  const siteSelect = page.locator('select#injectionSite');
  if (await siteSelect.isVisible()) {
    await siteSelect.selectOption('abdomen_left');
  }

  // Submit
  await page.click('button[type="submit"]');
  await page.waitForURL('/summary', { timeout: 15000 });
}
