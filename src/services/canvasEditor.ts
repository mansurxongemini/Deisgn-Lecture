/**
 * YURIST STUDIO — DIRECT ON-CANVAS EDITING ENGINE
 *
 * O‘quv kartochkalaridagi matnlarni to‘g‘ridan-to‘g‘ri (Canva kabi)
 * tahrirlash va MD+ manba matniga xatosiz (two-way binding)
 * o‘tkazish xizmati.
 */

import { parseMarkdownPlus } from '../schema/mdParser';

export type CanvasEditType =
  | 'doc_title'
  | 'doc_subtitle'
  | 'sec_title'
  | 'sec_subtitle'
  | 'paragraph'
  | 'norm_title'
  | 'norm_text'
  | 'norm_source'
  | 'qa_question'
  | 'qa_answer'
  | 'def_term'
  | 'def_body'
  | 'def_source'
  | 'note_title'
  | 'note_text'
  | 'case_title'
  | 'case_facts'
  | 'case_issue'
  | 'case_rule'
  | 'case_analysis'
  | 'case_conclusion'
  | 'list_item'
  | 'table_cell'
  | 'table_caption'
  | 'flow_title'
  | 'flow_step'
  | 'flow_desc'
  | 'timeline_date'
  | 'timeline_title'
  | 'timeline_desc'
  | 'compare_title'
  | 'compare_point';

export interface CanvasEditPayload {
  editType: CanvasEditType;
  newText: string;
  sourceLine?: number;
  blockId?: string;
  sectionTitle?: string;
  originalText?: string;
  itemIdx?: number;
  rowIdx?: number;
  colIdx?: number;
}

export interface CanvasEditResult {
  success: boolean;
  newSource?: string;
  error?: string;
}

/**
 * Matn ichidagi maxsus markdown id suffiksini ({#id}) ajratish
 */
