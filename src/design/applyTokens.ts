/**
 * YURIST STUDIO — RUNTIME DESIGN TOKEN ENGINE
 *
 * Tokenlarni jonli ravishda yangilash, IndexedDB'ga saqlash, yuklash
 * va sukut bo‘yicha holatga qaytarish mexanizmlari.
 */

import {
  DESIGN_TOKENS,
  TOKEN_BY_ID,
  TOKEN_BY_CSS_VAR,
  injectDefaultTokenStyles,
  type DesignToken
} from './tokens';
import { openWorkspaceDatabase } from '../services/workspace/workspaceStorage';

const USER_META_STORE = 'user_meta';
const OVERRIDES_STORAGE_KEY = 'yurist_design_token_overrides';
const OVERRIDES_STYLE_ID = 'yurist-studio-token-overrides';

// Xotiradagi faol o‘zgarishlar (id -> value)
const activeOverrides: Record<string, string> = {};

let isInitialized = false;

/**
 * IndexedDB'dan saqlangan token o‘zgartirishlarini o‘qish
 */
async function loadOverridesFromDb(): Promise<Record<string, string>> {
  try {
    const db = await openWorkspaceDatabase();
    return new Promise((resolve) => {
      const tx = db.transaction(USER_META_STORE, 'readonly');
      const store = tx.objectStore(USER_META_STORE);
      const req = store.get(OVERRIDES_STORAGE_KEY);
      req.onsuccess = () => {
        if (req.result && typeof req.result.value === 'object') {
          resolve(req.result.value as Record<string, string>);
        } else {
          resolve({});
        }
      };
      req.onerror = () => resolve({});
    });
  } catch {
    // Agar IndexedDB mavjud bo'lmasa (masalan SSR yoki testda)
    return {};
  }
}

/**
 * Token o‘zgartirishlarini IndexedDB'ga saqlash
 */
async function saveOverridesToDb(overrides: Record<string, string>): Promise<void> {
  try {
    const db = await openWorkspaceDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(USER_META_STORE, 'readwrite');
      const store = tx.objectStore(USER_META_STORE);
      store.put({
        key: OVERRIDES_STORAGE_KEY,
        value: overrides,
        updatedAt: new Date().toISOString()
      });
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('Tokenlarni saqlashda xatolik:', err);
  }
}

/**
 * Dinamik `<style id="yurist-studio-token-overrides">` elementini yangilash.
 * Bu orqali scoped mavzular va yangi yaratilgan kartochkalar darhol yangi qiymatni oladi.
 */
function updateOverridesStylesheet(): void {
  if (typeof document === 'undefined') return;

  let styleEl = document.getElementById(OVERRIDES_STYLE_ID) as HTMLStyleElement | null;
  if (!styleEl) {
    styleEl = document.createElement('style');
    styleEl.id = OVERRIDES_STYLE_ID;
    document.head.appendChild(styleEl);
  }

  const uiRules: string[] = [];
  const docRules: string[] = [];

  for (const [id, value] of Object.entries(activeOverrides)) {
    const token = TOKEN_BY_ID.get(id);
    if (!token) continue;

    if (token.scope === 'ui') {
      uiRules.push(`  ${token.cssVar}: ${value} !important;`);
    } else {
      docRules.push(`  ${token.cssVar}: ${value} !important;`);
    }
  }

  let cssText = '';
  if (uiRules.length > 0) {
    cssText += `:root, [data-ui-theme] {\n${uiRules.join('\n')}\n}\n`;
  }
  if (docRules.length > 0) {
    cssText += `[data-document-theme], .study-card-9-16, .print-study-card {\n${docRules.join('\n')}\n}\n`;
  }

  styleEl.textContent = cssText;
}

/**
 * Tokenni jonli ravishda yangilash (Runtime CSS Update)
 * @param idOrCssVar Token identifikatori (masalan: 'ui_bg') yoki CSS o'zgaruvchi nomi ('--bg')
 * @param value Yangi qiymat (masalan: '#FF0000' yoki '48px')
 */
