import { chromium } from 'playwright';

const BASE_URL = 'http://localhost:5173';

async function testPage(page, path, name, actionLabels) {
  let clicks = 0;
  let errors = [];
  
  await page.goto(`${BASE_URL}${path}`, { waitUntil: 'load', timeout: 10000 });
  await page.waitForTimeout(1200);
  
  const main = page.locator('main');
  const mainButtons = main.locator('button');
  const count = await mainButtons.count();
  
  for (let i = 0; i < count; i++) {
    try {
      const btn = mainButtons.nth(i);
      const text = await btn.textContent();
      const visible = await btn.isVisible();
      const disabled = await btn.evaluate(el => el.disabled);
      
      const isAction = actionLabels.some(a => text?.toLowerCase().includes(a.toLowerCase()));
      
      if (visible && !disabled && isAction) {
        await btn.click({ timeout: 1000 });
        await page.waitForTimeout(300);
        clicks++;
      }
    } catch (e) {
      errors.push(e.message.substring(0, 20));
    }
  }
  
  return { clicks, errors: errors.length };
}

async function runTest() {
  console.log('=== Admin Page Button Tests ===\n');
  
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  console.log('Login...');
  await page.goto(`${BASE_URL}/login`);
  await page.fill('input[type="email"]', 'admin@oasis.com');
  await page.fill('input[type="password"]', 'password');
  await page.click('button[type="submit"]');
  await page.waitForLoadState('networkidle');
  console.log('✓ Logged in\n');

  const tests = [
    { path: '/animals', name: 'Animals', actions: ['add', 'save', 'cancel'] },
    { path: '/devices', name: 'Devices', actions: ['add', 'save', 'cancel'] },
    { path: '/users', name: 'Users', actions: ['add', 'save', 'cancel'] },
    { path: '/auctions', name: 'Auctions', actions: ['add', 'save', 'cancel'] },
    { path: '/geofences', name: 'Geofences', actions: ['add', 'save', 'cancel'] },
    { path: '/animal-groups', name: 'Animal Groups', actions: ['add', 'save', 'cancel'] },
    { path: '/subscription/tiers', name: 'Subscriptions', actions: ['add', 'save', 'cancel'] },
    { path: '/tasks', name: 'Tasks', actions: ['add', 'save', 'cancel'] },
    { path: '/reports', name: 'Reports', actions: ['add', 'save', 'generate', 'export'] },
    { path: '/payments', name: 'Payments', actions: ['add', 'save', 'filter', 'export'] },
    { path: '/dashboard', name: 'Dashboard', actions: ['add', 'save', 'export'] },
    { path: '/alerts', name: 'Alerts', actions: ['add', 'delete', 'acknowledge'] },
    { path: '/map', name: 'Map', actions: ['add', 'save'] },
    { path: '/team', name: 'Team', actions: ['add', 'save'] },
    { path: '/task-logs-archive', name: 'Task Logs', actions: ['filter', 'export'] },
    { path: '/my-payments', name: 'My Payments', actions: ['add', 'save', 'filter'] },
  ];

  let totalClicks = 0;
  let passed = 0;
  let issues = [];

  for (const t of tests) {
    try {
      const result = await testPage(page, t.path, t.name, t.actions);
      const status = result.errors === 0 || result.clicks > 0 ? 'PASS' : 'FAIL';
      console.log(`${t.name}: ${result.clicks} clicks, ${result.errors} errors [${status}]`);
      if (result.errors > 0 && result.clicks === 0) {
        issues.push(t.name);
      }
      if (status === 'PASS') passed++;
      totalClicks += result.clicks;
    } catch (e) {
      console.log(`${t.name}: ERROR - ${e.message}`);
      issues.push(t.name);
    }
  }
  
  await browser.close();
  
  console.log('\n===================');
  console.log(`Pages: ${passed}/${tests.length}`);
  console.log(`Buttons clicked: ${totalClicks}`);
  if (issues.length) {
    console.log(`ISSUES: ${issues.join(', ')}`);
    process.exit(1);
  }
  console.log('✓ All tests passed');
}

runTest().catch(e => { console.error(e); process.exit(1); });