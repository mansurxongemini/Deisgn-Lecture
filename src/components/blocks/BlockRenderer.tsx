import React from 'react';
import type { Block, BlockStyleOverride } from '../../schema/types';
import { TextBlock } from './TextBlock';
import { ListBlock } from './ListBlock';
import { DefinitionBlock } from './DefinitionBlock';
import { NormBlock } from './NormBlock';
import { TableBlock } from './TableBlock';
import { NoteBlock } from './NoteBlock';
import { CaseBlock } from './CaseBlock';
import { QaBlock } from './QaBlock';
import { CompareBlock } from './CompareBlock';
import { FlowBlock } from './FlowBlock';
import { TimelineBlock } from './TimelineBlock';
import { Sliders } from 'lucide-react';
import '../preview/blockStylePopover.css';

interface Props {
  block: Block;
  forceShowAnswer?: boolean;
  override?: BlockStyleOverride;
  onOpenStylePopover?: (block: Block, anchorRect: DOMRect) => void;
  isPrintHost?: boolean;
}

export const BlockRenderer: React.FC<Props> = ({
  block,
  forceShowAnswer,
  override,
  onOpenStylePopover,
  isPrintHost
}) => {
  const renderInnerBlock = () => {
    switch (block.type) {
      case 'text':
        return <TextBlock block={block} />;
      case 'list':
        return <ListBlock block={block} />;
      case 'definition':
        return <DefinitionBlock block={block} />;
      case 'norm':
        return <NormBlock block={block} />;
      case 'table':
        return <TableBlock block={block} />;
      case 'note':
        return <NoteBlock block={block} />;
      case 'case':
        return <CaseBlock block={block} override={override} />;
      case 'qa':
        return <QaBlock block={block} forceShowAnswer={forceShowAnswer} />;
      case 'compare':
        return <CompareBlock block={block} />;
      case 'flow':
        return <FlowBlock block={block} />;
      case 'timeline':
        return <TimelineBlock block={block} />;
      default:
        return (
          <div
            style={{
              padding: 12,
              border: '1px dashed #ef4444',
              borderRadius: 6,
              fontSize: '0.85rem',
              color: '#b91c1c'
            }}
          >
            Noma’lum blok turi: {(block as { type?: string }).type}
          </div>
        );
    }
  };

  const sizeClass =
    override?.size === 'S'
      ? 'block-size-s'
      : override?.size === 'L'
      ? 'block-size-l'
      : '';

  const hiddenClass = override?.hideInPdf ? 'block-hide-in-pdf' : '';

  const wrapperStyle: React.CSSProperties = {
    ...(override?.accentColor
      ? ({
          '--block-accent': override.accentColor,
          '--doc-accent': override.accentColor,
          '--accent': override.accentColor,
          '--accent-navy': override.accentColor,
          '--accent-gold': override.accentColor,
        } as React.CSSProperties)
      : {}),
    ...(override?.alignment
      ? {
          textAlign: override.alignment
        }
      : {})
  };

  const handleBlockClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!onOpenStylePopover || isPrintHost) return;
    const target = e.target as HTMLElement;
    // Agar foydalanuvchi to'g'ridan-to'g'ri matnni tahrir qilayotgan bo'lsa, uslub popoverini ochmaslik
    if (target.closest('[data-canvas-editable="true"]')) {
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    onOpenStylePopover(block, rect);
  };

  return (
    <div
      className={`block-style-wrapper ${sizeClass} ${hiddenClass}`.trim()}
      style={wrapperStyle}
      data-block-id={block.id}
      data-source-line={block.sourceLine}
      id={block.id}
      onClick={handleBlockClick}
    >
      {/* Blok ustiga borganda suzuvchi "Uslub" tugmasi */}
      {onOpenStylePopover && !isPrintHost && (
        <button
          type="button"
          className="block-style-trigger-btn"
          onClick={(e) => {
            e.stopPropagation();
            const rect = e.currentTarget.getBoundingClientRect();
            onOpenStylePopover(block, rect);
          }}
          title="Blok uslubini sozlash (Aksent, o‘lcham, tekislash, PDF)"
          aria-label="Blok uslubini sozlash"
        >
          <Sliders size={13} />
          <span>Uslub</span>
        </button>
      )}

      {renderInnerBlock()}
    </div>
  );
};