export async function setToken(idOrCssVar: string, value: string): Promise<void> {
  const token = TOKEN_BY_ID.get(idOrCssVar) || TOKEN_BY_CSS_VAR.get(idOrCssVar);
  if (!token) {
    console.warn(`[TokenEngine] Noma’lum token: "${idOrCssVar}"`);
    return;
  }

  // 1. Xotirada saqlash
  activeOverrides[token.id] = value;

  // 2. Jonli DOM va CSS o‘zgaruvchilarini yangilash
  if (typeof document !== 'undefined') {
    document.documentElement.style.setProperty(token.cssVar, value);

    if (token.id === 'doc_font_heading') {
      document.documentElement.style.setProperty('--font-heading', value);
    }
    if (token.id === 'doc_font_body') {
      document.documentElement.style.setProperty('--font-body', value);
    }
    if (token.id === 'ui_density') {
      document.documentElement.dataset.uiDensity = value;
    }
    if (token.id === 'ui_font_size') {
      document.documentElement.dataset.uiFontSize = value;
    }
    if (token.id === 'doc_cover_layout') {
      const coverCards = document.querySelectorAll<HTMLElement>('.study-card-9-16.card-cover');
      coverCards.forEach((card) => {
        card.dataset.coverLayout = value;
      });
      document.documentElement.dataset.coverLayout = value;
    }

    if (token.scope === 'doc') {
      const docCards = document.querySelectorAll<HTMLElement>('.study-card-9-16, [data-document-theme]');
      docCards.forEach((card) => {
        card.style.setProperty(token.cssVar, value);
        if (token.id === 'doc_font_heading') {
          card.style.setProperty('--font-heading', value);
        }
        if (token.id === 'doc_font_body') {
          card.style.setProperty('--font-body', value);
        }
      });
    }

    updateOverridesStylesheet();

    // Maxsus hodisa yuborish
    window.dispatchEvent(
      new CustomEvent('yurist:token-changed', {
        detail: { id: token.id, cssVar: token.cssVar, value, scope: token.scope }
      })
    );
  }

  // 3. IndexedDB omboriga fiksatsiya qilish
  await saveOverridesToDb(activeOverrides);
}

/**
 * Muayyan tokenni sukut bo‘yicha qiymatiga qaytarish (Reset Token)
 */
export async function resetToken(idOrCssVar: string): Promise<void> {
  const token = TOKEN_BY_ID.get(idOrCssVar) || TOKEN_BY_CSS_VAR.get(idOrCssVar);
  if (!token) return;

  delete activeOverrides[token.id];

  if (typeof document !== 'undefined') {
    document.documentElement.style.removeProperty(token.cssVar);
    if (token.id === 'doc_font_heading') {
      document.documentElement.style.removeProperty('--font-heading');
    }
    if (token.id === 'doc_font_body') {
      document.documentElement.style.removeProperty('--font-body');
    }
    if (token.id === 'ui_density') {
      delete document.documentElement.dataset.uiDensity;
    }
    if (token.id === 'ui_font_size') {
      delete document.documentElement.dataset.uiFontSize;
    }
    if (token.id === 'doc_cover_layout') {
      const coverCards = document.querySelectorAll<HTMLElement>('.study-card-9-16.card-cover');
      coverCards.forEach((card) => {
        delete card.dataset.coverLayout;
      });
      delete document.documentElement.dataset.coverLayout;
    }

    const docCards = document.querySelectorAll<HTMLElement>('.study-card-9-16, [data-document-theme]');
    docCards.forEach((card) => {
      card.style.removeProperty(token.cssVar);
      if (token.id === 'doc_font_heading') {
        card.style.removeProperty('--font-heading');
      }
      if (token.id === 'doc_font_body') {
        card.style.removeProperty('--font-body');
      }
    });

    updateOverridesStylesheet();

    window.dispatchEvent(
      new CustomEvent('yurist:token-reset', {
        detail: { id: token.id, cssVar: token.cssVar, scope: token.scope }
      })
    );
  }

  await saveOverridesToDb(activeOverrides);
}

/**
 * Bir nechta tokenni bir vaqtda sukut bo‘yicha qiymatiga qaytarish (Section Reset)
 */
