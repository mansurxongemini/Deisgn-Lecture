import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import type { Block, BlockStyleOverride } from '../../schema/types';
import { Check, X, RotateCcw, AlignLeft, AlignCenter, AlignRight, EyeOff, Eye } from 'lucide-react';
import './blockStylePopover.css';

export interface PopoverColorOption {
  value: string;
  name: string;
  border?: string;
}

export const BLOCK_ACCENT_COLORS: PopoverColorOption[] = [
  { value: '#1e3a8a', name: 'To‘q ko‘k (Oxford Navy)' },
  { value: '#059669', name: 'Zumrad yashil (Emerald)' },
  { value: '#d97706', name: 'Qahrabo (Amber bronze)' },
  { value: '#dc2626', name: 'Yoqut qizil (Crimson)' },
  { value: '#7c3aed', name: 'Binafsha (Royal Purple)' },
  { value: '#475569', name: 'Silliq tosh (Slate)' },
  { value: '#0d9488', name: 'Dengiz to‘lqini (Teal)' },
  { value: '#1e293b', name: 'Qorong‘i grafit (Graphite)' },
];

interface Props {
  block: Block;
  currentOverride?: BlockStyleOverride;
  anchorRect: DOMRect;
  onUpdate: (override: BlockStyleOverride) => void;
  onReset: () => void;
  onClose: () => void;
}

