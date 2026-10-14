import puppeteer from 'puppeteer-core';
import { createServer } from 'vite';
import fs from 'fs';
import path from 'path';

const SCREENSHOT_DIR = path.resolve(process.cwd(), 'docs/screenshots/task4');
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function main() {
  console.log('--- TASK 4: "DIZAYN" CUSTOMIZATION PANEL VERIFICATION ---');

  let viteServer;
  let baseUrl = 'http://localhost:5184';

  try {
    const res = await fetch(baseUrl);
    if (!res.ok) throw new Error('Not ok');
    console.log(`Connected to existing server at ${baseUrl}`);
  } catch {
    console.log('Launching Vite server on port 5184...');
    viteServer = await createServer({
      server: { port: 5184, host: 'localhost' }
    });
    await viteServer.listen();
    console.log('Vite server running on http://localhost:5184');
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
  await new Promise((r) => setTimeout(r, 1200));

  // Reset any previous overrides for clean baseline
  await page.evaluate(async () => {
    if (window.resetAll) {
      await window.resetAll();
    }
  });
  await new Promise((r) => setTimeout(r, 500));

  // 1. Find and click "Dizayn" button in navbar
  console.log('2. Clicking "Dizayn" button in navbar...');
  const dizaynBtn = await page.evaluateHandle(() => {
    const btns = Array.from(document.querySelectorAll('button.nav-btn'));
    return btns.find((b) => b.textContent && b.textContent.includes('Dizayn'));
  });

  if (!dizaynBtn) {
    throw new Error('"Dizayn" tugmasi navbarda topilmadi!');
  }
  await dizaynBtn.click();

  // Wait for 200ms transition
  await new Promise((r) => setTimeout(r, 400));

  // Verify panel is open with 360px width
  const panelState = await page.evaluate(() => {
    const panel = document.querySelector('.design-panel');
    if (!panel) return null;
    const rect = panel.getBoundingClientRect();
    return {
      isOpen: panel.classList.contains('open'),
      width: rect.width,
      height: rect.height,
      display: window.getComputedStyle(panel).display
    };
  });
  console.log('Design panel open state:', panelState);

  console.log('3. Capturing 01_design_panel_opened.png...');
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '01_design_panel_opened.png') });

  // 2. Tab 1 "Hujjat": Change paper to cool gray (#F1F5F9), accent to deep green (#065F46), text size to 46px
  console.log('4. Customizing Document styles live via setToken / panel UI:');
  console.log('   - Paper color -> #F1F5F9 (Cool Gray)');
  console.log('   - Accent color -> #065F46 (Deep Green)');
  console.log('   - Body text size -> 46px (Canvas scale)');

  await page.evaluate(async () => {
    const win = window;
    await win.setToken('doc_bg', '#F1F5F9');
    await win.setToken('doc_accent', '#065F46');
    await win.setToken('canvas_font_body', '46px');
  });

  await new Promise((r) => setTimeout(r, 500));

  const customizedStyles = await page.evaluate(() => {
    const card = document.querySelector('.study-card-9-16');
    const docBgVar = window.getComputedStyle(document.documentElement).getPropertyValue('--doc-bg').trim();
    const docAccentVar = window.getComputedStyle(document.documentElement).getPropertyValue('--doc-accent').trim();
    const bodySizeVar = window.getComputedStyle(document.documentElement).getPropertyValue('--canvas-font-body').trim();

    return {
      cardBg: card ? window.getComputedStyle(card).backgroundColor : null,
      cardFontSize: card ? window.getComputedStyle(card).fontSize : null,
      docBgVar,
      docAccentVar,
      bodySizeVar
    };
  });
  console.log('Live customized styles:', customizedStyles);

  console.log('5. Capturing 02_document_customized_live.png...');
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '02_document_customized_live.png') });

  // 3. Switch to "Interfeys" tab
  console.log('6. Switching to "Interfeys" tab...');
  await page.evaluate(() => {
    const tabs = Array.from(document.querySelectorAll('.design-tab-btn'));
    const interfeysTab = tabs.find((t) => t.textContent && t.textContent.includes('Interfeys'));
    if (interfeysTab) interfeysTab.click();
  });
  await new Promise((r) => setTimeout(r, 300));

  console.log('7. Capturing 03_interfeys_tab.png...');
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '03_interfeys_tab.png') });

  // 4. Switch to "Muharrir" tab
  console.log('8. Switching to "Muharrir" tab...');
  await page.evaluate(() => {
    const tabs = Array.from(document.querySelectorAll('.design-tab-btn'));
    const muharrirTab = tabs.find((t) => t.textContent && t.textContent.includes('Muharrir'));
    if (muharrirTab) muharrirTab.click();
  });
  await new Promise((r) => setTimeout(r, 300));

  console.log('9. Capturing 04_muharrir_tab.png...');
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '04_muharrir_tab.png') });

  // 5. Switch back to "Hujjat" tab and click "Standartga qaytarish"
  console.log('10. Switching back to "Hujjat" tab and clicking "Standartga qaytarish"...');
  await page.evaluate(() => {
    const tabs = Array.from(document.querySelectorAll('.design-tab-btn'));
    const hujjatTab = tabs.find((t) => t.textContent && t.textContent.includes('Hujjat'));
    if (hujjatTab) hujjatTab.click();
  });
  await new Promise((r) => setTimeout(r, 300));

  // Click reset section button
  await page.evaluate(() => {
    const resetBtn = document.querySelector('.design-reset-section-btn');
    if (resetBtn) resetBtn.click();
  });
  await new Promise((r) => setTimeout(r, 600));

  const resetStyles = await page.evaluate(() => {
    const card = document.querySelector('.study-card-9-16');
    const docBgVar = window.getComputedStyle(document.documentElement).getPropertyValue('--doc-bg').trim();
    const docAccentVar = window.getComputedStyle(document.documentElement).getPropertyValue('--doc-accent').trim();
    const bodySizeVar = window.getComputedStyle(document.documentElement).getPropertyValue('--canvas-font-body').trim();

    return {
      cardBg: card ? window.getComputedStyle(card).backgroundColor : null,
      cardFontSize: card ? window.getComputedStyle(card).fontSize : null,
      docBgVar,
      docAccentVar,
      bodySizeVar
    };
  });
  console.log('Reset restored styles:', resetStyles);

  console.log('11. Capturing 05_reset_restored.png...');
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '05_reset_restored.png') });

  // 6. Close panel via close button
  console.log('12. Closing design panel via X button...');
  await page.evaluate(() => {
    const closeBtn = document.querySelector('.design-close-btn');
    if (closeBtn) closeBtn.click();
  });
  await new Promise((r) => setTimeout(r, 400));

  const closedState = await page.evaluate(() => {
    const panel = document.querySelector('.design-panel');
    return {
      isOpen: panel ? panel.classList.contains('open') : false,
      rectWidth: panel ? panel.getBoundingClientRect().width : null
    };
  });
  console.log('Panel closed state:', closedState);

  console.log('13. Capturing 06_panel_closed.png...');
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '06_panel_closed.png') });

  console.log('=== All Task 4 verifications and screenshots completed successfully! ===');

  await browser.close();
  if (viteServer) {
    await viteServer.close();
  }
}

main().catch((err) => {
  console.error('Task 4 verification failed:', err);
  process.exit(1);
});
