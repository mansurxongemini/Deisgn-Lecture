import fs from 'node:fs';
import path from 'node:path';
import puppeteer from 'puppeteer-core';

const SCREENSHOT_DIR = path.resolve(process.cwd(), 'docs/screenshots/audit');
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function run() {
  const browser = await puppeteer.launch({
    executablePath: '/bin/google-chrome',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle0' });
  await page.waitForSelector('.editor-textarea', { timeout: 10000 });

  // 1. Export Menu open
  console.log('Capturing Export dropdown...');
  const exportBtn = await page.$('.nav-btn-primary');
  if (exportBtn) {
    await exportBtn.click();
    await new Promise(r => setTimeout(r, 400));
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '01_export_dropdown.png') });
    await exportBtn.click();
    await new Promise(r => setTimeout(r, 300));
  }

  // 2. More Menu ("...") open
  console.log('Capturing More menu...');
  const moreBtn = await page.$('.nav-btn-more');
  if (moreBtn) {
    await moreBtn.click();
    await new Promise(r => setTimeout(r, 400));
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '02_more_menu.png') });
    await moreBtn.click();
    await new Promise(r => setTimeout(r, 300));
  }

  // 3. Command Palette (Ctrl+K)
  console.log('Capturing Command Palette...');
  await page.keyboard.down('Control');
  await page.keyboard.press('KeyK');
  await page.keyboard.up('Control');
  await new Promise(r => setTimeout(r, 500));
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '03_command_palette.png') });
  await page.keyboard.press('Escape');
  await new Promise(r => setTimeout(r, 400));

  // 4. Guide view
  console.log('Capturing Guide view...');
  await page.evaluate(() => {
    // Click more menu then guide
    const moreBtn = document.querySelector('.nav-btn-more');
    if (moreBtn) moreBtn.click();
  });
  await new Promise(r => setTimeout(r, 300));
  const guideItem = await page.$('.dropdown-popover-card button');
  if (guideItem) {
    await guideItem.click();
    await new Promise(r => setTimeout(r, 600));
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '04_guide_view.png') });
    // Go back to studio
    const backBtn = await page.$('button[title*="orqaga"], .guide-back-btn, header button');
    if (backBtn) await backBtn.click();
    await new Promise(r => setTimeout(r, 600));
  }

  // 5. Test real dark theme by prepending "uslub: dark" or changing theme
  console.log('Testing Dark theme via text...');
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle0' });
  await page.waitForSelector('.editor-textarea', { timeout: 10000 });
  await page.evaluate(() => {
    const textarea = document.querySelector('.editor-textarea');
    if (textarea) {
      textarea.value = `uslub: dark\n\n` + textarea.value;
      textarea.dispatchEvent(new Event('input', { bubbles: true }));
    }
  });
  await new Promise(r => setTimeout(r, 1000));
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '05_actual_dark_theme.png') });

  // 6. Test Cards mode via query param
  console.log('Testing Cards mode (?mode=cards)...');
  await page.goto('http://localhost:5173?mode=cards', { waitUntil: 'networkidle0' });
  await page.waitForSelector('.editor-textarea', { timeout: 10000 });
  await new Promise(r => setTimeout(r, 1000));
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '06_cards_mode_1440px.png') });

  // 7. Mobile hamburger menu
  console.log('Testing Mobile hamburger menu (360px)...');
  await page.setViewport({ width: 360, height: 800 });
  await new Promise(r => setTimeout(r, 600));
  const hamburger = await page.$('.nav-mobile-menu-btn');
  if (hamburger) {
    await hamburger.click();
    await new Promise(r => setTimeout(r, 400));
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '07_mobile_menu_open.png') });
  }

  await browser.close();
  console.log('Audit screenshots saved to docs/screenshots/audit/');
}

run().catch(console.error);
