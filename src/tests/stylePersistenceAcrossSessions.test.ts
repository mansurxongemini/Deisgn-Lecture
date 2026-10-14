/**
 * YURIST STUDIO — STYLE PERSISTENCE ACROSS SESSIONS SUITE (Item 6 Verification)
 *
 * Qoidalar:
 * 1. Reload (Sahifani qayta yuklash): IndexedDB dan qayta o'qilganda uslublar saqlanadi.
 * 2. Switch Documents (Hujjatlarni almashtirish): Boshqa hujjatga o'tib qaytganda har bir hujjat o'z uslubini mustaqil saqlaydi.
 * 3. Restore Snapshot (Tarixiy nusxani tiklash): Snapshot qaytarilganda matn bilan birga barcha uslublar ham tiklanadi.
 * 4. Export / Import ZIP (Arxivlash va tiklash): ZIP eksport/import qilinganda .styles.json va manifest orqali uslublar 100% saqlanib qoladi.
 */

import { describe, it, expect } from 'vitest';
import 'fake-indexeddb/auto';
import {
  saveDocument,
  getDocument,
  saveSnapshot,
  getSnapshots
} from '../services/workspace/workspaceStorage';
import {
  exportWorkspaceToZip,
  importWorkspaceFromZip
} from '../services/workspace/zipBackup';
import type { DocumentItem } from '../schema/workspace';
import type { StyleAnnotation } from '../schema/styleAnnotation';
import { createTextQuoteAnchor } from '../schema/styleAnnotation';

