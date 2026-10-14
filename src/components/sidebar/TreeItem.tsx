import React, { useState, useRef, useEffect } from 'react';
import {
  Folder,
  FolderOpen,
  FileText,
  ChevronRight,
  Star,
  Copy,
  Trash2,
  Edit2
} from 'lucide-react';
import type { FolderItem, DocumentItem } from '../../schema/workspace';

interface TreeItemProps {
  item: FolderItem | DocumentItem;
  isFolder: boolean;
  depth: number;
  isActive?: boolean;
  isExpanded?: boolean;
  disambiguation?: string;
  onToggleExpand?: () => void;
  onSelect?: () => void;
  onRename: (newName: string) => void;
  onDelete: () => void;
  onDuplicate?: () => void;
  onTogglePin?: () => void;
  onDragStart: (e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  isDragOver?: boolean;
}

export const TreeItem: React.FC<TreeItemProps> = ({
  item,
  isFolder,
  depth,
  isActive = false,
  isExpanded = false,
  disambiguation,
  onToggleExpand,
  onSelect,
  onRename,
  onDelete,
  onDuplicate,
  onTogglePin,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
  isDragOver = false
}) => {
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const title = isFolder ? (item as FolderItem).name : (item as DocumentItem).title;
  const [editValue, setEditValue] = useState<string>(title);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setEditValue(title);
  }, [title]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();
      const trimmed = editValue.trim();
      if (trimmed && trimmed !== title) {
        onRename(trimmed);
      }
      setIsEditing(false);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      setEditValue(title);
      setIsEditing(false);
    }
  };

  const handleBlur = () => {
    const trimmed = editValue.trim();
    if (trimmed && trimmed !== title) {
      onRename(trimmed);
    }
    setIsEditing(false);
  };

  const handleRowClick = (_e: React.MouseEvent) => {
    if (isEditing) return;
    if (isFolder) {
      onToggleExpand?.();
    } else {
      onSelect?.();
    }
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
  };

  return (
    <div
      className={`tree-row ${isActive ? 'active' : ''} ${isDragOver ? 'drag-over' : ''}`}
      style={{ paddingLeft: `${8 + depth * 14}px` }}
      onClick={handleRowClick}
      onDoubleClick={handleDoubleClick}
      draggable={!isEditing}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'F2') {
          e.preventDefault();
          setIsEditing(true);
        }
      }}
    >
      {/* Folder Chevron or Indent */}
      {isFolder ? (
        <button
          className={`tree-arrow-btn ${isExpanded ? 'expanded' : ''}`}
          onClick={(e) => {
            e.stopPropagation();
            onToggleExpand?.();
          }}
          tabIndex={-1}
        >
          <ChevronRight size={12} strokeWidth={2.5} />
        </button>
      ) : (
        <span style={{ width: '12px', flexShrink: 0 }} />
      )}

      {/* Icon (Consistent 1.5px stroke width) */}
      {isFolder ? (
        isExpanded ? (
          <FolderOpen className="tree-icon" size={15} strokeWidth={1.5} />
        ) : (
          <Folder className="tree-icon" size={15} strokeWidth={1.5} />
        )
      ) : (
        <FileText className="tree-icon" size={15} strokeWidth={1.5} />
      )}

      {/* Label or Inline Edit */}
      {isEditing ? (
        <input
          ref={inputRef}
          type="text"
          className="tree-rename-input"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          onClick={(e) => e.stopPropagation()}
        />
      ) : (
        <span className="tree-label" title={title}>
          {item.isPinned && <Star className="tree-pin-indicator" size={12} fill="#f59e0b" />}
          <span className="tree-label-text">{title}</span>
          {disambiguation && (
            <span className="tree-disambiguation-badge" title={`Yaratilgan sana: ${disambiguation}`}>
              {disambiguation}
            </span>
          )}
        </span>
      )}

      {/* Row Hover Actions */}
      {!isEditing && (
        <div className="tree-row-actions" onClick={(e) => e.stopPropagation()}>
          {onTogglePin && (
            <button
              className="tree-row-btn"
              title={item.isPinned ? 'Pinni olib tashlash' : 'Tanlanganlarga biriktirish'}
              onClick={onTogglePin}
            >
              <Star size={13} fill={item.isPinned ? '#f59e0b' : 'none'} color={item.isPinned ? '#f59e0b' : 'currentColor'} />
            </button>
          )}

          <button
            className="tree-row-btn"
            title="Qayta nomlash (F2)"
            onClick={() => setIsEditing(true)}
          >
            <Edit2 size={13} />
          </button>

          {!isFolder && onDuplicate && (
            <button
              className="tree-row-btn"
              title="Nusxasini yaratish"
              onClick={onDuplicate}
            >
              <Copy size={13} />
            </button>
          )}

          <button
            className="tree-row-btn"
            title="O'chirish"
            onClick={onDelete}
          >
            <Trash2 size={13} />
          </button>
        </div>
      )}
    </div>
  );
};
