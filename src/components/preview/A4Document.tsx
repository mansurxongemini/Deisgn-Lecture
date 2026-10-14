import React, { useMemo, useState, useLayoutEffect, useRef } from 'react';
import type { LegalDocument, ThemeName, Block, BlockStyleOverridesMap, Section } from '../../schema/types';
import { FormattedText } from '../../utils/inlineMarkdown';
import { BlockRenderer } from '../blocks/BlockRenderer';
import { CompactQaGroup } from '../blocks/QaBlock';
import { CanvasEditable } from './CanvasEditable';
import { BookOpen } from 'lucide-react';
import './a4Document.css';

export interface A4DocumentProps {
  document: LegalDocument;
  activeTheme?: ThemeName;
  blockOverrides?: BlockStyleOverridesMap;
  onOpenStylePopover?: (block: Block, anchorRect: DOMRect) => void;
  isPrintHost?: boolean;
  onPageCountChange?: (count: number) => void;
}

/**
 * Guruhlangan bloklar: ketma-ket kelgan savol-javob bloklarini
 * ixcham "Takrorlash savollari" ro'yxatiga birlashtiradi.
 */
function groupSectionBlocks(blocks: Block[]): Array<{ type: 'single'; block: Block } | { type: 'qa_group'; blocks: any[] }> {
  const result: Array<{ type: 'single'; block: Block } | { type: 'qa_group'; blocks: any[] }> = [];
  let currentQa: any[] = [];

  for (const block of blocks) {
    if (block.type === 'qa') {
      currentQa.push(block);
    } else {
      if (currentQa.length > 0) {
        if (currentQa.length >= 2) {
          result.push({ type: 'qa_group', blocks: [...currentQa] });
        } else {
          result.push({ type: 'single', block: currentQa[0] });
        }
        currentQa = [];
      }
      result.push({ type: 'single', block });
    }
  }

  if (currentQa.length > 0) {
    if (currentQa.length >= 2) {
      result.push({ type: 'qa_group', blocks: currentQa });
    } else {
      result.push({ type: 'single', block: currentQa[0] });
    }
  }

  return result;
}

export type A4PageItem =
  | { id: string; type: 'cover' }
  | { id: string; type: 'toc' }
  | { id: string; type: 'sec-header'; sIdx: number; section: Section }
  | { id: string; type: 'qa-group'; sIdx: number; bIdx: number; blocks: any[] }
  | { id: string; type: 'block'; sIdx: number; bIdx: number; block: Block };

function estimateItemHeight(item: A4PageItem, doc: LegalDocument): number {
  switch (item.type) {
    case 'cover': {
      let h = 75;
      if (doc.title) h += 40;
      if (doc.subtitle) h += 25;
      if (doc.author || doc.institution) h += 25;
      return h;
    }
    case 'toc': {
      return 50 + (doc.sections?.length || 0) * 26;
    }
    case 'sec-header': {
      return item.section.subtitle ? 65 : 45;
    }
    case 'qa-group': {
      return 45 + item.blocks.length * 65;
    }
    case 'block': {
      const b = item.block;
      switch (b.type) {
        case 'text':
          return 28 + Math.ceil((b.text?.length || 50) / 90) * 19;
        case 'list':
          return 20 + (b.items?.length || 1) * 22;
        case 'definition':
          return 50 + Math.ceil(((b.definition?.length || 50) + (b.term?.length || 10)) / 90) * 19;
        case 'norm':
          return 130 + Math.ceil((b.text?.length || 60) / 90) * 19;
        case 'qa':
          return 65 + Math.ceil(((b.question?.length || 20) + (b.answer?.length || 40)) / 90) * 19;
        case 'table':
          return 40 + (b.rows?.length || 1) * 32;
        case 'compare':
          return 80 + Math.max(b.items?.[0]?.points?.length || 1, b.items?.[1]?.points?.length || 1) * 24;
        case 'flow':
          return 75 + Math.ceil((b.steps?.length || 1) / 3) * 35;
        case 'case':
          return 160 + Math.ceil(((b.facts?.length || 50) + (b.conclusion?.length || 50)) / 90) * 19;
        default:
          return 60;
      }
    }
  }
}

