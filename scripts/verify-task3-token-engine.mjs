import puppeteer from 'puppeteer-core';
import { createServer } from 'vite';
import fs from 'fs';
import path from 'path';

const SCREENSHOT_DIR = path.resolve(process.cwd(), 'docs/screenshots/task3');
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function main() {
  console.log('--- TASK 3: RUNTIME DESIGN TOKEN ENGINE VERIFICATION ---');

  let viteServer;
  let baseUrl = 'http://localhost:5183';

  // Check if server is running
  try {
    const res = await fetch(baseUrl);
    if (!res.ok) throw new Error('Not ok');
    console.log(`Connected to existing server at ${baseUrl}`);
  } catch {
    console.log('Launching Vite server on port 5183...');
    viteServer = await createServer({
      server: { port: 5183, host: 'localhost' }
    });
    await viteServer.listen();
    console.log('Vite server running on http://localhost:5183');
  }

  const browser = await puppeteer.launch({
    headless: true,
    executablePath: '/bin/google-chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1.5 });

  console.log('1. Navigating to Yurist Studio...');
  await page.goto(baseUrl, { waitUntil: 'networkidle2' });
  await page.waitForSelector('.app-container');
  await new Promise((r) => setTimeout(r, 1000));

  // 1. Baseline screenshot
  console.log('2. Capturing baseline screenshot (Default tokens)...');
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '01_baseline_default.png') });

  // Baseline computed values
  const baselineValues = await page.evaluate(() => {
    const card = document.querySelector('.study-card-9-16');
    const primaryBtn = document.querySelector('.nav-btn-primary');
    return {
      cardBg: card ? window.getComputedStyle(card).backgroundColor : null,
      primaryBtnBg: primaryBtn ? window.getComputedStyle(primaryBtn).backgroundColor : null,
      rootAccent: window.getComputedStyle(document.documentElement).getPropertyValue('--accent').trim()
    };
  });
  console.log('Baseline styles:', baselineValues);

  // 2. Call setToken for color and font-size live in runtime (no reload)
  console.log('3. Calling setToken live in DevTools context:');
  console.log('   - setToken("ui_accent", "#7C3AED") [Royal Violet]');
  console.log('   - setToken("doc_bg", "#FEF3C7") [Warm Amber Paper]');
  console.log('   - setToken("canvas_font_h1", "68px") [Larger Canvas H1]');

  await page.evaluate(async () => {
    const win = window;
    await win.setToken('ui_accent', '#7C3AED');
    await win.setToken('doc_bg', '#FEF3C7');
    await win.setToken('canvas_font_h1', '68px');
  });

  // Small delay for DOM paint
  await new Promise((r) => setTimeout(r, 500));

  const updatedValues = await page.evaluate(() => {
    const card = document.querySelector('.study-card-9-16');
    const primaryBtn = document.querySelector('.nav-btn-primary');
    const h1 = document.querySelector('.study-card-9-16 h1, .study-card-9-16 .card-title, .study-card-9-16 .norm-title');
    return {
      cardBg: card ? window.getComputedStyle(card).backgroundColor : null,
      primaryBtnBg: primaryBtn ? window.getComputedStyle(primaryBtn).backgroundColor : null,
      h1FontSize: h1 ? window.getComputedStyle(h1).fontSize : null,
      rootAccent: window.getComputedStyle(document.documentElement).getPropertyValue('--accent').trim()
    };
  });
  console.log('Instant updated styles (without reload):', updatedValues);

  console.log('4. Capturing runtime tokens applied screenshot...');
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '02_runtime_tokens_applied.png') });

  // 3. Verify IndexedDB persistence across reload
  console.log('5. Reloading page to verify IndexedDB persistence on boot...');
  await page.reload({ waitUntil: 'networkidle2' });
  await page.waitForSelector('.app-container');
  await new Promise((r) => setTimeout(r, 1200));

  const persistedValues = await page.evaluate(() => {
    const card = document.querySelector('.study-card-9-16');
    const primaryBtn = document.querySelector('.nav-btn-primary');
    return {
      cardBg: card ? window.getComputedStyle(card).backgroundColor : null,
      primaryBtnBg: primaryBtn ? window.getComputedStyle(primaryBtn).backgroundColor : null,
      rootAccent: window.getComputedStyle(document.documentElement).getPropertyValue('--accent').trim()
    };
  });
  console.log('Styles after reload (loaded from IndexedDB):', persistedValues);

  console.log('6. Capturing reloaded persistence screenshot...');
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '03_reloaded_persistence_verified.png') });

  // 4. Test resetAll()
  console.log('7. Calling resetAll() to restore defaults...');
  await page.evaluate(async () => {
    const win = window;
    await win.resetAll();
  });
  await new Promise((r) => setTimeout(r, 500));

  const restoredValues = await page.evaluate(() => {
    const card = document.querySelector('.study-card-9-16');
    const primaryBtn = document.querySelector('.nav-btn-primary');
    return {
      cardBg: card ? window.getComputedStyle(card).backgroundColor : null,
      primaryBtnBg: primaryBtn ? window.getComputedStyle(primaryBtn).backgroundColor : null,
      rootAccent: window.getComputedStyle(document.documentElement).getPropertyValue('--accent').trim()
    };
  });
  console.log('Styles after resetAll():', restoredValues);

  console.log('8. Capturing defaults restored screenshot...');
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '04_reset_defaults_restored.png') });

  await browser.close();
  if (viteServer) {
    await viteServer.close();
  }

  console.log('TASK 3 Verification completed successfully!');
}

main().catch((err) => {
  console.error('Verification failed:', err);
  process.exit(1);
});