export async function resetTokens(idsOrCssVars: string[]): Promise<void> {
  for (const id of idsOrCssVars) {
    const token = TOKEN_BY_ID.get(id) || TOKEN_BY_CSS_VAR.get(id);
    if (!token) continue;
    delete activeOverrides[token.id];

    if (typeof document !== 'undefined') {
      document.documentElement.style.removeProperty(token.cssVar);
      if (token.id === 'doc_font_heading') {
        document.documentElement.style.removeProperty('--font-heading');
      }
      if (token.id === 'doc_font_body') {
        document.documentElement.style.removeProperty('--font-body');
      }
      if (token.id === 'ui_density') {
        delete document.documentElement.dataset.uiDensity;
      }
      if (token.id === 'ui_font_size') {
        delete document.documentElement.dataset.uiFontSize;
      }
      if (token.id === 'doc_cover_layout') {
        const coverCards = document.querySelectorAll<HTMLElement>('.study-card-9-16.card-cover');
        coverCards.forEach((card) => {
          delete card.dataset.coverLayout;
        });
        delete document.documentElement.dataset.coverLayout;
      }

      const docCards = document.querySelectorAll<HTMLElement>('.study-card-9-16, [data-document-theme]');
      docCards.forEach((card) => {
        card.style.removeProperty(token.cssVar);
      });
      window.dispatchEvent(
        new CustomEvent('yurist:token-reset', {
          detail: { id: token.id, cssVar: token.cssVar, scope: token.scope }
        })
      );
    }
  }

  if (typeof document !== 'undefined') {
    updateOverridesStylesheet();
  }

  await saveOverridesToDb(activeOverrides);
}

/**
 * Barcha tokenlarni dastlabki holatiga qaytarish (Reset All)
 */
export async function resetAll(): Promise<void> {
  const tokenIds = Object.keys(activeOverrides);

  for (const id of tokenIds) {
    const token = TOKEN_BY_ID.get(id);
    if (token && typeof document !== 'undefined') {
      document.documentElement.style.removeProperty(token.cssVar);
    }
    delete activeOverrides[id];
  }

  if (typeof document !== 'undefined') {
    const docCards = document.querySelectorAll<HTMLElement>('.study-card-9-16, [data-document-theme]');
    docCards.forEach((card) => {
      card.removeAttribute('style');
    });

    updateOverridesStylesheet();

    window.dispatchEvent(new CustomEvent('yurist:tokens-reset-all'));
  }

  await saveOverridesToDb({});
}

/**
 * Joriy faol o‘zgarishlarni olish
 */
export function getTokenOverrides(): Record<string, string> {
  return { ...activeOverrides };
}

/**
 * Barcha tokenlar ro‘yxatini olish
 */
export function getAllTokens(): DesignToken[] {
  return [...DESIGN_TOKENS];
}

/**
 * Token qiymatini olish (overrides bo'lsa uni, bo'lmasa defaultValue)
 */
export function getTokenValue(idOrCssVar: string): string | undefined {
  const token = TOKEN_BY_ID.get(idOrCssVar) || TOKEN_BY_CSS_VAR.get(idOrCssVar);
  if (!token) return undefined;
  return activeOverrides[token.id] ?? token.defaultValue;
}

/**
 * Token dvigatelini ishga tushirish (Startup Boot)
 */
export async function initTokenEngine(): Promise<void> {
  if (isInitialized) return;
  isInitialized = true;

  // 1. Sukut bo'yicha CSS o'zgaruvchilarini kiritish
  injectDefaultTokenStyles();

  // 2. IndexedDB'dan saqlangan o'zgarishlarni yuklash
  const savedOverrides = await loadOverridesFromDb();
  Object.assign(activeOverrides, savedOverrides);

  // 3. Yuklangan qiymatlarni DOM'ga biriktirish
  if (typeof document !== 'undefined') {
    for (const [id, value] of Object.entries(activeOverrides)) {
      const token = TOKEN_BY_ID.get(id);
      if (token) {
        document.documentElement.style.setProperty(token.cssVar, value);
      }
    }
    updateOverridesStylesheet();
  }

  // 4. DevTools / Konsol orqali to'g'ridan-to'g'ri chaqirish uchun window obyektiga ulash
  if (typeof window !== 'undefined') {
    const win = window as any;
    win.setToken = setToken;
    win.resetToken = resetToken;
    win.resetTokens = resetTokens;
    win.resetAll = resetAll;
    win.getAllTokens = getAllTokens;
    win.getTokenOverrides = getTokenOverrides;
    win.getTokenValue = getTokenValue;
  }
}
