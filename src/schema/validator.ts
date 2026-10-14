import type { LegalDocument, ValidationIssue, ValidationResult } from './types';
import { ensureStableIds } from './idUtils';

/**
 * JSON matnidan qator raqamini qidirib topish
 */
function findLineNumber(jsonText: string, searchTerm: string): number | undefined {
  if (!jsonText || !searchTerm) return undefined;
  const lines = jsonText.split('\n');
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes(searchTerm)) {
      return i + 1;
    }
  }
  return undefined;
}

export function validateLegalDocumentJson(jsonText: string): ValidationResult {
  const issues: ValidationIssue[] = [];

  if (!jsonText || !jsonText.trim()) {
    return {
      valid: false,
      document: null,
      issues: [
        {
          path: '',
          message: 'JSON matni bo‘sh. Iltimos, namunaviy hujjatni yuklang yoki JSON kiriting.',
          severity: 'error'
        }
      ],
      warnings: []
    };
  }

  let rawData: unknown;
  try {
    rawData = JSON.parse(jsonText);
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    // JSON parse xatoliklaridan qator va ustunni aniqlash
    const lineMatch = errorMsg.match(/line (\d+) column (\d+)/i) || errorMsg.match(/position (\d+)/i);
    let line: number | undefined;
    if (lineMatch && lineMatch[1] && !lineMatch[2]) {
      const pos = parseInt(lineMatch[1], 10);
      line = jsonText.substring(0, pos).split('\n').length;
    } else if (lineMatch && lineMatch[1]) {
      line = parseInt(lineMatch[1], 10);
    }

    return {
      valid: false,
      document: null,
      issues: [
        {
          path: '',
          message: `JSON sintaksisida xatolik bor: ${errorMsg}`,
          severity: 'error',
          line
        }
      ],
      warnings: []
    };
  }

  if (typeof rawData !== 'object' || rawData === null || Array.isArray(rawData)) {
    return {
      valid: false,
      document: null,
      issues: [
        {
          path: '',
          message: 'Hujjatning yuqori darajasi obyekt (object) bo‘lishi kerak.',
          severity: 'error'
        }
      ],
      warnings: []
    };
  }

  const doc = rawData as Record<string, unknown>;

  // 1. Version tekshiruvi (son yoki matn qabul qilinadi, bo'lmasa ogohlantirish bilan 1.0 deb olinadi)
  let normalizedVersion = '1.0';
  const initialWarnings: ValidationIssue[] = [];

  if (doc.version === undefined || doc.version === null) {
    initialWarnings.push({
      path: 'version',
      message: 'Hujjatda "version" ko‘rsatilmagan. Standart "1.0" versiyasi deb qabul qilindi.',
      severity: 'warning'
    });
  } else if (typeof doc.version === 'number') {
    normalizedVersion = String(doc.version);
  } else if (typeof doc.version === 'string' && doc.version.trim()) {
    normalizedVersion = doc.version.trim();
  } else {
    initialWarnings.push({
      path: 'version',
      message: 'Hujjat "version" maydoni matn yoki son bo‘lishi lozim. Standart "1.0" versiyasi o‘rnatildi.',
      severity: 'warning'
    });
  }
  doc.version = normalizedVersion;

  // 2. Title tekshiruvi
  if (!doc.title || typeof doc.title !== 'string' || !doc.title.trim()) {
    issues.push({
      path: 'title',
      message: 'Hujjatda asosiy sarlavha ("title") kiritilishi shart.',
      severity: 'error',
      line: findLineNumber(jsonText, '"title"')
    });
  }

  // 3. Sections tekshiruvi
  if (!Array.isArray(doc.sections)) {
    issues.push({
      path: 'sections',
      message: 'Hujjatda "sections" ro‘yxati (massiv) bo‘lishi shart.',
      severity: 'error',
      line: findLineNumber(jsonText, '"sections"')
    });
  } else if (doc.sections.length === 0) {
    issues.push({
      path: 'sections',
      message: '"sections" ro‘yxatida kamida 1 ta bo‘lim bo‘lishi kerak.',
      severity: 'error'
    });
  } else {
    // Har bir bo'limni tekshirish
    doc.sections.forEach((secRaw: unknown, sIdx: number) => {
      const secPrefix = `${sIdx + 1}-bo‘lim`;
      if (typeof secRaw !== 'object' || secRaw === null || Array.isArray(secRaw)) {
        issues.push({
          path: `sections[${sIdx}]`,
          message: `${secPrefix}: bo‘lim ma’lumotlari obyekt bo‘lishi kerak.`,
          severity: 'error'
        });
        return;
      }

      const sec = secRaw as Record<string, unknown>;

      if (!sec.title || typeof sec.title !== 'string' || !sec.title.trim()) {
        issues.push({
          path: `sections[${sIdx}].title`,
          message: `${secPrefix}: bo‘lim sarlavhasi ("title") kiritilishi shart.`,
          severity: 'error'
        });
      }

      if (!Array.isArray(sec.blocks)) {
        issues.push({
          path: `sections[${sIdx}].blocks`,
          message: `${secPrefix}: bloklar ro‘yxati ("blocks") massiv bo‘lishi shart.`,
          severity: 'error'
        });
      } else if (sec.blocks.length === 0) {
        issues.push({
          path: `sections[${sIdx}].blocks`,
          message: `${secPrefix}: bloklar ro‘yxatida kamida 1 ta blok bo‘lishi kerak.`,
          severity: 'error'
        });
      } else {
        // Har bir blokni tekshirish
        sec.blocks.forEach((blockRaw: unknown, bIdx: number) => {
          const blockPrefix = `${secPrefix}, ${bIdx + 1}-blok`;

          if (typeof blockRaw !== 'object' || blockRaw === null || Array.isArray(blockRaw)) {
            issues.push({
              path: `sections[${sIdx}].blocks[${bIdx}]`,
              message: `${blockPrefix}: blok ma’lumoti obyekt bo‘lishi kerak.`,
              severity: 'error'
            });
            return;
          }

          const block = blockRaw as Record<string, unknown>;

          if (!block.type || typeof block.type !== 'string') {
            issues.push({
              path: `sections[${sIdx}].blocks[${bIdx}].type`,
              message: `${blockPrefix}: blok turi ("type") ko‘rsatilmagan.`,
              severity: 'error'
            });
            return;
          }

          const validTypes = [
            'text', 'list', 'definition', 'norm',
            'table', 'note', 'case', 'qa',
            'compare', 'flow', 'timeline'
          ];

          if (!validTypes.includes(block.type)) {
            issues.push({
              path: `sections[${sIdx}].blocks[${bIdx}].type`,
              message: `${blockPrefix}: noma’lum blok turi "${block.type}". Ruxsat etilgan turlar: ${validTypes.join(', ')}.`,
              severity: 'error'
            });
            return;
          }

          // Diskriminatsiyalangan blok tekshiruvlari
          switch (block.type) {
            case 'text':
              if (typeof block.text !== 'string' || !block.text.trim()) {
                issues.push({
                  path: `sections[${sIdx}].blocks[${bIdx}].text`,
                  message: `${blockPrefix} (matn): "text" maydoni to‘ldirilishi shart.`,
                  severity: 'error'
                });
              }
              break;

            case 'list':
              if (!Array.isArray(block.items)) {
                issues.push({
                  path: `sections[${sIdx}].blocks[${bIdx}].items`,
                  message: `${blockPrefix} (ro‘yxat): "items" bandlar massivi bo‘lishi kerak.`,
                  severity: 'error'
                });
              } else if (block.items.length === 0) {
                issues.push({
                  path: `sections[${sIdx}].blocks[${bIdx}].items`,
                  message: `${blockPrefix} (ro‘yxat): "items" ro‘yxatida kamida 1 ta band bo‘lishi kerak.`,
                  severity: 'error'
                });
              }
              break;

            case 'definition':
              if (!block.term || typeof block.term !== 'string') {
                issues.push({
                  path: `sections[${sIdx}].blocks[${bIdx}].term`,
                  message: `${blockPrefix} (ta’rif): atama nomi ("term") kiritilishi shart.`,
                  severity: 'error'
                });
              }
              if (!block.definition || typeof block.definition !== 'string') {
                issues.push({
                  path: `sections[${sIdx}].blocks[${bIdx}].definition`,
                  message: `${blockPrefix} (ta’rif): atama ta’rifi ("definition") kiritilishi shart.`,
                  severity: 'error'
                });
              }
              break;

            case 'norm':
              if (!block.number || typeof block.number !== 'string') {
                issues.push({
                  path: `sections[${sIdx}].blocks[${bIdx}].number`,
                  message: `${blockPrefix} (norma): modda yoki band raqami ("number") ko‘rsatilishi shart.`,
                  severity: 'error'
                });
              }
              if (!block.title || typeof block.title !== 'string') {
                issues.push({
                  path: `sections[${sIdx}].blocks[${bIdx}].title`,
                  message: `${blockPrefix} (norma): norma sarlavhasi ("title") kiritilishi shart.`,
                  severity: 'error'
                });
              }
              if (!block.text || typeof block.text !== 'string') {
                issues.push({
                  path: `sections[${sIdx}].blocks[${bIdx}].text`,
                  message: `${blockPrefix} (norma): norma matni ("text") kiritilishi shart.`,
                  severity: 'error'
                });
              }
              break;

            case 'table':
              if (block.caption && !block.title) {
                block.title = block.caption;
              }
              if (!Array.isArray(block.headers) || block.headers.length === 0) {
                issues.push({
                  path: `sections[${sIdx}].blocks[${bIdx}].headers`,
                  message: `${blockPrefix} (jadval): jadval sarlavhalari ("headers") kamida bitta ustundan iborat bo‘lishi kerak.`,
                  severity: 'error'
                });
              }
              if (!Array.isArray(block.rows)) {
                issues.push({
                  path: `sections[${sIdx}].blocks[${bIdx}].rows`,
                  message: `${blockPrefix} (jadval): qatorlar ("rows") massiv bo‘lishi kerak.`,
                  severity: 'error'
                });
              } else if (Array.isArray(block.headers)) {
                const headerCount = block.headers.length;
                block.rows.forEach((rowRaw: unknown, rIdx: number) => {
                  if (!Array.isArray(rowRaw)) {
                    issues.push({
                      path: `sections[${sIdx}].blocks[${bIdx}].rows[${rIdx}]`,
                      message: `${blockPrefix} (jadval): ${rIdx + 1}-qator kataklar massivi bo‘lishi kerak.`,
                      severity: 'error'
                    });
                  } else if (rowRaw.length !== headerCount) {
                    issues.push({
                      path: `sections[${sIdx}].blocks[${bIdx}].rows[${rIdx}]`,
                      message: `${blockPrefix} (jadval): ${rIdx + 1}-qatorda ${rowRaw.length} ta katak bor, sarlavhada esa ${headerCount} ta.`,
                      severity: 'error'
                    });
                  }
                });
              }
              break;

            case 'note':
              if (!block.text || typeof block.text !== 'string') {
                issues.push({
                  path: `sections[${sIdx}].blocks[${bIdx}].text`,
                  message: `${blockPrefix} (eslatma): eslatma matni ("text") kiritilishi shart.`,
                  severity: 'error'
                });
              }
              if (
                block.variant &&
                !['tip', 'warning', 'important', 'quote'].includes(block.variant as string)
              ) {
                issues.push({
                  path: `sections[${sIdx}].blocks[${bIdx}].variant`,
                  message: `${blockPrefix} (eslatma): noma’lum variant "${block.variant}". Qabul qilinadigan: tip, warning, important, quote.`,
                  severity: 'error'
                });
              }
              break;

            case 'case':
              {
                const caseTitle = (block.title || block.name) as string | undefined;
                if (caseTitle && typeof caseTitle === 'string' && caseTitle.trim()) {
                  block.title = caseTitle.trim();
                } else {
                  block.title = 'Kazus tahlili';
                }
              }
              {
                const hasFirac = Boolean(
                  (block.facts && typeof block.facts === 'string' && block.facts.trim()) ||
                  (block.issue && typeof block.issue === 'string' && block.issue.trim()) ||
                  (block.rule && typeof block.rule === 'string' && block.rule.trim()) ||
                  (block.analysis && typeof block.analysis === 'string' && block.analysis.trim()) ||
                  (block.conclusion && typeof block.conclusion === 'string' && block.conclusion.trim())
                );
                if (!hasFirac) {
                  issues.push({
                    path: `sections[${sIdx}].blocks[${bIdx}]`,
                    message: `${blockPrefix} (sud ishi): kamida bitta kazus maydoni (vaziyat, masala, qoida, tahlil yoki xulosa) kiritilishi shart.`,
                    severity: 'error'
                  });
                }
              }
              break;

            case 'qa':
              if (!block.question || typeof block.question !== 'string') {
                issues.push({
                  path: `sections[${sIdx}].blocks[${bIdx}].question`,
                  message: `${blockPrefix} (savol-javob): savol matni ("question") kiritilishi shart.`,
                  severity: 'error'
                });
              }
              if (!block.answer || typeof block.answer !== 'string') {
                issues.push({
                  path: `sections[${sIdx}].blocks[${bIdx}].answer`,
                  message: `${blockPrefix} (savol-javob): javob matni ("answer") kiritilishi shart.`,
                  severity: 'error'
                });
              }
              break;

            case 'compare':
              if (!Array.isArray(block.items) || block.items.length < 2) {
                issues.push({
                  path: `sections[${sIdx}].blocks[${bIdx}].items`,
                  message: `${blockPrefix} (solishtirish): kamida 2 ta tushuncha ("items") bo‘lishi kerak.`,
                  severity: 'error'
                });
              }
              break;

            case 'flow':
              if (!Array.isArray(block.steps) || block.steps.length === 0) {
                issues.push({
                  path: `sections[${sIdx}].blocks[${bIdx}].steps`,
                  message: `${blockPrefix} (ketma-ketlik): kamida 1 ta bosqich ("steps") bo‘lishi kerak.`,
                  severity: 'error'
                });
              }
              break;

            case 'timeline':
              if (!Array.isArray(block.events) || block.events.length === 0) {
                issues.push({
                  path: `sections[${sIdx}].blocks[${bIdx}].events`,
                  message: `${blockPrefix} (xronologiya): kamida 1 ta voqea ("events") bo‘lishi kerak.`,
                  severity: 'error'
                });
              }
              break;
          }
        });
      }
    });
  }

  if (issues.length > 0) {
    return {
      valid: false,
      document: null,
      issues,
      warnings: []
    };
  }

  // Barqaror ID larni shakllantirish va ogohlantirishlarni jamlash
  const { document: safeDoc, warnings } = ensureStableIds(doc as unknown as LegalDocument);

  return {
    valid: true,
    document: safeDoc,
    issues: [],
    warnings: [...initialWarnings, ...warnings]
  };
}
