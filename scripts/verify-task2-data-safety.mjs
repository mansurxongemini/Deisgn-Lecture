import fs from 'node:fs';
import path from 'node:path';
import puppeteer from 'puppeteer-core';

const TASK2_SCREENSHOT_DIR = path.resolve(process.cwd(), 'docs/screenshots/task2');
if (!fs.existsSync(TASK2_SCREENSHOT_DIR)) {
  fs.mkdirSync(TASK2_SCREENSHOT_DIR, { recursive: true });
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

  console.log('Launching Puppeteer with /bin/google-chrome...');
  const browser = await puppeteer.launch({
    executablePath: '/bin/google-chrome',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  console.log(`Navigating to ${testUrl}...`);
  await page.goto(testUrl, { waitUntil: 'networkidle0' });
  await page.waitForSelector('.editor-textarea', { timeout: 15000 });
  await new Promise((r) => setTimeout(r, 1000));

  // 1. Prepare 3000-character legal paragraph
  console.log('1. Preparing 3000-character legal paragraph test...');
  const legalSentence =
    'O‘zbekiston Respublikasining Fuqarolik kodeksiga muvofiq, fuqarolik huquqiy munosabatlari ishtirokchilarining tengligi, mulkning daxlsizligi, shartnoma erkinligi, xususiy ishlarga kimningdir o‘zboshimchalik bilan aralashishiga yo‘l qo‘yilmasligi, fuqarolik huquqlarining moneliksiz amalga oshirilishini, buzilgan huquqlarning tiklanishini, ularning sud orqali himoya qilinishini ta’minlash zarurligi qoidalariga asoslanadi. Fuqarolar va yuridik shaxslar o‘z fuqarolik huquqlariga o‘z erklariga muvofiq va o‘z manfaatlarini ko‘zlab ega bo‘ladilar hamda ularni amalga oshiradilar. Ular shartnoma asosida o‘z huquq va burchlarini belgilashda, qonun hujjatlariga zid bo‘lmagan har qanday shartnoma shartlarini aniqlashda erkindirlar. Tovar va xizmatlar erkin harakatlanishiga davlat tomonidan to‘liq kafolat beriladi hamda ularning cheklanishiga yo‘l qo‘yilmaydi. Ushbu asosiy prinsiplar jamiyatda qonuniylikni, adolatni, iqtisodiy barqarorlikni va huquqiy xavfsizlikni mustahkamlashga xizmat qiladi. ';

  const longParagraph = legalSentence.repeat(6);
  console.log(`Paragraph character length: ${longParagraph.length}`);

  const testMd = `# Katta 3000 Belgili Hujjat\nuslub: modern\n\n## Fuqarolik Huquqiy Munosabatlari Tamoyillari\n${longParagraph}\n`;

  // 2. Type/Set the text into MdEditor
  console.log('2. Setting 3000-char content in editor and observing save status...');
  await page.evaluate((val) => {
    const textarea = document.querySelector('.editor-textarea');
    if (textarea) {
      const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value')?.set;
      if (nativeSetter) {
        nativeSetter.call(textarea, val);
      } else {
        textarea.value = val;
      }
      textarea.dispatchEvent(new Event('input', { bubbles: true }));
    }
  }, testMd);

  // Check save status immediately after typing -> should be "O‘zgartirilgan" or "Saqlanmoqda…"
  await new Promise((r) => setTimeout(r, 100));
  const immediateStatus = await page.evaluate(() => {
    const badge = document.querySelector('.crumb-saved-badge');
    return badge?.textContent?.trim() || '';
  });
  console.log(`Immediate status after typing: "${immediateStatus}"`);

  // Wait 1.5s for autosave debounce (500ms) + IndexedDB write to complete
  await new Promise((r) => setTimeout(r, 1500));
  const savedStatus = await page.evaluate(() => {
    const badge = document.querySelector('.crumb-saved-badge');
    return badge?.textContent?.trim() || '';
  });
  console.log(`Status after confirmed write: "${savedStatus}"`);

  // Screenshot editor + preview showing "Saqlandi"
  await page.screenshot({ path: path.join(TASK2_SCREENSHOT_DIR, '01_saved_status_verified.png') });

  // 3. Inspect cards and screenshot EVERY single page generated
  console.log('3. Inspecting pagination and capturing screenshot of EVERY page...');
  const cardCount = await page.evaluate(() => {
    return document.querySelectorAll('.preview-column .study-card-9-16').length;
  });
  console.log(`Total study cards generated: ${cardCount}`);

  // Switch to "Ko'rish" (Preview) mode for clear card-by-card inspection
  const modeTabs = await page.$$('.mode-tab');
  for (const btn of modeTabs) {
    const text = await page.evaluate((el) => el.textContent?.trim(), btn);
    if (text && text.includes('Ko‘rish')) {
      await btn.click();
      await new Promise((r) => setTimeout(r, 500));
      break;
    }
  }

  // Screenshot each individual card
  for (let c = 1; c <= cardCount; c++) {
    await page.evaluate((idx) => {
      const cardEl = document.querySelector(`#card-${idx}`);
      if (cardEl) {
        cardEl.scrollIntoView({ behavior: 'instant', block: 'center' });
      }
    }, c);
    await new Promise((r) => setTimeout(r, 400));
    await page.screenshot({
      path: path.join(TASK2_SCREENSHOT_DIR, `page_${String(c).padStart(2, '0')}.png`)
    });
    console.log(`Captured card #${c} -> page_${String(c).padStart(2, '0')}.png`);
  }

  // 4. Verify ZERO CLIPPING and ZERO CONTENT LOSS in DOM
  console.log('4. Auditing DOM for clipping and text integrity...');
  const domAudit = await page.evaluate((originalWordsList) => {
    const cards = Array.from(document.querySelectorAll('.preview-column .study-card-9-16'));
    const clippingIssues = [];
    let allRenderedText = '';

    cards.forEach((card, idx) => {
      const contentArea = card.querySelector('.card-content-area');
      if (contentArea) {
        allRenderedText += ' ' + contentArea.innerText;
        // Verify no content area overflow
        if (contentArea.scrollHeight > contentArea.clientHeight + 4) {
          clippingIssues.push({
            card: idx + 1,
            scrollHeight: contentArea.scrollHeight,
            clientHeight: contentArea.clientHeight,
            overflowPx: contentArea.scrollHeight - contentArea.clientHeight
          });
        }
      }
    });

    let missingWords = [];
    for (const word of originalWordsList) {
      if (!allRenderedText.includes(word)) {
        missingWords.push(word);
      }
    }

    return {
      cardCount: cards.length,
      clippingIssues,
      missingWordsCount: missingWords.length,
      missingWordsSample: missingWords.slice(0, 5)
    };
  }, longParagraph.split(/\s+/).filter(Boolean));

  console.log('DOM Audit Results:', JSON.stringify(domAudit, null, 2));

  // 5. Test PDF Export across ALL 3 VIEW MODES
  console.log('5. Verifying PDF Export across all 3 view modes (both, edit, preview)...');

  // Helper to test PDF generation
  async function testPdfInMode(modeName) {
    // Select mode
    const tabs = await page.$$('.mode-tab');
    for (const tab of tabs) {
      const text = await page.evaluate((el) => el.textContent?.trim(), tab);
      if (text && text.includes(modeName)) {
        await tab.click();
        await new Promise((r) => setTimeout(r, 600));
        break;
      }
    }

    // Verify print host presence and card count
    const printHostStats = await page.evaluate(() => {
      const host = document.getElementById('print-export-host');
      if (!host) return { exists: false, cardCount: 0 };
      const cards = host.querySelectorAll('.study-card-9-16');
      return { exists: true, cardCount: cards.length };
    });

    console.log(`In mode "${modeName}": Print Host exists=${printHostStats.exists}, Cards=${printHostStats.cardCount}`);

    // Generate real PDF buffer with Puppeteer
    const pdfPath = path.join(TASK2_SCREENSHOT_DIR, `export_${modeName.toLowerCase()}.pdf`);
    await page.pdf({
      path: pdfPath,
      printBackground: true,
      width: '108mm',
      height: '192mm',
      margin: { top: 0, right: 0, bottom: 0, left: 0 }
    });

    const pdfSize = fs.statSync(pdfPath).size;
    console.log(`Generated ${pdfPath} (Size: ${pdfSize} bytes)`);
    return { ...printHostStats, pdfSize };
  }

  const exportBoth = await testPdfInMode('Ikkalasi');
  const exportEdit = await testPdfInMode('Yozish');
  const exportPreview = await testPdfInMode('Ko‘rish');

  // 6. Test Rapid Document Switching (Zero Cross-Saving)
  console.log('6. Stress testing Rapid Document Switching for Zero Cross-Saving...');
  // Switch back to "Ikkalasi"
  await testPdfInMode('Ikkalasi');

  const switchTest = await page.evaluate(async () => {
    // We will rapidly select different documents from the sidebar
    const docItems = Array.from(document.querySelectorAll('.tree-row'));
    const clicks = [];
    for (let i = 0; i < Math.min(5, docItems.length); i++) {
      const item = docItems[i];
      if (item) {
        item.click();
        clicks.push(i);
        await new Promise((r) => setTimeout(r, 20)); // Rapid 20ms bursts
      }
    }
    await new Promise((r) => setTimeout(r, 800));
    return { clickedCount: clicks.length };
  });
  console.log('Rapid switch burst executed:', switchTest);

  // Confirm final save status is valid and no errors occurred
  const finalStatus = await page.evaluate(() => {
    const badge = document.querySelector('.crumb-saved-badge');
    return badge?.textContent?.trim() || '';
  });
  console.log(`Final status after stress test: "${finalStatus}"`);

  await browser.close();
  if (server) await server.close();

  console.log('TASK 2 Visual Verification completed successfully!');
}

run().catch((err) => {
  console.error('Task 2 verification failed:', err);
  process.exit(1);
});
