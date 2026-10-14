import type { CardProgress } from './sm2';
import { openWorkspaceDatabase, PROGRESS_STORE } from './workspace/workspaceStorage';

const META_STORE = 'user_meta';

function openDatabase(): Promise<IDBDatabase> {
  return openWorkspaceDatabase();
}

export async function getCardProgress(cardId: string): Promise<CardProgress | undefined> {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(PROGRESS_STORE, 'readonly');
      const store = tx.objectStore(PROGRESS_STORE);
      const req = store.get(cardId);
      req.onsuccess = () => resolve(req.result as CardProgress | undefined);
      req.onerror = () => reject(req.error);
    });
  } catch {
    return undefined;
  }
}

export async function getAllCardProgress(): Promise<Record<string, CardProgress>> {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(PROGRESS_STORE, 'readonly');
      const store = tx.objectStore(PROGRESS_STORE);
      const req = store.getAll();
      req.onsuccess = () => {
        const result: Record<string, CardProgress> = {};
        const items = (req.result || []) as CardProgress[];
        items.forEach((p) => {
          result[p.cardId] = p;
        });
        resolve(result);
      };
      req.onerror = () => reject(req.error);
    });
  } catch {
    return {};
  }
}

export async function saveCardProgress(progress: CardProgress): Promise<void> {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(PROGRESS_STORE, 'readwrite');
      const store = tx.objectStore(PROGRESS_STORE);
      store.put(progress);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('Progress saqlashda xatolik:', err);
  }
}

export async function exportProgressToJson(): Promise<string> {
  const all = await getAllCardProgress();
  const exportPayload = {
    exportedAt: new Date().toISOString(),
    version: '1.0',
    type: 'yurist_studio_progress',
    cards: Object.values(all)
  };
  return JSON.stringify(exportPayload, null, 2);
}

export async function importProgressFromJson(jsonText: string): Promise<{ importedCount: number }> {
  const data = JSON.parse(jsonText);
  if (!data || !Array.isArray(data.cards)) {
    throw new Error('Fayl formati yaroqsiz: "cards" ro‘yxati topilmadi.');
  }

  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(PROGRESS_STORE, 'readwrite');
    const store = tx.objectStore(PROGRESS_STORE);
    let count = 0;

    data.cards.forEach((card: CardProgress) => {
      if (card && card.cardId) {
        store.put(card);
        count++;
      }
    });

    tx.oncomplete = () => resolve({ importedCount: count });
    tx.onerror = () => reject(tx.error);
  });
}

export async function saveLastDocument(docJson: string): Promise<void> {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(META_STORE, 'readwrite');
      const store = tx.objectStore(META_STORE);
      store.put({ key: 'last_document', value: docJson, updatedAt: new Date().toISOString() });
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    // Ignored in SSR or test
  }
}

export async function getLastDocument(): Promise<string | null> {
  try {
    const db = await openDatabase();
    return new Promise((resolve) => {
      const tx = db.transaction(META_STORE, 'readonly');
      const store = tx.objectStore(META_STORE);
      const req = store.get('last_document');
      req.onsuccess = () => resolve(req.result ? req.result.value : null);
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}
