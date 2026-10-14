import type {
  LegalDocument,
  Block,
  NormBlock,
  TableBlock,
  ListBlock,
  TextBlock,
  CaseBlock
} from '../schema/types';

export interface StudyCard {
  id: string;
  cardIndex: number; // 1-indexed
  totalCards: number;
  cardType: 'cover' | 'toc' | 'content';
  sectionTitle?: string;
  sectionSubtitle?: string;
  blocks: Block[];
  isContinuation?: boolean;
  scale?: number;
  warnings?: string[];
  sectionSourceLine?: number;
  sectionSubtitleSourceLine?: number;
}

export interface MeasuredHeights {
  sectionHeaders?: Record<string, number>;
  blocks?: Record<string, number>;
  tableHeaders?: Record<string, number>;
  tableRows?: Record<string, number[]>;
  listItems?: Record<string, number[]>;
  normParas?: Record<string, number[]>;
  caseSteps?: Record<string, { header: number; facts: number; rule: number; conclusion: number }>;
}

// 1080 x 1920 o'quv kartasining sof balandlik byudjetlari (pikselda):
// Jami karta balandligi: 1920px
// Yuqori/pastki padding: 80px + 80px = 160px
// Karta yuqori kolontituli (header): ~90px
// Karta quyi kolontituli (footer): ~90px
// Card content area sof balandligi (clientHeight): 1500px (1920 - 160 - 90 - 90 - 80 margin/gap)
// Xavfsiz sof kontent sig'imi (zero-clipping mutlaq kafolati): 1400px
export const CARD_BODY_MAX_HEIGHT = 1460;
export const SECTION_HEADER_HEIGHT = 150; // Sarlavha + kichik sarlavha + ajratuvchi bo'shliq
export const CONTINUATION_BADGE_HEIGHT = 60; // "(davomi)" belgisi (26px shrift)
export const BLOCK_GAP = 28; // Bloklar orasidagi bo'shliq

/**
 * Blokni bo'lish mumkin bo'lmagan kichik yaxlit blokmi ekanligini tekshiradi.
 * Kazus (case) va fleshkard (qa) endi bo'linadigan bloklar toifasiga kiritilgan!
 */
export function isAtomicBlock(block: Block): boolean {
  return ['note', 'flow', 'compare', 'definition'].includes(block.type);
}

/**
 * Blok balandligini hisoblash (eski testlar bilan moslik uchun)
 */
export function estimateBlockHeight(block: Block): number {
  return measureBlockHeight(block);
}

/**
 * Matn uzunligi va qator parametrlariga ko'ra balandlikni hisoblaydi (32px asosiy shrift, 1.55 line-height)
 */
export function estimateTextHeight(
  text: string,
  fontSize: number = 32,
  lineHeightRatio: number = 1.55,
  charsPerLine: number = 52
): number {
  if (!text) return 0;
  const paragraphs = text.split(/\n+/).filter(Boolean);
  let totalH = 0;
  for (const para of paragraphs) {
    const lines = Math.max(1, Math.ceil(para.length / charsPerLine));
    totalH += lines * (fontSize * lineHeightRatio) + 16;
  }
  return totalH;
}

/**
 * Matnni karta sig'imi (maxCharsPerChunk) bo'yicha tabiiy chegaralarda (gaplar yoki so'zlar) bo'ladi.
 * Hech bir belgi yoki jumla yo'qotilmaydi.
 */
export function splitTextIntoChunks(text: string, maxCharsPerChunk: number = 420): string[] {
  if (!text || text.length <= maxCharsPerChunk) return [text];

  const chunks: string[] = [];
  const sentences = text.match(/[^.!?\n]+[.!?\n]+|[^.!?\n]+$/g) || [text];

  let currentChunk = '';
  for (const sentence of sentences) {
    if ((currentChunk + sentence).length <= maxCharsPerChunk) {
      currentChunk += sentence;
    } else {
      if (currentChunk.trim()) {
        chunks.push(currentChunk.trim());
        currentChunk = '';
      }
      if (sentence.length > maxCharsPerChunk) {
        const words = sentence.split(/\s+/);
        let wordChunk = '';
        for (const word of words) {
          if ((wordChunk + ' ' + word).length <= maxCharsPerChunk) {
            wordChunk += (wordChunk ? ' ' : '') + word;
          } else {
            if (wordChunk.trim()) chunks.push(wordChunk.trim());
            wordChunk = word;
          }
        }
        if (wordChunk.trim()) currentChunk = wordChunk;
      } else {
        currentChunk = sentence;
      }
    }
  }

  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }

  return chunks.length > 0 ? chunks : [text];
}

