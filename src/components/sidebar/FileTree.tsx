import React, { useState, useMemo } from 'react';
import type { FolderItem, DocumentItem } from '../../schema/workspace';
import { TreeItem } from './TreeItem';
import { canMoveFolder } from '../../services/workspace/treeOps';

interface FileTreeProps {
  folders: FolderItem[];
  documents: DocumentItem[];
  activeDocId: string | null;
  searchQuery: string;
  recentDocIds: string[];
  onSelectDoc: (id: string) => void;
  onRenameFolder: (id: string, name: string) => void;
  onRenameDoc: (id: string, title: string) => void;
  onDeleteFolder: (id: string) => void;
  onDeleteDoc: (id: string) => void;
  onDuplicateDoc: (id: string) => void;
  onTogglePinDoc: (id: string) => void;
  onTogglePinFolder: (id: string) => void;
  onMoveItem: (itemId: string, itemType: 'folder' | 'document', targetParentId: string | null) => void;
}

export const FileTree: React.FC<FileTreeProps> = ({
  folders,
  documents,
  activeDocId,
  searchQuery,
  onSelectDoc,
  onRenameFolder,
  onRenameDoc,
  onDeleteFolder,
  onDeleteDoc,
  onDuplicateDoc,
  onTogglePinDoc,
  onTogglePinFolder,
  onMoveItem
}) => {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(() => {
    // Expand top-level folders by default
    const set = new Set<string>();
    folders.forEach((f) => set.add(f.id));
    return set;
  });

  // Faol hujjat o'zgarganda uning ota papkasini avtomatik ochish
  React.useEffect(() => {
    if (!activeDocId) return;
    const doc = documents.find((d) => d.id === activeDocId);
    if (!doc || !doc.parentId) return;

    setExpandedFolders((prev) => {
      const next = new Set(prev);
      let currParent: string | null = doc.parentId;
      while (currParent) {
        next.add(currParent);
        const parentFolder = folders.find((f) => f.id === currParent);
        currParent = parentFolder ? parentFolder.parentId : null;
      }
      return next;
    });
  }, [activeDocId, documents, folders]);

  const [draggedItem, setDraggedItem] = useState<{
    id: string;
    type: 'folder' | 'document';
  } | null>(null);

  const [dragOverTargetId, setDragOverTargetId] = useState<string | null>(null);

  const toggleFolder = (folderId: string) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(folderId)) {
        next.delete(folderId);
      } else {
        next.add(folderId);
      }
      return next;
    });
  };

  // Filter items based on searchQuery
  const filteredData = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) {
      return { folders, documents };
    }

    const matchedDocs = documents.filter((d) => d.title.toLowerCase().includes(q));
    const matchedDocParentIds = new Set(matchedDocs.map((d) => d.parentId).filter(Boolean));

    const matchedFolders = folders.filter((f) => {
      return f.name.toLowerCase().includes(q) || matchedDocParentIds.has(f.id);
    });

    return { folders: matchedFolders, documents: matchedDocs };
  }, [folders, documents, searchQuery]);

  // Bir xil nomga ega hujjatlarni aniqlash va ularni UI da nozik belgi bilan ajratib ko'rsatish
  const duplicateDocDetails = useMemo(() => {
    const counts = new Map<string, number>();
    documents.forEach((d) => {
      const normTitle = d.title.trim().toLowerCase();
      counts.set(normTitle, (counts.get(normTitle) || 0) + 1);
    });

    const map = new Map<string, string>();
    documents.forEach((d) => {
      const normTitle = d.title.trim().toLowerCase();
      if ((counts.get(normTitle) || 0) > 1) {
        const time = d.createdAt || d.updatedAt;
        if (time) {
          const date = new Date(time);
          const formatted = date.toLocaleDateString('uz-UZ', {
            month: 'numeric',
            day: 'numeric'
          });
          map.set(d.id, formatted);
        } else {
          map.set(d.id, `#${d.id.slice(-4)}`);
        }
      }
    });
    return map;
  }, [documents]);

  // Drag Handlers
  const handleDragStart = (e: React.DragEvent, id: string, type: 'folder' | 'document') => {
    e.dataTransfer.setData('text/plain', JSON.stringify({ id, type }));
    setDraggedItem({ id, type });
  };

  const handleDragOver = (e: React.DragEvent, targetFolderId: string | null) => {
    e.preventDefault();
    e.stopPropagation();

    if (!draggedItem) return;

    if (draggedItem.type === 'folder') {
      if (!canMoveFolder(draggedItem.id, targetFolderId, folders)) {
        return; // Invalid drop target
      }
    }

    setDragOverTargetId(targetFolderId);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverTargetId(null);
  };

  const handleDrop = (e: React.DragEvent, targetFolderId: string | null) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverTargetId(null);

    if (!draggedItem) return;

    if (draggedItem.type === 'folder') {
      if (canMoveFolder(draggedItem.id, targetFolderId, folders)) {
        onMoveItem(draggedItem.id, 'folder', targetFolderId);
        if (targetFolderId) {
          setExpandedFolders((prev) => new Set([...prev, targetFolderId]));
        }
      }
    } else {
      onMoveItem(draggedItem.id, 'document', targetFolderId);
      if (targetFolderId) {
        setExpandedFolders((prev) => new Set([...prev, targetFolderId]));
      }
    }

    setDraggedItem(null);
  };

  // Recursive tree render
  const renderTreeNodes = (parentId: string | null, depth: number): React.ReactNode => {
    const currentFolders = filteredData.folders.filter((f) => f.parentId === parentId);
    const currentDocs = filteredData.documents.filter((d) => d.parentId === parentId);

    if (currentFolders.length === 0 && currentDocs.length === 0) {
      return null;
    }

    return (
      <div key={`tree-group-${parentId || 'root'}`}>
        {currentFolders.map((folder) => {
          const isExpanded = expandedFolders.has(folder.id) || !!searchQuery;
          const isOver = dragOverTargetId === folder.id;

          return (
            <React.Fragment key={folder.id}>
              <TreeItem
                item={folder}
                isFolder={true}
                depth={depth}
                isExpanded={isExpanded}
                onToggleExpand={() => toggleFolder(folder.id)}
                onRename={(name) => onRenameFolder(folder.id, name)}
                onDelete={() => onDeleteFolder(folder.id)}
                onTogglePin={() => onTogglePinFolder(folder.id)}
                onDragStart={(e) => handleDragStart(e, folder.id, 'folder')}
                onDragOver={(e) => handleDragOver(e, folder.id)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, folder.id)}
                isDragOver={isOver}
              />
              {isExpanded && renderTreeNodes(folder.id, depth + 1)}
            </React.Fragment>
          );
        })}

        {currentDocs.map((doc) => (
          <TreeItem
            key={doc.id}
            item={doc}
            isFolder={false}
            depth={depth}
            isActive={doc.id === activeDocId}
            disambiguation={duplicateDocDetails.get(doc.id)}
            onSelect={() => onSelectDoc(doc.id)}
            onRename={(title) => onRenameDoc(doc.id, title)}
            onDelete={() => onDeleteDoc(doc.id)}
            onDuplicate={() => onDuplicateDoc(doc.id)}
            onTogglePin={() => onTogglePinDoc(doc.id)}
            onDragStart={(e) => handleDragStart(e, doc.id, 'document')}
            onDragOver={(e) => handleDragOver(e, doc.parentId)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, doc.parentId)}
          />
        ))}
      </div>
    );
  };

  // Pinned items
  const pinnedDocs = useMemo(() => documents.filter((d) => d.isPinned), [documents]);
  const pinnedFolders = useMemo(() => folders.filter((f) => f.isPinned), [folders]);

  return (
    <div
      className="sidebar-tree-container"
      onDragOver={(e) => handleDragOver(e, null)}
      onDrop={(e) => handleDrop(e, null)}
    >
      {/* Pinned section */}
      {!searchQuery && (pinnedDocs.length > 0 || pinnedFolders.length > 0) && (
        <div style={{ marginBottom: '12px' }}>
          <div className="sidebar-section-header">Tanlanganlar</div>
          {pinnedFolders.map((f) => (
            <TreeItem
              key={`pinned-f-${f.id}`}
              item={f}
              isFolder={true}
              depth={0}
              isExpanded={expandedFolders.has(f.id)}
              onToggleExpand={() => toggleFolder(f.id)}
              onRename={(name) => onRenameFolder(f.id, name)}
              onDelete={() => onDeleteFolder(f.id)}
              onTogglePin={() => onTogglePinFolder(f.id)}
              onDragStart={(e) => handleDragStart(e, f.id, 'folder')}
              onDragOver={(e) => handleDragOver(e, f.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, f.id)}
            />
          ))}
          {pinnedDocs.map((d) => (
            <TreeItem
              key={`pinned-d-${d.id}`}
              item={d}
              isFolder={false}
              depth={0}
              isActive={d.id === activeDocId}
              disambiguation={duplicateDocDetails.get(d.id)}
              onSelect={() => onSelectDoc(d.id)}
              onRename={(title) => onRenameDoc(d.id, title)}
              onDelete={() => onDeleteDoc(d.id)}
              onDuplicate={() => onDuplicateDoc(d.id)}
              onTogglePin={() => onTogglePinDoc(d.id)}
              onDragStart={(e) => handleDragStart(e, d.id, 'document')}
              onDragOver={(e) => handleDragOver(e, d.parentId)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, d.parentId)}
            />
          ))}
        </div>
      )}

      {/* Main Hierarchy Tree */}
      <div className="sidebar-section-header">Papka va Hujjatlar</div>
      {renderTreeNodes(null, 0)}

      {/* Empty Filter State */}
      {filteredData.folders.length === 0 && filteredData.documents.length === 0 && (
        <div style={{ padding: '16px 8px', fontSize: '12px', color: 'var(--text-faint)', textAlign: 'center' }}>
          "{searchQuery}" bo'yicha hech narsa topilmadi
        </div>
      )}
    </div>
  );
};
