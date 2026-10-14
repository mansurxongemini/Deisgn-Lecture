import { describe, it, expect } from 'vitest';
import { parseMarkdownPlus } from '../schema/mdParser';
import { QUICK_INTRO_EXAMPLE, GUIDE_LESSONS, FAQ_LIST } from '../components/guide/guideData';

describe('Guide Examples Zero-Warning Verification', () => {
  it('QUICK_INTRO_EXAMPLE (2 daqiqalik kirish namunasi) 0 ta ogohlantirish bilan tahlil qilinadi', () => {
    const { document, warnings } = parseMarkdownPlus(QUICK_INTRO_EXAMPLE);
    expect(document).toBeDefined();
    // Barcha ogohlantirishlar ro'yxatida faqat bo'sh bo'lishi lozim (0 warnings)
    const severeWarnings = warnings.filter((w) => w.severity === 'warning');
    expect(severeWarnings).toEqual([]);
    expect(warnings.length).toBe(0);
  });

  it('Barcha 10 ta darslikdagi asosiy namunalar (exampleSnippet) 0 ta ogohlantirish bilan tahlil qilinadi', () => {
    GUIDE_LESSONS.forEach((lesson) => {
      const fullDoc = `# Darslik: ${lesson.title}\nuslub: classic\n\n## 1-bo‘lim\n\n${lesson.exampleSnippet}`;
      const { document, warnings } = parseMarkdownPlus(fullDoc);
      expect(document).toBeDefined();

      const warningMsgs = warnings.filter((w) => w.severity === 'warning').map((w) => w.message);
      expect(warningMsgs, `Darslikda ogohlantirish chiqmasligi shart: ${lesson.title}`).toEqual([]);
    });
  });

  it('Barcha "to‘g‘ri variant" (commonMistake.correct) namunalari ham 0 ta ogohlantirish bilan tahlil qilinadi', () => {
    GUIDE_LESSONS.forEach((lesson) => {
      const fullDoc = `# Xato va To‘g‘rilash: ${lesson.title}\nuslub: classic\n\n## 1-bo‘lim\n\n${lesson.commonMistake.correct}`;
      const { document, warnings } = parseMarkdownPlus(fullDoc);
      expect(document).toBeDefined();

      const warningMsgs = warnings.filter((w) => w.severity === 'warning').map((w) => w.message);
      expect(warningMsgs, `To'g'rilangan variantda ogohlantirish chiqmasligi shart: ${lesson.title}`).toEqual([]);
    });
  });

  it('FAQ (Savol-javob) ro‘yxatida kamida 10 ta dolzarb savol mavjud', () => {
    expect(FAQ_LIST.length).toBeGreaterThanOrEqual(10);
  });

  it('Walkthrough 5 ta qadami birlashtirilganda 0 ta ogohlantirish beradi', () => {
    const walkthroughDoc = `# Mening Birinchi Konspektim
muallif: Talaba

## 1-Mavzu. Qonun ustuvorligi
Huquqiy davlatda inson qadr-qimmati va erkinligi eng oliy qadriyat hisoblanadi.

norma: 13-modda: Inson huquqlari kafolati
manba: O‘zbekiston Respublikasi Konstitutsiyasi
Insonning huquq va erkinliklari bevosita amal qiladi.

savol: Inson huquqlari qanday amal qiladi?
javob: Bevosita amal qiladi va qonunlarning mazmunini belgilaydi.`;

    const { document, warnings } = parseMarkdownPlus(walkthroughDoc);
    expect(document).toBeDefined();
    const severeWarnings = warnings.filter((w) => w.severity === 'warning');
    expect(severeWarnings).toEqual([]);
  });
});

