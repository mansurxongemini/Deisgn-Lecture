/**
 * YURIST STUDIO — RUNTIME DESIGN TOKEN REGISTRY
 *
 * Ilovaning barcha tashqi ko‘rinishi (UI Chrome) va o‘quv kartochkalari (Document Cards)
 * uchun yagona, qat’iy tiplashtirilgan dizayn tokenlari reestri.
 */

export type TokenCategory =
  | 'color'
  | 'typography'
  | 'spacing'
  | 'radius'
  | 'shadow'
  | 'layout';

export type TokenType = 'color' | 'size' | 'font' | 'spacing' | 'radius' | 'shadow';

export type TokenScope = 'ui' | 'doc';

export interface DesignToken {
  id: string;
  cssVar: string;
  label: string; // O‘zbekcha aniq tavsif
  category: TokenCategory;
  type: TokenType;
  defaultValue: string;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  scope: TokenScope; // 'ui' (interfeys) yoki 'doc' (o‘quv kartochkalari)
  description?: string;
}

export const DESIGN_TOKENS: DesignToken[] = [
  // =========================================================================
  // 1. ILOVA INTERFEYSI (UI CHROME) — RANGLAR
  // =========================================================================
  {
    id: 'ui_bg',
    cssVar: '--bg',
    label: 'Ilova asosiy fon rangi',
    category: 'color',
    type: 'color',
    defaultValue: '#F7F5F1',
    scope: 'ui',
    description: 'Ilova darchasining umumiy tashqi foni'
  },
  {
    id: 'ui_surface',
    cssVar: '--surface',
    label: 'Panel va sirtlar foni',
    category: 'color',
    type: 'color',
    defaultValue: '#FFFFFF',
    scope: 'ui',
    description: 'Yuqori navbar, yon panel va modal sirtlar'
  },
  {
    id: 'ui_surface_2',
    cssVar: '--surface-2',
    label: 'Ikkinchi darajali sirt foni',
    category: 'color',
    type: 'color',
    defaultValue: '#FAF8F5',
    scope: 'ui',
    description: 'Tugmalar va bloklar uchun yumshoq ichki fon'
  },
  {
    id: 'ui_paper',
    cssVar: '--paper',
    label: 'Qog‘oz foni',
    category: 'color',
    type: 'color',
    defaultValue: '#FAF8F5',
    scope: 'ui',
    description: 'Qog‘oz uslubidagi orqa fon'
  },
  {
    id: 'ui_ink',
    cssVar: '--ink',
    label: 'Asosiy matn rangi',
    category: 'color',
    type: 'color',
    defaultValue: '#1C2430',
    scope: 'ui',
    description: 'Interfeysdagi barcha asosiy matnlar'
  },
  {
    id: 'ui_ink_2',
    cssVar: '--ink-2',
    label: 'Ikkinchi darajali matn rangi',
    category: 'color',
    type: 'color',
    defaultValue: '#5C6470',
    scope: 'ui',
    description: 'Yordamchi, izoh va menyu matnlari'
  },
  {
    id: 'ui_ink_3',
    cssVar: '--ink-3',
    label: 'Xira matn rangi',
    category: 'color',
    type: 'color',
    defaultValue: '#5E6775',
    scope: 'ui',
    description: 'Placeholder va nofaol elementlar matni'
  },
  {
    id: 'ui_line',
    cssVar: '--line',
    label: 'Asosiy chegara chizig‘i',
    category: 'color',
    type: 'color',
    defaultValue: '#E3D9CC',
    scope: 'ui',
    description: 'Panellar va kartalar orasidagi ajratuvchi chiziq'
  },
  {
    id: 'ui_line_soft',
    cssVar: '--line-soft',
    label: 'Yumshoq chegara chizig‘i',
    category: 'color',
    type: 'color',
    defaultValue: '#EEE7DD',
    scope: 'ui',
    description: 'Kichik elementlar orasidagi mayin chiziq'
  },
  {
    id: 'ui_accent',
    cssVar: '--accent',
    label: 'Asosiy urg‘u rangi (Navy)',
    category: 'color',
    type: 'color',
    defaultValue: '#1B2A4A',
    scope: 'ui',
    description: 'Faol tugmalar va tanlangan elementlar'
  },
  {
    id: 'ui_accent_hover',
    cssVar: '--accent-hover',
    label: 'Urg‘u hover holati',
    category: 'color',
    type: 'color',
    defaultValue: '#24375F',
    scope: 'ui',
    description: 'Tugmaga sichqoncha kelgandagi rang'
  },
  {
    id: 'ui_accent_active',
    cssVar: '--accent-active',
    label: 'Urg‘u faol bosilish holati',
    category: 'color',
    type: 'color',
    defaultValue: '#142038',
    scope: 'ui',
    description: 'Tugma bosilgan paytdagi chuqur rang'
  },
  {
    id: 'ui_on_accent',
    cssVar: '--on-accent',
    label: 'Urg‘u ustidagi matn rangi',
    category: 'color',
    type: 'color',
    defaultValue: '#FFFFFF',
    scope: 'ui',
    description: 'To‘q urg‘u tugmasi ustidagi yozuv'
  },
  {
    id: 'ui_accent_soft',
    cssVar: '--accent-soft',
    label: 'Yumshoq urg‘u foni',
    category: 'color',
    type: 'color',
    defaultValue: 'rgba(27, 42, 74, 0.06)',
    scope: 'ui',
    description: 'Yengil navy aksent foni'
  },
  {
    id: 'ui_bronze',
    cssVar: '--bronze',
    label: 'Bronza bezak rangi',
    category: 'color',
    type: 'color',
    defaultValue: '#9E7D3B',
    scope: 'ui',
    description: 'Yuridik bezak va nafis hoshiyalar'
  },
  {
    id: 'ui_bronze_text',
    cssVar: '--bronze-text',
    label: 'Bronza matn rangi',
    category: 'color',
    type: 'color',
    defaultValue: '#7A5F2A',
    scope: 'ui',
    description: 'Yuqori kontrastli bronza matn'
  },
  {
    id: 'ui_bronze_soft',
    cssVar: '--bronze-soft',
    label: 'Bronza yumshoq foni',
    category: 'color',
    type: 'color',
    defaultValue: '#F5EFE4',
    scope: 'ui',
    description: 'Maslahat va eslatmalar foni'
  },
  {
    id: 'ui_success',
    cssVar: '--success',
    label: 'Muvaffaqiyat rangi',
    category: 'color',
    type: 'color',
    defaultValue: '#3F7A55',
    scope: 'ui',
    description: 'Muvaffaqiyatli saqlash va to‘g‘ri javoblar'
  },
  {
    id: 'ui_success_bg',
    cssVar: '--success-bg',
    label: 'Muvaffaqiyat foni',
    category: 'color',
    type: 'color',
    defaultValue: '#EDF5F0',
    scope: 'ui',
    description: 'Muvaffaqiyat xabarlari foni'
  },
  {
    id: 'ui_success_border',
    cssVar: '--success-border',
    label: 'Muvaffaqiyat chegarasi',
    category: 'color',
    type: 'color',
    defaultValue: '#9DC3AC',
    scope: 'ui',
    description: 'Muvaffaqiyat xabarlari hoshiyasi'
  },
  {
    id: 'ui_warning',
    cssVar: '--warning',
    label: 'Ogohlantirish rangi',
    category: 'color',
    type: 'color',
    defaultValue: '#9A6B1F',
    scope: 'ui',
    description: 'Saqlanmoqda yoki ziddiyat ogohlantirishlari'
  },
  {
    id: 'ui_warning_bg',
    cssVar: '--warning-bg',
    label: 'Ogohlantirish foni',
    category: 'color',
    type: 'color',
    defaultValue: '#FBF6EB',
    scope: 'ui',
    description: 'Ogohlantirish bildirishnomasi foni'
  },
  {
    id: 'ui_warning_border',
    cssVar: '--warning-border',
    label: 'Ogohlantirish chegarasi',
    category: 'color',
    type: 'color',
    defaultValue: '#DCBF87',
    scope: 'ui',
    description: 'Ogohlantirish bildirishnomasi chegarasi'
  },
  {
    id: 'ui_danger',
    cssVar: '--danger',
    label: 'Xatolik rangi',
    category: 'color',
    type: 'color',
    defaultValue: '#B3564D',
    scope: 'ui',
    description: 'Xatolik va bekor qilish belgilari'
  },
  {
    id: 'ui_danger_bg',
    cssVar: '--danger-bg',
    label: 'Xatolik foni',
    category: 'color',
    type: 'color',
    defaultValue: '#FDF2F0',
    scope: 'ui',
    description: 'Xatolik bildirishnomasi foni'
  },
  {
    id: 'ui_danger_border',
    cssVar: '--danger-border',
    label: 'Xatolik chegarasi',
    category: 'color',
    type: 'color',
    defaultValue: '#E8A8A1',
    scope: 'ui',
    description: 'Xatolik bildirishnomasi chegarasi'
  },

  // =========================================================================
  // 2. ILOVA INTERFEYSI — SHRIFTLAR VA O‘LCHAMLAR
  // =========================================================================
  {
    id: 'ui_font_sans',
    cssVar: '--font-sans',
    label: 'Interfeys asosiy shrifti',
    category: 'typography',
    type: 'font',
    defaultValue: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    scope: 'ui',
    description: 'Interfeys tugmalari, menyular va sarlavhalar shrifti'
  },
  {
    id: 'ui_font_serif',
    cssVar: '--font-serif',
    label: 'Kitobiy serif shrift',
    category: 'typography',
    type: 'font',
    defaultValue: "'Lora', Georgia, 'Times New Roman', serif",
    scope: 'ui',
    description: 'Akademik va kitobiy nashriyot shrifti'
  },
  {
    id: 'ui_font_mono',
    cssVar: '--font-mono',
    label: 'Monospace kod shrifti',
    category: 'typography',
    type: 'font',
    defaultValue: "ui-monospace, 'SFMono-Regular', Menlo, Monaco, Consolas, monospace",
    scope: 'ui',
    description: 'Kod va qisqa klavishlar shrifti'
  },
  {
    id: 'ui_font_size_11',
    cssVar: '--ui-font-size-11',
    label: 'Juda kichik matn (11px)',
    category: 'typography',
    type: 'size',
    defaultValue: '11px',
    min: 9,
    max: 14,
    step: 1,
    unit: 'px',
    scope: 'ui'
  },
  {
    id: 'ui_font_size_12',
    cssVar: '--ui-font-size-12',
    label: 'Kichik matn (12px)',
    category: 'typography',
    type: 'size',
    defaultValue: '12px',
    min: 10,
    max: 15,
    step: 1,
    unit: 'px',
    scope: 'ui'
  },
  {
    id: 'ui_font_size_13',
    cssVar: '--ui-font-size-13',
    label: 'Menyu va yorliq matni (13px)',
    category: 'typography',
    type: 'size',
    defaultValue: '13px',
    min: 11,
    max: 16,
    step: 1,
    unit: 'px',
    scope: 'ui'
  },
  {
    id: 'ui_font_size_14',
    cssVar: '--ui-font-size-14',
    label: 'Standart interfeys matni (14px)',
    category: 'typography',
    type: 'size',
    defaultValue: '14px',
    min: 12,
    max: 18,
    step: 1,
    unit: 'px',
    scope: 'ui'
  },
  {
    id: 'ui_font_size_15',
    cssVar: '--ui-font-size-15',
    label: 'O‘rta interfeys matni (15px)',
    category: 'typography',
    type: 'size',
    defaultValue: '15px',
    min: 13,
    max: 19,
    step: 1,
    unit: 'px',
    scope: 'ui'
  },
  {
    id: 'ui_font_size_16',
    cssVar: '--ui-font-size-16',
    label: 'Katta interfeys matni (16px)',
    category: 'typography',
    type: 'size',
    defaultValue: '16px',
    min: 14,
    max: 20,
    step: 1,
    unit: 'px',
    scope: 'ui'
  },
  {
    id: 'ui_font_size_18',
    cssVar: '--ui-font-size-18',
    label: 'Kichik sarlavha (18px)',
    category: 'typography',
    type: 'size',
    defaultValue: '18px',
    min: 16,
    max: 24,
    step: 1,
    unit: 'px',
    scope: 'ui'
  },
  {
    id: 'ui_font_size_20',
    cssVar: '--ui-font-size-20',
    label: 'O‘rta sarlavha (20px)',
    category: 'typography',
    type: 'size',
    defaultValue: '20px',
    min: 18,
    max: 28,
    step: 1,
    unit: 'px',
    scope: 'ui'
  },
  {
    id: 'ui_font_size_24',
    cssVar: '--ui-font-size-24',
    label: 'Katta sarlavha (24px)',
    category: 'typography',
    type: 'size',
    defaultValue: '24px',
    min: 20,
    max: 32,
    step: 1,
    unit: 'px',
    scope: 'ui'
  },

  // =========================================================================
  // 3. ILOVA INTERFEYSI — BO‘SHLIQLAR (SPACING SCALE)
  // =========================================================================
  {
    id: 'space_1',
    cssVar: '--space-1',
    label: 'Bo‘shliq 1 (4px)',
    category: 'spacing',
    type: 'spacing',
    defaultValue: '4px',
    min: 0,
    max: 12,
    step: 1,
    unit: 'px',
    scope: 'ui'
  },
  {
    id: 'space_2',
    cssVar: '--space-2',
    label: 'Bo‘shliq 2 (8px)',
    category: 'spacing',
    type: 'spacing',
    defaultValue: '8px',
    min: 2,
    max: 18,
    step: 1,
    unit: 'px',
    scope: 'ui'
  },
  {
    id: 'space_3',
    cssVar: '--space-3',
    label: 'Bo‘shliq 3 (12px)',
    category: 'spacing',
    type: 'spacing',
    defaultValue: '12px',
    min: 4,
    max: 24,
    step: 1,
    unit: 'px',
    scope: 'ui'
  },
  {
    id: 'space_4',
    cssVar: '--space-4',
    label: 'Bo‘shliq 4 (16px)',
    category: 'spacing',
    type: 'spacing',
    defaultValue: '16px',
    min: 8,
    max: 32,
    step: 2,
    unit: 'px',
    scope: 'ui'
  },
  {
    id: 'space_5',
    cssVar: '--space-5',
    label: 'Bo‘shliq 5 (20px)',
    category: 'spacing',
    type: 'spacing',
    defaultValue: '20px',
    min: 10,
    max: 40,
    step: 2,
    unit: 'px',
    scope: 'ui'
  },
  {
    id: 'space_6',
    cssVar: '--space-6',
    label: 'Bo‘shliq 6 (24px)',
    category: 'spacing',
    type: 'spacing',
    defaultValue: '24px',
    min: 12,
    max: 48,
    step: 2,
    unit: 'px',
    scope: 'ui'
  },
  {
    id: 'space_8',
    cssVar: '--space-8',
    label: 'Bo‘shliq 8 (32px)',
    category: 'spacing',
    type: 'spacing',
    defaultValue: '32px',
    min: 16,
    max: 64,
    step: 4,
    unit: 'px',
    scope: 'ui'
  },
  {
    id: 'space_10',
    cssVar: '--space-10',
    label: 'Bo‘shliq 10 (40px)',
    category: 'spacing',
    type: 'spacing',
    defaultValue: '40px',
    min: 20,
    max: 80,
    step: 4,
    unit: 'px',
    scope: 'ui'
  },
  {
    id: 'space_12',
    cssVar: '--space-12',
    label: 'Bo‘shliq 12 (48px)',
    category: 'spacing',
    type: 'spacing',
    defaultValue: '48px',
    min: 24,
    max: 96,
    step: 4,
    unit: 'px',
    scope: 'ui'
  },
  {
    id: 'space_16',
    cssVar: '--space-16',
    label: 'Bo‘shliq 16 (64px)',
    category: 'spacing',
    type: 'spacing',
    defaultValue: '64px',
    min: 32,
    max: 128,
    step: 8,
    unit: 'px',
    scope: 'ui'
  },

  // =========================================================================
  // 4. ILOVA INTERFEYSI — BURCHAK RADIUSI VA SOYALAR
  // =========================================================================
  {
    id: 'radius_xs',
    cssVar: '--radius-xs',
    label: 'Juda kichik burchak radiusi (4px)',
    category: 'radius',
    type: 'radius',
    defaultValue: '4px',
    min: 0,
    max: 10,
    step: 1,
    unit: 'px',
    scope: 'ui'
  },
  {
    id: 'radius_sm',
    cssVar: '--radius-sm',
    label: 'Kichik burchak radiusi (6px)',
    category: 'radius',
    type: 'radius',
    defaultValue: '6px',
    min: 0,
    max: 14,
    step: 1,
    unit: 'px',
    scope: 'ui'
  },
  {
    id: 'radius_md',
    cssVar: '--radius-md',
    label: 'O‘rta burchak radiusi (8px)',
    category: 'radius',
    type: 'radius',
    defaultValue: '8px',
    min: 2,
    max: 18,
    step: 1,
    unit: 'px',
    scope: 'ui'
  },
  {
    id: 'radius_lg',
    cssVar: '--radius-lg',
    label: 'Katta burchak radiusi (12px)',
    category: 'radius',
    type: 'radius',
    defaultValue: '12px',
    min: 4,
    max: 24,
    step: 2,
    unit: 'px',
    scope: 'ui'
  },
  {
    id: 'radius_xl',
    cssVar: '--radius-xl',
    label: 'Juda katta burchak radiusi (16px)',
    category: 'radius',
    type: 'radius',
    defaultValue: '16px',
    min: 6,
    max: 32,
    step: 2,
    unit: 'px',
    scope: 'ui'
  },
  {
    id: 'radius_pill',
    cssVar: '--radius-pill',
    label: 'Yumaloq tugma radiusi (9999px)',
    category: 'radius',
    type: 'radius',
    defaultValue: '9999px',
    scope: 'ui'
  },
  {
    id: 'shadow_sm',
    cssVar: '--shadow-sm',
    label: 'Yengil soya',
    category: 'shadow',
    type: 'shadow',
    defaultValue: '0 1px 3px rgba(44, 34, 22, 0.06)',
    scope: 'ui'
  },
  {
    id: 'shadow_md',
    cssVar: '--shadow-md',
    label: 'O‘rtacha ko‘tarilish soyasi',
    category: 'shadow',
    type: 'shadow',
    defaultValue: '0 4px 16px rgba(44, 34, 22, 0.08)',
    scope: 'ui'
  },
  {
    id: 'shadow_lg',
    cssVar: '--shadow-lg',
    label: 'Katta modal soyasi',
    category: 'shadow',
    type: 'shadow',
    defaultValue: '0 12px 36px rgba(44, 34, 22, 0.12)',
    scope: 'ui'
  },

  // =========================================================================
  // 5. HUJJAT VA O‘QUV KARTALARI (DOCUMENT CARDS) — RANGLAR
  // =========================================================================
  {
    id: 'doc_bg',
    cssVar: '--doc-bg',
    label: 'Kartochka asosiy fon rangi',
    category: 'color',
    type: 'color',
    defaultValue: '#FAF8F5',
    scope: 'doc',
    description: '9:16 o‘quv kartochkasining asosiy qog‘oz foni'
  },
  {
    id: 'doc_surface',
    cssVar: '--doc-surface',
    label: 'Kartochka ichki sirti foni',
    category: 'color',
    type: 'color',
    defaultValue: '#FAF8F5',
    scope: 'doc',
    description: 'Kartochka ichidagi qutilar va bloklar sirti'
  },
  {
    id: 'doc_ink',
    cssVar: '--doc-ink',
    label: 'Kartochka asosiy matn rangi',
    category: 'color',
    type: 'color',
    defaultValue: '#1C2430',
    scope: 'doc',
    description: 'Kartochkadagi barcha asosiy o‘quv matnlari'
  },
  {
    id: 'doc_ink_2',
    cssVar: '--doc-ink-2',
    label: 'Kartochka ikkinchi darajali matn rangi',
    category: 'color',
    type: 'color',
    defaultValue: '#5C6470',
    scope: 'doc',
    description: 'Kartochka sarlavha osti, sana va izohlari'
  },
  {
    id: 'doc_border',
    cssVar: '--doc-border',
    label: 'Kartochka hoshiya chizig‘i',
    category: 'color',
    type: 'color',
    defaultValue: '#E3D9CC',
    scope: 'doc',
    description: 'Kartochka va bloklarning chegarasi'
  },
  {
    id: 'doc_accent',
    cssVar: '--doc-accent',
    label: 'Kartochka urg‘u rangi',
    category: 'color',
    type: 'color',
    defaultValue: '#1B2A4A',
    scope: 'doc',
    description: 'Kartochkadagi asosiy qonun va ta’rif urg‘ulari'
  },
  {
    id: 'doc_bronze',
    cssVar: '--doc-bronze',
    label: 'Kartochka bronza rangi',
    category: 'color',
    type: 'color',
    defaultValue: '#9E7D3B',
    scope: 'doc',
    description: 'Adolat tarozisi va dekorativ chiziqlar'
  },
  {
    id: 'doc_bronze_text',
    cssVar: '--doc-bronze-text',
    label: 'Kartochka bronza matn rangi',
    category: 'color',
    type: 'color',
    defaultValue: '#7A5F2A',
    scope: 'doc',
    description: 'Bronza qoidalar va eslatmalar matni'
  },
  {
    id: 'doc_bronze_soft',
    cssVar: '--doc-bronze-soft',
    label: 'Kartochka bronza yumshoq foni',
    category: 'color',
    type: 'color',
    defaultValue: '#F4EEE2',
    scope: 'doc',
    description: 'Qoidalar va eslatmalar bloki foni'
  },

  // =========================================================================
  // 6. HUJJAT VA O‘QUV KARTALARI — SHRIFTLAR
  // =========================================================================
  {
    id: 'doc_font_heading',
    cssVar: '--doc-font-heading',
    label: 'Hujjat sarlavhalari shrifti',
    category: 'typography',
    type: 'font',
    defaultValue: "var(--font-serif)",
    scope: 'doc',
    description: 'Kartochkadagi asosiy mavzu va bo‘lim sarlavhalari'
  },
  {
    id: 'doc_font_body',
    cssVar: '--doc-font-body',
    label: 'Hujjat asosiy matn shrifti',
    category: 'typography',
    type: 'font',
    defaultValue: "var(--font-serif)",
    scope: 'doc',
    description: 'Kartochka ichidagi qoidalar va tushuntirishlar'
  },
  {
    id: 'doc_font_ui',
    cssVar: '--doc-font-ui',
    label: 'Hujjat yordamchi shrifti',
    category: 'typography',
    type: 'font',
    defaultValue: "var(--font-sans)",
    scope: 'doc',
    description: 'Sahifa raqami, meta ma’lumotlar va yorliqlar'
  },

  // =========================================================================
  // 7. HUJJAT 1080x1920 CANVAS O‘LCHAMLARI (SIZES & SPACING)
  // =========================================================================
  {
    id: 'canvas_font_hero',
    cssVar: '--canvas-font-hero',
    label: 'Kartochka bosh sarlavhasi (Hero 74px)',
    category: 'typography',
    type: 'size',
    defaultValue: '74px',
    min: 44,
    max: 110,
    step: 2,
    unit: 'px',
    scope: 'doc'
  },
  {
    id: 'canvas_font_h1',
    cssVar: '--canvas-font-h1',
    label: 'Kartochka H1 sarlavhasi (52px)',
    category: 'typography',
    type: 'size',
    defaultValue: '52px',
    min: 34,
    max: 80,
    step: 2,
    unit: 'px',
    scope: 'doc'
  },
  {
    id: 'canvas_font_h2',
    cssVar: '--canvas-font-h2',
    label: 'Kartochka H2 sarlavhasi (36px)',
    category: 'typography',
    type: 'size',
    defaultValue: '36px',
    min: 28,
    max: 64,
    step: 2,
    unit: 'px',
    scope: 'doc'
  },
  {
    id: 'canvas_font_lead',
    cssVar: '--canvas-font-lead',
    label: 'Kartochka kirish matni (36px)',
    category: 'typography',
    type: 'size',
    defaultValue: '36px',
    min: 28,
    max: 70,
    step: 2,
    unit: 'px',
    scope: 'doc'
  },
  {
    id: 'canvas_font_body',
    cssVar: '--canvas-font-body',
    label: 'Kartochka asosiy matni (32px)',
    category: 'typography',
    type: 'size',
    defaultValue: '32px',
    min: 26,
    max: 60,
    step: 2,
    unit: 'px',
    scope: 'doc'
  },
  {
    id: 'canvas_font_caption',
    cssVar: '--canvas-font-caption',
    label: 'Kartochka izoh matni (26px)',
    category: 'typography',
    type: 'size',
    defaultValue: '26px',
    min: 26,
    max: 48,
    step: 2,
    unit: 'px',
    scope: 'doc'
  },
  {
    id: 'canvas_font_badge',
    cssVar: '--canvas-font-badge',
    label: 'Kartochka belgi matni (26px)',
    category: 'typography',
    type: 'size',
    defaultValue: '26px',
    min: 26,
    max: 48,
    step: 2,
    unit: 'px',
    scope: 'doc'
  },
  {
    id: 'canvas_font_mono',
    cssVar: '--canvas-font-mono',
    label: 'Kartochka kod matni (36px)',
    category: 'typography',
    type: 'size',
    defaultValue: '36px',
    min: 24,
    max: 52,
    step: 2,
    unit: 'px',
    scope: 'doc'
  },
  {
    id: 'doc_padding_card',
    cssVar: '--doc-padding-card',
    label: 'Kartochka ichki hoshiyasi (64px 64px)',
    category: 'spacing',
    type: 'spacing',
    defaultValue: '64px 64px',
    min: 40,
    max: 120,
    step: 4,
    unit: 'px',
    scope: 'doc'
  },
  {
    id: 'doc_padding_content',
    cssVar: '--doc-padding-content',
    label: 'Kontent maydoni oralig‘i (48px)',
    category: 'spacing',
    type: 'spacing',
    defaultValue: '48px',
    min: 20,
    max: 80,
    step: 4,
    unit: 'px',
    scope: 'doc'
  },
  {
    id: 'doc_radius_card',
    cssVar: '--doc-radius-card',
    label: 'Kartochka burchak radiusi (36px)',
    category: 'radius',
    type: 'radius',
    defaultValue: '36px',
    min: 0,
    max: 60,
    step: 2,
    unit: 'px',
    scope: 'doc'
  },
  {
    id: 'doc_radius_block',
    cssVar: '--doc-radius-block',
    label: 'Bloklar burchak radiusi (16px)',
    category: 'radius',
    type: 'radius',
    defaultValue: '16px',
    min: 0,
    max: 32,
    step: 2,
    unit: 'px',
    scope: 'doc'
  },
  {
    id: 'doc_radius_tag',
    cssVar: '--doc-radius-tag',
    label: 'Kichik yorliqlar radiusi (8px)',
    category: 'radius',
    type: 'radius',
    defaultValue: '8px',
    min: 0,
    max: 20,
    step: 1,
    unit: 'px',
    scope: 'doc'
  },
  {
    id: 'doc_shadow',
    cssVar: '--doc-shadow',
    label: 'Kartochka soyasi',
    category: 'shadow',
    type: 'shadow',
    defaultValue: '0 10px 30px rgba(44, 34, 22, 0.08), 0 1px 3px rgba(44, 34, 22, 0.04)',
    scope: 'doc'
  },
  {
    id: 'doc_line_height',
    cssVar: '--doc-line-height',
    label: 'Hujjat matn qatorlar oralig‘i',
    category: 'typography',
    type: 'size',
    defaultValue: '1.55',
    min: 1.2,
    max: 2.2,
    step: 0.05,
    scope: 'doc',
    description: 'O‘quv kartochkasi paragraflari va bloklarining qator balandligi'
  },
  {
    id: 'editor_font_size',
    cssVar: '--editor-font-size',
    label: 'Muharrir matn o‘lchami',
    category: 'typography',
    type: 'size',
    defaultValue: '14px',
    min: 11,
    max: 22,
    step: 0.5,
    unit: 'px',
    scope: 'ui',
    description: 'Markdown matn muharririning asosiy shrift o‘lchami'
  },
  {
    id: 'editor_line_height',
    cssVar: '--editor-line-height',
    label: 'Muharrir qator balandligi',
    category: 'typography',
    type: 'size',
    defaultValue: '1.65',
    min: 1.2,
    max: 2.2,
    step: 0.05,
    scope: 'ui',
    description: 'Muharrir qatorlari va qator raqamlari orasi'
  },
  {
    id: 'editor_bg',
    cssVar: '--editor-bg',
    label: 'Muharrir fon rangi',
    category: 'color',
    type: 'color',
    defaultValue: '#FAF8F5',
    scope: 'ui',
    description: 'Markdown muharrir maydonining foni'
  },
  {
    id: 'ui_density',
    cssVar: '--ui-density',
    label: 'Interfeys zichligi (Density)',
    category: 'spacing',
    type: 'spacing',
    defaultValue: 'normal',
    scope: 'ui',
    description: 'Tugmalar va elementlar orasidagi zichlik'
  },
  {
    id: 'ui_font_size',
    cssVar: '--ui-font-scale',
    label: 'Interfeys matn o‘lchami (S/M/L)',
    category: 'typography',
    type: 'size',
    defaultValue: 'M',
    scope: 'ui',
    description: 'Interfeys shrift masshtabi (S: 12px, M: 13.5px, L: 15px)'
  },
  {
    id: 'doc_cover_layout',
    cssVar: '--doc-cover-layout',
    label: 'Muqova kartasi tartibi',
    category: 'layout',
    type: 'size',
    defaultValue: 'classic',
    scope: 'doc',
    description: 'Muqova kartasining kompozitsiyasi (classic, left_aligned, minimal, bordered, crest_top, crest_side)'
  }
];

