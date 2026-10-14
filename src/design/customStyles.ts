/**
 * YURIST STUDIO — SAVED CUSTOM STYLES (Foydalanuvchi Maxsus Uslublari)
 *
 * Foydalanuvchilar o‘zlarining shaxsiy dizaynlarini nomlab saqlash,
 * tahrirlash, o‘chirish, qayta yuklashda saqlab qolish hamda
 * JSON formatida eksport/import qilish imkoniyati.
 */

import { openWorkspaceDatabase } from '../services/workspace/workspaceStorage';
import { DESIGN_TOKENS } from './tokens';
import { getTokenValue, setToken } from './applyTokens';

export const USER_META_STORE = 'user_meta';
export const CUSTOM_STYLES_STORAGE_KEY = 'yurist_custom_styles';

export interface CustomStyle {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  tokens: Record<string, string>;
  basePresets?: {
    colorPresetId?: string;
    typoPresetId?: string;
    densityPresetId?: string;
    coverPresetId?: string;
  };
}

export interface ExportedStyleFile {
  format: 'yurist-studio-style';
  version: '1.0';
  exportedAt: number;
  style: CustomStyle;
}

// Xotiradagi faol ro'yxat
let cachedStyles: CustomStyle[] = [];
let isInitialized = false;

/**
 * Hozirgi barcha tokenlar holatini (snapshot) to'liq yozib olish
 */
export function captureCurrentTokens(): Record<string, string> {
  const result: Record<string, string> = {};
  for (const token of DESIGN_TOKENS) {
    const val = getTokenValue(token.id);
    if (val !== undefined) {
      result[token.id] = val;
    }
  }
  return result;
}

/**
 * IndexedDB omboriga saqlangan uslublar ro'yxatini yozish
 */
async function persistStylesToDb(styles: CustomStyle[]): Promise<void> {
  try {
    const db = await openWorkspaceDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(USER_META_STORE, 'readwrite');
      const store = tx.objectStore(USER_META_STORE);
      store.put({
        key: CUSTOM_STYLES_STORAGE_KEY,
        value: styles,
        updatedAt: Date.now()
      });
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('[CustomStyles] IndexedDB saqlashda xatolik:', err);
  }
}

/**
 * IndexedDB'dan saqlangan uslublarni yuklab olish
 */
export async function loadCustomStyles(): Promise<CustomStyle[]> {
  try {
    const db = await openWorkspaceDatabase();
    return new Promise((resolve) => {
      const tx = db.transaction(USER_META_STORE, 'readonly');
      const store = tx.objectStore(USER_META_STORE);
      const req = store.get(CUSTOM_STYLES_STORAGE_KEY);
      req.onsuccess = () => {
        if (req.result && Array.isArray(req.result.value)) {
          cachedStyles = req.result.value;
        } else {
          cachedStyles = [];
        }
        resolve([...cachedStyles]);
      };
      req.onerror = () => {
        cachedStyles = [];
        resolve([]);
      };
    });
  } catch {
    cachedStyles = [];
    return [];
  }
}

/**
 * Xotiradagi barcha shaxsiy uslublar ro'yxatini olish
 */
export function getCustomStyles(): CustomStyle[] {
  return [...cachedStyles];
}

/**
 * Muayyan identifikator bo'yicha uslubni topish
 */
export function getCustomStyleById(id: string): CustomStyle | undefined {
  return cachedStyles.find((s) => s.id === id);
}

/**
 * Yangi shaxsiy uslubni saqlash
 */
export async function saveCustomStyle(
  name: string,
  tokensOverride?: Record<string, string>,
  basePresets?: CustomStyle['basePresets']
): Promise<CustomStyle> {
  const trimmedName = name.trim() || 'Yangi maxsus uslub';
  const tokens = tokensOverride || captureCurrentTokens();
  const now = Date.now();

  const newStyle: CustomStyle = {
    id: `custom_style_${now}_${Math.random().toString(36).substring(2, 7)}`,
    name: trimmedName,
    createdAt: now,
    updatedAt: now,
    tokens,
    basePresets
  };

  // Agar xuddi shu nomdagi uslub mavjud bo'lsa, yangilash yoki alohida qo'shish
  cachedStyles = [newStyle, ...cachedStyles.filter((s) => s.id !== newStyle.id)];
  await persistStylesToDb(cachedStyles);

  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('yurist:custom-styles-changed', {
        detail: { styles: cachedStyles, added: newStyle }
      })
    );
  }

  return newStyle;
}

