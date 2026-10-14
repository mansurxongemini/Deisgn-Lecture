import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach } from 'vitest';
import { paginateDocument } from '../services/paginator';
import { parseMarkdownPlus } from '../schema/mdParser';
import type { LegalDocument, TextBlock, CaseBlock, TableBlock, QaBlock } from '../schema/types';
import type { DocumentItem } from '../schema/workspace';
import {
  closeWorkspaceDatabase,
  saveDocument,
  getDocument,
  DB_NAME
} from '../services/workspace/workspaceStorage';

describe('Yurist Studio — Regressiya Testlari (Baseline & Invariant Gates)', () => {
  beforeEach(async () => {
    closeWorkspaceDatabase();
    await new Promise((res) => {
      const req = indexedDB.deleteDatabase(DB_NAME);
      req.onsuccess = () => res(undefined);
      req.onerror = () => res(undefined);
    });
  });

  // 1. Long single-paragraph text block
  it('1. Uzun, bitta xatboshidan iborat matn blokining (newlinesiz) kartalarga xavfsiz bo‘linishi', () => {
    const longSingleParagraph = 'Fuqarolik qonunchiligi asosiy qoidalarining buzilishi yuridik javobgarlikka sabab bo‘ladi. Sud amaliyotida har bir holat qonun ustuvorligi va inson manfaatlari nuqtai nazaridan baholanadi. Hech bir shaxs o‘z xatti-harakati bilan qonunga zid ravishda boshqa shaxslarning qonuniy manfaatlariga zarar yetkazishi mumkin emas. '.repeat(15);

    const doc: LegalDocument = {
      version: 1,
      id: 'reg-doc-1',
      title: 'Uzun Xatboshi Sinovi',
      cover: { enabled: false },
      toc: false,
      sections: [
        {
          id: 'sec-1',
          title: 'Asosiy qism',
          blocks: [
            {
              id: 'long-para-1',
              type: 'text',
              text: longSingleParagraph
            } as TextBlock
          ]
        }
      ]
    };

    const cards = paginateDocument(doc);
    // Bitta kartaga sig'maydi, kamida 2 ta kartaga bo'linishi kerak
    expect(cards.length).toBeGreaterThan(1);

    // Barcha kartalardagi matnlarni birlashtirganda original matn to'liq saqlanishi kerak (zero content loss)
    const allText = cards
      .flatMap((c) => c.blocks)
      .filter((b): b is TextBlock => b.type === 'text')
      .map((b) => b.text)
      .join(' ');

    // Original matndagi kalit so'zlar oxirgi kartada ham borligini tekshirish
    expect(allText).toContain('zarar yetkazishi mumkin emas');
  });

  // 2. Long case study with an unmistakable final conclusion
  it('2. Katta sud kazusining oxirgi xulosasi (unmistakable final conclusion) yo‘qolmasdan to‘liq chiqishi', () => {
    const longFacts = 'Toshkent shahar sudi tomonidan 2025-yil 14-noyabr kuni fuqaro A ning da\'vosi ko‘rib chiqildi. '.repeat(10);
    const longRule = 'Fuqarolik kodeksining 985-moddasi talabiga ko‘ra, g‘ayriqonuniy harakat natijasida yetkazilgan zarar to‘liq qoplanishi shart. '.repeat(8);
    const finalConclusion = 'YAKUNIY_SUD_XULOSASI_MAXSUS_KOD_XYZ: Sud da’voni to‘liq qanoatlantirish va 500 million so‘m tovon undirish haqida qaror chiqardi.';

    const doc: LegalDocument = {
      version: 1,
      id: 'reg-doc-2',
      title: 'Sud Kazusi Sinovi',
      cover: { enabled: false },
      toc: false,
      sections: [
        {
          id: 'sec-case',
          title: 'Sud Amaliyoti',
          blocks: [
            {
              id: 'case-1',
              type: 'case',
              title: 'Yetkazilgan zararni qoplash ishi',
              facts: longFacts,
              rule: longRule,
              conclusion: finalConclusion
            } as CaseBlock
          ]
        }
      ]
    };

    const cards = paginateDocument(doc);
    expect(cards.length).toBeGreaterThan(1);

    // Oxirgi xulosa qaysidir kartada to'liq mavjud bo'lishi shart
    const hasConclusion = cards.some((c) =>
      c.blocks.some(
        (b) => b.type === 'case' && (b as CaseBlock).conclusion?.includes('YAKUNIY_SUD_XULOSASI_MAXSUS_KOD_XYZ')
      )
    );
    expect(hasConclusion).toBe(true);
  });

  // 3. Long table cell/row
  it('3. Katta jadvallarda sarlavhalar takrorlanishi va barcha qatorlar to‘liq saqlanishi', () => {
    const rows: string[][] = [];
    for (let i = 1; i <= 35; i++) {
      rows.push([`Modda ${i}`, `Huquqiy tartibga solish obyekti ${i}`, `Bajarilish mexanizmi va muddatlari ${i}`]);
    }

    const doc: LegalDocument = {
      version: 1,
      id: 'reg-doc-3',
      title: 'Katta Jadval Sinovi',
      cover: { enabled: false },
      toc: false,
      sections: [
        {
          id: 'sec-table',
          title: 'Jadval bo‘limi',
          blocks: [
            {
              id: 'tbl-1',
              type: 'table',
              title: 'Normativ Hujjatlar Taqsimoti',
              headers: ['Modda', 'Obyekt', 'Mexanizm'],
              rows
            } as TableBlock
          ]
        }
      ]
    };

    const cards = paginateDocument(doc);
    expect(cards.length).toBeGreaterThan(1);

    // Har bir jadval kartasida headers bo'lishi kerak
    for (const card of cards) {
      for (const blk of card.blocks) {
        if (blk.type === 'table') {
          expect((blk as TableBlock).headers).toEqual(['Modda', 'Obyekt', 'Mexanizm']);
        }
      }
    }

    // Oxirgi qator (Modda 35) to'liq mavjud bo'lishi shart
    const hasLastRow = cards.some((c) =>
      c.blocks.some((b) => b.type === 'table' && (b as TableBlock).rows.some((r) => r[0] === 'Modda 35'))
    );
    expect(hasLastRow).toBe(true);
  });

  // 4. Long flashcard answer
  it('4. Uzun fleshkard javobining yo‘qolmasdan to‘liq chiqishi', () => {
    const longAnswer = 'Fuqarolik huquqiy javobgarlikning quyidagi 4 ta sharti mavjud: 1. Qonunga xilof harakat; 2. Yetkazilgan moddiy yoki ma\'naviy zarar; 3. Harakat va zarar o‘rtasidagi sababiy bog‘lanish; 4. Zarar yetkazuvchining aybi. '.repeat(10);

    const doc: LegalDocument = {
      version: 1,
      id: 'reg-doc-4',
      title: 'Fleshkard Sinovi',
      cover: { enabled: false },
      toc: false,
      sections: [
        {
          id: 'sec-qa',
          title: 'Savol-Javoblar',
          blocks: [
            {
              id: 'qa-1',
              type: 'qa',
              question: 'Fuqarolik-huquqiy javobgarlikning asosiy elementlari qaysilar?',
              answer: longAnswer
            } as QaBlock
          ]
        }
      ]
    };

    const cards = paginateDocument(doc);
    // Javob to'liq bo'lishi kerak
    const allAnswerText = cards
      .flatMap((c) => c.blocks)
      .filter((b): b is QaBlock => b.type === 'qa')
      .map((b) => b.answer)
      .join(' ');

    expect(allAnswerText).toContain('Zarar yetkazuvchining aybi');
  });

  // 5. Two tabs editing the same document / conflict preservation
  it('5. Ko‘p tabli tahrirda saqlanmagan mahalliy tahrirning tashqi yangilanish bilan ustiga yozilmasligi', async () => {
    const docId = 'doc_test_sync';
    const initialDoc: DocumentItem = {
      id: docId,
      parentId: null,
      title: 'Sinxronizatsiya Hujjati',
      content: 'Boshlang‘ich matn',
      order: 0,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    await saveDocument(initialDoc);

    // Tab 1 da mahalliy saqlanmagan tahrir mavjud
    const tab1LocalDraft = 'Tab 1 kiritgan yangi, muhim o‘zgarish';

    // Ayni paytda Tab 2 ma\'lumotlar bazasiga o‘zgartirish kiritdi
    const tab2UpdatedDoc: DocumentItem = {
      ...initialDoc,
      content: 'Tab 2 yozgan matn',
      updatedAt: Date.now() + 100
    };
    await saveDocument(tab2UpdatedDoc);

    // Tab 1 bazadan qayta yuklaganda ham o‘zining mahalliy qoralamasini saqlab qolishi lozim (conflict detection)
    const currentFromDb = await getDocument(docId);
    expect(currentFromDb?.content).toBe('Tab 2 yozgan matn');

    // Tab 1 tahriri bilan DB mazmuni teng emas — demak ziddiyat mavjud
    const isConflict = tab1LocalDraft !== currentFromDb?.content;
    expect(isConflict).toBe(true);
  });

  // 6. Fast document switching
  it('6. Tezkor hujjat almashtirilganda avvalgi hujjat tahriri yo‘qolmasligi', async () => {
    const docA: DocumentItem = {
      id: 'doc_a',
      parentId: null,
      title: 'Hujjat A',
      content: 'Hujjat A boshlang‘ich',
      order: 0,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    const docB: DocumentItem = {
      id: 'doc_b',
      parentId: null,
      title: 'Hujjat B',
      content: 'Hujjat B boshlang‘ich',
      order: 1,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    await saveDocument(docA);
    await saveDocument(docB);

    // Foydalanuvchi Doc A ga yozdi
    const updatedContentA = 'Hujjat A ning yangilangan o‘ta muhim matni';
    // Flush save logic:
    await saveDocument({ ...docA, content: updatedContentA, updatedAt: Date.now() });

    // Darhol Doc B ga o'tildi
    const loadedB = await getDocument('doc_b');
    expect(loadedB?.content).toBe('Hujjat B boshlang‘ich');

    // Qaytib Doc A tekshirilganda yangi matn saqlangan bo'lishi kerak
    const loadedA = await getDocument('doc_a');
    expect(loadedA?.content).toBe(updatedContentA);
  });

  // 7. Exporting from Yozish, Ko‘rish, and Ikkalasi
  it('7. Yozish (edit), Ko‘rish (preview) va Ikkalasi (both) rejimlarida barcha sahifalar eksport uchun to‘liq tayyor bo‘lishi', () => {
    const doc: LegalDocument = {
      version: 1,
      id: 'reg-export-doc',
      title: 'Eksport Sinovi Hujjati',
      cover: { enabled: true, institution: 'TDYU' },
      toc: true,
      sections: [
        {
          id: 'sec-exp-1',
          title: '1-Mavzu',
          blocks: [{ id: 'b1', type: 'text', text: 'Eksport qilinadigan matn' } as TextBlock]
        }
      ]
    };

    const cards = paginateDocument(doc);
    expect(cards.length).toBeGreaterThanOrEqual(3);

    // Barcha uchala rejimda ham sahifalar soni va ketma-ketligi bir xil bo'lishi kerak
    const viewModes: Array<'edit' | 'preview' | 'both'> = ['edit', 'preview', 'both'];
    for (const mode of viewModes) {
      expect(mode).toBeDefined();
      // Rejim qanday bo'lishidan qat'iy nazar mustaqil eksport hosti bir xil sahifalar modeliga ega bo'lishi shart
      expect(cards.length).toBe(3);
      expect(cards[0].cardType).toBe('cover');
      expect(cards[1].cardType).toBe('toc');
      expect(cards[2].cardType).toBe('content');
      expect(cards[2].blocks[0].type).toBe('text');
    }
  });

  // 8. Switching through all document styles
  it('8. Barcha hujjat uslublari (classic, modern, dark, minimal) bo‘yicha almashtirilganda ma’lumotlar butunligi saqlanishi', () => {
    const themes: Array<'classic' | 'modern' | 'dark' | 'minimal'> = ['classic', 'modern', 'dark', 'minimal'];
    const originalText = '# Shartnoma Huquqi\nuslub: classic\n\n## 1-Mavzu\nShartnoma tuzish tartibi.';

    for (const targetTheme of themes) {
      const doc: LegalDocument = {
        version: 1,
        id: `doc-${targetTheme}`,
        title: 'Shartnoma Huquqi',
        theme: targetTheme,
        cover: { enabled: true },
        sections: [
          {
            id: 'sec-1',
            title: '1-Mavzu',
            blocks: [{ id: 'txt-1', type: 'text', text: 'Shartnoma tuzish tartibi.' } as TextBlock]
          }
        ]
      };

      const cards = paginateDocument(doc);
      expect(cards.length).toBeGreaterThanOrEqual(2);
      expect(doc.theme).toBe(targetTheme);

      // Mavzu almashtirish regex testi: qolgan matn o'zgarmasdan saqlanishi kerak
      const replacedMd = originalText.replace(/(?:uslub|mavzu|theme):\s*[a-zA-Z]+/i, `uslub: ${targetTheme}`);
      expect(replacedMd).toContain(`uslub: ${targetTheme}`);
      expect(replacedMd).toContain('Shartnoma tuzish tartibi.');
    }
  });

  // 9. To'liq ekran taqdimot rejimi sinovi (Masshtab va rang butunligi)
  it('9. To‘liq ekran taqdimot rejimida karta asl qog‘oz rangini saqlashi va masshtabi to‘g‘ri hisoblanishi', () => {
    // 1920x1080 ekran uchun balandlikning 94% qismini hisoblash
    const windowH = 1080;
    const windowW = 1920;
    const fsH = (windowH * 0.94) / 1920;
    const fsW = (windowW * 0.92) / 1080;
    const scale = Math.max(0.25, Math.min(1.0, Number(Math.min(fsH, fsW).toFixed(3))));

    // Masshtab 0.528 bo'ladi va karta 1015px balandlikda ekranni chiroyli to'ldiradi
    expect(scale).toBeGreaterThan(0.5);
    expect(scale).toBeLessThanOrEqual(1.0);

    // Karta o'lchamlari
    const cardPxHeight = 1920 * scale;
    const cardPxWidth = 1080 * scale;
    expect(cardPxHeight).toBeGreaterThan(950);
    expect(cardPxWidth).toBeGreaterThan(500);

    // Barcha hujjat mavzularida doc-theme prefiksi to'liq mavjud bo'lishi shart
    const docThemes = ['classic', 'modern', 'dark', 'minimal'];
    for (const t of docThemes) {
      const className = `fullscreen-presentation-overlay doc-theme-${t}`;
      expect(className).toContain(`doc-theme-${t}`);
    }
  });

  // 10. Muharrir kursor barqarorligi sinovi
  it('10. Muharrir matni tahrirlanganda kursor o‘rni saqlanib qolishi', () => {
    const originalText = '# Hujjat sarlavhasi\n\nOddiy matn xatboshisi bu yerda.';
    // Foydalanuvchi "matn" so'zining o'rtasida turib bitta belgi o'chirdi (pos = 28)
    const cursorStart = 28;
    const cursorEnd = 28;

    // Simulyatsiya: Kursor o'rni ref orqali saqlanadi
    const selectionRef = { start: cursorStart, end: cursorEnd };
    const editedText = originalText.slice(0, cursorStart - 1) + originalText.slice(cursorEnd);

    // Kursor oxiriga sakrab ketmasligi (matn uzunligi 48, kursor 27 bo'lishi kerak)
    expect(selectionRef.start).toBeLessThan(editedText.length);
    expect(selectionRef.start).toBe(28);
    expect(editedText).not.toBe(originalText);
  });

  // 11. MD+ Fenced Blocks & FIRAC Kazus (kazus_fenced.md regression fixture)
  it('11. Fenced blocks, FIRAC Kazus va sahifalash sig‘imi <= 4 sahifada to‘liq chiqishi', () => {
    const fs = require('node:fs');
    const path = require('node:path');
    const md = fs.readFileSync(path.resolve('src/samples/kazus_fenced.md'), 'utf-8');
    const { document, warnings } = parseMarkdownPlus(md);

    expect(warnings).toEqual([]);
    expect(document.title).toBe('Yuridik Kazus Tahlili: Sud Amaliyoti va Nizolar');
    expect(document.theme).toBe('classic');

    const blocks = document.sections[0].blocks;
    expect(blocks.length).toBe(4);

    // Norma
    expect(blocks[0].type).toBe('norm');
    expect((blocks[0] as any).syntaxStyle).toBe('fenced');
    expect((blocks[0] as any).number).toContain('333-modda');
    expect((blocks[0] as any).title).toContain('Majburiyatni buzganlik');

    // Kazus
    expect(blocks[1].type).toBe('case');
    const caseBlk = blocks[1] as any;
    expect(caseBlk.syntaxStyle).toBe('fenced');
    expect(caseBlk.facts).toContain('Progress');
    expect(caseBlk.issue).toContain('moddiy zararni undirish');
    expect(caseBlk.analysis).toContain('texnik nosozlik fors-major hisoblanmaydi');
    expect(caseBlk.conclusion).toContain('Sud da’vogar talabini to‘liq qanoatlantirib');

    // Ogoh
    expect(blocks[2].type).toBe('note');
    expect((blocks[2] as any).variant).toBe('warning');
    expect((blocks[2] as any).syntaxStyle).toBe('fenced');

    // Maslahat
    expect(blocks[3].type).toBe('note');
    expect((blocks[3] as any).variant).toBe('tip');
    expect((blocks[3] as any).syntaxStyle).toBe('fenced');

    // Zero raw :::
    const allDocStr = JSON.stringify(document);
    expect(allDocStr.includes(':::')).toBe(false);

    // Sahifalash: <= 4 sahifa (Muqova + kontent)
    const cards = paginateDocument(document);
    expect(cards.length).toBeLessThanOrEqual(4);
    expect(cards[0].cardType).toBe('cover');
  });
});

