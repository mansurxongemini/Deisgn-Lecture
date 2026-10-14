import React, { useState } from 'react';
import { Bold, Italic, Underline, Highlighter, Palette, Type, Eraser, Code2 } from 'lucide-react';
import type { StyleColorToken, StyleSizeStep } from '../../schema/styleAnnotation';
import './canvasEditing.css';

interface Props {
  position: { top: number; left: number } | null;
  sourceLine?: number;
  activeColor?: StyleColorToken;
  activeSize?: StyleSizeStep;
  onFormat: (formatType: 'bold' | 'italic' | 'underline' | 'highlight') => void;
  onColorChange?: (color: StyleColorToken) => void;
  onSizeChange?: (size: StyleSizeStep) => void;
  onClearStyle?: () => void;
  onJumpToSource: () => void;
}

const COLOR_PALETTE: { token: StyleColorToken; label: string; color: string }[] = [
  { token: 'accent', label: 'To‘q ko‘k (Navy)', color: 'var(--style-color-accent, #1B2A4A)' },
  { token: 'teal', label: 'Dengiz (Teal)', color: 'var(--style-color-teal, #0f766e)' },
  { token: 'amber', label: 'Tilla (Amber)', color: 'var(--style-color-amber, #92400e)' },
  { token: 'crimson', label: 'Qizil (Crimson)', color: 'var(--style-color-crimson, #b91c1c)' },
  { token: 'emerald', label: 'Yashil (Emerald)', color: 'var(--style-color-emerald, #047857)' },
  { token: 'slate', label: 'Kulrang (Slate)', color: 'var(--style-color-slate, #334155)' },
  { token: 'purple', label: 'Binafsha (Purple)', color: 'var(--style-color-purple, #6b21a8)' }
];

const SIZE_STEPS: { step: StyleSizeStep; label: string }[] = [
  { step: 'sm', label: '0.85x' },
  { step: 'base', label: '1.0x' },
  { step: 'lg', label: '1.25x' },
  { step: 'xl', label: '1.5x' }
];

export const CanvasFloatingToolbar: React.FC<Props> = ({
  position,
  sourceLine,
  activeColor,
  activeSize,
  onFormat,
  onColorChange,
  onSizeChange,
  onClearStyle,
  onJumpToSource
}) => {
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showSizePicker, setShowSizePicker] = useState(false);

  if (!position) return null;

  return (
    <div
      className="canvas-floating-toolbar"
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`
      }}
      role="toolbar"
      aria-label="Matn formatlash paneli"
      onMouseDown={(e) => {
        // Fokus va tanlangan matnni (selection) yo'qotmaslik uchun standart harakatni bekor qilamiz
        e.preventDefault();
      }}
    >
      {/* 1. Formatlash tugmalari */}
      <button
        type="button"
        className="canvas-tb-btn"
        title="Qalin matn (**matn**)"
        aria-label="Qalin matn"
        onClick={() => onFormat('bold')}
      >
        <Bold size={14} />
      </button>

      <button
        type="button"
        className="canvas-tb-btn"
        title="Kursiv matn (*matn*)"
        aria-label="Kursiv matn"
        onClick={() => onFormat('italic')}
      >
        <Italic size={14} />
      </button>

      <button
        type="button"
        className="canvas-tb-btn"
        title="Tagiga chizilgan matn"
        aria-label="Tagiga chizish"
        onClick={() => onFormat('underline')}
      >
        <Underline size={14} />
      </button>

      <button
        type="button"
        className="canvas-tb-btn canvas-tb-btn-highlight"
        title="Ajratib ko‘rsatish (==matn==)"
        aria-label="Ajratib ko‘rsatish"
        onClick={() => onFormat('highlight')}
      >
        <Highlighter size={14} />
      </button>

      <div className="canvas-tb-divider" />

      {/* 2. Rang palitrasi */}
      <div className="canvas-tb-popover-anchor">
        <button
          type="button"
          className={`canvas-tb-btn ${showColorPicker ? 'active' : ''}`}
          title="Matn rangi"
          aria-label="Rang tanlash"
          onClick={() => {
            setShowColorPicker(!showColorPicker);
            setShowSizePicker(false);
          }}
        >
          <Palette size={14} />
        </button>

        {showColorPicker && (
          <div className="canvas-tb-color-dropdown" role="menu">
            {COLOR_PALETTE.map((c) => (
              <button
                key={c.token}
                type="button"
                className={`canvas-tb-color-dot ${activeColor === c.token ? 'active' : ''}`}
                style={{ backgroundColor: c.color }}
                title={c.label}
                aria-label={c.label}
                onClick={() => {
                  onColorChange?.(c.token);
                  setShowColorPicker(false);
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* 3. O'lcham tanlagich */}
      <div className="canvas-tb-popover-anchor">
        <button
          type="button"
          className={`canvas-tb-btn ${showSizePicker ? 'active' : ''}`}
          title="Matn o‘lchami"
          aria-label="Matn o‘lchami"
          onClick={() => {
            setShowSizePicker(!showSizePicker);
            setShowColorPicker(false);
          }}
        >
          <Type size={14} />
          {activeSize && activeSize !== 'base' && (
            <span className="canvas-tb-size-tag">{activeSize}</span>
          )}
        </button>

        {showSizePicker && (
          <div className="canvas-tb-size-dropdown" role="menu">
            {SIZE_STEPS.map((s) => (
              <button
                key={s.step}
                type="button"
                className={`canvas-tb-size-option ${activeSize === s.step ? 'active' : ''}`}
                onClick={() => {
                  onSizeChange?.(s.step);
                  setShowSizePicker(false);
                }}
              >
                {s.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 4. Formatni tozalash */}
      {onClearStyle && (
        <button
          type="button"
          className="canvas-tb-btn"
          title="Uslubni tozalash (asl holga qaytarish)"
          aria-label="Uslubni tozalash"
          onClick={onClearStyle}
        >
          <Eraser size={14} />
        </button>
      )}

      <div className="canvas-tb-divider" />

      {/* 5. Manbaga o'tish */}
      <button
        type="button"
        className="canvas-tb-btn canvas-tb-btn-jump"
        title={sourceLine ? `${sourceLine}-qatorga sakrash` : 'Manba matniga o‘tish'}
        aria-label="Manbaga o‘tish"
        onClick={onJumpToSource}
      >
        <Code2 size={13} />
        <span>Manbaga o‘tish</span>
        {sourceLine && <span className="canvas-tb-line-badge">:{sourceLine}</span>}
      </button>
    </div>
  );
};