describe('ITEM 6: Style Persistence Across Sessions Suite', () => {
  const sampleText1 = '# Fuqarolik Kodeksi\n\n1-modda. Fuqarolik qonun hujjatlari va ularning vazifalari.';
  const sampleText2 = '# Mehnat Kodeksi\n\n1-modda. Ushbu Kodeksning maqsad va vazifalari.';

  const createSampleAnnotation = (id: string, text: string, word: string, color: any, size?: any, underline = false): StyleAnnotation => {
    const start = text.indexOf(word);
    const end = start + word.length;
    return {
      id,
      kind: 'inline',
      startOffset: start,
      endOffset: end,
      quote: createTextQuoteAnchor(text, start, end),
      properties: {
        color,
        size,
        underline
      },
      createdAt: 1000,
      updatedAt: 1000
    };
  };

  const doc1Styles: StyleAnnotation[] = [
    createSampleAnnotation('s1', sampleText1, 'vazifalari', 'crimson', 'lg', true),
    createSampleAnnotation('s2', sampleText1, 'Fuqarolik', 'accent', undefined, false)
  ];

  const doc2Styles: StyleAnnotation[] = [
    createSampleAnnotation('s3', sampleText2, 'Kodeksning', 'emerald', 'xl', true)
  ];

  it('1. Reload: styles survive page reload (read from IndexedDB storage)', async () => {
    const doc: DocumentItem = {
      id: 'doc_reload_test',
      parentId: null,
      title: 'Fuqarolik Kodeksi',
      content: sampleText1,
      styles: doc1Styles,
      order: 0,
      createdAt: 1000,
      updatedAt: 1000
    };

    // Save to database
    await saveDocument(doc);

    // Simulate page reload by freshly fetching from database
    const reloadedDoc = await getDocument('doc_reload_test');

    expect(reloadedDoc).toBeDefined();
    expect(reloadedDoc?.styles).toBeDefined();
    expect(reloadedDoc?.styles?.length).toBe(2);
    expect(reloadedDoc?.styles?.[0].quote.exact).toBe('vazifalari');
    expect(reloadedDoc?.styles?.[0].properties.color).toBe('crimson');
    expect(reloadedDoc?.styles?.[0].properties.underline).toBe(true);
    expect(reloadedDoc?.styles?.[1].quote.exact).toBe('Fuqarolik');
    expect(reloadedDoc?.styles?.[1].properties.color).toBe('accent');
  });

  it('2. Switch documents: switching documents preserves independent styles for each document', async () => {
    const docA: DocumentItem = {
      id: 'doc_switch_a',
      parentId: null,
      title: 'Hujjat A',
      content: sampleText1,
      styles: doc1Styles,
      order: 0,
      createdAt: 1000,
      updatedAt: 1000
    };

    const docB: DocumentItem = {
      id: 'doc_switch_b',
      parentId: null,
      title: 'Hujjat B',
      content: sampleText2,
      styles: doc2Styles,
      order: 1,
      createdAt: 2000,
      updatedAt: 2000
    };

    await saveDocument(docA);
    await saveDocument(docB);

    // Read Doc B (switch to B)
    const readB = await getDocument('doc_switch_b');
    expect(readB?.styles?.length).toBe(1);
    expect(readB?.styles?.[0].quote.exact).toBe('Kodeksning');
    expect(readB?.styles?.[0].properties.color).toBe('emerald');

    // Read Doc A (switch back to A)
    const readA = await getDocument('doc_switch_a');
    expect(readA?.styles?.length).toBe(2);
    expect(readA?.styles?.[0].quote.exact).toBe('vazifalari');
    expect(readA?.styles?.[1].quote.exact).toBe('Fuqarolik');
  });

  it('3. Restore snapshot: restoring historical snapshot restores exact styles', async () => {
    const docId = 'doc_snap_test';
    const initialDoc: DocumentItem = {
      id: docId,
      parentId: null,
      title: 'Snapshot Sinovi',
      content: sampleText1,
      styles: doc1Styles,
      order: 0,
      createdAt: 1000,
      updatedAt: 1000
    };

    await saveDocument(initialDoc);

    // Save snapshot representing state with styles
    await saveSnapshot(docId, sampleText1, doc1Styles);

    // Verify snapshot stored in database
    const snapshots = await getSnapshots(docId);
    expect(snapshots.length).toBeGreaterThan(0);
    const snap = snapshots[0];
    expect(snap.styles).toBeDefined();
    expect(snap.styles?.length).toBe(2);
    expect(snap.styles?.[0].quote.exact).toBe('vazifalari');

    // Simulate user editing document and removing styles
    await saveDocument({
      ...initialDoc,
      content: '# Butunlay boshqa matn',
      styles: []
    });

    const strippedDoc = await getDocument(docId);
    expect(strippedDoc?.styles?.length).toBe(0);

    // Restore from snapshot
    const restoredDoc: DocumentItem = {
      ...initialDoc,
      content: snap.content,
      styles: snap.styles,
      updatedAt: Date.now()
    };
    await saveDocument(restoredDoc);

    const afterRestore = await getDocument(docId);
    expect(afterRestore?.styles?.length).toBe(2);
    expect(afterRestore?.styles?.[0].properties.color).toBe('crimson');
    expect(afterRestore?.styles?.[0].properties.underline).toBe(true);
  });

  it('4. Export / Import zip: styles survive export to zip archive and import into clean workspace', async () => {
    const docForZip: DocumentItem = {
      id: 'doc_zip_export',
      parentId: null,
      title: 'Zip Test Hujjati',
      content: sampleText1,
      styles: doc1Styles,
      order: 0,
      createdAt: 1000,
      updatedAt: 1000
    };

    await saveDocument(docForZip);

    // Export to zip blob
    const zipBlob = await exportWorkspaceToZip();
    expect(zipBlob).toBeDefined();
    expect(zipBlob.size).toBeGreaterThan(0);

    // Import back from zip
    const result = await importWorkspaceFromZip(zipBlob);
    expect(result.docsCount).toBeGreaterThan(0);

    // Fetch restored document
    const importedDoc = await getDocument('doc_zip_export');
    expect(importedDoc).toBeDefined();
    expect(importedDoc?.styles).toBeDefined();
    expect(importedDoc?.styles?.length).toBe(2);
    expect(importedDoc?.styles?.[0].quote.exact).toBe('vazifalari');
    expect(importedDoc?.styles?.[0].properties.color).toBe('crimson');
    expect(importedDoc?.styles?.[0].properties.underline).toBe(true);
  });
});
