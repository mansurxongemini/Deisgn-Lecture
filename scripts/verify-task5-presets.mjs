import puppeteer from 'puppeteer-core';
import { createServer } from 'vite';
import fs from 'fs';
import path from 'path';

const SCREENSHOT_DIR = path.resolve(process.cwd(), 'docs/screenshots/task5');
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function main() {
  console.log('--- TASK 5: PRESET LIBRARY VERIFICATION ---');

  let viteServer;
  let baseUrl = 'http://localhost:5185';

  try {
    const res = await fetch(baseUrl);
    if (!res.ok) throw new Error('Not ok');
    console.log(`Connected to existing server at ${baseUrl}`);
  } catch {
    console.log('Launching Vite server on port 5185...');
    viteServer = await createServer({
      server: { port: 5185, host: 'localhost' }
    });
    await viteServer.listen();
    console.log('Vite server running on http://localhost:5185');
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
    await new Promise((r) => setTimeout(r, 1200));

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
    await new Promise((r) => setTimeout(r, 400));

    // 1. Screenshot the preset grids
    console.log('3. Capturing Preset Grids in Dizayn Panel...');

    // A. Ranglar (Colors) grid
    const panelHandle = await page.$('.design-panel');
    if (panelHandle) {
      await panelHandle.screenshot({ path: path.join(SCREENSHOT_DIR, '01_preset_grid_colors.png') });
      console.log('   ✓ 01_preset_grid_colors.png saqlandi');
    }

    // B. Shriftlar (Typography) grid
    await page.evaluate(() => {
      const pills = Array.from(document.querySelectorAll('.design-filter-pill-btn'));
      const typoPill = pills.find((p) => p.textContent && p.textContent.includes('Shriftlar'));
      if (typoPill) typoPill.click();
    });
    await new Promise((r) => setTimeout(r, 300));
    if (panelHandle) {
      await panelHandle.screenshot({ path: path.join(SCREENSHOT_DIR, '02_preset_grid_typography.png') });
      console.log('   ✓ 02_preset_grid_typography.png saqlandi');
    }

    // C. Zichlik (Density) grid
    await page.evaluate(() => {
      const pills = Array.from(document.querySelectorAll('.design-filter-pill-btn'));
      const densityPill = pills.find((p) => p.textContent && p.textContent.includes('Zichlik'));
      if (densityPill) densityPill.click();
    });
    await new Promise((r) => setTimeout(r, 300));
    if (panelHandle) {
      await panelHandle.screenshot({ path: path.join(SCREENSHOT_DIR, '03_preset_grid_density.png') });
      console.log('   ✓ 03_preset_grid_density.png saqlandi');
    }

    // D. Muqova (Cover) grid
    await page.evaluate(() => {
      const pills = Array.from(document.querySelectorAll('.design-filter-pill-btn'));
      const coverPill = pills.find((p) => p.textContent && p.textContent.includes('Muqova'));
      if (coverPill) coverPill.click();
    });
    await new Promise((r) => setTimeout(r, 300));
    if (panelHandle) {
      await panelHandle.screenshot({ path: path.join(SCREENSHOT_DIR, '04_preset_grid_cover.png') });
      console.log('   ✓ 04_preset_grid_cover.png saqlandi');
    }

    // Helper to capture cover and first content card
    const capturePresetCards = async (presetNum, presetName) => {
      await new Promise((r) => setTimeout(r, 500));

      await page.evaluate(() => {
        const nav = document.querySelector('.card-nav-floating');
        if (nav) nav.style.display = 'none';
      });

      const coverCard = await page.$('.study-card-9-16.card-cover');
      if (coverCard) {
        await coverCard.screenshot({
          path: path.join(SCREENSHOT_DIR, `cover_preset_${presetNum}_${presetName}.png`)
        });
        console.log(`   ✓ cover_preset_${presetNum}_${presetName}.png saqlandi`);
      }

      // Content card (second card in list)
      const contentCards = await page.$$('.study-card-9-16');
      const contentCard = contentCards.length > 1 ? contentCards[1] : contentCards[0];
      if (contentCard) {
        await contentCard.screenshot({
          path: path.join(SCREENSHOT_DIR, `content_preset_${presetNum}_${presetName}.png`)
        });
        console.log(`   ✓ content_preset_${presetNum}_${presetName}.png saqlandi`);
      }

      await page.evaluate(() => {
        const nav = document.querySelector('.card-nav-floating');
        if (nav) nav.style.display = '';
      });
    };

    // 5 DISTINCT PRESETS
    console.log('\n4. Applying 5 distinct preset combinations and capturing cover + content cards...');

    // PRESET 1: Warm Paper (Issiq qog'oz) + Lora/Inter + Standart + Classic
    console.log('-> Applying Preset 1: Warm Paper (Issiq qog\'oz) + Lora/Inter + Standart + Classic');
    await page.evaluate(async () => {
      const win = window;
      const presets = win.presets;
      const color = presets.COLOR_PRESET_BY_ID.get('warm_paper');
      const typo = presets.TYPOGRAPHY_PRESET_BY_ID.get('lora_inter');
      const density = presets.DENSITY_PRESET_BY_ID.get('normal');
      const cover = presets.COVER_PRESET_BY_ID.get('classic');

      if (color) {
        for (const [k, v] of Object.entries(color.tokens)) await win.setToken(k, v);
      }
      if (typo) {
        await win.setToken('doc_font_heading', typo.headingFont);
        await win.setToken('doc_font_body', typo.bodyFont);
      }
      if (density) {
        for (const [k, v] of Object.entries(density.tokens)) await win.setToken(k, v);
      }
      if (cover) {
        await win.setToken('doc_cover_layout', cover.id);
      }
    });
    await capturePresetCards(1, 'warm_paper');

    // PRESET 2: Forest Emerald (Zumrad o'rmon) + Georgia/Inter + Compact + Crest Top
    console.log('-> Applying Preset 2: Forest Emerald + Georgia/Inter + Compact + Crest Top');
    await page.evaluate(async () => {
      const win = window;
      const presets = win.presets;
      const color = presets.COLOR_PRESET_BY_ID.get('forest');
      const typo = presets.TYPOGRAPHY_PRESET_BY_ID.get('georgia_inter');
      const density = presets.DENSITY_PRESET_BY_ID.get('compact');
      const cover = presets.COVER_PRESET_BY_ID.get('crest_top');

      if (color) {
        for (const [k, v] of Object.entries(color.tokens)) await win.setToken(k, v);
      }
      if (typo) {
        await win.setToken('doc_font_heading', typo.headingFont);
        await win.setToken('doc_font_body', typo.bodyFont);
      }
      if (density) {
        for (const [k, v] of Object.entries(density.tokens)) await win.setToken(k, v);
      }
      if (cover) {
        await win.setToken('doc_cover_layout', cover.id);
      }
    });
    await capturePresetCards(2, 'forest_emerald');

    // PRESET 3: Bordeaux Imperial (Bordo imperator) + Lora/Lora + Spacious + Bordered
    console.log('-> Applying Preset 3: Bordeaux Imperial + Lora/Lora + Spacious + Bordered');
    await page.evaluate(async () => {
      const win = window;
      const presets = win.presets;
      const color = presets.COLOR_PRESET_BY_ID.get('bordeaux');
      const typo = presets.TYPOGRAPHY_PRESET_BY_ID.get('lora_lora');
      const density = presets.DENSITY_PRESET_BY_ID.get('spacious');
      const cover = presets.COVER_PRESET_BY_ID.get('bordered');

      if (color) {
        for (const [k, v] of Object.entries(color.tokens)) await win.setToken(k, v);
      }
      if (typo) {
        await win.setToken('doc_font_heading', typo.headingFont);
        await win.setToken('doc_font_body', typo.bodyFont);
      }
      if (density) {
        for (const [k, v] of Object.entries(density.tokens)) await win.setToken(k, v);
      }
      if (cover) {
        await win.setToken('doc_cover_layout', cover.id);
      }
    });
    await capturePresetCards(3, 'bordeaux_imperial');

    // PRESET 4: Midnight Dark (Yarim tun) + Inter/Inter + Ultra-compact + Minimal
    console.log('-> Applying Preset 4: Midnight Dark + Inter/Inter + Ultra-compact + Minimal');
    await page.evaluate(async () => {
      const win = window;
      const presets = win.presets;
      const color = presets.COLOR_PRESET_BY_ID.get('midnight');
      const typo = presets.TYPOGRAPHY_PRESET_BY_ID.get('inter_inter');
      const density = presets.DENSITY_PRESET_BY_ID.get('ultra_compact');
      const cover = presets.COVER_PRESET_BY_ID.get('minimal');

      if (color) {
        for (const [k, v] of Object.entries(color.tokens)) await win.setToken(k, v);
      }
      if (typo) {
        await win.setToken('doc_font_heading', typo.headingFont);
        await win.setToken('doc_font_body', typo.bodyFont);
      }
      if (density) {
        for (const [k, v] of Object.entries(density.tokens)) await win.setToken(k, v);
      }
      if (cover) {
        await win.setToken('doc_cover_layout', cover.id);
      }
    });
    await capturePresetCards(4, 'midnight_dark');

    // PRESET 5: Arctic Frost (Arktika muzligi) + Georgia/Georgia + Comfortable + Left-aligned
    console.log('-> Applying Preset 5: Arctic Frost + Georgia/Georgia + Comfortable + Left-aligned');
    await page.evaluate(async () => {
      const win = window;
      const presets = win.presets;
      const color = presets.COLOR_PRESET_BY_ID.get('arctic');
      const typo = presets.TYPOGRAPHY_PRESET_BY_ID.get('georgia_georgia');
      const density = presets.DENSITY_PRESET_BY_ID.get('comfortable');
      const cover = presets.COVER_PRESET_BY_ID.get('left_aligned');

      if (color) {
        for (const [k, v] of Object.entries(color.tokens)) await win.setToken(k, v);
      }
      if (typo) {
        await win.setToken('doc_font_heading', typo.headingFont);
        await win.setToken('doc_font_body', typo.bodyFont);
      }
      if (density) {
        for (const [k, v] of Object.entries(density.tokens)) await win.setToken(k, v);
      }
      if (cover) {
        await win.setToken('doc_cover_layout', cover.id);
      }
    });
    await capturePresetCards(5, 'arctic_frost');

    // 5. MANUAL TOKEN TWEAK & "O'ZGARTIRILGAN" BADGE
    console.log('\n5. Performing manual token tweak on top of preset...');
    // Switch to 'colors' tab in panel
    await page.evaluate(() => {
      const pills = Array.from(document.querySelectorAll('.design-filter-pill-btn'));
      const colorPill = pills.find((p) => p.textContent && p.textContent.includes('Ranglar'));
      if (colorPill) colorPill.click();
    });
    await new Promise((r) => setTimeout(r, 300));

    // First click Arctic preset directly from UI card to ensure activeColorPresetId is 'arctic'
    await page.evaluate(() => {
      const cards = Array.from(document.querySelectorAll('.design-color-preset-card'));
      const arcticCard = cards.find((c) => c.getAttribute('title')?.includes('Arktika'));
      if (arcticCard) arcticCard.click();
    });
    await new Promise((r) => setTimeout(r, 400));

    // Now tweak doc_accent manually
    await page.evaluate(async () => {
      const win = window;
      await win.setToken('doc_accent', '#FF1493'); // Hot pink accent tweak
    });
    await new Promise((r) => setTimeout(r, 500));

    // Verify tweaked badge is rendered in the UI
    const badgeFound = await page.evaluate(() => {
      const badges = Array.from(document.querySelectorAll('.preset-tweaked-badge'));
      return {
        count: badges.length,
        text: badges.map((b) => b.textContent?.trim())
      };
    });
    console.log('Preset tweaked badge status:', badgeFound);

    if (panelHandle) {
      await panelHandle.screenshot({ path: path.join(SCREENSHOT_DIR, '05_preset_tweaked_badge.png') });
      console.log('   ✓ 05_preset_tweaked_badge.png saqlandi');
    }

    console.log('\nAll Task 5 screenshots successfully saved to docs/screenshots/task5!');
  } finally {
    await browser.close();
    if (viteServer) {
      await viteServer.close();
    }
  }
}

main().catch((err) => {
  console.error('Task 5 Verification failed:', err);
  process.exit(1);
});
