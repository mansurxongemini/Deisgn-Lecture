import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach } from 'vitest';
import type { FolderItem, DocumentItem } from '../schema/workspace';
import {
  canMoveFolder,
  getDescendantFolderIds,
  getBreadcrumbPath,
  sanitizeFileName
} from '../services/workspace/treeOps';
import {
  openWorkspaceDatabase as _openWorkspaceDatabase,
  closeWorkspaceDatabase,
  initWorkspace,
  getAllFolders,
  saveFolder,
  deleteFolder,
  getAllDocuments,
  getDocument,
  saveDocument,
  deleteDocument,
  saveSnapshot,
  getSnapshots,
  getWorkspaceMeta,
  saveWorkspaceMeta as _saveWorkspaceMeta,
  DB_NAME
} from '../services/workspace/workspaceStorage';
import { exportWorkspaceToZip, importWorkspaceFromZip } from '../services/workspace/zipBackup';
import { saveCardProgress, getCardProgress } from '../services/storage';

describe('Phase W-B: Workspace Data Layer & Tree Operations', () => {
  beforeEach(async () => {
    closeWorkspaceDatabase();
    await new Promise((res) => {
      const req = indexedDB.deleteDatabase(DB_NAME);
      req.onsuccess = () => res(undefined);
      req.onerror = () => res(undefined);
      req.onblocked = () => res(undefined);
    });
  });

  describe('1. Tree Operations & Circular Descent Prevention', () => {
    const folders: FolderItem[] = [
      { id: 'f1', parentId: null, name: 'Root Folder 1', order: 0, createdAt: 1, updatedAt: 1 },
      { id: 'f2', parentId: 'f1', name: 'Sub Folder 1.1', order: 0, createdAt: 1, updatedAt: 1 },
      { id: 'f3', parentId: 'f2', name: 'Sub-Sub Folder 1.1.1', order: 0, createdAt: 1, updatedAt: 1 },
      { id: 'f4', parentId: null, name: 'Root Folder 2', order: 1, createdAt: 1, updatedAt: 1 }
    ];

    it('allows moving folder to root (parentId = null)', () => {
      expect(canMoveFolder('f2', null, folders)).toBe(true);
    });

    it('allows moving folder to an independent sibling folder', () => {
      expect(canMoveFolder('f1', 'f4', folders)).toBe(true);
      expect(canMoveFolder('f2', 'f4', folders)).toBe(true);
    });

    it('strictly PREVENTS moving a folder into ITSELF', () => {
      expect(canMoveFolder('f1', 'f1', folders)).toBe(false);
      expect(canMoveFolder('f2', 'f2', folders)).toBe(false);
      expect(canMoveFolder('f4', 'f4', folders)).toBe(false);
    });

    it('strictly PREVENTS moving a folder into its direct child subfolder', () => {
      expect(canMoveFolder('f1', 'f2', folders)).toBe(false);
    });

    it('strictly PREVENTS moving a folder into its deeply nested descendant subfolder', () => {
      // f1 -> f2 -> f3. Moving f1 into f3 would create an infinite orphan cycle
      expect(canMoveFolder('f1', 'f3', folders)).toBe(false);
      expect(canMoveFolder('f2', 'f3', folders)).toBe(false);
    });

    it('correctly retrieves all descendant folder IDs', () => {
      const descendants = getDescendantFolderIds('f1', folders);
      expect(descendants).toEqual(['f2', 'f3']);
    });

    it('correctly builds breadcrumb paths for documents and folders', () => {
      const docs: DocumentItem[] = [
        {
          id: 'd1',
          parentId: 'f3',
          title: 'Kazus 1',
          content: '',
          order: 0,
          createdAt: 1,
          updatedAt: 1
        }
      ];

      const crumbs = getBreadcrumbPath('d1', true, folders, docs);
      expect(crumbs.map((c) => c.name)).toEqual([
        'Root Folder 1',
        'Sub Folder 1.1',
        'Sub-Sub Folder 1.1.1',
        'Kazus 1'
      ]);
    });

    it('sanitizes illegal filename characters', () => {
      expect(sanitizeFileName('1-Mavzu: Majburiyatlar / Fuqarolik?')).toBe(
        '1-Mavzu_ Majburiyatlar _ Fuqarolik_'
      );
    });
  });

  describe('2. Persistence Round-Trip (IndexedDB)', () => {
    it('initializes workspace with Namunalar and Birinchi hujjatim', async () => {
      const { defaultDocId } = await initWorkspace('# Civil Law Sample', '# Const Law Sample');
      expect(defaultDocId).toBeDefined();

      const folders = await getAllFolders();
      expect(folders.some((f) => f.name === 'Namunalar')).toBe(true);

      const docs = await getAllDocuments();
      expect(docs.length).toBe(3); // Civil, Const, Birinchi hujjatim
      expect(docs.some((d) => d.title === 'Birinchi hujjatim')).toBe(true);
      expect(docs.some((d) => d.title === 'Fuqarolik huquqi')).toBe(true);
    });

    it('creates, reads, updates, and deletes documents', async () => {
      const newDoc: DocumentItem = {
        id: 'doc_custom_1',
        parentId: null,
        title: 'Shartnomalar huquqi',
        content: 'norma: 353-modda. Shartnoma tushunchasi',
        order: 0,
        theme: 'modern',
        createdAt: Date.now(),
        updatedAt: Date.now()
      };

      await saveDocument(newDoc);
      const fetched = await getDocument('doc_custom_1');
      expect(fetched?.title).toBe('Shartnomalar huquqi');
      expect(fetched?.content).toContain('353-modda');

      // Update
      const updatedDoc = { ...fetched!, content: 'yangilangan matn' };
      await saveDocument(updatedDoc);
      const refetched = await getDocument('doc_custom_1');
      expect(refetched?.content).toBe('yangilangan matn');

      // Delete
      await deleteDocument('doc_custom_1');
      const deleted = await getDocument('doc_custom_1');
      expect(deleted).toBeUndefined();
    });

    it('deletes folder and cascades to all nested documents and child subfolders', async () => {
      const parentFolder: FolderItem = {
        id: 'pf_1',
        parentId: null,
        name: 'Parent',
        order: 0,
        createdAt: 1,
        updatedAt: 1
      };
      const childFolder: FolderItem = {
        id: 'cf_1',
        parentId: 'pf_1',
        name: 'Child',
        order: 0,
        createdAt: 1,
        updatedAt: 1
      };
      await saveFolder(parentFolder);
      await saveFolder(childFolder);

      const docInChild: DocumentItem = {
        id: 'doc_nested_1',
        parentId: 'cf_1',
        title: 'Nested Doc',
        content: '# Test',
        order: 0,
        createdAt: 1,
        updatedAt: 1
      };
      await saveDocument(docInChild);

      // Delete parent folder
      const result = await deleteFolder('pf_1');
      expect(result.deletedFolders.length).toBe(2);
      expect(result.deletedDocs.length).toBe(1);

      const remainingDocs = await getAllDocuments();
      expect(remainingDocs.some((d) => d.id === 'doc_nested_1')).toBe(false);
    });
  });

  describe('3. Snapshot Management (~20 per doc)', () => {
    it('saves snapshots and prunes to keep at most 20 recent snapshots', async () => {
      const docId = 'doc_test_snaps';

      // Save 25 snapshots
      for (let i = 1; i <= 25; i++) {
        await saveSnapshot(docId, `Tahrir versiyasi ${i}`);
      }

      const snaps = await getSnapshots(docId);
      expect(snaps.length).toBe(20);
      // Newest should be version 25
      expect(snaps[0].content).toBe('Tahrir versiyasi 25');
    });
  });

  describe('4. ZIP Export & Import Round-Trip', () => {
    it('exports whole workspace to zip and imports back with 1:1 fidelity', async () => {
      // 1. Setup workspace with hierarchy
      const f1: FolderItem = {
        id: 'f_lectures',
        parentId: null,
        name: "Ma'ruzalar",
        order: 0,
        createdAt: 100,
        updatedAt: 100
      };
      const f2: FolderItem = {
        id: 'f_sem1',
        parentId: 'f_lectures',
        name: '1-Semestr',
        order: 0,
        createdAt: 101,
        updatedAt: 101
      };
      await saveFolder(f1);
      await saveFolder(f2);

      const d1: DocumentItem = {
        id: 'doc_majburiyat',
        parentId: 'f_sem1',
        title: 'Majburiyat Huquqi',
        content: '# Majburiyat Huquqi\nnorma: 234-modda',
        order: 0,
        theme: 'modern',
        createdAt: 102,
        updatedAt: 102
      };
      const d2: DocumentItem = {
        id: 'doc_root_note',
        parentId: null,
        title: 'Qisqa eslatma',
        content: '# Eslatma matni',
        order: 1,
        theme: 'classic',
        createdAt: 103,
        updatedAt: 103
      };
      await saveDocument(d1);
      await saveDocument(d2);

      // 2. Export to ZIP
      const zipBlob = await exportWorkspaceToZip();
      expect(zipBlob.size).toBeGreaterThan(0);

      // 3. Clear database to simulate fresh environment
      closeWorkspaceDatabase();
      await new Promise((res) => {
        const req = indexedDB.deleteDatabase(DB_NAME);
        req.onsuccess = () => res(undefined);
        req.onerror = () => res(undefined);
        req.onblocked = () => res(undefined);
      });

      // 4. Import ZIP back into fresh database
      const importResult = await importWorkspaceFromZip(zipBlob);
      expect(importResult.foldersCount).toBe(2);
      expect(importResult.docsCount).toBe(2);

      // 5. Verify restored data matches 1:1
      const restoredFolders = await getAllFolders();
      expect(restoredFolders.length).toBe(2);
      expect(restoredFolders.some((f) => f.name === "Ma'ruzalar")).toBe(true);
      expect(restoredFolders.some((f) => f.name === '1-Semestr')).toBe(true);

      const restoredDocs = await getAllDocuments();
      expect(restoredDocs.length).toBe(2);

      const restoredD1 = restoredDocs.find((d) => d.title === 'Majburiyat Huquqi');
      expect(restoredD1).toBeDefined();
      expect(restoredD1?.content).toBe('# Majburiyat Huquqi\nnorma: 234-modda');
      expect(restoredD1?.theme).toBe('modern');

      const restoredD2 = restoredDocs.find((d) => d.title === 'Qisqa eslatma');
      expect(restoredD2).toBeDefined();
      expect(restoredD2?.content).toBe('# Eslatma matni');
      expect(restoredD2?.theme).toBe('classic');

      const meta = await getWorkspaceMeta();
      expect(meta.lastBackupAt).toBeDefined();
    });
  });

  describe('5. SM-2 Review History Independence', () => {
    it('editing or deleting workspace documents never touches card_progress store', async () => {
      // 1. Record SM-2 progress for a card
      await saveCardProgress({
        cardId: 'card_norm_234',
        repetitions: 4,
        interval: 12,
        easeFactor: 2.6,
        dueDate: '2026-10-15',
        lastReviewed: '2026-10-02',
        history: []
      });

      // 2. Perform extensive workspace document operations
      const doc: DocumentItem = {
        id: 'doc_to_delete',
        parentId: null,
        title: 'Temp Doc',
        content: 'matn',
        order: 0,
        createdAt: 1,
        updatedAt: 1
      };
      await saveDocument(doc);
      await saveDocument({ ...doc, content: 'butkul yangi matn' });
      await deleteDocument('doc_to_delete');

      // 3. Verify SM-2 progress is completely intact
      const progress = await getCardProgress('card_norm_234');
      expect(progress).toBeDefined();
      expect(progress?.cardId).toBe('card_norm_234');
      expect(progress?.repetitions).toBe(4);
      expect(progress?.interval).toBe(12);
      expect(progress?.easeFactor).toBe(2.6);
    });
  });

  describe('6. Phase W-E: Backup Lifecycle & ZIP Rehydration', () => {
    it('restores deeply nested folder structures and documents accurately from ZIP', async () => {
      // 1. Create a 3-level folder hierarchy
      const fLevel1: FolderItem = {
        id: 'f_lev1',
        parentId: null,
        name: 'Daraja 1',
        order: 0,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
      const fLevel2: FolderItem = {
        id: 'f_lev2',
        parentId: 'f_lev1',
        name: 'Daraja 2',
        order: 0,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
      const fLevel3: FolderItem = {
        id: 'f_lev3',
        parentId: 'f_lev2',
        name: 'Daraja 3',
        order: 0,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
      await saveFolder(fLevel1);
      await saveFolder(fLevel2);
      await saveFolder(fLevel3);

      const deepDoc: DocumentItem = {
        id: 'doc_deep',
        parentId: 'f_lev3',
        title: 'Chuqur Hujjat',
        content: '# Chuqur darajadagi hujjat matni\nsavol: 3-daraja ishlayaptimi?\njavob: Ha, to‘liq.',
        order: 0,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        theme: 'minimal'
      };
      await saveDocument(deepDoc);

      // 2. Export ZIP
      const zipBlob = await exportWorkspaceToZip();

      // 3. Reset DB
      closeWorkspaceDatabase();
      await new Promise((res) => {
        const req = indexedDB.deleteDatabase(DB_NAME);
        req.onsuccess = () => res(undefined);
      });

      // 4. Import ZIP back
      const res = await importWorkspaceFromZip(zipBlob);
      expect(res.foldersCount).toBe(3);
      expect(res.docsCount).toBe(1);

      // 5. Verify restored hierarchy
      const restoredFolders = await getAllFolders();
      expect(restoredFolders.length).toBe(3);
      const lev3 = restoredFolders.find((f) => f.id === 'f_lev3');
      expect(lev3?.parentId).toBe('f_lev2');

      const restoredDocs = await getAllDocuments();
      expect(restoredDocs.length).toBe(1);
      expect(restoredDocs[0].title).toBe('Chuqur Hujjat');
      expect(restoredDocs[0].content).toContain('Chuqur darajadagi hujjat matni');
      expect(restoredDocs[0].theme).toBe('minimal');
    });

    it('correctly calculates backup warning when lastBackupAt is older than 7 days or null', () => {
      const isWarning = (lastBackupAt: number | null) => {
        if (!lastBackupAt) return true;
        return (Date.now() - lastBackupAt) > 7 * 24 * 3600 * 1000;
      };

      expect(isWarning(null)).toBe(true);
      expect(isWarning(Date.now())).toBe(false);
      expect(isWarning(Date.now() - 2 * 24 * 3600 * 1000)).toBe(false);
      expect(isWarning(Date.now() - 8 * 24 * 3600 * 1000)).toBe(true);
    });
  });
});

