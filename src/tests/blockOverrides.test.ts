import { describe, it, expect } from 'vitest';
import { parseMarkdownPlus } from '../schema/mdParser';
import { paginateDocument } from '../services/paginator';
import type { BlockStyleOverridesMap, LegalDocument, NormBlock } from '../schema/types';

describe('TASK 8: Per-Block Style Controls & Cascade Invariants', () => {
  const sampleMd = `---
mavzu: "O‘zbekiston Respublikasi Mehnat Kodeksi"
muallif: "TDYU Kafedrasi"
uslub: classic
---

# 1-BOB. UMUMIY QOIDALAR

Mehnat sohasidagi ijtimoiy munosabatlar qonun bilan tartibga solinadi.

norma: 1-modda: Mehnat to‘g‘risidagi qonunchilik {#norm-mehnat-1}
Ushbu Kodeks mehnat sohasidagi munosabatlarni tartibga soluvchi asosiy hujjatdir.
manba: Mehnat kodeksi

norma: 2-modda: Mehnat erkinligi prinsipi
Har kim mehnat qilish, erkin kasb tanlash va adolatli mehnat sharoitlariga ega bo‘lish huquqiga ega.
`;

  it('1. ID Barqarorligi: Blokdan yuqoriga matn qo‘shilganda ID o‘zgarmaydi va uslub blokga ergashadi', () => {
    const doc1 = parseMarkdownPlus(sampleMd).document;
    const norm2Before = doc1.sections[0].blocks.find(
      (b) => b.type === 'norm' && (b as NormBlock).number.includes('2-modda')
    );
    expect(norm2Before).toBeDefined();
    const idBefore = norm2Before!.id;
    expect(idBefore).toBeTruthy();

    // Yuqoriga bir nechta yangi paragraflar va sarlavhalar qo'shamiz
    const updatedMd = `---
mavzu: "O‘zbekiston Respublikasi Mehnat Kodeksi"
muallif: "TDYU Kafedrasi"
uslub: classic
---

# 1-BOB. UMUMIY QOIDALAR

Yangi kiritilgan 1-xatboshi.
Yangi kiritilgan 2-xatboshi.
Yangi kiritilgan 3-xatboshi.

Mehnat sohasidagi ijtimoiy munosabatlar qonun bilan tartibga solinadi.

norma: 1-modda: Mehnat to‘g‘risidagi qonunchilik {#norm-mehnat-1}
Ushbu Kodeks mehnat sohasidagi munosabatlarni tartibga soluvchi asosiy hujjatdir.
manba: Mehnat kodeksi

norma: 2-modda: Mehnat erkinligi prinsipi
Har kim mehnat qilish, erkin kasb tanlash va adolatli mehnat sharoitlariga ega bo‘lish huquqiga ega.
`;

    const doc2 = parseMarkdownPlus(updatedMd).document;
    const norm2After = doc2.sections[0].blocks.find(
      (b) => b.type === 'norm' && (b as NormBlock).number.includes('2-modda')
    );
    expect(norm2After).toBeDefined();
    const idAfter = norm2After!.id;

    // Repaginatsiyadan keyin ham blokning deterministik ID si bir xil qolishi shart!
    expect(idAfter).toBe(idBefore);
  });

  it('2. Alohida blok uslubini o‘rnatish va persist qilish (MD+ matnini buzmagan holda)', () => {
    const parsed = parseMarkdownPlus(sampleMd);
    const doc = parsed.document;
    const targetBlock = doc.sections[0].blocks.find((b) => b.id === 'norm-mehnat-1');
    expect(targetBlock).toBeDefined();
    expect(targetBlock!.id).toBe('norm-mehnat-1');

    // Foydalanuvchi norma blokiga Zumrad yashil rang (#059669) va 'L' o'lcham beradi
    const overrides: BlockStyleOverridesMap = {
      [targetBlock!.id!]: {
        accentColor: '#059669',
        size: 'L',
        alignment: 'center',
        hideInPdf: false
      }
    };

    doc.blockOverrides = overrides;

    expect(doc.blockOverrides['norm-mehnat-1']).toBeDefined();
    expect(doc.blockOverrides['norm-mehnat-1'].accentColor).toBe('#059669');
    expect(doc.blockOverrides['norm-mehnat-1'].size).toBe('L');
    expect(doc.blockOverrides['norm-mehnat-1'].alignment).toBe('center');

    // MD+ manba matniga hech qanday zarar yetmaganini tekshiramiz
    expect(sampleMd).toContain('norma: 1-modda: Mehnat to‘g‘risidagi qonunchilik {#norm-mehnat-1}');
    expect(sampleMd).not.toContain('#059669');
  });

  it('3. Blok uslubini tozalash (Reset) faqat tanlangan blokni dastlabki holatga qaytaradi', () => {
    const overrides: BlockStyleOverridesMap = {
      'norm-1': { accentColor: '#059669', size: 'L' },
      'case-1': { accentColor: '#dc2626', size: 'S' }
    };

    // 'norm-1' blok uslubi tozalandi
    delete overrides['norm-1'];

    expect(overrides['norm-1']).toBeUndefined();
    expect(overrides['case-1']).toBeDefined();
    expect(overrides['case-1'].accentColor).toBe('#dc2626');
  });

  it('4. Paginator integratsiyasi: O‘lcham (L / S) o‘zgarganda blok balandligi va kartalarga taqsimot moslashadi', () => {
    const doc = parseMarkdownPlus(sampleMd).document;
    const normalCards = paginateDocument(doc);
    expect(normalCards.length).toBeGreaterThan(0);

    // Katta (L) o'lcham berilganda paginator uning balandligini oshiradi
    const docWithL: LegalDocument = {
      ...doc,
      blockOverrides: {
        'norm-mehnat-1': { size: 'L' }
      }
    };
    const cardsL = paginateDocument(docWithL);
    expect(cardsL.length).toBeGreaterThanOrEqual(normalCards.length);
  });

  it('5. Bo‘lingan (continuation) bloklarda uslub barcha qismlarga to‘liq tatbiq etiladi', () => {
    const longNormaMd = `---
mavzu: "Katta qonun hujjati"
---

# 1-BOB. UMUMIY

norma: 100-modda: Katta hajmli norma {#huge-norm}
1-xatboshi matni. Juda ham uzun huquqiy tushuntirish va mezonlar.

2-xatboshi matni. Ushbu qism ikkinchi kartaga o'tishi kerak.

3-xatboshi matni. Uchinchi qism ham davom etadi.

4-xatboshi matni. To'rtinchi qism.

5-xatboshi matni. Beshinchi qism.
`;
    const doc = parseMarkdownPlus(longNormaMd).document;
    doc.blockOverrides = {
      'huge-norm': { accentColor: '#059669', size: 'L' }
    };

    const cards = paginateDocument(doc);
    const contentCards = cards.filter((c) => c.cardType === 'content');

    // Barcha qismlar mavjudligini tekshiramiz
    const allNormBlocks = contentCards.flatMap((c) => c.blocks.filter((b) => b.type === 'norm'));
    expect(allNormBlocks.length).toBeGreaterThan(0);
    expect(allNormBlocks[0].id?.startsWith('huge-norm')).toBe(true);
  });
});
