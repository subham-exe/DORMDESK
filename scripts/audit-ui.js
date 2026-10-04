const { chromium } = require('@playwright/test');
const fs = require('fs');

const ACCOUNTS = {
  Student: { email: 'aarav.demo@dormdesk.local', pass: 'dormdesk2026', start: '/student' },
  Faculty: { email: 'faculty.demo@dormdesk.local', pass: 'dormdesk2026', start: '/faculty' },
  Staff: { email: 'staff.demo@dormdesk.local', pass: 'dormdesk2026', start: '/warden' }, 
  Principal: { email: 'principal.demo@dormdesk.local', pass: 'dormdesk2026', start: '/principal' },
  SystemAdmin: { email: 'system@dormdesk.test', pass: 'dormdesk2026', start: '/admin' }
};

const BASE_URL = 'http://localhost:3000';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const report = [];

  for (const [role, creds] of Object.entries(ACCOUNTS)) {
    console.log(`\n--- Auditing ${role} ---`);
    const context = await browser.newContext({ baseURL: BASE_URL });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', err => errors.push(err.message));
    page.on('console', msg => { if(msg.type()==='error') errors.push(msg.text()) });

    // Login
    await page.goto('/login');
    await page.waitForTimeout(500); // Let it render
    await page.fill('#email', creds.email).catch(() => {});
    await page.fill('#password', creds.pass).catch(() => {});
    await page.click('button[type="submit"]').catch(() => {});
    
    await page.waitForTimeout(1500); // Wait for navigation

    // Check if redirect worked
    const currentUrl = page.url();
    report.push(`[${role}] Login Redirect -> ${currentUrl.replace(BASE_URL, '')}`);

    // Gather all visible links in the sidebar/nav
    let links = [];
    try {
      links = await page.$$eval('a', as => [...new Set(as.map(a => a.href).filter(href => href.startsWith(window.location.origin) && !href.includes('#')))]);
    } catch (e) {}
    
    for (const link of links) {
      if (link.includes('logout') || link.includes('login')) continue;
      console.log(`  Visiting ${link}`);
      const res = await page.goto(link);
      await page.waitForTimeout(1000); // Let it render
      
      const title = await page.title();
      const h1 = await page.$eval('h1', el => el.innerText).catch(() => 'NO_H1');
      const bodyText = await page.locator('body').innerText().catch(() => '');
      
      let status = res ? res.status() : 'Unknown';
      let state = 'OK';
      if (bodyText.includes('Not Found') || bodyText.includes('404')) state = '404_CONTENT';
      if (bodyText.includes('Application error') || bodyText.includes('Something went wrong')) state = 'ERROR_BOUNDARY';
      
      report.push(`[${role}] ${link.replace(BASE_URL, '')} -> HTTP ${status} | H1: ${h1} | State: ${state}`);
    }
    
    if (errors.length > 0) {
      report.push(`[${role}] CONSOLE ERRORS: ${[...new Set(errors)].join(', ')}`);
    }

    await context.close();
  }

  await browser.close();
  fs.writeFileSync('audit_report.txt', report.join('\n'));
  console.log('Audit complete. Check audit_report.txt');
})();
