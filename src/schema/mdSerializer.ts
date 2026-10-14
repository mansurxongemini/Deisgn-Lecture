import type { LegalDocument, Block } from './types';

/**
 * LegalDocument AST obyektini toza, ixcham va o‘qishli MD+ matniga aylantiradi.
 * Qoidalar:
 * - Har doim asosiy so‘z formasida yozadi (norma:, ta'rif:, savol:, javob:, ogoh:, maslahat:, kazus:)
 * - Hujjat metama'lumotlarida uslub:, izoh:, muallif: standartidan foydalanadi
 * - Kazusda manba: dan foydalanadi (sud: bilan birlashtirilgan)
 * - {#id} ni faqat qa bloklari va aniq havolalangan bloklar uchun yozadi (jim va ixtiyoriy)
 */
export function serializeToMarkdownPlus(doc: LegalDocument): string {
  const parts: string[] = [];

  // Hujjat ichidagi Obsidian havolalarini ([[id]] yoki [[nom]]) yig'ib olish
  const referencedIds = new Set<string>();
  const linkRegex = /\[\[([^\]]+)\]\]/g;

  function collectLinks(text?: string) {
    if (!text) return;
    let match;
    while ((match = linkRegex.exec(text)) !== null) {
      referencedIds.add(match[1].trim());
    }
  }

  for (const section of doc.sections) {
    for (const block of section.blocks) {
      if (block.type === 'text') collectLinks(block.text);
      if (block.type === 'norm') collectLinks(block.text);
      if (block.type === 'note') collectLinks(block.text);
      if (block.type === 'case') {
        collectLinks(block.facts);
        collectLinks(block.rule);
        collectLinks(block.conclusion);
      }
      if (block.type === 'qa') {
        collectLinks(block.question);
        collectLinks(block.answer);
      }
    }
  }

  // 1. Hujjat sarlavhasi va metama’lumotlari
  const docHeaderLines: string[] = [`# ${doc.title}`];
  if (doc.author) docHeaderLines.push(`muallif: ${doc.author}`);
  if (doc.theme) docHeaderLines.push(`uslub: ${doc.theme}`);
  if (doc.subtitle) docHeaderLines.push(`izoh: ${doc.subtitle}`);
  if (doc.cover?.institution) docHeaderLines.push(`muassasa: ${doc.cover.institution}`);
  if (doc.cover?.year) docHeaderLines.push(`yil: ${doc.cover.year}`);

  parts.push(docHeaderLines.join('\n'));

  // 2. Bo‘limlar va bloklar
  for (const section of doc.sections) {
    const secLines: string[] = [`## ${section.title}`];
    if (section.subtitle) {
      secLines.push(section.subtitle);
    }
    parts.push(secLines.join('\n'));

    for (const block of section.blocks) {
      const isReferenced = block.id && (referencedIds.has(block.id) || (block.type === 'norm' && referencedIds.has(block.number)));
      const shouldIncludeId = block.type === 'qa' || isReferenced;
      const blockText = serializeBlock(block, Boolean(shouldIncludeId));
      if (blockText) {
        parts.push(blockText);
      }
    }
  }

  return parts.join('\n\n') + '\n';
}

