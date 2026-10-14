import puppeteer from 'puppeteer-core';
import { createServer } from 'vite';
import fs from 'fs';
import path from 'path';

const SCREENSHOT_DIR = path.resolve(process.cwd(), 'docs/screenshots/task8');
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function main() {
  console.log('=== TASK 8: PER-BLOCK STYLE CONTROLS VERIFICATION ===');

  let viteServer;
  let baseUrl = 'http://localhost:5173';

  try {
    const res = await fetch(baseUrl);
    if (!res.ok) throw new Error('Not ok');
    console.log(`Connected to existing server at ${baseUrl}`);
  } catch {
    console.log('Launching Vite server on port 5188...');
    viteServer = await createServer({
      server: { port: 5188, host: 'localhost' }
    });
    await viteServer.listen();
    baseUrl = 'http://localhost:5188';
    console.log(`Vite server running on ${baseUrl}`);
  }

  const browser = await puppeteer.launch({
    headless: true,
    executablePath: '/bin/google-chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 950, deviceScaleFactor: 1.5 });

    console.log('1. Navigating to Yurist Studio...');
    await page.goto(baseUrl, { waitUntil: 'networkidle2' });
    await page.waitForSelector('.app-container');
    await new Promise((r) => setTimeout(r, 1200));

    // Ensure viewMode is 'both' (split pane)
    await page.evaluate(() => {
      const modeBtn = Array.from(document.querySelectorAll('.view-mode-toggle button')).find(
        (b) => b.textContent && b.textContent.includes('Ikkalasi')
      );
      if (modeBtn) modeBtn.click();
    });
    await new Promise((r) => setTimeout(r, 600));

    // 2. Find norma block in preview
    console.log('2. Finding a norma block on canvas preview...');
    const normaSelector = '.card-scale-wrapper .block-style-wrapper .norm-plaque';
    await page.waitForSelector(normaSelector, { timeout: 10000 });

    const parentBlockSelector = '.card-scale-wrapper .block-style-wrapper:has(.norm-plaque)';

    // Hover over the norma block wrapper to reveal style trigger button
    console.log('3. Hovering over norma block and clicking "Uslub" trigger button...');
    await page.hover(parentBlockSelector);
    await new Promise((r) => setTimeout(r, 300));

    // Click the style trigger button
    const triggerSelector = `${parentBlockSelector} .block-style-trigger-btn`;
    await page.waitForSelector(triggerSelector, { timeout: 5000 });
    await page.click(triggerSelector);
    await new Promise((r) => setTimeout(r, 400));

    // 4. Verify popover opened
    await page.waitForSelector('.block-style-popover');
    console.log('✓ Block style popover successfully opened!');

    // Screenshot 1: Popover open with color grid and size buttons
    const ss1Path = path.join(SCREENSHOT_DIR, '01_block_style_popover_open.png');
    await page.screenshot({ path: ss1Path });
    console.log(`Saved screenshot: ${ss1Path}`);

    // 5. Select Green Emerald (#059669) and 'L' size
    console.log('4. Selecting Emerald Green (#059669)...');
    await page.evaluate(() => {
      const swatches = Array.from(document.querySelectorAll('.bsp-color-swatch'));
      const greenSwatch = swatches.find((s) => s.style.backgroundColor.includes('5, 150, 105') || s.getAttribute('title')?.includes('Zumrad'));
      if (greenSwatch) {
        greenSwatch.click();
      }
    });

    await new Promise((r) => setTimeout(r, 400));

    console.log('Selecting Large Size (L)...');
    await page.evaluate(() => {
      const sizeBtns = Array.from(document.querySelectorAll('.bsp-section .bsp-seg-btn'));
      const lBtn = sizeBtns.find((b) => b.textContent && b.textContent.includes('(L)'));
      if (lBtn) {
        lBtn.click();
      }
    });

    await new Promise((r) => setTimeout(r, 600));

    // Close popover by pressing Escape
    await page.keyboard.press('Escape');
    await new Promise((r) => setTimeout(r, 400));

    // Verify block now has green accent and block-size-l
    const restyledStatus = await page.evaluate(() => {
      const blockEl = document.querySelector('.card-scale-wrapper .block-style-wrapper:has(.norm-plaque)');
      if (!blockEl) return null;
      const isL = blockEl.classList.contains('block-size-l');
      const accent = blockEl.style.getPropertyValue('--block-accent');
      const blockId = blockEl.getAttribute('data-block-id');
      const normPlaque = blockEl.querySelector('.norm-plaque');
      const plaqueBorder = normPlaque ? window.getComputedStyle(normPlaque).borderLeftColor : '';
      return { isL, accent, blockId, plaqueBorder };
    });

    console.log('Restyled block verification:', restyledStatus);
    if (!restyledStatus?.isL || !restyledStatus?.accent?.includes('#059669')) {
      throw new Error(`Restyled block assertion failed: ${JSON.stringify(restyledStatus)}`);
    }
    console.log('✓ Block successfully restyled with Emerald Green (#059669) accent and Size L!');

    // Screenshot 2: Restyled norma block with green accent and L size
    const ss2Path = path.join(SCREENSHOT_DIR, '02_norma_green_accent_large_size.png');
    await page.screenshot({ path: ss2Path });
    console.log(`Saved screenshot: ${ss2Path}`);

    // 6. Test Repagination by adding text above the block
    console.log('5. Adding substantial text above the block to trigger repagination...');
    const originalBlockId = restyledStatus.blockId;

    await page.evaluate(() => {
      const textarea = document.querySelector('.editor-textarea');
      if (!textarea) return;
      const currentVal = textarea.value;

      // Find section header and insert several long paragraphs right under it
      const secIdx = currentVal.indexOf('# 1-BOB');
      if (secIdx !== -1) {
        const insertPos = currentVal.indexOf('\n', secIdx) + 1;
        const filler = `
Yangi kiritilgan ta'limot matni (repaginatsiyani sinash uchun maxsus uzun paragraf).
Ushbu bo'lim huquqiy davlat asoslari va konstitutsiyaviy normalarning bevosita amal qilishini kafolatlaydi.

Qo'shimcha sharh: Davlat xizmatchilarining kasbiy odobi va mas'uliyati to'g'risidagi qoidalar.
Har bir davlat organi o'z vakolatlari doirasida qonuniylikni ta'minlashi shart.

Uchinchi to'ldiruvchi paragraf: Repaginatsiyani amalga oshirish uchun katta hajmli matn.
Bu matn quyidagi norma blokini keyingi kartaga surishga xizmat qiladi.
`;
        const newVal = currentVal.slice(0, insertPos) + filler + currentVal.slice(insertPos);

        const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set;
        nativeSetter.call(textarea, newVal);
        textarea.dispatchEvent(new Event('input', { bubbles: true }));
        textarea.dispatchEvent(new Event('change', { bubbles: true }));
      }
    });

    // Wait for debounce (300ms) and repagination
    await new Promise((r) => setTimeout(r, 1200));

    // Confirm that the override followed the block after repagination
    const repaginatedStatus = await page.evaluate((targetId) => {
      const allBlocks = Array.from(document.querySelectorAll('.card-scale-wrapper .block-style-wrapper'));
      const matchingBlock = allBlocks.find((b) => b.getAttribute('data-block-id') === targetId);
      if (!matchingBlock) return null;

      const isL = matchingBlock.classList.contains('block-size-l');
      const accent = matchingBlock.style.getPropertyValue('--block-accent');
      const cardParent = matchingBlock.closest('.study-card-9-16');
      const cardBadge = cardParent?.querySelector('.card-footer-page-badge')?.textContent;

      return { found: true, isL, accent, cardBadge };
    }, originalBlockId);

    console.log('Post-repagination status for block', originalBlockId, ':', repaginatedStatus);
    if (!repaginatedStatus?.found || !repaginatedStatus?.isL || !repaginatedStatus?.accent?.includes('#059669')) {
      throw new Error(`Repagination override preservation failed: ${JSON.stringify(repaginatedStatus)}`);
    }
    console.log(`✓ Override faithfully preserved after repagination on card [${repaginatedStatus.cardBadge}]!`);

    // Screenshot 3: Repaginated view confirming override follows block
    const ss3Path = path.join(SCREENSHOT_DIR, '03_repagination_override_follows_block.png');
    await page.screenshot({ path: ss3Path });
    console.log(`Saved screenshot: ${ss3Path}`);

    // 7. PDF Export & Print Host Check
    console.log('6. Verifying print host and exporting PDF...');
    const printHostStatus = await page.evaluate((targetId) => {
      const host = document.querySelector('#print-export-host');
      if (!host) return null;
      const hostBlock = host.querySelector(`.block-style-wrapper[data-block-id="${targetId}"]`);
      if (!hostBlock) return { hostFound: true, blockFound: false };

      const isL = hostBlock.classList.contains('block-size-l');
      const accent = hostBlock.style.getPropertyValue('--block-accent');
      return { hostFound: true, blockFound: true, isL, accent };
    }, originalBlockId);

    console.log('Print export host verification:', printHostStatus);
    if (!printHostStatus?.blockFound || !printHostStatus?.isL || !printHostStatus?.accent?.includes('#059669')) {
      throw new Error(`Print host block override verification failed: ${JSON.stringify(printHostStatus)}`);
    }
    console.log('✓ Print host has the exact same block override (Green accent + L size)!');

    // Generate real PDF output
    const pdfPath = path.join(SCREENSHOT_DIR, 'task8_block_restyle.pdf');
    await page.pdf({
      path: pdfPath,
      printBackground: true,
      format: 'A4'
    });
    console.log(`Generated real PDF: ${pdfPath}`);

    // Screenshot 4: Full preview verification
    const ss4Path = path.join(SCREENSHOT_DIR, '04_pdf_print_preview.png');
    await page.screenshot({ path: ss4Path });
    console.log(`Saved screenshot: ${ss4Path}`);

    // 8. Test "Blok uslubini tozalash" (Reset action)
    console.log('7. Testing "Blok uslubini tozalash" (Reset action)...');
    const targetBlockSelector = `.card-scale-wrapper .block-style-wrapper[data-block-id="${originalBlockId}"]`;
    await page.hover(targetBlockSelector);
    await new Promise((r) => setTimeout(r, 200));

    const triggerBtn = await page.$(`${targetBlockSelector} .block-style-trigger-btn`);
    if (triggerBtn) {
      await triggerBtn.click();
      await new Promise((r) => setTimeout(r, 400));

      const resetBtnSelector = '.bsp-reset-btn';
      await page.waitForSelector(resetBtnSelector, { timeout: 3000 });
      await page.click(resetBtnSelector);
      await new Promise((r) => setTimeout(r, 500));

      const resetStatus = await page.evaluate((targetId) => {
        const blockEl = document.querySelector(`.card-scale-wrapper .block-style-wrapper[data-block-id="${targetId}"]`);
        if (!blockEl) return null;
        const isL = blockEl.classList.contains('block-size-l');
        const accent = blockEl.style.getPropertyValue('--block-accent');
        return { isL, accent };
      }, originalBlockId);

      console.log('Post-reset block status:', resetStatus);
      if (resetStatus?.isL || resetStatus?.accent) {
        throw new Error('Reset failed: block still has overrides!');
      }
      console.log('✓ "Blok uslubini tozalash" cleanly reset the block back to document style!');
    }

    console.log('\n=== TASK 8 VERIFICATION COMPLETE: ALL CHECKS PASSED ===\n');
  } finally {
    await browser.close();
    if (viteServer) {
      await viteServer.close();
    }
  }
}

main().catch((err) => {
  console.error('Task 8 verification failed:', err);
  process.exit(1);
});
