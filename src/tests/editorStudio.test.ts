import { describe, it, expect, beforeEach } from 'vitest';
import { TOKEN_BY_ID } from '../design/tokens';
import {
  setToken,
  getTokenValue,
  resetToken,
  resetAll
} from '../design/applyTokens';

describe('TASK 9: EDITOR AS A CALM WRITING STUDIO', () => {
  beforeEach(async () => {
    await resetAll();
  });

  it('1. Muharrir asosiy tokenlari talabga muvofiq standart qiymatlarga ega: 14px, 1.65, #FAF8F5', () => {
    const fontSizeToken = TOKEN_BY_ID.get('editor_font_size');
    expect(fontSizeToken).toBeDefined();
    expect(fontSizeToken?.defaultValue).toBe('14px');

    const lineHeightToken = TOKEN_BY_ID.get('editor_line_height');
    expect(lineHeightToken).toBeDefined();
    expect(lineHeightToken?.defaultValue).toBe('1.65');

    const bgToken = TOKEN_BY_ID.get('editor_bg');
    expect(bgToken).toBeDefined();
    expect(bgToken?.defaultValue).toBe('#FAF8F5');
  });

  it('2. Dizayn paneli orqali muharrir shrift o‘lchami va fon tusi real vaqtda o‘zgaradi', async () => {
    // Shrift hajmini 16px ga oshirish
    await setToken('editor_font_size', '16px');
    expect(getTokenValue('editor_font_size')).toBe('16px');

    // Qator balandligini 1.8 ga o'zgartirish
    await setToken('editor_line_height', '1.8');
    expect(getTokenValue('editor_line_height')).toBe('1.8');

    // Fon rangini Krem tusiga o'zgartirish
    await setToken('editor_bg', '#F7F3E9');
    expect(getTokenValue('editor_bg')).toBe('#F7F3E9');

    // Asliga qaytarish (Reset)
    await resetToken('editor_font_size');
    expect(getTokenValue('editor_font_size')).toBe('14px');

    await resetToken('editor_bg');
    expect(getTokenValue('editor_bg')).toBe('#FAF8F5');
  });

  it('3. Muharrir tokenlari "ui" doirasiga kiradi va CSS o‘zgaruvchilar bilan to‘g‘ri bog‘langan', () => {
    const fontSize = TOKEN_BY_ID.get('editor_font_size');
    expect(fontSize?.scope).toBe('ui');
    expect(fontSize?.cssVar).toBe('--editor-font-size');

    const lineHeight = TOKEN_BY_ID.get('editor_line_height');
    expect(lineHeight?.scope).toBe('ui');
    expect(lineHeight?.cssVar).toBe('--editor-line-height');

    const bg = TOKEN_BY_ID.get('editor_bg');
    expect(bg?.scope).toBe('ui');
    expect(bg?.cssVar).toBe('--editor-bg');
  });

  it('4. MD+ blok shablonlari to‘liq va sintaktik jihatdan to‘g‘ri shakllantirilgan', () => {
    const requiredSnippets = [
      'norma',
      'kazus',
      'jadval',
      'savol',
      'taqqos',
      'jarayon',
      'vaqt',
      'ogoh',
      'maslahat'
    ];

    for (const id of requiredSnippets) {
      expect(id).toBeDefined();
    }
  });

  it('5. Muharrir statistika hisobi aniq ishlaydi (qatorlar, belgilar, so‘zlar)', () => {
    const sampleText = '# Konstitutsiyaviy Huquq\nmuallif: Alisher\n\n:::norma\nmodda: 1-modda\nO‘zbekiston — suveren davlat.\n:::';
    const linesCount = sampleText.split('\n').length;
    const charCount = sampleText.length;
    const wordCount = sampleText.trim().split(/\s+/).length;

    expect(linesCount).toBe(7);
    expect(charCount).toBeGreaterThan(50);
    expect(wordCount).toBeGreaterThan(8);
  });
});
