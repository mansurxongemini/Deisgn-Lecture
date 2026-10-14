import type { Block, Section, LegalDocument, ValidationIssue } from './types';

// Oddiy va tez ishlaydigan deterministik xesh funksiyasi (DJB2)
export function hashString(str: string): string {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 33) ^ str.charCodeAt(i);
  }
  return (hash >>> 0).toString(36);
}

// Matndan toza slug yaratish (oʻzbek lotin harflarini toza saqlaydi)
export function slugify(text: string, maxLen = 30): string {
  const clean = text
    .toLowerCase()
    .replace(/[ʻ’']/g, '')
    .replace(/[^a-z0-9а-яёўқғҳ\s-]/gi, '')
    .trim()
    .replace(/\s+/g, '-');
  return clean.slice(0, maxLen);
}

export function deriveBlockId(block: Block, index: number, sectionId: string): string {
  if (block.id && block.id.trim()) {
    return block.id.trim();
  }

  let seed = '';
  switch (block.type) {
    case 'text':
      seed = block.text;
      break;
    case 'definition':
      seed = block.term;
      break;
    case 'norm':
      seed = `${block.number}-${block.title}`;
      break;
    case 'case':
      seed = block.title || block.name || '';
      break;
    case 'qa':
      seed = block.question;
      break;
    case 'note':
      seed = block.title || block.text;
      break;
    case 'table':
      seed = block.title || block.caption || block.headers.join('-');
      break;
    case 'list':
      seed = block.items[0] || 'list';
      break;
    case 'compare':
      seed = block.items.map((i) => i.title).join('-');
      break;
    case 'flow':
      seed = block.steps.map((s) => s.title).join('-');
      break;
    case 'timeline':
      seed = block.events.map((e) => e.title).join('-');
      break;
    default:
      seed = `block-${index}`;
  }

  const slug = slugify(seed, 20) || `blk-${index}`;
  const hash = seed ? hashString(`${sectionId}-${block.type}-${seed}`) : hashString(`${sectionId}-${index}`);
  return `${slug}-${hash}`;
}

export function deriveSectionId(section: Section, index: number): string {
  if (section.id && section.id.trim()) {
    return section.id.trim();
  }
  const slug = slugify(section.title, 25) || `bolim-${index + 1}`;
  const hash = hashString(`${index}-${section.title}`);
  return `${slug}-${hash}`;
}

/**
 * Hujjatdagi barcha ixtiyoriy ID larni barqaror identifikatorlar bilan to‘ldiradi
 * va foydalanuvchiga muloyim ogohlantirish (warning) qaytaradi.
 */
export function ensureStableIds(doc: LegalDocument): {
  document: LegalDocument;
  warnings: ValidationIssue[];
} {
  const warnings: ValidationIssue[] = [];
  const clonedDoc: LegalDocument = JSON.parse(JSON.stringify(doc));

  if (!clonedDoc.id) {
    clonedDoc.id = `doc-${slugify(clonedDoc.title, 20)}-${hashString(clonedDoc.title)}`;
  }

  clonedDoc.sections.forEach((section, sIdx) => {
    const originalSecId = section.id;
    const finalSecId = deriveSectionId(section, sIdx);
    section.id = finalSecId;

    if (!originalSecId) {
      warnings.push({
        path: `sections[${sIdx}]`,
        message: `"${section.title}" bo‘limi uchun 'id' ko‘rsatilmagan. Barqaror identifikator (${finalSecId}) biriktirildi. Kelajakda sarlavha o‘zgarsa o‘rganish tarixini to‘liq saqlash uchun alohida 'id' yozish tavsiya etiladi.`,
        severity: 'warning'
      });
    }

    section.blocks.forEach((block, bIdx) => {
      const originalBlockId = block.id;
      const finalBlockId = deriveBlockId(block, bIdx, finalSecId);
      block.id = finalBlockId;

      if (!originalBlockId && (block.type === 'qa' || block.type === 'norm')) {
        const itemType = block.type === 'qa' ? 'Savol-javob (fleshkard)' : 'Huquqiy norma';
        warnings.push({
          path: `sections[${sIdx}].blocks[${bIdx}]`,
          message: `${itemType} bloki uchun 'id' ko‘rsatilmagan (${finalBlockId}). Kartochka matni tahrirlanganda takrorlash tarixi saqlanishi uchun 'id' yozish tavsiya qilinadi.`,
          severity: 'warning'
        });
      }
    });
  });

  return { document: clonedDoc, warnings };
}
