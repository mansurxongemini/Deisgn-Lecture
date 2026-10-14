import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const ARTIFACT_DIR = '/home/mansurxon/.gemini/antigravity-ide/brain/0c928012-c20e-4f4f-bd89-80e4dcffdca7';

async function main() {
  console.log('Capturing Phase V-D White Minimal Floating Toolbar Screenshots...');

  const browser = await puppeteer.launch({
    headless: true,
    executablePath: '/bin/google-chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle2' });
    await page.waitForSelector('.app-container');
    await new Promise((r) => setTimeout(r, 1000));

    // 1. Ensure viewMode is 'both' or 'preview'
    await page.evaluate(() => {
      localStorage.setItem('yurist_preview_output_mode', 'a4');
    });
    await page.waitForSelector('.a4-scroll-viewport');
    await new Promise((r) => setTimeout(r, 800));

    // 2. Click an editable paragraph on the A4 page
    const editable = await page.waitForSelector('[data-canvas-editable="true"]');
    await editable.click();
    await new Promise((r) => setTimeout(r, 300));

    // 3. Make text selection inside the active element
    await page.evaluate(() => {
      const activeEl = document.querySelector('.canvas-is-editing');
      if (activeEl) {
        const range = document.createRange();
        range.selectNodeContents(activeEl);
        const sel = window.getSelection();
        sel?.removeAllRanges();
        sel?.addRange(range);
        activeEl.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
      }
    });
    await new Promise((r) => setTimeout(r, 300));

    // 4. Click the color palette button in toolbar to reveal the 7-color palette popover
    await page.evaluate(() => {
      const colorBtn = document.querySelector('button[aria-label="Rang tanlash"]');
      if (colorBtn) colorBtn.click();
    });
    await new Promise((r) => setTimeout(r, 400));

    // Capture Desktop Screenshot
    const desktopPath = path.join(ARTIFACT_DIR, 'phase_vd_desktop_toolbar_1440x900.png');
    await page.screenshot({ path: desktopPath });
    console.log('Saved:', desktopPath);

    // Capture Closeup of Floating Toolbar with open popover
    const clip = await page.evaluate(() => {
      const tbs = Array.from(document.querySelectorAll('.canvas-floating-toolbar'));
      const tb = tbs.find(el => el.getBoundingClientRect().width > 0) || tbs[0];
      const dd = document.querySelector('.canvas-tb-color-dropdown');
      if (!tb) return null;
      const rectTb = tb.getBoundingClientRect();
      const rectDd = dd ? dd.getBoundingClientRect() : rectTb;
      const top = Math.min(rectTb.top, rectDd.top) - 12;
      const bottom = Math.max(rectTb.bottom, rectDd.bottom) + 12;
      const left = Math.min(rectTb.left, rectDd.left) - 16;
      const right = Math.max(rectTb.right, rectDd.right) + 16;
      return {
        x: Math.max(0, left),
        y: Math.max(0, top),
        width: right - left,
        height: bottom - top
      };
    });
    if (clip) {
      console.log('CLIP IS:', clip);
      const closeupPath = path.join(ARTIFACT_DIR, 'phase_vd_toolbar_closeup.png');
      await page.screenshot({ path: closeupPath, clip });
      console.log('Saved closeup with dropdown:', closeupPath);
    }

    // 5. Mobile 390x844 in Reader View
    await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });
    await page.evaluate(() => {
      localStorage.setItem('yurist_preview_output_mode', 'reader');
    });
    await page.reload({ waitUntil: 'networkidle2' });
    await page.waitForSelector('.screen-reader-container');
    await new Promise((r) => setTimeout(r, 800));

    const mobileEditable = await page.waitForSelector('[data-canvas-editable="true"]');
    await mobileEditable.click();
    await new Promise((r) => setTimeout(r, 300));

    await page.evaluate(() => {
      const activeEl = document.querySelector('.canvas-is-editing');
      if (activeEl) {
        const range = document.createRange();
        range.selectNodeContents(activeEl);
        const sel = window.getSelection();
        sel?.removeAllRanges();
        sel?.addRange(range);
        activeEl.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
      }
    });
    await new Promise((r) => setTimeout(r, 300));

    const mobilePath = path.join(ARTIFACT_DIR, 'phase_vd_mobile_toolbar_390x844.png');
    await page.screenshot({ path: mobilePath });
    console.log('Saved:', mobilePath);

  } catch (err) {
    console.error('Error during screenshot capture:', err);
  } finally {
    await browser.close();
  }
}

main();
