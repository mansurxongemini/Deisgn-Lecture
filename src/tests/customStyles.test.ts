import { describe, it, expect, beforeEach } from 'vitest';
import {
  initCustomStyles,
  saveCustomStyle,
  getCustomStyles,
  getCustomStyleById,
  renameCustomStyle,
  deleteCustomStyle,
  applyCustomStyle,
  importStyleFromJson,
  type CustomStyle
} from '../design/customStyles';
import { getTokenValue } from '../design/applyTokens';
import { parseMarkdownPlus } from '../schema/mdParser';

describe('TASK 6: Saved Custom Styles System', () => {
  beforeEach(async () => {
    await initCustomStyles();
    const existing = getCustomStyles();
    for (const style of existing) {
      await deleteCustomStyle(style.id);
    }
  });

  it('1. Maxsus uslubni tokenlari bilan saqlaydi va ro‘yxatga qo‘shadi', async () => {
    const customTokens = {
      doc_bg: '#fdfbf7',
      doc_ink: '#1e293b',
      doc_accent: '#1e3a8a',
      doc_font_heading: 'Lora'
    };

    const saved = await saveCustomStyle('Mening TDYU uslubim', customTokens);
    expect(saved).toBeDefined();
    expect(saved.id).toContain('custom_style_');
    expect(saved.name).toBe('Mening TDYU uslubim');
    expect(saved.tokens.doc_accent).toBe('#1e3a8a');

    const all = getCustomStyles();
    expect(all.length).toBe(1);
    expect(all[0].name).toBe('Mening TDYU uslubim');

    const byId = getCustomStyleById(saved.id);
    expect(byId).toBeDefined();
    expect(byId?.name).toBe('Mening TDYU uslubim');
  });

  it('2. Saqlangan uslub nomini qayta nomlaydi (rename)', async () => {
    const saved = await saveCustomStyle('Boshlang‘ich uslub', { doc_accent: '#059669' });
    const updated = await renameCustomStyle(saved.id, 'TDYU Yangilangan Uslub');

    expect(updated).not.toBeNull();
    expect(updated?.name).toBe('TDYU Yangilangan Uslub');

    const found = getCustomStyleById(saved.id);
    expect(found?.name).toBe('TDYU Yangilangan Uslub');
  });

  it('3. Saqlangan uslubni o‘chiradi (delete)', async () => {
    const s1 = await saveCustomStyle('Uslub 1', { doc_accent: '#dc2626' });
    const s2 = await saveCustomStyle('Uslub 2', { doc_accent: '#2563eb' });

    expect(getCustomStyles().length).toBe(2);

    const deleted = await deleteCustomStyle(s1.id);
    expect(deleted).toBe(true);

    const remaining = getCustomStyles();
    expect(remaining.length).toBe(1);
    expect(remaining[0].id).toBe(s2.id);
  });

  it('4. JSON formatida eksport qilingan faylni to‘g‘ri import qiladi', async () => {
    const exportData = {
      format: 'yurist-studio-style',
      version: '1.0',
      exportedAt: Date.now(),
      style: {
        id: 'export_test_id',
        name: 'TDYU Davlat Huquqi Uslubi',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        tokens: {
          doc_bg: '#fff8f0',
          doc_ink: '#111827',
          doc_accent: '#b45309',
          doc_font_heading: 'Cinzel'
        }
      }
    };

    const imported = await importStyleFromJson(JSON.stringify(exportData));
    expect(imported).toBeDefined();
    expect(imported.name).toContain('TDYU Davlat Huquqi Uslubi');
    expect(imported.tokens.doc_accent).toBe('#b45309');

    const list = getCustomStyles();
    expect(list.some((s) => s.id === imported.id)).toBe(true);
  });

  it('5. Yaroqsiz JSON fayl kiritilganda xatolik beradi', async () => {
    await expect(importStyleFromJson('{ noto‘g‘ri json')).rejects.toThrow();
    await expect(importStyleFromJson(JSON.stringify({ format: 'other', data: 123 }))).rejects.toThrow();
  });

  it('6. Maxsus uslubni jonli qo‘llaganda (applyCustomStyle) tokenlar yangilanadi', async () => {
    const testStyle: CustomStyle = {
      id: 'apply_test_1',
      name: 'Jonli Test Uslubi',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      tokens: {
        doc_bg: '#faf5ff',
        doc_accent: '#7e22ce'
      }
    };

    await applyCustomStyle(testStyle);
    const bgVal = getTokenValue('doc_bg');
    const accentVal = getTokenValue('doc_accent');

    expect(bgVal).toBe('#faf5ff');
    expect(accentVal).toBe('#7e22ce');
  });

  it('7. MD+ matnida "uslub:" ko‘rsatilganda customStyle sifatida parse qilinadi', () => {
    const md = `# TDYU Ma'ruza
uslub: Mening TDYU uslubim
muallif: Dots. Alimov

## 1-Mavzu
norma: 1-modda
Inson qadr-qimmati...`;

    const { document, warnings } = parseMarkdownPlus(md);
    expect(document.customStyle).toBe('Mening TDYU uslubim');
    expect(warnings.length).toBe(0);
  });
});