/**
 * Jadvalning bitta qatori balandligini hisoblaydi (42px td shrift, ko'p qatorli o'ralish)
 */
export function measureTableRowHeight(row: string[], colCount: number = 4): number {
  let maxCellLen = 1;
  for (const cell of row) {
    if (cell && cell.length > maxCellLen) maxCellLen = cell.length;
  }
  const charsPerCol = Math.max(12, Math.floor(64 / colCount));
  const lines = Math.max(1, Math.ceil(maxCellLen / charsPerCol));
  return 40 + lines * 56;
}

/**
 * Jadval sarlavhasi (caption + thead) balandligi (36px th, 34px caption)
 */
export function measureTableHeaderHeight(table: TableBlock): number {
  let base = 140; // thead th padding + 36px shrift
  if (table.title) base += 50;
  return base;
}

/**
 * Ro'yxatning bitta bandi balandligi (42px shrift)
 */
export function measureListItemHeight(item: string): number {
  const lines = Math.max(1, Math.ceil((item || '').length / 36));
  return lines * 72 + 50;
}

/**
 * Qonun normasining bitta bandi (xatboshisi) balandligi (32px shrift)
 */
export function measureNormParagraphHeight(para: string): number {
  const lines = Math.max(1, Math.ceil((para || '').length / 52));
  return lines * (32 * 1.55) + 16;
}

/**
 * Kazus bosqichi balandligini hisoblaydi (faktlar, masala, norma, tahlil, xulosa)
 */
export function measureCaseStepHeight(text?: string): number {
  if (!text) return 0;
  const bodyH = estimateTextHeight(text, 32, 1.55, 52);
  return bodyH + 45; // 30px label + 15px padding/margin
}

/**
 * Blokning aniq balandligini hisoblaydi
 */
export function measureBlockHeight(block: Block): number {
  switch (block.type) {
    case 'text': {
      return estimateTextHeight(block.text || (block as any).content || '', 32, 1.55, 52) + 20;
    }
    case 'list': {
      const items = block.items || [];
      const itemsH = items.reduce((acc, it) => acc + measureListItemHeight(it), 0);
      return itemsH + 40;
    }
    case 'table': {
      const headH = measureTableHeaderHeight(block);
      const rowsH = (block.rows || []).reduce((acc, row) => acc + measureTableRowHeight(row), 0);
      return headH + rowsH + 24;
    }
    case 'qa': {
      const qH = block.question ? estimateTextHeight(block.question, 36, 1.45, 48) : 0;
      const aH = block.answer ? estimateTextHeight(block.answer, 32, 1.55, 52) : 0;
      return qH + aH + 90; // header meta + answer tag + padding + margin
    }
    case 'norm': {
      const paras = (block.text || '').split(/\n+/).filter(Boolean);
      const parasH = paras.reduce((acc, p) => acc + measureNormParagraphHeight(p), 0);
      return parasH + 180; // plaque padding + badge + title + source/date + margin
    }
    case 'definition': {
      const bodyH = estimateTextHeight(block.definition || '', 32, 1.55, 52);
      return bodyH + 120;
    }
    case 'case': {
      const fH = measureCaseStepHeight(block.facts);
      const iH = measureCaseStepHeight(block.issue);
      const rH = measureCaseStepHeight(block.rule);
      const aH = measureCaseStepHeight(block.analysis);
      const cH = measureCaseStepHeight(block.conclusion);
      return fH + iH + rH + aH + cH + 140; // header + padding + margin
    }
    case 'compare': {
      const items = (block.items || []);
      const maxPoints = Math.max(0, ...items.map(it => (it.points || []).length));
      return maxPoints * 90 + 160;
    }
    case 'flow': {
      const stepCount = (block.steps || []).length;
      return stepCount * 120 + 60;
    }
    case 'timeline': {
      const count = (block.events || []).length;
      return count * 130 + 60;
    }
    case 'note': {
      const contentH = estimateTextHeight(block.text || (block as any).content || '', 32, 1.55, 52);
      return contentH + 90;
    }
    default:
      return 200;
  }
}

