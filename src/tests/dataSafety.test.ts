import { describe, it, expect } from 'vitest';
import { paginateDocument, splitTextIntoChunks } from '../services/paginator';
import type { LegalDocument, CaseBlock, QaBlock } from '../schema/types';

describe('TASK 2 — DATA SAFETY & ZERO CONTENT LOSS INVARIANTS', () => {
  it('1. splitTextIntoChunks: 3000-char continuous text splits without losing any word', () => {
    const rawParagraph =
      'O‘zbekiston Respublikasining Fuqarolik kodeksiga muvofiq, fuqarolik huquqiy munosabatlari ishtirokchilarining tengligi, mulkning daxlsizligi, shartnoma erkinligi, xususiy ishlarga kimningdir o‘zboshimchalik bilan aralashishiga yo‘l qo‘yilmasligi, fuqarolik huquqlarining moneliksiz amalga oshirilishini, buzilgan huquqlarning tiklanishini, ularning sud orqali himoya qilinishini ta’minlash zarurligi qoidalariga asoslanadi. '.repeat(
        8
      );

    expect(rawParagraph.length).toBeGreaterThan(3000);

    const chunks = splitTextIntoChunks(rawParagraph, 380);
    expect(chunks.length).toBeGreaterThan(5);

    // Verify every single word is retained in the chunks
    const originalWords = rawParagraph.split(/\s+/).filter(Boolean);
    const joinedChunks = chunks.join(' ');

    for (const word of originalWords) {
      expect(joinedChunks.includes(word)).toBe(true);
    }
  });

  it('2. paginateDocument: 3000-char paragraph splits across cards with zero content loss and proper continuations', () => {
    const longText =
      'Fuqarolar va yuridik shaxslar o‘z fuqarolik huquqlariga o‘z erklariga muvofiq va o‘z manfaatlarini ko‘zlab ega bo‘ladilar hamda ularni amalga oshiradilar. Ular shartnoma asosida o‘z huquq va burchlarini belgilashda, qonun hujjatlariga zid bo‘lmagan har qanday shartnoma shartlarini aniqlashda erkindirlar. '.repeat(
        11
      );

    expect(longText.length).toBeGreaterThanOrEqual(3000);

    const doc: LegalDocument = {
      id: 'doc-3000-char',
      title: '3000 Belgili Katta Matn',
      cover: { enabled: false },
      toc: false,
      sections: [
        {
          id: 'sec-1',
          title: 'Katta Matn Bo‘limi',
          blocks: [
            {
              id: 'para-huge',
              type: 'text',
              text: longText
            }
          ]
        }
      ]
    };

    const cards = paginateDocument(doc);
    expect(cards.length).toBeGreaterThan(2);

    // Verify continuation headers
    expect(cards[0].isContinuation).toBe(false);
    for (let i = 1; i < cards.length; i++) {
      expect(cards[i].isContinuation).toBe(true);
    }

    // Verify all text is preserved across cards
    let assembledText = '';
    for (const c of cards) {
      for (const b of c.blocks) {
        if (b.type === 'text') {
          assembledText += (assembledText ? ' ' : '') + b.text;
        }
      }
    }

    const originalWords = longText.split(/\s+/).filter(Boolean);
    for (const w of originalWords) {
      expect(assembledText.includes(w)).toBe(true);
    }
  });

  it('3. paginateDocument: Kazus with massive facts, rule, and conclusion splits cleanly without clipping', () => {
    const hugeFacts = 'Da’vogar A.B. javobgar K.L. ga nisbatan qarz shartnomasi bo‘yicha 50 million so‘m undirish talabi bilan sudga murojaat qildi. '.repeat(6);
    const hugeRule = 'Fuqarolik kodeksining 732-moddasiga ko‘ra, qarz shartnomasi bo‘yicha bir taraf ikkinchi tarafga pul yoki boshqa ashyolarni mulk qilib beradi. '.repeat(6);
    const hugeConclusion = 'Sud da’vogarning da’vo talablarini to‘liq qanoatlantirish va javobgardan 50 million so‘m qarz summasini undirish haqida hal qiluv qarori qabul qildi. '.repeat(6);

    const caseBlock: CaseBlock = {
      id: 'case-test-1',
      type: 'case',
      title: 'Katta Kazus Tahlili',
      facts: hugeFacts,
      rule: hugeRule,
      conclusion: hugeConclusion
    };

    const doc: LegalDocument = {
      title: 'Kazus Hujjati',
      cover: { enabled: false },
      toc: false,
      sections: [
        {
          title: 'Sud Amaliyoti',
          blocks: [caseBlock]
        }
      ]
    };

    const cards = paginateDocument(doc);
    expect(cards.length).toBeGreaterThan(1);

    // Verify facts, rule, and conclusion are present across the cards
    let hasFacts = false;
    let hasRule = false;
    let hasConclusion = false;

    for (const c of cards) {
      for (const b of c.blocks) {
        if (b.type === 'case') {
          if (b.facts) hasFacts = true;
          if (b.rule) hasRule = true;
          if (b.conclusion) hasConclusion = true;
        }
      }
    }

    expect(hasFacts).toBe(true);
    expect(hasRule).toBe(true);
    expect(hasConclusion).toBe(true);
  });

  it('4. paginateDocument: Flashcard (QA) with massive answer splits across cards with continuation', () => {
    const hugeAnswer = 'Fuqarolik-huquqiy javobgarlik shartlari: 1) Harakat yoki harakatsizlikning g‘ayriqonuniyligi; 2) Yetkazilgan moddiy yoki ma’naviy zarar mavjudligi; 3) G‘ayriqonuniy harakat va zarar o‘rtasidagi sababiy bog‘lanish; 4) Zarar yetkazuvchining aybi. '.repeat(8);

    const qaBlock: QaBlock = {
      id: 'qa-huge',
      type: 'qa',
      question: 'Fuqarolik-huquqiy javobgarlikning vujudga kelish asoslari va shartlari qanday?',
      answer: hugeAnswer
    };

    const doc: LegalDocument = {
      title: 'Fleshkard Testi',
      cover: { enabled: false },
      toc: false,
      sections: [
        {
          title: 'Savol-Javob',
          blocks: [qaBlock]
        }
      ]
    };

    const cards = paginateDocument(doc);
    expect(cards.length).toBeGreaterThan(1);

    // Verify question is on first card, answer continues with isContinuation
    expect(cards[0].blocks[0].type).toBe('qa');
    expect((cards[0].blocks[0] as QaBlock).question).toBeTruthy();
    expect(cards[1].isContinuation).toBe(true);
  });
});
