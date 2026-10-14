import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  X,
  RotateCcw,
  Sliders,
  FileText,
  Layout,
  PenTool,
  Check,
  Sparkles,
  BookmarkPlus,
  Upload,
  Download,
  Trash2,
  Pencil
} from 'lucide-react';
import {
  setToken,
  resetToken,
  resetTokens,
  getTokenValue,
  getTokenOverrides
} from '../../design/applyTokens';
import { TOKEN_BY_ID } from '../../design/tokens';
import {
  COLOR_SCHEME_PRESETS,
  TYPOGRAPHY_PAIR_PRESETS,
  LAYOUT_DENSITY_PRESETS,
  COVER_LAYOUT_PRESETS,
  COLOR_PRESET_BY_ID,
  TYPOGRAPHY_PRESET_BY_ID,
  DENSITY_PRESET_BY_ID,
  type ColorSchemePreset,
  type TypographyPairPreset,
  type LayoutDensityPreset,
  type CoverLayoutPreset
} from '../../design/presets';
import {
  loadCustomStyles,
  saveCustomStyle,
  renameCustomStyle,
  deleteCustomStyle,
  applyCustomStyle,
  exportStyleAsJson,
  importStyleFromJson,
  type CustomStyle
} from '../../design/customStyles';
import './designPanel.css';

export type DesignTab = 'hujjat' | 'interfeys' | 'muharrir';
export type PresetCategory = 'colors' | 'typography' | 'density' | 'cover' | 'custom';

interface DesignPanelProps {
  isOpen: boolean;
  onClose: () => void;
  activeDocId?: string | null;
  onApplyStyleToDoc?: (styleNameOrId: string, styleId?: string) => void;
}

// Shrift variantlari
const FONT_OPTIONS = [
  { label: 'Lora (Serif)', value: "'Lora', Georgia, serif" },
  { label: 'Inter (Sans)', value: "'Inter', -apple-system, system-ui, sans-serif" },
  { label: 'Georgia (Serif)', value: "'Georgia', serif" },
  { label: 'Tizim (Serif)', value: 'serif' }
];

// Qog'oz rangi presetlari
const PAPER_PRESETS = [
  { label: 'Qaymoqrang', color: '#FAF8F5' },
  { label: 'Salqin kulrang', color: '#F1F5F9' },
  { label: 'Sof oq', color: '#FFFFFF' },
  { label: 'Krem', color: '#F5F3EF' },
  { label: 'Tungi shifer', color: '#1E2430' }
];

// Urg'u rangi presetlari
const ACCENT_PRESETS = [
  { label: 'To‘q ko‘k', color: '#1B2A4A' },
  { label: 'Zumrad yashil', color: '#065F46' },
  { label: 'Yorqin ko‘k', color: '#2563EB' },
  { label: 'G‘ishtrang', color: '#7C2D12' },
  { label: 'Bronza', color: '#9E7D3B' },
  { label: 'Binafsha', color: '#5B21B6' }
];

// Matn rangi presetlari
const INK_PRESETS = [
  { label: 'Grafit', color: '#1C2430' },
  { label: 'Qora siyoh', color: '#0F172A' },
  { label: 'To‘q kulrang', color: '#374151' },
  { label: 'Qahvarang', color: '#2C2216' },
  { label: 'Yorug‘', color: '#F1F5F9' }
];

// Hoshiya rangi presetlari
const BORDER_PRESETS = [
  { label: 'Nafis', color: '#E3D9CC' },
  { label: 'Kulrang', color: '#CBD5E1' },
  { label: 'Yumshoq', color: '#E2E8F0' },
  { label: 'Bronza', color: '#9E7D3B' },
  { label: 'To‘q', color: '#334155' }
];

// Muharrir fon presetlari
const EDITOR_BG_PRESETS = [
  { label: 'Issiq qog‘oz', color: '#FAF8F5' },
  { label: 'Krem', color: '#F7F3E9' },
  { label: 'Sof oq', color: '#FFFFFF' },
  { label: 'Sepiya', color: '#F5EFE0' },
  { label: 'Salqin shifer', color: '#F1F5F9' },
  { label: 'Tungi', color: '#1E222A' }
];

// UI chegarasi kuchi presetlari
const BORDER_STRENGTH_PRESETS = [
  { label: 'Nozik', color: '#EBE6DF' },
  { label: 'Standart', color: '#E2DDD5' },
  { label: 'Aniq', color: '#CBD5E1' },
  { label: 'Qalin', color: '#94A3B8' }
];

// Bo'limlar bo'yicha token identifikatorlari
const TAB_TOKENS: Record<DesignTab, string[]> = {
  hujjat: [
    'doc_bg',
    'doc_ink',
    'doc_accent',
    'doc_border',
    'doc_font_heading',
    'doc_font_body',
    'canvas_font_body',
    'doc_line_height',
    'doc_padding_card',
    'doc_radius_card',
    'doc_cover_layout'
  ],
  interfeys: [
    'ui_accent',
    'ui_bg',
    'ui_line',
    'ui_font_size',
    'ui_density'
  ],
  muharrir: [
    'editor_font_size',
    'editor_line_height',
    'editor_bg'
  ]
};

