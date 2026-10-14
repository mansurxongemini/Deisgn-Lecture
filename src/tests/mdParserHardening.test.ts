import { describe, it, expect } from 'vitest';
import { parseMarkdownPlus, cleanInputText, splitTableCells } from '../schema/mdParser';
import { serializeToMarkdownPlus } from '../schema/mdSerializer';
import type {
  NormBlock,
  NoteBlock,
  CaseBlock,
  QaBlock,
  DefinitionBlock,
  TableBlock,
  TextBlock
} from '../schema/types';

describe('MD+ Parser Hardening (Step B2)', () => {
  it('1. Qator ichidagi yoki oxiridagi ?, !, +, = belgilari va telefon raqamlari oddiy matn bo‘lib qoladi', () => {
    const md = `# Sinov Hujjati

## 1-bo‘lim

Bu savol matnimi? Albatta! Buni bilish kerak = juda muhim.
Aloqa uchun telefon: +998 90 123 45 67.
#1 ariza bo‘yicha murojaat qilindi.
5-modda talablari bajarildi.
Savol bor edi.
Sana: 5-mart kuni keldi.`;

    const { document } = parseMarkdownPlus(md);
    expect(document.sections.length).toBe(1);
    const blocks = document.sections[0].blocks;

    // Barcha bu qatorlar bitta yoki ikkita oddiy matn bloki sifatida olinadi, hech qanday soxta blok yaratilmaydi
    expect(blocks.every((b) => b.type === 'text')).toBe(true);
    const fullText = (blocks[0] as TextBlock).text;
    expect(fullText).toContain('savol matnimi?');
    expect(fullText).toContain('+998 90 123 45 67');
    expect(fullText).toContain('#1 ariza');
    expect(fullText).toContain('Savol bor edi.');
    expect(fullText).toContain('Sana: 5-mart kuni keldi.');
  });

  it('2. Ko‘p xatboshili bloklar (Multi-paragraph) va 2 bo‘sh joy bilan ichki qatorlar ulanadi', () => {
    const md = `# Hujjat

## Bo‘lim

norma: 100-modda: Majburiyat
Birinchi xatboshi matni.

Ikkinchi xatboshi matni ham shu normaga tegishli.
  Uchinchi qator esa 2 ta bo‘sh joy bilan ichkariga surilgan.

ogoh: Diqqat qiling
Bu ogohlantirishning birinchi qatori.

Bu esa ogohlantirishning ikkinchi qatori.`;

    const { document } = parseMarkdownPlus(md);
    const blocks = document.sections[0].blocks;
    expect(blocks.length).toBe(2);

    const norm = blocks[0] as NormBlock;
    expect(norm.type).toBe('norm');
    expect(norm.text).toContain('Birinchi xatboshi matni.');
    expect(norm.text).toContain('Ikkinchi xatboshi matni');
    expect(norm.text).toContain('Uchinchi qator');

    const note = blocks[1] as NoteBlock;
    expect(note.type).toBe('note');
    expect(note.text).toContain('birinchi qatori');
    expect(note.text).toContain('ikkinchi qatori');
  });

  it('3. Kiruvchi matn tozalanishi (``` qobig‘i, BOM, NBSP, chatty AI so‘zlari)', () => {
    const messyInput = `\`\`\`markdown
Mana siz so‘ragan yuridik hujjat:
Albatta, quyida MD+ formatida taqdim etaman:

# Fuqarolik Huquqi
uslub: modern

## Kirish
Asosiy matn mazmuni.
\`\`\``;

    const { text, leadingChatter } = cleanInputText(messyInput);
    expect(leadingChatter.length).toBeGreaterThan(0);
    expect(text).toContain('# Fuqarolik Huquqi');
    expect(text.startsWith('# Fuqarolik Huquqi')).toBe(true);

    const { document, warnings } = parseMarkdownPlus(messyInput);
    expect(document.title).toBe('Fuqarolik Huquqi');
    expect(document.theme).toBe('modern');
    expect(warnings.some((w) => w.message.includes('kirish so‘zlari'))).toBe(true);
  });

  it('4. Jadvallar: ID alohida qatorda, escaped pipe (\\|) qo‘llab-quvvatlanadi, ustunlar soni mos kelmasa ogohlantirish beradi', () => {
    // Escaped pipe tekshiruvi
    const cells = splitTableCells('| Modda \\| Qoida | Izoh |');
    expect(cells).toEqual(['Modda | Qoida', 'Izoh']);

    const tableMd = `# Hujjat

## Bo‘lim

{#blk-maxsus-jadval}
| Modda | Ta’rif | Izoh |
| --- | --- | --- |
| 1-modda | Asosiy qoida | Batafsil |
| 2-modda | Faqat bitta izoh |`; // 3 ta emas, 2 ta ustun

    const { document, warnings } = parseMarkdownPlus(tableMd);
    const tableBlk = document.sections[0].blocks[0] as TableBlock;
    expect(tableBlk.type).toBe('table');
    expect(tableBlk.id).toBe('blk-maxsus-jadval');
    expect(tableBlk.headers).toEqual(['Modda', 'Ta’rif', 'Izoh']);

    // Ustunlar soni mos kelmagani haqida ogohlantirish
    expect(warnings.some((w) => w.message.includes('ustunlar soniga mos kelmadi'))).toBe(true);
  });

  it('5. Sarlavha kalitlari: uslub: (mavzu: o‘rniga) va izoh: (subtitle: o‘rniga), eski kalitlar ham xatosiz ishlaydi', () => {
    const mdNew = `# Yangi Standart
uslub: dark
izoh: Kichik sarlavha izohi

## 1-bo‘lim
Matn`;

    const resNew = parseMarkdownPlus(mdNew);
    expect(resNew.document.theme).toBe('dark');
    expect(resNew.document.subtitle).toBe('Kichik sarlavha izohi');

    const mdOld = `# Eski Standart
mavzu: minimal
subtitle: Eski uslubdagi izoh

## 1-bo‘lim
Matn`;

    const resOld = parseMarkdownPlus(mdOld);
    expect(resOld.document.theme).toBe('minimal');
    expect(resOld.document.subtitle).toBe('Eski uslubdagi izoh');
  });

  it('6. Ids sokin va ixtiyoriy: Serializator faqat qa bloklari va havolalangan bloklar uchun {#id} yozadi', () => {
    const md = `# Hujjat
uslub: classic

## 1-bo‘lim

norma: 10-modda: Konstitutsiya ustunligi
Matn.

Bu yerda biz [[10-modda]] ga havola qilamiz.

savol: Savol matni?
javob: Javob matni.`;

    const { document } = parseMarkdownPlus(md);
    const serialized = serializeToMarkdownPlus(document);

    // qa bloki har doim {#id} oladi
    expect(serialized).toMatch(/savol: Savol matni\? \{#[a-zA-Z0-9_-]+\}/);
    // norma esa havola qilingan bo'lsa ID oladi
    expect(serialized).toContain('norma: 10-modda: Konstitutsiya ustunligi');
  });

  it('7. Kontekstga bog‘liq maydonlar: sana:, manba: faqat o‘z blokida maydon bo‘ladi, sarlavha birinchi ikki nuqtadan ajratiladi', () => {
    const md = `# Hujjat

## Bo‘lim

kazus: Fuqarolik ishi: Mahsulot yetkazib berish shartnomasi: 2026-yil nizosi
fakt: Yetkazib beruvchi kechiktirdi.
qoida: FK 333-moddasi qo‘llanadi.
xulosa: Da’vo qanoatlantirildi.
manba: Toshkent tumanlararo iqtisodiy sudi

Oddiy matn xatboshisi.
Sana: 2026-yil 15-mart.
Manba: Sud xabarnomasi.`;

    const { document } = parseMarkdownPlus(md);
    const blocks = document.sections[0].blocks;
    expect(blocks.length).toBe(2);

    const caseBlk = blocks[0] as CaseBlock;
    expect(caseBlk.type).toBe('case');
    // Birinchi ikki nuqtadan ajralgan bo'lishi kerak
    expect(caseBlk.title).toBe('Fuqarolik ishi: Mahsulot yetkazib berish shartnomasi: 2026-yil nizosi');
    expect(caseBlk.court).toBe('Toshkent tumanlararo iqtisodiy sudi');

    // Ikkinchi blok oddiy matn bo'lib, Sana: va Manba: uning ichida matn sifatida qolishi kerak
    const textBlk = blocks[1] as TextBlock;
    expect(textBlk.type).toBe('text');
    expect(textBlk.text).toContain('Sana: 2026-yil 15-mart.');
    expect(textBlk.text).toContain('Manba: Sud xabarnomasi.');
  });

  it('8. AI Markdown odatlari: ###, >, --- va emojilar xavfsiz qabul qilinadi', () => {
    const md = `# Hujjat

## Bo‘lim

### Bu kichik sarlavha edi

---

> Bu iqtibos eslatma qilib olinishi kerak

⚖️ kazus: Sud ishi
fakt: Fakt holati
qoida: Qonun qoidasi
xulosa: Xulosa natijasi

❓ savol: Emojili savol?
javob: Emojisiz javob.`;

    const { document, warnings } = parseMarkdownPlus(md);
    const blocks = document.sections[0].blocks;

    // ### matnga aylandi
    expect(blocks[0].type).toBe('text');
    expect((blocks[0] as TextBlock).text).toBe('**Bu kichik sarlavha edi**');
    expect(warnings.some((w) => w.message.includes('kichik sarlavhasi'))).toBe(true);

    // > note ga aylandi
    expect(blocks[1].type).toBe('note');
    expect((blocks[1] as NoteBlock).text).toContain('Bu iqtibos eslatma');

    // ⚖️ kazus to'g'ri tushdi
    expect(blocks[2].type).toBe('case');
    expect((blocks[2] as CaseBlock).title).toBe('Sud ishi');

    // ❓ savol to'g'ri tushdi
    expect(blocks[3].type).toBe('qa');
    expect((blocks[3] as QaBlock).question).toBe('Emojili savol?');
  });

  it('9. ## Bo‘lim sarlavhasi ostidagi bevosita qator bo‘lim izohi (subtitle) bo‘ladi', () => {
    const md = `# Hujjat

## 1-bob. Shartnoma erkinligi
Taraflarning tengligi va mustaqilligi kafolatlari

Oddiy xatboshi matni.`;

    const { document } = parseMarkdownPlus(md);
    expect(document.sections[0].title).toBe('1-bob. Shartnoma erkinligi');
    expect(document.sections[0].subtitle).toBe('Taraflarning tengligi va mustaqilligi kafolatlari');
    expect(document.sections[0].blocks[0].type).toBe('text');
  });

  it('10. Kazusda sud: maydoni manba: bilan birlashtirilgan', () => {
    const md = `# Hujjat

## Bo‘lim

kazus: Nizo ishi
fakt: Holat
qoida: Qoida
xulosa: Xulosa
manba: Oliy Sud Rayosati`;

    const { document } = parseMarkdownPlus(md);
    const caseBlk = document.sections[0].blocks[0] as CaseBlock;
    expect(caseBlk.court).toBe('Oliy Sud Rayosati');
  });

  it('11. Uch tomonlama tenglik (Triple Form Equivalence): So‘z formasi, @ formasi va Simvol formasi IDENTIK AST beradi', () => {
    const wordFormMd = `# Hujjat
uslub: classic

## 1-bo‘lim

norma: 354-modda: Shartnoma erkinligi
manba: FK
sana: 01.03.1997
Norma matni shu yerda.

ogoh: Muhim ogohlantirish qoidasi

maslahat: Amaliy foydali maslahat

savol: Qonun ustuvorligi nima?
javob: Barcha munosabatlarda qonun oliyligi.

ta'rif: Delikt: Yetkazilgan zarar.
manba: FK`;

    const atFormMd = `# Hujjat
uslub: classic

## 1-bo‘lim

@norma 354-modda: Shartnoma erkinligi
manba: FK
sana: 01.03.1997
Norma matni shu yerda.

@ogoh Muhim ogohlantirish qoidasi

@maslahat Amaliy foydali maslahat

@savol Qonun ustuvorligi nima?
@javob Barcha munosabatlarda qonun oliyligi.

@tarif Delikt: Yetkazilgan zarar.
manba: FK`;

    const symbolFormMd = `# Hujjat
uslub: classic

## 1-bo‘lim

§ 354-modda: Shartnoma erkinligi
manba: FK
sana: 01.03.1997
Norma matni shu yerda.

! Muhim ogohlantirish qoidasi

+ Amaliy foydali maslahat

? Qonun ustuvorligi nima?
= Barcha munosabatlarda qonun oliyligi.

~ Delikt: Yetkazilgan zarar.
manba: FK`;

    const resWord = parseMarkdownPlus(wordFormMd);
    const resAt = parseMarkdownPlus(atFormMd);
    const resSymbol = parseMarkdownPlus(symbolFormMd);

    const blocksWord = resWord.document.sections[0].blocks;
    const blocksAt = resAt.document.sections[0].blocks;
    const blocksSymbol = resSymbol.document.sections[0].blocks;

    expect(blocksWord.length).toBe(5);
    expect(blocksAt.length).toBe(5);
    expect(blocksSymbol.length).toBe(5);

    // Har bir blokning turlari bir xil
    expect(blocksWord.map((b) => b.type)).toEqual(blocksAt.map((b) => b.type));
    expect(blocksWord.map((b) => b.type)).toEqual(blocksSymbol.map((b) => b.type));

    // 1. Norma
    const nWord = blocksWord[0] as NormBlock;
    const nAt = blocksAt[0] as NormBlock;
    const nSym = blocksSymbol[0] as NormBlock;
    expect(nWord.number).toBe(nAt.number);
    expect(nWord.number).toBe(nSym.number);
    expect(nWord.title).toBe(nAt.title);
    expect(nWord.title).toBe(nSym.title);
    expect(nWord.text).toBe(nAt.text);
    expect(nWord.text).toBe(nSym.text);

    // 2. Ogoh
    const oWord = blocksWord[1] as NoteBlock;
    const oAt = blocksAt[1] as NoteBlock;
    const oSym = blocksSymbol[1] as NoteBlock;
    expect(oWord.variant).toBe('warning');
    expect(oAt.variant).toBe('warning');
    expect(oSym.variant).toBe('warning');
    expect(oWord.text).toBe(oAt.text);
    expect(oWord.text).toBe(oSym.text);

    // 3. Maslahat
    const mWord = blocksWord[2] as NoteBlock;
    const mAt = blocksAt[2] as NoteBlock;
    const mSym = blocksSymbol[2] as NoteBlock;
    expect(mWord.variant).toBe('tip');
    expect(mAt.variant).toBe('tip');
    expect(mSym.variant).toBe('tip');
    expect(mWord.text).toBe(mAt.text);
    expect(mWord.text).toBe(mSym.text);

    // 4. Savol-javob
    const qWord = blocksWord[3] as QaBlock;
    const qAt = blocksAt[3] as QaBlock;
    const qSym = blocksSymbol[3] as QaBlock;
    expect(qWord.question).toBe(qAt.question);
    expect(qWord.question).toBe(qSym.question);
    expect(qWord.answer).toBe(qAt.answer);
    expect(qWord.answer).toBe(qSym.answer);

    // 5. Ta'rif
    const dWord = blocksWord[4] as DefinitionBlock;
    const dAt = blocksAt[4] as DefinitionBlock;
    const dSym = blocksSymbol[4] as DefinitionBlock;
    expect(dWord.term).toBe(dAt.term);
    expect(dWord.term).toBe(dSym.term);
    expect(dWord.definition).toBe(dAt.definition);
    expect(dWord.definition).toBe(dSym.definition);
  });
});
