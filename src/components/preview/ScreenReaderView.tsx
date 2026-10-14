import React, { useState, useEffect } from 'react';
import type { LegalDocument, ThemeName, Block, BlockStyleOverridesMap, Section } from '../../schema/types';
import { FormattedText } from '../../utils/inlineMarkdown';
import { BlockRenderer } from '../blocks/BlockRenderer';
import { CompactQaGroup } from '../blocks/QaBlock';
import { List, ChevronDown, ChevronUp } from 'lucide-react';
import './screenReader.css';

interface Props {
  document: LegalDocument;
  activeTheme?: ThemeName;
  blockOverrides?: BlockStyleOverridesMap;
  onOpenStylePopover?: (block: Block, anchorRect: DOMRect) => void;
}

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

export const ScreenReaderView: React.FC<Props> = ({
  document: doc,
  activeTheme = 'classic',
  blockOverrides,
  onOpenStylePopover
}) => {
  const [activeSectionId, setActiveSectionId] = useState<string>('reader-sec-1');
  const [isTocOpen, setIsTocOpen] = useState<boolean>(false);
  const [scrollProgress, setScrollProgress] = useState<number>(0);

  useEffect(() => {
    const handleScroll = () => {
      const host = window.document.querySelector('.reader-preview-host') as HTMLElement | null;
      const col = window.document.querySelector('.preview-column') as HTMLElement | null;
      const el = host || col || window.document.documentElement;
      const scrollTop = el.scrollTop || window.scrollY || 0;
      const scrollHeight = el.scrollHeight || 1;
      const clientHeight = el.clientHeight || window.innerHeight;
      const maxScroll = scrollHeight - clientHeight;
      if (maxScroll > 0) {
        setScrollProgress(Math.min(100, Math.max(0, Math.round((scrollTop / maxScroll) * 100))));
      } else {
        setScrollProgress(0);
      }
    };

    const host = window.document.querySelector('.reader-preview-host');
    const col = window.document.querySelector('.preview-column');
    const scrollContainer = host || col || window;
    scrollContainer.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => {
      scrollContainer.removeEventListener('scroll', handleScroll);
      window.removeEventListener('scroll', handleScroll);
    };
  }, [doc]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveSectionId(entry.target.id);
          }
        }
      },
      { rootMargin: '-80px 0px -60% 0px' }
    );

    const sections = window.document.querySelectorAll('.reader-section');
    sections.forEach((sec) => observer.observe(sec));

    return () => observer.disconnect();
  }, [doc]);

  const scrollToSection = (secId: string) => {
    const el = window.document.getElementById(secId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setIsTocOpen(false);
    }
  };

  return (
    <div className={`screen-reader-wrapper theme-${activeTheme}`} data-theme={activeTheme}>
      {/* O'qish progress-indikatori (Reading Progress Bar) */}
      <div className="reader-progress-track no-print" aria-hidden="true">
        <div className="reader-progress-fill" style={{ width: `${scrollProgress}%` }} />
      </div>

      {/* Yopishqoq (Sticky) Mundarija / TOC Navigation Bar */}
      {doc.sections && doc.sections.length > 1 && (
        <aside className="reader-sticky-toc no-print" aria-label="Mundarija navigatsiyasi">
          <div className="reader-toc-bar">
            <button
              type="button"
              className="reader-toc-toggle-btn"
              onClick={() => setIsTocOpen(!isTocOpen)}
              aria-expanded={isTocOpen}
            >
              <List size={18} />
              <span className="reader-toc-current-label">
                {doc.sections.find((_, i) => `reader-sec-${i + 1}` === activeSectionId)?.title || 'Mundarija'}
              </span>
              {isTocOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
          </div>

          {isTocOpen && (
            <div className="reader-toc-dropdown">
              <div className="reader-toc-dropdown-header">Bo‘limlar</div>
              <ul className="reader-toc-dropdown-list">
                {doc.sections.map((sec, idx) => {
                  const secId = `reader-sec-${idx + 1}`;
                  const isActive = activeSectionId === secId;

                  return (
                    <li key={idx}>
                      <button
                        type="button"
                        className={`reader-toc-dropdown-item ${isActive ? 'active' : ''}`}
                        onClick={() => scrollToSection(secId)}
                      >
                        <span className="reader-toc-item-num">{idx + 1}.</span>
                        <span className="reader-toc-item-text">
                          <FormattedText text={sec.title} />
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </aside>
      )}

      {/* Asosiy o'qish ustuni (Single-column, max-width ~720px) */}
      <article className="screen-reader-container">
        {/* Hujjat Sarvarag'i */}
        <header className="reader-doc-header">
          {doc.institution && <div className="reader-institution">{doc.institution}</div>}
          <h1
            className="reader-title"
            data-canvas-editable="true"
            data-edit-type="doc_title"
            data-source-line={doc.sourceLine || 1}
          >
            <FormattedText text={doc.title} />
          </h1>
          {doc.subtitle && (
            <p
              className="reader-subtitle"
              data-canvas-editable="true"
              data-edit-type="doc_subtitle"
              data-source-line={doc.subtitleSourceLine}
            >
              <FormattedText text={doc.subtitle} />
            </p>
          )}

          <div className="reader-meta-row">
            {doc.author && <span className="reader-author">Muallif: {doc.author}</span>}
            {doc.year && <span className="reader-year">{doc.year}</span>}
          </div>
          {doc.description && <p className="reader-desc">{doc.description}</p>}
        </header>

        {/* Bo'limlar oqimi */}
        <div className="reader-sections-flow">
          {doc.sections?.map((section: Section, sIdx: number) => {
            const secId = `reader-sec-${sIdx + 1}`;
            const groupedBlocks = groupSectionBlocks(section.blocks || []);

            return (
              <section key={sIdx} id={secId} className="reader-section">
                <header className="reader-section-header">
                  <span className="reader-sec-badge">{sIdx + 1}-Mavzu</span>
                  <h2
                    className="reader-section-title"
                    data-canvas-editable="true"
                    data-edit-type="sec_title"
                    data-source-line={section.sourceLine}
                    data-section-title={section.title}
                  >
                    <FormattedText text={(section.title || '').replace(/^(\d+[\.\)]\s*)+/, '').trim() || section.title} />
                  </h2>
                  {section.subtitle && (
                    <p
                      className="reader-section-subtitle"
                      data-canvas-editable="true"
                      data-edit-type="sec_subtitle"
                      data-source-line={section.subtitleSourceLine}
                      data-section-title={section.title}
                    >
                      <FormattedText text={section.subtitle} />
                    </p>
                  )}
                </header>

                <div className="reader-section-content">
                  {groupedBlocks.map((item, bIdx) => {
                    if (item.type === 'qa_group') {
                      return (
                        <CompactQaGroup
                          key={`reader-qa-grp-${bIdx}`}
                          blocks={item.blocks}
                          title="Takrorlash savollari"
                        />
                      );
                    }

                    const block = item.block;
                    const override = block.id ? blockOverrides?.[block.id] : undefined;

                    return (
                      <BlockRenderer
                        key={block.id || bIdx}
                        block={block}
                        forceShowAnswer={false}
                        override={override}
                        onOpenStylePopover={onOpenStylePopover}
                      />
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      </article>
    </div>
  );
};
