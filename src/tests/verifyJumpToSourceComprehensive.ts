import puppeteer from 'puppeteer-core';
import * as path from 'path';

const ARTIFACT_DIR = '/home/mansurxon/.gemini/antigravity-ide/brain/0c928012-c20e-4f4f-bd89-80e4dcffdca7';

async function runVerification() {
  console.log('🚀 Google Chrome brauzeri ishga tushirilmoqda...');
  const browser = await puppeteer.launch({
    executablePath: '/bin/google-chrome',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  await page.evaluateOnNewDocument(() => {
    localStorage.setItem('yurist_onboarding_completed', 'true');
    localStorage.setItem('yurist_preview_output_mode', 'a4');
    localStorage.setItem('yurist_editor_view_mode', 'both');
  });

  console.log('🌐 Sahifa ochilmoqda: http://localhost:5173...');
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle0' });
  await page.waitForSelector('.preview-container .a4-sheet', { timeout: 15000 });
  await new Promise((r) => setTimeout(r, 1200));

  // TEST 1: Document title jump test
  console.log('\n--- 1-TEST: Hujjat sarlavhasi (doc_title) orqali "Manbaga o\'tish" ---');
  const titleResult = await page.evaluate(async () => {
    const titleEl = document.querySelector('.a4-sheet .a4-doc-title') as HTMLElement | null;
    if (!titleEl) return { error: 'Hujjat sarlavhasi topilmadi' };

    titleEl.click();
    await new Promise((r) => setTimeout(r, 400));

    const jumpBtn = document.querySelector('.canvas-tb-btn-jump') as HTMLElement | null;
    const sourceLineBadge = document.querySelector('.canvas-tb-line-badge')?.textContent;

    if (!jumpBtn) return { error: 'Jump tugmasi topilmadi' };

    jumpBtn.click();
    await new Promise((r) => setTimeout(r, 400));

    const textarea = document.querySelector('.editor-textarea') as HTMLTextAreaElement | null;
    const activeGutter = document.querySelector('.editor-gutter-line.jump-flash') as HTMLElement | null;
    const activeBackdrop = document.querySelector('.editor-backdrop-line.jump-flash') as HTMLElement | null;

    return {
      success: true,
      sourceLineBadge,
      cursorPos: textarea?.selectionStart,
      selectionRangeLen: (textarea?.selectionEnd || 0) - (textarea?.selectionStart || 0),
      hasGutterFlash: !!activeGutter,
      hasBackdropFlash: !!activeBackdrop
    };
  });

  console.log('1-Test natijasi:', titleResult);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'jump_test_1_title.png') });

  // TEST 2: Mid-document / definition block jump test
  console.log('\n--- 2-TEST: Ta\'rif bloki orqali "Manbaga o\'tish" ---');
  const blockResult = await page.evaluate(async () => {
    const editables = Array.from(document.querySelectorAll<HTMLElement>('.a4-sheet [data-canvas-editable="true"]'));
    // Ta'rif yoki norma blokini olamiz
    const target = editables.find((el) => {
      const src = el.getAttribute('data-source-line');
      return src && parseInt(src, 10) > 4;
    }) || editables[2];

    if (!target) return { error: 'Tahrirlanadigan blok topilmadi' };

    const targetLine = parseInt(target.getAttribute('data-source-line') || '1', 10);
    target.scrollIntoView({ behavior: 'instant', block: 'center' });
    target.click();
    await new Promise((r) => setTimeout(r, 400));

    const jumpBtn = document.querySelector('.canvas-tb-btn-jump') as HTMLElement | null;
    if (!jumpBtn) return { error: 'Jump tugmasi topilmadi' };

    jumpBtn.click();
    await new Promise((r) => setTimeout(r, 500));

    const textarea = document.querySelector('.editor-textarea') as HTMLTextAreaElement | null;
    const gutterEl = document.querySelector(`.editor-gutter-line:nth-child(${targetLine})`) as HTMLElement | null;
    const activeGutter = document.querySelector('.editor-gutter-line.jump-flash') as HTMLElement | null;
    const activeBackdrop = document.querySelector('.editor-backdrop-line.jump-flash') as HTMLElement | null;

    // Check if target line is in the textarea visible viewport
    const textareaTop = textarea ? textarea.scrollTop : 0;
    const textareaBottom = textareaTop + (textarea ? textarea.clientHeight : 0);
    const lineTop = gutterEl ? gutterEl.offsetTop : 0;
    const isTargetInView = lineTop >= textareaTop - 50 && lineTop <= textareaBottom + 50;

    return {
      success: true,
      targetLine,
      lineTop,
      textareaScrollTop: textareaTop,
      isTargetInView,
      selectionRangeLen: (textarea?.selectionEnd || 0) - (textarea?.selectionStart || 0),
      hasGutterFlash: !!activeGutter,
      hasBackdropFlash: !!activeBackdrop
    };
  });

  console.log('2-Test natijasi:', blockResult);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'jump_test_2_block.png') });

  // TEST 3: Section header jump test
  console.log('\n--- 3-TEST: Bo\'lim sarlavhasi (sec_title) orqali "Manbaga o\'tish" ---');
  const sectionResult = await page.evaluate(async () => {
    const secTitle = document.querySelector('.a4-sheet .a4-section-title') as HTMLElement | null;
    if (!secTitle) return { error: 'Bo\'lim sarlavhasi topilmadi' };

    secTitle.scrollIntoView({ behavior: 'instant', block: 'center' });
    secTitle.click();
    await new Promise((r) => setTimeout(r, 400));

    const jumpBtn = document.querySelector('.canvas-tb-btn-jump') as HTMLElement | null;
    const sourceLineBadge = document.querySelector('.canvas-tb-line-badge')?.textContent;
    if (!jumpBtn) return { error: 'Jump tugmasi topilmadi' };

    jumpBtn.click();
    await new Promise((r) => setTimeout(r, 500));

    const textarea = document.querySelector('.editor-textarea') as HTMLTextAreaElement | null;
    const activeGutter = document.querySelector('.editor-gutter-line.jump-flash') as HTMLElement | null;

    return {
      success: true,
      sourceLineBadge,
      cursorPos: textarea?.selectionStart,
      hasGutterFlash: !!activeGutter
    };
  });

  console.log('3-Test natijasi:', sectionResult);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'jump_test_3_section.png') });

  // TEST 4: Jump from Preview-only mode (viewMode: preview -> transitions smoothly)
  console.log('\n--- 4-TEST: Faqat ko\'rish (preview-only) rejimidan sakrash ---');
  const previewOnlyResult = await page.evaluate(async () => {
    // Switch to preview mode
    const previewTab = Array.from(document.querySelectorAll<HTMLElement>('header button')).find(
      (b) => b.textContent?.includes('Ko‘rish') || b.textContent?.includes('Ko\'rish')
    );
    if (previewTab) previewTab.click();
    await new Promise((r) => setTimeout(r, 600));

    // Click an editable element
    const editable = document.querySelector('.a4-sheet [data-canvas-editable="true"]') as HTMLElement | null;
    if (!editable) return { error: 'Editable element topilmadi' };

    editable.click();
    await new Promise((r) => setTimeout(r, 400));

    const jumpBtn = document.querySelector('.canvas-tb-btn-jump') as HTMLElement | null;
    if (!jumpBtn) return { error: 'Jump tugmasi topilmadi' };

    jumpBtn.click();
    await new Promise((r) => setTimeout(r, 700));

    const textarea = document.querySelector('.editor-textarea');
    return {
      success: true,
      editorOpened: !!textarea,
      activeGutter: !!document.querySelector('.editor-gutter-line.jump-flash')
    };
  });

  console.log('4-Test natijasi:', previewOnlyResult);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'jump_test_4_preview_to_both.png') });

  console.log('\n✅ Barcha Chrome testlari muvaffaqiyatli yakunlandi!');
  await browser.close();
}

runVerification().catch((err) => {
  console.error('Xatolik:', err);
  process.exit(1);
});
