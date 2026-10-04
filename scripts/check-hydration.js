const { chromium } = require('@playwright/test');
(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({ baseURL: 'http://localhost:3000' });
  const page = await context.newPage();
  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  page.on('pageerror', err => errors.push(err.message));

  // login
  await page.goto('/login');
  await page.fill('#email', 'aarav.demo@dormdesk.local');
  await page.fill('#password', 'dormdesk2026');
  await page.click('button[type="submit"]');
  
  await page.waitForTimeout(3000);
  
  console.log("Hydration Errors Found:");
  errors.filter(e => e.includes('Hydration') || e.includes('hydrat')).forEach(e => console.log(e));
  console.log("Other Errors:", errors.filter(e => !e.includes('Hydration') && !e.includes('hydrat')));
  
  await browser.close();
})();