export function getItemFingerprint(item: A4PageItem, theme: string): string {
  switch (item.type) {
    case 'cover':
      return `cover:${theme}`;
    case 'toc':
      return `toc:${theme}`;
    case 'sec-header':
      return `sec:${item.sIdx}:${item.section.title}:${item.section.subtitle || ''}:${theme}`;
    case 'qa-group':
      return `qa-grp:${item.id}:${item.blocks.length}:${theme}`;
    case 'block': {
      const b = item.block;
      return `block:${item.id}:${b.type}:${(b as any).text || ''}:${(b as any).items?.join('|') || ''}:${(b as any).rows?.length || 0}:${theme}`;
    }
  }
}

function partitionItems(
  items: A4PageItem[],
  heights: Record<string, number>,
  cache: Map<string, number>,
  theme: string,
  doc: LegalDocument
): A4PageItem[][] {
  if (items.length === 0) return [[]];

  // 297mm (1122.5px) - 32mm margins (121px) - footer (32px) = ~970px
  const PAGE_CAPACITY = 980;
  const GAP = 8;
  const pages: A4PageItem[][] = [];
  let curPage: A4PageItem[] = [];
  let curH = 0;

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const fp = getItemFingerprint(item, theme);
    const cachedH = cache.get(fp);
    const measuredH = heights[item.id];
    const h = (cachedH !== undefined && cachedH > 0)
      ? cachedH
      : (measuredH !== undefined && measuredH > 0)
        ? measuredH
        : estimateItemHeight(item, doc);

    // Break-after avoid: sarlavha yolg'iz sahifa tubida qolib ketmasin, keyingi blok bilan o'tadi
    if (item.type === 'sec-header') {
      const nextItem = items[i + 1];
      const nextFp = nextItem ? getItemFingerprint(nextItem, theme) : '';
      const nextCachedH = nextItem ? cache.get(nextFp) : undefined;
      const nextMeasuredH = nextItem ? heights[nextItem.id] : undefined;
      const nextH = nextItem
        ? (nextCachedH !== undefined && nextCachedH > 0)
          ? nextCachedH
          : (nextMeasuredH !== undefined && nextMeasuredH > 0)
            ? nextMeasuredH
            : estimateItemHeight(nextItem, doc)
        : 0;

      if (curH + h + nextH + (curPage.length > 0 ? GAP * 2 : 0) > PAGE_CAPACITY && curPage.length > 0) {
        pages.push(curPage);
        curPage = [];
        curH = 0;
      }
    } else {
      if (curH + h + (curPage.length > 0 ? GAP : 0) > PAGE_CAPACITY && curPage.length > 0) {
        pages.push(curPage);
        curPage = [];
        curH = 0;
      }
    }

    curPage.push(item);
    curH += h + (curPage.length > 1 ? GAP : 0);
  }

  if (curPage.length > 0 || pages.length === 0) {
    pages.push(curPage);
  }

  return pages;
}

interface A4SheetProps {
  pageIdx: number;
  totalPages: number;
  pageItems: A4PageItem[];
  theme: string;
  renderItemContent: (item: A4PageItem) => React.ReactNode;
}

const A4Sheet: React.FC<A4SheetProps> = React.memo(
  ({ pageIdx, totalPages, pageItems, renderItemContent }) => {
    return (
      <article
        className="a4-sheet"
        data-page-number={pageIdx + 1}
        id={`a4-page-${pageIdx + 1}`}
        aria-label={`${pageIdx + 1}-sahifa`}
      >
        <div className="a4-sheet-content a4-section-body">
          {pageItems.map((item) => (
            <div key={item.id} className="a4-sheet-item">
              {renderItemContent(item)}
            </div>
          ))}
        </div>

        <footer className="a4-sheet-footer">
          <span className="a4-sheet-page-num">
            {pageIdx + 1} / {totalPages}
          </span>
        </footer>
      </article>
    );
  },
  (prev, next) => {
    if (prev.pageIdx !== next.pageIdx || prev.totalPages !== next.totalPages || prev.theme !== next.theme) {
      return false;
    }
    if (prev.pageItems.length !== next.pageItems.length) return false;
    for (let i = 0; i < prev.pageItems.length; i++) {
      const p = prev.pageItems[i];
      const n = next.pageItems[i];
      if (p.id !== n.id) return false;
      if (getItemFingerprint(p, prev.theme) !== getItemFingerprint(n, next.theme)) return false;
    }
    return true;
  }
);

