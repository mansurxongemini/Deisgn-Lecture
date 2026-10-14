import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

async function run() {
  const samplePath = path.resolve('src/samples/xalqaro_huquq.md');
  const sampleMd = fs.readFileSync(samplePath, 'utf8');

  const browser = await puppeteer.launch({
    executablePath: '/bin/google-chrome',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const artifactDir = '/home/mansurxon/.gemini/antigravity-ide/brain/0c928012-c20e-4f4f-bd89-80e4dcffdca7';
  fs.mkdirSync(artifactDir, { recursive: true });

  // 1. Mobile 390x844
  {
    const page = await browser.newPage();
    await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });
    await page.goto('http://localhost:5173?mode=reader', { waitUntil: 'networkidle0' });
    await page.waitForSelector('.screen-reader-container', { timeout: 10000 });

    // Switch to edit tab so textarea is rendered on mobile
    await page.evaluate(() => {
      const tabs = Array.from(document.querySelectorAll('.mode-tab'));
      const editTab = tabs.find((t) => t.textContent && t.textContent.includes('Yozish'));
      if (editTab) editTab.click();
    });

    await page.waitForSelector('.editor-textarea', { timeout: 5000 });

    await page.evaluate((text) => {
      const textarea = document.querySelector('.editor-textarea');
      if (textarea) {
        const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set;
        nativeSetter.call(textarea, text);
        textarea.dispatchEvent(new Event('input', { bubbles: true }));
        textarea.dispatchEvent(new Event('change', { bubbles: true }));
      }
    }, sampleMd);

    // Switch back to preview tab
    await page.evaluate(() => {
      const tabs = Array.from(document.querySelectorAll('.mode-tab'));
      const previewTab = tabs.find((t) => t.textContent && (t.textContent.includes('Ko‘rish') || t.textContent.includes("Ko'rish")));
      if (previewTab) previewTab.click();
    });

    await page.waitForSelector('.screen-reader-container', { timeout: 5000 });
    await new Promise((r) => setTimeout(r, 1500));

    const mobilePath = path.join(artifactDir, 'screen_reader_mobile_390x844.png');
    await page.screenshot({ path: mobilePath, fullPage: false });
    console.log('Mobile screenshot saved:', mobilePath);
    await page.close();
  }

  // 2. Desktop 1440x900
  {
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });
    await page.goto('http://localhost:5173?mode=reader', { waitUntil: 'networkidle0' });
    await page.waitForSelector('.screen-reader-container', { timeout: 10000 });

    await page.evaluate((text) => {
      const textarea = document.querySelector('.editor-textarea');
      if (textarea) {
        const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set;
        nativeSetter.call(textarea, text);
        textarea.dispatchEvent(new Event('input', { bubbles: true }));
        textarea.dispatchEvent(new Event('change', { bubbles: true }));
      }
    }, sampleMd);

    await new Promise((r) => setTimeout(r, 1500));

    const desktopPath = path.join(artifactDir, 'screen_reader_desktop_1440x900.png');
    await page.screenshot({ path: desktopPath, fullPage: false });
    console.log('Desktop screenshot saved:', desktopPath);
    await page.close();
  }

  // 3. Copy A4 PDF pages into artifact directory
  const pdfPagesDir = path.resolve('test-results/pdf-pages');
  if (fs.existsSync(pdfPagesDir)) {
    const files = fs.readdirSync(pdfPagesDir).filter((f) => f.endsWith('.png'));
    for (const f of files) {
      const src = path.join(pdfPagesDir, f);
      const dest = path.join(artifactDir, `a4_xalqaro_huquq_${f}`);
      fs.copyFileSync(src, dest);
      console.log(`Copied ${f} to artifact: a4_xalqaro_huquq_${f}`);
    }
  }

  await browser.close();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
