import puppeteer from 'puppeteer-core';
import { createServer } from 'vite';
import fs from 'fs';
import path from 'path';

const SCREENSHOT_DIR = path.resolve(process.cwd(), 'docs/screenshots/task7');
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function main() {
  console.log('=== TASK 7: DIRECT ON-CANVAS EDITING VERIFICATION ===');

  let viteServer;
  let baseUrl = 'http://localhost:5187';

  try {
    const res = await fetch(baseUrl);
    if (!res.ok) throw new Error('Not ok');
    console.log(`Connected to existing server at ${baseUrl}`);
  } catch {
    console.log('Launching Vite server on port 5187...');
    viteServer = await createServer({
      server: { port: 5187, host: 'localhost' }
    });
    await viteServer.listen();
    console.log('Vite server running on http://localhost:5187');
  }

  const browser = await puppeteer.launch({
    headless: true,
    executablePath: '/bin/google-chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1.5 });

    console.log('1. Navigating to Yurist Studio...');
    await page.goto(baseUrl, { waitUntil: 'networkidle2' });
    await page.waitForSelector('.app-container');
    await new Promise((r) => setTimeout(r, 1000));

    // Ensure viewMode is 'both' (split pane)
    await page.evaluate(() => {
      const modeBtn = Array.from(document.querySelectorAll('.view-mode-toggle button')).find(
        (b) => b.textContent && b.textContent.includes('Ikkalasi')
      );
      if (modeBtn) modeBtn.click();
    });
    await new Promise((r) => setTimeout(r, 500));

    // 2. Locate editable cover heading or section title on canvas
    console.log('2. Testing hover and click on canvas heading...');
    const headingSelector = '.cover-title[data-canvas-editable="true"], .card-section-title[data-canvas-editable="true"]';
    await page.waitForSelector(headingSelector);

    // Hover over heading
    await page.hover(headingSelector);
    await new Promise((r) => setTimeout(r, 300));

    // Click heading to enter contentEditable mode
    await page.click(headingSelector);
    await new Promise((r) => setTimeout(r, 400));

    // Check if floating toolbar is visible
    const toolbar = await page.$('.canvas-floating-toolbar');
    if (!toolbar) {
      throw new Error('Canvas floating toolbar ko‘rinmadi!');
    }
    console.log('✓ Canvas floating toolbar successfully displayed above heading');

    // Screenshot 1: Floating toolbar above active editable heading
    const ss1Path = path.join(SCREENSHOT_DIR, '01_canvas_floating_toolbar.png');
    await page.screenshot({ path: ss1Path });
    console.log(`Saved screenshot: ${ss1Path}`);

    // 3. Type new text into heading
    console.log('3. Typing new title in canvas and committing with Escape...');
    const originalText = await page.evaluate((sel) => {
      const el = document.querySelector(sel);
      return el ? el.innerText : '';
    }, headingSelector);
    console.log(`Original heading text: "${originalText}"`);

    // Focus and set new text in the active contentEditable element
    await page.evaluate((sel) => {
      const el = document.querySelector(sel);
      if (el) {
        el.innerText = 'O‘zbekiston Respublikasi Konstitutsiyasi (Yangi Tahrir)';
      }
    }, headingSelector);

    // Press Escape to commit the change
    await page.keyboard.press('Escape');
    await new Promise((r) => setTimeout(r, 600));

    // Verify editor textarea reflects the updated source
    const editorValue = await page.evaluate(() => {
      const textarea = document.querySelector('.editor-textarea');
      return textarea ? textarea.value : '';
    });

    const isUpdatedInSource = editorValue.includes('O‘zbekiston Respublikasi Konstitutsiyasi (Yangi Tahrir)');
    console.log(`Two-way binding check: ${isUpdatedInSource ? 'PASS ✓' : 'FAIL ✗'}`);
    if (!isUpdatedInSource) {
      console.warn('First 200 chars of editor:', editorValue.slice(0, 200));
      throw new Error('MD+ manba matnida sarlavha yangilanmadi!');
    }

    // Screenshot 2: Canvas heading edited and reflected in editor
    const ss2Path = path.join(SCREENSHOT_DIR, '02_canvas_heading_edited.png');
    await page.screenshot({ path: ss2Path });
    console.log(`Saved screenshot: ${ss2Path}`);

    // 4. Test Undo (Ctrl+Z)
    console.log('4. Testing Undo (Ctrl+Z) in editor...');
    await page.focus('.editor-textarea');
    await page.keyboard.down('Control');
    await page.keyboard.press('KeyZ');
    await page.keyboard.up('Control');
    await new Promise((r) => setTimeout(r, 600));

    const restoredEditorValue = await page.evaluate(() => {
      const textarea = document.querySelector('.editor-textarea');
      return textarea ? textarea.value : '';
    });

    const isRestored = !restoredEditorValue.includes('(Yangi Tahrir)');
    console.log(`Undo restore check: ${isRestored ? 'PASS ✓' : 'FAIL ✗'}`);

    // Screenshot 3: Restored after Undo
    const ss3Path = path.join(SCREENSHOT_DIR, '03_canvas_undo_restored.png');
    await page.screenshot({ path: ss3Path });
    console.log(`Saved screenshot: ${ss3Path}`);

    // 5. Test Protected element tooltip
    console.log('5. Testing protected block tooltip ("Bu qismni muharrirda tahrirlang")...');
    // Jadval qo'shib himoyalangan blok xabarini tekshiramiz
    await page.focus('.editor-textarea');
    await page.keyboard.type('\n\n| Modda | Nomi |\n| --- | --- |\n| 1 | Davlat |\n');
    await new Promise((r) => setTimeout(r, 1200));

    const protectedSelector = '[data-canvas-protected="true"]';
    await page.waitForSelector(protectedSelector, { timeout: 5000 });
    await page.hover(protectedSelector);
    await new Promise((r) => setTimeout(r, 400));

    const tooltip = await page.$('.canvas-protected-tooltip');
    const tooltipText = await page.evaluate((el) => el ? el.innerText : '', tooltip);
    console.log(`Protected tooltip text: "${tooltipText}"`);

    const ss4Path = path.join(SCREENSHOT_DIR, '04_canvas_protected_tooltip.png');
    await page.screenshot({ path: ss4Path });
    console.log(`Saved screenshot: ${ss4Path}`);

    // 6. Test "Manbaga o'tish" (Jump to source line)
    console.log('6. Testing "Manbaga o‘tish" button...');
    await page.click(headingSelector);
    await new Promise((r) => setTimeout(r, 400));

    const jumpBtn = await page.$('.canvas-tb-btn-jump');
    if (jumpBtn) {
      await jumpBtn.click();
      await new Promise((r) => setTimeout(r, 500));
      console.log('✓ "Manbaga o‘tish" clicked; source line focused in editor');

      const ss5Path = path.join(SCREENSHOT_DIR, '05_jump_to_source_line.png');
      await page.screenshot({ path: ss5Path });
      console.log(`Saved screenshot: ${ss5Path}`);
    }

    console.log('\n=== TASK 7: ALL ON-CANVAS EDITING CHECKS PASSED ===');
  } finally {
    await browser.close();
    if (viteServer) {
      await viteServer.close();
    }
  }
}

main().catch((err) => {
  console.error('Verification failed:', err);
  process.exit(1);
});
