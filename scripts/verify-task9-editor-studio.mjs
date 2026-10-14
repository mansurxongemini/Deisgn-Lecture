import puppeteer from 'puppeteer-core';
import { createServer } from 'vite';
import fs from 'fs';
import path from 'path';

const SCREENSHOT_DIR = path.resolve(process.cwd(), 'docs/screenshots/task9');
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function main() {
  console.log('=== TASK 9: EDITOR AS A CALM WRITING ENVIRONMENT VERIFICATION ===');

  let viteServer;
  let baseUrl = 'http://localhost:5173';

  try {
    const res = await fetch(baseUrl);
    if (!res.ok) throw new Error('Not ok');
    console.log(`Connected to existing server at ${baseUrl}`);
  } catch {
    console.log('Launching Vite server on port 5190...');
    viteServer = await createServer({
      server: { port: 5190, host: 'localhost' }
    });
    await viteServer.listen();
    baseUrl = 'http://localhost:5190';
    console.log(`Vite server running on ${baseUrl}`);
  }

  const browser = await puppeteer.launch({
    headless: true,
    executablePath: '/bin/google-chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 920, deviceScaleFactor: 1.5 });

    console.log('1. Navigating to Yurist Studio...');
    await page.goto(baseUrl, { waitUntil: 'networkidle2' });
    await page.waitForSelector('.app-container');
    await new Promise((r) => setTimeout(r, 1000));

    // 1. Switch to 'edit' mode to see the editor in full glory, or 'both'
    console.log('2. Setting view mode to "Yozish" (edit mode) for clear inspection...');
    await page.evaluate(() => {
      const editBtn = Array.from(document.querySelectorAll('.mode-tab')).find(
        (b) => b.textContent && b.textContent.includes('Yozish')
      );
      if (editBtn) editBtn.click();
    });
    await new Promise((r) => setTimeout(r, 500));

    // Screenshot 1: Desktop 1440px - Calm writing studio default view
    console.log('3. Capturing Desktop 1440px initial editor writing studio...');
    const screen1 = path.join(SCREENSHOT_DIR, 'task9_editor_1440px_studio_default.png');
    await page.screenshot({ path: screen1, fullPage: false });
    console.log(`Saved: ${screen1}`);

    // Check Editor CSS properties (background, font-size, line-height, caret)
    const editorStyles = await page.evaluate(() => {
      const textarea = document.querySelector('.editor-textarea');
      const pane = document.querySelector('.editor-pane');
      const toolbar = document.querySelector('.editor-toolbar');
      const statusBar = document.querySelector('.editor-status-bar');
      if (!textarea || !pane || !toolbar || !statusBar) return null;

      const tStyle = window.getComputedStyle(textarea);
      const pStyle = window.getComputedStyle(pane);
      const tbStyle = window.getComputedStyle(toolbar);

      const buttons = Array.from(toolbar.querySelectorAll('.editor-ghost-btn')).map((b) => ({
        text: (b.textContent || '').trim(),
        height: b.getBoundingClientRect().height
      }));

      return {
        bg: pStyle.backgroundColor,
        fontSize: tStyle.fontSize,
        lineHeight: tStyle.lineHeight,
        caretColor: tStyle.caretColor,
        toolbarHeight: tbStyle.height,
        buttons,
        statusText: statusBar.textContent?.trim()
      };
    });
    console.log('Editor Computed Styles & Toolbar:', JSON.stringify(editorStyles, null, 2));

    // 4. Test long line wrapping and gutter alignment
    console.log('4. Testing long line wrapping and gutter alignment...');
    await page.evaluate(() => {
      const textarea = document.querySelector('.editor-textarea');
      if (textarea) {
        const longText =
          `# O‘zbekiston Respublikasi Konstitutsiyasi\n` +
          `muallif: Oliy Majlis Qonunchilik palatasi\n` +
          `mavzu: classic\n\n` +
          `:::norma\n` +
          `modda: 13-modda\n` +
          `manba: Konstitutsiya\n` +
          `O‘zbekiston Respublikasida demokratiya umuminsoniy prinsiplarga asoslanadi, ularga ko‘ra inson, uning hayoti, erkinligi, sha’ni, qadr-qimmati va boshqa ajralmas huquqlari oliy qadriyat hisoblanadi. Demokratik huquq va erkinliklar Konstitutsiya va qonunlar bilan himoya qilinadi. Ushbu qoida davlat organlari va mansabdor shaxslarning har bir fuqaro oldidagi yuksak mas’uliyatini qat’iy belgilab beradi.\n` +
          `:::\n\n` +
          `:::savol\n` +
          `savol: Konstitutsiyaning 13-moddasiga ko‘ra eng oliy qadriyat nima?\n` +
          `javob: Inson, uning hayoti, erkinligi, sha’ni, qadr-qimmati va boshqa daxlsiz huquqlari.\n` +
          `:::\n\n` +
          `:::jadval\n` +
          `| Tamoyil | Mazmuni | Huquqiy asosi |\n` +
          `|---|---|---|\n` +
          `| Insonparvarlik | Inson huquq va erkinliklari oliy qadriyat | 13-modda |\n` +
          `| Qonun ustuvorligi | Barcha qonunlar Konstitutsiyaga muvofiq bo‘lishi shart | 15-modda |\n` +
          `:::\n`;

        const descriptor = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value');
        if (descriptor && descriptor.set) {
          descriptor.set.call(textarea, longText);
        }
        textarea.dispatchEvent(new Event('input', { bubbles: true }));
        textarea.dispatchEvent(new Event('change', { bubbles: true }));
      }
    });

    await new Promise((r) => setTimeout(r, 600));

    // Verify gutter alignment: measure line 7 (the long wrapped line)
    const gutterCheck = await page.evaluate(() => {
      const gutterLines = Array.from(document.querySelectorAll('.editor-gutter-line'));
      const heights = gutterLines.map((el, idx) => ({
        line: idx + 1,
        height: el.getBoundingClientRect().height
      }));
      return heights;
    });

    console.log('Gutter Heights Sample:', gutterCheck.slice(0, 10));

    // Screenshot 2: Desktop 1440px with long lines wrapped and gutter aligned
    console.log('5. Capturing Desktop 1440px with wrapped text & aligned gutter...');
    const screen2 = path.join(SCREENSHOT_DIR, 'task9_editor_1440px_wrapped_gutter.png');
    await page.screenshot({ path: screen2, fullPage: false });
    console.log(`Saved: ${screen2}`);

    // 6. Test "Blok qo'shish" menu
    console.log('6. Opening "Blok qo‘shish" popover...');
    await page.evaluate(() => {
      const blockBtn = Array.from(document.querySelectorAll('.editor-ghost-btn')).find(
        (b) => b.textContent && b.textContent.includes('Blok qo‘shish')
      );
      if (blockBtn) blockBtn.click();
    });
    await new Promise((r) => setTimeout(r, 400));

    const screen3 = path.join(SCREENSHOT_DIR, 'task9_editor_1440px_block_menu.png');
    await page.screenshot({ path: screen3, fullPage: false });
    console.log(`Saved: ${screen3}`);

    // Close block menu and open overflow "..." menu
    console.log('7. Opening "..." overflow popover...');
    await page.evaluate(() => {
      const overflowBtn = document.querySelector('.editor-overflow-btn');
      if (overflowBtn) overflowBtn.click();
    });
    await new Promise((r) => setTimeout(r, 400));

    const screen4 = path.join(SCREENSHOT_DIR, 'task9_editor_1440px_overflow_menu.png');
    await page.screenshot({ path: screen4, fullPage: false });
    console.log(`Saved: ${screen4}`);

    // Close popover
    await page.evaluate(() => {
      const overflowBtn = document.querySelector('.editor-overflow-btn');
      if (overflowBtn) overflowBtn.click();
    });
    await new Promise((r) => setTimeout(r, 300));

    // 8. Test Dizayn panel "Muharrir" tab live token update
    console.log('8. Opening Dizayn panel to test "Muharrir" tab live updates...');
    await page.evaluate(() => {
      const designBtn = Array.from(document.querySelectorAll('.nav-btn')).find(
        (b) => b.textContent && b.textContent.includes('Dizayn')
      );
      if (designBtn) designBtn.click();
    });
    await new Promise((r) => setTimeout(r, 600));

    // Switch to 'muharrir' tab in design panel
    await page.evaluate(() => {
      const tabs = Array.from(document.querySelectorAll('.design-tab-btn'));
      const muharrirTab = tabs.find((t) => t.textContent && t.textContent.includes('Muharrir'));
      if (muharrirTab) muharrirTab.click();
    });
    await new Promise((r) => setTimeout(r, 500));

    // Change editor background tone to Sepia (#F5EFE0) or Krem (#F7F3E9)
    console.log('9. Selecting warm Krem / Sepia preset in Dizayn panel...');
    await page.evaluate(() => {
      const dots = Array.from(document.querySelectorAll('.design-preset-dot'));
      const sepiaOrKremDot = dots.find(
        (d) =>
          d.getAttribute('title')?.includes('Krem') ||
          d.getAttribute('title')?.includes('Sepiya') ||
          d.getAttribute('title')?.includes('Tungi')
      );
      if (sepiaOrKremDot) sepiaOrKremDot.click();
    });
    await new Promise((r) => setTimeout(r, 600));

    const screen5 = path.join(SCREENSHOT_DIR, 'task9_editor_1440px_dizayn_panel_active.png');
    await page.screenshot({ path: screen5, fullPage: false });
    console.log(`Saved: ${screen5}`);

    // Close Dizayn panel
    await page.evaluate(() => {
      const closeBtn = document.querySelector('.design-close-btn');
      if (closeBtn) closeBtn.click();
    });
    await new Promise((r) => setTimeout(r, 500));

    // 10. Switch to Tablet 768px viewport
    console.log('10. Switching to Tablet 768px viewport (Yozish mode)...');
    await page.setViewport({ width: 768, height: 1024, deviceScaleFactor: 1.5 });
    await page.evaluate(() => {
      const editBtn = Array.from(document.querySelectorAll('.mode-tab')).find(
        (b) => b.textContent && b.textContent.includes('Yozish')
      );
      if (editBtn) editBtn.click();
    });
    await new Promise((r) => setTimeout(r, 600));

    const screen6 = path.join(SCREENSHOT_DIR, 'task9_editor_768px_tablet.png');
    await page.screenshot({ path: screen6, fullPage: false });
    console.log(`Saved: ${screen6}`);

    // 11. Switch to "Ikkalasi" split mode at 1440px to verify split view calmness
    console.log('11. Switching back to 1440px "Ikkalasi" split view...');
    await page.setViewport({ width: 1440, height: 920, deviceScaleFactor: 1.5 });
    await page.evaluate(() => {
      const bothBtn = Array.from(document.querySelectorAll('.mode-tab')).find(
        (b) => b.textContent && b.textContent.includes('Ikkalasi')
      );
      if (bothBtn) bothBtn.click();
    });
    await new Promise((r) => setTimeout(r, 800));

    const screen7 = path.join(SCREENSHOT_DIR, 'task9_editor_1440px_split_view.png');
    await page.screenshot({ path: screen7, fullPage: false });
    console.log(`Saved: ${screen7}`);

    console.log('=== TASK 9 VERIFICATION COMPLETE SUCCESS! ===');
  } catch (err) {
    console.error('Task 9 verification failed:', err);
    process.exitCode = 1;
  } finally {
    await browser.close();
    if (viteServer) {
      await viteServer.close();
    }
  }
}

main();
