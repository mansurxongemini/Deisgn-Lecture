import type {
  FolderItem,
  DocumentItem,
  DocumentSnapshot,
  WorkspaceMeta
} from '../../schema/workspace';
import type { StyleAnnotation } from '../../schema/styleAnnotation';

export const DB_NAME = 'YuristStudioDB';
export const DB_VERSION = 2;

export const FOLDERS_STORE = 'workspace_folders';
export const DOCUMENTS_STORE = 'workspace_documents';
export const SNAPSHOTS_STORE = 'workspace_snapshots';
export const WORKSPACE_META_STORE = 'workspace_meta';
export const PROGRESS_STORE = 'card_progress'; // Independent SM-2 store

let activeDb: IDBDatabase | null = null;

export function closeWorkspaceDatabase(): void {
  if (activeDb) {
    try {
      activeDb.close();
    } catch {
      // ignore
    }
    activeDb = null;
  }
}

export function openWorkspaceDatabase(): Promise<IDBDatabase> {
  if (activeDb) {
    return Promise.resolve(activeDb);
  }

  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      return reject(new Error('IndexedDB mavjud emas'));
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;

      // Existing stores from v1
      if (!db.objectStoreNames.contains(PROGRESS_STORE)) {
        db.createObjectStore(PROGRESS_STORE, { keyPath: 'cardId' });
      }
      if (!db.objectStoreNames.contains('user_meta')) {
        db.createObjectStore('user_meta', { keyPath: 'key' });
      }

      // New stores for Workspace in v2
      if (!db.objectStoreNames.contains(FOLDERS_STORE)) {
        const folderStore = db.createObjectStore(FOLDERS_STORE, { keyPath: 'id' });
        folderStore.createIndex('parentId', 'parentId', { unique: false });
        folderStore.createIndex('order', 'order', { unique: false });
      }

      if (!db.objectStoreNames.contains(DOCUMENTS_STORE)) {
        const docStore = db.createObjectStore(DOCUMENTS_STORE, { keyPath: 'id' });
        docStore.createIndex('parentId', 'parentId', { unique: false });
        docStore.createIndex('order', 'order', { unique: false });
      }

      if (!db.objectStoreNames.contains(SNAPSHOTS_STORE)) {
        const snapStore = db.createObjectStore(SNAPSHOTS_STORE, { keyPath: 'id' });
        snapStore.createIndex('docId', 'docId', { unique: false });
        snapStore.createIndex('createdAt', 'createdAt', { unique: false });
      }

      if (!db.objectStoreNames.contains(WORKSPACE_META_STORE)) {
        db.createObjectStore(WORKSPACE_META_STORE, { keyPath: 'key' });
      }
    };

    request.onsuccess = () => {
      activeDb = request.result;
      activeDb.onversionchange = () => {
        closeWorkspaceDatabase();
      };
      resolve(activeDb);
    };
    request.onerror = () => reject(request.error);
  });
}

/**
 * Initializes the workspace on first run with samples and "Birinchi hujjatim".
 */
