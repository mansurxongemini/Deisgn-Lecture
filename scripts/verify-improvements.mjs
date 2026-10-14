import fs from 'node:fs';
import path from 'node:path';
import puppeteer from 'puppeteer-core';

const VERIFY_DIR = path.resolve(process.cwd(), 'docs/screenshots/verify');
if (!fs.existsSync(VERIFY_DIR)) {
  fs.mkdirSync(VERIFY_DIR, { recursive: true });
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
  await new Promise(r => setTimeout(r, 600));

  // 1. Initial Desktop view with new unified format selector (A4 mode default)
  console.log('1. Capturing Desktop A4 mode with new format selector...');
  await page.screenshot({ path: path.join(VERIFY_DIR, '01_desktop_a4_mode.png') });

  // 2. Switch to 9:16 Kartalar mode via the unified format selector
  console.log('2. Switching to 9:16 Kartalar mode...');
  const cardTabs = await page.$$('.output-mode-tab');
  for (const tab of cardTabs) {
    const text = await page.evaluate(el => el.textContent?.trim(), tab);
    if (text && text.includes('Kartalar')) {
      await tab.click();
      await new Promise(r => setTimeout(r, 800));
      break;
    }
  }
  await page.screenshot({ path: path.join(VERIFY_DIR, '02_desktop_cards_mode.png') });

  // 3. Switch to O'quvchi mode via the unified format selector
  console.log('3. Switching to O‘quvchi mode...');
  const readerTabs = await page.$$('.output-mode-tab');
  for (const tab of readerTabs) {
    const text = await page.evaluate(el => el.textContent?.trim(), tab);
    if (text && text.includes('O‘quvchi')) {
      await tab.click();
      await new Promise(r => setTimeout(r, 800));
      break;
    }
  }
  await page.screenshot({ path: path.join(VERIFY_DIR, '03_desktop_reader_mode.png') });

  // Switch back to A4 for design test
  const a4Tabs = await page.$$('.output-mode-tab');
  for (const tab of a4Tabs) {
    const text = await page.evaluate(el => el.textContent?.trim(), tab);
    if (text && text.includes('A4')) {
      await tab.click();
      await new Promise(r => setTimeout(r, 600));
      break;
    }
  }

  // 4. Open More Menu to verify no Dizayn button
  console.log('4. Opening More menu (...) to verify calm menu...');
  const moreBtn = await page.$('.nav-btn-more');
  if (moreBtn) {
    await moreBtn.click();
    await new Promise(r => setTimeout(r, 600));
    await page.screenshot({ path: path.join(VERIFY_DIR, '04_more_menu_open.png') });
    await moreBtn.click();
    await new Promise(r => setTimeout(r, 400));
  }

  // 5. Mobile 360px viewport tests
  console.log('5. Setting viewport to 360px (mobile)...');
  await page.setViewport({ width: 360, height: 800 });
  await new Promise(r => setTimeout(r, 800));
  await page.screenshot({ path: path.join(VERIFY_DIR, '05_mobile_360px_preview.png') });

  // 6. Mobile 360px Yozish (Editor) mode
  console.log('6. Mobile 360px Yozish mode...');
  const modeTabs = await page.$$('.mode-tab');
  for (const tab of modeTabs) {
    const text = await page.evaluate(el => el.textContent?.trim(), tab);
    if (text && text.includes('Yozish')) {
      await tab.click();
      await new Promise(r => setTimeout(r, 600));
      break;
    }
  }
  await page.screenshot({ path: path.join(VERIFY_DIR, '06_mobile_360px_editor.png') });

  // 7. Mobile hamburger menu with Dizayn button
  console.log('7. Mobile menu open...');
  const mobileMenuBtn = await page.$('.nav-mobile-menu-btn');
  if (mobileMenuBtn) {
    await mobileMenuBtn.click();
    await new Promise(r => setTimeout(r, 500));
    await page.screenshot({ path: path.join(VERIFY_DIR, '07_mobile_menu_open.png') });
  }

  await browser.close();
  console.log('Verification screenshots saved to docs/screenshots/verify/');
}

run().catch(console.error);
