import JSZip from 'jszip';
import type {
  FolderItem,
  DocumentItem,
  WorkspaceManifest
} from '../../schema/workspace';
import {
  getAllFolders,
  getAllDocuments,
  getWorkspaceMeta,
  saveFolder,
  saveDocument,
  saveWorkspaceMeta
} from './workspaceStorage';
import { sanitizeFileName } from './treeOps';

/**
 * Builds the filesystem path for a folder within the ZIP archive.
 */
function getZipFolderPath(folderId: string, folderMap: Map<string, FolderItem>): string {
  const parts: string[] = [];
  let currId: string | null = folderId;
  const visited = new Set<string>();

  while (currId !== null) {
    if (visited.has(currId)) break;
    visited.add(currId);

    const folder = folderMap.get(currId);
    if (!folder) break;
    parts.unshift(sanitizeFileName(folder.name));
    currId = folder.parentId;
  }

  return parts.join('/') + '/';
}

/**
 * Exports the entire workspace as a .zip file (Blob).
 */
export async function exportWorkspaceToZip(): Promise<Blob> {
  const zip = new JSZip();
  const folders = await getAllFolders();
  const documents = await getAllDocuments();
  const meta = await getWorkspaceMeta();

  const folderMap = new Map<string, FolderItem>();
  folders.forEach((f) => folderMap.set(f.id, f));

  // 1. Create folder structures and add markdown documents
  for (const doc of documents) {
    const safeTitle = sanitizeFileName(doc.title);
    let filePath = `${safeTitle}.md`;

    if (doc.parentId && folderMap.has(doc.parentId)) {
      const folderPath = getZipFolderPath(doc.parentId, folderMap);
      filePath = `${folderPath}${safeTitle}.md`;
    }

    zip.file(filePath, doc.content);
    if (doc.styles && doc.styles.length > 0) {
      const stylesPath = filePath.replace(/\.md$/, '.styles.json');
      zip.file(stylesPath, JSON.stringify(doc.styles, null, 2));
    }
  }

  // 2. Add .workspace_manifest.json with all relations and settings
  const manifest: WorkspaceManifest = {
    version: '1.0',
    exportedAt: Date.now(),
    folders,
    documents: documents.map(({ content, ...rest }) => rest),
    meta
  };

  zip.file('.workspace_manifest.json', JSON.stringify(manifest, null, 2));

  // Update backup timestamp
  await saveWorkspaceMeta({ lastBackupAt: Date.now() });

  return await zip.generateAsync({ type: 'blob' });
}

/**
 * Imports an entire workspace from a .zip file (Blob or ArrayBuffer).
 */
export async function importWorkspaceFromZip(
  zipData: Blob | ArrayBuffer
): Promise<{ foldersCount: number; docsCount: number }> {
  const zip = await JSZip.loadAsync(zipData);
  const now = Date.now();

  // Check if manifest exists
  const manifestFile = zip.file('.workspace_manifest.json');

  if (manifestFile) {
    const manifestJson = await manifestFile.async('string');
    const manifest = JSON.parse(manifestJson) as WorkspaceManifest;

    // Restore folders
    for (const folder of manifest.folders) {
      await saveFolder(folder);
    }

    // Restore documents
    for (const docMeta of manifest.documents) {
      // Find the file in zip
      const safeTitle = sanitizeFileName(docMeta.title);
      let content = '';

      // Try locating by filename
      const matchedFile = zip.file(new RegExp(`${safeTitle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\.md$`, 'i'))[0];
      if (matchedFile) {
        content = await matchedFile.async('string');
      }

      // Check for sidecar .styles.json file
      let styles = (docMeta as any).styles;
      const matchedStylesFile = zip.file(new RegExp(`${safeTitle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\.styles\\.json$`, 'i'))[0];
      if (matchedStylesFile) {
        try {
          const stylesJson = await matchedStylesFile.async('string');
          styles = JSON.parse(stylesJson);
        } catch {
          // ignore error
        }
      }

      const fullDoc: DocumentItem = {
        ...docMeta,
        content,
        styles,
        updatedAt: now
      };
      await saveDocument(fullDoc);
    }

    if (manifest.meta) {
      await saveWorkspaceMeta({
        ...manifest.meta,
        lastBackupAt: now
      });
    }

    return {
      foldersCount: manifest.folders.length,
      docsCount: manifest.documents.length
    };
  }

  // Fallback: If no manifest, reconstruct from directory tree
  const folderPathToId = new Map<string, string>();
  let folderCounter = 0;
  let docCounter = 0;

  // Scan all folders in zip
  const files: { path: string; isDir: boolean }[] = [];
  zip.forEach((relativePath, file) => {
    files.push({ path: relativePath, isDir: file.dir });
  });

  // Ensure folders exist
  for (const item of files) {
    if (item.isDir) {
      const parts = item.path.replace(/\/$/, '').split('/');
      let currentPath = '';
      let parentId: string | null = null;

      for (let i = 0; i < parts.length; i++) {
        const folderName = parts[i];
        currentPath = currentPath ? `${currentPath}/${folderName}` : folderName;

        if (!folderPathToId.has(currentPath)) {
          const folderId = `folder_imported_${Date.now()}_${folderCounter++}`;
          folderPathToId.set(currentPath, folderId);

          const folderItem: FolderItem = {
            id: folderId,
            parentId,
            name: folderName,
            order: folderCounter,
            createdAt: now,
            updatedAt: now
          };
          await saveFolder(folderItem);
        }
        parentId = folderPathToId.get(currentPath)!;
      }
    }
  }

  // Import markdown files
  for (const item of files) {
    if (!item.isDir && item.path.toLowerCase().endsWith('.md')) {
      const parts = item.path.split('/');
      const fileName = parts.pop()!;
      const folderPath = parts.join('/');
      const parentId = folderPath ? folderPathToId.get(folderPath) || null : null;

      const title = fileName.replace(/\.md$/i, '');
      const content = await zip.file(item.path)!.async('string');

      let styles: any = undefined;
      const sidecarPath = item.path.replace(/\.md$/i, '.styles.json');
      const sidecarFile = zip.file(sidecarPath);
      if (sidecarFile) {
        try {
          styles = JSON.parse(await sidecarFile.async('string'));
        } catch {
          // ignore error
        }
      }

      const docItem: DocumentItem = {
        id: `doc_imported_${Date.now()}_${docCounter++}`,
        parentId,
        title,
        content,
        styles,
        order: docCounter,
        theme: 'modern',
        createdAt: now,
        updatedAt: now
      };

      await saveDocument(docItem);
    }
  }

  await saveWorkspaceMeta({ lastBackupAt: now });

  return {
    foldersCount: folderPathToId.size,
    docsCount: docCounter
  };
}

/**
 * Exports a single document as Markdown text.
 */
export function exportSingleDocument(doc: DocumentItem): string {
  return doc.content;
}

/**
 * Creates a DocumentItem from an imported single file.
 */
export function importSingleDocument(
  fileName: string,
  content: string,
  parentId: string | null = null
): DocumentItem {
  // Extract title from first heading # ... if present
  const firstHeadingMatch = content.match(/^#\s+(.+)$/m);
  const title = firstHeadingMatch
    ? firstHeadingMatch[1].trim()
    : fileName.replace(/\.md$/i, '').trim();

  const now = Date.now();
  return {
    id: `doc_${now}_${Math.random().toString(36).substring(2, 7)}`,
    parentId,
    title,
    content,
    order: 0,
    theme: 'modern',
    createdAt: now,
    updatedAt: now
  };
}