export const DesignPanel: React.FC<DesignPanelProps> = ({
  isOpen,
  onClose,
  activeDocId: _activeDocId,
  onApplyStyleToDoc
}) => {
  const [activeTab, setActiveTab] = useState<DesignTab>('hujjat');
  const [presetCategory, setPresetCategory] = useState<PresetCategory>('colors');
  const [activeColorPresetId, setActiveColorPresetId] = useState<string>('warm_paper');
  const [activeTypoPresetId, setActiveTypoPresetId] = useState<string>('lora_inter');
  const [activeDensityPresetId, setActiveDensityPresetId] = useState<string>('normal');
  const [activeCoverPresetId, setActiveCoverPresetId] = useState<string>('classic');

  // Maxsus uslublar (Custom Styles) holati
  const [customStylesList, setCustomStylesList] = useState<CustomStyle[]>([]);
  const [activeCustomStyleId, setActiveCustomStyleId] = useState<string | null>(null);
  const [isSavingCustomStyle, setIsSavingCustomStyle] = useState<boolean>(false);
  const [newStyleName, setNewStyleName] = useState<string>('');
  const [renamingStyleId, setRenamingStyleId] = useState<string | null>(null);
  const [renamingStyleName, setRenamingStyleName] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [tokenValues, setTokenValues] = useState<Record<string, string>>({});
  const [, setRefreshKey] = useState<number>(0);

  // Token qiymatlarini sinxronlashtirish
  const refreshTokens = useCallback(() => {
    const values: Record<string, string> = {};
    const allTabTokenIds = [
      ...TAB_TOKENS.hujjat,
      ...TAB_TOKENS.interfeys,
      ...TAB_TOKENS.muharrir
    ];

    for (const id of allTabTokenIds) {
      const val = getTokenValue(id);
      if (val !== undefined) {
        values[id] = val;
      }
    }
    setTokenValues(values);
    setRefreshKey((k) => k + 1);
  }, []);

  // Saqlangan maxsus uslublarni yuklash va tinglash
  useEffect(() => {
    loadCustomStyles().then((styles) => {
      setCustomStylesList(styles);
    });

    const handleCustomStylesChange = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail?.styles) {
        setCustomStylesList(customEvent.detail.styles);
      } else {
        loadCustomStyles().then(setCustomStylesList);
      }
    };

    const handleStyleApplied = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail?.style) {
        setActiveCustomStyleId(customEvent.detail.style.id);
      }
    };

    window.addEventListener('yurist:custom-styles-changed', handleCustomStylesChange);
    window.addEventListener('yurist:custom-style-applied', handleStyleApplied);

    return () => {
      window.removeEventListener('yurist:custom-styles-changed', handleCustomStylesChange);
      window.removeEventListener('yurist:custom-style-applied', handleStyleApplied);
    };
  }, []);

  useEffect(() => {
    refreshTokens();

    const handleTokenChange = () => refreshTokens();
    const handleTokenReset = () => refreshTokens();
    const handleResetAll = () => {
      setActiveColorPresetId('warm_paper');
      setActiveTypoPresetId('lora_inter');
      setActiveDensityPresetId('normal');
      setActiveCoverPresetId('classic');
      setActiveCustomStyleId(null);
      refreshTokens();
    };

    window.addEventListener('yurist:token-changed', handleTokenChange);
    window.addEventListener('yurist:token-reset', handleTokenReset);
    window.addEventListener('yurist:tokens-reset-all', handleResetAll);

    return () => {
      window.removeEventListener('yurist:token-changed', handleTokenChange);
      window.removeEventListener('yurist:token-reset', handleTokenReset);
      window.removeEventListener('yurist:tokens-reset-all', handleResetAll);
    };
  }, [refreshTokens]);

  // Token qiymatini o'zgartirish
  const handleChange = async (id: string, value: string) => {
    setTokenValues((prev) => ({ ...prev, [id]: value }));
    await setToken(id, value);
  };

  // Muayyan tokenni standartga qaytarish
  const handleResetSingle = async (id: string) => {
    await resetToken(id);
    const token = TOKEN_BY_ID.get(id);
    if (token) {
      setTokenValues((prev) => ({ ...prev, [id]: token.defaultValue }));
    }
  };

  // Butun faol bo'limni standartga qaytarish
  const handleResetSection = async () => {
    const tokensToReset = TAB_TOKENS[activeTab];
    await resetTokens(tokensToReset);
    if (activeTab === 'hujjat') {
      setActiveColorPresetId('warm_paper');
      setActiveTypoPresetId('lora_inter');
      setActiveDensityPresetId('normal');
      setActiveCoverPresetId('classic');
    }
    refreshTokens();
  };

  // Presetlarni qo'llash (One-click apply)
  const applyColorScheme = async (p: ColorSchemePreset) => {
    setActiveColorPresetId(p.id);
    await setToken('doc_bg', p.tokens.doc_bg);
    await setToken('doc_ink', p.tokens.doc_ink);
    await setToken('doc_accent', p.tokens.doc_accent);
    await setToken('doc_border', p.tokens.doc_border);
    refreshTokens();
  };

  const applyTypography = async (p: TypographyPairPreset) => {
    setActiveTypoPresetId(p.id);
    await setToken('doc_font_heading', p.headingFont);
    await setToken('doc_font_body', p.bodyFont);
    refreshTokens();
  };

  const applyDensity = async (p: LayoutDensityPreset) => {
    setActiveDensityPresetId(p.id);
    await setToken('doc_padding_card', p.tokens.doc_padding_card);
    await setToken('doc_line_height', p.tokens.doc_line_height);
    await setToken('canvas_font_body', p.tokens.canvas_font_body);
    await setToken('doc_padding_content', p.tokens.doc_padding_content);
    refreshTokens();
  };

  const applyCover = async (p: CoverLayoutPreset) => {
    setActiveCoverPresetId(p.id);
    await setToken('doc_cover_layout', p.id);
    refreshTokens();
  };

  // Maxsus uslublarni qo'llash va boshqarish funksiyalari
  const handleApplyCustom = async (style: CustomStyle) => {
    setActiveCustomStyleId(style.id);
    await applyCustomStyle(style);
    refreshTokens();
    if (onApplyStyleToDoc) {
      onApplyStyleToDoc(style.name, style.id);
    }
  };

  const handleSaveCustom = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const name = newStyleName.trim();
    if (!name) return;
    const style = await saveCustomStyle(name, undefined, {
      colorPresetId: activeColorPresetId,
      typoPresetId: activeTypoPresetId,
      densityPresetId: activeDensityPresetId,
      coverPresetId: activeCoverPresetId
    });
    setCustomStylesList((prev) => [style, ...prev.filter((s) => s.id !== style.id)]);
    setActiveCustomStyleId(style.id);
    setIsSavingCustomStyle(false);
    setNewStyleName('');
    setPresetCategory('custom');
    if (onApplyStyleToDoc) {
      onApplyStyleToDoc(style.name, style.id);
    }
  };

  const handleRenameCustom = async (id: string) => {
    const trimmed = renamingStyleName.trim();
    if (!trimmed) {
      setRenamingStyleId(null);
      return;
    }
    const updated = await renameCustomStyle(id, trimmed);
    if (updated) {
      setCustomStylesList((prev) => prev.map((s) => (s.id === id ? updated : s)));
    }
    setRenamingStyleId(null);
    setRenamingStyleName('');
  };

  const handleDeleteCustom = async (id: string, name: string) => {
    if (window.confirm(`"${name}" uslubini o‘chirishni tasdiqlaysizmi?`)) {
      await deleteCustomStyle(id);
      setCustomStylesList((prev) => prev.filter((s) => s.id !== id));
      if (activeCustomStyleId === id) {
        setActiveCustomStyleId(null);
      }
    }
  };

  const handleExportCustom = (e: React.MouseEvent, style: CustomStyle) => {
    e.stopPropagation();
    exportStyleAsJson(style);
  };

  const handleTriggerImport = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const imported = await importStyleFromJson(text);
      setCustomStylesList((prev) => [imported, ...prev.filter((s) => s.id !== imported.id)]);
      await applyCustomStyle(imported);
      setActiveCustomStyleId(imported.id);
      setPresetCategory('custom');
      refreshTokens();
      if (onApplyStyleToDoc) {
        onApplyStyleToDoc(imported.name, imported.id);
      }
    } catch (err: any) {
      alert(`Uslubni yuklashda xatolik: ${err.message || 'Noma‘lum xato'}`);
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Preset qiymatlari qo'lda o'zgartirilganligini (Tweaked) tekshirish
  const isColorPresetTweaked = useMemo(() => {
    const preset = COLOR_PRESET_BY_ID.get(activeColorPresetId);
    if (!preset) return false;
    const currentBg = tokenValues['doc_bg'] || '#FAF8F5';
    const currentInk = tokenValues['doc_ink'] || '#1C2430';
    const currentAccent = tokenValues['doc_accent'] || '#1B2A4A';
    const currentBorder = tokenValues['doc_border'] || '#E3D9CC';

    return (
      currentBg.toLowerCase() !== preset.tokens.doc_bg.toLowerCase() ||
      currentInk.toLowerCase() !== preset.tokens.doc_ink.toLowerCase() ||
      currentAccent.toLowerCase() !== preset.tokens.doc_accent.toLowerCase() ||
      currentBorder.toLowerCase() !== preset.tokens.doc_border.toLowerCase()
    );
  }, [activeColorPresetId, tokenValues]);

  const isTypoPresetTweaked = useMemo(() => {
    const preset = TYPOGRAPHY_PRESET_BY_ID.get(activeTypoPresetId);
    if (!preset) return false;
    const currentHeading = tokenValues['doc_font_heading'] || "'Lora', Georgia, serif";
    const currentBody = tokenValues['doc_font_body'] || "'Inter', -apple-system, system-ui, sans-serif";

    return currentHeading !== preset.headingFont || currentBody !== preset.bodyFont;
  }, [activeTypoPresetId, tokenValues]);

  const isDensityPresetTweaked = useMemo(() => {
    const preset = DENSITY_PRESET_BY_ID.get(activeDensityPresetId);
    if (!preset) return false;
    const currentPadding = tokenValues['doc_padding_card'] || '80px 70px';
    const currentLineHeight = tokenValues['doc_line_height'] || '1.6';

    return (
      currentPadding !== preset.tokens.doc_padding_card ||
      currentLineHeight !== preset.tokens.doc_line_height
    );
  }, [activeDensityPresetId, tokenValues]);

  const isCoverPresetTweaked = useMemo(() => {
    const currentLayout = tokenValues['doc_cover_layout'] || 'classic';
    return currentLayout !== activeCoverPresetId;
  }, [activeCoverPresetId, tokenValues]);

  // Token sukut bo'yicha qiymatdan farq qiladimi?
  const isOverridden = useCallback((id: string): boolean => {
    const overrides = getTokenOverrides();
    return id in overrides;
  }, []);

  // Faol bo'limda birorta o'zgartirish bormi?
  const hasSectionOverrides = useMemo(() => {
    const currentTokens = TAB_TOKENS[activeTab];
    const overrides = getTokenOverrides();
    return currentTokens.some((id) => id in overrides);
  }, [activeTab, tokenValues]);

  // Raqamli qiymatni ajratib olish (masalan '42px' -> 42)
  const parseNum = (val: string | undefined, defaultNum: number): number => {
    if (!val) return defaultNum;
    const match = val.match(/^-?[\d.]+/);
    return match ? parseFloat(match[0]) : defaultNum;
  };

  return (
    <aside
      className={`design-panel ${isOpen ? 'open' : ''} no-print`}
      aria-label="Dizayn sozlamalari paneli"
      aria-hidden={!isOpen}
    >
      {/* Panel sarlavhasi (Header) */}
      <div className="design-panel-header">
        <div className="design-panel-title">
          <div className="design-title-icon-box">
            <Sliders size={16} strokeWidth={2} />
          </div>
          <div>
            <h2 className="design-title-text">Dizayn</h2>
            <div className="design-subtitle-text">Jonli uslub tahriri</div>
          </div>
        </div>

        <div className="design-header-actions">
          <button
            type="button"
            className="design-reset-section-btn"
            onClick={handleResetSection}
            disabled={!hasSectionOverrides}
            title={`${activeTab === 'hujjat' ? 'Hujjat' : activeTab === 'interfeys' ? 'Interfeys' : 'Muharrir'} sozlamalarini standartga qaytarish`}
          >
            <RotateCcw size={12} strokeWidth={2} />
            <span>Standartga qaytarish</span>
          </button>

          <button
            type="button"
            className="design-close-btn"
            onClick={onClose}
            title="Dizayn panelini yopish"
            aria-label="Yopish"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Bo'limlar Navigatsiyasi (Tabs: Hujjat | Interfeys | Muharrir) */}
      <div className="design-tabs" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'hujjat'}
          className={`design-tab-btn ${activeTab === 'hujjat' ? 'active' : ''}`}
          onClick={() => setActiveTab('hujjat')}
        >
          <FileText size={13} strokeWidth={2} />
          <span>Hujjat</span>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'interfeys'}
          className={`design-tab-btn ${activeTab === 'interfeys' ? 'active' : ''}`}
          onClick={() => setActiveTab('interfeys')}
        >
          <Layout size={13} strokeWidth={2} />
          <span>Interfeys</span>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'muharrir'}
          className={`design-tab-btn ${activeTab === 'muharrir' ? 'active' : ''}`}
          onClick={() => setActiveTab('muharrir')}
        >
          <PenTool size={13} strokeWidth={2} />
          <span>Muharrir</span>
        </button>
      </div>

      {/* Panel kontenti (Scrollable Controls Container) */}
      <div className="design-panel-content">
        {/* ===================================================================
            1-TAB: HUJJAT (DOCUMENT STYLE & PRESETS EDITING)
           =================================================================== */}
        {activeTab === 'hujjat' && (
          <div className="design-tab-content">
            {/* TAYYOR PRESETLAR BO'LIMI (PRESET LIBRARY) */}
            <div className="design-preset-section">
              <div className="design-preset-header-box">
                <div className="design-group-title" style={{ marginTop: 0 }}>
                  Tayyor uslublar (Presets)
                </div>
                <span className="design-preset-combo-badge" title="24 rang × 8 shrift × 6 zichlik × 6 muqova">
                  ~7,000 kombinatsiya
                </span>
              </div>

              {/* Uslubni saqlash va Import amallari */}
              <div className="design-preset-actions-bar">
                <button
                  type="button"
                  className="design-action-btn-primary"
                  onClick={() => setIsSavingCustomStyle((prev) => !prev)}
                  title="Joriy ranglar, shriftlar va hoshiyalarni shaxsiy uslub sifatida saqlash"
                >
                  <BookmarkPlus size={14} />
                  <span>Uslubni saqlash</span>
                </button>
                <button
                  type="button"
                  className="design-action-btn-secondary"
                  onClick={handleTriggerImport}
                  title="Tashqi .json uslub faylini yuklash"
                >
                  <Upload size={14} />
                  <span>Uslub yuklash</span>
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  style={{ display: 'none' }}
                  accept=".json,application/json"
                  onChange={handleFileChange}
                />
              </div>

              {/* Inline nom berish va saqlash oynasi */}
              {isSavingCustomStyle && (
                <form className="design-save-inline-card" onSubmit={handleSaveCustom}>
                  <div className="design-save-title">Joriy uslubni saqlash</div>
                  <input
                    type="text"
                    className="design-save-input"
                    placeholder="Uslub nomi (masalan: Mening TDYU uslubim)"
                    value={newStyleName}
                    onChange={(e) => setNewStyleName(e.target.value)}
                    autoFocus
                  />
                  <div className="design-save-actions-row">
                    <button
                      type="button"
                      className="design-save-cancel-btn"
                      onClick={() => {
                        setIsSavingCustomStyle(false);
                        setNewStyleName('');
                      }}
                    >
                      Bekor qilish
                    </button>
                    <button
                      type="submit"
                      className="design-save-confirm-btn"
                      disabled={!newStyleName.trim()}
                    >
                      Saqlash
                    </button>
                  </div>
                </form>
              )}

              {/* Kategoriya Tanlash Tugmalari (Filter Pills) */}
              <div className="design-preset-filter-pills" role="tablist">
                <button
                  type="button"
                  className={`design-filter-pill-btn ${presetCategory === 'custom' ? 'active' : ''}`}
                  onClick={() => setPresetCategory('custom')}
                >
                  Mening uslublarim ({customStylesList.length})
                </button>
                <button
                  type="button"
                  className={`design-filter-pill-btn ${presetCategory === 'colors' ? 'active' : ''}`}
                  onClick={() => setPresetCategory('colors')}
                >
                  Ranglar (24)
                  {activeColorPresetId && isColorPresetTweaked && ' •'}
                </button>
                <button
                  type="button"
                  className={`design-filter-pill-btn ${presetCategory === 'typography' ? 'active' : ''}`}
                  onClick={() => setPresetCategory('typography')}
                >
                  Shriftlar (8)
                  {activeTypoPresetId && isTypoPresetTweaked && ' •'}
                </button>
                <button
                  type="button"
                  className={`design-filter-pill-btn ${presetCategory === 'density' ? 'active' : ''}`}
                  onClick={() => setPresetCategory('density')}
                >
                  Zichlik (6)
                  {activeDensityPresetId && isDensityPresetTweaked && ' •'}
                </button>
                <button
                  type="button"
                  className={`design-filter-pill-btn ${presetCategory === 'cover' ? 'active' : ''}`}
                  onClick={() => setPresetCategory('cover')}
                >
                  Muqova (6)
                  {activeCoverPresetId && isCoverPresetTweaked && ' •'}
                </button>
              </div>

              {/* 0. MENING USLUBLARIM GRIDI (Custom Styles) */}
              {presetCategory === 'custom' && (
                <div className="design-preset-grid" aria-label="Mening shaxsiy uslublarim">
                  {customStylesList.length === 0 ? (
                    <div className="custom-style-empty-state" style={{ gridColumn: '1 / -1' }}>
                      <div className="custom-style-empty-text">
                        Hozircha saqlangan maxsus uslublar yo‘q.<br />
                        Yuqoridagi <strong>"Uslubni saqlash"</strong> tugmasini bosib, joriy dizayningizni saqlang.
                      </div>
                      <button
                        type="button"
                        className="design-action-btn-primary"
                        style={{ margin: '0 auto', maxWidth: 190 }}
                        onClick={() => setIsSavingCustomStyle(true)}
                      >
                        <BookmarkPlus size={13} />
                        <span>Birinchi uslubni saqlash</span>
                      </button>
                    </div>
                  ) : (
                    customStylesList.map((style) => {
                      const isSelected = activeCustomStyleId === style.id;
                      const bg = style.tokens['doc_bg'] || '#FAF8F5';
                      const ink = style.tokens['doc_ink'] || '#1C2430';
                      const accent = style.tokens['doc_accent'] || '#1B2A4A';
                      const border = style.tokens['doc_border'] || '#E3D9CC';

                      return (
                        <div
                          key={style.id}
                          className={`design-custom-style-card ${isSelected ? 'active' : ''}`}
                          onClick={() => handleApplyCustom(style)}
                          title={`${style.name} uslubini qo‘llash`}
                        >
                          <div
                            className="preset-thumb-card"
                            style={{
                              backgroundColor: bg,
                              border: `1px solid ${border}`
                            }}
                          >
                            <div
                              className="preset-thumb-header-stripe"
                              style={{ backgroundColor: accent }}
                            />
                            <div className="preset-thumb-lines">
                              <div
                                className="preset-thumb-line"
                                style={{ backgroundColor: ink }}
                              />
                              <div
                                className="preset-thumb-line short"
                                style={{ backgroundColor: ink }}
                              />
                            </div>
                          </div>

                          {renamingStyleId === style.id ? (
                            <div
                              style={{ display: 'flex', gap: 4, marginTop: 4 }}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <input
                                type="text"
                                className="design-save-input"
                                style={{ padding: '3px 6px', fontSize: 11, marginBottom: 0 }}
                                value={renamingStyleName}
                                onChange={(e) => setRenamingStyleName(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleRenameCustom(style.id);
                                  if (e.key === 'Escape') setRenamingStyleId(null);
                                }}
                                autoFocus
                              />
                              <button
                                type="button"
                                className="design-save-confirm-btn"
                                style={{ padding: '2px 6px', fontSize: 10 }}
                                onClick={() => handleRenameCustom(style.id)}
                              >
                                OK
                              </button>
                            </div>
                          ) : (
                            <div className="custom-style-header">
                              <span className="custom-style-name" title={style.name}>
                                {style.name}
                              </span>
                              <div className="custom-style-action-icons" onClick={(e) => e.stopPropagation()}>
                                <button
                                  type="button"
                                  className="custom-style-icon-btn"
                                  title="Nomini o‘zgartirish"
                                  onClick={() => {
                                    setRenamingStyleId(style.id);
                                    setRenamingStyleName(style.name);
                                  }}
                                >
                                  <Pencil size={11} />
                                </button>
                                <button
                                  type="button"
                                  className="custom-style-icon-btn"
                                  title="Uslubni yuklab olish (.json)"
                                  onClick={(e) => handleExportCustom(e, style)}
                                >
                                  <Download size={11} />
                                </button>
                                <button
                                  type="button"
                                  className="custom-style-icon-btn delete"
                                  title="O‘chirish"
                                  onClick={() => handleDeleteCustom(style.id, style.name)}
                                >
                                  <Trash2 size={11} />
                                </button>
                                {isSelected && (
                                  <Check size={12} strokeWidth={2.5} className="preset-active-check" />
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              )}

              {/* 1. RANGLAR SXEMASI GRIDI (24 ta jonli miniatyura kartochkasi) */}
              {presetCategory === 'colors' && (
                <div className="design-preset-grid" aria-label="Rang sxemalari gridi">
                  {COLOR_SCHEME_PRESETS.map((preset) => {
                    const isSelected = activeColorPresetId === preset.id;
                    const isTweaked = isSelected && isColorPresetTweaked;

                    return (
                      <button
                        key={preset.id}
                        type="button"
                        className={`design-color-preset-card ${isSelected ? 'active' : ''}`}
                        onClick={() => applyColorScheme(preset)}
                        title={`${preset.name}: ${preset.description}`}
                      >
                        <div
                          className="preset-thumb-card"
                          style={{
                            backgroundColor: preset.tokens.doc_bg,
                            border: `1px solid ${preset.tokens.doc_border}`
                          }}
                        >
                          <div
                            className="preset-thumb-header-stripe"
                            style={{ backgroundColor: preset.tokens.doc_accent }}
                          />
                          <div className="preset-thumb-lines">
                            <div
                              className="preset-thumb-line"
                              style={{ backgroundColor: preset.tokens.doc_ink, width: '80%' }}
                            />
                            <div
                              className="preset-thumb-line short"
                              style={{ backgroundColor: preset.tokens.doc_ink }}
                            />
                          </div>
                        </div>

                        <div className="preset-card-footer">
                          <span className="preset-card-name">{preset.name}</span>
                          {isSelected && (
                            isTweaked ? (
                              <span className="preset-tweaked-badge" title="Foydalanuvchi tomonidan o‘zgartirilgan">
                                O'zgartirilgan
                              </span>
                            ) : (
                              <Check size={12} strokeWidth={2.5} className="preset-active-check" />
                            )
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* 2. TIPOGRAFIKA JUFTLIKLARI GRIDI (8 ta jonli kartochka) */}
              {presetCategory === 'typography' && (
                <div className="design-preset-grid-1col" aria-label="Tipografika juftliklari gridi">
                  {TYPOGRAPHY_PAIR_PRESETS.map((preset) => {
                    const isSelected = activeTypoPresetId === preset.id;
                    const isTweaked = isSelected && isTypoPresetTweaked;

                    return (
                      <button
                        key={preset.id}
                        type="button"
                        className={`design-typo-preset-card ${isSelected ? 'active' : ''}`}
                        onClick={() => applyTypography(preset)}
                        title={preset.description}
                      >
                        <div
                          className="preset-typo-sample-heading"
                          style={{ fontFamily: preset.headingFont }}
                        >
                          {preset.previewHeading}
                        </div>
                        <div
                          className="preset-typo-sample-body"
                          style={{ fontFamily: preset.bodyFont }}
                        >
                          {preset.previewBody}
                        </div>
                        <div className="preset-typo-meta">
                          <span className="preset-typo-name">{preset.name}</span>
                          {isSelected && (
                            isTweaked ? (
                              <span className="preset-tweaked-badge">O'zgartirilgan</span>
                            ) : (
                              <Check size={12} strokeWidth={2.5} className="preset-active-check" />
                            )
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* 3. TARTIB ZICHLIGI (6 ta parametr) */}
              {presetCategory === 'density' && (
                <div className="design-preset-grid-1col" aria-label="Zichlik sozlamalari">
                  {LAYOUT_DENSITY_PRESETS.map((preset) => {
                    const isSelected = activeDensityPresetId === preset.id;
                    const isTweaked = isSelected && isDensityPresetTweaked;

                    return (
                      <button
                        key={preset.id}
                        type="button"
                        className={`design-density-preset-card ${isSelected ? 'active' : ''}`}
                        onClick={() => applyDensity(preset)}
                      >
                        <div className="preset-density-info">
                          <span className="preset-density-name">{preset.name}</span>
                          <span className="preset-density-desc">{preset.description}</span>
                        </div>
                        {isSelected && (
                          isTweaked ? (
                            <span className="preset-tweaked-badge">O'zgartirilgan</span>
                          ) : (
                            <Check size={14} strokeWidth={2.5} className="preset-active-check" />
                          )
                        )}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* 4. MUQOVA TARTIBI (6 ta kompozitsiya) */}
              {presetCategory === 'cover' && (
                <div className="design-preset-grid-1col" aria-label="Muqova tartibi sozlamalari">
                  {COVER_LAYOUT_PRESETS.map((preset) => {
                    const isSelected = activeCoverPresetId === preset.id;
                    const isTweaked = isSelected && isCoverPresetTweaked;

                    return (
                      <button
                        key={preset.id}
                        type="button"
                        className={`design-cover-preset-card ${isSelected ? 'active' : ''}`}
                        onClick={() => applyCover(preset)}
                      >
                        <div className="preset-density-info">
                          <span className="preset-density-name">{preset.name}</span>
                          <span className="preset-density-desc">{preset.description}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span className="preset-cover-badge">{preset.badge}</span>
                          {isSelected && (
                            isTweaked ? (
                              <span className="preset-tweaked-badge">O'zgartirilgan</span>
                            ) : (
                              <Check size={14} strokeWidth={2.5} className="preset-active-check" />
                            )
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="design-divider" />
            <div className="design-group-title">Qo‘lda nozik sozlash (Manual Fine-Tuning)</div>

            {/* Qog'oz rangi (doc_bg) */}
            <ColorControlRow
              label="Qog‘oz rangi"
              id="doc_bg"
              value={tokenValues['doc_bg'] || '#FAF8F5'}
              presets={PAPER_PRESETS}
              isOverridden={isOverridden('doc_bg')}
              onChange={(val) => handleChange('doc_bg', val)}
              onReset={() => handleResetSingle('doc_bg')}
            />

            {/* Matn rangi (doc_ink) */}
            <ColorControlRow
              label="Matn siyohi"
              id="doc_ink"
              value={tokenValues['doc_ink'] || '#1C2430'}
              presets={INK_PRESETS}
              isOverridden={isOverridden('doc_ink')}
              onChange={(val) => handleChange('doc_ink', val)}
              onReset={() => handleResetSingle('doc_ink')}
            />

            {/* Urg'u rangi (doc_accent) */}
            <ColorControlRow
              label="Urg‘u rangi"
              id="doc_accent"
              value={tokenValues['doc_accent'] || '#1B2A4A'}
              presets={ACCENT_PRESETS}
              isOverridden={isOverridden('doc_accent')}
              onChange={(val) => handleChange('doc_accent', val)}
              onReset={() => handleResetSingle('doc_accent')}
            />

            {/* Hoshiya rangi (doc_border) */}
            <ColorControlRow
              label="Hoshiya chegarasi"
              id="doc_border"
              value={tokenValues['doc_border'] || '#E3D9CC'}
              presets={BORDER_PRESETS}
              isOverridden={isOverridden('doc_border')}
              onChange={(val) => handleChange('doc_border', val)}
              onReset={() => handleResetSingle('doc_border')}
            />

            <div className="design-divider" />
            <div className="design-group-title">Shriftlar va Tipografika</div>

            {/* Sarlavha shrifti (doc_font_heading) */}
            <SelectControlRow
              label="Sarlavha shrifti"
              id="doc_font_heading"
              value={tokenValues['doc_font_heading'] || "'Lora', Georgia, serif"}
              options={FONT_OPTIONS}
              isOverridden={isOverridden('doc_font_heading')}
              onChange={(val) => handleChange('doc_font_heading', val)}
              onReset={() => handleResetSingle('doc_font_heading')}
            />

            {/* Matn shrifti (doc_font_body) */}
            <SelectControlRow
              label="Asosiy matn shrifti"
              id="doc_font_body"
              value={tokenValues['doc_font_body'] || "'Lora', Georgia, serif"}
              options={FONT_OPTIONS}
              isOverridden={isOverridden('doc_font_body')}
              onChange={(val) => handleChange('doc_font_body', val)}
              onReset={() => handleResetSingle('doc_font_body')}
            />

            {/* Asosiy matn o'lchami slayderi (canvas_font_body: 28px - 48px) */}
            <SliderControlRow
              label="Matn o‘lchami (Canvas)"
              id="canvas_font_body"
              min={28}
              max={48}
              step={1}
              unit="px"
              value={parseNum(tokenValues['canvas_font_body'], 42)}
              displayValue={`${parseNum(tokenValues['canvas_font_body'], 42)}px`}
              isOverridden={isOverridden('canvas_font_body')}
              onChange={(val) => handleChange('canvas_font_body', `${val}px`)}
              onReset={() => handleResetSingle('canvas_font_body')}
            />

            {/* Qator oralig'i slayderi (doc_line_height: 1.2 - 2.2) */}
            <SliderControlRow
              label="Qator oralig‘i"
              id="doc_line_height"
              min={1.2}
              max={2.2}
              step={0.1}
              value={parseNum(tokenValues['doc_line_height'], 1.6)}
              displayValue={`${parseNum(tokenValues['doc_line_height'], 1.6).toFixed(1)}`}
              isOverridden={isOverridden('doc_line_height')}
              onChange={(val) => handleChange('doc_line_height', val.toString())}
              onReset={() => handleResetSingle('doc_line_height')}
            />

            <div className="design-divider" />
            <div className="design-group-title">Hoshiya va Geometriya</div>

            {/* Kartochka ichki oralig'i (doc_padding_card: 40px - 100px) */}
            <SliderControlRow
              label="Kartochka ichki oralig‘i"
              id="doc_padding_card"
              min={40}
              max={100}
              step={2}
              unit="px"
              value={parseNum(tokenValues['doc_padding_card'], 70)}
              displayValue={`${parseNum(tokenValues['doc_padding_card'], 70)}px`}
              isOverridden={isOverridden('doc_padding_card')}
              onChange={(val) => handleChange('doc_padding_card', `${Math.round(val * 1.14)}px ${val}px`)}
              onReset={() => handleResetSingle('doc_padding_card')}
            />

            {/* Kartochka burchak radiusi (doc_radius_card: 0px - 60px) */}
            <SliderControlRow
              label="Burchak radiusi"
              id="doc_radius_card"
              min={0}
              max={60}
              step={2}
              unit="px"
              value={parseNum(tokenValues['doc_radius_card'], 36)}
              displayValue={`${parseNum(tokenValues['doc_radius_card'], 36)}px`}
              isOverridden={isOverridden('doc_radius_card')}
              onChange={(val) => handleChange('doc_radius_card', `${val}px`)}
              onReset={() => handleResetSingle('doc_radius_card')}
            />
          </div>
        )}

        {/* ===================================================================
            2-TAB: INTERFEYS (UI CHROME EDITING)
           =================================================================== */}
        {activeTab === 'interfeys' && (
          <div className="design-tab-content">
            <div className="design-group-title">Interfeys ranglari</div>

            {/* Asosiy urg'u rangi (ui_accent) */}
            <ColorControlRow
              label="Asosiy urg‘u rangi"
              id="ui_accent"
              value={tokenValues['ui_accent'] || '#1B2A4A'}
              presets={ACCENT_PRESETS}
              isOverridden={isOverridden('ui_accent')}
              onChange={(val) => handleChange('ui_accent', val)}
              onReset={() => handleResetSingle('ui_accent')}
            />

            {/* Fon tusi (ui_bg) */}
            <ColorControlRow
              label="Interfeys foni"
              id="ui_bg"
              value={tokenValues['ui_bg'] || '#F7F5F1'}
              presets={PAPER_PRESETS}
              isOverridden={isOverridden('ui_bg')}
              onChange={(val) => handleChange('ui_bg', val)}
              onReset={() => handleResetSingle('ui_bg')}
            />

            {/* Chegara kuchi (ui_line) */}
            <ColorControlRow
              label="Chegara kuchi / rangi"
              id="ui_line"
              value={tokenValues['ui_line'] || '#E2DDD5'}
              presets={BORDER_STRENGTH_PRESETS}
              isOverridden={isOverridden('ui_line')}
              onChange={(val) => handleChange('ui_line', val)}
              onReset={() => handleResetSingle('ui_line')}
            />

            <div className="design-divider" />
            <div className="design-group-title">Masshtab va Zichlik</div>

            {/* UI matn o'lchami (S / M / L) */}
            <SegmentedControlRow
              label="UI shrift o‘lchami"
              id="ui_font_size"
              value={tokenValues['ui_font_size'] || 'M'}
              options={[
                { label: 'S (12px)', value: 'S' },
                { label: 'M (Standart)', value: 'M' },
                { label: 'L (15px)', value: 'L' }
              ]}
              isOverridden={isOverridden('ui_font_size')}
              onChange={(val) => handleChange('ui_font_size', val)}
              onReset={() => handleResetSingle('ui_font_size')}
            />

            {/* Interfeys zichligi (Ixcham / Standart / Keng) */}
            <SegmentedControlRow
              label="Interfeys zichligi"
              id="ui_density"
              value={tokenValues['ui_density'] || 'normal'}
              options={[
                { label: 'Ixcham', value: 'compact' },
                { label: 'O‘rtacha', value: 'normal' },
                { label: 'Keng', value: 'comfortable' }
              ]}
              isOverridden={isOverridden('ui_density')}
              onChange={(val) => handleChange('ui_density', val)}
              onReset={() => handleResetSingle('ui_density')}
            />
          </div>
        )}

        {/* ===================================================================
            3-TAB: MUHARRIR (EDITOR EDITING)
           =================================================================== */}
        {activeTab === 'muharrir' && (
          <div className="design-tab-content">
            <div className="design-group-title">Muharrir matni</div>

            {/* Muharrir matn o'lchami (editor_font_size: 11px - 22px) */}
            <SliderControlRow
              label="Shrift o‘lchami"
              id="editor_font_size"
              min={11}
              max={22}
              step={0.5}
              unit="px"
              value={parseNum(tokenValues['editor_font_size'], 14)}
              displayValue={`${parseNum(tokenValues['editor_font_size'], 14)}px`}
              isOverridden={isOverridden('editor_font_size')}
              onChange={(val) => handleChange('editor_font_size', `${val}px`)}
              onReset={() => handleResetSingle('editor_font_size')}
            />

            {/* Muharrir qator balandligi (editor_line_height: 1.2 - 2.2) */}
            <SliderControlRow
              label="Qator balandligi"
              id="editor_line_height"
              min={1.2}
              max={2.2}
              step={0.05}
              value={parseNum(tokenValues['editor_line_height'], 1.65)}
              displayValue={`${parseNum(tokenValues['editor_line_height'], 1.65).toFixed(2)}`}
              isOverridden={isOverridden('editor_line_height')}
              onChange={(val) => handleChange('editor_line_height', val.toString())}
              onReset={() => handleResetSingle('editor_line_height')}
            />

            <div className="design-divider" />
            <div className="design-group-title">Muharrir foni</div>

            {/* Muharrir fon rangi (editor_bg) */}
            <ColorControlRow
              label="Fon tusi"
              id="editor_bg"
              value={tokenValues['editor_bg'] || '#FAF8F5'}
              presets={EDITOR_BG_PRESETS}
              isOverridden={isOverridden('editor_bg')}
              onChange={(val) => handleChange('editor_bg', val)}
              onReset={() => handleResetSingle('editor_bg')}
            />
          </div>
        )}
      </div>

      {/* Footer ma'lumot */}
      <div className="design-panel-footer">
        <Sparkles size={13} className="design-footer-icon" />
        <span>Barcha o‘zgarishlar darhol jonli aks etadi va avtomatik saqlanadi.</span>
      </div>
    </aside>
  );
};

// =============================================================================
// YORDAMCHI MODUL KOMPONENTLARI (CONTROL ROWS)
// =============================================================================

interface ColorControlRowProps {
  label: string;
  id: string;
  value: string;
  presets: { label: string; color: string }[];
  isOverridden: boolean;
  onChange: (color: string) => void;
  onReset: () => void;
}

const ColorControlRow: React.FC<ColorControlRowProps> = ({
  label,
  id,
  value,
  presets,
  isOverridden,
  onChange,
  onReset
}) => {
  return (
    <div className="design-control-row">
      <div className="design-control-header">
        <label htmlFor={`color-${id}`} className="design-control-label">
          {label}
        </label>
        <div className="design-control-header-right">
          <span className="design-color-hex">{value.toUpperCase()}</span>
          <button
            type="button"
            className={`design-reset-item-btn ${isOverridden ? 'has-override' : ''}`}
            onClick={onReset}
            disabled={!isOverridden}
            title="Standart qiymatga qaytarish"
            aria-label={`${label}ni standartga qaytarish`}
          >
            <RotateCcw size={11} />
          </button>
        </div>
      </div>

      <div className="design-color-row-body">
        {/* Asosiy rang tanlagich swatch (HTML5 native color picker wrapper) */}
        <label className="design-color-swatch-box" title="Rang tanlash">
          <input
            id={`color-${id}`}
            type="color"
            value={value.startsWith('#') && value.length === 7 ? value : '#000000'}
            onChange={(e) => onChange(e.target.value)}
            className="design-hidden-color-input"
          />
          <span className="design-swatch-circle" style={{ backgroundColor: value }} />
        </label>

        {/* Tezkor preset tugmalari */}
        <div className="design-color-presets">
          {presets.map((p) => {
            const isSelected = p.color.toLowerCase() === value.toLowerCase();
            return (
              <button
                key={p.color}
                type="button"
                className={`design-preset-dot ${isSelected ? 'active' : ''}`}
                style={{ backgroundColor: p.color }}
                onClick={() => onChange(p.color)}
                title={`${p.label} (${p.color})`}
              >
                {isSelected && <Check size={10} strokeWidth={3} className="design-preset-check" />}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

interface SelectControlRowProps {
  label: string;
  id: string;
  value: string;
  options: { label: string; value: string }[];
  isOverridden: boolean;
  onChange: (val: string) => void;
  onReset: () => void;
}

const SelectControlRow: React.FC<SelectControlRowProps> = ({
  label,
  id,
  value,
  options,
  isOverridden,
  onChange,
  onReset
}) => {
  return (
    <div className="design-control-row">
      <div className="design-control-header">
        <label htmlFor={`select-${id}`} className="design-control-label">
          {label}
        </label>
        <button
          type="button"
          className={`design-reset-item-btn ${isOverridden ? 'has-override' : ''}`}
          onClick={onReset}
          disabled={!isOverridden}
          title="Standart qiymatga qaytarish"
          aria-label={`${label}ni standartga qaytarish`}
        >
          <RotateCcw size={11} />
        </button>
      </div>

      <div className="design-select-wrap">
        <select
          id={`select-${id}`}
          className="design-select-control"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

interface SliderControlRowProps {
  label: string;
  id: string;
  min: number;
  max: number;
  step: number;
  unit?: string;
  value: number;
  displayValue: string;
  isOverridden: boolean;
  onChange: (val: number) => void;
  onReset: () => void;
}

const SliderControlRow: React.FC<SliderControlRowProps> = ({
  label,
  id,
  min,
  max,
  step,
  value,
  displayValue,
  isOverridden,
  onChange,
  onReset
}) => {
  return (
    <div className="design-control-row">
      <div className="design-control-header">
        <label htmlFor={`slider-${id}`} className="design-control-label">
          {label}
        </label>
        <div className="design-control-header-right">
          <span className="design-slider-value">{displayValue}</span>
          <button
            type="button"
            className={`design-reset-item-btn ${isOverridden ? 'has-override' : ''}`}
            onClick={onReset}
            disabled={!isOverridden}
            title="Standart qiymatga qaytarish"
            aria-label={`${label}ni standartga qaytarish`}
          >
            <RotateCcw size={11} />
          </button>
        </div>
      </div>

      <div className="design-slider-wrap">
        <input
          id={`slider-${id}`}
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className="design-range-input"
        />
        <div className="design-slider-bounds">
          <span>{min}</span>
          <span>{max}</span>
        </div>
      </div>
    </div>
  );
};

interface SegmentedControlRowProps {
  label: string;
  id: string;
  value: string;
  options: { label: string; value: string }[];
  isOverridden: boolean;
  onChange: (val: string) => void;
  onReset: () => void;
}

const SegmentedControlRow: React.FC<SegmentedControlRowProps> = ({
  label,
  value,
  options,
  isOverridden,
  onChange,
  onReset
}) => {
  return (
    <div className="design-control-row">
      <div className="design-control-header">
        <span className="design-control-label">{label}</span>
        <button
          type="button"
          className={`design-reset-item-btn ${isOverridden ? 'has-override' : ''}`}
          onClick={onReset}
          disabled={!isOverridden}
          title="Standart qiymatga qaytarish"
          aria-label={`${label}ni standartga qaytarish`}
        >
          <RotateCcw size={11} />
        </button>
      </div>

      <div className="design-segmented-group">
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            className={`design-segmented-btn ${value === opt.value ? 'active' : ''}`}
            onClick={() => onChange(opt.value)}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
};
