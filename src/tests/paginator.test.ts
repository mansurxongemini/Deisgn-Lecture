import { describe, it, expect } from 'vitest';
import { paginateDocument, isAtomicBlock } from '../services/paginator';
import type { LegalDocument } from '../schema/types';

describe('Paginator (9:16 Cards Architecture)', () => {
  it('Muqova (cover) va Mundarija (toc) kartalari to‘g‘ri yaratiladi', () => {
    const doc: LegalDocument = {
      version: 1,
      id: 'test-doc',
      title: 'Yuridik Sinov',
      cover: { enabled: true, institution: 'Toshkent Davlat Yuridik Universiteti' },
      toc: true,
      sections: [
        {
          id: 'sec-1',
          title: '1-bo‘lim',
          blocks: [{ id: 't1', type: 'text', text: 'Matn' }]
        },
        {
          id: 'sec-2',
          title: '2-bo‘lim',
          blocks: [{ id: 't2', type: 'text', text: 'Ikkinchi matn' }]
        }
      ]
    };

    const cards = paginateDocument(doc);
    expect(cards.length).toBeGreaterThanOrEqual(3);
    expect(cards[0].cardType).toBe('cover');
    expect(cards[1].cardType).toBe('toc');
    expect(cards[2].cardType).toBe('content');

    // Barcha kartalarda totalCards bir xil bo'lishi kerak
    expect(cards[0].totalCards).toBe(cards.length);
    expect(cards[cards.length - 1].totalCards).toBe(cards.length);
  });

  it('Atomik bloklar (note, definition) bo‘linmaydi, ammo case va qa endi xavfsiz bo‘linadi', () => {
    expect(isAtomicBlock({ id: '3', type: 'note', variant: 'warning', text: 'Warn' })).toBe(true);
    expect(isAtomicBlock({ id: '4', type: 'definition', term: 'T', definition: 'D' })).toBe(true);

    expect(isAtomicBlock({ id: '1', type: 'qa', question: 'Q', answer: 'A' })).toBe(false);
    expect(isAtomicBlock({ id: '2', type: 'case', title: 'Case', facts: 'F', rule: 'R', conclusion: 'C' })).toBe(false);
    expect(isAtomicBlock({ id: '5', type: 'list', items: ['A', 'B'] })).toBe(false);
    expect(isAtomicBlock({ id: '6', type: 'table', headers: ['H1'], rows: [['R1']] })).toBe(false);
  });

  it('Katta hajmli ro‘yxat kartalar bo‘yicha tabiiy chegarada bo‘linadi', () => {
    const longItems = Array.from({ length: 40 }, (_, i) => `Ro‘yxat bandi raqami: ${i + 1}`);
    const doc: LegalDocument = {
      version: 1,
      id: 'list-doc',
      title: 'Uzun Ro‘yxat',
      cover: { enabled: false },
      toc: false,
      sections: [
        {
          id: 'sec-list',
          title: 'Ro‘yxatlar Bo‘limi',
          blocks: [{ id: 'long-list', type: 'list', items: longItems }]
        }
      ]
    };

    const cards = paginateDocument(doc);
    expect(cards.length).toBeGreaterThan(1);
    expect(cards[0].blocks[0].type).toBe('list');
    expect(cards[1].blocks[0].type).toBe('list');
  });

  it('Haddan tashqari katta yakka blok (atomik taʼrif) uchun scale 0.85 gacha tushiriladi', () => {
    const hugeDefinition = 'Ushbu taʼrif yuridik qoidalar bo‘yicha juda katta hajmga ega. '.repeat(40);
    const doc: LegalDocument = {
      version: 1,
      id: 'huge-doc',
      title: 'Katta Matn',
      cover: { enabled: false },
      toc: false,
      sections: [
        {
          id: 'sec-huge',
          title: 'Katta Bo‘lim',
          blocks: [{ id: 'huge-def', type: 'definition', term: 'Yuridik atama', definition: hugeDefinition }]
        }
      ]
    };

    const cards = paginateDocument(doc);
    expect(cards.length).toBeGreaterThanOrEqual(1);
    expect(cards[0].scale).toBeDefined();
    expect(cards[0].scale).toBeGreaterThanOrEqual(0.85);
    expect(cards[0].scale).toBeLessThanOrEqual(1.0);
  });

  it('ACCEPTANCE [CONTENT-01]: Fuqarolik huquqi (civil_law.md) to‘liq nol yo‘qotish bilan sahifalanadi', async () => {
    const fs = await import('fs');
    const path = await import('path');
    const { parseMarkdownPlus } = await import('../schema/mdParser');

    const samplePath = path.resolve(__dirname, '../samples/civil_law.md');
    const rawMd = fs.readFileSync(samplePath, 'utf-8');
    const { document: doc } = parseMarkdownPlus(rawMd);

    const cards = paginateDocument(doc);
    expect(cards.length).toBeGreaterThanOrEqual(4);

    // 1. Case study xulosasi (Sud javobgarning fors-major...) to'liq mavjud
    const allText = cards
      .flatMap((c) => c.blocks)
      .map((b) => {
        if (b.type === 'case') {
          return `${b.title} ${b.facts || ''} ${b.rule || ''} ${b.conclusion || ''}`;
        }
        if (b.type === 'norm') return `${b.number} ${b.title} ${b.text}`;
        if (b.type === 'list') return (b.items || []).join(' ');
        if (b.type === 'table') return (b.rows || []).flat().join(' ');
        if (b.type === 'qa') return `${b.question} ${b.answer}`;
        return (b as any).text || '';
      })
      .join(' ');

    // Kazus sud xulosasi to'liq chiqishi shart (mid-sentence to'xtamasligi kerak)
    expect(allText).toContain('Sud javobgarning fors-major haqidagi vajlarini rad etdi');
    expect(allText).toContain('shartnomada belgilangan penya miqdorini da’vogar foydasiga undirdi');

    // Ro'yxatning 1-bandi (Oldi-sotdi va yetkazib berish) yo'qolmagan
    expect(allText).toContain('Oldi-sotdi va yetkazib berish shartnomalari');
    expect(allText).toContain('Kredit va qarz majburiyatlari');

    // 354-modda normasi to'liq mavjud
    expect(allText).toContain('354-modda');
    expect(allText).toContain('Shartnoma tuzishga majburlashga yo‘l qo‘yilmaydi');

    // Fleshkard savol va javobi to'liq mavjud
    expect(allText).toContain('Qanday holatlarda shartnoma tuzilgan deb hisoblanadi?');
    expect(allText).toContain('barcha muhim shartlari bo‘yicha qonunda talab qilingan shaklda kelishuvga erishilgan paytda');
  });
});
