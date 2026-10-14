import fs from 'node:fs';
import path from 'node:path';
import puppeteer from 'puppeteer-core';

const SCREENSHOT_DIR = path.resolve(process.cwd(), 'docs/screenshots');
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function run() {
  let testUrl = 'http://localhost:5173';
  let server = null;

  try {
    const res = await fetch(testUrl);
    if (!res.ok) throw new Error('Not running');
  } catch {
    console.log('Local dev server not detected, launching Vite programmatically on port 5183...');
    const { createServer } = await import('vite');
    server = await createServer({ server: { port: 5183 } });
    await server.listen();
    testUrl = 'http://localhost:5183';
    console.log(`Vite server started at ${testUrl}`);
  }

  console.log('Connecting to browser and launching Puppeteer...');
  const browser = await puppeteer.launch({
    executablePath: '/bin/google-chrome',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();

  console.log(`Navigating to ${testUrl}...`);
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto(testUrl, { waitUntil: 'networkidle0' });
  await page.waitForSelector('.editor-textarea', { timeout: 15000 });
  await new Promise((r) => setTimeout(r, 1000));

  // 1. Default state (1440px)
  console.log('1. Capturing Default State (1440px)...');
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '01_default_state_1440px.png') });

  // Helper to click mode button
  async function selectMode(modeText) {
    const buttons = await page.$$('.mode-tab');
    for (const btn of buttons) {
      const text = await page.evaluate(el => el.textContent?.trim(), btn);
      if (text && text.includes(modeText)) {
        await btn.click();
        await new Promise(r => setTimeout(r, 600));
        return;
      }
    }
  }

  // 2. Yozish (Edit mode)
  console.log('2. Capturing Yozish mode (1440px)...');
  await selectMode('Yozish');
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '02_yozish_1440px.png') });

  // 3. Ko'rish (Preview mode)
  console.log('3. Capturing Ko‘rish mode (1440px)...');
  await selectMode('Ko‘rish');
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '03_korish_1440px.png') });

  // 4. Ikkalasi (Both mode)
  console.log('4. Capturing Ikkalasi mode (1440px)...');
  await selectMode('Ikkalasi');
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '04_ikkalasi_1440px.png') });

  // Helper to select document theme
  async function selectTheme(themeLabel) {
    const themeBtn = await page.$('.dropdown-menu-wrap button[title*="uslubini tanlash"]');
    if (themeBtn) {
      await themeBtn.click();
      await new Promise(r => setTimeout(r, 400));
      const items = await page.$$('.dropdown-popover-card .dropdown-menu-item');
      for (const item of items) {
        const text = await page.evaluate(el => el.textContent?.trim(), item);
        if (text && text.includes(themeLabel)) {
          await item.click();
          await new Promise(r => setTimeout(r, 600));
          break;
        }
      }
      // Click body to dismiss dropdown menu
      await page.mouse.click(200, 200);
      await new Promise(r => setTimeout(r, 300));
    }
  }

  // 5. Classic Theme (Mumtoz)
  console.log('5. Capturing Classic theme (Mumtoz) (1440px)...');
  await selectTheme('Mumtoz');
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '05_theme_classic_1440px.png') });

  // 6. Modern Theme (Zamonaviy)
  console.log('6. Capturing Modern theme (Zamonaviy) (1440px)...');
  await selectTheme('Zamonaviy');
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '06_theme_modern_1440px.png') });

  // 7. Dark Theme (Qorong‘i)
  console.log('7. Capturing Dark theme (Qorong‘i) (1440px)...');
  await selectTheme('Qorong‘i');
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '07_theme_dark_1440px.png') });

  // 8. Minimal Theme (Minimal)
  console.log('8. Capturing Minimal theme (Minimal) (1440px)...');
  await selectTheme('Minimal');
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '08_theme_minimal_1440px.png') });

  // Return to Classic (Mumtoz)
  await selectTheme('Mumtoz');

  // 9. Fullscreen Presentation Mode
  console.log('9. Capturing Fullscreen Presentation Mode (1440px)...');
  const fsBtn = await page.$('button[title*="To\'liq ekran"], button[title*="To‘liq ekran"]');
  if (fsBtn) {
    await fsBtn.click();
    await new Promise(r => setTimeout(r, 800));
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '09_fullscreen_presentation_1440px.png') });
    // Exit fullscreen
    await page.keyboard.press('Escape');
    await new Promise(r => setTimeout(r, 500));
  }

  // 10. Mobile 360px viewport
  console.log('10. Setting viewport to 360px (mobile)...');
  await page.setViewport({ width: 360, height: 800 });
  await new Promise(r => setTimeout(r, 800));
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '10_mobile_360px_default.png') });

  console.log('11. Capturing Mobile 360px Yozish...');
  await selectMode('Yozish');
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '11_mobile_360px_yozish.png') });

  console.log('12. Capturing Mobile 360px Ko‘rish...');
  await selectMode('Ko‘rish');
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '12_mobile_360px_korish.png') });

  // DOM Layout & Defect Audit
  console.log('Auditing DOM metrics and potential layout defects...');
  await page.setViewport({ width: 1440, height: 900 });
  await selectMode('Ikkalasi');
  await new Promise(r => setTimeout(r, 500));

  const auditResults = await page.evaluate(() => {
    const defects = [];

    // 1. Clipping check on study cards
    const cardContentAreas = Array.from(document.querySelectorAll('.study-card-9-16 .card-content-area'));
    cardContentAreas.forEach((area, idx) => {
      const isClipping = area.scrollHeight > area.clientHeight + 2;
      if (isClipping) {
        defects.push({
          type: 'clipping',
          element: `Card #${idx + 1} .card-content-area`,
          scrollHeight: area.scrollHeight,
          clientHeight: area.clientHeight,
          overflowPx: area.scrollHeight - area.clientHeight
        });
      }
    });

    // 2. Page body horizontal overflow
    const bodyScrollW = document.body.scrollWidth;
    const bodyClientW = document.documentElement.clientWidth;
    if (bodyScrollW > bodyClientW) {
      defects.push({
        type: 'horizontal_overflow',
        element: 'document.body',
        scrollWidth: bodyScrollW,
        clientWidth: bodyClientW,
        overflowPx: bodyScrollW - bodyClientW
      });
    }

    // 3. Contrast / Background check on study card
    const card = document.querySelector('.study-card-9-16');
    let cardBg = '';
    let cardColor = '';
    if (card) {
      const computed = window.getComputedStyle(card);
      cardBg = computed.backgroundColor;
      cardColor = computed.color;
    }

    return {
      totalCards: cardContentAreas.length,
      cardBg,
      cardColor,
      defects
    };
  });

  console.log('Audit Results:', JSON.stringify(auditResults, null, 2));

  await browser.close();
  if (server) await server.close();
  console.log('Night Run capture completed successfully!');
}

run().catch(err => {
  console.error('Error during night run capture:', err);
  process.exit(1);
});
