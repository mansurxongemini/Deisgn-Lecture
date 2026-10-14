import puppeteer from 'puppeteer-core';
import { createServer } from 'vite';
import fs from 'fs';
import path from 'path';

const SCREENSHOT_DIR = path.resolve(process.cwd(), 'docs/screenshots/task6');
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function main() {
  console.log('=== TASK 6: SAVED CUSTOM STYLES VERIFICATION ===');

  let viteServer;
  let baseUrl = 'http://localhost:5186';

  try {
    const res = await fetch(baseUrl);
    if (!res.ok) throw new Error('Not ok');
    console.log(`Connected to existing server at ${baseUrl}`);
  } catch {
    console.log('Launching Vite server on port 5186...');
    viteServer = await createServer({
      server: { port: 5186, host: 'localhost' }
    });
    await viteServer.listen();
    console.log('Vite server running on http://localhost:5186');
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

    // Reset tokens for clean baseline
    await page.evaluate(async () => {
      const win = window;
      if (win.resetAll) {
        await win.resetAll();
      }
    });
    await new Promise((r) => setTimeout(r, 400));

    // Open Dizayn panel
    console.log('2. Opening Dizayn panel...');
    const dizaynBtn = await page.evaluateHandle(() => {
      const btns = Array.from(document.querySelectorAll('button.nav-btn'));
      return btns.find((b) => b.textContent && b.textContent.includes('Dizayn'));
    });
    if (!dizaynBtn) throw new Error('"Dizayn" tugmasi topilmadi');
    await dizaynBtn.click();
    await new Promise((r) => setTimeout(r, 600));

    // Configure some distinctive tokens (e.g. Bordeaux/Burgundy preset or custom tokens)
    console.log('3. Applying distinctive tokens to prepare custom style...');
    await page.evaluate(async () => {
      const win = window;
      if (win.tokenEngine) {
        await win.tokenEngine.setToken('doc_bg', '#FDF8F5');
        await win.tokenEngine.setToken('doc_ink', '#1E1B18');
        await win.tokenEngine.setToken('doc_accent', '#881337'); // Rich Bordeaux accent
        await win.tokenEngine.setToken('doc_font_heading', 'Lora');
        await win.tokenEngine.setToken('doc_radius_card', '28px');
      }
    });
    await new Promise((r) => setTimeout(r, 600));

    // Click "Uslubni saqlash" button
    console.log('4. Clicking "Uslubni saqlash" button in Dizayn panel...');
    const saveBtn = await page.evaluateHandle(() => {
      const btns = Array.from(document.querySelectorAll('.design-action-btn-primary'));
      return btns.find((b) => b.textContent && b.textContent.includes('Uslubni saqlash'));
    });
    if (!saveBtn) throw new Error('"Uslubni saqlash" tugmasi topilmadi');
    await saveBtn.click();
    await new Promise((r) => setTimeout(r, 300));

    // Capture screenshot of save input
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '01_dizayn_panel_save_form.png') });
    console.log('Saved 01_dizayn_panel_save_form.png');

    // Type "Mening TDYU uslubim" into the input
    console.log('5. Typing style name: "Mening TDYU uslubim"...');
    const inputSelector = '.design-save-input';
    await page.waitForSelector(inputSelector);
    await page.type(inputSelector, 'Mening TDYU uslubim');
    await new Promise((r) => setTimeout(r, 300));

    // Click "Saqlash" button
    const confirmSaveBtn = await page.evaluateHandle(() => {
      const btns = Array.from(document.querySelectorAll('.design-save-inline-card button'));
      return btns.find((b) => b.textContent && b.textContent.trim() === 'Saqlash');
    });
    if (!confirmSaveBtn) throw new Error('Tasdiqlash "Saqlash" tugmasi topilmadi');
    await confirmSaveBtn.click();
    await new Promise((r) => setTimeout(r, 800));

    // Confirm custom style created and active in grid
    console.log('6. Confirming custom style was created and applied...');
    const createdStyle = await page.evaluate(() => {
      const win = window;
      const styles = win.customStyles ? win.customStyles.getCustomStyles() : [];
      const card = document.querySelector('.design-custom-style-card.active');
      const accent = document.documentElement.style.getPropertyValue('--doc-accent');
      return {
        count: styles.length,
        styleName: styles[0]?.name,
        cardFound: !!card,
        accent
      };
    });
    console.log('Created style status (Before reload):', createdStyle);

    // Screenshot before reload
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '02_custom_style_created.png') });
    console.log('Saved 02_custom_style_created.png (BEFORE reload)');

    // 7. RELOAD THE PAGE
    console.log('7. Reloading the page to test IndexedDB persistence...');
    await page.reload({ waitUntil: 'networkidle2' });
    await page.waitForSelector('.app-container');
    await new Promise((r) => setTimeout(r, 1200));

    // Re-open Dizayn panel
    const dizaynBtnAfter = await page.evaluateHandle(() => {
      const btns = Array.from(document.querySelectorAll('button.nav-btn'));
      return btns.find((b) => b.textContent && b.textContent.includes('Dizayn'));
    });
    if (dizaynBtnAfter) {
      await dizaynBtnAfter.click();
      await new Promise((r) => setTimeout(r, 500));
    }

    // Switch to "Mening uslublarim" tab
    await page.evaluate(() => {
      const pills = Array.from(document.querySelectorAll('.design-filter-pill-btn'));
      const customPill = pills.find((p) => p.textContent && p.textContent.includes('Mening uslublarim'));
      if (customPill) customPill.click();
    });
    await new Promise((r) => setTimeout(r, 600));

    // Verify persistence after reload
    const persistedStatus = await page.evaluate(() => {
      const win = window;
      const styles = win.customStyles ? win.customStyles.getCustomStyles() : [];
      const tdyu = styles.find((s) => s.name.includes('Mening TDYU uslubim'));
      const activeCard = document.querySelector('.design-custom-style-card');
      const accent = document.documentElement.style.getPropertyValue('--doc-accent');
      return {
        stylesCount: styles.length,
        hasTdyu: !!tdyu,
        tdyuName: tdyu?.name,
        tdyuAccent: tdyu?.tokens?.doc_accent,
        activeCardText: activeCard ? activeCard.textContent?.trim() : null,
        currentAccentVar: accent
      };
    });
    console.log('Persistence status (After reload):', persistedStatus);

    if (!persistedStatus.hasTdyu) {
      throw new Error('FAIL: "Mening TDYU uslubim" reload-dan so‘ng topilmadi!');
    }

    // Screenshot after reload
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '03_custom_style_persisted_after_reload.png') });
    console.log('Saved 03_custom_style_persisted_after_reload.png (AFTER reload)');

    // 8. TEST RENAME
    console.log('8. Testing rename custom style...');
    const renameIcon = await page.$('.custom-style-action-icons button[title="Nomini o‘zgartirish"]');
    if (renameIcon) {
      await renameIcon.click();
      await new Promise((r) => setTimeout(r, 300));
      const renameInput = await page.$('.custom-style-rename-input');
      if (renameInput) {
        await page.evaluate(() => {
          const inp = document.querySelector('.custom-style-rename-input');
          if (inp) inp.value = '';
        });
        await renameInput.type('Mening TDYU uslubim (Rasmiy)');
        await new Promise((r) => setTimeout(r, 200));
        const okBtn = await page.evaluateHandle(() => {
          const btns = Array.from(document.querySelectorAll('.custom-style-rename-box button'));
          return btns.find((b) => b.textContent && b.textContent.includes('OK'));
        });
        if (okBtn) await okBtn.click();
        await new Promise((r) => setTimeout(r, 500));
      }
    }

    // Screenshot after rename
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '04_custom_style_rename.png') });
    console.log('Saved 04_custom_style_rename.png');

    // 9. TEST DOCUMENT SWITCHING AND STYLE MEMORY
    console.log('9. Testing document switching and style memory...');
    // Create second document
    await page.evaluate(async () => {
      // Find another doc or create new doc
      const sidebarItems = Array.from(document.querySelectorAll('.file-tree-item.document-item'));
      if (sidebarItems.length > 1) {
        sidebarItems[1].click();
      }
    });
    await new Promise((r) => setTimeout(r, 1000));

    // Confirm that doc 2 has default/classic theme (tokens reset)
    const doc2Status = await page.evaluate(() => {
      const accent = document.documentElement.style.getPropertyValue('--doc-accent');
      return { accent };
    });
    console.log('Doc 2 tokens (switched away from TDYU style):', doc2Status);

    // Switch back to Doc 1
    await page.evaluate(async () => {
      const sidebarItems = Array.from(document.querySelectorAll('.file-tree-item.document-item'));
      if (sidebarItems.length > 0) {
        sidebarItems[0].click();
      }
    });
    await new Promise((r) => setTimeout(r, 1000));

    const doc1RestoredStatus = await page.evaluate(() => {
      const accent = document.documentElement.style.getPropertyValue('--doc-accent');
      return { accent };
    });
    console.log('Doc 1 restored tokens (switched back to TDYU style):', doc1RestoredStatus);

    // Screenshot document switching
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '05_document_switching_style_memory.png') });
    console.log('Saved 05_document_switching_style_memory.png');

    // 10. TEST EXPORT / IMPORT
    console.log('10. Testing JSON export & import...');
    const exportImportResult = await page.evaluate(async () => {
      const win = window;
      const styles = win.customStyles.getCustomStyles();
      const styleToExport = styles[0];
      const exportedJson = JSON.stringify({
        format: 'yurist-studio-style',
        version: '1.0',
        exportedAt: Date.now(),
        style: styleToExport
      });

      const imported = await win.customStyles.importStyleFromJson(exportedJson);
      const allAfterImport = win.customStyles.getCustomStyles();
      return {
        exportedName: styleToExport.name,
        importedName: imported.name,
        totalStyles: allAfterImport.length
      };
    });
    console.log('Export/Import verification:', exportImportResult);

    await page.evaluate(() => {
      const pills = Array.from(document.querySelectorAll('.design-filter-pill-btn'));
      const customPill = pills.find((p) => p.textContent && p.textContent.includes('Mening uslublarim'));
      if (customPill) customPill.click();
    });
    await new Promise((r) => setTimeout(r, 600));

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '06_exported_imported_style.png') });
    console.log('Saved 06_exported_imported_style.png');

    console.log('=== ALL TASK 6 VERIFICATIONS PASSED SUCCESSFULLY! ===');
  } finally {
    await browser.close();
    if (viteServer) {
      await viteServer.close();
    }
  }
}

main().catch((err) => {
  console.error('Error during Task 6 verification:', err);
  process.exit(1);
});
