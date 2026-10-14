import { describe, it, expect } from 'vitest';
import { parseMarkdownPlus } from '../schema/mdParser';
import { serializeToMarkdownPlus } from '../schema/mdSerializer';
import { generateAiPrompt, generateCheatSheetText } from '../schema/mdSpec';
import type {
  NormBlock,
  NoteBlock,
  CaseBlock,
  QaBlock,
  DefinitionBlock,
  TableBlock,
  ListBlock,
  CompareBlock,
  FlowBlock,
  TimelineBlock,
  TextBlock
} from '../schema/types';

describe('MD+ (Markdown Plus) Parser & Serializer', () => {
  it('hujjat sarlavhasi va metama’lumotlarini to‘g‘ri ajratadi', () => {
    const md = `# Fuqarolik Huquqi
muallif: TDYU Yuridik fakulteti
mavzu: modern
subtitle: Majburiyatlar qonunchiligi
muassasa: Toshkent Davlat Yuridik Universiteti
yil: 2026

## 1-bo‘lim. Kirish
Oddiy kirish matni`;

    const result = parseMarkdownPlus(md);
    expect(result.document.title).toBe('Fuqarolik Huquqi');
    expect(result.document.author).toBe('TDYU Yuridik fakulteti');
    expect(result.document.theme).toBe('modern');
    expect(result.document.subtitle).toBe('Majburiyatlar qonunchiligi');
    expect(result.document.cover?.institution).toBe('Toshkent Davlat Yuridik Universiteti');
    expect(result.document.cover?.year).toBe('2026');
    expect(result.document.sections.length).toBe(1);
    expect(result.document.sections[0].title).toBe('1-bo‘lim. Kirish');
  });

  it('barcha 11 ta blok turini xatosiz AST ga aylantiradi', () => {
    const md = `# Sinov Hujjati

## Barcha Bloklar Bo‘limi

Bu oddiy matn bloki.

- Birinchi band
- Ikkinchi band

1. Birinchi raqamli
2. Ikkinchi raqamli

§ 354-modda: Shartnoma erkinligi printsipi
manba: Fuqarolik Kodeksi
sana: 01.03.1997
Fuqarolar va yuridik shaxslar shartnoma tuzishda erkindirlar.

! Diqqat: Majburiyatlarni buzish javobgarlikka sabab bo‘ladi.

+ Maslahat: Shartnomani yozma rasmiylashtiring.

kazus: Ijara shartnomasi nizosi
sud: Toshkent shahar sudi
fakt: Ijara to‘lovi 2 oy kechiktirilgan.
qoida: FK 556-moddasiga ko‘ra to‘lov o‘z vaqtida amalga oshirilishi shart.
xulosa: Da’vo qanoatlantirilib, ijara qarzdorligi undirildi.

? Oferta nima?
= Shartnoma tuzish haqidagi taklif.
maslahat: 367-modda
toifa: Shartnoma

~ Rekvizitsiya: Davlat ehtiyojlari uchun mulkni haqini to‘lab olib qo‘yish.
manba: FK 203-modda

| Atama | Muddati | Izoh |
| --- | --- | --- |
| Umumiy da’vo | 3 yil | Standart muddat |
| Maxsus | 6 oy | Qisqartirilgan |

taqqos: Oldi-sotdi | Ayirboshlash
- Oldi-sotdi: Pul evaziga mulk o‘tishi
- Ayirboshlash: Tovar evaziga tovar o‘tishi

jarayon: Shartnoma tuzish
Oferta berish -> Aksept olish -> Imzolash

vaqt: Qonun evolyutsiyasi
1997 | Kodeks qabul qilinishi
2023 | Referendum o‘tkazilishi`;

    const { document } = parseMarkdownPlus(md);
    expect(document.sections.length).toBe(1);
    const blocks = document.sections[0].blocks;

    // 1. Text
    const textBlk = blocks[0] as TextBlock;
    expect(textBlk.type).toBe('text');
    expect(textBlk.text).toBe('Bu oddiy matn bloki.');

    // 2. Unordered List
    const listBlk = blocks[1] as ListBlock;
    expect(listBlk.type).toBe('list');
    expect(listBlk.ordered).toBe(false);
    expect(listBlk.items).toEqual(['Birinchi band', 'Ikkinchi band']);

    // 3. Ordered List
    const orderedListBlk = blocks[2] as ListBlock;
    expect(orderedListBlk.type).toBe('list');
    expect(orderedListBlk.ordered).toBe(true);

    // 4. Norm
    const normBlk = blocks[3] as NormBlock;
    expect(normBlk.type).toBe('norm');
    expect(normBlk.number).toBe('354-modda');
    expect(normBlk.title).toBe('Shartnoma erkinligi printsipi');
    expect(normBlk.source).toBe('Fuqarolik Kodeksi');
    expect(normBlk.effectiveDate).toBe('01.03.1997');
    expect(normBlk.text).toContain('Fuqarolar va yuridik shaxslar');

    // 5. Note warning
    const noteWarn = blocks[4] as NoteBlock;
    expect(noteWarn.type).toBe('note');
    expect(noteWarn.variant).toBe('warning');

    // 6. Note tip
    const noteTip = blocks[5] as NoteBlock;
    expect(noteTip.type).toBe('note');
    expect(noteTip.variant).toBe('tip');

    // 7. Case
    const caseBlk = blocks[6] as CaseBlock;
    expect(caseBlk.type).toBe('case');
    expect(caseBlk.title).toBe('Ijara shartnomasi nizosi');
    expect(caseBlk.facts).toContain('2 oy kechiktirilgan');
    expect(caseBlk.rule).toContain('FK 556-moddasi');
    expect(caseBlk.conclusion).toContain('qarzdorligi undirildi');

    // 8. QA
    const qaBlk = blocks[7] as QaBlock;
    expect(qaBlk.type).toBe('qa');
    expect(qaBlk.question).toBe('Oferta nima?');
    expect(qaBlk.answer).toBe('Shartnoma tuzish haqidagi taklif.');
    expect(qaBlk.hint).toBe('367-modda');

    // 9. Definition
    const defBlk = blocks[8] as DefinitionBlock;
    expect(defBlk.type).toBe('definition');
    expect(defBlk.term).toBe('Rekvizitsiya');
    expect(defBlk.definition).toContain('Davlat ehtiyojlari');

    const ratioDef = parseMarkdownPlus("# Sinov\n\n## Bo'lim\n\nta'rif: MD+ formati — oddiy matn orqali professional 9:16 o'quv kartochkalarini yaratish tizimi.");
    const ratioDefBlk = ratioDef.document.sections[0].blocks[0] as DefinitionBlock;
    expect(ratioDefBlk.type).toBe('definition');
    expect(ratioDefBlk.term).toBe('MD+ formati');
    expect(ratioDefBlk.definition).toBe("oddiy matn orqali professional 9:16 o'quv kartochkalarini yaratish tizimi.");

    // 10. Table
    const tableBlk = blocks[9] as TableBlock;
    expect(tableBlk.type).toBe('table');
    expect(tableBlk.headers).toEqual(['Atama', 'Muddati', 'Izoh']);
    expect(tableBlk.rows.length).toBe(2);

    // 11. Compare
    const compareBlk = blocks[10] as CompareBlock;
    expect(compareBlk.type).toBe('compare');
    expect(compareBlk.items.length).toBe(2);

    // 12. Flow
    const flowBlk = blocks[11] as FlowBlock;
    expect(flowBlk.type).toBe('flow');
    expect(flowBlk.steps.map((s) => s.title)).toEqual(['Oferta berish', 'Aksept olish', 'Imzolash']);

    // 13. Timeline
    const timelineBlk = blocks[12] as TimelineBlock;
    expect(timelineBlk.type).toBe('timeline');
    expect(timelineBlk.events.length).toBe(2);
    expect(timelineBlk.events[0].date).toBe('1997');
  });

  it('xatoliklar yuz berganda qulab tushmaydi va o‘zbek tilida aniq ogohlantirishlar beradi', () => {
    const brokenMd = `# Noto‘g‘ri Hujjat
mavzu: super-ajoyib-mavzu

## 1-bo‘lim

kazus: Chala kazus
fakt: Faqat fakt yozilgan, qoida va xulosa yo‘q.

? Javobi yo‘q savol

§ 12-modda: Matni yo‘q norma
manba: Noma’lum manba`;

    const { document, warnings } = parseMarkdownPlus(brokenMd);
    expect(document).toBeDefined();
    expect(document.theme).toBe('classic'); // noma'lum mavzu bo'lsa standartga qaytadi

    // Ogohlantirishlar mavjudligi
    expect(warnings.length).toBeGreaterThanOrEqual(4);
    const msgs = warnings.map((w) => w.message);

    expect(msgs.some((m) => m.includes('super-ajoyib-mavzu'))).toBe(true);
    expect(msgs.some((m) => m.includes('qoida:'))).toBe(true);
    expect(msgs.some((m) => m.includes('xulosa:'))).toBe(true);
    expect(msgs.some((m) => m.includes('javobi topilmadi'))).toBe(true);
    expect(msgs.some((m) => m.includes('matni bo‘sh qoldirildi'))).toBe(true);
  });

  it('barqaror ID suffikslarini ({#id}) saqlaydi va yo‘q bo‘lsa avtomatik hosil qiladi', () => {
    const md = `# Maxsus ID Hujjati

## Bo‘lim {#sec-maxsus}

Oddiy matn {#blk-maxsus-matn}

? Savol {#savol-99}
= Javob`;

    const { document } = parseMarkdownPlus(md);
    expect(document.sections[0].id).toBe('sec-maxsus');
    expect(document.sections[0].blocks[0].id).toBe('blk-maxsus-matn');
    expect(document.sections[0].blocks[1].id).toBe('savol-99');
  });

  it('MD+ va AST o‘rtasida ikki tomonlama (round-trip) moslikni saqlaydi', () => {
    const initialMd = `# Qayta Aylantirish Testi
muallif: Muallif Test
mavzu: dark

## 1-bo‘lim

Oddiy xatboshi matni.

§ 10-modda: Konstitutsiya ustunligi
O‘zbekiston Respublikasida Konstitutsiya va qonunlarning ustunligi so‘zsiz tan olinadi.

? Savol testi
= Javob testi
`;

    const { document } = parseMarkdownPlus(initialMd);
    const serialized = serializeToMarkdownPlus(document);
    const { document: roundTripDoc } = parseMarkdownPlus(serialized);

    expect(roundTripDoc.title).toBe(document.title);
    expect(roundTripDoc.author).toBe(document.author);
    expect(roundTripDoc.theme).toBe(document.theme);
    expect(roundTripDoc.sections[0].blocks.length).toBe(document.sections[0].blocks.length);
  });

  it('AI Prompt shabloni va Cheat Sheet matni to‘g‘ri generatsiya qilinadi', () => {
    const cheatSheet = generateCheatSheetText();
    expect(cheatSheet).toContain('MD+ FORMATI BO‘YICHA BIR EKRANLIK QO‘LLANMA');
    expect(cheatSheet).toContain('kazus:');
    expect(cheatSheet).toContain('norma: 354-modda');

    const promptShort = generateAiPrompt({
      includeQuestions: true,
      detailLevel: 'short',
      rawText: 'Fuqarolik huquqi asoslari haqida matn.'
    });

    expect(promptShort).toContain('Siz — yuridik fanlar bo‘yicha tajribali metodist');
    expect(promptShort).toContain('Fuqarolik huquqi asoslari haqida matn.');
    expect(promptShort).toContain('savol-javob');
  });

  it('migratsiya qilingan civil_law.md va constitutional_law.md namunalarini muvaffaqiyatli tahlil qiladi', async () => {
    const fs = await import('fs');
    const path = await import('path');

    const civilPath = path.resolve(__dirname, '../../public/samples/civil_law.md');
    const constPath = path.resolve(__dirname, '../../public/samples/constitutional_law.md');

    const civilMd = fs.readFileSync(civilPath, 'utf-8');
    const constMd = fs.readFileSync(constPath, 'utf-8');

    const civilResult = parseMarkdownPlus(civilMd);
    expect(civilResult.document.title).toContain('Fuqarolik Huquqi');
    expect(civilResult.document.sections[0].blocks.length).toBeGreaterThan(5);

    const constResult = parseMarkdownPlus(constMd);
    expect(constResult.document.title).toContain('Konstitutsiyaviy Huquqi');
    expect(constResult.document.sections[0].blocks.length).toBeGreaterThan(5);
  });
});