export const TOKEN_BY_ID = new Map<string, DesignToken>(
  DESIGN_TOKENS.map((t) => [t.id, t])
);

export const TOKEN_BY_CSS_VAR = new Map<string, DesignToken>(
  DESIGN_TOKENS.map((t) => [t.cssVar, t])
);

/**
 * Reestrdagi barcha tokenlar asosida boshlang'ich CSS o'zgaruvchilarni generatsiya qilish.
 * 2 ta qat'iy ko'lam (scope) mavjud:
 * - data-ui-theme (ilova qobig'i)
 * - data-document-theme (9:16 o'quv kartochkalari)
 */
export function generateCssVariablesString(): { uiCss: string; docCss: string; combinedCss: string } {
  const uiTokens = DESIGN_TOKENS.filter((t) => t.scope === 'ui');
  const docTokens = DESIGN_TOKENS.filter((t) => t.scope === 'doc');

  const uiVars = uiTokens.map((t) => `  ${t.cssVar}: ${t.defaultValue};`).join('\n');
  const docVars = docTokens.map((t) => `  ${t.cssVar}: ${t.defaultValue};`).join('\n');

  const uiCss = `:root, [data-ui-theme] {\n${uiVars}\n}`;
  const docCss = `[data-document-theme], .study-card-9-16, .print-study-card {\n${docVars}\n}`;
  const combinedCss = `${uiCss}\n\n${docCss}`;

  return { uiCss, docCss, combinedCss };
}

/**
 * Boshlang'ich token uslublarini brauzer DOM'iga inject qilish.
 */
export function injectDefaultTokenStyles(): void {
  if (typeof document === 'undefined') return;

  const styleId = 'yurist-studio-generated-tokens';
  let styleEl = document.getElementById(styleId) as HTMLStyleElement | null;
  if (!styleEl) {
    styleEl = document.createElement('style');
    styleEl.id = styleId;
    document.head.prepend(styleEl);
  }

  const { combinedCss } = generateCssVariablesString();
  styleEl.textContent = combinedCss;
}
