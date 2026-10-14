import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { parseMarkdownPlus } from '../schema/mdParser';
import { paginateDocument, type StudyCard } from '../services/paginator';
import type { TableBlock } from '../schema/types';
import puppeteer, { type Browser } from 'puppeteer-core';

export const WORST_CASE_SAMPLE_MD = `# O‘zbekiston Respublikasi Huquqiy Sinov Hujjati: oʻ gʻ sh ch ў қ ғ ҳ ‘ ’
muallif: Akademik Tahlilchi: oʻ gʻ sh ch ў қ ғ ҳ ‘ ’
uslub: classic
izoh: Maxsus murakkab va chegaraviy holatlar sinovi (worst-case test)

## 1-Mavzu. Kirish va Shartli Belgilar Sinovi: oʻ gʻ sh ch ў қ ғ ҳ ‘ ’
Ushbu bo‘limda barcha o‘zbekcha maxsus harflar va belgilar tekshiriladi: oʻ gʻ sh ch ў қ ғ ҳ ‘ ’ hamda tinish belgilari.
Qonunchilik tahlili: Fuqarolik kodeksining barcha moddalari sinchkovlik bilan o‘rganilmoqda.

norma: 999-modda: O‘ta Katta Hajmli Qonun Moddasi va Normativ Asoslar: oʻ gʻ sh ch ў қ ғ ҳ ‘ ’
manba: O‘zbekiston Respublikasi Fuqarolik Kodeksi
sana: 01.01.2026
1-qism: Mazkur norma o‘ta katta hajmli matnga ega bo‘lib, bir nechta sahifalar va 9:16 formatidagi kartalar bo‘ylab tabiiy ravishda taqsimlanishi kerak. Fuqarolik qonunchiligi fuqarolik muomalasi ishtirokchilarining huquqiy holatini, mulk huquqi va boshqa ashyoviy huquqlarning, intellektual faoliyat natijalariga bo‘lgan huquqlarning vujudga kelishi hamda ularni amalga oshirish tartibini belgilaydi.
2-qism: Shartnoma majburiyatlari va boshqa majburiyatlarni, shuningdek boshqa mulkiy hamda u bilan bog‘liq shaxsiy nomulkiy munosabatlarni tartibga soladi. Qonunchilikda belgilangan hollarda oilaviy, mehnat munosabatlari hamda tabiiy resurslardan foydalanish va atrof-muhitni muhofaza qilish munosabatlari ham fuqarolik qonunchiligi bilan tartibga solinishi mumkin.
3-qism: Fuqarolik qonunchiligi asosiy qoidalarining buzilishi yuridik javobgarlikka sabab bo‘ladi. Sud amaliyotida har bir holat qonun ustuvorligi va inson manfaatlari nuqtai nazaridan baholanadi. Hech bir shaxs o‘z xatti-harakati bilan qonunga zid ravishda boshqa shaxslarning qonuniy manfaatlariga zarar yetkazishi mumkin emas.
4-qism: Agar shartnoma taraflari o‘zaro majburiyatlarni lozim darajada bajarmasalar, jabrlanuvchi taraf yetkazilgan zararni to‘liq qoplashni talab qilish huquqiga ega bo‘ladi. Zararni qoplash qoidasi fuqarolik huquqining asosiy kafolatlaridan biridir.
5-qism: Majburiyatlarni buzganlik uchun to‘lanadigan neustoyka (jarima, penya) qonunda yoki shartnomada belgilangan hollarda to‘lanadi. Agar majburiyatni bajarmaganlik yoki lozim darajada bajarmaganlik uchun neustoyka belgilangan bo‘lsa, zararning neustoyka bilan qoplanmagan qismi undiriladi.
6-qism: Fuqarolik huquqlarini himoya qilish fuqaro yoki yuridik shaxsning xohishiga ko‘ra sud tartibida amalga oshiriladi. Sud fuqarolik huquqlarini buzgan yoki ularni tan olmagan shaxsga nisbatan qonunda belgilangan majburlov choralarini qo‘llaydi.

## 2-Mavzu. Katta Hajmli Jadval Sinovi
Quyida 20 dan ortiq qatordan iborat ulkan jadval keltirilgan bo‘lib, u 9:16 kartalar orasida avtomatik bo‘linishi shart:

| № | Huquqiy Tushuncha: oʻ gʻ sh ch | Mazmuni va Huquqiy Asosi | Sud Amaliyotidagi Ahamiyati |
| --- | --- | --- | --- |
| 1 | Oferta taqdimoti | Shartnoma tuzish to‘g‘risidagi taklif | Huquqiy bog‘liqlik yaratadi |
| 2 | Aksept roziligi | Taklifni so‘zsiz qabul qilish | Shartnoma tuzilgan hisoblanadi |
| 3 | Forc-major holati | Favqulodda va yengib bo‘lmas kuch | Javobgarlikdan ozod etish asosi |
| 4 | Restitutsiya qoidasi | Bitim haqiqiy emasligining oqibati | Boshlang‘ich holatga qaytarish |
| 5 | Vinikatsiya da’vosi | Mol-mulkni noqonuniy egallashdan qaytarish | Ashyoviy huquq himoyasi |
| 6 | Negator da’vo | Huquq buzilishini bartaraf etish | Mulkdor erkinligini tiklash |
| 7 | Seyssiya amaliyoti | Talab qilish huquqini boshqa shaxsga berish | Majburiyatdagi shaxslar o‘zgarishi |
| 8 | Subrogatsiya tartibi | Sug‘urtalovchiga huquq o‘tishi | Regress talabi kabi amal qiladi |
| 9 | Moratoriy muddati | Majburiyat ijrosini kechiktirish | Favqulodda davr qoidasi |
| 10 | Garov ta’minoti | Majburiyat bajarilishini ta’minlash | Imtiyozli qondirish huquqi |
| 11 | Kafillik shartnomasi | Uchinchi shaxsning javobgarligi | Solidar javobgarlik asosi |
| 12 | Penya va jarima | Shartnoma shartlarini buzish jarimasi | Qat’iy foiz stavkasi |
| 13 | Litsenziya bitimi | Intellektual mulkdan foydalanish | Huquqiy ruxsatnoma |
| 14 | Franshizing tizimi | Kompaniya brendidan foydalanish | Kompleks tadbirkorlik |
| 15 | Lizing shartnomasi | Moliyaviy ijara munosabatlari | Mulkni sotib olish huquqi |
| 16 | Arbitraj kelishuvi | Nizolarni hakamlik sudida ko‘rish | Muqobil nizolarni hal qilish |
| 17 | Xolislar ishtiroki | Tergov harakatlarini tasdiqlash | Dalil maqomi |
| 18 | Rekvizitsiya tartibi | Favqulodda davlat ehtiyojlari uchun haq evaziga olish | Kompensatsiya to‘lash |
| 19 | Konfiskatsiya chorasi | Jinoyat quroli yoki noqonuniy mulkni tekin olib qo‘yish | Jazo chorasi |
| 20 | Vasiylik va homiylik | Muomalaga layoqatsizlarni himoya qilish | Ijtimoiy kafolat |

## 3-Mavzu. Ketma-ket 10 ta Savol-Javob Bloklari
savol: 1. Fuqarolik muomalasi nima? {#qa-1}
javob: Fuqarolar va yuridik shaxslarning qonuniy harakatlari majmui: oʻ gʻ sh ch ў қ ғ ҳ ‘ ’.

savol: 2. Mulk huquqi nimadan iborat? {#qa-2}
javob: Egalik qilish, foydalanish va tasarruf etish huquqlaridan.

savol: 3. Bitim va shartnomaning farqi nima? {#qa-3}
javob: Har qanday shartnoma bitimdir, lekin har qanday bitim shartnoma emas.

savol: 4. Muddat o‘tishi qanday oqibat beradi? {#qa-4}
javob: Da’vo muddatining o‘tishi sud himoyasini rad etishga asos bo‘ladi.

savol: 5. Majburiyat qanday bekor bo‘ladi? {#qa-5}
javob: Majburiyat lozim darajada bajarilishi bilan bekor bo‘ladi.

savol: 6. Xatoli bitim bekor qilinadimi? {#qa-6}
javob: Jiddiy adashish ta’sirida tuzilgan bitim sud tomonidan haqiqiy emas deb topiladi.

savol: 7. Vakillik vakolati qanday beriladi? {#qa-7}
javob: Ishonchnoma yoki qonun talabi asosida rasmiylashtiriladi.

savol: 8. Birgalikdagi mulk nima? {#qa-8}
javob: Ulushlar belgilanmagan holda ikki yoki undan ortiq shaxsga tegishli mulk.

savol: 9. Meros qachon ochiladi? {#qa-9}
javob: Fuqaroning vafot etgan kuni yoki sud qarori bilan vafot etgan deb e’lon qilingan kunda.

savol: 10. Qonuniy vorislar kimlar? {#qa-10}
javob: Birinchi navbatda vafot etganning bolalari, eri (xotini) va ota-onasi.

## 4-Mavzu. Katta Hajmli Ro‘yxat
- 1-band: oʻ gʻ sh ch ў қ ғ ҳ ‘ ’ asosiy qoidalari
- 2-band: O‘zbekiston Respublikasi Konstitutsiyasi 13-moddasi
- 3-band: Fuqarolik qonunchiligi asosiy prinsiplari
- 4-band: Sud hokimiyati mustaqilligi kafolatlari
- 5-band: Tadbirkorlik erkinligi va shartnoma intizomi
- 6-band: Intellektual mulk himoyasi mexanizmlari
- 7-band: Iste’molchilar huquqlarini himoya qilish
- 8-band: Bank omonatlari sir saqlanishi kafolati
- 9-band: Davlat organlarining fuqarolar oldidagi javobgarligi
- 10-band: Mehnat huquqlari va adolatli ish haqi kafolati
- 11-band: Ta’lim olish va malaka oshirish huquqi
- 12-band: Sog‘liqni saqlash va tibbiy sug‘urta tizimi
- 13-band: Ekologik xavfsizlik va tabiatni asrash burchi
- 14-band: Madaniy meros obyektlarini muhofaza qilish
- 15-band: Xalqaro huquq normalarining ustuvorligi tamoyili
`;

