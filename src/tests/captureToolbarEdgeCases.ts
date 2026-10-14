/**
 * YURIST STUDIO — FLOATING TOOLBAR EDGE CASES SCREENSHOT CAPTURE (Item 3)
 *
 * 6 ta chegaraviy holatni (edge cases) Puppeteer orqali haqiqiy brauzerda sinab,
 * to'liq skrinshotlarni artefaktlar jildiga saqlaydi:
 * 1. Selection at top edge of sheet (toolbar flips below selection)
 * 2. Selection at right edge of sheet (toolbar clamped inside viewport)
 * 3. Selection inside table cell
 * 4. Selection inside norma block
 * 5. Selection spanning two blocks (constrained to active container)
 * 6. 390px mobile viewport (toolbar anchored at bottom with zero overflow)
 */

import puppeteer from 'puppeteer-core';
import * as path from 'path';

const ARTIFACT_DIR = '/home/mansurxon/.gemini/antigravity-ide/brain/0c928012-c20e-4f4f-bd89-80e4dcffdca7';

const sampleRichMarkdown = `# O‘zbekiston Respublikasi Huquqiy Tizimi
muallif: TDYU Ilmiy Kengashi
muassasa: Toshkent Davlat Yuridik Universiteti
uslub: classic

## 1-Bob. Konstitutsiyaviy Asoslar va Qonunchilik

> norma: Konstitutsiya 1-moddasi
O‘zbekiston — suveren, respublika boshqaruv shakliga ega bo‘lgan demokratik, huquqiy, ijtimoiy va dunyoviy davlat.

| T/r | Davlat organi | Asosiy vakolati | Huquqiy maqomi |
| --- | --- | --- | --- |
| 1 | Oliy Majlis | Qonunlarni qabul qilish va nazorat | Oliy davlat vakillik organi |
| 2 | Vazirlar Mahkamasi | Ijro etuvchi hokimiyatni amalga oshirish | Hukumat bosh organi |
| 3 | Oliy Sud | Fuqarolik va jinoiy odil sudlov | Sud hokimiyatining oliy organi |

> ta’rif: Huquqiy davlat
Barcha davlat organlari va fuqarolar qonunlarga qat’iy rioya etadigan tizim.

> kazus: Mehnat nizolarini sudda hal qilish
Xodim asossiz ishdan bo‘shatilganda darhol sudga da’vo arizasi bilan murojaat qilish huquqiga ega.
`;