export const A4Document: React.FC<A4DocumentProps> = ({
  document: doc,
  activeTheme = 'classic',
  blockOverrides,
  onOpenStylePopover,
  isPrintHost,
  onPageCountChange
}) => {
  const shouldRenderToc =
    doc.toc === true || (doc.toc === undefined && Boolean(doc.sections && doc.sections.length > 1));

  const items = useMemo<A4PageItem[]>(() => {
    const list: A4PageItem[] = [];
    if (doc.cover?.enabled !== false) {
      list.push({ id: 'doc-cover', type: 'cover' });
    }
    if (shouldRenderToc && doc.sections && doc.sections.length > 0) {
      list.push({ id: 'doc-toc', type: 'toc' });
    }
    doc.sections?.forEach((section, sIdx) => {
      list.push({
        id: `sec-header-${sIdx}`,
        type: 'sec-header',
        sIdx,
        section
      });

      const grouped = groupSectionBlocks(section.blocks || []);
      grouped.forEach((g, bIdx) => {
        if (g.type === 'qa_group') {
          list.push({
            id: `qa-group-${sIdx}-${bIdx}`,
            type: 'qa-group',
            sIdx,
            bIdx,
            blocks: g.blocks
          });
        } else {
          list.push({
            id: `block-${sIdx}-${bIdx}`,
            type: 'block',
            sIdx,
            bIdx,
            block: g.block
          });
        }
      });
    });
    return list;
  }, [doc, shouldRenderToc]);

  const heightCacheRef = useRef<Map<string, number>>(new Map());
  const measureRef = useRef<HTMLDivElement>(null);
  const [measuredHeights, setMeasuredHeights] = useState<Record<string, number>>({});

  // Faqat balandligi hali o'lchanmagan elementlar o'lchanadi (120 ta emas, odatda 0 yoki 1 ta!)
  const itemsToMeasure = useMemo(() => {
    return items.filter((item) => !heightCacheRef.current.has(getItemFingerprint(item, activeTheme)));
  }, [items, activeTheme]);

  useLayoutEffect(() => {
    if (!measureRef.current) return;
    const elements = measureRef.current.querySelectorAll<HTMLElement>('[data-measure-id]');
    if (elements.length === 0) return;

    let anyNew = false;
    const newHeights = { ...measuredHeights };

    elements.forEach((el) => {
      const id = el.getAttribute('data-measure-id');
      const fp = el.getAttribute('data-measure-fp');
      if (id && fp) {
        const h = el.offsetHeight;
        if (h > 0) {
          heightCacheRef.current.set(fp, h);
          newHeights[id] = h;
          anyNew = true;
        }
      }
    });

    if (anyNew) {
      setMeasuredHeights(newHeights);
    }
  }, [itemsToMeasure, activeTheme, blockOverrides]);

  const pages = useMemo(() => {
    return partitionItems(items, measuredHeights, heightCacheRef.current, activeTheme, doc);
  }, [items, measuredHeights, activeTheme, doc]);

  useLayoutEffect(() => {
    if (onPageCountChange) {
      onPageCountChange(pages.length);
    }
  }, [pages.length, onPageCountChange]);

  const renderItemContent = (item: A4PageItem, isMeasure = false) => {
    const isEditable = !isPrintHost && !isMeasure;
    switch (item.type) {
      case 'cover':
        return (
          <header className="a4-doc-cover">
            <div className="a4-cover-top-meta">
              {doc.institution && <span className="a4-doc-institution">{doc.institution}</span>}
              {doc.year && <span className="a4-doc-year">{doc.year}</span>}
            </div>

            <CanvasEditable
              as="h1"
              className="a4-doc-title"
              data-canvas-editable={isEditable ? 'true' : undefined}
              data-edit-type="doc_title"
              data-source-line={doc.sourceLine || 1}
              text={doc.title}
            />

            {doc.subtitle && (
              <CanvasEditable
                as="p"
                className="a4-doc-subtitle"
                data-canvas-editable={isEditable ? 'true' : undefined}
                data-edit-type="doc_subtitle"
                data-source-line={doc.subtitleSourceLine}
                text={doc.subtitle}
              />
            )}

            <div className="a4-cover-bottom-meta">
              {doc.author && (
                <span className="a4-doc-author">
                  <strong>Muallif:</strong> {doc.author}
                </span>
              )}
              {doc.description && (
                <span className="a4-doc-desc">
                  <em>{doc.description}</em>
                </span>
              )}
            </div>
          </header>
        );

      case 'toc':
        return (
          <nav className="a4-toc-block" aria-label="Mundarija">
            <div className="a4-toc-header">
              <BookOpen size={16} className="a4-toc-icon" />
              <h2 className="a4-toc-title">Mundarija</h2>
            </div>
            <ol className="a4-toc-list">
              {doc.sections?.map((sec, idx) => {
                const cleanTocTitle = (sec.title || '').replace(/^(\d+[\.\)]\s*)+/, '').trim();
                return (
                  <li key={idx} className="a4-toc-item">
                    <a href={`#a4-sec-${idx + 1}`} className="a4-toc-link">
                      <span className="a4-toc-item-title">
                        <span className="a4-toc-num">{idx + 1}. </span>
                        <FormattedText text={cleanTocTitle} />
                      </span>
                      <span className="a4-toc-dots" aria-hidden="true" />
                      <span className="a4-toc-page-marker">§ {idx + 1}</span>
                    </a>
                  </li>
                );
              })}
            </ol>
          </nav>
        );

      case 'sec-header': {
        const cleanSecTitle = (item.section.title || '').replace(/^(\d+[\.\)]\s*)+/, '').trim();
        return (
          <header className="a4-section-header" id={`a4-sec-${item.sIdx + 1}`}>
            <h2 className="a4-section-title">
              <span className="a4-sec-num" contentEditable={false} style={{ userSelect: 'none' }}>
                {item.sIdx + 1}.{' '}
              </span>
              <CanvasEditable
                as="span"
                className="a4-section-title-text"
                data-canvas-editable={isEditable ? 'true' : undefined}
                data-edit-type="sec_title"
                data-source-line={item.section.sourceLine}
                data-section-title={item.section.title}
                text={cleanSecTitle}
              />
            </h2>
            {item.section.subtitle && (
              <CanvasEditable
                as="p"
                className="a4-section-subtitle"
                data-canvas-editable={isEditable ? 'true' : undefined}
                data-edit-type="sec_subtitle"
                data-source-line={item.section.subtitleSourceLine}
                data-section-title={item.section.title}
                text={item.section.subtitle}
              />
            )}
          </header>
        );
      }

      case 'qa-group':
        return (
          <CompactQaGroup
            key={item.id}
            blocks={item.blocks}
            title="Takrorlash savollari"
          />
        );

      case 'block': {
        const block = item.block;
        const override = block.id ? blockOverrides?.[block.id] : undefined;
        return (
          <BlockRenderer
            key={block.id || item.bIdx}
            block={block}
            forceShowAnswer={true}
            override={override}
            onOpenStylePopover={onOpenStylePopover}
            isPrintHost={isPrintHost}
          />
        );
      }
    }
  };

  return (
    <div className={`a4-document-root theme-${activeTheme}`} data-theme={activeTheme}>
      {/* Real A4 Discrete Sheets (faqat o'zgargan sahifalar qayta chiziladi) */}
      {pages.map((pageItems, pageIdx) => (
        <A4Sheet
          key={pageIdx}
          pageIdx={pageIdx}
          totalPages={pages.length}
          pageItems={pageItems}
          theme={activeTheme}
          renderItemContent={renderItemContent}
        />
      ))}

      {/* Hidden layout measurement container (faqat keshda bo'lmagan yangi elementlar o'lchanadi) */}
      <div ref={measureRef} className="a4-measure-host a4-section-body" aria-hidden="true">
        {itemsToMeasure.map((item) => (
          <div
            key={item.id}
            data-measure-id={item.id}
            data-measure-fp={getItemFingerprint(item, activeTheme)}
            className="a4-measure-item"
          >
            {renderItemContent(item, true)}
          </div>
        ))}
      </div>
    </div>
  );
};