export async function initWorkspace(
  civilSampleMd: string,
  constSampleMd: string
): Promise<{ defaultDocId: string }> {
  const docs = await getAllDocuments();
  if (docs.length > 0) {
    const meta = await getWorkspaceMeta();
    const activeDocId = meta.lastActiveDocId && docs.some((d) => d.id === meta.lastActiveDocId)
      ? meta.lastActiveDocId
      : docs[0].id;
    return { defaultDocId: activeDocId };
  }

  const now = Date.now();

  // Create "Namunalar" folder
  const samplesFolder: FolderItem = {
    id: 'folder_samples',
    parentId: null,
    name: 'Namunalar',
    order: 0,
    createdAt: now,
    updatedAt: now
  };
  await saveFolder(samplesFolder);

  // Sample 1: Fuqarolik huquqi
  const civilDoc: DocumentItem = {
    id: 'doc_civil_sample',
    parentId: 'folder_samples',
    title: 'Fuqarolik huquqi',
    content: civilSampleMd,
    order: 0,
    theme: 'modern',
    createdAt: now,
    updatedAt: now
  };
  await saveDocument(civilDoc);

  // Sample 2: Konstitutsiyaviy huquq
  const constDoc: DocumentItem = {
    id: 'doc_const_sample',
    parentId: 'folder_samples',
    title: 'Konstitutsiyaviy huquq',
    content: constSampleMd,
    order: 1,
    theme: 'classic',
    createdAt: now + 1,
    updatedAt: now + 1
  };
  await saveDocument(constDoc);

  // First Doc: Birinchi hujjatim (at root)
  const firstDocContent = `# Birinchi hujjatim

## Kirish. MD+ formatiga xush kelibsiz!
norma: 1-qoida. Ishni boshlash
O'zingizning huquqiy konspektingizni yaratish uchun ushbu matnni tahrirlang yoki yangi mavzular qo'shing.

ta'rif: MD+ formati — oddiy matn orqali professional 9:16 o'quv kartochkalarini yaratish tizimi.

savol: So'z-belgilar qanday ishlaydi?
javob: Qator boshida norma:, ta'rif:, savol:, javob:, ogoh: kabi so'zlarni yozish kifoya.

ogoh: Barcha kiritilgan ma'lumotlar to'liq ushbu brauzeringizda xavfsiz saqlanadi.
`;

  const firstDoc: DocumentItem = {
    id: 'doc_first_doc',
    parentId: null,
    title: 'Birinchi hujjatim',
    content: firstDocContent,
    order: 1,
    theme: 'modern',
    createdAt: now + 2,
    updatedAt: now + 2
  };
  await saveDocument(firstDoc);

  // Save initial snapshots
  await saveSnapshot(firstDoc.id, firstDoc.content);

  // Save meta
  await saveWorkspaceMeta({
    lastActiveDocId: firstDoc.id,
    recentDocIds: [firstDoc.id, civilDoc.id, constDoc.id],
    lastBackupAt: now
  });

  return { defaultDocId: firstDoc.id };
}

// ===================== FOLDERS =====================

export async function getAllFolders(): Promise<FolderItem[]> {
  const db = await openWorkspaceDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(FOLDERS_STORE, 'readonly');
    const store = tx.objectStore(FOLDERS_STORE);
    const req = store.getAll();
    req.onsuccess = () => {
      const items = (req.result || []) as FolderItem[];
      items.sort((a, b) => a.order - b.order);
      resolve(items);
    };
    req.onerror = () => reject(req.error);
  });
}

export async function saveFolder(folder: FolderItem): Promise<void> {
  const db = await openWorkspaceDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(FOLDERS_STORE, 'readwrite');
    const store = tx.objectStore(FOLDERS_STORE);
    store.put(folder);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function deleteFolder(
  folderId: string
): Promise<{ deletedFolders: FolderItem[]; deletedDocs: DocumentItem[] }> {
  const allFolders = await getAllFolders();
  const allDocs = await getAllDocuments();

  // Find all descendant folders
  const toDeleteFolderIds = new Set<string>([folderId]);
  let added = true;
  while (added) {
    added = false;
    for (const f of allFolders) {
      if (f.parentId && toDeleteFolderIds.has(f.parentId) && !toDeleteFolderIds.has(f.id)) {
        toDeleteFolderIds.add(f.id);
        added = true;
      }
    }
  }

  const deletedFolders = allFolders.filter((f) => toDeleteFolderIds.has(f.id));
  const deletedDocs = allDocs.filter((d) => d.parentId && toDeleteFolderIds.has(d.parentId));

  const db = await openWorkspaceDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction([FOLDERS_STORE, DOCUMENTS_STORE], 'readwrite');
    const fStore = tx.objectStore(FOLDERS_STORE);
    const dStore = tx.objectStore(DOCUMENTS_STORE);

    for (const f of deletedFolders) {
      fStore.delete(f.id);
    }
    for (const d of deletedDocs) {
      dStore.delete(d.id);
    }

    tx.oncomplete = () => resolve({ deletedFolders, deletedDocs });
    tx.onerror = () => reject(tx.error);
  });
}

// ===================== DOCUMENTS =====================

export async function getAllDocuments(): Promise<DocumentItem[]> {
  const db = await openWorkspaceDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(DOCUMENTS_STORE, 'readonly');
    const store = tx.objectStore(DOCUMENTS_STORE);
    const req = store.getAll();
    req.onsuccess = () => {
      const items = (req.result || []) as DocumentItem[];
      items.sort((a, b) => a.order - b.order);
      resolve(items);
    };
    req.onerror = () => reject(req.error);
  });
}

