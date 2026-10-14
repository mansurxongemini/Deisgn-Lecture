import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import puppeteer, { type Browser } from 'puppeteer-core';

describe('TASK 12 / FIX-3: PREVIEW WORKSPACE COMPREHENSIVE SUITE', () => {
  const previewCssPath = path.resolve(process.cwd(), 'src/components/preview/preview.css');
  const previewComponentPath = path.resolve(process.cwd(), 'src/components/preview/DocumentPreview.tsx');

  let browser: Browser | null = null;
  let testUrl = 'http://localhost:5173?mode=cards';
  let internalServer: any = null;

  beforeAll(async () => {
    try {
      const res = await fetch('http://localhost:5173');
      if (!res.ok) throw new Error('Dev server not running');
    } catch {
      const { createServer } = await import('vite');
      internalServer = await createServer({ server: { port: 5184 } });
      await internalServer.listen();
      testUrl = 'http://localhost:5184?mode=cards';
    }

    browser = await puppeteer.launch({
      executablePath: '/bin/google-chrome',
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
  }, 25000);

  afterAll(async () => {
    if (browser) await browser.close();
    if (internalServer) await internalServer.close();
  });

  // ==========================================================================
  // PART A: LIGHTWEIGHT STATIC SMOKE CHECKS (Preserved for Source Integrity)
  // ==========================================================================
  describe('Part A: Static Smoke Checks (Source Text Patterns)', () => {
    it('1. preview.css defines neutral workspace background and 32px card gaps', () => {
      const css = fs.readFileSync(previewCssPath, 'utf8');

      // Neutral background and centered items with var(--space-8) gap (32px)
      expect(css).toMatch(/\.preview-container\s*\{[^}]*background:\s*var\(--bg\);/);
      expect(css).toMatch(/\.preview-container\s*\{[^}]*gap:\s*var\(--space-8\);/);
      expect(css).toMatch(/\.preview-container\s*\{[^}]*align-items:\s*center;/);
    });

    it('2. Floating navigator has frosted pill, 40px tall, circle buttons, counter, zoom modes and navy pill active', () => {
      const css = fs.readFileSync(previewCssPath, 'utf8');
      const tsx = fs.readFileSync(previewComponentPath, 'utf8');

      // 40px frosted white pill with backdrop-filter blur 8px
      expect(css).toMatch(/\.card-nav-floating\s*\{[^}]*height:\s*40px;/);
      expect(css).toMatch(/\.card-nav-floating\s*\{[^}]*backdrop-filter:\s*blur\(8px\);/);
      expect(css).toMatch(/\.card-nav-floating\s*\{[^}]*border-radius:\s*var\(--radius-pill\);/);

      // Prev / Next circle buttons (28px round buttons)
      expect(css).toMatch(/\.card-nav-circle-btn\s*\{[^}]*width:\s*28px;/);
      expect(css).toMatch(/\.card-nav-circle-btn\s*\{[^}]*border-radius:\s*50%;/);

      // Active mode = navy pill
      expect(css).toMatch(/\.card-size-btn\.active\s*\{[^}]*background:\s*var\(--accent-navy,\s*var\(--accent\)\);/);

      // JSX elements present in navigator
      expect(tsx).toContain('className="card-nav-circle-btn"');
      expect(tsx).toContain('{activeCardIndex}/{cards.length} karta');
      expect(tsx).toMatch(/>\s*Moslash\s*</);
      expect(tsx).toMatch(/>\s*100%\s*</);
      expect(tsx).toMatch(/>\s*Kenglikka\s*</);
      expect(tsx).toContain('Fullscreen');
    });

    it('3. Scaling recalculates for fit, 100%, and fit-width (Kenglikka) modes', () => {
      const tsx = fs.readFileSync(previewComponentPath, 'utf8');

      // Scale mode type supports all 3 modes
      expect(tsx).toContain("'fit' | '100%' | 'fit-width'");

      // Moslash computes whole card visible (Math.min(scaleW, scaleH))
      expect(tsx).toContain('const bestFit = Math.min(scaleW, scaleH);');

      // Kenglikka computes width to fill available space
      expect(tsx).toContain('const bestWidthScale = (availableW - horizontalPad) / 1080;');

      // 100% mode maintains 1.0
      expect(tsx).toContain("scaleMode === '100%' ? 1.0 :");

      // ResizeObserver watches container and parent for pane/sidebar resizes
      expect(tsx).toContain('new ResizeObserver');
    });

    it('4. Fullscreen presentation has dark backdrop, centered card, topbar counter/close, and keyboard nav', () => {
      const css = fs.readFileSync(previewCssPath, 'utf8');
      const tsx = fs.readFileSync(previewComponentPath, 'utf8');

      // Dark backdrop with blur
      expect(css).toMatch(/\.fullscreen-presentation-overlay\s*\{[^}]*background:\s*rgba\(10,\s*15,\s*25,\s*0\.96\);/);
      expect(css).toMatch(/\.fullscreen-presentation-overlay\s*\{[^}]*backdrop-filter:\s*blur\(12px\);/);

      // Centered card container
      expect(css).toMatch(/\.fullscreen-card-container\s*\{[^}]*display:\s*flex;/);
      expect(css).toMatch(/\.fullscreen-card-container\s*\{[^}]*align-items:\s*center;/);
      expect(css).toMatch(/\.fullscreen-card-container\s*\{[^}]*justify-content:\s*center;/);

      // Topbar with top-left counter and top-right close
      expect(css).toMatch(/\.fullscreen-topbar\s*\{[^}]*justify-content:\s*space-between;/);

      // Keyboard handlers (Escape, ArrowLeft, ArrowRight)
      expect(tsx).toContain("e.key === 'Escape'");
      expect(tsx).toContain("e.key === 'ArrowRight'");
      expect(tsx).toContain("e.key === 'ArrowLeft'");
    });

    it('5. Clicking any card in scroll view immediately updates navigator counter', () => {
      const tsx = fs.readFileSync(previewComponentPath, 'utf8');

      // Card wrappers have onClick calling setActiveCardIndex
      const occurrences = (tsx.match(/setActiveCardIndex\(card\.cardIndex\)/g) || []).length;
      expect(occurrences).toBeGreaterThanOrEqual(3); // cover, toc, content cards
    });
  });

  // ==========================================================================
  // PART B: REAL DOM RENDERING & BEHAVIORAL TESTS (Headless Chrome)
  // ==========================================================================
  describe('Part B: Real DOM Rendering & Behavioral Tests', () => {
    it('1. Real DOM: preview-container renders with neutral background, vertical column layout, and 32px gap', async () => {
      expect(browser).not.toBeNull();
      const page = await browser!.newPage();
      await page.setViewport({ width: 1440, height: 900 });
      await page.goto(testUrl, { waitUntil: 'networkidle0' });
      await page.waitForSelector('.preview-container', { timeout: 10000 });

      const styles = await page.evaluate(() => {
        const el = document.querySelector('.preview-container');
        if (!el) return null;
        const cs = window.getComputedStyle(el);
        return {
          display: cs.display,
          flexDirection: cs.flexDirection,
          alignItems: cs.alignItems,
          gap: cs.gap
        };
      });

      expect(styles).not.toBeNull();
      expect(styles!.display).toBe('flex');
      expect(styles!.flexDirection).toBe('column');
      expect(styles!.alignItems).toBe('center');
      expect(styles!.gap).toBe('32px');

      await page.close();
    }, 25000);

    it('2. Real DOM: Floating navigator renders 40px frosted pill, buttons, and strictly 1/N karta on initial mount (NO DESYNC)', async () => {
      expect(browser).not.toBeNull();
      const page = await browser!.newPage();
      await page.goto(testUrl, { waitUntil: 'networkidle0' });
      await page.waitForSelector('.card-nav-floating', { timeout: 10000 });

      // Check strictly on fresh mount before any interaction: MUST be 1/N
      const freshMountText = await page.$eval('.card-nav-counter', (el) => el.textContent?.trim() || '');
      expect(freshMountText).toMatch(/^1\/\d+\s*karta$/);

      const multiCardMd = `# Konstitutsiyaviy Huquq Asoslari
muallif: Toshkent Yuridik Instituti
uslub: classic

## 1-Bob. Muqaddima
Asosiy qonun va umumiy prinsiplar.

## 2-Bob. Huquqiy Davlat
Inson manfaatlari har narsadan ustundir.

## 3-Bob. Qonun Ustuvorligi
Davlat organlari qonun doirasida harakat qiladi.
`;
      await page.evaluate((text) => {
        const textarea = document.querySelector('.editor-textarea') as HTMLTextAreaElement | null;
        if (textarea) {
          const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value')!.set!;
          nativeSetter.call(textarea, text);
          textarea.dispatchEvent(new Event('input', { bubbles: true }));
          textarea.dispatchEvent(new Event('change', { bubbles: true }));
        }
      }, multiCardMd);

      await page.waitForSelector('.study-card-9-16', { timeout: 10000 });
      await new Promise((r) => setTimeout(r, 600));

      const navInfo = await page.evaluate(() => {
        const nav = document.querySelector('.card-nav-floating') as HTMLElement | null;
        const counter = document.querySelector('.card-nav-counter') as HTMLElement | null;
        const prevBtn = nav?.querySelector('button[title="Oldingi karta"]') as HTMLButtonElement | null;
        const nextBtn = nav?.querySelector('button[title="Keyingi karta"]') as HTMLButtonElement | null;
        const activeBtn = nav?.querySelector('.card-size-btn.active') as HTMLElement | null;
        if (!nav) return null;
        const cs = window.getComputedStyle(nav);

        return {
          height: cs.height,
          borderRadius: cs.borderRadius,
          counterText: counter?.textContent?.trim() || '',
          prevDisabled: prevBtn ? prevBtn.disabled : null,
          nextDisabled: nextBtn ? nextBtn.disabled : null,
          activeModeText: activeBtn?.textContent?.trim() || ''
        };
      });

      expect(navInfo).not.toBeNull();
      expect(navInfo!.height).toBe('40px');
      // Critical check that catches the FIX-2 navigator desync bug:
      // Must be 1/N on initial mount, NEVER 2/N!
      expect(navInfo!.counterText).toMatch(/^1\/\d+\s*karta$/);
      expect(navInfo!.prevDisabled).toBe(true);
      expect(navInfo!.nextDisabled).toBe(false);
      expect(navInfo!.activeModeText).toBe('Moslash');

      await page.close();
    }, 25000);

    it('3. Real DOM: Scaling mode switches between Moslash, 100%, and Kenglikka on user click', async () => {
      expect(browser).not.toBeNull();
      const page = await browser!.newPage();
      await page.setViewport({ width: 1440, height: 900 });
      await page.goto(testUrl, { waitUntil: 'networkidle0' });
      await page.waitForSelector('.card-size-btn', { timeout: 10000 });

      // Click "100%"
      await page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll('.card-size-btn')) as HTMLButtonElement[];
        const btn100 = btns.find((b) => b.textContent?.includes('100%'));
        btn100?.click();
      });
      await new Promise((r) => setTimeout(r, 200));

      const is100Active = await page.evaluate(() => {
        const container = document.querySelector('.preview-container');
        const btns = Array.from(document.querySelectorAll('.card-size-btn'));
        const btn100 = btns.find((b) => b.textContent?.includes('100%'));
        return (
          (container?.classList.contains('mode-100') || container?.classList.contains('mode-100%')) &&
          btn100?.classList.contains('active')
        );
      });
      expect(is100Active).toBe(true);

      // Click "Kenglikka"
      await page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll('.card-size-btn')) as HTMLButtonElement[];
        const btnFitWidth = btns.find((b) => b.textContent?.includes('Kenglikka'));
        btnFitWidth?.click();
      });
      await new Promise((r) => setTimeout(r, 200));

      const isFitWidthActive = await page.evaluate(() => {
        const container = document.querySelector('.preview-container');
        const btns = Array.from(document.querySelectorAll('.card-size-btn'));
        const btn = btns.find((b) => b.textContent?.includes('Kenglikka'));
        return container?.classList.contains('mode-fit-width') && btn?.classList.contains('active');
      });
      expect(isFitWidthActive).toBe(true);

      // Click "Moslash"
      await page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll('.card-size-btn')) as HTMLButtonElement[];
        const btnFit = btns.find((b) => b.textContent?.includes('Moslash'));
        btnFit?.click();
      });
      await new Promise((r) => setTimeout(r, 200));

      const isFitActive = await page.evaluate(() => {
        const container = document.querySelector('.preview-container');
        const btns = Array.from(document.querySelectorAll('.card-size-btn'));
        const btn = btns.find((b) => b.textContent?.includes('Moslash'));
        return container?.classList.contains('mode-fit') && btn?.classList.contains('active');
      });
      expect(isFitActive).toBe(true);

      await page.close();
    }, 25000);

    it('4. Real DOM: Fullscreen presentation opens overlay, handles ArrowRight/ArrowLeft/Escape keyboard nav', async () => {
      expect(browser).not.toBeNull();
      const page = await browser!.newPage();
      await page.setViewport({ width: 1440, height: 900 });
      await page.goto(testUrl, { waitUntil: 'networkidle0' });
      await page.waitForSelector('.card-nav-floating', { timeout: 10000 });

      // Click "Fullscreen" button
      await page.evaluate(() => {
        const fsBtn = Array.from(document.querySelectorAll('button')).find((b) =>
          b.textContent?.includes('Fullscreen')
        );
        fsBtn?.click();
      });

      await page.waitForSelector('.fullscreen-presentation-overlay', { timeout: 5000 });

      const overlayInfo = await page.evaluate(() => {
        const overlay = document.querySelector('.fullscreen-presentation-overlay') as HTMLElement | null;
        const counter = overlay?.querySelector('.fullscreen-counter') as HTMLElement | null;
        if (!overlay) return null;
        const cs = window.getComputedStyle(overlay);
        return {
          display: cs.display,
          counterText: counter?.textContent?.trim() || ''
        };
      });

      expect(overlayInfo).not.toBeNull();
      expect(overlayInfo!.counterText).toMatch(/^01\s*\/\s*\d+$/);

      // Keyboard ArrowRight: next card
      await page.keyboard.press('ArrowRight');
      await new Promise((r) => setTimeout(r, 200));

      const counterAfterNext = await page.$eval('.fullscreen-counter', (el) => el.textContent?.trim() || '');
      expect(counterAfterNext).toMatch(/^02\s*\/\s*\d+$/);

      // Keyboard ArrowLeft: previous card
      await page.keyboard.press('ArrowLeft');
      await new Promise((r) => setTimeout(r, 200));

      const counterAfterPrev = await page.$eval('.fullscreen-counter', (el) => el.textContent?.trim() || '');
      expect(counterAfterPrev).toMatch(/^01\s*\/\s*\d+$/);

      // Keyboard Escape: exit fullscreen
      await page.keyboard.press('Escape');
      await new Promise((r) => setTimeout(r, 200));

      const overlayExists = await page.evaluate(() => !!document.querySelector('.fullscreen-presentation-overlay'));
      expect(overlayExists).toBe(false);

      await page.close();
    }, 25000);

    it('5. Real DOM: Clicking any card in scroll view immediately updates navigator counter', async () => {
      expect(browser).not.toBeNull();
      const page = await browser!.newPage();
      await page.setViewport({ width: 1440, height: 900 });
      await page.goto(testUrl, { waitUntil: 'networkidle0' });
      await page.waitForSelector('.card-nav-counter', { timeout: 10000 });

      const samplePath = path.resolve(process.cwd(), 'src/samples/constitutional_law.md');
      const multiCardMd = fs.readFileSync(samplePath, 'utf8');
      await page.evaluate((text) => {
        const textarea = document.querySelector('.editor-textarea') as HTMLTextAreaElement | null;
        if (textarea) {
          const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value')!.set!;
          nativeSetter.call(textarea, text);
          textarea.dispatchEvent(new Event('input', { bubbles: true }));
          textarea.dispatchEvent(new Event('change', { bubbles: true }));
        }
      }, multiCardMd);

      await page.waitForSelector('.study-card-9-16', { timeout: 10000 });
      await new Promise((r) => setTimeout(r, 600));

      // Ensure at least 3 cards are present
      await page.waitForSelector('#card-2', { timeout: 10000 });
      await page.waitForSelector('#card-3', { timeout: 10000 });

      // Initial mount check
      const initialText = await page.$eval('.card-nav-counter', (el) => el.textContent?.trim() || '');
      expect(initialText).toMatch(/^1\/\d+\s*karta$/);

      // Click card 2
      await page.evaluate(() => {
        const card2 = document.getElementById('card-2');
        card2?.click();
      });
      await new Promise((r) => setTimeout(r, 200));

      const afterCard2Click = await page.$eval('.card-nav-counter', (el) => el.textContent?.trim() || '');
      expect(afterCard2Click).toMatch(/^2\/\d+\s*karta$/);

      // Click card 3
      await page.evaluate(() => {
        const card3 = document.getElementById('card-3');
        card3?.click();
      });
      await new Promise((r) => setTimeout(r, 200));

      const afterCard3Click = await page.$eval('.card-nav-counter', (el) => el.textContent?.trim() || '');
      expect(afterCard3Click).toMatch(/^3\/\d+\s*karta$/);

      // Click previous circle button in floating navigator
      await page.evaluate(() => {
        const prevBtn = document.querySelector('.card-nav-circle-btn[title="Oldingi karta"]') as HTMLButtonElement | null;
        prevBtn?.click();
      });
      await new Promise((r) => setTimeout(r, 200));

      const afterPrevBtnClick = await page.$eval('.card-nav-counter', (el) => el.textContent?.trim() || '');
      expect(afterPrevBtnClick).toMatch(/^2\/\d+\s*karta$/);

      await page.close();
    }, 25000);

    it('6. Real DOM: Dominant visible card determines active card index during scroll', async () => {
      expect(browser).not.toBeNull();
      const page = await browser!.newPage();
      await page.setViewport({ width: 1440, height: 900 });
      await page.goto(testUrl, { waitUntil: 'networkidle0' });
      await page.waitForSelector('.card-nav-counter', { timeout: 10000 });
      await page.waitForSelector('#card-2', { timeout: 10000 });

      // Initial mount check
      const initialText = await page.$eval('.card-nav-counter', (el) => el.textContent?.trim() || '');
      expect(initialText).toMatch(/^1\/\d+\s*karta$/);

      // Slight scroll (50px) where card 1 is still dominant
      await page.evaluate(() => {
        const container = document.querySelector('.preview-container');
        if (container) {
          container.scrollTop = 50;
          container.dispatchEvent(new Event('scroll'));
        }
      });
      await new Promise((r) => setTimeout(r, 200));

      const slightScrollText = await page.$eval('.card-nav-counter', (el) => el.textContent?.trim() || '');
      expect(slightScrollText).toBe(initialText); // Still 1/N!

      // Scroll to card 2 dominant position
      await page.evaluate(() => {
        const container = document.querySelector('.preview-container');
        const card2 = document.getElementById('card-2');
        if (container && card2) {
          container.scrollTop = (card2 as HTMLElement).offsetTop - 50;
          container.dispatchEvent(new Event('scroll'));
        }
      });
      await new Promise((r) => setTimeout(r, 300));

      const card2ScrollText = await page.$eval('.card-nav-counter', (el) => el.textContent?.trim() || '');
      expect(card2ScrollText).toMatch(/^2\/\d+\s*karta$/);

      // Scroll back to top (0px)
      await page.evaluate(() => {
        const container = document.querySelector('.preview-container');
        if (container) {
          container.scrollTop = 0;
          container.dispatchEvent(new Event('scroll'));
        }
      });
      await new Promise((r) => setTimeout(r, 200));

      const backToTopText = await page.$eval('.card-nav-counter', (el) => el.textContent?.trim() || '');
      expect(backToTopText).toMatch(/^1\/\d+\s*karta$/);

      await page.close();
    }, 25000);
  });
});