/**
 * Saqlangan uslub nomini qayta nomlash
 */
export async function renameCustomStyle(id: string, newName: string): Promise<CustomStyle | null> {
  const trimmed = newName.trim();
  if (!trimmed) return null;

  const target = cachedStyles.find((s) => s.id === id);
  if (!target) return null;

  target.name = trimmed;
  target.updatedAt = Date.now();

  await persistStylesToDb(cachedStyles);

  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('yurist:custom-styles-changed', {
        detail: { styles: cachedStyles, updated: target }
      })
    );
  }

  return target;
}

/**
 * Saqlangan uslubni o'chirish
 */
export async function deleteCustomStyle(id: string): Promise<boolean> {
  const initialLen = cachedStyles.length;
  cachedStyles = cachedStyles.filter((s) => s.id !== id);

  if (cachedStyles.length === initialLen) {
    return false;
  }

  await persistStylesToDb(cachedStyles);

  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('yurist:custom-styles-changed', {
        detail: { styles: cachedStyles, deletedId: id }
      })
    );
  }

  return true;
}

/**
 * Shaxsiy uslubni jonli tatbiq etish (apply)
 */
export async function applyCustomStyle(style: CustomStyle): Promise<void> {
  if (!style || !style.tokens) return;

  for (const [tokenId, value] of Object.entries(style.tokens)) {
    await setToken(tokenId, value);
  }

  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('yurist:custom-style-applied', {
        detail: { style }
      })
    );
  }
}

/**
 * Uslubni kichik JSON fayl sifatida yuklab olish (Export)
 */
export function exportStyleAsJson(style: CustomStyle): void {
  const exportPayload: ExportedStyleFile = {
    format: 'yurist-studio-style',
    version: '1.0',
    exportedAt: Date.now(),
    style
  };

  const jsonStr = JSON.stringify(exportPayload, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const safeFilename =
    style.name
      .toLowerCase()
      .replace(/[^a-z0-9а-яёўқғҳ]+/gi, '-')
      .replace(/^-|-$/g, '') || 'yurist-uslub';

  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `${safeFilename}.yurist-style.json`;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

/**
 * JSON fayldan uslubni import qilish
 */
export async function importStyleFromJson(jsonContent: string): Promise<CustomStyle> {
  let parsed: any;
  try {
    parsed = JSON.parse(jsonContent);
  } catch {
    throw new Error("JSON fayl formati noto'g'ri!");
  }

  let styleData: Partial<CustomStyle>;
  if (parsed.format === 'yurist-studio-style' && parsed.style) {
    styleData = parsed.style;
  } else if (parsed.tokens && typeof parsed.tokens === 'object') {
    styleData = parsed;
  } else {
    throw new Error("Yaroqsiz uslub fayli: 'tokens' obyekti topilmadi.");
  }

  const name = (styleData.name || 'Import qilingan uslub').trim();
  const now = Date.now();

  const importedStyle: CustomStyle = {
    id: `custom_style_${now}_${Math.random().toString(36).substring(2, 7)}`,
    name: `${name} (Import)`,
    createdAt: now,
    updatedAt: now,
    tokens: styleData.tokens || {},
    basePresets: styleData.basePresets
  };

  cachedStyles = [importedStyle, ...cachedStyles];
  await persistStylesToDb(cachedStyles);

  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('yurist:custom-styles-changed', {
        detail: { styles: cachedStyles, added: importedStyle }
      })
    );
  }

  return importedStyle;
}

/**
 * Tizim yuklanganda custom styles servisini ishga tushirish
 */
export async function initCustomStyles(): Promise<void> {
  if (isInitialized) return;
  isInitialized = true;

  await loadCustomStyles();

  if (typeof window !== 'undefined') {
    const win = window as any;
    win.customStyles = {
      loadCustomStyles,
      getCustomStyles,
      getCustomStyleById,
      saveCustomStyle,
      renameCustomStyle,
      deleteCustomStyle,
      applyCustomStyle,
      exportStyleAsJson,
      importStyleFromJson,
      captureCurrentTokens
    };
  }
}