function serializeBlock(block: Block, includeId: boolean): string {
  const idSuffix = includeId && block.id ? ` {#${block.id}}` : '';

  switch (block.type) {
    case 'text':
      return `${block.text}${idSuffix}`;

    case 'list': {
      const isOrdered = Boolean(block.ordered);
      const lines = block.items.map((item, idx) => {
        const prefix = isOrdered ? `${idx + 1}.` : '-';
        return `${prefix} ${item}`;
      });
      if (idSuffix && lines.length > 0) {
        lines[lines.length - 1] += idSuffix;
      }
      return lines.join('\n');
    }

    case 'norm': {
      if (block.syntaxStyle === 'fenced') {
        const lines: string[] = [':::norma'];
        lines.push(`modda: ${block.number}. ${block.title}${idSuffix}`);
        if (block.source) lines.push(`manba: ${block.source}`);
        if (block.effectiveDate) lines.push(`sana: ${block.effectiveDate}`);
        lines.push(block.text);
        lines.push(':::');
        return lines.join('\n');
      }
      const lines: string[] = [`norma: ${block.number}: ${block.title}${idSuffix}`];
      if (block.source) lines.push(`manba: ${block.source}`);
      if (block.effectiveDate) lines.push(`sana: ${block.effectiveDate}`);
      lines.push(block.text);
      return lines.join('\n');
    }

    case 'note': {
      if (block.syntaxStyle === 'fenced') {
        const typeMap: Record<string, string> = {
          warning: 'ogoh',
          tip: 'maslahat',
          important: 'muhim',
          quote: 'iqtibos'
        };
        const fType = typeMap[block.variant || 'tip'] || 'maslahat';
        const lines: string[] = [`:::${fType}${idSuffix}`];
        if (block.title) lines.push(`sarlavha: ${block.title}`);
        lines.push(block.text);
        lines.push(':::');
        return lines.join('\n');
      }
      const prefix = block.variant === 'tip' ? 'maslahat:' : 'ogoh:';
      const titlePrefix = block.title ? `${block.title}: ` : '';
      return `${prefix} ${titlePrefix}${block.text}${idSuffix}`;
    }

    case 'case': {
      if (block.syntaxStyle === 'fenced') {
        const lines: string[] = [`:::kazus${idSuffix}`];
        if (block.title && block.title !== 'Sud kazusi' && block.title !== 'Kazus tahlili') {
          lines.push(`nom: ${block.title}`);
        }
        if (block.facts) lines.push(`vaziyat: ${block.facts}`);
        if (block.issue) lines.push(`savol: ${block.issue}`);
        if (block.rule) lines.push(`qoida: ${block.rule}`);
        if (block.analysis) lines.push(`tahlil: ${block.analysis}`);
        if (block.conclusion) lines.push(`xulosa: ${block.conclusion}`);
        const courtOrSource = block.court || (block as any).source;
        if (courtOrSource) lines.push(`manba: ${courtOrSource}`);
        lines.push(':::');
        return lines.join('\n');
      }
      const lines: string[] = [`kazus: ${block.title || block.name || 'Kazus'}${idSuffix}`];
      if (block.facts) lines.push(`fakt: ${block.facts}`);
      if (block.issue) lines.push(`savol: ${block.issue}`);
      if (block.rule) lines.push(`qoida: ${block.rule}`);
      if (block.analysis) lines.push(`tahlil: ${block.analysis}`);
      if (block.conclusion) lines.push(`xulosa: ${block.conclusion}`);
      const courtOrSource = block.court || (block as any).source;
      if (courtOrSource) lines.push(`manba: ${courtOrSource}`);
      return lines.join('\n');
    }

    case 'qa': {
      if (block.syntaxStyle === 'fenced') {
        const lines: string[] = [`:::savol${idSuffix}`];
        lines.push(`savol: ${block.question}`);
        lines.push(`javob: ${block.answer}`);
        if (block.hint) lines.push(`izoh: ${block.hint}`);
        if (block.category) lines.push(`kategoriya: ${block.category}`);
        lines.push(':::');
        return lines.join('\n');
      }
      const lines: string[] = [`savol: ${block.question}${idSuffix}`, `javob: ${block.answer}`];
      if (block.hint) lines.push(`maslahat: ${block.hint}`);
      if (block.category) lines.push(`toifa: ${block.category}`);
      return lines.join('\n');
    }

    case 'definition': {
      if (block.syntaxStyle === 'fenced') {
        const lines: string[] = [`:::ta'rif${idSuffix}`];
        lines.push(`atama: ${block.term}`);
        lines.push(`ta'rif: ${block.definition}`);
        if (block.source) lines.push(`manba: ${block.source}`);
        lines.push(':::');
        return lines.join('\n');
      }
      const lines: string[] = [`ta'rif: ${block.term}: ${block.definition}${idSuffix}`];
      if (block.source) lines.push(`manba: ${block.source}`);
      return lines.join('\n');
    }

    case 'table': {
      const lines: string[] = [];
      const headers = block.headers || [];
      const rows = block.rows || [];

      if (idSuffix) {
        lines.push(`{#${block.id}}`);
      }

      if (headers.length > 0) {
        lines.push(`| ${headers.join(' | ')} |`);
        lines.push(`| ${headers.map(() => '---').join(' | ')} |`);
      }
      for (const row of rows) {
        lines.push(`| ${row.join(' | ')} |`);
      }
      return lines.join('\n');
    }

    case 'compare': {
      const titles = block.items.map((i) => i.title);
      const lines: string[] = [`taqqos: ${titles.join(' | ')}${idSuffix}`];
      for (const item of block.items) {
        for (const point of item.points) {
          lines.push(`- ${item.title}: ${point}`);
        }
      }
      return lines.join('\n');
    }

    case 'flow': {
      const stepNames = block.steps.map((s) => s.title);
      return `jarayon: Bosqichlar${idSuffix}\n${stepNames.join(' -> ')}`;
    }

    case 'timeline': {
      const lines: string[] = [`vaqt: Xronologiya${idSuffix}`];
      for (const ev of block.events) {
        lines.push(`${ev.date} | ${ev.description || ev.title}`);
      }
      return lines.join('\n');
    }

    default:
      return '';
  }
}