function extractIdSuffix(line: string): { base: string; suffix: string } {
  const match = line.match(/\s*\{#([a-zA-Z0-9_-]+)\}\s*$/);
  if (match) {
    return {
      base: line.slice(0, match.index).trimEnd(),
      suffix: ` {#${match[1]}}`
    };
  }
  return { base: line, suffix: '' };
}

/**
 * Kanvasda kiritilgan tahrirni MD+ manba matniga xavfsiz tatbiq etish
 */
export function applyCanvasEditToSource(
  sourceMd: string,
  payload: CanvasEditPayload
): CanvasEditResult {
  const cleanNewText = payload.newText.trim();
  const lines = sourceMd.split('\n');

  try {
    switch (payload.editType) {
      case 'doc_title': {
        // Hujjat sarlavhasi: # ...
        let targetIdx = -1;
        if (payload.sourceLine && payload.sourceLine >= 1 && payload.sourceLine <= lines.length) {
          const l = lines[payload.sourceLine - 1];
          if (/^#\s+/.test(l) && !l.startsWith('##')) {
            targetIdx = payload.sourceLine - 1;
          }
        }
        if (targetIdx === -1) {
          targetIdx = lines.findIndex((l) => /^#\s+/.test(l) && !l.startsWith('##'));
        }

        if (targetIdx !== -1) {
          const { suffix } = extractIdSuffix(lines[targetIdx]);
          lines[targetIdx] = `# ${cleanNewText}${suffix}`;
        } else {
          lines.unshift(`# ${cleanNewText}`);
        }
        break;
      }

      case 'doc_subtitle': {
        // Hujjat izohi: izoh: ... yoki subtitle: ...
        let targetIdx = -1;
        if (payload.sourceLine && payload.sourceLine >= 1 && payload.sourceLine <= lines.length) {
          targetIdx = payload.sourceLine - 1;
        } else {
          targetIdx = lines.findIndex((l) => /^(?:izoh|subtitle):\s*/i.test(l));
        }

        if (targetIdx !== -1) {
          lines[targetIdx] = `izoh: ${cleanNewText}`;
        } else {
          // # sarlavhadan keyinga qo'shish
          const titleIdx = lines.findIndex((l) => /^#\s+/.test(l) && !l.startsWith('##'));
          if (titleIdx !== -1) {
            lines.splice(titleIdx + 1, 0, `izoh: ${cleanNewText}`);
          } else {
            lines.unshift(`izoh: ${cleanNewText}`);
          }
        }
        break;
      }

      case 'sec_title': {
        // Bo'lim sarlavhasi: ## ...
        let targetIdx = -1;
        if (payload.sourceLine && payload.sourceLine >= 1 && payload.sourceLine <= lines.length) {
          const l = lines[payload.sourceLine - 1];
          if (l.startsWith('## ') && !l.startsWith('###')) {
            targetIdx = payload.sourceLine - 1;
          }
        }
        if (targetIdx === -1 && payload.sectionTitle) {
          targetIdx = lines.findIndex((l) => l.startsWith('## ') && l.includes(payload.sectionTitle!));
        }
        if (targetIdx === -1 && payload.blockId) {
          targetIdx = lines.findIndex((l) => l.includes(`{#${payload.blockId}}`));
        }

        if (targetIdx !== -1) {
          const { suffix } = extractIdSuffix(lines[targetIdx]);
          lines[targetIdx] = `## ${cleanNewText}${suffix}`;
        } else {
          return { success: false, error: 'Bo‘lim sarlavhasi manbada topilmadi' };
        }
        break;
      }

      case 'sec_subtitle': {
        // Bo'lim izohi: ## sarlavhadan keyingi birinchi qator
        let secIdx = -1;
        if (payload.sourceLine && payload.sourceLine >= 1 && payload.sourceLine <= lines.length) {
          secIdx = payload.sourceLine - 1;
        } else if (payload.sectionTitle) {
          secIdx = lines.findIndex((l) => l.startsWith('## ') && l.includes(payload.sectionTitle!));
        }

        if (secIdx !== -1) {
          const nextIdx = secIdx + 1;
          if (nextIdx < lines.length && lines[nextIdx].trim() && !lines[nextIdx].startsWith('#') && !lines[nextIdx].includes(':')) {
            lines[nextIdx] = cleanNewText;
          } else {
            lines.splice(secIdx + 1, 0, cleanNewText);
          }
        } else {
          return { success: false, error: 'Bo‘lim izohi joyi topilmadi' };
        }
        break;
      }

      case 'paragraph': {
        // Oddiy matn (TextBlock)
        let targetIdx = -1;
        if (payload.sourceLine && payload.sourceLine >= 1 && payload.sourceLine <= lines.length) {
          targetIdx = payload.sourceLine - 1;
        } else if (payload.originalText) {
          const firstOrigLine = payload.originalText.split('\n')[0].trim();
          targetIdx = lines.findIndex((l) => l.trim().includes(firstOrigLine));
        }

        if (targetIdx !== -1) {
          const { suffix } = extractIdSuffix(lines[targetIdx]);
          lines[targetIdx] = `${cleanNewText}${suffix}`;
        } else {
          return { success: false, error: 'Paragraf matni manbada topilmadi' };
        }
        break;
      }

      case 'norm_title': {
        // Norma sarlavhasi yoki modda raqami: norma: ... yoki § ...
        let targetIdx = -1;
        if (payload.sourceLine && payload.sourceLine >= 1 && payload.sourceLine <= lines.length) {
          targetIdx = payload.sourceLine - 1;
        } else if (payload.blockId) {
          targetIdx = lines.findIndex((l) => l.includes(`{#${payload.blockId}}`));
        }

        if (targetIdx !== -1) {
          const currentLine = lines[targetIdx];
          const colonIdx = currentLine.indexOf(':');
          const { suffix } = extractIdSuffix(currentLine);

          if (/^norma:\s*/i.test(currentLine)) {
            // Agar cleanNewText da allaqachon raqam bo'lsa (masalan "1-modda. Inson huquqlari")
            lines[targetIdx] = `norma: ${cleanNewText}${suffix}`;
          } else if (/^§\s*/i.test(currentLine)) {
            lines[targetIdx] = `§ ${cleanNewText}${suffix}`;
          } else if (colonIdx > 0) {
            const prefix = currentLine.slice(0, colonIdx + 1);
            lines[targetIdx] = `${prefix} ${cleanNewText}${suffix}`;
          } else {
            lines[targetIdx] = `norma: ${cleanNewText}${suffix}`;
          }
        } else {
          return { success: false, error: 'Norma sarlavhasi topilmadi' };
        }
        break;
      }

      case 'norm_text': {
        // Norma matni (headerdan keyingi qatorlar)
        let headerIdx = -1;
        if (payload.sourceLine && payload.sourceLine >= 1 && payload.sourceLine <= lines.length) {
          headerIdx = payload.sourceLine - 1;
        } else if (payload.blockId) {
          headerIdx = lines.findIndex((l) => l.includes(`{#${payload.blockId}}`));
        }

        if (headerIdx !== -1) {
          // Headerdan keyingi tana qatorlarini topamiz
          let bodyStart = headerIdx + 1;
          let bodyEnd = bodyStart;
          while (bodyEnd < lines.length) {
            const l = lines[bodyEnd].trim().toLowerCase();
            if (!l) {
              bodyEnd++;
              break;
            }
            if (l.startsWith('manba:') || l.startsWith('sana:') || l.startsWith('source:') || l.startsWith('date:')) {
              break;
            }
            if (/^#|^norma:|^ta'rif:|^savol:|^\?|^kazus:|^!|^==|^\|/.test(l)) {
              break;
            }
            bodyEnd++;
          }

          const countToReplace = Math.max(1, bodyEnd - bodyStart);
          lines.splice(bodyStart, countToReplace, cleanNewText);
        } else {
          return { success: false, error: 'Norma matni qatori topilmadi' };
        }
        break;
      }

      case 'qa_question': {
        // Savol qatori: ? ... yoki savol: ...
        let targetIdx = -1;
        if (payload.sourceLine && payload.sourceLine >= 1 && payload.sourceLine <= lines.length) {
          const l = lines[payload.sourceLine - 1];
          if (l.startsWith('?') || /^savol:\s*/i.test(l)) {
            targetIdx = payload.sourceLine - 1;
          }
        }
        if (targetIdx === -1 && payload.sourceLine) {
          const start = Math.max(0, payload.sourceLine - 5);
          const end = Math.min(lines.length, payload.sourceLine + 5);
          for (let i = start; i < end; i++) {
            const l = lines[i].trim();
            if (l.startsWith('?') || /^savol:\s*/i.test(l)) {
              targetIdx = i;
              break;
            }
          }
        }
        if (targetIdx === -1 && payload.blockId) {
          targetIdx = lines.findIndex((l) => l.includes(`{#${payload.blockId}}`));
        }

        if (targetIdx !== -1) {
          const l = lines[targetIdx];
          const { suffix } = extractIdSuffix(l);
          if (l.startsWith('?')) {
            lines[targetIdx] = `? ${cleanNewText}${suffix}`;
          } else if (/^savol:\s*/i.test(l)) {
            lines[targetIdx] = `savol: ${cleanNewText}${suffix}`;
          } else {
            lines[targetIdx] = `? ${cleanNewText}${suffix}`;
          }
        } else {
          return { success: false, error: 'Savol matni topilmadi' };
        }
        break;
      }

      case 'qa_answer': {
        // Javob qatori: = ... yoki javob: ...
        let searchStart = 0;
        if (payload.sourceLine && payload.sourceLine >= 1 && payload.sourceLine <= lines.length) {
          searchStart = payload.sourceLine - 1;
        } else if (payload.blockId) {
          const qIdx = lines.findIndex((l) => l.includes(`{#${payload.blockId}}`));
          if (qIdx !== -1) searchStart = qIdx;
        }

        let ansIdx = -1;
        for (let i = searchStart; i < Math.min(lines.length, searchStart + 10); i++) {
          const l = lines[i].trim();
          if (l.startsWith('=') || /^javob:\s*/i.test(l)) {
            ansIdx = i;
            break;
          }
        }

        if (ansIdx !== -1) {
          const l = lines[ansIdx];
          const { suffix } = extractIdSuffix(l);
          if (l.startsWith('=')) {
            lines[ansIdx] = `= ${cleanNewText}${suffix}`;
          } else {
            lines[ansIdx] = `javob: ${cleanNewText}${suffix}`;
          }
        } else {
          return { success: false, error: 'Javob matni topilmadi' };
        }
        break;
      }

      case 'def_term': {
        // Ta'rif atamasi: ta'rif: ... yoki ~ ...
        let targetIdx = -1;
        if (payload.sourceLine && payload.sourceLine >= 1 && payload.sourceLine <= lines.length) {
          const l = lines[payload.sourceLine - 1];
          if (/^ta'rif:\s*/i.test(l) || l.startsWith('~')) {
            targetIdx = payload.sourceLine - 1;
          }
        }
        if (targetIdx === -1 && payload.blockId) {
          targetIdx = lines.findIndex((l) => l.includes(`{#${payload.blockId}}`));
        }

        if (targetIdx !== -1) {
          const l = lines[targetIdx];
          const colonIdx = l.indexOf(':');
          const { suffix } = extractIdSuffix(l);
          if (/^ta'rif:\s*/i.test(l) && colonIdx > 0) {
            lines[targetIdx] = `ta'rif: ${cleanNewText}${suffix}`;
          } else if (l.startsWith('~')) {
            lines[targetIdx] = `~ ${cleanNewText}${suffix}`;
          } else {
            lines[targetIdx] = `ta'rif: ${cleanNewText}${suffix}`;
          }
        } else {
          return { success: false, error: 'Ta’rif atamasi topilmadi' };
        }
        break;
      }

      case 'def_body': {
        // Ta'rif matni
        let targetIdx = -1;
        if (payload.sourceLine && payload.sourceLine >= 1 && payload.sourceLine < lines.length) {
          targetIdx = payload.sourceLine; // headerdan keyingi qator
        }
        if (targetIdx !== -1 && targetIdx < lines.length) {
          lines[targetIdx] = cleanNewText;
        } else {
          return { success: false, error: 'Ta’rif matni topilmadi' };
        }
        break;
      }

      case 'note_text': {
        // Ogoh/Maslahat matni: ! ... yoki + ...
        let targetIdx = -1;
        if (payload.sourceLine && payload.sourceLine >= 1 && payload.sourceLine <= lines.length) {
          const l = lines[payload.sourceLine - 1];
          if (l.startsWith('!') || l.startsWith('+') || /^(?:ogoh|maslahat):\s*/i.test(l)) {
            targetIdx = payload.sourceLine - 1;
          }
        }
        if (targetIdx === -1 && payload.blockId) {
          targetIdx = lines.findIndex((l) => l.includes(`{#${payload.blockId}}`));
        }

        if (targetIdx !== -1) {
          const l = lines[targetIdx];
          const { suffix } = extractIdSuffix(l);
          if (l.startsWith('!')) {
            lines[targetIdx] = `! ${cleanNewText}${suffix}`;
          } else if (l.startsWith('+')) {
            lines[targetIdx] = `+ ${cleanNewText}${suffix}`;
          } else if (/^(?:ogoh|maslahat):\s*/i.test(l)) {
            const prefix = l.match(/^(?:ogoh|maslahat):\s*/i)![0];
            lines[targetIdx] = `${prefix}${cleanNewText}${suffix}`;
          } else {
            lines[targetIdx] = `! ${cleanNewText}${suffix}`;
          }
        } else {
          return { success: false, error: 'Eslatma matni topilmadi' };
        }
        break;
      }

      case 'case_title': {
        let targetIdx = -1;
        if (payload.sourceLine && payload.sourceLine >= 1 && payload.sourceLine <= lines.length) {
          targetIdx = payload.sourceLine - 1;
        }
        if (targetIdx !== -1) {
          const { suffix } = extractIdSuffix(lines[targetIdx]);
          lines[targetIdx] = `kazus: ${cleanNewText}${suffix}`;
        }
        break;
      }

      case 'list_item': {
        // Ro'yxat bandi (- band, 1. band, va h.k.)
        let startSearch = 0;
        if (payload.sourceLine && payload.sourceLine >= 1 && payload.sourceLine <= lines.length) {
          startSearch = payload.sourceLine - 1;
        } else if (payload.blockId) {
          const bIdx = lines.findIndex((l) => l.includes(`{#${payload.blockId}}`));
          if (bIdx !== -1) startSearch = bIdx;
        }

        // Qatorlar orasidan kerakli list bandini topamiz
        const itemIdx = payload.itemIdx ?? 0;
        let currentItem = 0;
        let targetLineIdx = -1;

        for (let i = startSearch; i < Math.min(lines.length, startSearch + 50); i++) {
          const line = lines[i];
          const listMatch = line.match(/^(\s*(?:[-*+]|\d+\.)\s+)/);
          if (listMatch) {
            if (currentItem === itemIdx) {
              targetLineIdx = i;
              break;
            }
            currentItem++;
          } else if (i > startSearch && line.trim() && !line.startsWith(' ') && !line.startsWith('\t')) {
            // Ro'yxat tugagan bo'lishi mumkin
            break;
          }
        }

        if (targetLineIdx !== -1) {
          const line = lines[targetLineIdx];
          const match = line.match(/^(\s*(?:[-*+]|\d+\.)\s+)/);
          const prefix = match ? match[1] : '- ';
          const { suffix } = extractIdSuffix(line);
          lines[targetLineIdx] = `${prefix}${cleanNewText}${suffix}`;
        } else {
          return { success: false, error: 'Ro‘yxat bandi topilmadi' };
        }
        break;
      }

      case 'table_cell': {
        // Jadval katagi (th yoki td)
        let tableStart = 0;
        if (payload.sourceLine && payload.sourceLine >= 1 && payload.sourceLine <= lines.length) {
          tableStart = payload.sourceLine - 1;
        } else if (payload.blockId) {
          const bIdx = lines.findIndex((l) => l.includes(`{#${payload.blockId}}`));
          if (bIdx !== -1) tableStart = bIdx;
        }

        // Jadval qatorlarini topamiz
        const tableLines: number[] = [];
        for (let i = tableStart; i < Math.min(lines.length, tableStart + 100); i++) {
          const l = lines[i].trim();
          if (l.startsWith('|') && l.endsWith('|')) {
            tableLines.push(i);
          } else if (tableLines.length > 0 && l && !l.startsWith('|')) {
            break;
          }
        }

        if (tableLines.length < 2) {
          return { success: false, error: 'Jadval tuzilishi topilmadi' };
        }

        // Agar ikkinchi qatorda --- bo'lsa, separator hisoblanadi
        const hasSep = tableLines.length > 1 && /^[-:| ]+$/.test(lines[tableLines[1]].replace(/\|/g, '').trim());
        const bodyStartOffset = hasSep ? 2 : 1;

        const isHeader = payload.rowIdx === undefined || payload.rowIdx === -1;
        let lineIdxToEdit = -1;

        if (isHeader) {
          lineIdxToEdit = tableLines[0]; // Sarlavha qatori
        } else {
          const bodyRowIdx = (payload.rowIdx ?? 0) + bodyStartOffset;
          if (bodyRowIdx < tableLines.length) {
            lineIdxToEdit = tableLines[bodyRowIdx];
          }
        }

        if (lineIdxToEdit !== -1) {
          const rawLine = lines[lineIdxToEdit];
          const cells = rawLine.split('|');
          const colIdx = payload.colIdx ?? 0;
          const targetCellIdx = colIdx + 1;

          if (targetCellIdx >= 1 && targetCellIdx < cells.length - 1) {
            cells[targetCellIdx] = ` ${cleanNewText} `;
            lines[lineIdxToEdit] = cells.join('|');
          } else {
            return { success: false, error: 'Jadval ustuni topilmadi' };
          }
        } else {
          return { success: false, error: 'Jadval qatori topilmadi' };
        }
        break;
      }

      case 'norm_source': {
        let headerIdx = -1;
        if (payload.sourceLine && payload.sourceLine >= 1 && payload.sourceLine <= lines.length) {
          headerIdx = payload.sourceLine - 1;
        } else if (payload.blockId) {
          headerIdx = lines.findIndex((l) => l.includes(`{#${payload.blockId}}`));
        }
        if (headerIdx !== -1) {
          for (let i = headerIdx; i < Math.min(lines.length, headerIdx + 10); i++) {
            if (/^(?:manba|source):\s*/i.test(lines[i])) {
              lines[i] = `manba: ${cleanNewText}`;
              break;
            }
          }
        }
        break;
      }

      case 'def_source': {
        let targetIdx = -1;
        if (payload.sourceLine && payload.sourceLine >= 1 && payload.sourceLine <= lines.length) {
          targetIdx = payload.sourceLine - 1;
        }
        if (targetIdx !== -1) {
          for (let i = targetIdx; i < Math.min(lines.length, targetIdx + 5); i++) {
            if (/^(?:manba|source):\s*/i.test(lines[i])) {
              lines[i] = `manba: ${cleanNewText}`;
              break;
            }
          }
        }
        break;
      }

      case 'note_title': {
        let targetIdx = -1;
        if (payload.sourceLine && payload.sourceLine >= 1 && payload.sourceLine <= lines.length) {
          targetIdx = payload.sourceLine - 1;
        }
        if (targetIdx !== -1) {
          lines[targetIdx] = `ogoh: ${cleanNewText}`;
        }
        break;
      }

      case 'case_facts':
      case 'case_issue':
      case 'case_rule':
      case 'case_analysis':
      case 'case_conclusion': {
        const fieldPrefixMap: Record<string, string> = {
          case_facts: 'fakt:',
          case_issue: 'masala:',
          case_rule: 'qoida:',
          case_analysis: 'tahlil:',
          case_conclusion: 'xulosa:'
        };
        const searchRegexMap: Record<string, RegExp> = {
          case_facts: /^(?:fakt|faktlar|vaziyat|facts):\s*/i,
          case_issue: /^(?:masala|savol|issue):\s*/i,
          case_rule: /^(?:qoida|norma|rule):\s*/i,
          case_analysis: /^(?:tahlil|analysis):\s*/i,
          case_conclusion: /^(?:xulosa|qaror|conclusion):\s*/i
        };

        const prefix = fieldPrefixMap[payload.editType] || 'fakt:';
        const regex = searchRegexMap[payload.editType];

        let startSearch = 0;
        if (payload.sourceLine && payload.sourceLine >= 1 && payload.sourceLine <= lines.length) {
          startSearch = payload.sourceLine - 1;
        } else if (payload.blockId) {
          const bIdx = lines.findIndex((l) => l.includes(`{#${payload.blockId}}`));
          if (bIdx !== -1) startSearch = bIdx;
        }

        let targetLine = -1;
        for (let i = startSearch; i < Math.min(lines.length, startSearch + 20); i++) {
          if (regex.test(lines[i].trim())) {
            targetLine = i;
            break;
          }
        }

        if (targetLine !== -1) {
          lines[targetLine] = `${prefix} ${cleanNewText}`;
        } else {
          // Maydon mavjud bo'lmasa kazus blokiga yangi satr sifatida qo'shamiz
          lines.splice(startSearch + 1, 0, `${prefix} ${cleanNewText}`);
        }
        break;
      }

      case 'flow_title': {
        let targetIdx = -1;
        if (payload.sourceLine && payload.sourceLine >= 1 && payload.sourceLine <= lines.length) {
          targetIdx = payload.sourceLine - 1;
        } else if (payload.blockId) {
          targetIdx = lines.findIndex((l) => l.includes(`{#${payload.blockId}}`));
        }
        if (targetIdx !== -1) {
          const currentLine = lines[targetIdx];
          const colonIdx = currentLine.indexOf(':');
          const { suffix } = extractIdSuffix(currentLine);
          if (colonIdx !== -1) {
            const prefix = currentLine.slice(0, colonIdx + 1);
            lines[targetIdx] = `${prefix} ${cleanNewText}${suffix}`;
          } else {
            lines[targetIdx] = `jarayon: ${cleanNewText}${suffix}`;
          }
        }
        break;
      }

      case 'flow_step': {
        let startSearch = 0;
        if (payload.sourceLine && payload.sourceLine >= 1 && payload.sourceLine <= lines.length) {
          startSearch = payload.sourceLine - 1;
        }
        // flow line might be "jarayon: a -> b -> c"
        const itemIdx = payload.itemIdx ?? 0;
        for (let i = startSearch; i < Math.min(lines.length, startSearch + 15); i++) {
          const l = lines[i];
          if (l.includes('->')) {
            const steps = l.split('->');
            if (itemIdx < steps.length) {
              steps[itemIdx] = ` ${cleanNewText} `;
              lines[i] = steps.join('->');
              break;
            }
          }
        }
        break;
      }

      case 'flow_desc': {
        // Description for flow step
        break;
      }

      case 'timeline_date':
      case 'timeline_title':
      case 'timeline_desc': {
        let startSearch = 0;
        if (payload.sourceLine && payload.sourceLine >= 1 && payload.sourceLine <= lines.length) {
          startSearch = payload.sourceLine - 1;
        }
        const itemIdx = payload.itemIdx ?? 0;
        let eventCount = 0;
        for (let i = startSearch; i < Math.min(lines.length, startSearch + 30); i++) {
          const l = lines[i];
          if (l.includes('|')) {
            if (eventCount === itemIdx) {
              const [datePart, ...rest] = l.split('|');
              if (payload.editType === 'timeline_date') {
                lines[i] = `${cleanNewText} | ${rest.join('|').trim()}`;
              } else {
                lines[i] = `${datePart.trim()} | ${cleanNewText}`;
              }
              break;
            }
            eventCount++;
          }
        }
        break;
      }

      case 'compare_title':
      case 'compare_point': {
        // Compare block lines
        break;
      }

      case 'table_caption': {
        let targetIdx = -1;
        if (payload.sourceLine && payload.sourceLine >= 1 && payload.sourceLine <= lines.length) {
          targetIdx = payload.sourceLine - 1;
        }
        if (targetIdx !== -1) {
          lines[targetIdx] = `Jadval: ${cleanNewText}`;
        }
        break;
      }

      default:
        return { success: false, error: 'Noma’lum tahrirlash turi' };
    }

    const newSource = lines.join('\n');

    // 5-Talab: Butunlikni tekshirish (Protect Integrity)
    // Tahrir natijasida MD+ tuzilishi buzilmasligi shart!
    const parsed = parseMarkdownPlus(newSource);
    if (!parsed.document || parsed.document.sections.length === 0) {
      return {
        success: false,
        error: 'Tahrirlash natijasida hujjat tuzilishi buzildi. O‘zgarish bekor qilindi.'
      };
    }

    return {
      success: true,
      newSource
    };
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || 'Tahrirni qo‘llashda xatolik yuz berdi'
    };
  }
}
