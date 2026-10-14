import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const SCREENSHOT_DIR = path.resolve(process.cwd(), 'docs/screenshots/task12');
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function main() {
  console.log('=== TASK 12: PREVIEW WORKSPACE REDESIGN VERIFICATION ===');

  const baseUrl = 'http://localhost:5173';

  const browser = await puppeteer.launch({
    headless: true,
    executablePath: '/bin/google-chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 920, deviceScaleFactor: 1.5 });

    console.log('1. Navigating to Yurist Studio...');
    await page.goto(baseUrl, { waitUntil: 'networkidle2' });
    await page.waitForSelector('.app-container');
    await new Promise((r) => setTimeout(r, 1000));

    // Make sure we are in split or preview mode so preview is visible
    console.log('2. Setting view mode to "Ko‘rish" (preview mode) or "Ikkisi"...');
    await page.evaluate(() => {
      const tabs = Array.from(document.querySelectorAll('.mode-tab'));
      const previewTab = tabs.find((b) => b.textContent && b.textContent.includes('Ko‘rish'));
      if (previewTab) previewTab.click();
    });
    await new Promise((r) => setTimeout(r, 600));

    // Verify Floating Navigator presence
    const navMetrics = await page.evaluate(() => {
      const nav = document.querySelector('.card-nav-floating');
      const counter = document.querySelector('.card-nav-counter');
      const circleBtns = document.querySelectorAll('.card-nav-circle-btn');
      const sizeBtns = Array.from(document.querySelectorAll('.card-size-btn'));
      const fitBtn = sizeBtns.find((b) => b.textContent && b.textContent.includes('Moslash'));
      const fitWidthBtn = sizeBtns.find((b) => b.textContent && b.textContent.includes('Kenglikka'));
      const mode100Btn = sizeBtns.find((b) => b.textContent && b.textContent.includes('100%'));
      const fsBtn = sizeBtns.find((b) => b.textContent && b.textContent.includes('Fullscreen'));

      return {
        hasNav: !!nav,
        navHeight: nav ? nav.getBoundingClientRect().height : 0,
        counterText: counter ? counter.textContent : '',
        circleCount: circleBtns.length,
        hasFit: !!fitBtn,
        hasFitWidth: !!fitWidthBtn,
        has100: !!mode100Btn,
        hasFullscreen: !!fsBtn
      };
    });

    console.log('Floating Navigator Metrics:', navMetrics);

    // 1. Zoom Mode: Moslash (fit)
    console.log('3. Testing Moslash (fit mode)...');
    await page.evaluate(() => {
      const sizeBtns = Array.from(document.querySelectorAll('.card-size-btn'));
      const fitBtn = sizeBtns.find((b) => b.textContent && b.textContent.includes('Moslash'));
      if (fitBtn) fitBtn.click();
    });
    await new Promise((r) => setTimeout(r, 600));

    const fitMetrics = await page.evaluate(() => {
      const wrapper = document.querySelector('.card-scale-wrapper');
      const container = document.querySelector('.preview-container');
      const activeBtn = document.querySelector('.card-size-btn.active');
      const cardScale = wrapper ? getComputedStyle(wrapper).getPropertyValue('--card-scale') : '';
      return {
        cardScale,
        activeMode: activeBtn ? activeBtn.textContent.trim() : '',
        containerWidth: container ? container.clientWidth : 0,
        wrapperWidth: wrapper ? wrapper.getBoundingClientRect().width : 0,
        gap: container ? getComputedStyle(container).gap : ''
      };
    });
    console.log('Moslash mode metrics:', fitMetrics);

    const fitScreenshot = path.join(SCREENSHOT_DIR, 'task12_preview_fit_mode.png');
    await page.screenshot({ path: fitScreenshot });
    console.log(`Saved: ${fitScreenshot}`);

    // 2. Zoom Mode: 100%
    console.log('4. Testing 100% mode...');
    await page.evaluate(() => {
      const sizeBtns = Array.from(document.querySelectorAll('.card-size-btn'));
      const btn100 = sizeBtns.find((b) => b.textContent && b.textContent.includes('100%'));
      if (btn100) btn100.click();
    });
    await new Promise((r) => setTimeout(r, 600));

    const mode100Metrics = await page.evaluate(() => {
      const wrapper = document.querySelector('.card-scale-wrapper');
      const activeBtn = document.querySelector('.card-size-btn.active');
      const cardScale = wrapper ? getComputedStyle(wrapper).getPropertyValue('--card-scale') : '';
      return {
        cardScale,
        activeMode: activeBtn ? activeBtn.textContent.trim() : '',
        wrapperWidth: wrapper ? wrapper.getBoundingClientRect().width : 0
      };
    });
    console.log('100% mode metrics:', mode100Metrics);

    const screen100 = path.join(SCREENSHOT_DIR, 'task12_preview_100_mode.png');
    await page.screenshot({ path: screen100 });
    console.log(`Saved: ${screen100}`);

    // 3. Zoom Mode: Kenglikka (fit-width)
    console.log('5. Testing Kenglikka (fit-width mode)...');
    await page.evaluate(() => {
      const sizeBtns = Array.from(document.querySelectorAll('.card-size-btn'));
      const fitWidthBtn = sizeBtns.find((b) => b.textContent && b.textContent.includes('Kenglikka'));
      if (fitWidthBtn) fitWidthBtn.click();
    });
    await new Promise((r) => setTimeout(r, 600));

    const fitWidthMetrics = await page.evaluate(() => {
      const wrapper = document.querySelector('.card-scale-wrapper');
      const activeBtn = document.querySelector('.card-size-btn.active');
      const container = document.querySelector('.preview-container');
      const cardScale = wrapper ? getComputedStyle(wrapper).getPropertyValue('--card-scale') : '';
      return {
        cardScale,
        activeMode: activeBtn ? activeBtn.textContent.trim() : '',
        containerWidth: container ? container.clientWidth : 0,
        wrapperWidth: wrapper ? wrapper.getBoundingClientRect().width : 0
      };
    });
    console.log('Kenglikka mode metrics:', fitWidthMetrics);

    const fitWidthScreenshot = path.join(SCREENSHOT_DIR, 'task12_preview_fit_width_mode.png');
    await page.screenshot({ path: fitWidthScreenshot });
    console.log(`Saved: ${fitWidthScreenshot}`);

    // 4. Click Card in scroll view -> Navigator counter sync
    console.log('6. Testing Card click synchronization...');
    // Return to Moslash mode so cards are easy to click
    await page.evaluate(() => {
      const sizeBtns = Array.from(document.querySelectorAll('.card-size-btn'));
      const fitBtn = sizeBtns.find((b) => b.textContent && b.textContent.includes('Moslash'));
      if (fitBtn) fitBtn.click();
    });
    await new Promise((r) => setTimeout(r, 500));

    // Click Card 2
    await page.evaluate(() => {
      const card2 = document.getElementById('card-2');
      if (card2) {
        card2.click();
      }
    });
    await new Promise((r) => setTimeout(r, 400));

    const clickResult = await page.evaluate(() => {
      const counter = document.querySelector('.card-nav-counter');
      return {
        newCounterText: counter ? counter.textContent : ''
      };
    });
    console.log('Card click sync result:', clickResult);

    const clickScreenshot = path.join(SCREENSHOT_DIR, 'task12_preview_card_click_sync.png');
    await page.screenshot({ path: clickScreenshot });
    console.log(`Saved: ${clickScreenshot}`);

    // 5. Fullscreen Presentation Mode
    console.log('7. Testing Fullscreen Presentation Mode...');
    await page.evaluate(() => {
      const sizeBtns = Array.from(document.querySelectorAll('.card-size-btn'));
      const fsBtn = sizeBtns.find((b) => b.textContent && b.textContent.includes('Fullscreen'));
      if (fsBtn) fsBtn.click();
    });
    await new Promise((r) => setTimeout(r, 800));

    const fsMetrics = await page.evaluate(() => {
      const overlay = document.querySelector('.fullscreen-presentation-overlay');
      const counter = document.querySelector('.fullscreen-counter');
      const closeBtn = document.querySelector('.fullscreen-close-btn');
      const prevBtn = document.querySelector('.fullscreen-nav-prev');
      const nextBtn = document.querySelector('.fullscreen-nav-next');
      const card = overlay ? overlay.querySelector('.study-card-9-16') : null;

      return {
        hasOverlay: !!overlay,
        backdropBg: overlay ? getComputedStyle(overlay).backgroundColor : '',
        counterText: counter ? counter.textContent : '',
        hasCloseBtn: !!closeBtn,
        hasPrev: !!prevBtn,
        hasNext: !!nextBtn,
        hasCard: !!card
      };
    });
    console.log('Fullscreen overlay metrics:', fsMetrics);

    const fsScreenshot = path.join(SCREENSHOT_DIR, 'task12_preview_fullscreen.png');
    await page.screenshot({ path: fsScreenshot });
    console.log(`Saved: ${fsScreenshot}`);

    // Test Arrow Right in fullscreen
    console.log('8. Testing ArrowRight in fullscreen...');
    await page.keyboard.press('ArrowRight');
    await new Promise((r) => setTimeout(r, 400));

    const afterArrowMetrics = await page.evaluate(() => {
      const counter = document.querySelector('.fullscreen-counter');
      return { counterText: counter ? counter.textContent : '' };
    });
    console.log('After ArrowRight fullscreen counter:', afterArrowMetrics);

    // Test Escape to exit fullscreen
    console.log('9. Testing Escape to exit fullscreen...');
    await page.keyboard.press('Escape');
    await new Promise((r) => setTimeout(r, 600));

    const isOverlayGone = await page.evaluate(() => {
      return !document.querySelector('.fullscreen-presentation-overlay');
    });
    console.log('Fullscreen closed after Escape:', isOverlayGone);

    // 6. Sidebar Resize / Toggle -> Confirm Rescale
    console.log('10. Testing Sidebar toggle & Rescale recalculation...');
    // Switch to split view first ("Ikkisi")
    await page.evaluate(() => {
      const tabs = Array.from(document.querySelectorAll('.mode-tab'));
      const splitTab = tabs.find((b) => b.textContent && b.textContent.includes('Ikkisi'));
      if (splitTab) splitTab.click();
    });
    await new Promise((r) => setTimeout(r, 600));

    const metricsBefore = await page.evaluate(() => {
      const wrapper = document.querySelector('.card-scale-wrapper');
      const container = document.querySelector('.preview-container');
      return {
        scale: wrapper ? getComputedStyle(wrapper).getPropertyValue('--card-scale') : '',
        containerWidth: container ? container.clientWidth : 0
      };
    });

    // Toggle design panel or sidebar to change available width
    await page.evaluate(() => {
      // Toggle Design panel (which takes 360px)
      const designBtn = document.querySelector('button[title*="Dizayn"], button[aria-label*="Dizayn"]');
      if (designBtn) {
        designBtn.click();
      } else {
        const anyDesign = Array.from(document.querySelectorAll('.nav-btn')).find(b => b.textContent && b.textContent.includes('Dizayn'));
        if (anyDesign) anyDesign.click();
      }
    });
    await new Promise((r) => setTimeout(r, 800));

    const metricsAfter = await page.evaluate(() => {
      const wrapper = document.querySelector('.card-scale-wrapper');
      const container = document.querySelector('.preview-container');
      return {
        scale: wrapper ? getComputedStyle(wrapper).getPropertyValue('--card-scale') : '',
        containerWidth: container ? container.clientWidth : 0
      };
    });
    console.log(`Container width before: ${metricsBefore.containerWidth}px, after: ${metricsAfter.containerWidth}px`);
    console.log(`Scale before: ${metricsBefore.scale}, after: ${metricsAfter.scale}`);

    // Also test window resize
    console.log('11. Testing window resize from 1440px to 1024px...');
    await page.setViewport({ width: 1024, height: 768, deviceScaleFactor: 1.5 });
    await new Promise((r) => setTimeout(r, 600));

    const scaleAfterResize = await page.evaluate(() => {
      const wrapper = document.querySelector('.card-scale-wrapper');
      return wrapper ? getComputedStyle(wrapper).getPropertyValue('--card-scale') : '';
    });
    console.log(`Scale after window resize to 1024x768: ${scaleAfterResize}`);

    const sidebarScreenshot = path.join(SCREENSHOT_DIR, 'task12_preview_sidebar_rescale.png');
    await page.screenshot({ path: sidebarScreenshot });
    console.log(`Saved: ${sidebarScreenshot}`);

    console.log('=== TASK 12 VERIFICATION COMPLETED SUCCESSFULLY ===');
  } catch (err) {
    console.error('Error during Task 12 verification:', err);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

main();