export async function getDocument(id: string): Promise<DocumentItem | undefined> {
  const db = await openWorkspaceDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(DOCUMENTS_STORE, 'readonly');
    const store = tx.objectStore(DOCUMENTS_STORE);
    const req = store.get(id);
    req.onsuccess = () => resolve(req.result as DocumentItem | undefined);
    req.onerror = () => reject(req.error);
  });
}

export async function saveDocument(doc: DocumentItem): Promise<void> {
  const db = await openWorkspaceDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(DOCUMENTS_STORE, 'readwrite');
    const store = tx.objectStore(DOCUMENTS_STORE);
    store.put(doc);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function deleteDocument(id: string): Promise<DocumentItem | undefined> {
  const doc = await getDocument(id);
  if (!doc) return undefined;

  const db = await openWorkspaceDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(DOCUMENTS_STORE, 'readwrite');
    const store = tx.objectStore(DOCUMENTS_STORE);
    store.delete(id);
    tx.oncomplete = () => resolve(doc);
    tx.onerror = () => reject(tx.error);
  });
}

// ===================== SNAPSHOTS (~20 per doc) =====================

let lastSnapshotTimestamp = 0;

export async function saveSnapshot(
  docId: string,
  content: string,
  styles?: StyleAnnotation[]
): Promise<void> {
  const db = await openWorkspaceDatabase();
  const now = Math.max(Date.now(), lastSnapshotTimestamp + 1);
  lastSnapshotTimestamp = now;

  const snapshot: DocumentSnapshot = {
    id: `snap_${now}_${Math.random().toString(36).substring(2, 7)}`,
    docId,
    content,
    styles,
    createdAt: now
  };

  // Get existing snapshots for this docId
  const existing = await getSnapshots(docId);
  const toDelete = existing.length >= 20 ? existing.slice(19) : [];

  return new Promise((resolve, reject) => {
    const tx = db.transaction(SNAPSHOTS_STORE, 'readwrite');
    const store = tx.objectStore(SNAPSHOTS_STORE);
    store.put(snapshot);

    for (const oldSnap of toDelete) {
      store.delete(oldSnap.id);
    }

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getSnapshots(docId: string): Promise<DocumentSnapshot[]> {
  const db = await openWorkspaceDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(SNAPSHOTS_STORE, 'readonly');
    const store = tx.objectStore(SNAPSHOTS_STORE);
    const index = store.index('docId');
    const req = index.getAll(docId);

    req.onsuccess = () => {
      const items = (req.result || []) as DocumentSnapshot[];
      items.sort((a, b) => b.createdAt - a.createdAt); // newest first
      resolve(items);
    };
    req.onerror = () => reject(req.error);
  });
}

// ===================== WORKSPACE METADATA =====================

export async function getWorkspaceMeta(): Promise<WorkspaceMeta> {
  try {
    const db = await openWorkspaceDatabase();
    return new Promise((resolve) => {
      const tx = db.transaction(WORKSPACE_META_STORE, 'readonly');
      const store = tx.objectStore(WORKSPACE_META_STORE);
      const req = store.get('main_meta');
      req.onsuccess = () => {
        if (req.result && req.result.data) {
          resolve(req.result.data as WorkspaceMeta);
        } else {
          resolve({
            lastBackupAt: null,
            lastActiveDocId: null,
            recentDocIds: []
          });
        }
      };
      req.onerror = () => {
        resolve({
          lastBackupAt: null,
          lastActiveDocId: null,
          recentDocIds: []
        });
      };
    });
  } catch {
    return {
      lastBackupAt: null,
      lastActiveDocId: null,
      recentDocIds: []
    };
  }
}

export async function saveWorkspaceMeta(meta: Partial<WorkspaceMeta>): Promise<void> {
  const current = await getWorkspaceMeta();
  const updated: WorkspaceMeta = {
    ...current,
    ...meta
  };

  const db = await openWorkspaceDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(WORKSPACE_META_STORE, 'readwrite');
    const store = tx.objectStore(WORKSPACE_META_STORE);
    store.put({ key: 'main_meta', data: updated });
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/**
 * Requests persistent storage from the browser.
 */
export async function requestPersistentStorage(): Promise<boolean> {
  if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.persist) {
    try {
      return await navigator.storage.persist();
    } catch {
      return false;
    }
  }
  return false;
}
