import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach } from 'vitest';
import {
  COLOR_SCHEME_PRESETS,
  TYPOGRAPHY_PAIR_PRESETS,
  LAYOUT_DENSITY_PRESETS,
  COVER_LAYOUT_PRESETS,
  COLOR_PRESET_BY_ID,
  TYPOGRAPHY_PRESET_BY_ID,
  DENSITY_PRESET_BY_ID,
  COVER_PRESET_BY_ID,
  TOTAL_PRESET_COMBINATIONS
} from '../design/presets';
import {
  setToken,
  resetAll,
  getTokenValue,
  initTokenEngine
} from '../design/applyTokens';
import { TOKEN_BY_ID } from '../design/tokens';

describe('TASK 5: Preset Library (The "hundreds of choices" feature)', () => {
  beforeEach(async () => {
    await initTokenEngine();
    await resetAll();
  });

  it('1. Rang sxemalari: kamida 24 ta mustahkam, professional rang sxemasi va o‘zbekcha nomlar', () => {
    expect(COLOR_SCHEME_PRESETS.length).toBeGreaterThanOrEqual(24);

    const requiredKeys = [
      'warm_paper',
      'cool_gray',
      'cream',
      'sepia',
      'slate',
      'forest',
      'bordeaux',
      'midnight',
      'parchment',
      'arctic',
      'sand',
      'olive'
    ];

    for (const key of requiredKeys) {
      const preset = COLOR_PRESET_BY_ID.get(key);
      expect(preset, `Rang sxemasi "${key}" mavjud bo'lishi shart`).toBeDefined();
      expect(preset?.name.length).toBeGreaterThan(0);
      expect(preset?.tokens.doc_bg).toMatch(/^#[0-9a-fA-F]{6}$/);
      expect(preset?.tokens.doc_ink).toMatch(/^#[0-9a-fA-F]{6}$/);
      expect(preset?.tokens.doc_accent).toMatch(/^#[0-9a-fA-F]{6}$/);
      expect(preset?.tokens.doc_border).toMatch(/^#[0-9a-fA-F]{6}$/);
    }
  });

  it('2. Tipografiya juftliklari: kamida 8 ta sarlavha va matn shriftlari juftligi va namunaviy matn', () => {
    expect(TYPOGRAPHY_PAIR_PRESETS.length).toBeGreaterThanOrEqual(8);

    const expectedPairs = [
      'lora_inter',
      'georgia_inter',
      'inter_inter',
      'lora_lora',
      'georgia_georgia',
      'inter_lora'
    ];

    for (const id of expectedPairs) {
      const typo = TYPOGRAPHY_PRESET_BY_ID.get(id);
      expect(typo, `Tipografiya juftligi "${id}" mavjud bo'lishi shart`).toBeDefined();
      expect(typo?.previewHeading.length).toBeGreaterThan(0);
      expect(typo?.previewBody.length).toBeGreaterThan(0);
      expect(typo?.headingFont).toBeDefined();
      expect(typo?.bodyFont).toBeDefined();
    }
  });

  it('3. Tartib zichligi: kamida 6 ta zichlik darajasi (ixcham -> keng)', () => {
    expect(LAYOUT_DENSITY_PRESETS.length).toBeGreaterThanOrEqual(6);

    const densities = ['ultra_compact', 'compact', 'normal', 'comfortable', 'spacious', 'luxurious'];
    for (const id of densities) {
      const density = DENSITY_PRESET_BY_ID.get(id);
      expect(density, `Zichlik "${id}" mavjud bo'lishi shart`).toBeDefined();
      expect(density?.tokens.doc_padding_card).toBeDefined();
      expect(density?.tokens.doc_line_height).toBeDefined();
    }
  });

  it('4. Muqova tartibi: kamida 6 ta muqova kompozitsiyasi', () => {
    expect(COVER_LAYOUT_PRESETS.length).toBeGreaterThanOrEqual(6);

    const covers = [
      'classic',
      'left_aligned',
      'minimal',
      'bordered',
      'crest_top',
      'crest_side'
    ];

    for (const id of covers) {
      const cover = COVER_PRESET_BY_ID.get(id);
      expect(cover, `Muqova tartibi "${id}" mavjud bo'lishi shart`).toBeDefined();
      expect(cover?.badge.length).toBeGreaterThan(0);
    }
  });

  it('5. Kombinatsiyalar soni: 24 rang x 8 tipografiya x 6 zichlik x 6 muqova ≈ 6,912 kombinatsiya', () => {
    const totalCombos =
      COLOR_SCHEME_PRESETS.length *
      TYPOGRAPHY_PAIR_PRESETS.length *
      LAYOUT_DENSITY_PRESETS.length *
      COVER_LAYOUT_PRESETS.length;

    expect(totalCombos).toBeGreaterThanOrEqual(24 * 8 * 6 * 6);
    expect(totalCombos).toBe(TOTAL_PRESET_COMBINATIONS);
  });

  it('6. Rang sxemasi bir chertishda barcha kerakli hujjat tokenlarini o‘zgartiradi', async () => {
    const forestPreset = COLOR_PRESET_BY_ID.get('forest')!;
    expect(forestPreset).toBeDefined();

    for (const [tokenId, value] of Object.entries(forestPreset.tokens)) {
      await setToken(tokenId, value);
    }

    expect(getTokenValue('doc_bg')).toBe(forestPreset.tokens.doc_bg);
    expect(getTokenValue('doc_ink')).toBe(forestPreset.tokens.doc_ink);
    expect(getTokenValue('doc_accent')).toBe(forestPreset.tokens.doc_accent);
    expect(getTokenValue('doc_border')).toBe(forestPreset.tokens.doc_border);

    // CSS variables documentElementda aks etishi
    if (typeof document !== 'undefined') {
      expect(document.documentElement.style.getPropertyValue('--doc-bg')).toBe(forestPreset.tokens.doc_bg);
      expect(document.documentElement.style.getPropertyValue('--doc-accent')).toBe(forestPreset.tokens.doc_accent);
    }
  });

  it('7. Muqova tartibi tokeni doc_cover_layout to‘g‘ri sozlanadi va DOM attributiga o‘tadi', async () => {
    expect(TOKEN_BY_ID.get('doc_cover_layout')).toBeDefined();

    await setToken('doc_cover_layout', 'crest_top');
    expect(getTokenValue('doc_cover_layout')).toBe('crest_top');
    if (typeof document !== 'undefined') {
      expect(document.documentElement.dataset.coverLayout).toBe('crest_top');
    }
  });

  it('8. Preset ustidan qo‘lda qilingan o‘zgartirishlar aniqlanadi (O‘zgartirilgan holati)', async () => {
    const warmPreset = COLOR_PRESET_BY_ID.get('warm_paper')!;
    for (const [tokenId, value] of Object.entries(warmPreset.tokens)) {
      await setToken(tokenId, value);
    }

    // Dastlab to‘liq mos
    let isTweaked =
      getTokenValue('doc_bg')?.toLowerCase() !== warmPreset.tokens.doc_bg.toLowerCase() ||
      getTokenValue('doc_ink')?.toLowerCase() !== warmPreset.tokens.doc_ink.toLowerCase() ||
      getTokenValue('doc_accent')?.toLowerCase() !== warmPreset.tokens.doc_accent.toLowerCase() ||
      getTokenValue('doc_border')?.toLowerCase() !== warmPreset.tokens.doc_border.toLowerCase();
    expect(isTweaked).toBe(false);

    // Foydalanuvchi bitta rangni o'zgartirdi
    await setToken('doc_accent', '#FF0055');
    isTweaked =
      getTokenValue('doc_bg')?.toLowerCase() !== warmPreset.tokens.doc_bg.toLowerCase() ||
      getTokenValue('doc_ink')?.toLowerCase() !== warmPreset.tokens.doc_ink.toLowerCase() ||
      getTokenValue('doc_accent')?.toLowerCase() !== warmPreset.tokens.doc_accent.toLowerCase() ||
      getTokenValue('doc_border')?.toLowerCase() !== warmPreset.tokens.doc_border.toLowerCase();
    expect(isTweaked).toBe(true);
  });
});