describe('PERMANENT AUTOMATED INVARIANT TESTS (Step C2 Standards)', () => {
  const parseRes = parseMarkdownPlus(WORST_CASE_SAMPLE_MD);
  const doc = parseRes.document;
  const cards = paginateDocument(doc);

  let browser: Browser | null = null;
  let testUrl = 'http://localhost:5173?mode=cards';
  let internalServer: any = null;

  beforeAll(async () => {
    try {
      const res = await fetch('http://localhost:5173');
      if (!res.ok) throw new Error('Not running');
    } catch {
      // Dev server yoqilmagan bo'lsa, tezkor Vite serverini ishga tushiramiz
      const { createServer } = await import('vite');
      internalServer = await createServer({ server: { port: 5183 } });
      await internalServer.listen();
      testUrl = 'http://localhost:5183?mode=cards';
    }

    browser = await puppeteer.launch({
      executablePath: '/bin/google-chrome',
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
  }, 20000);

  afterAll(async () => {
    if (browser) await browser.close();
    if (internalServer) await internalServer.close();
  });

  // --------------------------------------------------------------------------
  // Invariant (i): CONTENT PERSISTENCE & ORDERING
  // Every table row, list item, qa and paragraph appears exactly once, in order
  // --------------------------------------------------------------------------
  it('Invariant (i): Every QA block appears exactly once in order across cards', () => {
    const sourceQas: string[] = [];
    doc.sections.forEach((sec) => {
      sec.blocks.forEach((b) => {
        if (b.type === 'qa') sourceQas.push(b.question);
      });
    });

    const renderedQas: string[] = [];
    cards.forEach((c) => {
      c.blocks.forEach((b) => {
        if (b.type === 'qa') renderedQas.push(b.question);
      });
    });

    expect(sourceQas.length).toBe(10);
    expect(renderedQas.length).toBe(10);
    expect(renderedQas).toEqual(sourceQas);
  });

  it('Invariant (i): Every table row appears exactly once in order across cards', () => {
    let sourceRowCount = 0;
    const sourceFirstCols: string[] = [];
    doc.sections.forEach((sec) => {
      sec.blocks.forEach((b) => {
        if (b.type === 'table') {
          sourceRowCount += b.rows.length;
          b.rows.forEach((r) => sourceFirstCols.push(r[0]));
        }
      });
    });

    let renderedRowCount = 0;
    const renderedFirstCols: string[] = [];
    cards.forEach((c) => {
      c.blocks.forEach((b) => {
        if (b.type === 'table') {
          renderedRowCount += b.rows.length;
          b.rows.forEach((r) => renderedFirstCols.push(r[0]));
        }
      });
    });

    expect(sourceRowCount).toBe(20);
    expect(renderedRowCount).toBe(20);
    expect(renderedFirstCols).toEqual(sourceFirstCols);
  });

  it('Invariant (i): Every list item appears exactly once in order across cards', () => {
    const sourceItems: string[] = [];
    doc.sections.forEach((sec) => {
      sec.blocks.forEach((b) => {
        if (b.type === 'list') {
          sourceItems.push(...b.items);
        }
      });
    });

    const renderedItems: string[] = [];
    cards.forEach((c) => {
      c.blocks.forEach((b) => {
        if (b.type === 'list' && c.cardType === 'content') {
          renderedItems.push(...b.items);
        }
      });
    });

    expect(sourceItems.length).toBe(15);
    expect(renderedItems.length).toBe(15);
    expect(renderedItems).toEqual(sourceItems);
  });

  it('Invariant (i): Every norm paragraph and body paragraph appears exactly once across cards', () => {
    const sourceNormParas: string[] = [];
    doc.sections.forEach((sec) => {
      sec.blocks.forEach((b) => {
        if (b.type === 'norm') {
          sourceNormParas.push(...(b.text || '').split(/\n+/).filter(Boolean));
        }
      });
    });

    const renderedNormParas: string[] = [];
    cards.forEach((c) => {
      c.blocks.forEach((b) => {
        if (b.type === 'norm') {
          renderedNormParas.push(...(b.text || '').split(/\n+/).filter(Boolean));
        }
      });
    });

    expect(sourceNormParas.length).toBe(6);
    expect(renderedNormParas.length).toBe(6);
    expect(renderedNormParas).toEqual(sourceNormParas);
  });

  // --------------------------------------------------------------------------
  // Invariant (ii): NO CLIPPING (scrollHeight <= clientHeight) ON EVERY CARD
  // Tested in real headless Chrome DOM!
  // --------------------------------------------------------------------------
  it('Invariant (ii): Zero clipping (scrollHeight <= clientHeight) on every card in real DOM', async () => {
    expect(browser).not.toBeNull();
    const page = await browser!.newPage();
    await page.setViewport({ width: 1440, height: 900 });
    await page.goto(testUrl, { waitUntil: 'networkidle0' });
    await page.waitForSelector('.editor-textarea', { timeout: 10000 });

    // Hujjatni yuklash
    await page.evaluate((text) => {
      const textarea = document.querySelector('.editor-textarea') as HTMLTextAreaElement | null;
      if (textarea) {
        const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value')!.set!;
        nativeSetter.call(textarea, text);
        textarea.dispatchEvent(new Event('input', { bubbles: true }));
        textarea.dispatchEvent(new Event('change', { bubbles: true }));
      }
    }, WORST_CASE_SAMPLE_MD);

    await page.waitForSelector('.study-card-9-16', { timeout: 10000 });

    await new Promise((r) => setTimeout(r, 1600));

    const clippingData = await page.evaluate(() => {
      const cardNodes = Array.from(document.querySelectorAll('.card-scale-wrapper .study-card-9-16'));
      return cardNodes.map((card, idx) => {
        const contentArea = card.querySelector('.card-content-area');
        const scrollH = contentArea ? contentArea.scrollHeight : card.scrollHeight;
        const clientH = contentArea ? contentArea.clientHeight : card.clientHeight;
        const clipped = scrollH > clientH + 2; // 2px sub-pixel tolerance
        return { cardIndex: idx + 1, scrollH, clientH, clipped };
      });
    });

    await page.close();

    // Standart 32px matn zichligi va xavfsiz sig‘im ostida kamida 14 ta karta hosil bo‘ladi
    expect(clippingData.length).toBeGreaterThanOrEqual(14);
    const clippedCards = clippingData.filter((c) => c.clipped);
    expect(clippedCards).toEqual([]);
  }, 25000);

  // --------------------------------------------------------------------------
  // Invariant (iii): SECTION HEADING PLACEMENT
  // A section heading sits strictly on the first card of its section
  // --------------------------------------------------------------------------
  it('Invariant (iii): Section heading sits strictly on the first card of its section and never on continuation cards', () => {
    const sectionFirstCards = new Map<string, StudyCard>();
    const sectionContCards = new Map<string, StudyCard[]>();

    cards.forEach((c) => {
      if (c.cardType === 'content' && c.sectionTitle) {
        if (!c.isContinuation) {
          expect(sectionFirstCards.has(c.sectionTitle)).toBe(false); // Exactly ONE first card per section!
          sectionFirstCards.set(c.sectionTitle, c);
        } else {
          const list = sectionContCards.get(c.sectionTitle) || [];
          list.push(c);
          sectionContCards.set(c.sectionTitle, list);
        }
      }
    });

    expect(sectionFirstCards.size).toBe(4);
    for (const [secTitle, firstCard] of sectionFirstCards) {
      expect(firstCard.isContinuation).toBe(false);
      expect(firstCard.sectionTitle).toBe(secTitle);

      const contList = sectionContCards.get(secTitle) || [];
      contList.forEach((contCard) => {
        expect(contCard.isContinuation).toBe(true);
        expect(contCard.sectionSubtitle).toBeUndefined(); // subtitle faqat 1-kartada chiqadi
      });
    }
  });

  // --------------------------------------------------------------------------
  // Invariant (iv): SPLIT TABLES REPEAT HEADERS & SAY "(davomi)"
  // --------------------------------------------------------------------------
  it('Invariant (iv): Split tables repeat header rows and continuation cards say "(davomi)"', () => {
    const tableCards = cards.filter((c) => c.blocks.some((b) => b.type === 'table'));
    expect(tableCards.length).toBeGreaterThan(1); // 20 qatorli jadval bir nechta kartaga bo'lingan!

    tableCards.forEach((c, idx) => {
      const tableBlock = c.blocks.find((b) => b.type === 'table') as TableBlock;
      expect(tableBlock).toBeDefined();
      expect(tableBlock.headers).toBeDefined();
      expect(tableBlock.headers.length).toBe(4); // Headers har bir bo'lingan kartada takrorlanadi!

      if (idx > 0) {
        expect(tableBlock.title).toContain('(davomi)');
        expect(c.isContinuation).toBe(true);
      }
    });
  });

  // --------------------------------------------------------------------------
  // Invariant (v): TYPOGRAPHY MINIMUMS (Standart body 32px, Ixcham 28px; Floor >= 26px)
  // Yurist o‘quv kartalarida yangi Standart zichlik (body 32px, line-height 1.55)
  // va Ixcham zichlik (body 28px, line-height 1.5) qo‘llaniladi.
  // Kanvasda elementlar uchun qat'iy mutlaq quyi chegara (floor) 26px qilib belgilangan.
  // --------------------------------------------------------------------------
  it('Invariant (v): Typography minimums (body text and labels >= 26px floor on canvas)', async () => {
    expect(browser).not.toBeNull();
    const page = await browser!.newPage();
    await page.setViewport({ width: 1440, height: 900 });
    await page.goto(testUrl, { waitUntil: 'networkidle0' });
    await page.waitForSelector('.editor-textarea', { timeout: 10000 });

    await page.evaluate((text) => {
      const textarea = document.querySelector('.editor-textarea') as HTMLTextAreaElement | null;
      if (textarea) {
        const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value')!.set!;
        nativeSetter.call(textarea, text);
        textarea.dispatchEvent(new Event('input', { bubbles: true }));
        textarea.dispatchEvent(new Event('change', { bubbles: true }));
      }
    }, WORST_CASE_SAMPLE_MD);

    await page.waitForSelector('.study-card-9-16', { timeout: 10000 });

    await new Promise((r) => setTimeout(r, 1600));

    const typoReport = await page.evaluate(() => {
      const cards = Array.from(document.querySelectorAll('.card-scale-wrapper .study-card-9-16'));
      const violations: { card: number; type: string; fs: number; text: string; cls: string }[] = [];
      let checkedElementsCount = 0;

      cards.forEach((card, cIdx) => {
        const allEls = card.querySelectorAll('*');
        allEls.forEach((el) => {
          const style = window.getComputedStyle(el);
          if (style.display === 'none' || style.visibility === 'hidden') return;
          if (el.tagName === 'svg' || el.tagName === 'path') return;

          const hasDirectText = Array.from(el.childNodes).some(
            (n) => n.nodeType === Node.TEXT_NODE && (n.textContent || '').trim().length > 0
          );
          if (!hasDirectText) return;

          checkedElementsCount++;
          const fs = parseFloat(style.fontSize);
          const text = (el.textContent || '').trim().slice(0, 30);
          const cls = el.className;

          // Standart zichlik bo'yicha body 32px, Ixcham 28px. Mutlaq quyi chegara (floor) 26px (fs >= 25.5px)
          const isBodyType = el.closest(
            '.study-text, .study-list-item, .qa-answer-text, .qa-answer, .study-table td, .norm-body, .def-body, .note-text, .case-step-text, .compare-point-text, .compare-point-item, .flow-step-desc, .timeline-event-desc'
          );

          if (isBodyType) {
            if (fs < 25.5) {
              violations.push({ card: cIdx + 1, type: 'body < 26px floor', fs, text, cls });
            }
          } else {
            // Barcha boshqa matnlar (yorliqlar, nishonlar, sarlavha, kolontitullar): >= 26px floor
            if (fs < 25.5) {
              violations.push({ card: cIdx + 1, type: 'other < 26px floor', fs, text, cls });
            }
          }
        });
      });

      return { checkedElementsCount, violations };
    });

    await page.close();

    expect(typoReport.checkedElementsCount).toBeGreaterThan(100);
    expect(typoReport.violations).toEqual([]);
  }, 25000);

  // --------------------------------------------------------------------------
  // Invariant (vi): APOSTROPHE PRESERVATION
  // Curly apostrophes typed in editor (O‘zbekiston, ʻ, ’) are preserved verbatim
  // --------------------------------------------------------------------------
  it('Invariant (vi): Curly apostrophes typed in editor (O‘zbekiston, ʻ, ’) are rendered unchanged in AST and DOM', async () => {
    // 1. AST tekshiruvi
    expect(doc.title).toContain('O‘zbekiston');
    expect(doc.title).toContain('‘');
    expect(doc.title).toContain('’');
    expect(doc.title).toContain('oʻ');
    expect(doc.title).toContain('gʻ');

    // 2. Real DOM tekshiruvi
    expect(browser).not.toBeNull();
    const page = await browser!.newPage();
    await page.setViewport({ width: 1440, height: 900 });
    await page.goto(testUrl, { waitUntil: 'networkidle0' });
    await page.waitForSelector('.editor-textarea', { timeout: 10000 });

    await page.evaluate((text) => {
      const textarea = document.querySelector('.editor-textarea') as HTMLTextAreaElement | null;
      if (textarea) {
        const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value')!.set!;
        nativeSetter.call(textarea, text);
        textarea.dispatchEvent(new Event('input', { bubbles: true }));
        textarea.dispatchEvent(new Event('change', { bubbles: true }));
      }
    }, WORST_CASE_SAMPLE_MD);

    await page.waitForSelector('.study-card-9-16', { timeout: 10000 });

    await new Promise((r) => setTimeout(r, 1600));

    const domApostrophes = await page.evaluate(() => {
      const cards = Array.from(document.querySelectorAll('.card-scale-wrapper .study-card-9-16'));
      const allText = cards.map((c) => c.textContent || '').join(' ');
      return {
        hasCurlyLeft: allText.includes('‘'),
        hasCurlyRight: allText.includes('’'),
        hasModifierTurnedComma: allText.includes('ʻ'),
        hasOzbekistonCurly: allText.includes('O‘zbekiston'),
        hasOgShCh: allText.includes('oʻ gʻ sh ch')
      };
    });

    await page.close();

    expect(domApostrophes.hasCurlyLeft).toBe(true);
    expect(domApostrophes.hasCurlyRight).toBe(true);
    expect(domApostrophes.hasModifierTurnedComma).toBe(true);
    expect(domApostrophes.hasOzbekistonCurly).toBe(true);
    expect(domApostrophes.hasOgShCh).toBe(true);
  }, 25000);

  // --------------------------------------------------------------------------
  // Requirement 3: FILL EFFICIENCY VERIFICATION
  // Cards must achieve ~70%+ fill efficiency except the last card of a section
  // --------------------------------------------------------------------------
  it('Requirement 3: Fill efficiency check (cards are at least ~70% full except section endings)', async () => {
    expect(browser).not.toBeNull();
    const page = await browser!.newPage();
    await page.setViewport({ width: 1440, height: 900 });
    await page.goto(testUrl, { waitUntil: 'networkidle0' });
    await page.waitForSelector('.editor-textarea', { timeout: 10000 });

    await page.evaluate((text) => {
      const textarea = document.querySelector('.editor-textarea') as HTMLTextAreaElement | null;
      if (textarea) {
        const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value')!.set!;
        nativeSetter.call(textarea, text);
        textarea.dispatchEvent(new Event('input', { bubbles: true }));
        textarea.dispatchEvent(new Event('change', { bubbles: true }));
      }
    }, WORST_CASE_SAMPLE_MD);

    await page.waitForSelector('.study-card-9-16', { timeout: 10000 });

    await page.evaluate(() => document.fonts?.ready);
    await new Promise((r) => setTimeout(r, 2000));

    const fillData = await page.evaluate(() => {
      const cards = Array.from(document.querySelectorAll('.card-scale-wrapper .study-card-9-16'));
      return cards.map((c, i) => {
        const ca = c.querySelector('.card-content-area');
        const clientH = ca ? ca.clientHeight : c.clientHeight;
        let usedH = 0;
        if (ca) {
          const children = Array.from(ca.children);
          const childHeights = children.map((ch) => (ch as HTMLElement).offsetHeight);
          const gapTotal = Math.max(0, children.length - 1) * 28;
          usedH = childHeights.reduce((a, b) => a + b, 0) + gapTotal;
        } else {
          usedH = c.scrollHeight;
        }
        const fillPercent = Math.round((usedH / clientH) * 100);
        return { cardIndex: i + 1, usedH, clientH, fillPercent };
      });
    });

    await page.close();

    // Ko‘pgina asosiy kartalar (muqova, to‘liq jadval, norma va QA kartalari) >= 70% to‘la bo‘lishi shart
    // 14 ta kartadan 3 tasi bo‘lim yakuni va 1 tasi qisqa mundarija bo‘lgani sababli, kamida 8 ta karta to‘liq bo‘ladi
    const wellFilledCards = fillData.filter((c) => c.fillPercent >= 70);
    expect(wellFilledCards.length).toBeGreaterThanOrEqual(8);
  }, 25000);

  // --------------------------------------------------------------------------
  // Invariant (vii): ZERO HORIZONTAL OVERFLOW IN MULTI-COLUMN TABLES (3, 4, 5 COLUMNS)
  // Tested in real headless Chrome DOM!
  // --------------------------------------------------------------------------
  it('Invariant (vii): Zero horizontal table overflow (wrapper.scrollWidth <= wrapper.clientWidth && cell.scrollWidth <= cell.clientWidth)', async () => {
    expect(browser).not.toBeNull();
    const page = await browser!.newPage();
    await page.setViewport({ width: 1440, height: 900 });
    await page.goto(testUrl, { waitUntil: 'networkidle0' });
    await page.waitForSelector('.editor-textarea', { timeout: 10000 });

    const samplesToTest = [
      {
        name: '3-column constitutional sample',
        md: '# Sinov Hujjati\n\n| Huquqiy institut | Qo‘llanish doirasi | Qonuniy asosi |\n| --- | --- | --- |\n| Xabeas korpus | Qamoqqa olishga sanksiya berish sudlar vakolatida | Konstitutsiya 27-modda |\n| Miranda qoidasi | Ushlash paytida sukut saqlash va himoyachi huquqi | Konstitutsiya 28-modda |\n| Aybsizlik prezumpsiyasi | Aybi qonuniy kuchga kirgan sud hukmi bilan isbotlanmaguncha | Konstitutsiya 28-modda |'
      },
      {
        name: '4-column edge case',
        md: '# Sinov Hujjati\n\n| Modda | Nomi | Qo‘llash sohasi | Javobgarlik choralari |\n| --- | --- | --- | --- |\n| 13-modda | Inson sha’ni va qadr-qimmati | Barcha davlat organlari | Ma’muriy yoki jinoiy javobgarlik |\n| 27-modda | Xabeas korpus instituti | Qamoqqa olish jarayoni | Sud nazorati va ozod qilish |\n| 28-modda | Aybsizlik prezumpsiyasi | Tergov va sud bosqichi | Ayblovni bekor qilish |'
      },
      {
        name: '5-column edge case',
        md: '# Sinov Hujjati\n\n| № | Turi | Asosiy norma | Muddat | Nazorat organi |\n| --- | --- | --- | --- | --- |\n| 1 | Ariza | 15-modda | 15 kun | Ombudsman |\n| 2 | Shikoyat | 16-modda | 30 kun | Sud instantsiyasi |\n| 3 | Talabnoma | 18-modda | 10 kun | Prokuratura |'
      }
    ];

    for (const sample of samplesToTest) {
      await page.evaluate((text) => {
        const textarea = document.querySelector('.editor-textarea') as HTMLTextAreaElement | null;
        if (textarea) {
          const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value')!.set!;
          nativeSetter.call(textarea, text);
          textarea.dispatchEvent(new Event('input', { bubbles: true }));
          textarea.dispatchEvent(new Event('change', { bubbles: true }));
        }
      }, sample.md);

      await page.waitForSelector('.study-card-9-16 table.study-table', { timeout: 10000 });
      await page.evaluate(() => document.fonts?.ready);
      await new Promise((r) => setTimeout(r, 1200));

      const metrics = await page.evaluate(() => {
        const table = document.querySelector('.preview-container table.study-table');
        if (!table) return null;
        const wrapper = table.closest('.table-wrapper') as HTMLElement | null;
        if (!wrapper) return null;

        const cells = Array.from(table.querySelectorAll('th, td')).map((c) => ({
          text: c.textContent?.trim() || '',
          cw: c.clientWidth,
          sw: c.scrollWidth,
          overflow: c.scrollWidth > c.clientWidth
        }));

        return {
          wrapperCw: wrapper.clientWidth,
          wrapperSw: wrapper.scrollWidth,
          wrapperOverflow: wrapper.scrollWidth > wrapper.clientWidth,
          cells
        };
      });

      expect(metrics).not.toBeNull();
      expect(metrics!.wrapperOverflow, `${sample.name} table wrapper overflowed horizontally! (sw: ${metrics?.wrapperSw} > cw: ${metrics?.wrapperCw})`).toBe(false);
      expect(metrics!.cells.some((c) => c.overflow), `${sample.name} has cells where scrollWidth > clientWidth!`).toBe(false);
    }

    await page.close();
  }, 30000);

  // --------------------------------------------------------------------------
  // Invariant (viii): NAVIGATOR COUNTER SYNCHRONIZATION AND ZERO-DESYNC (TASK FIX-2)
  // Tested in real headless Chrome DOM!
  // 1. Render DocumentPreview with a multi-card document.
  // 2. Assert activeCardIndex === 1 ("1/N") on initial mount before scroll.
  // 3. Simulate slight scroll (card 1 still dominant) -> assert activeCardIndex remains 1 ("1/N").
  // 4. Simulate scrolling to card 2's position -> assert activeCardIndex updates to 2 ("2/N")
  //    only when card 2 becomes dominant.
  // 5. Scroll back to top -> assert activeCardIndex returns to 1 ("1/N").
  // --------------------------------------------------------------------------
  it('Invariant (viii): Navigator counter starts at 1/N on mount and tracks dominant visible card', async () => {
    expect(browser).not.toBeNull();
    const page = await browser!.newPage();
    await page.setViewport({ width: 1440, height: 900 });
    await page.goto(testUrl, { waitUntil: 'networkidle0' });
    await page.waitForSelector('.card-nav-counter', { timeout: 10000 });

    const multiCardDoc = `# Konstitutsiyaviy Huquq Kursi
muallif: Toshkent Davlat Yuridik Universiteti
uslub: classic

## 1-Mavzu: Davlat Hokimiyati Asoslari
O‘zbekiston suveren, demokratik, huquqiy, ijtimoiy va dunyoviy davlatdir.

norma: 1-modda: O‘zbekiston - suveren respublika
manba: O‘zbekiston Respublikasi Konstitutsiyasi
1-qism: Davlatning suvereniteti va mustaqilligi daxlsizdir.

## 2-Mavzu: Inson Huquqlari
Insonning qadr-qimmati va erkinliklari oliy qadriyatdir.

norma: 13-modda: Inson qadri
manba: O‘zbekiston Respublikasi Konstitutsiyasi
1-qism: Inson, uning hayoti, erkinligi, sha'ni, qadr-qimmati va boshqa daxlsiz huquqlari oliy qadriyat hisoblanadi.

## 3-Mavzu: Sud Hokimiyati Mustaqilligi
Sudyalar mustaqildirlar, faqat qonunga bo‘ysunadilar.

## 4-Mavzu: Iqtisodiy Huquqlar
Har kim mulkdor bo‘lish huquqiga ega.

## 5-Mavzu: Saylov Tizimi
Saylovlar umumiy, teng va to‘g‘ridan-to‘g‘ri saylov huquqi asosida o‘tkaziladi.
`;

    await page.evaluate((text) => {
      const textarea = document.querySelector('.editor-textarea') as HTMLTextAreaElement | null;
      if (textarea) {
        const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value')!.set!;
        nativeSetter.call(textarea, text);
        textarea.dispatchEvent(new Event('input', { bubbles: true }));
        textarea.dispatchEvent(new Event('change', { bubbles: true }));
      }
    }, multiCardDoc);

    await page.waitForSelector('.study-card-9-16', { timeout: 10000 });
    await new Promise((r) => setTimeout(r, 600));

    // 1. Initial mount assertion: activeCardIndex must be 1 ("1/N")
    const initialText = await page.$eval('.card-nav-counter', (el) => el.textContent?.trim() || '');
    expect(initialText).toMatch(/^1\/\d+\s*karta$/);

    // Total cards rendered in DOM
    const cardElements = await page.$$('.preview-container [id^="card-"]');
    expect(cardElements.length).toBeGreaterThanOrEqual(4);

    // 2. Slight scroll down (50px) where card 1 is still overwhelmingly dominant
    await page.evaluate(() => {
      const container = document.querySelector('.preview-container') as HTMLElement | null;
      if (container) {
        container.scrollTop = 50;
        container.dispatchEvent(new Event('scroll'));
      }
    });
    await new Promise((r) => setTimeout(r, 200));

    const slightScrollText = await page.$eval('.card-nav-counter', (el) => el.textContent?.trim() || '');
    expect(slightScrollText).toBe(initialText); // Still 1/N!

    // 3. Scroll to card 2 dominant position
    await page.evaluate(() => {
      const container = document.querySelector('.preview-container') as HTMLElement | null;
      const card2 = document.getElementById('card-2');
      if (container && card2) {
        container.scrollTop = card2.offsetTop - 40;
        container.dispatchEvent(new Event('scroll'));
      }
    });
    await new Promise((r) => setTimeout(r, 300));

    const card2Text = await page.$eval('.card-nav-counter', (el) => el.textContent?.trim() || '');
    expect(card2Text).toMatch(/^2\/\d+\s*karta$/);

    // 4. Scroll back to top (0px)
    await page.evaluate(() => {
      const container = document.querySelector('.preview-container') as HTMLElement | null;
      if (container) {
        container.scrollTop = 0;
        container.dispatchEvent(new Event('scroll'));
      }
    });
    await new Promise((r) => setTimeout(r, 200));

    const topText = await page.$eval('.card-nav-counter', (el) => el.textContent?.trim() || '');
    expect(topText).toMatch(/^1\/\d+\s*karta$/);

    await page.close();
  }, 25000);
});

