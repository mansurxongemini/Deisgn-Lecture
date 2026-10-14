import type { FolderItem, DocumentItem, BreadcrumbCrumb } from '../../schema/workspace';

/**
 * Checks if a folder can be moved to targetParentId.
 * Strictly prevents a folder from being moved into itself or into any of its descendant subfolders.
 */
export function canMoveFolder(
  folderId: string,
  targetParentId: string | null,
  allFolders: FolderItem[]
): boolean {
  // A folder cannot be moved into itself
  if (targetParentId === folderId) {
    return false;
  }

  // Moving to root level is always valid
  if (targetParentId === null) {
    return true;
  }

  // Check if targetParentId is a descendant of folderId
  const folderMap = new Map<string, FolderItem>();
  allFolders.forEach((f) => folderMap.set(f.id, f));

  let currentParentId: string | null = targetParentId;
  const visited = new Set<string>();

  while (currentParentId !== null) {
    if (currentParentId === folderId) {
      return false; // target is a descendant!
    }

    if (visited.has(currentParentId)) {
      // Loop protection
      return false;
    }
    visited.add(currentParentId);

    const parentFolder = folderMap.get(currentParentId);
    if (!parentFolder) {
      break;
    }
    currentParentId = parentFolder.parentId;
  }

  return true;
}

/**
 * Recursively retrieves all descendant folder IDs of a given folder.
 */
export function getDescendantFolderIds(
  folderId: string,
  allFolders: FolderItem[]
): string[] {
  const children = allFolders.filter((f) => f.parentId === folderId);
  const result: string[] = [];

  for (const child of children) {
    result.push(child.id);
    result.push(...getDescendantFolderIds(child.id, allFolders));
  }

  return result;
}

/**
 * Calculates the breadcrumb path for a document or folder.
 */
export function getBreadcrumbPath(
  targetId: string,
  isDocument: boolean,
  folders: FolderItem[],
  docs: DocumentItem[]
): BreadcrumbCrumb[] {
  const crumbs: BreadcrumbCrumb[] = [];
  const folderMap = new Map<string, FolderItem>();
  folders.forEach((f) => folderMap.set(f.id, f));

  let currentParentId: string | null = null;

  if (isDocument) {
    const doc = docs.find((d) => d.id === targetId);
    if (!doc) return crumbs;
    crumbs.unshift({ id: doc.id, name: doc.title, isFolder: false });
    currentParentId = doc.parentId;
  } else {
    currentParentId = targetId;
  }

  const visited = new Set<string>();
  while (currentParentId !== null) {
    if (visited.has(currentParentId)) break;
    visited.add(currentParentId);

    const folder = folderMap.get(currentParentId);
    if (!folder) break;

    crumbs.unshift({ id: folder.id, name: folder.name, isFolder: true });
    currentParentId = folder.parentId;
  }

  return crumbs;
}

/**
 * Sanitizes a file or folder name for filesystem and zip storage.
 */
export function sanitizeFileName(name: string): string {
  return name.replace(/[/\\?%*:|"<>]/g, '_').trim() || 'hujjat';
}
