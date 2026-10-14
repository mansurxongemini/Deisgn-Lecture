import React, { useEffect, useRef } from 'react';
import type { SlashCommandItem } from './slashCommands';
import {
  Heading,
  Scale,
  Gavel,
  HelpCircle,
  Table,
  AlertTriangle,
  Lightbulb,
  Bookmark,
  Columns,
  ListOrdered,
  Clock,
  Search
} from 'lucide-react';
import './editor.css';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  commands: SlashCommandItem[];
  selectedIndex: number;
  onSelectIndex: (idx: number) => void;
  onSelectCommand: (cmd: SlashCommandItem) => void;
  position?: { top: number; left: number };
  searchQuery?: string;
  onSearchChange?: (q: string) => void;
  showSearchBar?: boolean;
}

export const SlashCommandMenu: React.FC<Props> = ({
  isOpen,
  onClose,
  commands,
  selectedIndex,
  onSelectIndex,
  onSelectCommand,
  position,
  searchQuery,
  onSearchChange,
  showSearchBar = false
}) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Tanlangan elementni ko'rinadigan sohada ushlab turish (scrollIntoView)
  useEffect(() => {
    if (!listRef.current) return;
    const selectedEl = listRef.current.children[selectedIndex] as HTMLElement;
    if (selectedEl) {
      selectedEl.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex]);

  // Agar qidiruv maydoni bo'lsa, avtomatik fokus qilish
  useEffect(() => {
    if (isOpen && showSearchBar && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen, showSearchBar]);

  if (!isOpen) return null;

  const renderIcon = (iconName: SlashCommandItem['iconName']) => {
    switch (iconName) {
      case 'heading':
        return <Heading size={16} className="slash-item-icon" />;
      case 'scale':
        return <Scale size={16} className="slash-item-icon" />;
      case 'gavel':
        return <Gavel size={16} className="slash-item-icon" />;
      case 'help-circle':
        return <HelpCircle size={16} className="slash-item-icon" />;
      case 'table':
        return <Table size={16} className="slash-item-icon" />;
      case 'alert-triangle':
        return <AlertTriangle size={16} className="slash-item-icon" />;
      case 'lightbulb':
        return <Lightbulb size={16} className="slash-item-icon" />;
      case 'bookmark':
        return <Bookmark size={16} className="slash-item-icon" />;
      case 'columns':
        return <Columns size={16} className="slash-item-icon" />;
      case 'list-ordered':
        return <ListOrdered size={16} className="slash-item-icon" />;
      case 'clock':
        return <Clock size={16} className="slash-item-icon" />;
      default:
        return <Heading size={16} className="slash-item-icon" />;
    }
  };

  const style: React.CSSProperties = position
    ? {
        position: 'absolute',
        top: `${position.top}px`,
        left: `${position.left}px`,
        zIndex: 100
      }
    : {};

  return (
    <div
      ref={menuRef}
      className={`slash-command-card ${position ? 'floating' : 'popover'}`}
      style={style}
      role="menu"
      aria-label="MD+ Blok buyruqlari"
    >
      {showSearchBar && (
        <div className="slash-search-bar">
          <Search size={14} className="slash-search-icon" />
          <input
            ref={searchInputRef}
            type="text"
            className="slash-search-input"
            placeholder="Blokni qidiring (/norma, /kazus, /savol...)"
            value={searchQuery || ''}
            onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown') {
                e.preventDefault();
                onSelectIndex(Math.min(commands.length - 1, selectedIndex + 1));
              } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                onSelectIndex(Math.max(0, selectedIndex - 1));
              } else if (e.key === 'Enter') {
                e.preventDefault();
                if (commands[selectedIndex]) {
                  onSelectCommand(commands[selectedIndex]);
                }
              } else if (e.key === 'Escape') {
                e.preventDefault();
                onClose();
              }
            }}
          />
        </div>
      )}

      <div className="slash-section-header">
        <span>MD+ BLOK SHABLONLARI</span>
        <span className="slash-shortcut-hint">↑↓ harakatlanish • Enter tanlash</span>
      </div>

      <div ref={listRef} className="slash-command-list" role="listbox">
        {commands.length === 0 ? (
          <div className="slash-empty-state">
            <span>Mos keluvchi blok topilmadi</span>
          </div>
        ) : (
          commands.map((cmd, idx) => {
            const isSelected = idx === selectedIndex;
            return (
              <div
                key={cmd.id}
                role="option"
                aria-selected={isSelected}
                className={`slash-command-row ${isSelected ? 'selected' : ''}`}
                onMouseEnter={() => onSelectIndex(idx)}
                onClick={() => onSelectCommand(cmd)}
              >
                <div className="slash-row-icon-wrap">{renderIcon(cmd.iconName)}</div>
                <div className="slash-row-info">
                  <div className="slash-row-title-row">
                    <span className="slash-row-label">{cmd.label}</span>
                    <code className="slash-row-command">{cmd.command}</code>
                  </div>
                  <span className="slash-row-desc">{cmd.desc}</span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
