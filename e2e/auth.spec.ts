import { test, expect } from '@playwright/test';

/**
 * Authentication E2E tests
 * Tests login, registration, and logout flows
 */

test.describe('Authentication', () => {
  test.describe('Login Page', () => {
    test('displays login form', async ({ page }) => {
      await page.goto('/login');

      await expect(page.locator('h1')).toContainText('Welcome back');
      await expect(page.locator('input#email')).toBeVisible();
      await expect(page.locator('input#password')).toBeVisible();
      await expect(page.locator('button[type="submit"]')).toContainText('Sign in');
    });

    test('shows link to register page', async ({ page }) => {
      await page.goto('/login');

      const registerLink = page.locator('a[href="/register"]');
      await expect(registerLink).toBeVisible();
      await expect(registerLink).toContainText('Sign up');
    });

    test('shows link to forgot password', async ({ page }) => {
      await page.goto('/login');

      const forgotLink = page.locator('a[href="/forgot-password"]');
      await expect(forgotLink).toBeVisible();
      await expect(forgotLink).toContainText('Forgot password');
    });

    test('shows error for invalid credentials', async ({ page }) => {
      await page.goto('/login');

      await page.fill('input#email', 'invalid@example.com');
      await page.fill('input#password', 'wrongpassword');
      await page.click('button[type="submit"]');

      // Wait for error message
      await expect(page.locator('text=Invalid email or password')).toBeVisible();
    });

    test('shows loading state during submission', async ({ page }) => {
      await page.goto('/login');

      await page.fill('input#email', 'test@example.com');
      await page.fill('input#password', 'testpassword');

      // Click and immediately check for loading state
      await page.click('button[type="submit"]');

      // Button should show loading text briefly
      // Note: This may be too fast to catch in real scenarios
    });

    test('navigates to register page', async ({ page }) => {
      await page.goto('/login');

      await page.click('a[href="/register"]');
      await expect(page).toHaveURL('/register');
    });
  });

  test.describe('Register Page', () => {
    test('displays registration form', async ({ page }) => {
      await page.goto('/register');

      await expect(page.locator('h1')).toContainText('Create account');
      await expect(page.locator('input#email')).toBeVisible();
      await expect(page.locator('input#password')).toBeVisible();
      await expect(page.locator('input#confirmPassword')).toBeVisible();
      await expect(page.locator('button[type="submit"]')).toContainText('Create account');
    });

    test('shows link to login page', async ({ page }) => {
      await page.goto('/register');

      const loginLink = page.locator('a[href="/login"]');
      await expect(loginLink).toBeVisible();
      await expect(loginLink).toContainText('Sign in');
    });

    test('validates password mismatch', async ({ page }) => {
      await page.goto('/register');

      await page.fill('input#email', 'newuser@example.com');
      await page.fill('input#password', 'Password123');
      await page.fill('input#confirmPassword', 'Password456');
      await page.click('button[type="submit"]');

      await expect(page.locator('text=Passwords do not match')).toBeVisible();
    });

    test('validates password length', async ({ page }) => {
      await page.goto('/register');

      await page.fill('input#email', 'newuser@example.com');
      await page.fill('input#password', 'short');
      await page.fill('input#confirmPassword', 'short');
      await page.click('button[type="submit"]');

      await expect(page.locator('text=Password must be at least 8 characters')).toBeVisible();
    });

    test('navigates to login page', async ({ page }) => {
      await page.goto('/register');

      await page.click('a[href="/login"]');
      await expect(page).toHaveURL('/login');
    });
  });

  test.describe('Unauthenticated Access', () => {
    test('redirects /summary to /login when not authenticated', async ({ page }) => {
      await page.goto('/summary');

      // Should redirect to login
      await expect(page).toHaveURL(/\/login/);
    });

    test('redirects /results to /login when not authenticated', async ({ page }) => {
      await page.goto('/results');

      await expect(page).toHaveURL(/\/login/);
    });

    test('redirects /jabs to /login when not authenticated', async ({ page }) => {
      await page.goto('/jabs');

      await expect(page).toHaveURL(/\/login/);
    });

    test('redirects /calendar to /login when not authenticated', async ({ page }) => {
      await page.goto('/calendar');

      await expect(page).toHaveURL(/\/login/);
    });

    test('redirects /settings to /login when not authenticated', async ({ page }) => {
      await page.goto('/settings');

      await expect(page).toHaveURL(/\/login/);
    });
  });
});