/**
 * Hujjatni avtomatik ravishda 9:16 vertikal kartalarga taqsimlaydi.
 * Invariant kafolatlari:
 * 1. ZERO CONTENT LOSS: Har bir paragraf, ro'yxat bandi, jadval qatori, norma, kazus bosqichi va QA to'liq chiqadi.
 * 2. ZERO CLIPPING: Hech bir kartada kontent balandligi karta sig'imidan oshmaydi.
 * 3. HEADINGS: Bo'lim sarlavhasi faqat o'sha bo'limning 1-kartasida chiqadi.
 * 4. CONTINUATIONS: Bo'lingan jadvallarda, kazuslarda, ro'yxatlarda ustunlar/sarlavhalar va "(davomi)" belgisi takrorlanadi.
 */
export function paginateDocument(doc: LegalDocument, measured?: MeasuredHeights): StudyCard[] {
  const cards: StudyCard[] = [];
  let cardSeq = 1;

  // 1. Muqova kartasi (Cover card)
  if (doc.cover?.enabled !== false) {
    cards.push({
      id: `${doc.id || 'doc'}-card-cover`,
      cardIndex: cardSeq++,
      totalCards: 1,
      cardType: 'cover',
      blocks: []
    });
  }

  // 2. Mundarija kartasi (TOC card)
  // Bo‘limlar soni 1 ta bo‘lsa va majburiy so‘ralmagan bo‘lsa, mundarija kartasi avtomatik tarzda tashlab ketiladi
  const shouldRenderToc = doc.toc === true || (doc.toc === undefined && Boolean(doc.sections && doc.sections.length > 1));
  if (shouldRenderToc && doc.sections && doc.sections.length > 0) {
    const SECTIONS_PER_TOC_CARD = 7;
    const tocCardCount = Math.ceil(doc.sections.length / SECTIONS_PER_TOC_CARD);

    for (let t = 0; t < tocCardCount; t++) {
      const sliceStart = t * SECTIONS_PER_TOC_CARD;
      const sliceEnd = sliceStart + SECTIONS_PER_TOC_CARD;
      const tocSections = doc.sections.slice(sliceStart, sliceEnd);

      const tocListBlock: ListBlock = {
        id: `toc-list-${t + 1}`,
        type: 'list',
        ordered: true,
        items: tocSections.map((sec) => sec.title)
      };

      cards.push({
        id: `${doc.id || 'doc'}-card-toc-${t + 1}`,
        cardIndex: cardSeq++,
        totalCards: 1,
        cardType: 'toc',
        sectionTitle: t === 0 ? 'Mundarija' : 'Mundarija (davomi)',
        blocks: [tocListBlock]
      });
    }
  }

  // 3. Bo'limlarni kartalarga taqsimlash
  for (const section of doc.sections || []) {
    let currentCardBlocks: Block[] = [];
    let currentUsedHeight = 0;
    let isCurrentCardFirstInSection = true;

    const sectionHeaderH = (measured?.sectionHeaders?.[section.title]) ?? SECTION_HEADER_HEIGHT;

    // Joriy kartadagi erkin sig'im (byudjet)
    const getAvailableBudget = (): number => {
      const budgetMax = isCurrentCardFirstInSection
        ? CARD_BODY_MAX_HEIGHT - sectionHeaderH
        : CARD_BODY_MAX_HEIGHT - CONTINUATION_BADGE_HEIGHT;
      return Math.max(120, budgetMax - currentUsedHeight);
    };

    const flushCard = () => {
      if (currentCardBlocks.length === 0) return;

      const budgetMax = isCurrentCardFirstInSection
        ? CARD_BODY_MAX_HEIGHT - sectionHeaderH
        : CARD_BODY_MAX_HEIGHT - CONTINUATION_BADGE_HEIGHT;

      let scale: number | undefined = undefined;
      let warnings: string[] | undefined = undefined;
      if (currentUsedHeight > budgetMax) {
        scale = Math.max(0.85, Number((budgetMax / currentUsedHeight).toFixed(2)));
        if (scale < 0.9) {
          warnings = ['Katta hajm sababli shrift masshtabi moslashtirildi.'];
        }
      }

      cards.push({
        id: `${section.id || 'sec'}-card-${cardSeq}`,
        cardIndex: cardSeq++,
        totalCards: 1,
        cardType: 'content',
        sectionTitle: section.title,
        sectionSubtitle: isCurrentCardFirstInSection ? section.subtitle : undefined,
        sectionSourceLine: section.sourceLine,
        sectionSubtitleSourceLine: section.subtitleSourceLine,
        blocks: currentCardBlocks,
        isContinuation: !isCurrentCardFirstInSection,
        scale,
        warnings
      });

      currentCardBlocks = [];
      currentUsedHeight = 0;
      isCurrentCardFirstInSection = false;
    };

    const getBlockMultiplier = (bId?: string): number => {
      if (!bId || !doc.blockOverrides) return 1.0;
      const ov = doc.blockOverrides[bId] || doc.blockOverrides[bId.replace(/-p\d+$/, '').replace(/-step\d+$/, '')];
      if (ov?.size === 'S') return 0.88;
      if (ov?.size === 'L') return 1.16;
      return 1.0;
    };

    for (const block of section.blocks || []) {
      // ----------------------------------------------------
      // A. JADVAL BLOKI (TABLE) — Qatorma-qator taqsimlash
      // ----------------------------------------------------
      if (block.type === 'table') {
        const rows = block.rows || [];
        const blockId = block.id || '';
        const tableHeaderH = (measured?.tableHeaders?.[blockId]) ?? measureTableHeaderHeight(block);
        const colCount = (block.headers || []).length || 4;
        const getRowH = (r: string[], idx: number) =>
          (measured?.tableRows?.[blockId]?.[idx]) ?? measureTableRowHeight(r, colCount);

        const totalRowsH = rows.reduce((acc, r, i) => acc + getRowH(r, i), 0);
        const totalTableH = tableHeaderH + totalRowsH + 30;

        if (totalTableH <= getAvailableBudget()) {
          currentCardBlocks.push(block);
          currentUsedHeight += totalTableH;
          continue;
        }

        if (currentCardBlocks.length > 0 && (tableHeaderH + (rows[0] ? getRowH(rows[0], 0) : 0) > getAvailableBudget())) {
          flushCard();
        }

        let rowIndex = 0;
        let isTableContinuation = false;

        while (rowIndex < rows.length) {
          const availBudget = getAvailableBudget();
          const headH = tableHeaderH + (isTableContinuation ? 60 : 0);
          const rowsBudget = availBudget - headH - 30;

          let count = 0;
          let accumulatedRowsH = 0;

          while (rowIndex + count < rows.length) {
            const nextRowH = getRowH(rows[rowIndex + count], rowIndex + count);
            if (accumulatedRowsH + nextRowH <= rowsBudget) {
              accumulatedRowsH += nextRowH;
              count++;
            } else {
              break;
            }
          }

          if (count === 0 && currentCardBlocks.length === 0) {
            count = 1;
            accumulatedRowsH = getRowH(rows[rowIndex], rowIndex);
          } else if (count === 0) {
            flushCard();
            continue;
          }

          const chunkRows = rows.slice(rowIndex, rowIndex + count);
          const tableChunk: TableBlock = {
            ...block,
            id: `${block.id || 'tbl'}-p${rowIndex + 1}`,
            title: isTableContinuation ? (block.title ? `${block.title} (davomi)` : 'Jadval (davomi)') : block.title,
            headers: block.headers, // Barcha davomiy kartalarda takrorlanadi
            rows: chunkRows
          };

          currentCardBlocks.push(tableChunk);
          currentUsedHeight += headH + accumulatedRowsH + 24;
          rowIndex += count;
          isTableContinuation = true;

          if (rowIndex < rows.length) {
            flushCard();
          }
        }
        continue;
      }

      // ----------------------------------------------------
      // B. RO'YXAT BLOKI (LIST) — Bandma-band taqsimlash
      // ----------------------------------------------------
      if (block.type === 'list') {
        const items = block.items || [];
        const blockId = block.id || '';
        const getItemH = (it: string, idx: number) =>
          (measured?.listItems?.[blockId]?.[idx]) ?? measureListItemHeight(it);
        const totalListH = items.reduce((acc, it, i) => acc + getItemH(it, i), 0) + 60;

        if (totalListH <= getAvailableBudget()) {
          currentCardBlocks.push(block);
          currentUsedHeight += totalListH;
          continue;
        }

        if (currentCardBlocks.length > 0 && (getItemH(items[0] || '', 0) + 60 > getAvailableBudget())) {
          flushCard();
        }

        let itemIndex = 0;
        while (itemIndex < items.length) {
          const availBudget = getAvailableBudget() - 50;
          let count = 0;
          let accH = 0;

          while (itemIndex + count < items.length) {
            const itH = getItemH(items[itemIndex + count], itemIndex + count);
            if (accH + itH <= availBudget) {
              accH += itH;
              count++;
            } else {
              break;
            }
          }

          if (count === 0 && currentCardBlocks.length === 0) {
            count = 1;
            accH = getItemH(items[itemIndex], itemIndex);
          } else if (count === 0) {
            flushCard();
            continue;
          }

          const chunkItems = items.slice(itemIndex, itemIndex + count);
          const listChunk: ListBlock = {
            ...block,
            id: `${block.id || 'lst'}-p${itemIndex + 1}`,
            items: chunkItems
          };

          currentCardBlocks.push(listChunk);
          currentUsedHeight += accH + 40;
          itemIndex += count;

          if (itemIndex < items.length) {
            flushCard();
          }
        }
        continue;
      }

      // ----------------------------------------------------
      // C. QONUN NORMASI (NORM) — Xatboshilar bo'yicha taqsimlash
      // ----------------------------------------------------
      if (block.type === 'norm') {
        const paragraphs = (block.text || '').split(/\n+/).filter(Boolean);
        const blockId = block.id || '';
        const bMult = getBlockMultiplier(blockId);
        const normHeaderH = Math.round(((block.title?.length || 0) > 40 ? 320 : 260) * bMult);
        const contNormHeaderH = Math.round(((block.title?.length || 0) > 40 ? 270 : 220) * bMult);
        const getParaH = (p: string, idx: number) =>
          Math.round(((measured?.normParas?.[blockId]?.[idx]) ?? measureNormParagraphHeight(p)) * bMult);
        const totalNormH = normHeaderH + paragraphs.reduce((acc, p, i) => acc + getParaH(p, i), 0) + 50;

        if (totalNormH <= getAvailableBudget()) {
          currentCardBlocks.push(block);
          currentUsedHeight += totalNormH;
          continue;
        }

        if (currentCardBlocks.length > 0 && (normHeaderH + getParaH(paragraphs[0] || '', 0) > getAvailableBudget())) {
          flushCard();
        }

        let pIndex = 0;
        let isNormCont = false;

        while (pIndex < paragraphs.length) {
          const availBudget = getAvailableBudget();
          const headH = isNormCont ? contNormHeaderH : normHeaderH;
          const parasBudget = availBudget - headH - 40;

          let count = 0;
          let accH = 0;

          while (pIndex + count < paragraphs.length) {
            const pH = getParaH(paragraphs[pIndex + count], pIndex + count);
            if (accH + pH <= parasBudget) {
              accH += pH;
              count++;
            } else {
              break;
            }
          }

          if (count === 0 && currentCardBlocks.length === 0) {
            count = 1;
            accH = getParaH(paragraphs[pIndex], pIndex);
          } else if (count === 0) {
            flushCard();
            continue;
          }

          const chunkParas = paragraphs.slice(pIndex, pIndex + count);
          const normChunk: NormBlock = {
            ...block,
            id: `${block.id || 'norm'}-p${pIndex + 1}`,
            title: isNormCont ? (block.title ? `${block.title} (davomi)` : 'Norma (davomi)') : block.title,
            text: chunkParas.join('\n\n')
          };

          currentCardBlocks.push(normChunk);
          currentUsedHeight += headH + accH + 30;
          pIndex += count;
          isNormCont = true;

          if (pIndex < paragraphs.length) {
            flushCard();
          }
        }
        continue;
      }

      // ----------------------------------------------------
      // D. SUD AMALIYOTI / KAZUS (CASE) — Bosqichma-bosqich taqsimlash
      // ----------------------------------------------------
      if (block.type === 'case') {
        const headerH = 120;
        const factsH = measureCaseStepHeight(block.facts);
        const issueH = measureCaseStepHeight(block.issue);
        const ruleH = measureCaseStepHeight(block.rule);
        const analysisH = measureCaseStepHeight(block.analysis);
        const conclH = measureCaseStepHeight(block.conclusion);
        const totalCaseH = headerH + factsH + issueH + ruleH + analysisH + conclH + 30;

        // Butun kazus joriy kartaga sig'sa:
        if (totalCaseH <= getAvailableBudget()) {
          currentCardBlocks.push(block);
          currentUsedHeight += totalCaseH;
          continue;
        }

        // Agar joriy kartada boshqa bloklar bo'lsa, toza kartada urinib ko'ramiz
        if (currentCardBlocks.length > 0) {
          flushCard();
        }

        const budget = getAvailableBudget();
        if (totalCaseH <= budget) {
          currentCardBlocks.push(block);
          currentUsedHeight += totalCaseH;
          continue;
        }

        // Bosqichma-bosqich bo'lish (FIRAC):
        const availableSteps: Array<{ key: 'facts' | 'issue' | 'rule' | 'analysis' | 'conclusion'; h: number; val: string }> = [];
        if (block.facts) availableSteps.push({ key: 'facts', h: factsH, val: block.facts });
        if (block.issue) availableSteps.push({ key: 'issue', h: issueH, val: block.issue });
        if (block.rule) availableSteps.push({ key: 'rule', h: ruleH, val: block.rule });
        if (block.analysis) availableSteps.push({ key: 'analysis', h: analysisH, val: block.analysis });
        if (block.conclusion) availableSteps.push({ key: 'conclusion', h: conclH, val: block.conclusion });

        let stepIdx = 0;
        let isCaseCont = false;

        while (stepIdx < availableSteps.length) {
          const cardBudget = getAvailableBudget();
          const headH = isCaseCont ? 80 : headerH;
          let accH = headH + 20;
          let count = 0;

          while (stepIdx + count < availableSteps.length) {
            const step = availableSteps[stepIdx + count];
            if (accH + step.h <= cardBudget || (count === 0 && currentCardBlocks.length === 0)) {
              accH += step.h;
              count++;
            } else {
              break;
            }
          }

          if (count === 0) {
            flushCard();
            continue;
          }

          const includedSteps = availableSteps.slice(stepIdx, stepIdx + count);
          const caseChunk: any = {
            ...block,
            id: `${block.id || 'case'}-part${stepIdx + 1}`,
            isContinuation: isCaseCont ? true : undefined,
            facts: undefined,
            issue: undefined,
            rule: undefined,
            analysis: undefined,
            conclusion: undefined
          };

          for (const s of includedSteps) {
            caseChunk[s.key] = s.val;
          }

          currentCardBlocks.push(caseChunk as CaseBlock);
          currentUsedHeight += accH;
          stepIdx += count;
          isCaseCont = true;

          if (stepIdx < availableSteps.length) {
            flushCard();
          }
        }
        continue;
      }

      // ----------------------------------------------------
      // E. FLESHKARD (QA) — Savol va Javobni xavfsiz taqsimlash
      // ----------------------------------------------------
      if (block.type === 'qa') {
        const qaH = measureBlockHeight(block);
        if (qaH <= getAvailableBudget()) {
          currentCardBlocks.push(block);
          currentUsedHeight += qaH;
          continue;
        }

        if (currentCardBlocks.length > 0) {
          flushCard();
        }

        const qH = estimateTextHeight(block.question || '', 36, 1.45, 48) + 80;
        const aH = estimateTextHeight(block.answer || '', 32, 1.55, 52) + 70;

        if (qH + aH <= getAvailableBudget()) {
          currentCardBlocks.push(block);
          currentUsedHeight += qH + aH;
        } else {
          // Javobni xatboshilar yoki tabiiy bo'laklar bo'yicha bo'lamiz
          const aChunks = splitTextIntoChunks(block.answer || '', 380);
          if (aChunks.length > 1) {
            currentCardBlocks.push({
              ...block,
              id: `${block.id || 'qa'}-part1`,
              answer: aChunks[0]
            });
            currentUsedHeight += qH + estimateTextHeight(aChunks[0], 32, 1.55, 52) + 60;
            flushCard();

            for (let aIdx = 1; aIdx < aChunks.length; aIdx++) {
              currentCardBlocks.push({
                ...block,
                id: `${block.id || 'qa'}-part${aIdx + 1}`,
                question: '',
                answer: aChunks[aIdx],
                isContinuation: true
              });
              currentUsedHeight += estimateTextHeight(aChunks[aIdx], 32, 1.55, 52) + 80;
              if (aIdx < aChunks.length - 1) {
                flushCard();
              }
            }
          } else {
            // Javob 1 bo'lak bo'lsa ham qH + aH sig'madi: savolni 1-kartaga, javobni 2-kartaga chiqaramiz
            currentCardBlocks.push({
              ...block,
              id: `${block.id || 'qa'}-part1`,
              answer: ''
            });
            currentUsedHeight += qH;
            flushCard();
            currentCardBlocks.push({
              ...block,
              id: `${block.id || 'qa'}-part2`,
              question: '',
              answer: block.answer,
              isContinuation: true
            });
            currentUsedHeight += aH;
          }
        }
        continue;
      }

      // ----------------------------------------------------
      // F. MATN BLOKI (TEXT) — Xatboshilar va jumlalar bo'yicha taqsimlash
      // ----------------------------------------------------
      if (block.type === 'text') {
        const textContent = block.text || (block as any).content || '';
        const totalTextH = estimateTextHeight(textContent, 32, 1.55, 52) + 20;

        if (totalTextH <= getAvailableBudget()) {
          currentCardBlocks.push(block);
          currentUsedHeight += totalTextH;
          continue;
        }

        if (currentCardBlocks.length > 0 && getAvailableBudget() < 250) {
          flushCard();
        }

        // Matnni xatboshilar va 380 belgidan oshmaydigan tabiiy bo'laklarga ajratamiz
        const rawParas = textContent.split(/\n+/).filter(Boolean);
        const subChunks: string[] = [];

        for (const p of rawParas) {
          if (p.length > 380) {
            subChunks.push(...splitTextIntoChunks(p, 380));
          } else {
            subChunks.push(p);
          }
        }

        let pIdx = 0;
        while (pIdx < subChunks.length) {
          const availBudget = getAvailableBudget();
          let count = 0;
          let accH = 0;

          while (pIdx + count < subChunks.length) {
            const chunkH = estimateTextHeight(subChunks[pIdx + count], 32, 1.55, 52) + 16;
            if (accH + chunkH <= availBudget) {
              accH += chunkH;
              count++;
            } else {
              break;
            }
          }

          if (count === 0 && currentCardBlocks.length === 0) {
            count = 1;
            accH = estimateTextHeight(subChunks[pIdx], 32, 1.55, 52) + 16;
          } else if (count === 0) {
            flushCard();
            continue;
          }

          const chunkParas = subChunks.slice(pIdx, pIdx + count);
          const textChunk: TextBlock = {
            ...block,
            id: `${block.id || 'txt'}-p${pIdx + 1}`,
            text: chunkParas.join('\n\n')
          };

          currentCardBlocks.push(textChunk);
          currentUsedHeight += accH;
          pIdx += count;

          if (pIdx < subChunks.length) {
            flushCard();
          }
        }
        continue;
      }

      // ----------------------------------------------------
      // G. ATOMIK BLOKLAR (Note, Definition, Flow, Compare, Timeline)
      // ----------------------------------------------------
      const blockId = block.id || '';
      const bHeight = Math.round(((measured?.blocks?.[blockId]) ?? measureBlockHeight(block)) * getBlockMultiplier(blockId));

      if (bHeight <= getAvailableBudget()) {
        currentCardBlocks.push(block);
        currentUsedHeight += bHeight;
      } else {
        if (currentCardBlocks.length > 0) {
          flushCard();
        }
        currentCardBlocks.push(block);
        currentUsedHeight += bHeight;
      }
    }

    // Bo'lim tugaganda kartani chiqaramiz
    flushCard();
  }

  // Agar hujjat butunlay bo'sh bo'lsa
  if (cards.length === 0) {
    cards.push({
      id: `${doc.id || 'doc'}-empty-card`,
      cardIndex: 1,
      totalCards: 1,
      cardType: 'content',
      sectionTitle: doc.title,
      blocks: []
    });
  }

  // Umumiy kartalar sonini yangilash
  const total = cards.length;
  cards.forEach((c) => {
    c.totalCards = total;
  });

  return cards;
}
