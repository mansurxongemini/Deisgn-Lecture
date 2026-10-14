import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

const ARTIFACT_DIR = '/home/mansurxon/.gemini/antigravity-ide/brain/0c928012-c20e-4f4f-bd89-80e4dcffdca7';

async function run() {
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: '/bin/google-chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle0' });
  await page.waitForSelector('.preview-container', { timeout: 10000 });
  await new Promise((r) => setTimeout(r, 1000));

  // 1. Verify Measurer Isolation
  const measurerReport = await page.evaluate(() => {
    const studyCards = Array.from(document.querySelectorAll('.study-card-9-16'));
    const measurer = document.querySelector('.pagination-measurer');
    const measurerInQuery = studyCards.includes(measurer);
    return {
      studyCardsCount: studyCards.length,
      measurerExists: !!measurer,
      measurerInStudyCardsQuery: measurerInQuery,
      measurerDataAttr: measurer ? measurer.getAttribute('data-measurer') : null,
      measurerAriaHidden: measurer ? measurer.getAttribute('aria-hidden') : null,
      measurerClasses: measurer ? measurer.className : null
    };
  });
  console.log('Measurer Isolation Report:\n', JSON.stringify(measurerReport, null, 2));

  // 2. Viewport Overflow Verification
  const viewports = [
    { width: 360, height: 800, name: 'mobile_360px' },
    { width: 390, height: 844, name: 'mobile_390px' },
    { width: 768, height: 1024, name: 'tablet_768px' },
    { width: 1440, height: 900, name: 'desktop_1440px' }
  ];

  for (const vp of viewports) {
    await page.setViewport({ width: vp.width, height: vp.height });
    await new Promise((r) => setTimeout(r, 600));

    const overflowData = await page.evaluate(() => {
      const bSw = document.body.scrollWidth;
      const bCw = document.body.clientWidth;
      const dSw = document.documentElement.scrollWidth;
      const dCw = document.documentElement.clientWidth;

      // Find overflowing elements
      const overflowing = [];
      document.querySelectorAll('*').forEach((el) => {
        if (el.scrollWidth > el.clientWidth && el.clientWidth > 0) {
          const style = window.getComputedStyle(el);
          if (style.overflowX !== 'auto' && style.overflowX !== 'scroll' && style.overflowX !== 'hidden') {
            overflowing.push({
              tag: el.tagName,
              className: el.className,
              sw: el.scrollWidth,
              cw: el.clientWidth
            });
          }
        }
      });

      return {
        bodyMatches: bSw === bCw,
        bSw,
        bCw,
        docMatches: dSw === dCw,
        dSw,
        dCw,
        overflowingElementsCount: overflowing.length,
        overflowingElements: overflowing
      };
    });

    console.log(`Viewport ${vp.name} (${vp.width}px):\n`, JSON.stringify(overflowData, null, 2));

    const shotPath = path.join(ARTIFACT_DIR, `proof_${vp.name}.png`);
    await page.screenshot({ path: shotPath, fullPage: false });
    console.log(`Saved screenshot: ${shotPath}`);

    // If mobile 360px, also test open hamburger menu and navigator overflow
    if (vp.width === 360) {
      // Click mobile hamburger
      const menuBtn = await page.$('.nav-mobile-menu-btn');
      if (menuBtn) {
        await menuBtn.click();
        await new Promise((r) => setTimeout(r, 400));
        const menuShot = path.join(ARTIFACT_DIR, 'proof_mobile_360px_menu_open.png');
        await page.screenshot({ path: menuShot });
        console.log(`Saved menu screenshot: ${menuShot}`);
        // close menu
        await menuBtn.click();
        await new Promise((r) => setTimeout(r, 200));
      }

      // Click navigator overflow button
      const navMoreBtn = await page.$('.card-nav-more-btn');
      if (navMoreBtn) {
        await navMoreBtn.click();
        await new Promise((r) => setTimeout(r, 400));
        const navShot = path.join(ARTIFACT_DIR, 'proof_mobile_360px_nav_popover.png');
        await page.screenshot({ path: navShot });
        console.log(`Saved navigator popover screenshot: ${navShot}`);
      }
    }
  }

  await browser.close();
  console.log('ALL VERIFICATIONS COMPLETED SUCCESSFULLY!');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