export const BlockStylePopover: React.FC<Props> = ({
  block,
  currentOverride = {},
  anchorRect,
  onUpdate,
  onReset,
  onClose
}) => {
  const popoverRef = useRef<HTMLDivElement>(null);

  // Esc klavishasi bilan yopish
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Popover ekran chegarasidan chiqib ketmasligini hisoblash
  const popoverWidth = 320;
  const popoverHeight = 330;

  let top = anchorRect.top + 8;
  if (top + popoverHeight > window.innerHeight - 20) {
    top = Math.max(20, window.innerHeight - popoverHeight - 20);
  }
  top = Math.max(20, top);

  let left = anchorRect.right - popoverWidth;
  if (left < 20) {
    left = Math.min(window.innerWidth - popoverWidth - 20, Math.max(20, anchorRect.left));
  }
  left = Math.max(20, left);

  const currentOverrideRef = useRef(currentOverride);
  currentOverrideRef.current = currentOverride;

  const activeColor = currentOverride.accentColor;
  const activeSize = currentOverride.size || 'M';
  const activeAlign = currentOverride.alignment || 'left';
  const isHiddenInPdf = !!currentOverride.hideInPdf;

  const handleColorSelect = (colorHex: string) => {
    const nextColor = currentOverrideRef.current.accentColor === colorHex ? undefined : colorHex;
    const next = {
      ...currentOverrideRef.current,
      accentColor: nextColor
    };
    currentOverrideRef.current = next;
    onUpdate(next);
  };

  const handleSizeSelect = (size: 'S' | 'M' | 'L') => {
    const nextSize = (currentOverrideRef.current.size || 'M') === size ? undefined : size;
    const next = {
      ...currentOverrideRef.current,
      size: nextSize
    };
    currentOverrideRef.current = next;
    onUpdate(next);
  };

  const handleAlignSelect = (align: 'left' | 'center' | 'right') => {
    const nextAlign = (currentOverrideRef.current.alignment || 'left') === align ? undefined : align;
    const next = {
      ...currentOverrideRef.current,
      alignment: nextAlign
    };
    currentOverrideRef.current = next;
    onUpdate(next);
  };

  const handleToggleHideInPdf = () => {
    const next = {
      ...currentOverrideRef.current,
      hideInPdf: !currentOverrideRef.current.hideInPdf
    };
    currentOverrideRef.current = next;
    onUpdate(next);
  };

  const getBlockTypeName = (type: string) => {
    switch (type) {
      case 'norm':
        return 'Norma';
      case 'case':
        return 'Kazus';
      case 'table':
        return 'Jadval';
      case 'qa':
        return 'Fleshkard';
      case 'note':
        return 'Ogoh / Izoh';
      case 'definition':
        return 'Taʼrif';
      case 'compare':
        return 'Taqqos';
      case 'flow':
        return 'Jarayon';
      case 'timeline':
        return 'Vaqt shkalasi';
      default:
        return 'Blok';
    }
  };

  const hasAnyOverride =
    !!currentOverride.accentColor ||
    !!currentOverride.size ||
    !!currentOverride.alignment ||
    !!currentOverride.hideInPdf;

  const popoverContent = (
    <>
      {/* Orqa fon (Overlay) popover tashqarisiga bosilganda yopish uchun */}
      <div
        className="block-style-popover-overlay"
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        ref={popoverRef}
        className="block-style-popover"
        style={{ top: `${top}px`, left: `${left}px` }}
        role="dialog"
        aria-modal="true"
        aria-label="Blok uslubini sozlash"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Sarlavha qatori */}
        <div className="bsp-header">
          <div className="bsp-title-area">
            <span className="bsp-type-badge">{getBlockTypeName(block.type)}</span>
            <span className="bsp-title">Uslub sozlamasi</span>
          </div>
          <button
            type="button"
            className="bsp-close-btn"
            onClick={onClose}
            aria-label="Yopish"
          >
            <X size={16} />
          </button>
        </div>

        {/* 1. Accent Ranglar qatori (8 ta parametr) */}
        <div className="bsp-section">
          <label className="bsp-label">Urg‘u rangi (Accent)</label>
          <div className="bsp-color-grid" role="radiogroup" aria-label="Aksent rangi">
            {BLOCK_ACCENT_COLORS.map((c) => {
              const isSelected = activeColor === c.value;
              return (
                <button
                  key={c.value}
                  type="button"
                  className={`bsp-color-swatch ${isSelected ? 'active' : ''}`}
                  style={{ backgroundColor: c.value }}
                  onClick={() => handleColorSelect(c.value)}
                  title={c.name}
                  aria-label={c.name}
                  role="radio"
                  aria-checked={isSelected}
                >
                  {isSelected && <Check size={14} className="bsp-swatch-check" strokeWidth={3} />}
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. O'lcham (S / M / L) */}
        <div className="bsp-section">
          <label className="bsp-label">Blok o‘lchami</label>
          <div className="bsp-segmented-row" role="group" aria-label="Blok o‘lchami">
            {(['S', 'M', 'L'] as const).map((sz) => {
              const isSelected = activeSize === sz;
              return (
                <button
                  key={sz}
                  type="button"
                  className={`bsp-seg-btn ${isSelected ? 'active' : ''}`}
                  onClick={() => handleSizeSelect(sz)}
                  aria-pressed={isSelected}
                >
                  {sz === 'S' ? 'Kichik (S)' : sz === 'M' ? 'Standart (M)' : 'Katta (L)'}
                </button>
              );
            })}
          </div>
        </div>

        {/* 3. Matn tekislash (Alignment) */}
        <div className="bsp-section">
          <label className="bsp-label">Tekislash (Alignment)</label>
          <div className="bsp-segmented-row" role="group" aria-label="Matn tekislash">
            <button
              type="button"
              className={`bsp-seg-btn ${activeAlign === 'left' ? 'active' : ''}`}
              onClick={() => handleAlignSelect('left')}
              title="Chapdan tekislash"
              aria-label="Chapdan tekislash"
            >
              <AlignLeft size={14} /> Chap
            </button>
            <button
              type="button"
              className={`bsp-seg-btn ${activeAlign === 'center' ? 'active' : ''}`}
              onClick={() => handleAlignSelect('center')}
              title="Markazdan tekislash"
              aria-label="Markazdan tekislash"
            >
              <AlignCenter size={14} /> Markaz
            </button>
            <button
              type="button"
              className={`bsp-seg-btn ${activeAlign === 'right' ? 'active' : ''}`}
              onClick={() => handleAlignSelect('right')}
              title="O‘ngdan tekislash"
              aria-label="O‘ngdan tekislash"
            >
              <AlignRight size={14} /> O‘ng
            </button>
          </div>
        </div>

        {/* 4. PDFda yashirish (Hide in PDF toggle) */}
        <div className="bsp-section">
          <div
            className="bsp-toggle-row"
            onClick={handleToggleHideInPdf}
            role="switch"
            aria-checked={isHiddenInPdf}
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === ' ' || e.key === 'Enter') {
                e.preventDefault();
                handleToggleHideInPdf();
              }
            }}
          >
            <div className="bsp-toggle-info">
              {isHiddenInPdf ? <EyeOff size={15} color="#f43f5e" /> : <Eye size={15} color="#94a3b8" />}
              <span>PDF chop etishda yashirish</span>
            </div>
            <div className={`bsp-switch ${isHiddenInPdf ? 'checked' : ''}`}>
              <div className="bsp-switch-thumb" />
            </div>
          </div>
        </div>

        {/* 5. Blok uslubini tozalash (Reset) */}
        {hasAnyOverride && (
          <div className="bsp-footer">
            <button
              type="button"
              className="bsp-reset-btn"
              onClick={() => {
                onReset();
                onClose();
              }}
            >
              <RotateCcw size={14} />
              <span>Blok uslubini tozalash</span>
            </button>
          </div>
        )}
      </div>
    </>
  );

  return typeof document !== 'undefined' ? createPortal(popoverContent, document.body) : popoverContent;
};
