import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  FileText,
  FilePlus,
  FolderPlus,
  Printer,
  HelpCircle,
  Columns,
  PanelLeftClose,
  Sparkles,
  GraduationCap
} from 'lucide-react';
import type { FolderItem, DocumentItem } from '../../schema/workspace';
import './palette.css';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  documents: DocumentItem[];
  folders: FolderItem[];
  onSelectDoc: (id: string) => void;
  onCreateDoc: () => void;
  onCreateFolder: () => void;
  onToggleSidebar: () => void;
  onPrint: () => void;
  onOpenHelp: () => void;
  onToggleViewMode: () => void;
  onOpenSmartIngest?: () => void;
  onOpenExam?: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  documents,
  folders,
  onSelectDoc,
  onCreateDoc,
  onCreateFolder,
  onToggleSidebar,
  onPrint,
  onOpenHelp,
  onToggleViewMode,
  onOpenSmartIngest,
  onOpenExam
}) => {
  const [query, setQuery] = useState<string>('');
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Compute matched items
  const matchedDocs = React.useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return documents.slice(0, 5);
    return documents.filter((d) => d.title.toLowerCase().includes(q));
  }, [documents, query]);

  const commands = React.useMemo(() => {
    const q = query.toLowerCase().trim();
    const list = [
      {
        id: 'cmd_new_doc',
        title: 'Yangi hujjat yaratish',
        shortcut: 'Ctrl+N',
        icon: <FilePlus size={15} />,
        action: () => {
          onClose();
          onCreateDoc();
        }
      },
      {
        id: 'cmd_new_folder',
        title: 'Yangi papka ochish',
        shortcut: '',
        icon: <FolderPlus size={15} />,
        action: () => {
          onClose();
          onCreateFolder();
        }
      },
      {
        id: 'cmd_toggle_view',
        title: 'Ko‘rinish rejimini almashtirish',
        shortcut: 'Ctrl+E',
        icon: <Columns size={15} />,
        action: () => {
          onClose();
          onToggleViewMode();
        }
      },
      {
        id: 'cmd_print',
        title: 'PDF sifatida yuklab olish (Full-bleed 9:16)',
        shortcut: 'Ctrl+P',
        icon: <Printer size={15} />,
        action: () => {
          onClose();
          onPrint();
        }
      },
      {
        id: 'cmd_toggle_sidebar',
        title: 'Yon panelni yashirish / ko‘rsatish',
        shortcut: 'Ctrl+B',
        icon: <PanelLeftClose size={15} />,
        action: () => {
          onClose();
          onToggleSidebar();
        }
      },
      {
        id: 'cmd_smart_ingest',
        title: 'Aqlli formatlash / Matndan konspekt yaratish',
        shortcut: 'Ctrl+Shift+I',
        icon: <Sparkles size={15} />,
        action: () => {
          onClose();
          onOpenSmartIngest?.();
        }
      },
      {
        id: 'cmd_exam_trainer',
        title: 'Imtihon Trenajyori (Oraliq takrorlash - SM-2)',
        shortcut: 'Ctrl+Shift+E',
        icon: <GraduationCap size={15} />,
        action: () => {
          onClose();
          onOpenExam?.();
        }
      },
      {
        id: 'cmd_help',
        title: 'Qo‘llanmani ochish',
        shortcut: '?',
        icon: <HelpCircle size={15} />,
        action: () => {
          onClose();
          onOpenHelp();
        }
      }
    ];

    if (!q) return list;
    return list.filter((c) => c.title.toLowerCase().includes(q));
  }, [query, onClose, onCreateDoc, onCreateFolder, onToggleViewMode, onPrint, onToggleSidebar, onOpenHelp, onOpenSmartIngest, onOpenExam]);

  // Combined items for index navigation
  const allItems = React.useMemo(() => {
    const items: Array<{ type: 'doc'; data: DocumentItem } | { type: 'cmd'; data: typeof commands[0] }> = [];
    matchedDocs.forEach((d) => items.push({ type: 'doc', data: d }));
    commands.forEach((c) => items.push({ type: 'cmd', data: c }));
    return items;
  }, [matchedDocs, commands]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (allItems.length > 0 ? (prev + 1) % allItems.length : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (allItems.length > 0 ? (prev - 1 + allItems.length) % allItems.length : 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const current = allItems[selectedIndex];
      if (current) {
        if (current.type === 'doc') {
          onSelectDoc(current.data.id);
          onClose();
        } else {
          current.data.action();
        }
      }
    }
  };

  if (!isOpen) return null;

  let itemCounter = 0;

  return (
    <div className="palette-backdrop" onClick={onClose}>
      <div className="palette-card" onClick={(e) => e.stopPropagation()}>
        {/* Search Input */}
        <div className="palette-input-wrap">
          <Search className="palette-search-icon" size={18} strokeWidth={2} />
          <input
            ref={inputRef}
            type="text"
            className="palette-input"
            placeholder="Hujjatlar, papkalar yoki buyruqlarni qidirish..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <span className="palette-esc-badge">ESC</span>
        </div>

        {/* Results List */}
        <div className="palette-list">
          {matchedDocs.length > 0 && (
            <>
              <div className="palette-group-title">Hujjatlar</div>
              {matchedDocs.map((doc) => {
                const index = itemCounter++;
                const isSelected = index === selectedIndex;
                const parentFolder = folders.find((f) => f.id === doc.parentId);

                return (
                  <div
                    key={doc.id}
                    className={`palette-item ${isSelected ? 'selected' : ''}`}
                    onClick={() => {
                      onSelectDoc(doc.id);
                      onClose();
                    }}
                    onMouseEnter={() => setSelectedIndex(index)}
                  >
                    <FileText className="palette-item-icon" size={16} strokeWidth={1.8} />
                    <div className="palette-item-text">
                      <span>{doc.title}</span>
                      {parentFolder && <span className="palette-item-sub">{parentFolder.name} /</span>}
                    </div>
                    {isSelected && <span className="palette-item-shortcut">Enter</span>}
                  </div>
                );
              })}
            </>
          )}

          {commands.length > 0 && (
            <>
              <div className="palette-group-title" style={{ marginTop: '6px' }}>
                Tezkor buyruqlar
              </div>
              {commands.map((cmd) => {
                const index = itemCounter++;
                const isSelected = index === selectedIndex;

                return (
                  <div
                    key={cmd.id}
                    className={`palette-item ${isSelected ? 'selected' : ''}`}
                    onClick={cmd.action}
                    onMouseEnter={() => setSelectedIndex(index)}
                  >
                    <span className="palette-item-icon">{cmd.icon}</span>
                    <div className="palette-item-text">
                      <span>{cmd.title}</span>
                    </div>
                    {cmd.shortcut && <span className="palette-item-shortcut">{cmd.shortcut}</span>}
                  </div>
                );
              })}
            </>
          )}

          {allItems.length === 0 && (
            <div style={{ padding: '24px', textAlign: 'center', color: '#a1a1aa', fontSize: '13px' }}>
              "{query}" bo‘yicha natija topilmadi
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="palette-footer">
          <div style={{ display: 'flex', gap: '12px' }}>
            <span><strong>↑ ↓</strong> tanlash</span>
            <span><strong>↵</strong> ochish</span>
            <span><strong>esc</strong> yopish</span>
          </div>
          <span>Tezkor boshqaruv</span>
        </div>
      </div>
    </div>
  );
};
