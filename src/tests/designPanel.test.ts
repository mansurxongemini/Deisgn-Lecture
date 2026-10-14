import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach } from 'vitest';
import {
  setToken,
  resetToken,
  resetTokens,
  resetAll,
  getTokenValue,
  getTokenOverrides,
  initTokenEngine
} from '../design/applyTokens';
import { TOKEN_BY_ID } from '../design/tokens';

describe('TASK 4: Dizayn Customization Panel Engine & Controls', () => {
  beforeEach(async () => {
    await initTokenEngine();
    await resetAll();
  });

  it('1. Barcha talab qilingan Hujjat tokenlari reestrda mavjud va to‘g‘ri sozlangan', () => {
    const requiredDocTokens = [
      'doc_bg',
      'doc_ink',
      'doc_accent',
      'doc_border',
      'doc_font_heading',
      'doc_font_body',
      'canvas_font_body',
      'doc_line_height',
      'doc_padding_card',
      'doc_radius_card'
    ];

    for (const id of requiredDocTokens) {
      const token = TOKEN_BY_ID.get(id);
      expect(token, `Token "${id}" mavjud bo'lishi shart`).toBeDefined();
      expect(token?.scope).toBe('doc');
    }
  });

  it('2. Barcha talab qilingan Interfeys tokenlari reestrda mavjud', () => {
    const requiredUiTokens = [
      'ui_accent',
      'ui_bg',
      'ui_line',
      'ui_font_size',
      'ui_density'
    ];

    for (const id of requiredUiTokens) {
      const token = TOKEN_BY_ID.get(id);
      expect(token, `UI token "${id}" mavjud bo'lishi shart`).toBeDefined();
      expect(token?.scope).toBe('ui');
    }
  });

  it('3. Barcha talab qilingan Muharrir tokenlari reestrda mavjud', () => {
    const requiredEditorTokens = [
      'editor_font_size',
      'editor_line_height',
      'editor_bg'
    ];

    for (const id of requiredEditorTokens) {
      const token = TOKEN_BY_ID.get(id);
      expect(token, `Muharrir token "${id}" mavjud bo'lishi shart`).toBeDefined();
    }
  });

  it('4. Hujjat uslubi jonli o‘zgaradi: qog‘oz rangi (cool gray), urg‘u (deep green), matn hajmi (46px)', async () => {
    await setToken('doc_bg', '#F1F5F9');
    await setToken('doc_accent', '#065F46');
    await setToken('canvas_font_body', '46px');

    expect(getTokenValue('doc_bg')).toBe('#F1F5F9');
    expect(getTokenValue('doc_accent')).toBe('#065F46');
    expect(getTokenValue('canvas_font_body')).toBe('46px');

    if (typeof document !== 'undefined') {
      expect(document.documentElement.style.getPropertyValue('--doc-bg')).toBe('#F1F5F9');
      expect(document.documentElement.style.getPropertyValue('--doc-accent')).toBe('#065F46');
      expect(document.documentElement.style.getPropertyValue('--canvas-font-body')).toBe('46px');
    }
  });

  it('5. Muayyan tokenni standartga qaytarish (Individual Reset) ishlaydi', async () => {
    await setToken('doc_accent', '#065F46');
    expect(getTokenValue('doc_accent')).toBe('#065F46');

    await resetToken('doc_accent');
    const defaultVal = TOKEN_BY_ID.get('doc_accent')?.defaultValue;
    expect(getTokenValue('doc_accent')).toBe(defaultVal);
    expect('doc_accent' in getTokenOverrides()).toBe(false);
  });

  it('6. Butun bo‘limni standartga qaytarish (Section Reset: resetTokens) ishlaydi', async () => {
    const docTokens = ['doc_bg', 'doc_ink', 'doc_accent', 'canvas_font_body'];
    await setToken('doc_bg', '#F1F5F9');
    await setToken('doc_ink', '#000000');
    await setToken('doc_accent', '#065F46');
    await setToken('canvas_font_body', '46px');

    expect(getTokenValue('doc_bg')).toBe('#F1F5F9');

    // Butun Hujjat bo'limini qaytarish
    await resetTokens(docTokens);

    expect('doc_bg' in getTokenOverrides()).toBe(false);
    expect('doc_ink' in getTokenOverrides()).toBe(false);
    expect('doc_accent' in getTokenOverrides()).toBe(false);
    expect('canvas_font_body' in getTokenOverrides()).toBe(false);
  });

  it('7. Sarlavha va asosiy shriftlar o‘zgarganda --font-heading va --font-body sinxronlashadi', async () => {
    await setToken('doc_font_heading', "'Georgia', serif");
    await setToken('doc_font_body', "'Inter', sans-serif");

    expect(getTokenValue('doc_font_heading')).toBe("'Georgia', serif");
    expect(getTokenValue('doc_font_body')).toBe("'Inter', sans-serif");

    if (typeof document !== 'undefined') {
      expect(document.documentElement.style.getPropertyValue('--doc-font-heading')).toBe("'Georgia', serif");
      expect(document.documentElement.style.getPropertyValue('--font-heading')).toBe("'Georgia', serif");
      expect(document.documentElement.style.getPropertyValue('--doc-font-body')).toBe("'Inter', sans-serif");
      expect(document.documentElement.style.getPropertyValue('--font-body')).toBe("'Inter', sans-serif");
    }
  });

  it('8. Interfeys zichligi (ui_density) va UI font o‘lchami (ui_font_size) dataset atributlarini o‘rnatadi', async () => {
    await setToken('ui_density', 'compact');
    await setToken('ui_font_size', 'L');

    if (typeof document !== 'undefined') {
      expect(document.documentElement.dataset.uiDensity).toBe('compact');
      expect(document.documentElement.dataset.uiFontSize).toBe('L');
    }

    await resetToken('ui_density');
    await resetToken('ui_font_size');

    if (typeof document !== 'undefined') {
      expect(document.documentElement.dataset.uiDensity).toBeUndefined();
      expect(document.documentElement.dataset.uiFontSize).toBeUndefined();
    }
  });
});
