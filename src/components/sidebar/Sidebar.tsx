import React, { useState, useEffect, useRef } from 'react';
import {
  Scale,
  PanelLeftClose,
  Search,
  FolderPlus,
  HelpCircle,
  FilePlus
} from 'lucide-react';
import type { FolderItem, DocumentItem } from '../../schema/workspace';
import { FileTree } from './FileTree';
import './sidebar.css';

interface SidebarProps {
  isOpen: boolean;
  onToggleOpen: () => void;
  folders: FolderItem[];
  documents: DocumentItem[];
  activeDocId: string | null;
  recentDocIds: string[];
  lastBackupAt: number | null;
  onSelectDoc: (id: string) => void;
  onCreateDoc: () => void;
  onCreateFolder: () => void;
  onRenameFolder: (id: string, name: string) => void;
  onRenameDoc: (id: string, title: string) => void;
  onDeleteFolder: (id: string) => void;
  onDeleteDoc: (id: string) => void;
  onDuplicateDoc: (id: string) => void;
  onTogglePinDoc: (id: string) => void;
  onTogglePinFolder: (id: string) => void;
  onMoveItem: (itemId: string, itemType: 'folder' | 'document', targetParentId: string | null) => void;
  onOpenHelp: () => void;
  onOpenCommandPalette: () => void;
  onExportZip?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = React.memo(({
  isOpen,
  onToggleOpen,
  folders,
  documents,
  activeDocId,
  recentDocIds,
  lastBackupAt,
  onExportZip,
  onSelectDoc,
  onCreateDoc,
  onCreateFolder,
  onRenameFolder,
  onRenameDoc,
  onDeleteFolder,
  onDeleteDoc,
  onDuplicateDoc,
  onTogglePinDoc,
  onTogglePinFolder,
  onMoveItem,
  onOpenHelp,
  onOpenCommandPalette
}) => {
  const [width, setWidth] = useState<number>(() => {
    const saved = localStorage.getItem('yurist_sidebar_width');
    return saved ? Math.max(220, Math.min(480, parseInt(saved, 10))) : 270;
  });

  const [isResizing, setIsResizing] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Resize handling
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      const newWidth = Math.max(220, Math.min(480, e.clientX));
      setWidth(newWidth);
    };

    const handleMouseUp = () => {
      if (isResizing) {
        setIsResizing(false);
        localStorage.setItem('yurist_sidebar_width', width.toString());
      }
    };

    if (isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, width]);

  // Check if backup is older than 7 days or nonexistent
  const isBackupWarning = React.useMemo(() => {
    if (!lastBackupAt) return true;
    return (Date.now() - lastBackupAt) > 7 * 24 * 3600 * 1000;
  }, [lastBackupAt]);

  // Format backup text with relative time
  const backupText = React.useMemo(() => {
    if (!lastBackupAt) return 'Zaxira qilinmagan';
    const diffSecs = Math.floor((Date.now() - lastBackupAt) / 1000);
    if (diffSecs < 60) return 'Oxirgi zaxira: Hozirgina';
    const diffMins = Math.floor(diffSecs / 60);
    if (diffMins < 60) return `Oxirgi zaxira: ${diffMins} daqiqa oldin`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `Oxirgi zaxira: ${diffHours} soat oldin`;
    const diffDays = Math.floor(diffHours / 24);
    return `Oxirgi zaxira: ${diffDays} kun oldin`;
  }, [lastBackupAt]);

  return (
    <aside
      className={`workspace-sidebar ${isOpen ? '' : 'collapsed'}`}
      style={{ width: isOpen ? `${width}px` : 0 }}
    >
      {/* Resizer bar on right edge */}
      <div
        className={`sidebar-resizer ${isResizing ? 'resizing' : ''}`}
        onMouseDown={(e) => {
          e.preventDefault();
          setIsResizing(true);
        }}
      />

      {/* Sidebar Header */}
      <div className="sidebar-header">
        <div className="workspace-title-wrap">
          <Scale className="workspace-logo-icon" size={18} strokeWidth={2} />
          <span>Huquqiy hujjatlar</span>
        </div>
        <button
          className="sidebar-close-btn"
          title="Panelni yashirish (Ctrl+B)"
          onClick={onToggleOpen}
        >
          <PanelLeftClose size={16} strokeWidth={1.8} />
        </button>
      </div>

      {/* Search Input */}
      <div className="sidebar-search-box">
        <div
          className="search-input-wrapper"
          onClick={() => searchInputRef.current?.focus()}
        >
          <Search size={14} strokeWidth={2} />
          <input
            ref={searchInputRef}
            type="text"
            className="search-input-field"
            placeholder="Qidirish..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button
            className="search-kbd-hint"
            onClick={(e) => {
              e.stopPropagation();
              onOpenCommandPalette();
            }}
            title="Buyruqlar paneli (Ctrl+K)"
          >
            Ctrl+K
          </button>
        </div>
      </div>

      {/* Action Buttons: New Doc, New Folder */}
      <div className="sidebar-action-bar">
        <button
          className="sidebar-action-button"
          onClick={onCreateDoc}
          title="Yangi hujjat yaratish (Ctrl+N)"
        >
          <FilePlus size={13} strokeWidth={2} />
          <span>Hujjat</span>
        </button>
        <button
          className="sidebar-action-button"
          onClick={onCreateFolder}
          title="Yangi papka ochish"
        >
          <FolderPlus size={13} strokeWidth={2} />
          <span>Papka</span>
        </button>
      </div>

      {/* File & Folder Tree */}
      <FileTree
        folders={folders}
        documents={documents}
        activeDocId={activeDocId}
        searchQuery={searchQuery}
        recentDocIds={recentDocIds}
        onSelectDoc={onSelectDoc}
        onRenameFolder={onRenameFolder}
        onRenameDoc={onRenameDoc}
        onDeleteFolder={onDeleteFolder}
        onDeleteDoc={onDeleteDoc}
        onDuplicateDoc={onDuplicateDoc}
        onTogglePinDoc={onTogglePinDoc}
        onTogglePinFolder={onTogglePinFolder}
        onMoveItem={onMoveItem}
      />

      {/* Sidebar Footer */}
      <div className="sidebar-footer-bar">
        <button
          type="button"
          className="sidebar-backup-badge"
          title={isBackupWarning ? "Diqqat: Zaxira nusxasi olinmagan yoki 7 kundan eski. Zaxirani saqlash uchun bosing." : "Zaxira nusxasi (.zip) yuklab olish uchun bosing"}
          onClick={onExportZip}
          style={{ background: 'none', border: 'none', font: 'inherit', textAlign: 'left' }}
        >
          <span className={`sidebar-status-dot ${isBackupWarning ? 'warning' : ''}`} />
          <span>{backupText}</span>
        </button>
        <button
          type="button"
          className="sidebar-help-button"
          title="Qo'llanma va Yordam (?)"
          onClick={onOpenHelp}
        >
          <HelpCircle size={15} strokeWidth={1.8} />
        </button>
      </div>
    </aside>
  );
}, (prev, next) => {
  return (
    prev.isOpen === next.isOpen &&
    prev.folders === next.folders &&
    prev.documents === next.documents &&
    prev.activeDocId === next.activeDocId &&
    prev.recentDocIds === next.recentDocIds &&
    prev.lastBackupAt === next.lastBackupAt
  );
});
