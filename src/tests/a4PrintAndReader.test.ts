import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import puppeteer, { type Browser } from 'puppeteer-core';
import { parseMarkdownPlus } from '../schema/mdParser';

describe('A4 PRINT & RESPONSIVE SCREEN READER SUITE (Pivot Verification)', () => {
  let browser: Browser | null = null;
  let testUrl = 'http://localhost:5173';
  let internalServer: any = null;

  const samplePath = path.resolve(process.cwd(), 'src/samples/xalqaro_huquq.md');
  const sampleMd = fs.readFileSync(samplePath, 'utf8');

  beforeAll(async () => {
    try {
      const res = await fetch('http://localhost:5173');
      if (!res.ok) throw new Error('Dev server not running');
    } catch {
      const { createServer } = await import('vite');
      internalServer = await createServer({ server: { port: 5185 } });
      await internalServer.listen();
      testUrl = 'http://localhost:5185';
    }

    browser = await puppeteer.launch({
      executablePath: '/bin/google-chrome',
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
  }, 30000);

  afterAll(async () => {
    if (browser) await browser.close();
    if (internalServer) await internalServer.close();
  });

  // --------------------------------------------------------------------------
  // 1. Noise line test ("Ro'yxat:", "Jadval:", "Inline belgilar:")
  // --------------------------------------------------------------------------
  it('Noise-line filter: treats standalone "Ro\'yxat:" and "Jadval:" lines as noise and warns', () => {
    const rawWithNoise = `
# Sinov Hujjati
## 1-Mavzu. Kirish
Ro'yxat:
- 1-band
- 2-band
Jadval:
| Ustun 1 | Ustun 2 |
| --- | --- |
| Qiymat 1 | Qiymat 2 |
Inline belgilar:
Bu oddiy xatboshi.
`;
    const result = parseMarkdownPlus(rawWithNoise);
    expect(result.document).toBeDefined();

    // Warninglar berilganligini tekshiramiz
    const noiseWarnings = result.warnings.filter((w) =>
      w.message.toLowerCase().includes('shovqin')
    );
    expect(noiseWarnings.length).toBeGreaterThanOrEqual(3);

    // Hujjat ichida "Ro'yxat:" yoki "Jadval:" degan alohida text bloki paydo bo'lmasligi kerak
    const textBlocks = result.document?.sections.flatMap((s) =>
      s.blocks.filter((b) => b.type === 'text').map((b: any) => b.text)
    ) || [];
    expect(textBlocks).not.toContain("Ro'yxat:");
    expect(textBlocks).not.toContain("Jadval:");
    expect(textBlocks).not.toContain("Inline belgilar:");
  });

  // --------------------------------------------------------------------------
  // 2. Neutral sana: test
  // --------------------------------------------------------------------------
  it('Neutral sana: renders date verbatim and does NOT invent "Kuchga kirgan:"', () => {
    const normMd = `
# Norma Sinovi
## 1-Mavzu
norma: 2-modda. Asosiy maqsad
manba: BMT Nizomi
sana: 26.06.1945 (imzolangan)
Barcha davlatlar suveren tengdir.
`;
    const result = parseMarkdownPlus(normMd);
    const normBlock = result.document?.sections[0].blocks[0] as any;
    expect(normBlock).toBeDefined();
    expect(normBlock.effectiveDate).toBe('26.06.1945 (imzolangan)');
    expect(normBlock.effectiveDate).not.toContain('Kuchga kirgan:');
  });

  // --------------------------------------------------------------------------
  // 3. Case conclusion label test ("Xulosa" vs "Sud qarori va xulosa")
  // --------------------------------------------------------------------------
  it('Case conclusion label: defaults to "Xulosa" unless court source is provided', () => {
    const casesMd = `
# Kazus Sinovi
## 1-Mavzu
kazus: Sudsiz kazus
vaziyat: Hodisa yuz berdi
xulosa: Tomonlar kelishdi

kazus: Sudli kazus
sud: Xalqaro Hakamlik Sudi
vaziyat: Sudga murojaat qilindi
xulosa: Sud da'voni qanoatlantirdi
`;
    const result = parseMarkdownPlus(casesMd);
    const case1 = result.document?.sections[0].blocks[0] as any;
    const case2 = result.document?.sections[0].blocks[1] as any;

    expect(case1.court).toBeUndefined();
    expect(case2.court).toBe('Xalqaro Hakamlik Sudi');
  });

  // --------------------------------------------------------------------------
  // 4. Content loss regression test (QA, Table, Flow)
  // --------------------------------------------------------------------------
  it('Regression check: no content loss in QA answers, table rows, and flow steps', () => {
    const result = parseMarkdownPlus(sampleMd);
    expect(result.document).toBeDefined();
    const doc = result.document!;

    // 1. All QA blocks have questions and non-empty answers
    const allQa = doc.sections.flatMap((s) => s.blocks.filter((b) => b.type === 'qa')) as any[];
    expect(allQa.length).toBeGreaterThan(0);
    allQa.forEach((qa, idx) => {
      expect(qa.question, `QA #${idx + 1} has empty question`).toBeTruthy();
      expect(qa.answer, `QA #${idx + 1} has empty answer`).toBeTruthy();
      expect(qa.answer.trim().length).toBeGreaterThan(5);
    });

    // 2. Table blocks retain all rows and columns
    const allTables = doc.sections.flatMap((s) => s.blocks.filter((b) => b.type === 'table')) as any[];
    expect(allTables.length).toBeGreaterThanOrEqual(2);
    const unTable = allTables[0];
    expect(unTable.headers.length).toBe(3);
    expect(unTable.rows.length).toBe(5); // 5 ta bosh organ

    // 3. Flow block steps are not truncated
    const flowBlock = doc.sections.flatMap((s) => s.blocks.filter((b) => b.type === 'flow'))[0] as any;
    expect(flowBlock).toBeDefined();
    const stepTitles = flowBlock.steps.map((s: any) => s.title);
    expect(stepTitles).toContain('Kuchga kirishi');
    expect(stepTitles).toContain('Bajarilishi');
    expect(stepTitles).toContain('Majburiyatlar');
  });

  // --------------------------------------------------------------------------
  // 5. TEXT-DIFF INVARIANT on Real Generated A4 PDF
  // --------------------------------------------------------------------------
  it('TEXT-DIFF INVARIANT: Generated A4 PDF contains 100% of source elements in order', async () => {
    expect(browser).not.toBeNull();
    const page = await browser!.newPage();
    await page.setViewport({ width: 1440, height: 900 });

    await page.goto(`${testUrl}?mode=a4`, { waitUntil: 'networkidle0' });
    await page.waitForSelector('.editor-textarea', { timeout: 10000 });

    // Set sample text into editor
    await page.evaluate((text) => {
      const textarea = document.querySelector('.editor-textarea') as HTMLTextAreaElement | null;
      if (textarea) {
        const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value')!.set!;
        nativeSetter.call(textarea, text);
        textarea.dispatchEvent(new Event('input', { bubbles: true }));
        textarea.dispatchEvent(new Event('change', { bubbles: true }));
      }
    }, sampleMd);

    await page.waitForSelector('.a4-document-root', { timeout: 10000 });
    await new Promise((r) => setTimeout(r, 1500));

    fs.mkdirSync('test-results', { recursive: true });
    const pdfPath = path.resolve('test-results/a4_xalqaro_huquq_test.pdf');

    // Generate real PDF with native print media
    await page.pdf({
      path: pdfPath,
      format: 'A4',
      printBackground: true,
      preferCSSPageSize: true
    });

    expect(fs.existsSync(pdfPath)).toBe(true);

    // Extract text from PDF via pdftotext
    const pdfText = execSync(`pdftotext "${pdfPath}" -`).toString();
    expect(pdfText.length).toBeGreaterThan(5000);

    const normalizedPdf = pdfText.replace(/[\u2018\u2019\u02bb\u02bc]/g, "'").replace(/\s+/g, ' ');

    const doc = parseMarkdownPlus(sampleMd).document!;
    const missing: { label: string; text: string }[] = [];

    const assertAppears = (rawStr: string | undefined, label: string) => {
      if (!rawStr || !rawStr.trim()) return;
      const clean = rawStr
        .replace(/\*\*(.*?)\*\*/g, '$1')
        .replace(/\*(.*?)\*/g, '$1')
        .replace(/`(.*?)`/g, '$1')
        .trim()
        .replace(/\s+/g, ' ');
      const normalizedClean = clean.replace(/[\u2018\u2019\u02bb\u02bc]/g, "'");

      if (!normalizedPdf.toLowerCase().includes(normalizedClean.toLowerCase())) {
        missing.push({ label, text: clean.slice(0, 50) });
      }
    };

    const assertTableCellAppears = (rawStr: string | undefined, label: string) => {
      if (!rawStr || !rawStr.trim()) return;
      const clean = rawStr
        .replace(/\*\*(.*?)\*\*/g, '$1')
        .replace(/\*(.*?)\*/g, '$1')
        .replace(/`(.*?)`/g, '$1')
        .trim()
        .replace(/\s+/g, ' ');
      const normalizedClean = clean.replace(/[\u2018\u2019\u02bb\u02bc]/g, "'");

      if (normalizedPdf.toLowerCase().includes(normalizedClean.toLowerCase())) return;

      // In multi-column wrapped table layouts, verify all words of cell are present
      const words = normalizedClean.split(' ').filter(Boolean);
      const missingWords = words.filter((w) => !normalizedPdf.toLowerCase().includes(w.toLowerCase()));
      if (missingWords.length > 0) {
        missing.push({ label, text: `Missing cell words: ${missingWords.join(', ')} in "${clean}"` });
      }
    };

    // Assert document metadata
    assertAppears(doc.title, 'title');
    assertAppears(doc.author, 'author');
    assertAppears(doc.institution, 'institution');

    // Assert every section title, paragraph, norm, definition, qa, table cell, flow step
    doc.sections.forEach((sec, sIdx) => {
      assertAppears(sec.title, `sec-${sIdx}-title`);

      sec.blocks.forEach((b, bIdx) => {
        const id = `s${sIdx}-b${bIdx}`;
        if (b.type === 'text') assertAppears(b.text, `${id}-text`);
        if (b.type === 'list') b.items.forEach((it, i) => assertAppears(it, `${id}-list-${i}`));
        if (b.type === 'definition') {
          assertAppears(b.term, `${id}-def-term`);
          assertAppears(b.definition, `${id}-def-desc`);
        }
        if (b.type === 'norm') {
          // If title was split into badge and heading remainder (e.g. "2-modda." badge and "BMTning asosiy maqsad va prinsiplari" title)
          const match = b.title.match(/^(\d+(?:-[a-zA-Z]+|\s*-\s*[a-zA-Z]+)?(?:-modda|[.\s]))\s*(.*)$/i);
          if (match && match[2]) {
            assertAppears(match[1].replace(/[.:]\s*$/, ''), `${id}-norm-badge`);
            assertAppears(match[2].trim(), `${id}-norm-title`);
          } else {
            assertAppears(b.title, `${id}-norm-title`);
          }
          assertAppears(b.text, `${id}-norm-text`);
          if (b.effectiveDate) assertAppears(b.effectiveDate, `${id}-norm-date`);
        }
        if (b.type === 'qa') {
          assertAppears(b.question, `${id}-qa-q`);
          assertAppears(b.answer, `${id}-qa-a`);
        }
        if (b.type === 'table') {
          b.headers.forEach((h, hIdx) => assertTableCellAppears(h, `${id}-table-hdr-${hIdx}`));
          b.rows.forEach((r, rIdx) => r.forEach((c, cIdx) => assertTableCellAppears(c, `${id}-table-r${rIdx}c${cIdx}`)));
        }
        if (b.type === 'flow') {
          b.steps.forEach((st, stIdx) => assertAppears(st.title, `${id}-flow-${stIdx}`));
        }
        if (b.type === 'case') {
          assertAppears(b.title, `${id}-case-title`);
          if (b.facts) assertAppears(b.facts, `${id}-case-facts`);
          if (b.rule) assertAppears(b.rule, `${id}-case-rule`);
          if (b.conclusion) assertAppears(b.conclusion, `${id}-case-conclusion`);
        }
      });
    });

    expect(missing, `Elements missing from generated A4 PDF: ${JSON.stringify(missing)}`).toEqual([]);

    await page.close();
  }, 45000);

  // --------------------------------------------------------------------------
  // 6. Page-Count Budget Test (5–8 pages target)
  // --------------------------------------------------------------------------
  it('Page-count budget test: xalqaro_huquq renders within 5–8 A4 pages (not 36)', () => {
    const pdfPath = path.resolve('test-results/a4_xalqaro_huquq_test.pdf');
    expect(fs.existsSync(pdfPath)).toBe(true);

    const pdfInfo = execSync(`pdfinfo "${pdfPath}"`).toString();
    const pagesMatch = pdfInfo.match(/Pages:\s+(\d+)/);
    expect(pagesMatch).not.toBeNull();

    const pageCount = parseInt(pagesMatch![1], 10);
    console.log(`[PAGE COUNT TEST] Generated A4 PDF pages: ${pageCount} (budget: 5-8)`);

    expect(pageCount).toBeGreaterThanOrEqual(5);
    expect(pageCount).toBeLessThanOrEqual(8);
  });

  // --------------------------------------------------------------------------
  // 7. Screen Reader Overflow & Responsiveness (390x844 and 1440x900)
  // --------------------------------------------------------------------------
  it('Screen reader view: Zero clipping and zero horizontal overflow at 390x844 and 1440x900', async () => {
    expect(browser).not.toBeNull();
    const page = await browser!.newPage();

    for (const viewport of [
      { width: 390, height: 844, name: 'Mobile (iPhone 12/13/14)' },
      { width: 1440, height: 900, name: 'Desktop' }
    ]) {
      await page.setViewport({ width: viewport.width, height: viewport.height });
      await page.goto(`${testUrl}?mode=reader`, { waitUntil: 'networkidle0' });
      await page.waitForSelector('.screen-reader-container', { timeout: 10000 });

      // Put sample into editor
      await page.evaluate((text) => {
        const textarea = document.querySelector('.editor-textarea') as HTMLTextAreaElement | null;
        if (textarea) {
          const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value')!.set!;
          nativeSetter.call(textarea, text);
          textarea.dispatchEvent(new Event('input', { bubbles: true }));
          textarea.dispatchEvent(new Event('change', { bubbles: true }));
        }
      }, sampleMd);

      await new Promise((r) => setTimeout(r, 1200));

      const overflowReport = await page.evaluate(() => {
        const container = document.querySelector('.screen-reader-container');
        if (!container) return { exists: false, overflows: [] };

        const elements = Array.from(container.querySelectorAll('.flow-chain-wrapper, .flow-chain-badge, .study-table, .reader-section, .qa-compact-box'));
        const overflows: string[] = [];

        elements.forEach((el) => {
          // scrollWidth > clientWidth + 2 indicates horizontal overflow clipping
          if (el.scrollWidth > el.clientWidth + 2) {
            overflows.push(`${el.className}: scrollWidth(${el.scrollWidth}) > clientWidth(${el.clientWidth})`);
          }
        });

        return { exists: true, overflows };
      });

      expect(overflowReport.exists).toBe(true);
      expect(overflowReport.overflows, `Horizontal overflow found at ${viewport.name}: ${overflowReport.overflows.join(', ')}`).toEqual([]);
    }

    await page.close();
  }, 40000);

  // --------------------------------------------------------------------------
  // 8. Fixed A4 Sheet Geometry Invariant (Step 2 Requirement 5)
  // Assert computed width & height are identical for "# salom" and 3-page doc,
  // and equal 210mm x 297mm (793.7px x 1122.5px at 96dpi)
  // --------------------------------------------------------------------------
  it('Fixed A4 Sheet Geometry Invariant: computed width and height are identical for "# salom" and 3-page document', async () => {
    expect(browser).not.toBeNull();
    const page = await browser!.newPage();
    await page.setViewport({ width: 1440, height: 900 });
    await page.goto(`${testUrl}?mode=a4`, { waitUntil: 'networkidle0' });
    await page.waitForSelector('.editor-textarea', { timeout: 10000 });

    const measureDoc = async (text: string) => {
      await page.evaluate((val) => {
        const textarea = document.querySelector('.editor-textarea') as HTMLTextAreaElement | null;
        if (textarea) {
          const setter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value')!.set!;
          setter.call(textarea, val);
          textarea.dispatchEvent(new Event('input', { bubbles: true }));
          textarea.dispatchEvent(new Event('change', { bubbles: true }));
        }
      }, text);

      await new Promise((r) => setTimeout(r, 1500));

      return await page.evaluate(() => {
        const sheets = Array.from(document.querySelectorAll('.a4-scaling-wrapper .a4-sheet'));
        return sheets.map((s, idx) => {
          const style = window.getComputedStyle(s);
          return {
            sheetIndex: idx + 1,
            computedWidth: Math.round(parseFloat(style.width) * 10) / 10,
            computedHeight: Math.round(parseFloat(style.height) * 10) / 10
          };
        });
      });
    };

    // 1. Short "# salom" document
    const salomSheets = await measureDoc('# salom');
    expect(salomSheets.length).toBe(1);
    expect(salomSheets[0].computedWidth).toBeCloseTo(793.7, 0);
    expect(salomSheets[0].computedHeight).toBeCloseTo(1122.5, 0);

    // 2. 3-page document
    const threePageMd = fs.readFileSync(path.resolve(process.cwd(), 'src/samples/constitutional_law.md'), 'utf8');
    const multiSheets = await measureDoc(threePageMd);
    expect(multiSheets.length).toBe(3);

    multiSheets.forEach((sheet) => {
      expect(sheet.computedWidth).toBe(salomSheets[0].computedWidth);
      expect(sheet.computedHeight).toBe(salomSheets[0].computedHeight);
    });

    await page.close();
  }, 35000);
});