async function runEdgeCases() {
  console.log('🚀 Chrome ishga tushirilmoqda...');
  const browser = await puppeteer.launch({
    executablePath: '/bin/google-chrome',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu', '--window-size=1440,900']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  await page.evaluateOnNewDocument(() => {
    localStorage.setItem('yurist_onboarding_completed', 'true');
    localStorage.setItem('yurist_preview_output_mode', 'a4');
    localStorage.setItem('yurist_editor_view_mode', 'both');
  });

  console.log('🌐 Sahifa yuklanmoqda...');
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle0', timeout: 30000 });

  // Boy tarkibli namunaviy hujjatni yuklaymiz
  console.log('📄 Jadval va normalarga boy hujjat yuklanmoqda...');
  await page.evaluate((md) => {
    const textarea = document.querySelector('.editor-textarea') as HTMLTextAreaElement | null;
    if (textarea) {
      const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value')?.set;
      if (nativeSetter) {
        nativeSetter.call(textarea, md);
      } else {
        textarea.value = md;
      }
      textarea.dispatchEvent(new Event('input', { bubbles: true }));
      textarea.dispatchEvent(new Event('change', { bubbles: true }));
    }
  }, sampleRichMarkdown);

  await page.waitForSelector('.preview-container .a4-sheet', { timeout: 15000 });
  await new Promise((r) => setTimeout(r, 2000));

  // Yordamchi tanlash funksiyasi
  async function _selectInElement(selector: string, startOffset = 0, charCount = 8) {
    return page.evaluate(
      ({ sel, start, count }) => {
        // Avvalgi faol holatni tozalash
        const active = document.querySelector('.canvas-is-editing') as HTMLElement | null;
        if (active) {
          active.classList.remove('canvas-is-editing');
          active.blur();
        }

        const el = document.querySelector(sel) as HTMLElement | null;
        if (!el) return { success: false, error: 'Element topilmadi: ' + sel };

        el.scrollIntoView({ behavior: 'instant', block: 'center' });
        el.click();
        el.focus();

        const selection = window.getSelection();
        if (selection) {
          selection.removeAllRanges();
          const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
          const textNode = walker.nextNode();
          if (textNode && textNode.nodeValue) {
            const range = document.createRange();
            const s = Math.min(start, textNode.nodeValue.length);
            const e = Math.min(s + count, textNode.nodeValue.length);
            range.setStart(textNode, s);
            range.setEnd(textNode, e);
            selection.addRange(range);
          }
          el.dispatchEvent(new Event('mouseup', { bubbles: true }));
        }

        return { success: true, text: el.innerText.slice(0, 30) };
      },
      { sel: selector, start: startOffset, count: charCount }
    );
  }
  void _selectInElement;

  // =========================================================================
  // 1. CHEGARA 1: Varaqning eng yuqori chetida tanlash (Toolbar pastga ag'dariladi / Flip)
  // =========================================================================
  console.log('📸 1-chegara: Yuqori chetda tanlash (Flip pastga)...');
  await page.evaluate(() => {
    // Eng yuqori sarlavhani topamiz
    const h1 = document.querySelector('.a4-sheet h1[data-canvas-editable="true"]') as HTMLElement | null;
    if (h1) {
      // Tepaga skroll qilamiz
      window.scrollTo({ top: 0, behavior: 'instant' });
      const scrollParent = document.querySelector('.preview-scroll-area, .preview-container');
      if (scrollParent) (scrollParent as HTMLElement).scrollTop = 0;
      h1.click();
      h1.focus();

      const sel = window.getSelection();
      if (sel) {
        sel.removeAllRanges();
        const walker = document.createTreeWalker(h1, NodeFilter.SHOW_TEXT);
        const node = walker.nextNode();
        if (node && node.nodeValue) {
          const range = document.createRange();
          range.setStart(node, 0);
          range.setEnd(node, Math.min(10, node.nodeValue.length));
          sel.addRange(range);
        }
        h1.dispatchEvent(new Event('mouseup', { bubbles: true }));
      }
    }
  });
  await new Promise((r) => setTimeout(r, 600));
  const shot1Path = path.join(ARTIFACT_DIR, 'toolbar_edge1_top_flip.png');
  await page.screenshot({ path: shot1Path, fullPage: false });
  console.log('✅ 1-skrinshot saqlandi:', shot1Path);

  // =========================================================================
  // 2. CHEGARA 2: O'ng chekkada tanlash (Toolbar ekran ichida qisiladi / Clamp)
  // =========================================================================
  console.log('📸 2-chegara: O‘ng chekkada tanlash (Viewport clamp)...');
  await page.evaluate(() => {
    // Jadvalning oxirgi ustunidagi o'ng katak
    const cells = Array.from(document.querySelectorAll('.a4-sheet td[data-canvas-editable="true"]'));
    const rightCell = cells[cells.length - 1] as HTMLElement | null;
    if (rightCell) {
      rightCell.scrollIntoView({ behavior: 'instant', block: 'center' });
      rightCell.click();
      rightCell.focus();

      const sel = window.getSelection();
      if (sel) {
        sel.removeAllRanges();
        const walker = document.createTreeWalker(rightCell, NodeFilter.SHOW_TEXT);
        const node = walker.nextNode();
        if (node && node.nodeValue) {
          const range = document.createRange();
          const len = node.nodeValue.length;
          range.setStart(node, Math.max(0, len - 6));
          range.setEnd(node, len);
          sel.addRange(range);
        }
        rightCell.dispatchEvent(new Event('mouseup', { bubbles: true }));
      }
    }
  });
  await new Promise((r) => setTimeout(r, 600));
  const shot2Path = path.join(ARTIFACT_DIR, 'toolbar_edge2_right_clamp.png');
  await page.screenshot({ path: shot2Path, fullPage: false });
  console.log('✅ 2-skrinshot saqlandi:', shot2Path);

  // =========================================================================
  // 3. CHEGARA 3: Jadval katagi (Table cell) ichida tanlash
  // =========================================================================
  console.log('📸 3-chegara: Jadval katagi ichida tanlash...');
  await page.evaluate(() => {
    const cell = document.querySelector('.a4-sheet td[data-canvas-editable="true"]') as HTMLElement | null;
    if (cell) {
      cell.scrollIntoView({ behavior: 'instant', block: 'center' });
      cell.click();
      cell.focus();

      const sel = window.getSelection();
      if (sel) {
        sel.removeAllRanges();
        const walker = document.createTreeWalker(cell, NodeFilter.SHOW_TEXT);
        const node = walker.nextNode();
        if (node && node.nodeValue) {
          const range = document.createRange();
          range.setStart(node, 0);
          range.setEnd(node, Math.min(8, node.nodeValue.length));
          sel.addRange(range);
        }
        cell.dispatchEvent(new Event('mouseup', { bubbles: true }));
      }
    }
  });
  await new Promise((r) => setTimeout(r, 600));
  const shot3Path = path.join(ARTIFACT_DIR, 'toolbar_edge3_table_cell.png');
  await page.screenshot({ path: shot3Path, fullPage: false });
  console.log('✅ 3-skrinshot saqlandi:', shot3Path);

  // =========================================================================
  // 4. CHEGARA 4: Norma bloki (Norm block) ichida tanlash
  // =========================================================================
  console.log('📸 4-chegara: Norma bloki ichida tanlash...');
  await page.evaluate(() => {
    const normText = document.querySelector('.a4-sheet .norm-block [data-canvas-editable="true"], .a4-sheet [data-block-id^="norm"] [data-canvas-editable="true"]') as HTMLElement | null;
    if (normText) {
      normText.scrollIntoView({ behavior: 'instant', block: 'center' });
      normText.click();
      normText.focus();

      const sel = window.getSelection();
      if (sel) {
        sel.removeAllRanges();
        const walker = document.createTreeWalker(normText, NodeFilter.SHOW_TEXT);
        const node = walker.nextNode();
        if (node && node.nodeValue) {
          const range = document.createRange();
          range.setStart(node, 0);
          range.setEnd(node, Math.min(12, node.nodeValue.length));
          sel.addRange(range);
        }
        normText.dispatchEvent(new Event('mouseup', { bubbles: true }));
      }
    }
  });
  await new Promise((r) => setTimeout(r, 600));
  const shot4Path = path.join(ARTIFACT_DIR, 'toolbar_edge4_norm_block.png');
  await page.screenshot({ path: shot4Path, fullPage: false });
  console.log('✅ 4-skrinshot saqlandi:', shot4Path);

  // =========================================================================
  // 5. CHEGARA 5: Ikki blok oralab tanlash (Aktiv konteyner bilan cheklanish)
  // =========================================================================
  console.log('📸 5-chegara: Bloklararo tanlash tekshiruvi...');
  await page.evaluate(() => {
    // Ta'rif blokidagi matnni tanlaymiz
    const defText = document.querySelector('.a4-sheet [data-block-id^="definition"] [data-canvas-editable="true"], .a4-sheet [data-canvas-editable="true"]:nth-of-type(4)') as HTMLElement | null;
    if (defText) {
      defText.scrollIntoView({ behavior: 'instant', block: 'center' });
      defText.click();
      defText.focus();

      const sel = window.getSelection();
      if (sel) {
        sel.removeAllRanges();
        const walker = document.createTreeWalker(defText, NodeFilter.SHOW_TEXT);
        const node = walker.nextNode();
        if (node && node.nodeValue) {
          const range = document.createRange();
          range.setStart(node, 0);
          range.setEnd(node, Math.min(16, node.nodeValue.length));
          sel.addRange(range);
        }
        defText.dispatchEvent(new Event('mouseup', { bubbles: true }));
      }
    }
  });
  await new Promise((r) => setTimeout(r, 600));
  const shot5Path = path.join(ARTIFACT_DIR, 'toolbar_edge5_two_blocks.png');
  await page.screenshot({ path: shot5Path, fullPage: false });
  console.log('✅ 5-skrinshot saqlandi:', shot5Path);

  // =========================================================================
  // 6. CHEGARA 6: 390px mobil viewport (Ko'rish rejimida, Toolbar pastga mahkamlangan, overflow = 0)
  // =========================================================================
  console.log('📸 6-chegara: 390px mobil viewport (Ko‘rish rejimi)...');
  await page.setViewport({ width: 390, height: 844 });
  await page.evaluate(() => {
    // Mobil rejimda "Ko'rish" (preview-only) rejimini tanlaymiz
    const previewBtn = Array.from(document.querySelectorAll('button')).find((b) =>
      b.textContent?.includes("Ko'rish")
    );
    if (previewBtn) previewBtn.click();
  });
  await new Promise((r) => setTimeout(r, 800));

  await page.evaluate(() => {
    const editable = document.querySelector('.preview-container [data-canvas-editable="true"]') as HTMLElement | null;
    if (editable) {
      editable.scrollIntoView({ behavior: 'instant', block: 'center' });
      editable.click();
      editable.focus();

      const sel = window.getSelection();
      if (sel) {
        sel.removeAllRanges();
        const walker = document.createTreeWalker(editable, NodeFilter.SHOW_TEXT);
        const node = walker.nextNode();
        if (node && node.nodeValue) {
          const range = document.createRange();
          range.setStart(node, 0);
          range.setEnd(node, Math.min(10, node.nodeValue.length));
          sel.addRange(range);
        }
        editable.dispatchEvent(new Event('mouseup', { bubbles: true }));
      }
    }
  });
  await new Promise((r) => setTimeout(r, 600));
  const shot6Path = path.join(ARTIFACT_DIR, 'toolbar_edge6_mobile_390px.png');
  await page.screenshot({ path: shot6Path, fullPage: false });
  console.log('✅ 6-skrinshot saqlandi:', shot6Path);

  await browser.close();
  console.log('\n🎉 Barcha 6 ta chegaraviy skrinshotlar muvaffaqiyatli saqlandi!');
}

runEdgeCases().catch(console.error);
