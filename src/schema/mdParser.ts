import type {
  LegalDocument,
  Section,
  TextBlock,
  ListBlock,
  DefinitionBlock,
  NormBlock,
  TableBlock,
  NoteBlock,
  CaseBlock,
  QaBlock,
  CompareBlock,
  FlowBlock,
  TimelineBlock,
  ThemeName,
  NoteVariant
} from './types';
import { ensureStableIds } from './idUtils';

export interface ParserWarning {
  line: number;
  message: string;
  severity: 'warning' | 'info';
}

export interface ParseResult {
  document: LegalDocument;
  warnings: ParserWarning[];
}

/**
 * Matn satridan {#id} belgisini ajratib oladi.
 */
export function extractExplicitId(line: string): { cleanLine: string; id?: string } {
  const match = line.match(/\{#([a-zA-Z0-9_-]+)\}\s*$/);
  if (match) {
    return {
      cleanLine: line.replace(/\{#([a-zA-Z0-9_-]+)\}\s*$/, '').trim(),
      id: match[1]
    };
  }
  return { cleanLine: line };
}

/**
 * Apostroflarni yagona shaklga keltiradi (' ‘ ’ ʻ ` -> ')
 */
function normalizeApostrophes(str: string): string {
  return str.replace(/[`‘’ʻʼ]/g, "'");
}

/**
 * Boshlang'ich kiritilgan matnni tozalaydi:
 * - ```markdown / ```md / ``` qobig'ini olib tashlaydi
 * - UTF-8 BOM, NBSP, zero-width space belgilarini tozalaydi
 * - CRLF / CR ni \n ga o'tkazadi
 */
export function cleanInputText(raw: string): { text: string; leadingChatter: string[]; trailingChatter: string[] } {
  let cleaned = (raw || '')
    .replace(/^\uFEFF/, '') // BOM
    .replace(/\u00A0/g, ' ') // NBSP
    .replace(/[\u200B\u200C\u200D]/g, '') // Zero-width spaces
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n');

  // Markdown kod bloklari qobig'ini tozalash (```md ... ```)
  const fenceRegex = /^\s*```(?:markdown|md)?\s*\n([\s\S]*?)\n\s*```\s*$/i;
  const matchFence = cleaned.match(fenceRegex);
  if (matchFence) {
    cleaned = matchFence[1];
  } else {
    // Agar boshida ``` bo'lsa va oxirida ``` bo'lsa
    cleaned = cleaned.replace(/^\s*```(?:markdown|md)?\s*\n?/i, '').replace(/\n?\s*```\s*$/i, '');
  }

  const rawLines = cleaned.split('\n');
  const leadingChatter: string[] = [];
  const trailingChatter: string[] = [];

  // Birinchi '#' yoki tan olingan sarlavhagacha bo'lgan AI kirish so'zlarini aniqlash
  let firstDocLineIdx = -1;
  for (let i = 0; i < rawLines.length; i++) {
    const trimmed = rawLines[i].trim();
    if (
      trimmed.startsWith('# ') ||
      trimmed.startsWith('## ') ||
      trimmed.startsWith('norma:') ||
      trimmed.startsWith('@norma')
    ) {
      firstDocLineIdx = i;
      break;
    }
  }

  let finalLines = rawLines;
  if (firstDocLineIdx > 0) {
    for (let i = 0; i < firstDocLineIdx; i++) {
      if (rawLines[i].trim()) {
        leadingChatter.push(rawLines[i].trim());
      }
    }
    finalLines = rawLines.slice(firstDocLineIdx);
  }

  return {
    text: finalLines.join('\n'),
    leadingChatter,
    trailingChatter
  };
}

/**
 * Escaped pipe (\|) ni inobatga olgan holda jadval qatorini kataklarga bo'ladi
 */
export function splitTableCells(line: string): string[] {
  let trimmed = line.trim();
  if (trimmed.startsWith('|')) trimmed = trimmed.slice(1);
  if (trimmed.endsWith('|')) trimmed = trimmed.slice(0, -1);

  const cells: string[] = [];
  let current = '';
  let isEscaped = false;

  for (let i = 0; i < trimmed.length; i++) {
    const ch = trimmed[i];
    if (isEscaped) {
      current += ch;
      isEscaped = false;
    } else if (ch === '\\') {
      isEscaped = true;
    } else if (ch === '|') {
      cells.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  cells.push(current.trim());

  return cells;
}

export type DetectedMarkerType =
  | 'doc_title'
  | 'section_title'
  | 'norm'
  | 'definition'
  | 'qa_question'
  | 'qa_answer'
  | 'note_warning'
  | 'note_tip'
  | 'case'
  | 'compare'
  | 'flow'
  | 'timeline'
  | 'list_unordered'
  | 'list_ordered'
  | 'table_row'
  | 'explicit_id_only'
  | 'none';

export interface MarkerDetection {
  type: DetectedMarkerType;
  rawMarker: string;
  content: string;
  explicitId?: string;
}

/**
 * Qator boshidagi markerni aniqlash:
 * Faqat qator boshida kelgan va belgilangan formatdagi belgilar marker deb hisoblanadi.
 * Jumla ichidagi yoki oxiridagi ?, !, +, = oddiy matn hisoblanadi.
 * Telefon raqami (+998...) oddiy matn hisoblanadi.
 */
export function detectLineMarker(rawLine: string): MarkerDetection {
  const line = rawLine.replace(/^[ \t]+/, '');
  if (!line) {
    return { type: 'none', rawMarker: '', content: '' };
  }

  // Faqat ID ko'rsatilgan qator: masalan `{#blk-jadval}`
  const idOnlyMatch = line.match(/^\{#([a-zA-Z0-9_-]+)\}\s*$/);
  if (idOnlyMatch) {
    return { type: 'explicit_id_only', rawMarker: '{#id}', content: '', explicitId: idOnlyMatch[1] };
  }

  // 1. Hujjat sarlavhasi (# ...) - # dan keyin kamida bitta bo'sh joy bo'lishi shart! (#1 ariza matn deb qoladi)
  if (/^#\s+/.test(line) && !line.startsWith('##')) {
    const rawContent = line.replace(/^#\s+/, '').trim();
    const { cleanLine, id } = extractExplicitId(rawContent);
    return { type: 'doc_title', rawMarker: '#', content: cleanLine, explicitId: id };
  }

  // 2. Bo'lim sarlavhasi (## ...)
  if (/^##\s+/.test(line) && !line.startsWith('###')) {
    const rawContent = line.replace(/^##\s+/, '').trim();
    const { cleanLine, id } = extractExplicitId(rawContent);
    return { type: 'section_title', rawMarker: '##', content: cleanLine, explicitId: id };
  }

  // Emojilarni tozalab tekshirish (AI ba'zan 📌 norma: yoki ⚖️ kazus: deb yozadi)
  // Maxsus sintaksis belgilarini saqlab, boshqa barcha emojilarni olib tashlaymiz
  const withoutEmoji = line.replace(/^[^\w\s#@§~?=+*|<>!-]+[ \t]*/u, '');
  const normLine = normalizeApostrophes(withoutEmoji);

  // Helper: normLine orqali markerni tekshirib, asl matnni withoutEmoji dan kesib olish (asl apostroflarni saqlash)
  const matchMarker = (pattern: RegExp): string | null => {
    const m = normLine.match(pattern);
    if (!m) return null;
    return withoutEmoji.slice(m[0].length).trim();
  };

  // 3. Qonun normasi:
  // Primary: norma: ...
  // @: @norma ...
  // Symbol: § ... (faqat § dan keyin bo'sh joy bo'lsa)
  const normPrimary = matchMarker(/^norma:\s*/i);
  if (normPrimary !== null) {
    const { cleanLine, id } = extractExplicitId(normPrimary);
    return { type: 'norm', rawMarker: 'norma:', content: cleanLine, explicitId: id };
  }
  const normAt = matchMarker(/^@norma\b\s*/i);
  if (normAt !== null) {
    const { cleanLine, id } = extractExplicitId(normAt);
    return { type: 'norm', rawMarker: '@norma', content: cleanLine, explicitId: id };
  }
  if (/^§\s+/.test(line)) {
    const rawContent = line.replace(/^§\s+/, '').trim();
    const { cleanLine, id } = extractExplicitId(rawContent);
    return { type: 'norm', rawMarker: '§', content: cleanLine, explicitId: id };
  }

  // 4. Atama va ta'rif:
  // Primary: ta'rif: / tarif:
  // @: @tarif / @ta'rif
  // Symbol: ~ ... (faqat ~ dan keyin bo'sh joy bo'lsa)
  const defPrimary = matchMarker(/^(?:ta'rif|tarif):\s*/i);
  if (defPrimary !== null) {
    const { cleanLine, id } = extractExplicitId(defPrimary);
    return { type: 'definition', rawMarker: "ta'rif:", content: cleanLine, explicitId: id };
  }
  const defAt = matchMarker(/^@(?:ta'rif|tarif)\b\s*/i);
  if (defAt !== null) {
    const { cleanLine, id } = extractExplicitId(defAt);
    return { type: 'definition', rawMarker: '@tarif', content: cleanLine, explicitId: id };
  }
  if (/^~\s+/.test(line)) {
    const rawContent = line.replace(/^~\s+/, '').trim();
    const { cleanLine, id } = extractExplicitId(rawContent);
    return { type: 'definition', rawMarker: '~', content: cleanLine, explicitId: id };
  }

  // 5. Savol-javob:
  // Primary: savol: ... va javob: ...
  // @: @savol ... va @javob ...
  // Symbol: ? ... va = ... (faqat orqasidan bo'sh joy kelsa!)
  const qPrimary = matchMarker(/^savol:\s*/i);
  if (qPrimary !== null) {
    const { cleanLine, id } = extractExplicitId(qPrimary);
    return { type: 'qa_question', rawMarker: 'savol:', content: cleanLine, explicitId: id };
  }
  const qAt = matchMarker(/^@savol\b\s*/i);
  if (qAt !== null) {
    const { cleanLine, id } = extractExplicitId(qAt);
    return { type: 'qa_question', rawMarker: '@savol', content: cleanLine, explicitId: id };
  }
  if (/^\?\s+/.test(line)) {
    const rawContent = line.replace(/^\?\s+/, '').trim();
    const { cleanLine, id } = extractExplicitId(rawContent);
    return { type: 'qa_question', rawMarker: '?', content: cleanLine, explicitId: id };
  }

  const aPrimary = matchMarker(/^javob:\s*/i);
  if (aPrimary !== null) {
    const { cleanLine, id } = extractExplicitId(aPrimary);
    return { type: 'qa_answer', rawMarker: 'javob:', content: cleanLine, explicitId: id };
  }
  const aAt = matchMarker(/^@javob\b\s*/i);
  if (aAt !== null) {
    const { cleanLine, id } = extractExplicitId(aAt);
    return { type: 'qa_answer', rawMarker: '@javob', content: cleanLine, explicitId: id };
  }
  if (/^=\s+/.test(line)) {
    const rawContent = line.replace(/^=\s+/, '').trim();
    const { cleanLine, id } = extractExplicitId(rawContent);
    return { type: 'qa_answer', rawMarker: '=', content: cleanLine, explicitId: id };
  }

  // 6. Ogohlantirish (Note warning):
  // Primary: ogoh: ...
  // @: @ogoh ...
  // Symbol: ! ... (faqat ! dan keyin bo'sh joy bo'lsa)
  const warnPrimary = matchMarker(/^ogoh:\s*/i);
  if (warnPrimary !== null) {
    const { cleanLine, id } = extractExplicitId(warnPrimary);
    return { type: 'note_warning', rawMarker: 'ogoh:', content: cleanLine, explicitId: id };
  }
  const warnAt = matchMarker(/^@ogoh\b\s*/i);
  if (warnAt !== null) {
    const { cleanLine, id } = extractExplicitId(warnAt);
    return { type: 'note_warning', rawMarker: '@ogoh', content: cleanLine, explicitId: id };
  }
  if (/^!\s+/.test(line)) {
    const rawContent = line.replace(/^!\s+/, '').trim();
    const { cleanLine, id } = extractExplicitId(rawContent);
    return { type: 'note_warning', rawMarker: '!', content: cleanLine, explicitId: id };
  }

  // 7. Maslahat (Note tip):
  // Primary: maslahat: ...
  // @: @maslahat ...
  // Symbol: + ... (DIQQAT: telefon raqami +998... yoki + 998... emasligini tekshiramiz!)
  const tipPrimary = matchMarker(/^maslahat:\s*/i);
  if (tipPrimary !== null) {
    const { cleanLine, id } = extractExplicitId(tipPrimary);
    return { type: 'note_tip', rawMarker: 'maslahat:', content: cleanLine, explicitId: id };
  }
  const tipAt = matchMarker(/^@maslahat\b\s*/i);
  if (tipAt !== null) {
    const { cleanLine, id } = extractExplicitId(tipAt);
    return { type: 'note_tip', rawMarker: '@maslahat', content: cleanLine, explicitId: id };
  }
  if (/^\+\s+/.test(line)) {
    const afterPlus = line.replace(/^\+\s+/, '').trim();
    if (!/^\d/.test(afterPlus)) {
      const { cleanLine, id } = extractExplicitId(afterPlus);
      return { type: 'note_tip', rawMarker: '+', content: cleanLine, explicitId: id };
    }
  }

  // 8. Kazus:
  // Primary: kazus: ...
  // @: @kazus ...
  const casePrimary = matchMarker(/^(?:kazus|case):\s*/i);
  if (casePrimary !== null) {
    const { cleanLine, id } = extractExplicitId(casePrimary);
    return { type: 'case', rawMarker: 'kazus:', content: cleanLine, explicitId: id };
  }
  const caseAt = matchMarker(/^@kazus\b\s*/i);
  if (caseAt !== null) {
    const { cleanLine, id } = extractExplicitId(caseAt);
    return { type: 'case', rawMarker: '@kazus', content: cleanLine, explicitId: id };
  }

  // 9. Taqqoslash:
  const compPrimary = matchMarker(/^(?:taqqos|compare):\s*/i);
  if (compPrimary !== null) {
    const { cleanLine, id } = extractExplicitId(compPrimary);
    return { type: 'compare', rawMarker: 'taqqos:', content: cleanLine, explicitId: id };
  }
  const compAt = matchMarker(/^@taqqos\b\s*/i);
  if (compAt !== null) {
    const { cleanLine, id } = extractExplicitId(compAt);
    return { type: 'compare', rawMarker: '@taqqos', content: cleanLine, explicitId: id };
  }

  // 10. Jarayon:
  const flowPrimary = matchMarker(/^(?:jarayon|flow):\s*/i);
  if (flowPrimary !== null) {
    const { cleanLine, id } = extractExplicitId(flowPrimary);
    return { type: 'flow', rawMarker: 'jarayon:', content: cleanLine, explicitId: id };
  }
  const flowAt = matchMarker(/^@jarayon\b\s*/i);
  if (flowAt !== null) {
    const { cleanLine, id } = extractExplicitId(flowAt);
    return { type: 'flow', rawMarker: '@jarayon', content: cleanLine, explicitId: id };
  }

  // 11. Vaqt xaritasi:
  const timePrimary = matchMarker(/^(?:vaqt|timeline):\s*/i);
  if (timePrimary !== null) {
    const { cleanLine, id } = extractExplicitId(timePrimary);
    return { type: 'timeline', rawMarker: 'vaqt:', content: cleanLine, explicitId: id };
  }
  const timeAt = matchMarker(/^@vaqt\b\s*/i);
  if (timeAt !== null) {
    const { cleanLine, id } = extractExplicitId(timeAt);
    return { type: 'timeline', rawMarker: '@vaqt', content: cleanLine, explicitId: id };
  }

  // 12. Jadval qatori: | ... |
  if (line.startsWith('|') && line.endsWith('|')) {
    return { type: 'table_row', rawMarker: '|', content: line };
  }

  // 13. Ro'yxat bandlari:
  if (/^[-*]\s+/.test(line)) {
    return { type: 'list_unordered', rawMarker: '-', content: line.replace(/^[-*]\s+/, '').trim() };
  }
  if (/^\d+\.\s+/.test(line)) {
    return { type: 'list_ordered', rawMarker: '1.', content: line.replace(/^\d+\.\s+/, '').trim() };
  }

  return { type: 'none', rawMarker: '', content: line };
}

/**
 * MD+ (Markdown Plus) formatidagi matnni LegalDocument AST ga aylantiradi.
 */
export function parseMarkdownPlus(input: string): ParseResult {
  const warnings: ParserWarning[] = [];

  const { text: cleanedInput, leadingChatter } = cleanInputText(input);

  if (leadingChatter.length > 0) {
    warnings.push({
      line: 1,
      message: `Hujjat sarlavhasidan oldingi kirish so‘zlari e’tiborga olinmadi ("${leadingChatter[0].slice(0, 40)}...")`,
      severity: 'info'
    });
  }

  const rawLines = cleanedInput.split('\n');

  const document: LegalDocument = {
    version: '1.0',
    id: '',
    title: 'Yuridik hujjat',
    subtitle: '',
    author: '',
    language: 'uz',
    theme: 'classic',
    cover: { enabled: true },
    toc: undefined as unknown as boolean,
    sections: []
  };

  let currentSection: Section | null = null;

  function getActiveSection(): Section {
    if (!currentSection) {
      currentSection = {
        title: 'Asosiy qism',
        layout: '1-col',
        pageBreak: false,
        blocks: []
      };
      document.sections.push(currentSection);
    }
    return currentSection;
  }

  let lineIdx = 0;
  let pendingBlockId: string | undefined = undefined;

  while (lineIdx < rawLines.length) {
    const rawLine = rawLines[lineIdx];
    const currentLineNum = lineIdx + 1;
    const trimmed = rawLine.trim();

    if (!trimmed) {
      lineIdx++;
      continue;
    }

    // Faqat ID qatori: masalan `{#blk-jadval}` keyingi blok uchun saqlanadi
    if (/^\{#([a-zA-Z0-9_-]+)\}\s*$/.test(trimmed)) {
      pendingBlockId = trimmed.match(/^\{#([a-zA-Z0-9_-]+)\}\s*$/)?.[1];
      lineIdx++;
      continue;
    }

    // Dividerlarni (--- yoki ***) e'tiborsiz qoldirish
    if (/^[-*_]{3,}$/.test(trimmed)) {
      lineIdx++;
      continue;
    }

    // Shovqin qatorlari (AI prompt shablonidagi "Ro'yxat:", "Jadval:", "Inline belgilar:" sarlavhalari qoldig'i)
    const cleanedNoiseLine = trimmed.replace(/[*_#`]/g, '').trim();
    if (/^(?:ro['‘ʼ`]?yxat|jadval|inline\s+belgilar)\s*:?\s*$/i.test(cleanedNoiseLine)) {
      warnings.push({
        line: currentLineNum,
        message: `${currentLineNum}-qator: "${trimmed}" qatori sun'iy intellekt shabloni qoldig'i (shovqin) deb topildi va e'tiborga olinmadi.`,
        severity: 'warning'
      });
      lineIdx++;
      continue;
    }

    // Fenced Blok Sintaksisi (:::type ... :::)
    if (trimmed.startsWith(':::')) {
      if (trimmed === ':::') {
        warnings.push({
          line: currentLineNum,
          message: `${currentLineNum}-qator: Ochiq blok bo‘lmagan holda ":::" yopish belgisi uchradi.`,
          severity: 'warning'
        });
        lineIdx++;
        continue;
      }

      const fenceMatch = trimmed.match(/^:::\s*([a-zA-Z0-9_'ʻʼ-]+)(?:\s+(.*))?$/);
      if (!fenceMatch) {
        warnings.push({
          line: currentLineNum,
          message: `${currentLineNum}-qator: Noto‘g‘ri ":::" blok formati.`,
          severity: 'warning'
        });
        lineIdx++;
        continue;
      }

      const fenceTypeRaw = normalizeApostrophes(fenceMatch[1].toLowerCase());
      const fenceHeaderArg = fenceMatch[2] ? fenceMatch[2].trim() : '';
      const { cleanLine: cleanHeaderArg, id: fenceArgId } = extractExplicitId(fenceHeaderArg);
      const startLineNum = currentLineNum;
      const blockId = fenceArgId || pendingBlockId;
      pendingBlockId = undefined;

      lineIdx++;
      const fenceLines: string[] = [];
      let closedNormally = false;

      while (lineIdx < rawLines.length) {
        const line = rawLines[lineIdx];
        const lTrim = line.trim();
        if (lTrim === ':::') {
          closedNormally = true;
          lineIdx++;
          break;
        }
        if (/^##\s+/.test(lTrim) && !lTrim.startsWith('###')) {
          break;
        }
        fenceLines.push(line);
        lineIdx++;
      }

      const endLineNum = lineIdx;

      if (!closedNormally) {
        warnings.push({
          line: startLineNum,
          message: `${startLineNum}-qator: ":::${fenceTypeRaw}" bloki yopilmagan (":::" bilan yopilishi kerak). Bo‘lim yoki hujjat oxirida avtomatik yopildi.`,
          severity: 'warning'
        });
      }

      const knownTypes = [
        'norma', 'norm',
        'kazus', 'case',
        'savol', 'qa', 'savol-javob',
        'ogoh', 'warning', 'maslahat', 'tip', 'muhim', 'important', 'iqtibos', 'quote', 'eslatma', 'note',
        "ta'rif", 'tarif', 'definition',
        'taqqos', 'compare',
        'jarayon', 'flow',
        'vaqt', 'timeline'
      ];

      if (!knownTypes.includes(fenceTypeRaw)) {
        warnings.push({
          line: startLineNum,
          message: `${startLineNum}-qator: Noma'lum blok turi ":::${fenceTypeRaw}". Matn sifatida qabul qilindi.`,
          severity: 'warning'
        });
        const textContent = [cleanHeaderArg, ...fenceLines].filter(Boolean).join('\n').trim();
        if (textContent) {
          const textBlock: TextBlock = {
            type: 'text',
            id: blockId,
            text: textContent,
            sourceLine: startLineNum,
            sourceEndLine: endLineNum,
            syntaxStyle: 'fenced'
          };
          getActiveSection().blocks.push(textBlock);
        }
        continue;
      }

      // 1. Norma
      if (fenceTypeRaw === 'norma' || fenceTypeRaw === 'norm') {
        let number = '';
        let title = '';
        let source: string | undefined;
        let effectiveDate: string | undefined;
        const textLines: string[] = [];

        for (const rawL of fenceLines) {
          const l = rawL.trim();
          if (!l) {
            textLines.push('');
            continue;
          }
          const colonIdx = l.indexOf(':');
          if (colonIdx > 0) {
            const key = normalizeApostrophes(l.slice(0, colonIdx).trim().toLowerCase());
            const val = l.slice(colonIdx + 1).trim();
            if (['modda', 'raqam', 'number'].includes(key)) {
              const dotMatch = val.match(/^([^.]+?)\.\s+(.*)$/);
              if (dotMatch) {
                number = dotMatch[1].trim();
                title = dotMatch[2].trim();
              } else {
                number = val;
              }
              continue;
            } else if (['sarlavha', 'title', 'nom'].includes(key)) {
              title = val;
              continue;
            } else if (['manba', 'source'].includes(key)) {
              source = val;
              continue;
            } else if (['sana', 'date'].includes(key)) {
              effectiveDate = val;
              continue;
            }
          }
          textLines.push(l);
        }

        if (!number && cleanHeaderArg) {
          const dotMatch = cleanHeaderArg.match(/^([^.]+?)\.\s+(.*)$/);
          const colonMatch = cleanHeaderArg.match(/^([^:]+?):\s*(.*)$/);
          if (dotMatch) {
            number = dotMatch[1].trim();
            if (!title) title = dotMatch[2].trim();
          } else if (colonMatch) {
            number = colonMatch[1].trim();
            if (!title) title = colonMatch[2].trim();
          } else {
            number = cleanHeaderArg;
          }
        }

        if (!number) number = 'Norma';
        if (!title) title = number;

        const text = textLines.join('\n').trim();
        if (!text) {
          warnings.push({
            line: startLineNum,
            message: `${startLineNum}-qator: "${number}" normasining matni bo‘sh qoldirildi.`,
            severity: 'warning'
          });
        }

        const block: NormBlock = {
          type: 'norm',
          id: blockId,
          number,
          title,
          text: text || '',
          source: source || undefined,
          effectiveDate: effectiveDate || undefined,
          sourceLine: startLineNum,
          sourceEndLine: endLineNum,
          syntaxStyle: 'fenced'
        };
        getActiveSection().blocks.push(block);
        continue;
      }

      // 2. Kazus
      if (fenceTypeRaw === 'kazus' || fenceTypeRaw === 'case') {
        type CaseFieldName = 'title' | 'facts' | 'issue' | 'rule' | 'analysis' | 'conclusion' | 'court';
        let currentField: CaseFieldName | null = null;
        const fieldBuffers: Record<CaseFieldName, string[]> = {
          title: [],
          facts: [],
          issue: [],
          rule: [],
          analysis: [],
          conclusion: [],
          court: []
        };

        for (const rawL of fenceLines) {
          const l = rawL.trim();
          if (!l) {
            if (currentField) {
              fieldBuffers[currentField].push('');
            }
            continue;
          }
          const colonIdx = l.indexOf(':');
          let matchedKey: CaseFieldName | null = null;
          if (colonIdx > 0) {
            const rawKey = normalizeApostrophes(l.slice(0, colonIdx).trim().toLowerCase());
            if (['vaziyat', 'fakt', 'faktlar', 'facts'].includes(rawKey)) matchedKey = 'facts';
            else if (['savol', 'masala', 'issue'].includes(rawKey)) matchedKey = 'issue';
            else if (['qoida', 'norma', 'rule'].includes(rawKey)) matchedKey = 'rule';
            else if (['tahlil', 'tahlili', 'analysis'].includes(rawKey)) matchedKey = 'analysis';
            else if (['xulosa', 'qaror', 'conclusion'].includes(rawKey)) matchedKey = 'conclusion';
            else if (['manba', 'sud', 'court'].includes(rawKey)) matchedKey = 'court';
            else if (['title', 'nom', 'sarlavha', 'ish'].includes(rawKey)) matchedKey = 'title';
          }

          if (matchedKey) {
            currentField = matchedKey;
            const val = l.slice(colonIdx + 1).trim();
            if (val) {
              fieldBuffers[matchedKey].push(val);
            }
          } else if (currentField) {
            fieldBuffers[currentField].push(l);
          } else {
            if (!cleanHeaderArg && fieldBuffers.title.length === 0) {
              fieldBuffers.title.push(l);
            } else {
              currentField = 'facts';
              fieldBuffers.facts.push(l);
            }
          }
        }

        const title = fieldBuffers.title.join(' ').trim() || cleanHeaderArg || 'Sud kazusi';
        const facts = fieldBuffers.facts.join('\n').trim() || undefined;
        const issue = fieldBuffers.issue.join('\n').trim() || undefined;
        const rule = fieldBuffers.rule.join('\n').trim() || undefined;
        const analysis = fieldBuffers.analysis.join('\n').trim() || undefined;
        const conclusion = fieldBuffers.conclusion.join('\n').trim() || undefined;
        const court = fieldBuffers.court.join(' ').trim() || undefined;

        const hasFirac = Boolean(facts || issue || rule || analysis || conclusion);
        if (!hasFirac) {
          warnings.push({
            line: startLineNum,
            message: `${startLineNum}-qator: ":::kazus" blokida kamida bitta kazus maydoni (vaziyat, masala, qoida, tahlil yoki xulosa) ko‘rsatilishi kerak.`,
            severity: 'warning'
          });
        }

        const block: CaseBlock = {
          type: 'case',
          id: blockId,
          title,
          facts,
          issue,
          rule,
          analysis,
          conclusion,
          court,
          sourceLine: startLineNum,
          sourceEndLine: endLineNum,
          syntaxStyle: 'fenced'
        };
        getActiveSection().blocks.push(block);
        continue;
      }

      // 3. Savol-Javob
      if (fenceTypeRaw === 'savol' || fenceTypeRaw === 'qa' || fenceTypeRaw === 'savol-javob') {
        type QaFieldName = 'question' | 'answer' | 'hint' | 'category';
        let qaField: QaFieldName | null = null;
        const qaBuffers: Record<QaFieldName, string[]> = {
          question: [],
          answer: [],
          hint: [],
          category: []
        };

        for (const rawL of fenceLines) {
          const l = rawL.trim();
          if (!l) {
            if (qaField) qaBuffers[qaField].push('');
            continue;
          }
          const colonIdx = l.indexOf(':');
          let matched: QaFieldName | null = null;
          if (colonIdx > 0) {
            const k = normalizeApostrophes(l.slice(0, colonIdx).trim().toLowerCase());
            if (['savol', 'question', 'q'].includes(k)) matched = 'question';
            else if (['javob', 'answer', 'a'].includes(k)) matched = 'answer';
            else if (['izoh', 'hint', 'eslatma', 'maslahat'].includes(k)) matched = 'hint';
            else if (['kategoriya', 'toifa', 'category'].includes(k)) matched = 'category';
          }

          if (matched) {
            qaField = matched;
            const val = l.slice(colonIdx + 1).trim();
            if (val) qaBuffers[matched].push(val);
          } else if (qaField) {
            qaBuffers[qaField].push(l);
          } else {
            qaField = 'question';
            qaBuffers.question.push(l);
          }
        }

        const question = qaBuffers.question.join('\n').trim() || cleanHeaderArg || 'Savol';
        const answer = qaBuffers.answer.join('\n').trim() || '';
        const hint = qaBuffers.hint.join('\n').trim() || undefined;
        const category = qaBuffers.category.join(' ').trim() || undefined;

        const block: QaBlock = {
          type: 'qa',
          id: blockId,
          question,
          answer,
          hint,
          category,
          sourceLine: startLineNum,
          sourceEndLine: endLineNum,
          syntaxStyle: 'fenced'
        };
        getActiveSection().blocks.push(block);
        continue;
      }

      // 4. Eslatmalar (ogoh, maslahat, muhim, iqtibos, eslatma)
      if (['ogoh', 'warning', 'maslahat', 'tip', 'muhim', 'important', 'iqtibos', 'quote', 'eslatma', 'note'].includes(fenceTypeRaw)) {
        let variant: NoteVariant = 'tip';
        if (['ogoh', 'warning'].includes(fenceTypeRaw)) variant = 'warning';
        else if (['maslahat', 'tip'].includes(fenceTypeRaw)) variant = 'tip';
        else if (['muhim', 'important'].includes(fenceTypeRaw)) variant = 'important';
        else if (['iqtibos', 'quote'].includes(fenceTypeRaw)) variant = 'quote';
        else if (['eslatma', 'note'].includes(fenceTypeRaw)) variant = 'tip';

        let noteTitle: string | undefined;
        const noteTextLines: string[] = [];

        for (const rawL of fenceLines) {
          const l = rawL.trim();
          if (!l) {
            noteTextLines.push('');
            continue;
          }
          const colonIdx = l.indexOf(':');
          if (colonIdx > 0 && !noteTitle) {
            const k = normalizeApostrophes(l.slice(0, colonIdx).trim().toLowerCase());
            if (['title', 'sarlavha', 'nom'].includes(k)) {
              noteTitle = l.slice(colonIdx + 1).trim();
              continue;
            }
          }
          noteTextLines.push(l);
        }

        const text = noteTextLines.join('\n').trim() || cleanHeaderArg;
        const block: NoteBlock = {
          type: 'note',
          id: blockId,
          variant,
          title: noteTitle || (cleanHeaderArg && cleanHeaderArg !== text ? cleanHeaderArg : undefined),
          text: text || '',
          sourceLine: startLineNum,
          sourceEndLine: endLineNum,
          syntaxStyle: 'fenced'
        };
        getActiveSection().blocks.push(block);
        continue;
      }

      // 5. Ta'rif
      if (["ta'rif", 'tarif', 'definition'].includes(fenceTypeRaw)) {
        let term = cleanHeaderArg;
        let source: string | undefined;
        const defLines: string[] = [];

        for (const rawL of fenceLines) {
          const l = rawL.trim();
          if (!l) continue;
          const colonIdx = l.indexOf(':');
          if (colonIdx > 0) {
            const k = normalizeApostrophes(l.slice(0, colonIdx).trim().toLowerCase());
            const val = l.slice(colonIdx + 1).trim();
            if (['atama', 'term'].includes(k)) {
              term = val;
              continue;
            } else if (['ta\'rif', 'tarif', 'definition'].includes(k)) {
              defLines.push(val);
              continue;
            } else if (['manba', 'source'].includes(k)) {
              source = val;
              continue;
            }
          }
          const dashMatch = !term ? l.match(/\s+[—–-]\s+/) : null;
          if (dashMatch && dashMatch.index !== undefined && dashMatch.index > 0) {
            term = l.slice(0, dashMatch.index).trim();
            defLines.push(l.slice(dashMatch.index + dashMatch[0].length).trim());
          } else {
            defLines.push(l);
          }
        }

        const definition = defLines.join('\n').trim();
        const block: DefinitionBlock = {
          type: 'definition',
          id: blockId,
          term: term || 'Atama',
          definition: definition || '',
          source,
          sourceLine: startLineNum,
          sourceEndLine: endLineNum,
          syntaxStyle: 'fenced'
        };
        getActiveSection().blocks.push(block);
        continue;
      }

      // 6. Taqqos
      if (fenceTypeRaw === 'taqqos' || fenceTypeRaw === 'compare') {
        const compareHeaders = cleanHeaderArg ? cleanHeaderArg.split('|').map((s) => s.trim()).filter(Boolean) : [];
        const itemsMap: Record<string, string[]> = {};
        compareHeaders.forEach((h) => {
          itemsMap[h] = [];
        });

        for (const rawL of fenceLines) {
          const l = rawL.trim();
          if (!l) continue;
          const itemContent = l.replace(/^[-*]\s+/, '');
          const itemColon = itemContent.indexOf(':');
          if (itemColon > 0) {
            const title = itemContent.slice(0, itemColon).trim();
            const point = itemContent.slice(itemColon + 1).trim();
            if (!itemsMap[title]) itemsMap[title] = [];
            itemsMap[title].push(point);
          } else if (compareHeaders.length > 0) {
            itemsMap[compareHeaders[0]].push(itemContent);
          }
        }

        const block: CompareBlock = {
          type: 'compare',
          id: blockId,
          items: Object.keys(itemsMap).map((title) => ({
            title,
            points: itemsMap[title]
          })),
          sourceLine: startLineNum,
          sourceEndLine: endLineNum,
          syntaxStyle: 'fenced'
        };
        getActiveSection().blocks.push(block);
        continue;
      }

      // 7. Jarayon
      if (fenceTypeRaw === 'jarayon' || fenceTypeRaw === 'flow') {
        const stepTexts: string[] = [];
        for (const rawL of fenceLines) {
          const l = rawL.trim();
          if (!l) continue;
          if (l.includes('->')) {
            const parts = l.split('->').map((p) => p.trim()).filter(Boolean);
            stepTexts.push(...parts);
          } else {
            stepTexts.push(l.replace(/^[-*]\s+/, ''));
          }
        }
        const block: FlowBlock = {
          type: 'flow',
          id: blockId,
          title: cleanHeaderArg || undefined,
          steps: stepTexts.map((title) => ({ title })),
          sourceLine: startLineNum,
          sourceEndLine: endLineNum,
          syntaxStyle: 'fenced'
        };
        getActiveSection().blocks.push(block);
        continue;
      }

      // 8. Vaqt
      if (fenceTypeRaw === 'vaqt' || fenceTypeRaw === 'timeline') {
        const timelineTitle = cleanHeaderArg || 'Voqealar ketma-ketligi';
        const events: { date: string; title: string; description: string }[] = [];
        for (const rawL of fenceLines) {
          const l = rawL.trim();
          if (!l) continue;
          if (l.includes('|')) {
            const [datePart, ...descParts] = l.split('|');
            events.push({
              date: datePart.trim(),
              title: timelineTitle,
              description: descParts.join('|').trim()
            });
          }
        }
        const block: TimelineBlock = {
          type: 'timeline',
          id: blockId,
          events,
          sourceLine: startLineNum,
          sourceEndLine: endLineNum,
          syntaxStyle: 'fenced'
        };
        getActiveSection().blocks.push(block);
        continue;
      }
    }

    const detection = detectLineMarker(rawLine);

    // 1. Hujjat sarlavhasi (# Sarlavha)
    if (detection.type === 'doc_title') {
      document.title = detection.content || 'Hujjat sarlavhasi';
      document.sourceLine = currentLineNum;
      if (detection.explicitId) document.id = detection.explicitId;
      lineIdx++;

      while (lineIdx < rawLines.length) {
        const metaRaw = rawLines[lineIdx].trim();
        if (!metaRaw) {
          lineIdx++;
          break;
        }
        const nextDetect = detectLineMarker(rawLines[lineIdx]);
        if (nextDetect.type !== 'none') {
          break;
        }

        const colonIdx = metaRaw.indexOf(':');
        if (colonIdx > 0) {
          const key = metaRaw.slice(0, colonIdx).trim().toLowerCase();
          const val = metaRaw.slice(colonIdx + 1).trim();

          if (key === 'muallif' || key === 'author') {
            document.author = val;
          } else if (key === 'uslub') {
            const validThemes: ThemeName[] = ['classic', 'modern', 'dark', 'minimal'];
            const normalizedTheme = val.toLowerCase() as ThemeName;
            if (validThemes.includes(normalizedTheme)) {
              document.theme = normalizedTheme;
            }
            if (val) {
              document.customStyle = val;
            }
          } else if (key === 'mavzu' || key === 'theme') {
            const validThemes: ThemeName[] = ['classic', 'modern', 'dark', 'minimal'];
            const normalizedTheme = val.toLowerCase() as ThemeName;
            if (validThemes.includes(normalizedTheme)) {
              document.theme = normalizedTheme;
            } else {
              warnings.push({
                line: lineIdx + 1,
                message: `Noma'lum uslub: "${val}". Standart "classic" uslubi tanlandi.`,
                severity: 'warning'
              });
            }
          } else if (key === 'izoh' || key === 'subtitle' || key === 'kichik sarlavha') {
            document.subtitle = val;
            document.subtitleSourceLine = lineIdx + 1;
          } else if (key === 'muqova' || key === 'cover') {
            document.cover = {
              ...document.cover,
              enabled: !['yo‘q', "yo'q", 'false', '0', 'no'].includes(val.toLowerCase())
            };
          } else if (key === 'mundarija' || key === 'toc') {
            document.toc = !['yo‘q', "yo'q", 'false', '0', 'no'].includes(val.toLowerCase());
          } else if (key === 'muassasa' || key === 'institution') {
            if (!document.cover) document.cover = {};
            document.cover.institution = val;
          } else if (key === 'yil' || key === 'year') {
            if (!document.cover) document.cover = {};
            document.cover.year = val;
          }
          lineIdx++;
        } else {
          break;
        }
      }
      continue;
    }

    // 2. Bo'lim sarlavhasi (## Sarlavha)
    if (detection.type === 'section_title') {
      const sectionStartLine = currentLineNum;
      const sectionTitle = detection.content || `${document.sections.length + 1}-bo‘lim`;
      lineIdx++;

      let subtitle: string | undefined = undefined;
      let subtitleSourceLine: number | undefined = undefined;

      // Qoida 9: ## sarlavhasidan keyingi qisqa qator (<= 120 belgi) bo'limning izohi (subtitle) hisoblanadi. Uzun matn esa asosiy kontent bloki bo'ladi.
      if (lineIdx < rawLines.length) {
        const nextRaw = rawLines[lineIdx];
        const nextTrim = nextRaw.trim();
        if (nextTrim) {
          const nextDetect = detectLineMarker(nextRaw);
          if (nextDetect.type === 'none' && !nextTrim.includes(':') && nextTrim.length <= 120) {
            subtitle = nextTrim;
            subtitleSourceLine = lineIdx + 1;
            lineIdx++;
          }
        }
      }

      currentSection = {
        id: detection.explicitId,
        title: sectionTitle,
        subtitle,
        layout: '1-col',
        pageBreak: false,
        blocks: [],
        sourceLine: sectionStartLine,
        subtitleSourceLine
      };
      document.sections.push(currentSection);
      continue;
    }

    // Blok boshlanishi
    let blockId = detection.explicitId || pendingBlockId;
    pendingBlockId = undefined;

    // 3. Qonun normasi (norma: / § / @norma)
    if (detection.type === 'norm') {
      const startLineNum = currentLineNum;
      const headerText = detection.content;
      const colonIdx = headerText.indexOf(':');
      let number = '';
      let title = '';

      if (colonIdx > 0) {
        number = headerText.slice(0, colonIdx).trim();
        title = headerText.slice(colonIdx + 1).trim();
      } else {
        number = headerText;
        title = headerText;
      }

      lineIdx++;

      let source: string | undefined;
      let effectiveDate: string | undefined;
      const textLines: string[] = [];

      while (lineIdx < rawLines.length) {
        const line = rawLines[lineIdx];
        const trimmedLine = line.trim();

        if (!trimmedLine) {
          let peekIdx = lineIdx + 1;
          while (peekIdx < rawLines.length && !rawLines[peekIdx].trim()) peekIdx++;
          if (peekIdx < rawLines.length) {
            const nextDetect = detectLineMarker(rawLines[peekIdx]);
            if (nextDetect.type !== 'none') {
              lineIdx++;
              break;
            }
          }
          textLines.push('');
          lineIdx++;
          continue;
        }

        const nextDetect = detectLineMarker(line);
        if (nextDetect.type !== 'none' && nextDetect.type !== 'explicit_id_only') {
          break;
        }

        const lower = trimmedLine.toLowerCase();
        if (lower.startsWith('manba:') || lower.startsWith('source:')) {
          source = trimmedLine.slice(trimmedLine.indexOf(':') + 1).trim();
        } else if (lower.startsWith('sana:') || lower.startsWith('date:')) {
          effectiveDate = trimmedLine.slice(trimmedLine.indexOf(':') + 1).trim();
        } else {
          textLines.push(trimmedLine);
        }
        lineIdx++;
      }

      const text = textLines.join('\n').trim();
      if (!text) {
        warnings.push({
          line: startLineNum,
          message: `${startLineNum}-qator: "norma: ${number}" normasining matni bo‘sh qoldirildi.`,
          severity: 'warning'
        });
      }

      const block: NormBlock = {
        type: 'norm',
        id: blockId,
        number: number || 'Norma',
        title: title || number || 'Qonun normasi',
        text: text || headerText,
        source,
        effectiveDate,
        sourceLine: startLineNum,
        sourceEndLine: lineIdx
      };
      getActiveSection().blocks.push(block);
      continue;
    }

    // 4. Atama va ta'rif (ta'rif: / ~ / @tarif)
    if (detection.type === 'definition') {
      const startLineNum = currentLineNum;
      const headerText = detection.content;
      const sepMatch = headerText.match(/(\s+[—–-]\s+|:(?!\d)\s*)/);

      let term = '';
      let definition = '';
      let source: string | undefined;

      if (sepMatch && sepMatch.index !== undefined && sepMatch.index > 0) {
        term = headerText.slice(0, sepMatch.index).trim();
        definition = headerText.slice(sepMatch.index + sepMatch[0].length).trim();
      } else {
        term = headerText;
      }

      lineIdx++;

      while (lineIdx < rawLines.length) {
        const line = rawLines[lineIdx];
        const trimmedLine = line.trim();

        if (!trimmedLine) {
          let peekIdx = lineIdx + 1;
          while (peekIdx < rawLines.length && !rawLines[peekIdx].trim()) peekIdx++;
          if (peekIdx < rawLines.length) {
            const nextDetect = detectLineMarker(rawLines[peekIdx]);
            if (nextDetect.type !== 'none') {
              lineIdx++;
              break;
            }
          }
          lineIdx++;
          continue;
        }

        const nextDetect = detectLineMarker(line);
        if (nextDetect.type !== 'none') break;

        const lower = trimmedLine.toLowerCase();
        if (lower.startsWith('manba:') || lower.startsWith('source:')) {
          source = trimmedLine.slice(trimmedLine.indexOf(':') + 1).trim();
        } else {
          definition = definition ? `${definition}\n${trimmedLine}` : trimmedLine;
        }
        lineIdx++;
      }

      if (!definition) {
        warnings.push({
          line: startLineNum,
          message: `${startLineNum}-qator: "ta'rif:" atamasidan keyin ta’rif yozilmadi.`,
          severity: 'warning'
        });
      }

      const block: DefinitionBlock = {
        type: 'definition',
        id: blockId,
        term: term || 'Atama',
        definition: definition || 'Ta’rif kiritilmagan',
        source,
        sourceLine: startLineNum,
        sourceEndLine: lineIdx
      };
      getActiveSection().blocks.push(block);
      continue;
    }

    // 5. Savol-Javob (savol: / ? va javob: / =)
    if (detection.type === 'qa_question') {
      const startLineNum = currentLineNum;
      const question = detection.content;
      lineIdx++;

      let answer = '';
      let hint: string | undefined;
      let category: string | undefined;
      const answerLines: string[] = [];

      while (lineIdx < rawLines.length) {
        const line = rawLines[lineIdx];
        const trimmedLine = line.trim();

        if (!trimmedLine) {
          let peekIdx = lineIdx + 1;
          while (peekIdx < rawLines.length && !rawLines[peekIdx].trim()) peekIdx++;
          if (peekIdx < rawLines.length) {
            const nextRaw = rawLines[peekIdx];
            const nextDetect = detectLineMarker(nextRaw);
            const nextTrim = nextRaw.trim().toLowerCase();
            const isQaField =
              nextDetect.type === 'qa_answer' ||
              nextTrim.startsWith('maslahat:') ||
              nextTrim.startsWith('toifa:') ||
              nextRaw.startsWith('  ') ||
              nextRaw.startsWith('\t');
            if (!isQaField) {
              lineIdx++;
              break;
            }
          }
          lineIdx++;
          continue;
        }

        const lower = trimmedLine.toLowerCase();
        // maslahat: QA ichida hint hisoblanadi
        if (lower.startsWith('maslahat:') || lower.startsWith('hint:')) {
          hint = trimmedLine.slice(trimmedLine.indexOf(':') + 1).trim();
          lineIdx++;
          continue;
        }
        if (lower.startsWith('toifa:') || lower.startsWith('category:')) {
          category = trimmedLine.slice(trimmedLine.indexOf(':') + 1).trim();
          lineIdx++;
          continue;
        }

        const nextDetect = detectLineMarker(line);
        if (nextDetect.type === 'qa_answer') {
          answerLines.push(nextDetect.content);
          lineIdx++;
          continue;
        }
        if (nextDetect.type !== 'none') {
          break;
        }

        answerLines.push(trimmedLine);
        lineIdx++;
      }

      answer = answerLines.join('\n').trim();

      if (!answer) {
        warnings.push({
          line: startLineNum,
          message: `${startLineNum}-qator: "savol:" uchun javobi topilmadi.`,
          severity: 'warning'
        });
      }

      const block: QaBlock = {
        type: 'qa',
        id: blockId,
        question: question || 'Savol matni',
        answer: answer || 'Javob kiritilmagan',
        hint,
        category,
        sourceLine: startLineNum,
        sourceEndLine: lineIdx
      };
      getActiveSection().blocks.push(block);
      continue;
    }

    // 6. Ogohlantirish yoki Maslahat (ogoh: / ! yoki maslahat: / +)
    if (detection.type === 'note_warning' || detection.type === 'note_tip') {
      const startLineNum = currentLineNum;
      const isTip = detection.type === 'note_tip';
      let title: string | undefined;
      let text = detection.content;

      const colonIdx = text.indexOf(':');
      if (colonIdx > 0 && colonIdx < 30) {
        title = text.slice(0, colonIdx).trim();
        text = text.slice(colonIdx + 1).trim();
      }

      lineIdx++;

      const textLines = [text];
      while (lineIdx < rawLines.length) {
        const line = rawLines[lineIdx];
        const trimmedLine = line.trim();

        if (!trimmedLine) {
          let peekIdx = lineIdx + 1;
          while (peekIdx < rawLines.length && !rawLines[peekIdx].trim()) peekIdx++;
          if (peekIdx < rawLines.length) {
            const nextDetect = detectLineMarker(rawLines[peekIdx]);
            if (nextDetect.type !== 'none') {
              lineIdx++;
              break;
            }
          }
          lineIdx++;
          continue;
        }

        const nextDetect = detectLineMarker(line);
        if (nextDetect.type !== 'none') break;

        textLines.push(trimmedLine);
        lineIdx++;
      }

      const block: NoteBlock = {
        type: 'note',
        id: blockId,
        variant: isTip ? 'tip' : 'warning',
        title,
        text: textLines.filter(Boolean).join('\n').trim(),
        sourceLine: startLineNum,
        sourceEndLine: lineIdx
      };
      getActiveSection().blocks.push(block);
      continue;
    }

    // 7. Kazus (kazus: / @kazus)
    if (detection.type === 'case') {
      const startLineNum = currentLineNum;
      const caseTitle = detection.content;
      lineIdx++;

      let facts = '';
      let issue = '';
      let rule = '';
      let analysis = '';
      let conclusion = '';
      let court: string | undefined;

      let currentField: 'facts' | 'issue' | 'rule' | 'analysis' | 'conclusion' | 'court' | null = null;
      const fieldBuffers = {
        facts: [] as string[],
        issue: [] as string[],
        rule: [] as string[],
        analysis: [] as string[],
        conclusion: [] as string[],
        court: [] as string[]
      };

      while (lineIdx < rawLines.length) {
        const line = rawLines[lineIdx];
        const trimmedLine = line.trim();

        if (!trimmedLine) {
          if (fieldBuffers.conclusion.length > 0) {
            lineIdx++;
            break;
          }
          let peekIdx = lineIdx + 1;
          while (peekIdx < rawLines.length && !rawLines[peekIdx].trim()) peekIdx++;
          if (peekIdx < rawLines.length) {
            const nextRaw = rawLines[peekIdx];
            const nextTrim = nextRaw.trim().toLowerCase();
            let isQaNext = false;
            if (nextTrim.startsWith('savol:')) {
              for (let q = peekIdx + 1; q < rawLines.length && q < peekIdx + 6; q++) {
                const qLine = rawLines[q].trim().toLowerCase();
                if (qLine.startsWith('javob:') || qLine.startsWith('=')) {
                  isQaNext = true;
                  break;
                }
                if (qLine.startsWith('##') || qLine.startsWith(':::') || qLine.startsWith('kazus:')) break;
              }
            }
            if (isQaNext) {
              lineIdx++;
              break;
            }

            const isKazusField =
              nextTrim.startsWith('fakt:') ||
              nextTrim.startsWith('vaziyat:') ||
              nextTrim.startsWith('facts:') ||
              nextTrim.startsWith('savol:') ||
              nextTrim.startsWith('masala:') ||
              nextTrim.startsWith('issue:') ||
              nextTrim.startsWith('qoida:') ||
              nextTrim.startsWith('norma:') ||
              nextTrim.startsWith('rule:') ||
              nextTrim.startsWith('tahlil:') ||
              nextTrim.startsWith('analysis:') ||
              nextTrim.startsWith('xulosa:') ||
              nextTrim.startsWith('qaror:') ||
              nextTrim.startsWith('conclusion:') ||
              nextTrim.startsWith('manba:') ||
              nextTrim.startsWith('sud:') ||
              nextTrim.startsWith('court:') ||
              nextRaw.startsWith('  ') ||
              nextRaw.startsWith('\t');
            if (!isKazusField) {
              lineIdx++;
              break;
            }
          }
          lineIdx++;
          continue;
        }

        const lower = trimmedLine.toLowerCase();
        if (lower.startsWith('savol:')) {
          let isQaCurrent = false;
          for (let q = lineIdx + 1; q < rawLines.length && q < lineIdx + 6; q++) {
            const qLine = rawLines[q].trim().toLowerCase();
            if (qLine.startsWith('javob:') || qLine.startsWith('=')) {
              isQaCurrent = true;
              break;
            }
            if (qLine.startsWith('##') || qLine.startsWith(':::') || qLine.startsWith('kazus:')) break;
          }
          if (isQaCurrent) {
            break;
          }
        }

        const isField =
          lower.startsWith('fakt:') ||
          lower.startsWith('vaziyat:') ||
          lower.startsWith('facts:') ||
          lower.startsWith('savol:') ||
          lower.startsWith('masala:') ||
          lower.startsWith('issue:') ||
          lower.startsWith('qoida:') ||
          lower.startsWith('norma:') ||
          lower.startsWith('rule:') ||
          lower.startsWith('tahlil:') ||
          lower.startsWith('analysis:') ||
          lower.startsWith('xulosa:') ||
          lower.startsWith('qaror:') ||
          lower.startsWith('conclusion:') ||
          lower.startsWith('manba:') ||
          lower.startsWith('sud:') ||
          lower.startsWith('court:');

        const nextDetect = detectLineMarker(line);
        if (!isField && nextDetect.type !== 'none') break;

        if (lower.startsWith('fakt:') || lower.startsWith('vaziyat:') || lower.startsWith('facts:')) {
          currentField = 'facts';
          fieldBuffers.facts.push(trimmedLine.slice(trimmedLine.indexOf(':') + 1).trim());
        } else if (lower.startsWith('savol:') || lower.startsWith('masala:') || lower.startsWith('issue:')) {
          currentField = 'issue';
          fieldBuffers.issue.push(trimmedLine.slice(trimmedLine.indexOf(':') + 1).trim());
        } else if (lower.startsWith('qoida:') || lower.startsWith('norma:') || lower.startsWith('rule:')) {
          currentField = 'rule';
          fieldBuffers.rule.push(trimmedLine.slice(trimmedLine.indexOf(':') + 1).trim());
        } else if (lower.startsWith('tahlil:') || lower.startsWith('analysis:')) {
          currentField = 'analysis';
          fieldBuffers.analysis.push(trimmedLine.slice(trimmedLine.indexOf(':') + 1).trim());
        } else if (lower.startsWith('xulosa:') || lower.startsWith('qaror:') || lower.startsWith('conclusion:')) {
          currentField = 'conclusion';
          fieldBuffers.conclusion.push(trimmedLine.slice(trimmedLine.indexOf(':') + 1).trim());
        } else if (lower.startsWith('manba:') || lower.startsWith('sud:') || lower.startsWith('court:')) {
          currentField = 'court';
          fieldBuffers.court.push(trimmedLine.slice(trimmedLine.indexOf(':') + 1).trim());
        } else if (currentField) {
          fieldBuffers[currentField].push(trimmedLine);
        }
        lineIdx++;
      }

      facts = fieldBuffers.facts.join(' ').trim();
      issue = fieldBuffers.issue.join(' ').trim();
      rule = fieldBuffers.rule.join(' ').trim();
      analysis = fieldBuffers.analysis.join(' ').trim();
      conclusion = fieldBuffers.conclusion.join(' ').trim();
      court = fieldBuffers.court.join(' ').trim() || undefined;

      const hasFirac = Boolean(facts || issue || rule || analysis || conclusion);
      if (!hasFirac) {
        warnings.push({
          line: startLineNum,
          message: `${startLineNum}-qator: "kazus:" blokida kamida bitta kazus maydoni (vaziyat, masala, qoida, tahlil yoki xulosa) ko‘rsatilishi kerak.`,
          severity: 'warning'
        });
      }
      if (!rule) {
        warnings.push({
          line: startLineNum,
          message: `${startLineNum}-qator: "kazus:" blokida "qoida:" maydoni ko‘rsatilmadi.`,
          severity: 'warning'
        });
      }
      if (!conclusion) {
        warnings.push({
          line: startLineNum,
          message: `${startLineNum}-qator: "kazus:" blokida "xulosa:" maydoni ko‘rsatilmadi.`,
          severity: 'warning'
        });
      }

      const block: CaseBlock = {
        type: 'case',
        id: blockId,
        title: caseTitle || 'Sud kazusi',
        facts: facts || undefined,
        issue: issue || undefined,
        rule: rule || undefined,
        analysis: analysis || undefined,
        conclusion: conclusion || undefined,
        court,
        sourceLine: startLineNum,
        sourceEndLine: lineIdx,
        syntaxStyle: 'line'
      };
      getActiveSection().blocks.push(block);
      continue;
    }

    // 8. Jadval (Table)
    if (detection.type === 'table_row') {
      const headers = splitTableCells(detection.content);
      lineIdx++;

      const rows: string[][] = [];

      while (lineIdx < rawLines.length) {
        const line = rawLines[lineIdx];
        const trimmedLine = line.trim();

        if (!trimmedLine || !trimmedLine.startsWith('|')) {
          break;
        }

        // Ajratgich qatori: |---|---|
        if (/^\|[\s\-:|]+\|$/.test(trimmedLine)) {
          lineIdx++;
          continue;
        }

        const cells = splitTableCells(trimmedLine);
        if (cells.length !== headers.length) {
          warnings.push({
            line: lineIdx + 1,
            message: `${lineIdx + 1}-qator: Jadvaldagi ustunlar soni (${cells.length}) sarlavhadagi ustunlar soniga mos kelmadi (${headers.length} ta kutilgan edi).`,
            severity: 'warning'
          });
        }
        rows.push(cells);
        lineIdx++;
      }

      const block: TableBlock = {
        type: 'table',
        id: blockId,
        headers,
        rows,
        sourceLine: currentLineNum,
        sourceEndLine: lineIdx
      };
      getActiveSection().blocks.push(block);
      continue;
    }

    // 9. Ro'yxat (List)
    if (detection.type === 'list_unordered' || detection.type === 'list_ordered') {
      const isOrdered = detection.type === 'list_ordered';
      const items: string[] = [detection.content];
      lineIdx++;

      while (lineIdx < rawLines.length) {
        const line = rawLines[lineIdx];
        const trimmedLine = line.trim();
        if (!trimmedLine) {
          break;
        }

        const nextDetect = detectLineMarker(line);
        if (nextDetect.type === 'list_unordered' || nextDetect.type === 'list_ordered') {
          items.push(nextDetect.content);
          lineIdx++;
        } else {
          break;
        }
      }

      const block: ListBlock = {
        type: 'list',
        id: blockId,
        ordered: isOrdered,
        items,
        sourceLine: currentLineNum,
        sourceEndLine: lineIdx
      };
      getActiveSection().blocks.push(block);
      continue;
    }

    // 10. Taqqoslash (taqqos: A | B)
    if (detection.type === 'compare') {
      const compareHeaders = detection.content.split('|').map((s) => s.trim()).filter(Boolean);
      const itemsMap: Record<string, string[]> = {};
      compareHeaders.forEach((h) => {
        itemsMap[h] = [];
      });

      lineIdx++;

      while (lineIdx < rawLines.length) {
        const line = rawLines[lineIdx];
        const trimmedLine = line.trim();
        if (!trimmedLine) break;

        const nextDetect = detectLineMarker(line);
        if (nextDetect.type !== 'none' && nextDetect.type !== 'list_unordered') break;

        const itemContent = trimmedLine.replace(/^[-*]\s+/, '');
        const itemColon = itemContent.indexOf(':');

        if (itemColon > 0) {
          const title = itemContent.slice(0, itemColon).trim();
          const point = itemContent.slice(itemColon + 1).trim();
          if (!itemsMap[title]) itemsMap[title] = [];
          itemsMap[title].push(point);
        } else if (compareHeaders.length > 0) {
          itemsMap[compareHeaders[0]].push(itemContent);
        }
        lineIdx++;
      }

      const block: CompareBlock = {
        type: 'compare',
        id: blockId,
        sourceLine: currentLineNum,
        sourceEndLine: lineIdx,
        items: Object.keys(itemsMap).map((title) => ({
          title,
          points: itemsMap[title]
        }))
      };
      getActiveSection().blocks.push(block);
      continue;
    }

    // 11. Jarayon (jarayon:)
    if (detection.type === 'flow') {
      const stepTexts: Array<{ title: string; sourceLine?: number }> = [];
      const flowStartLine = currentLineNum;
      const flowTitle = detection.content ? detection.content.trim() : undefined;
      lineIdx++;

      while (lineIdx < rawLines.length) {
        const line = rawLines[lineIdx];
        const trimmedLine = line.trim();
        if (!trimmedLine) break;

        const nextDetect = detectLineMarker(line);
        if (nextDetect.type !== 'none') break;

        const thisStepLine = lineIdx + 1;
        if (trimmedLine.includes('->')) {
          const parts = trimmedLine.split('->').map((p) => p.trim()).filter(Boolean);
          parts.forEach((p) => stepTexts.push({ title: p, sourceLine: thisStepLine }));
        } else {
          stepTexts.push({ title: trimmedLine.replace(/^[-*]\s+/, ''), sourceLine: thisStepLine });
        }
        lineIdx++;
      }

      if (stepTexts.length === 0) {
        warnings.push({
          line: currentLineNum,
          message: `${currentLineNum}-qator: "jarayon:" blokida "->" bilan bosqichlar topilmadi.`,
          severity: 'warning'
        });
      }

      const block: FlowBlock = {
        type: 'flow',
        id: blockId,
        title: flowTitle,
        steps: stepTexts,
        sourceLine: flowStartLine,
        sourceEndLine: lineIdx
      };
      getActiveSection().blocks.push(block);
      continue;
    }

    // 12. Vaqt xaritasi (vaqt:)
    if (detection.type === 'timeline') {
      const timelineTitle = detection.content;
      const events: { date: string; title: string; description: string }[] = [];
      const timelineStartLine = currentLineNum;
      lineIdx++;

      while (lineIdx < rawLines.length) {
        const line = rawLines[lineIdx];
        const trimmedLine = line.trim();
        if (!trimmedLine) break;

        const nextDetect = detectLineMarker(line);
        if (nextDetect.type !== 'none') break;

        if (trimmedLine.includes('|')) {
          const [datePart, ...descParts] = trimmedLine.split('|');
          events.push({
            date: datePart.trim(),
            title: timelineTitle || 'Voqea',
            description: descParts.join('|').trim()
          });
        }
        lineIdx++;
      }

      const block: TimelineBlock = {
        type: 'timeline',
        id: blockId,
        sourceLine: timelineStartLine,
        sourceEndLine: lineIdx,
        events
      };
      getActiveSection().blocks.push(block);
      continue;
    }

    // 13. AI Markdown odatlari: '### Subtitle' yoki '> Quote'
    if (trimmed.startsWith('###')) {
      const subText = trimmed.replace(/^###\s*/, '').trim();
      warnings.push({
        line: currentLineNum,
        message: `${currentLineNum}-qator: "###" kichik sarlavhasi qalin matn sifatida qabul qilindi.`,
        severity: 'info'
      });
      const block: TextBlock = {
        type: 'text',
        id: blockId,
        text: `**${subText}**`
      };
      getActiveSection().blocks.push(block);
      lineIdx++;
      continue;
    }

    if (trimmed.startsWith('>')) {
      const quoteText = trimmed.replace(/^>\s*/, '').trim();
      const block: NoteBlock = {
        type: 'note',
        id: blockId,
        variant: 'important',
        text: quoteText
      };
      getActiveSection().blocks.push(block);
      lineIdx++;
      continue;
    }

    // 14. Oddiy matn (Text paragraph)
    const textStartLine = currentLineNum;
    const textLines: string[] = [];
    let detectedTextId = detection.explicitId;
    if (detection.content) {
      const { cleanLine, id } = extractExplicitId(detection.content);
      if (id && !detectedTextId) detectedTextId = id;
      textLines.push(cleanLine);
    }

    lineIdx++;

    while (lineIdx < rawLines.length) {
      const line = rawLines[lineIdx];
      const trimmedLine = line.trim();

      if (!trimmedLine) {
        lineIdx++;
        break;
      }

      const nextDetect = detectLineMarker(line);
      if (nextDetect.type !== 'none') {
        break;
      }

      const { cleanLine, id } = extractExplicitId(trimmedLine);
      if (id && !detectedTextId) {
        detectedTextId = id;
      }
      textLines.push(cleanLine);
      lineIdx++;
    }

    const block: TextBlock = {
      type: 'text',
      id: blockId || detectedTextId,
      text: textLines.join('\n').trim(),
      sourceLine: textStartLine,
      sourceEndLine: lineIdx
    };
    getActiveSection().blocks.push(block);
  }

  if (document.toc === undefined) {
    document.toc = document.sections.length > 1;
  }

  // Barqaror ID larni biriktirish (Ids optional and silent)
  const { document: stableDoc } = ensureStableIds(document);

  return {
    document: stableDoc,
    warnings
  };
}
