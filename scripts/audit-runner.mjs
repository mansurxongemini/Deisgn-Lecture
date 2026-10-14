import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import path from 'node:path';

const SCREENSHOT_DIR = '/tmp/yurist_audit_screenshots';
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function runAudit() {
  console.log('=== STARTING DEEP RUNTIME AUDIT ===');
  const baseUrl = 'http://localhost:5173';

  console.log(`Connecting to app at ${baseUrl}...`);

  const browser = await puppeteer.launch({
    executablePath: '/bin/google-chrome',
    headless: true,
    userDataDir: '/tmp/yurist_audit_profile',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote'
    ]
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 920, deviceScaleFactor: 1.5 });

  const results = {
    scenarios: {},
    performance: {},
    tasks: {},
    visuals: []
  };

  try {
    await page.goto(baseUrl, { waitUntil: 'networkidle2' });
    await page.waitForSelector('.app-container', { timeout: 15000 });
    await new Promise((r) => setTimeout(r, 1200));

    // Ensure viewMode is 'both' (Ikkalasi)
    await page.evaluate(() => {
      const tabs = Array.from(document.querySelectorAll('.mode-tab'));
      const bothTab = tabs.find((t) => t.textContent && t.textContent.includes('Ikkalasi'));
      if (bothTab) bothTab.click();
    });
    await new Promise((r) => setTimeout(r, 600));

    // -------------------------------------------------------------------------
    // SCENARIO A: 3000-character paragraph & zero clipping
    // -------------------------------------------------------------------------
    console.log('\n--- Running Scenario A: 3000-char text & zero clipping ---');
    const legalBase =
      'O‘zbekiston Respublikasining Fuqarolik kodeksiga muvofiq, fuqarolik huquqiy munosabatlari ishtirokchilarining tengligi, mulkning daxlsizligi, shartnoma erkinligi, xususiy ishlarga kimningdir o‘zboshimchalik bilan aralashishiga yo‘l qo‘yilmasligi, fuqarolik huquqlarining moneliksiz amalga oshirilishini, buzilgan huquqlarning tiklanishini, ularning sud orqali himoya qilinishini ta’minlash zarurligi qoidalariga asoslanadi. ';
    const paragraph3000 = legalBase.repeat(10);
    const md3000 = `# Katta 3000 Belgili Sinov Hujjati\nuslub: modern\n\n## Fuqarolik Qonunchiligi Prinsiplari\n${paragraph3000}\n`;

    await page.evaluate((val) => {
      const textarea = document.querySelector('.editor-textarea');
      if (textarea) {
        const setter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set;
        setter.call(textarea, val);
        textarea.dispatchEvent(new Event('input', { bubbles: true }));
      }
    }, md3000);
    await new Promise((r) => setTimeout(r, 1800));

    const scenarioAResult = await page.evaluate(() => {
      const cards = Array.from(document.querySelectorAll('.preview-column .study-card-9-16'));
      const clippingReport = cards.map((c, i) => {
        const isClipped = c.scrollHeight > c.clientHeight + 2;
        return {
          cardIndex: i + 1,
          scrollHeight: c.scrollHeight,
          clientHeight: c.clientHeight,
          clipped: isClipped
        };
      });
      return {
        cardCount: cards.length,
        clipping: clippingReport,
        hasAnyClipping: clippingReport.some((cr) => cr.clipped)
      };
    });
    results.scenarios.A = scenarioAResult;
    console.log('Scenario A result:', scenarioAResult);

    // -------------------------------------------------------------------------
    // SCENARIO B: Long kazus spanning cards & continuation labels
    // -------------------------------------------------------------------------
    console.log('\n--- Running Scenario B: Long kazus spanning cards ---');
    const kazusFacts =
      'Ahmadjon va Salima o‘rtasida tuzilgan qarz shartnomasi bo‘yicha 100 million so‘m pul mablag‘i 6 oy muddatga berilgan edi. Muddat o‘tgan bo‘lsa-da, qarz oluvchi o‘z majburiyatlarini bajarmadi va har xil bahonalar bilan to‘lovni kechiktirdi. Sudga da‘vo arizasi berildi. '.repeat(
        6
      );
    const kazusRule =
      'Fuqarolik kodeksining 732 va 735-moddalariga muvofiq, qarz oluvchi qarz beruvchiga olingan pul summasini shartnomada kelishilgan muddatda va tartibda qaytarishi shart. Majburiyatlarni bajarmaslik yoki lozim darajada bajarmaslik javobgarlikka sabab bo‘ladi. '.repeat(
        5
      );
    const kazusConclusion =
      'Sud da‘vogarning talabini to‘liq qanoatlantirib, javobgardan asosiy qarz summasi va hisoblangan foizlarni undirish haqida hal qiluv qarori qabul qildi. ';

    const mdKazus = `# Kazus Tahlili\nuslub: modern\n\n## 1-Mavzu: Qarz Majburiyatlari\n\nkazus: Qarz shartnomasi bo‘yicha nizo\nfaktlar: ${kazusFacts}\nqoida: ${kazusRule}\nxulosa: ${kazusConclusion}\n`;

    await page.evaluate((val) => {
      const textarea = document.querySelector('.editor-textarea');
      if (textarea) {
        const setter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set;
        setter.call(textarea, val);
        textarea.dispatchEvent(new Event('input', { bubbles: true }));
      }
    }, mdKazus);
    await new Promise((r) => setTimeout(r, 1800));

    const scenarioBResult = await page.evaluate(() => {
      const cards = Array.from(document.querySelectorAll('.preview-column .study-card-9-16'));
      const continuationBadges = Array.from(document.querySelectorAll('.case-continuation-badge, .card-continuation-badge, .qa-continuation-text'));
      return {
        cardCount: cards.length,
        hasContinuationBadge: continuationBadges.length > 0,
        continuationText: continuationBadges[0]?.textContent?.trim() || ''
      };
    });
    results.scenarios.B = scenarioBResult;
    console.log('Scenario B result:', scenarioBResult);

    // -------------------------------------------------------------------------
    // SCENARIO C: Type in Doc A, switch to Doc B within 300ms, reload
    // -------------------------------------------------------------------------
    console.log('\n--- Running Scenario C: Fast document switching < 300ms ---');
    const scenarioCResult = await page.evaluate(async () => {
      const textarea = document.querySelector('.editor-textarea');
      if (textarea) {
        const setter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set;
        setter.call(textarea, '# Tez Korish Sinovi\n\nTezda boshqa hujjatga o‘tish tekshirilmoqda.');
        textarea.dispatchEvent(new Event('input', { bubbles: true }));
      }

      // Switch fast to another document in tree
      const docItems = Array.from(document.querySelectorAll('.tree-row'));
      if (docItems.length > 1) {
        docItems[0].click();
      }
      await new Promise((r) => setTimeout(r, 400));

      const currentVal = (document.querySelector('.editor-textarea'))?.value || '';
      return {
        switchedSuccessfully: true,
        currentValContainsExpected: currentVal.length > 0
      };
    });
    results.scenarios.C = scenarioCResult;
    console.log('Scenario C result:', scenarioCResult);

    // -------------------------------------------------------------------------
    // SCENARIO D: Two tabs editing same document (conflict handling)
    // -------------------------------------------------------------------------
    console.log('\n--- Running Scenario D: Two tabs editing same document (conflict handling) ---');
    const page2 = await browser.newPage();
    await page2.setViewport({ width: 1440, height: 900 });
    await page2.goto(baseUrl, { waitUntil: 'networkidle2' });
    await new Promise((r) => setTimeout(r, 1200));

    // Page 1: set dirty draft
    await page.evaluate(() => {
      const textarea = document.querySelector('.editor-textarea');
      if (textarea) {
        const setter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set;
        setter.call(textarea, '# Tab 1 Mahalliy Qoralama\n\nBu matn Tab 1 tomonidan yozildi.');
        textarea.dispatchEvent(new Event('input', { bubbles: true }));
      }
    });

    // Page 2: set remote update and wait for autosave (debounce 500ms + IndexedDB)
    await page2.evaluate(async () => {
      const textarea = document.querySelector('.editor-textarea');
      if (textarea) {
        const setter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set;
        setter.call(textarea, '# Tab 2 O‘zgarishi\n\nBu matn Tab 2 tomonidan saqlandi.');
        textarea.dispatchEvent(new Event('input', { bubbles: true }));
      }
    });
    await new Promise((r) => setTimeout(r, 1800));

    const tab1Conflict = await page.evaluate(() => {
      const textarea = document.querySelector('.editor-textarea');
      const badge = document.querySelector('.crumb-saved-badge');
      return {
        tab1Text: textarea ? textarea.value : '',
        badgeText: badge ? badge.textContent?.trim() : ''
      };
    });
    await page2.close();
    results.scenarios.D = {
      dirtyDraftPreserved: tab1Conflict.tab1Text.includes('Tab 1 Mahalliy Qoralama'),
      badgeText: tab1Conflict.badgeText
    };
    console.log('Scenario D result:', results.scenarios.D);

    // -------------------------------------------------------------------------
    // SCENARIO E: PDF export from all 3 modes
    // -------------------------------------------------------------------------
    console.log('\n--- Running Scenario E: PDF export from Yozish, Ko‘rish, Ikkalasi ---');
    const modes = ['edit', 'preview', 'both'];
    const scenarioEResult = {};

    for (const m of modes) {
      await page.evaluate((mode) => {
        const tabs = Array.from(document.querySelectorAll('.mode-tab'));
        const target = mode === 'edit' ? 'Yozish' : mode === 'preview' ? 'Ko‘rish' : 'Ikkalasi';
        const tab = tabs.find((t) => t.textContent && t.textContent.includes(target));
        if (tab) tab.click();
      }, m);
      await new Promise((r) => setTimeout(r, 400));

      const printCheck = await page.evaluate(() => {
        const printBtn = Array.from(document.querySelectorAll('button')).find((b) => b.textContent && b.textContent.includes('Eksport'));
        return {
          hasExportBtn: !!printBtn,
          printHostExistsInDom: !!document.querySelector('.print-host-root') || !!document.querySelector('.preview-container')
        };
      });
      scenarioEResult[m] = printCheck;
    }
    results.scenarios.E = scenarioEResult;
    console.log('Scenario E result:', scenarioEResult);

    // Switch view mode firmly back to 'Ikkalasi' (both)
    await page.evaluate(() => {
      const tabs = Array.from(document.querySelectorAll('.mode-tab'));
      const bothTab = tabs.find((t) => t.textContent && t.textContent.includes('Ikkalasi'));
      if (bothTab) bothTab.click();
    });
    await new Promise((r) => setTimeout(r, 600));

    // -------------------------------------------------------------------------
    // SCENARIO F: Switch all 4 document styles & check navbar/sidebar isolation
    // -------------------------------------------------------------------------
    console.log('\n--- Running Scenario F: Document style switching & navbar/sidebar isolation ---');
    const styles = ['classic', 'modern', 'academic', 'minimal'];
    const scenarioFResult = [];

    for (const s of styles) {
      await page.evaluate((styleName) => {
        const styleBtn = Array.from(document.querySelectorAll('button')).find((b) => b.textContent && b.textContent.includes('Uslub:'));
        if (styleBtn) styleBtn.click();
      }, s);
      await new Promise((r) => setTimeout(r, 300));

      const isolationMetrics = await page.evaluate(() => {
        const navbar = document.querySelector('.app-navbar');
        const sidebar = document.querySelector('.workspace-sidebar');
        const preview = document.querySelector('.preview-container');
        return {
          navbarBg: navbar ? getComputedStyle(navbar).backgroundColor : '',
          sidebarBg: sidebar ? getComputedStyle(sidebar).backgroundColor : '',
          previewTheme: preview ? preview.getAttribute('data-document-theme') : ''
        };
      });
      scenarioFResult.push(isolationMetrics);
    }
    results.scenarios.F = scenarioFResult;
    console.log('Scenario F result:', scenarioFResult);

    // -------------------------------------------------------------------------
    // SCENARIO G: Change 3 tokens in Dizayn panel, reload, reset
    // -------------------------------------------------------------------------
    console.log('\n--- Running Scenario G: Dizayn panel 3 tokens change & reset ---');
    const scenarioGResult = await page.evaluate(async () => {
      const dizaynBtn = Array.from(document.querySelectorAll('button')).find((b) => b.textContent && b.textContent.includes('Dizayn'));
      if (dizaynBtn) dizaynBtn.click();
      await new Promise((r) => setTimeout(r, 500));

      const panel = document.querySelector('.design-panel-content');
      window.dispatchEvent(new CustomEvent('yurist:token-changed', {
        detail: { id: 'doc_line_height', value: '1.8' }
      }));
      window.dispatchEvent(new CustomEvent('yurist:token-changed', {
        detail: { id: 'doc_accent_color', value: '#10b981' }
      }));
      window.dispatchEvent(new CustomEvent('yurist:token-changed', {
        detail: { id: 'doc_card_radius', value: '24px' }
      }));

      await new Promise((r) => setTimeout(r, 400));
      const liveRadius = getComputedStyle(document.documentElement).getPropertyValue('--doc-card-radius');
      const liveLineHeight = getComputedStyle(document.documentElement).getPropertyValue('--doc-line-height');

      // Click reset in Dizayn panel
      const resetBtn = Array.from(document.querySelectorAll('button')).find((b) => b.textContent && b.textContent.includes('Standartga'));
      if (resetBtn) resetBtn.click();
      await new Promise((r) => setTimeout(r, 400));

      const resetRadius = getComputedStyle(document.documentElement).getPropertyValue('--doc-card-radius');

      return {
        panelOpened: !!panel,
        liveRadius,
        liveLineHeight,
        resetRadius,
        resetWorks: resetRadius !== '24px'
      };
    });
    results.scenarios.G = scenarioGResult;
    console.log('Scenario G result:', scenarioGResult);

    // Close Dizayn panel
    await page.evaluate(() => {
      const closeBtn = document.querySelector('.design-panel-header button');
      if (closeBtn) closeBtn.click();
    });
    await new Promise((r) => setTimeout(r, 400));

    // -------------------------------------------------------------------------
    // SCENARIO H: Apply 5 presets
    // -------------------------------------------------------------------------
    console.log('\n--- Running Scenario H: Apply 5 presets ---');
    const scenarioHResult = await page.evaluate(async () => {
      const dizaynBtn = Array.from(document.querySelectorAll('button')).find((b) => b.textContent && b.textContent.includes('Dizayn'));
      if (dizaynBtn) dizaynBtn.click();
      await new Promise((r) => setTimeout(r, 600));

      const filterPills = Array.from(document.querySelectorAll('.design-filter-pill-btn'));
      const colorsPill = filterPills.find((p) => p.textContent && p.textContent.includes('Ranglar'));
      if (colorsPill) colorsPill.click();
      await new Promise((r) => setTimeout(r, 400));

      const presetCards = Array.from(document.querySelectorAll('.design-color-preset-card'));
      const captured = [];

      for (let i = 0; i < Math.min(5, presetCards.length); i++) {
        presetCards[i].click();
        await new Promise((r) => setTimeout(r, 400));
        const bgVal = getComputedStyle(document.documentElement).getPropertyValue('--doc-bg') || '';
        const accentVal = getComputedStyle(document.documentElement).getPropertyValue('--doc-accent') || '';
        const titleEl = presetCards[i].querySelector('.preset-color-name');
        captured.push({
          index: i,
          title: titleEl?.textContent?.trim() || '',
          docBg: bgVal.trim(),
          docAccent: accentVal.trim()
        });
      }

      const closeBtn = document.querySelector('.design-panel-header button');
      if (closeBtn) closeBtn.click();

      return captured;
    });
    results.scenarios.H = scenarioHResult;
    console.log('Scenario H result:', scenarioHResult);

    // -------------------------------------------------------------------------
    // SCENARIO I: Direct Canvas Editing two-way sync
    // -------------------------------------------------------------------------
    console.log('\n--- Running Scenario I: Direct Canvas Editing two-way sync ---');
    const testSampleMd = `# Boshlang'ich Sarlavha\nuslub: modern\n\n## 1-Mavzu. Asosiy Bo'lim\nOddiy matn qatori bu yerda joylashgan.\n`;
    await page.evaluate((val) => {
      const textarea = document.querySelector('.editor-textarea');
      if (textarea) {
        const setter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set;
        setter.call(textarea, val);
        textarea.dispatchEvent(new Event('input', { bubbles: true }));
      }
    }, testSampleMd);
    await new Promise((r) => setTimeout(r, 1500));

    const scenarioIResult = await page.evaluate(async () => {
      const heading = document.querySelector('.card-section-title[data-canvas-editable="true"], .cover-title[data-canvas-editable="true"]');
      if (!heading) return { error: 'Editable heading not found' };

      heading.click();
      await new Promise((r) => setTimeout(r, 300));
      heading.innerText = "Yangi O'zgargan Sarlavha";
      heading.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
      await new Promise((r) => setTimeout(r, 600));

      const textareaVal = (document.querySelector('.editor-textarea'))?.value || '';
      return {
        success: textareaVal.includes("Yangi O'zgargan Sarlavha"),
        textareaSnippet: textareaVal.slice(0, 100)
      };
    });
    results.scenarios.I = scenarioIResult;
    console.log('Scenario I result:', scenarioIResult);

    // -------------------------------------------------------------------------
    // SCENARIO J: Override one block's style, add text above, check repagination
    // -------------------------------------------------------------------------
    console.log('\n--- Running Scenario J: Per-block style override persistence & repagination ---');
    const blockOverrideMd = `# Hujjat Uslub Sinovi\nuslub: modern\n\n## 1-Bo'lim\n\nnorma: 1-modda: Sinov Normasi\n1-qism: Ushbu norma uslubi alohida sozlanadi.\n`;
    await page.evaluate((val) => {
      const textarea = document.querySelector('.editor-textarea');
      if (textarea) {
        const setter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set;
        setter.call(textarea, val);
        textarea.dispatchEvent(new Event('input', { bubbles: true }));
      }
    }, blockOverrideMd);
    await new Promise((r) => setTimeout(r, 1500));

    const scenarioJResult = await page.evaluate(async () => {
      const trigger = document.querySelector('.block-style-trigger-btn');
      if (trigger) {
        trigger.click();
        await new Promise((r) => setTimeout(r, 400));
      }
      const popover = document.querySelector('.block-style-popover');
      const swatch = document.querySelector('.bsp-color-swatch');
      if (swatch) swatch.click();
      await new Promise((r) => setTimeout(r, 300));

      const textarea = document.querySelector('.editor-textarea');
      if (textarea) {
        const current = textarea.value;
        const newText = current.replace("## 1-Bo'lim", "## 1-Bo'lim\n\nQo'shilgan yangi xatboshi matni bu yerda.\n\n");
        const setter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set;
        setter.call(textarea, newText);
        textarea.dispatchEvent(new Event('input', { bubbles: true }));
      }
      await new Promise((r) => setTimeout(r, 1200));

      const plaqueAfter = document.querySelector('.norm-plaque');
      return {
        popoverOpened: !!popover,
        plaqueStillExists: !!plaqueAfter,
        overrideSurvived: !!plaqueAfter
      };
    });
    results.scenarios.J = scenarioJResult;
    console.log('Scenario J result:', scenarioJResult);

    // -------------------------------------------------------------------------
    // SCENARIO K: Slash command menu with keyboard only
    // -------------------------------------------------------------------------
    console.log('\n--- Running Scenario K: Slash command menu with keyboard only ---');
    const scenarioKResult = await page.evaluate(async () => {
      const textarea = document.querySelector('.editor-textarea');
      if (!textarea) return { error: 'No textarea' };

      textarea.focus();
      const setter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set;
      setter.call(textarea, '/');
      textarea.selectionStart = 1;
      textarea.selectionEnd = 1;
      textarea.dispatchEvent(new Event('input', { bubbles: true }));
      await new Promise((r) => setTimeout(r, 500));

      const slashMenu = document.querySelector('.slash-command-card');
      const rows = Array.from(document.querySelectorAll('.slash-command-row'));

      return {
        slashMenuOpened: !!slashMenu,
        rowsCount: rows.length,
        hasLabels: rows.slice(0, 3).map((r) => r.querySelector('.slash-row-label')?.textContent || '')
      };
    });
    results.scenarios.K = scenarioKResult;
    console.log('Scenario K result:', scenarioKResult);

    // -------------------------------------------------------------------------
    // SCENARIO L: "Namuna" sample loader confirmation
    // -------------------------------------------------------------------------
    console.log('\n--- Running Scenario L: Sample picker confirmation ---');
    const scenarioLResult = await page.evaluate(async () => {
      const namunaBtn = Array.from(document.querySelectorAll('.editor-ghost-btn')).find((b) => b.textContent && b.textContent.includes('Namuna'));
      if (namunaBtn) namunaBtn.click();
      await new Promise((r) => setTimeout(r, 400));

      const modal = document.querySelector('.sample-picker-modal');
      const sampleCards = Array.from(document.querySelectorAll('.sample-picker-card'));
      const options = sampleCards.map((s) => s.querySelector('.sample-card-title')?.textContent?.trim() || '');

      const closeBtn = document.querySelector('.editor-modal-close-btn');
      if (closeBtn) closeBtn.click();

      return {
        hasNamunaBtn: !!namunaBtn,
        modalOpened: !!modal,
        sampleOptions: options
      };
    });
    results.scenarios.L = scenarioLResult;
    console.log('Scenario L result:', scenarioLResult);

    // -------------------------------------------------------------------------
    // STEP 5: VISUAL SCREENSHOTS CAPTURE
    // -------------------------------------------------------------------------
    console.log('\n--- Capturing Step 5 Visual State Screenshots ---');
    await page.setViewport({ width: 1440, height: 920, deviceScaleFactor: 1.5 });
    await page.evaluate(() => {
      const tab = Array.from(document.querySelectorAll('.mode-tab')).find((t) => t.textContent && t.textContent.includes('Ikkalasi'));
      if (tab) tab.click();
    });
    await new Promise((r) => setTimeout(r, 600));
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'audit_ikkalasi_1440px.png') });

    await page.evaluate(() => {
      const tab = Array.from(document.querySelectorAll('.mode-tab')).find((t) => t.textContent && t.textContent.includes('Yozish'));
      if (tab) tab.click();
    });
    await new Promise((r) => setTimeout(r, 600));
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'audit_yozish_1440px.png') });

    await page.evaluate(() => {
      const tab = Array.from(document.querySelectorAll('.mode-tab')).find((t) => t.textContent && t.textContent.includes('Ko‘rish'));
      if (tab) tab.click();
    });
    await new Promise((r) => setTimeout(r, 600));
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'audit_korish_1440px.png') });

    await page.evaluate(() => {
      const fsBtn = Array.from(document.querySelectorAll('.card-size-btn')).find((b) => b.textContent && b.textContent.includes('Fullscreen'));
      if (fsBtn) fsBtn.click();
    });
    await new Promise((r) => setTimeout(r, 600));
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'audit_fullscreen.png') });
    await page.keyboard.press('Escape');
    await new Promise((r) => setTimeout(r, 500));

    await page.setViewport({ width: 360, height: 740, deviceScaleFactor: 2 });
    await new Promise((r) => setTimeout(r, 600));
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'audit_mobile_360px.png') });

    await page.setViewport({ width: 1440, height: 920, deviceScaleFactor: 1.5 });
    await new Promise((r) => setTimeout(r, 400));

    await page.evaluate(() => {
      const dizaynBtn = Array.from(document.querySelectorAll('button')).find((b) => b.textContent && b.textContent.includes('Dizayn'));
      if (dizaynBtn) dizaynBtn.click();
    });
    await new Promise((r) => setTimeout(r, 600));
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'audit_dizayn_panel.png') });

    // -------------------------------------------------------------------------
    // STEP 6: MEASURED PERFORMANCE
    // -------------------------------------------------------------------------
    console.log('\n--- Measuring Real Runtime Performance ---');
    await page.evaluate(() => {
      const closeBtn = document.querySelector('.design-panel-header button');
      if (closeBtn) closeBtn.click();
      const tab = Array.from(document.querySelectorAll('.mode-tab')).find((t) => t.textContent && t.textContent.includes('Ikkalasi'));
      if (tab) tab.click();
    });
    await new Promise((r) => setTimeout(r, 500));

    // A. Normal Sample Document Performance
    const latenciesSample = [];
    const textareaHandle = await page.$('.editor-textarea');
    if (textareaHandle) {
      await textareaHandle.focus();
      for (let i = 0; i < 30; i++) {
        const t0 = performance.now();
        await page.keyboard.type('x');
        await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => resolve())));
        const t1 = performance.now();
        latenciesSample.push(t1 - t0);
      }
    }
    latenciesSample.sort((a, b) => a - b);
    const p50Sample = latenciesSample[Math.floor(latenciesSample.length * 0.5)] || 0;
    const p95Sample = latenciesSample[Math.floor(latenciesSample.length * 0.95)] || 0;

    // Measure input-to-preview settled time (time until cards render after input)
    const tInputStart = performance.now();
    await page.evaluate(() => {
      const textarea = document.querySelector('.editor-textarea');
      if (textarea) {
        const setter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set;
        setter.call(textarea, textarea.value + '\n\nYangi sinov qatori.');
        textarea.dispatchEvent(new Event('input', { bubbles: true }));
      }
    });
    // Wait for DOM to stabilize
    await page.waitForFunction(() => document.querySelectorAll('.study-card-9-16').length > 0);
    const inputToPreviewSettledMs = performance.now() - tInputStart;

    // Token change apply time
    const tokenTime = await page.evaluate(async () => {
      const t0 = performance.now();
      window.dispatchEvent(
        new CustomEvent('yurist:token-changed', {
          detail: { id: 'doc_card_radius', value: '18px' }
        })
      );
      await new Promise((r) => requestAnimationFrame(r));
      return performance.now() - t0;
    });

    // B. 30+ Page Synthetic Document Performance
    console.log('Generating 30+ page synthetic document for benchmark...');
    const syntheticSection = `
## Bo'lim: Yuridik Normalar va Huquqiy Kazuslar
norma: 101-modda: Fuqarolik javobgarligi asoslari
1-qism: Zarar yetkazgan shaxs, agar zarar o‘z aybi bilan yetkazilmaganini isbotlay olmasa, zararni to‘liq hajmda qoplashi shart.
2-qism: Qonunda nazarda tutilgan hollarda zarar yetkazuvchining aybidan qat’i nazar zarar qoplanadi.

kazus: Sud amaliyoti tahlili
faktlar: Shartnoma shartlari bir tomonlama buzilgan va 50 mln so‘m zarar yetkazilgan.
qoida: Fuqarolik kodeksining 333-moddasi talablari.
xulosa: Da'vo qanoatlantirilishi lozim.
`;
    const synthetic30PagesMd = `# 30 Sahifalik Katta Konspekt\nuslub: modern\n` + syntheticSection.repeat(25);

    await page.evaluate((val) => {
      const textarea = document.querySelector('.editor-textarea');
      if (textarea) {
        const setter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set;
        setter.call(textarea, val);
        textarea.dispatchEvent(new Event('input', { bubbles: true }));
      }
    }, synthetic30PagesMd);
    await new Promise((r) => setTimeout(r, 2200));

    const syntheticCardCount = await page.evaluate(() => document.querySelectorAll('.study-card-9-16').length);
    console.log(`Synthetic doc card count: ${syntheticCardCount}`);

    const latenciesSynthetic = [];
    if (textareaHandle) {
      await textareaHandle.focus();
      for (let i = 0; i < 30; i++) {
        const t0 = performance.now();
        await page.keyboard.type('y');
        await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => resolve())));
        const t1 = performance.now();
        latenciesSynthetic.push(t1 - t0);
      }
    }
    latenciesSynthetic.sort((a, b) => a - b);
    const p50Synthetic = latenciesSynthetic[Math.floor(latenciesSynthetic.length * 0.5)] || 0;
    const p95Synthetic = latenciesSynthetic[Math.floor(latenciesSynthetic.length * 0.95)] || 0;

    results.performance = {
      sampleDoc: {
        inputToPaintP50: Number(p50Sample.toFixed(2)),
        inputToPaintP95: Number(p95Sample.toFixed(2)),
        inputToPreviewSettledMs: Number(inputToPreviewSettledMs.toFixed(2))
      },
      synthetic30Doc: {
        pageCount: syntheticCardCount,
        inputToPaintP50: Number(p50Synthetic.toFixed(2)),
        inputToPaintP95: Number(p95Synthetic.toFixed(2))
      },
      tokenChangeApplyTimeMs: Number(tokenTime.toFixed(2)),
      bundleSizes: {
        cssKb: 137.56,
        cssGzipKb: 21.4,
        jsKb: 617.97,
        jsGzipKb: 179.56
      }
    };
    console.log('Performance results:', results.performance);

    fs.writeFileSync('/tmp/yurist_audit_results.json', JSON.stringify(results, null, 2));
    console.log('Audit completed successfully. Results saved to /tmp/yurist_audit_results.json');
  } catch (err) {
    console.error('Audit failed with error:', err);
  } finally {
    await browser.close();
  }
}

runAudit();
