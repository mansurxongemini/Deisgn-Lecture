import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

async function run() {
  const samplePath = path.resolve('src/samples/xalqaro_huquq.md');
  const sampleMd = fs.readFileSync(samplePath, 'utf8');

  const browser = await puppeteer.launch({
    executablePath: '/bin/google-chrome',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  // Open App in A4 mode
  await page.goto('http://localhost:5173?mode=a4', { waitUntil: 'networkidle0' });
  await page.waitForSelector('.editor-textarea', { timeout: 10000 });

  // Put sample into editor
  await page.evaluate((text) => {
    const textarea = document.querySelector('.editor-textarea');
    if (textarea) {
      const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set;
      nativeSetter.call(textarea, text);
      textarea.dispatchEvent(new Event('input', { bubbles: true }));
      textarea.dispatchEvent(new Event('change', { bubbles: true }));
    }
  }, sampleMd);

  // Wait for A4 document to render
  await page.waitForSelector('.a4-document-root', { timeout: 10000 });
  await new Promise((r) => setTimeout(r, 2000));

  fs.mkdirSync('test-results', { recursive: true });
  const pdfPath = path.resolve('test-results/xalqaro_huquq.pdf');

  // Generate real PDF with native print media
  await page.pdf({
    path: pdfPath,
    format: 'A4',
    printBackground: true,
    preferCSSPageSize: true
  });

  console.log('PDF generated at:', pdfPath);

  // Use pdfinfo to get page count
  const pdfInfo = execSync(`pdfinfo "${pdfPath}"`).toString();
  const pagesMatch = pdfInfo.match(/Pages:\s+(\d+)/);
  const pageCount = pagesMatch ? parseInt(pagesMatch[1], 10) : 0;
  console.log('PDF Page count:', pageCount);

  // Use pdftotext to extract text
  const extractedText = execSync(`pdftotext "${pdfPath}" -`).toString();
  console.log('Extracted text length:', extractedText.length);

  // Render pages as images using pdftoppm
  fs.mkdirSync('test-results/pdf-pages', { recursive: true });
  execSync(`pdftoppm -png -r 150 "${pdfPath}" test-results/pdf-pages/page`);
  const imageFiles = fs.readdirSync('test-results/pdf-pages').sort();
  console.log('Rendered page images:', imageFiles);

  await browser.close();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
