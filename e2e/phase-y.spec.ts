import { test, expect } from '@playwright/test';

test.describe('Phase Y - True Browser & Demo Validation', () => {

  test('True Request Lifecycle & Demo Rehearsal', async ({ page }) => {
    test.setTimeout(45000); // Allow ample time for the full lifecycle

    // 1. STUDENT LOGIN
    await page.goto('/login');
    await page.fill('input[id="email"]', 'aarav.demo@dormdesk.local');
    await page.fill('input[id="password"]', 'dormdesk2026');
    await page.click('button[type="submit"]');
    
    // Wait for Student Dashboard
    await expect(page.locator('h1').filter({ hasText: 'Dashboard' }).first()).toBeVisible();

    // 2. CREATE A REAL REQUEST
    await page.goto('/student/requests/new');
    
    // Fill the form
    await page.selectOption('select[id="requestType"]', 'LEAVE');
    await page.selectOption('select[id="category"]', 'HOME');
    await page.fill('input[id="leaveDays"]', '3'); // >=3 days prevents auto-approval
    await page.fill('textarea[name="description"]', 'Family emergency, going home for 3 days.');
    
    // Submit
    await page.click('button:has-text("Submit Request")');
    
    // 3. CONFIRM REQUEST APPEARS (Should redirect to /student/requests/[id])
    await expect(page.locator('h1').filter({ hasText: 'Request Details' }).or(page.locator('text=Family emergency')).first()).toBeVisible({ timeout: 10000 });
    
    // Capture the request ID from URL
    const requestUrl = page.url();
    const requestId = requestUrl.split('/').pop();
    expect(requestId).toBeDefined();

    // 4. LOGOUT (STUDENT)
    await page.request.post('/api/auth/logout');

    // 5. LOGIN AS WARDEN (AUTHORITY)
    await page.goto('/login');
    await page.fill('input[id="email"]', 'warden.demo@dormdesk.local');
    await page.fill('input[id="password"]', 'dormdesk2026');
    await page.click('button[type="submit"]');

    // Wait for Warden Dashboard
    await expect(page.locator('h1').filter({ hasText: 'Warden Desk' }).first()).toBeVisible();

    // 6. OPEN REQUEST THROUGH AUTHORITY UI
    // Warden dashboard links to /admin/requests/[id] for pending requests
    await page.goto(`/admin/requests/${requestId}`);

    // Wait for Authority Request Detail UI
    console.log("Current URL:", page.url());
    const content = await page.textContent('body');
    console.log("Body snippet:", content?.substring(0, 200));
    await expect(page.locator('h3').filter({ hasText: 'Take Action' }).first()).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=Family emergency').first()).toBeVisible();

    // 7. PERFORM LIFECYCLE ACTION (PROCESS -> RESOLVE)
    // Add resolution notes
    await page.fill('textarea[placeholder="Resolution notes (optional)"]', 'Leave approved for 3 days.');
    
    // Resolve
    page.on('dialog', dialog => {
      console.log("UI ALERT:", dialog.message());
      dialog.accept();
    });
    const responsePromise = page.waitForResponse(res => res.url().includes('/api/requests/') && res.request().method() === 'PATCH');
    await page.click('button:has-text("Mark as Resolved")');
    
    const response = await responsePromise;
    console.log("API Response:", await response.text());

    // Confirm it's resolved by waiting for the audit log
    await expect(page.locator('text=Moved to RESOLVED')).toBeVisible({ timeout: 10000 });
    
    // Also wait for the badge to say Resolved
    

    // 8. LOGOUT (AUTHORITY)
    await page.request.post('/api/auth/logout');

    // 9. LOGIN AS STUDENT (VERIFICATION)
    await page.goto('/login');
    await page.fill('input[id="email"]', 'aarav.demo@dormdesk.local');
    await page.fill('input[id="password"]', 'dormdesk2026');
    await page.click('button[type="submit"]');

    // Wait for login to complete
    await page.waitForURL('**/student**', { timeout: 10000 });

    // Navigate back to the request
    page.on('response', async res => {
      if (res.url().includes(`/api/requests/${requestId}`) && res.request().method() === 'GET') {
        console.log("STUDENT GET RESPONSE:", await res.text());
      }
    });
    await page.goto(`/student/requests/${requestId}`);

    // 10. STUDENT VERIFIES RESOLUTION
    // The student UI should show the verify button when status is RESOLVED
    const studentHtml = await page.textContent('body');
    console.log("STUDENT UI BODY:", studentHtml?.substring(0, 1000));
    console.log("IS VERIFY BUTTON THERE?", studentHtml?.includes("Verify & Close"));

    await expect(page.locator('button:has-text("Verify & Close")').first()).toBeVisible({ timeout: 10000 });
    await page.click('button:has-text("Verify & Close")');

    // 11. CONFIRM IT REACHES TERMINAL STATE (CLOSED)
    await expect(page.locator('text=Closed').first()).toBeVisible({ timeout: 10000 });
  });

});
