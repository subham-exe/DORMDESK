import { test, expect } from '@playwright/test';

test.describe('Daily Campus Core UI Validation', () => {

  test.describe('Unauthenticated Security & Navigation', () => {
    test('Logged-out /student redirects to /login', async ({ page }) => {
      await page.goto('/student');
      await expect(page).toHaveURL(/\/login/);
      await expect(page.locator('body')).not.toContainText('Support Requests');
    });

    test('Logged-out /faculty redirects to /login', async ({ page }) => {
      await page.goto('/faculty');
      await expect(page).toHaveURL(/\/login/);
    });

    test('Logged-out /warden redirects to /login', async ({ page }) => {
      await page.goto('/warden');
      await expect(page).toHaveURL(/\/login/);
    });

    test('Logged-out protected /admin redirects to /admin/login', async ({ page }) => {
      await page.goto('/admin/command-center');
      await expect(page).toHaveURL(/\/admin\/login/);
      // Ensure /admin/login is accessible
      await page.goto('/admin/login');
      await expect(page.locator('text=DormDesk Admin').first()).toBeVisible();
    });
  });

  test.describe('Authenticated Workflows & Domain Separation', () => {
    test('Student E2E Workflow & Offline', async ({ page, context }) => {
      await page.goto('/login');
      await page.fill('input[id="email"]', 'aarav.demo@dormdesk.local');
      await page.fill('input[id="password"]', 'dormdesk2026');
      await page.click('button[type="submit"]');

      await expect(page).toHaveURL(/\/student/);
      
      await expect(page.locator('text=Support Requests').first()).toBeVisible();


      await page.goto('/student/academics/timetable');
      await expect(page.locator('text=Weekly Timetable').first()).toBeVisible();

      await page.goto('/student/academics/attendance');
      await expect(page.locator('text=Attendance Overview').first()).toBeVisible();
      
      await page.goto('/student/resources/materials');
      await expect(page.locator('text=Study Materials').first()).toBeVisible();

      await page.goto('/student/resources/assignments');
      await expect(page.locator('text=Assignments').first()).toBeVisible();

      await page.goto('/student/campus/notices');
      await expect(page.locator('text=Notice Board').first()).toBeVisible();

      await page.goto('/student/campus/fees');
      await expect(page.locator('text=Fees & Dues').first()).toBeVisible();

      // Try to access faculty domain (should be blocked and redirected)
      await page.goto('/faculty');
      await expect(page).toHaveURL(/\/login/);

      // Try to access admin domain (should be blocked and redirected)
      await page.goto('/admin/command-center');
      await expect(page).toHaveURL(/\/admin\/login/);
      
      await page.goto('/student');
      await expect(page.locator('text=Support Requests').first()).toBeVisible();
      
      await context.setOffline(true);
      await page.goto('/student/academics/attendance', { waitUntil: 'commit' }).catch(() => {});
      await context.setOffline(false);
    });

    test('Faculty Workflow', async ({ page }) => {
      await page.goto('/login');
      await page.fill('input[id="email"]', 'faculty.demo@dormdesk.local');
      await page.fill('input[id="password"]', 'dormdesk2026');
      await page.click('button[type="submit"]');

      await expect(page).toHaveURL(/\/faculty/);
      await expect(page.locator('text=Faculty Attendance & Sessions').first()).toBeVisible();
    });

    test('HOD Workflow', async ({ page }) => {
      await page.goto('/login');
      await page.fill('input[id="email"]', 'hod.cse.demo@dormdesk.local');
      await page.fill('input[id="password"]', 'dormdesk2026');
      await page.click('button[type="submit"]');

      await expect(page).toHaveURL(/\/hod/);
      await expect(page.locator('text=HOD Dashboard').first()).toBeVisible();
    });

    test('Principal Workflow', async ({ page }) => {
      await page.goto('/login');
      await page.fill('input[id="email"]', 'principal.demo@dormdesk.local');
      await page.fill('input[id="password"]', 'dormdesk2026');
      await page.click('button[type="submit"]');

      await expect(page).toHaveURL(/\/principal/);
      await expect(page.locator('text=Principal Dashboard').first()).toBeVisible();
    });

    test('Warden Workflow', async ({ page }) => {
      await page.goto('/login');
      await page.fill('input[id="email"]', 'warden.demo@dormdesk.local');
      await page.fill('input[id="password"]', 'dormdesk2026');
      await page.click('button[type="submit"]');

      await expect(page).toHaveURL(/\/warden/);
      await expect(page.locator('text=Warden Desk').first()).toBeVisible();
    });

    test('SYSTEM_ADMIN Workflow', async ({ page }) => {
      await page.goto('/login');
      await page.fill('input[id="email"]', 'system@dormdesk.test');
      await page.fill('input[id="password"]', 'dormdesk2026');
      await page.click('button[type="submit"]');

      await expect(page).toHaveURL(/\/admin\/command-center/);
      await expect(page.locator('text=Command Center').first()).toBeVisible();
    });
  });
});
