/**
 * YURIST STUDIO — TAYYOR DIZAYN PRESETLARI KUTUBXONASI
 *
 * 24 xil hujjat rang sxemasi, 8 xil tipografika juftligi,
 * 6 xil tartib zichligi va 6 xil muqova dizayni.
 * Umumiy kombinatsiyalar soni: 24 × 8 × 6 × 6 = 6,912 ta tayyor uslub!
 */

// 1. HUJJAT RANG SXEMALARI (24 TA)
export interface ColorSchemePreset {
  id: string;
  name: string; // O'zbekcha chiroyli nom
  description: string;
  category: 'classic' | 'modern' | 'warm' | 'cool' | 'dark';
  tokens: {
    doc_bg: string;
    doc_ink: string;
    doc_accent: string;
    doc_border: string;
    doc_surface?: string;
  };
}

export const COLOR_SCHEME_PRESETS: ColorSchemePreset[] = [
  {
    id: 'warm_paper',
    name: 'Iliq qog‘oz',
    description: 'Klassik qaymoqrang fon va quyuq harbiy ko‘k urg‘u',
    category: 'warm',
    tokens: {
      doc_bg: '#FAF8F5',
      doc_ink: '#1C2430',
      doc_accent: '#1B2A4A',
      doc_border: '#E3D9CC'
    }
  },
  {
    id: 'cool_gray',
    name: 'Salqin kulrang',
    description: 'Zamonaviy shifer va chuqur dengiz ko‘ki',
    category: 'cool',
    tokens: {
      doc_bg: '#F1F5F9',
      doc_ink: '#0F172A',
      doc_accent: '#1E3A8A',
      doc_border: '#CBD5E1'
    }
  },
  {
    id: 'cream',
    name: 'Krem va Oltin',
    description: 'Yumshoq sarg‘ish krem va adolat oltin-bronzasi',
    category: 'warm',
    tokens: {
      doc_bg: '#FFFDF7',
      doc_ink: '#292524',
      doc_accent: '#854D0E',
      doc_border: '#E7E5E4'
    }
  },
  {
    id: 'sepia',
    name: 'Sepiya arxivi',
    description: 'Tarixiy hujjatlar va qadimiy qog‘oz jilosi',
    category: 'warm',
    tokens: {
      doc_bg: '#FBF6EE',
      doc_ink: '#3E2723',
      doc_accent: '#8D6E63',
      doc_border: '#D7CCC8'
    }
  },
  {
    id: 'slate',
    name: 'Shifer toshi',
    description: 'Vazmin neytral kulrang va qat’iy temir ko‘k',
    category: 'cool',
    tokens: {
      doc_bg: '#E2E8F0',
      doc_ink: '#1E293B',
      doc_accent: '#334155',
      doc_border: '#94A3B8'
    }
  },
  {
    id: 'forest',
    name: 'O‘rmon zumradi',
    description: 'Qulay och fon va to‘q yashil yuridik xotirjamlik',
    category: 'classic',
    tokens: {
      doc_bg: '#F2F7F4',
      doc_ink: '#132A1C',
      doc_accent: '#1B4D3E',
      doc_border: '#C2D6CC'
    }
  },
  {
    id: 'bordeaux',
    name: 'Bordo sharobi',
    description: 'Nafis olijanob qizil va iliq pushtirang fon',
    category: 'warm',
    tokens: {
      doc_bg: '#FAF5F5',
      doc_ink: '#2D1217',
      doc_accent: '#721C24',
      doc_border: '#E8D4D6'
    }
  },
  {
    id: 'midnight',
    name: 'Yarim tun',
    description: 'Chuqur qorong‘i fon va yorqin osmon ko‘k matnlari',
    category: 'dark',
    tokens: {
      doc_bg: '#181E29',
      doc_ink: '#F1F5F9',
      doc_accent: '#60A5FA',
      doc_border: '#334155'
    }
  },
  {
    id: 'parchment',
    name: 'Pergament',
    description: 'Qadimiy qonun kodekslari va qalin teri qog‘oz',
    category: 'warm',
    tokens: {
      doc_bg: '#F6EFE2',
      doc_ink: '#2C1E14',
      doc_accent: '#7C4A27',
      doc_border: '#DBCBB5'
    }
  },
  {
    id: 'arctic',
    name: 'Arktika musaffoligi',
    description: 'Muzdek tiniq oq-moviy fon va yorqin kobalt',
    category: 'cool',
    tokens: {
      doc_bg: '#F4F8FA',
      doc_ink: '#102A36',
      doc_accent: '#0284C7',
      doc_border: '#C6DFEA'
    }
  },
  {
    id: 'sand',
    name: 'Sahro qumi',
    description: 'Iliq qumtosh va boy karamel urg‘ulari',
    category: 'warm',
    tokens: {
      doc_bg: '#F7F3EA',
      doc_ink: '#2B251D',
      doc_accent: '#96723E',
      doc_border: '#DECDB7'
    }
  },
  {
    id: 'olive',
    name: 'Zaytun bog‘i',
    description: 'Tabiiy yashil-kulrang sokinlik va aniq kontrast',
    category: 'classic',
    tokens: {
      doc_bg: '#F5F6F0',
      doc_ink: '#1E2417',
      doc_accent: '#4D5B31',
      doc_border: '#D1D7C3'
    }
  },
  {
    id: 'royal_navy',
    name: 'Qirollik floti',
    description: 'Britaniya parlamenti uslubidagi hashamatli ko‘k',
    category: 'classic',
    tokens: {
      doc_bg: '#F6F8FB',
      doc_ink: '#0F1E36',
      doc_accent: '#1E40AF',
      doc_border: '#BFDBFE'
    }
  },
  {
    id: 'terracotta',
    name: 'Terrakota g‘ishti',
    description: 'Qadimiy Rim g‘ishtlari va iliq qizg‘ish tuproq',
    category: 'warm',
    tokens: {
      doc_bg: '#FBF5F1',
      doc_ink: '#331A12',
      doc_accent: '#A04000',
      doc_border: '#E6C2B4'
    }
  },
  {
    id: 'emerald',
    name: 'Zumrad adolat',
    description: 'Adolat saroylarining to‘q yashil baxmal foni',
    category: 'classic',
    tokens: {
      doc_bg: '#F0FDF4',
      doc_ink: '#064E3B',
      doc_accent: '#047857',
      doc_border: '#A7F3D0'
    }
  },
  {
    id: 'monochrome',
    name: 'Klassik monoxrom',
    description: 'Sof oq qog‘oz va mutlaq qora bosmaxona siyohi',
    category: 'modern',
    tokens: {
      doc_bg: '#FFFFFF',
      doc_ink: '#111827',
      doc_accent: '#374151',
      doc_border: '#E5E7EB'
    }
  },
  {
    id: 'lavender',
    name: 'Lavanda nafisi',
    description: 'Yumshoq binafsharang va nafis ilmiy muhit',
    category: 'modern',
    tokens: {
      doc_bg: '#F8F6FB',
      doc_ink: '#241836',
      doc_accent: '#6B21A8',
      doc_border: '#DDD6FE'
    }
  },
  {
    id: 'mocha',
    name: 'Mokka qahvasi',
    description: 'Iliq qahva donasi va shokoladli qog‘oz jilosi',
    category: 'warm',
    tokens: {
      doc_bg: '#F5EFEB',
      doc_ink: '#2E1E14',
      doc_accent: '#5C3D28',
      doc_border: '#D6C4B8'
    }
  },
  {
    id: 'ivory_gold',
    name: 'Fil suyagi va Zarrin',
    description: 'Elita konstitutsiyaviy nashrlar uchun zarrin hoshiya',
    category: 'classic',
    tokens: {
      doc_bg: '#FCFBF7',
      doc_ink: '#231F1A',
      doc_accent: '#B45309',
      doc_border: '#FDE68A'
    }
  },
  {
    id: 'nordic_frost',
    name: 'Skandinaviya ayozi',
    description: 'Minimalist shimoliy arxitektura va aniq kulrang',
    category: 'cool',
    tokens: {
      doc_bg: '#EDF2F7',
      doc_ink: '#1A202C',
      doc_accent: '#2B6CB0',
      doc_border: '#CBD5E0'
    }
  },
  {
    id: 'antique',
    name: 'Antikvar kitob',
    description: 'Kutubxona xazinalarining sarg‘aygan qalin sahifalari',
    category: 'warm',
    tokens: {
      doc_bg: '#EDE4D3',
      doc_ink: '#261C14',
      doc_accent: '#6E4B33',
      doc_border: '#C4B59D'
    }
  },
  {
    id: 'rosewood',
    name: 'Pushtirang daraxt',
    description: 'Nafis qimmatbaho daraxt yog‘ochi va to‘q yoqut',
    category: 'warm',
    tokens: {
      doc_bg: '#FDF6F7',
      doc_ink: '#381E24',
      doc_accent: '#9F1239',
      doc_border: '#FECDD3'
    }
  },
  {
    id: 'deep_sea',
    name: 'Ummon qa’ri',
    description: 'Tungi o‘qish uchun chuqur dengiz qorong‘uligi',
    category: 'dark',
    tokens: {
      doc_bg: '#0C1824',
      doc_ink: '#E2E8F0',
      doc_accent: '#38BDF8',
      doc_border: '#1E3A5F'
    }
  },
  {
    id: 'graphite',
    name: 'Grafit qorong‘iligi',
    description: 'To‘q qora grafit va kumushrang yorqin harflar',
    category: 'dark',
    tokens: {
      doc_bg: '#22262B',
      doc_ink: '#F3F4F6',
      doc_accent: '#9CA3AF',
      doc_border: '#374151'
    }
  }
];

// 2. TIPOGRAFIKA JUFTLIKLARI (8 TA)
export interface TypographyPairPreset {
  id: string;
  name: string;
  description: string;
  headingFont: string;
  bodyFont: string;
  previewHeading: string;
  previewBody: string;
}

export const TYPOGRAPHY_PAIR_PRESETS: TypographyPairPreset[] = [
  {
    id: 'lora_inter',
    name: 'Klassik muvozanat',
    description: 'Lora (Serif) sarlavha + Inter (Sans) matn',
    headingFont: "'Lora', Georgia, serif",
    bodyFont: "'Inter', -apple-system, system-ui, sans-serif",
    previewHeading: 'Huquqiy normalar',
    previewBody: 'O‘zbekiston Respublikasi Konstitutsiyasi oliy yuridik kuchga ega.'
  },
  {
    id: 'georgia_inter',
    name: 'Zamonaviy akademik',
    description: 'Georgia sarlavha + Inter (Sans) matn',
    headingFont: "'Georgia', serif",
    bodyFont: "'Inter', -apple-system, system-ui, sans-serif",
    previewHeading: 'Sud amaliyoti',
    previewBody: 'Fuqarolik kodeksining umumiy qoidalari va da’vo muddati.'
  },
  {
    id: 'inter_inter',
    name: 'Toza neo-grotesk',
    description: 'Inter sarlavha + Inter matn (To‘liq zamonaviy)',
    headingFont: "'Inter', -apple-system, system-ui, sans-serif",
    bodyFont: "'Inter', -apple-system, system-ui, sans-serif",
    previewHeading: 'Tezkor konspekt',
    previewBody: 'Shartnomaviy majburiyatlarni buzganlik uchun javobgarlik choralari.'
  },
  {
    id: 'lora_lora',
    name: 'Qonuniy kitobiy',
    description: 'Lora sarlavha + Lora matn (Klassik kitob uslubi)',
    headingFont: "'Lora', Georgia, serif",
    bodyFont: "'Lora', Georgia, serif",
    previewHeading: 'Huquqiy ta’riflar',
    previewBody: 'Bitimlar fuqarolar va yuridik shaxslarning huquq va burchlarini belgilaydi.'
  },
  {
    id: 'georgia_georgia',
    name: 'Rasmiy qonunchilik',
    description: 'Georgia sarlavha + Georgia matn (Rasmiy nashrlar)',
    headingFont: "'Georgia', serif",
    bodyFont: "'Georgia', serif",
    previewHeading: 'Qonun loyihasi',
    previewBody: 'Normativ-huquqiy hujjatlarning kuchga kirish tartibi va ijrosi.'
  },
  {
    id: 'inter_lora',
    name: 'Inversion tahrir',
    description: 'Inter (Sans) sarlavha + Lora (Serif) matn',
    headingFont: "'Inter', -apple-system, system-ui, sans-serif",
    bodyFont: "'Lora', Georgia, serif",
    previewHeading: 'Kazus yechimi',
    previewBody: 'Tomonlarning da’vo talablari qonuniy asosda to‘liq ko‘rib chiqildi.'
  },
  {
    id: 'serif_sans',
    name: 'Tizim standarti',
    description: 'Tizim Serif sarlavha + Tizim Sans matn',
    headingFont: 'serif',
    bodyFont: 'sans-serif',
    previewHeading: 'Davlat arxivi',
    previewBody: 'Hujjatlarning yuridik kuchi va saqlanish muddati belgilandi.'
  },
  {
    id: 'serif_serif',
    name: 'An’anaviy arxiv',
    description: 'To‘liq tizim Serif shriftlari',
    headingFont: 'serif',
    bodyFont: 'serif',
    previewHeading: 'Tarixiy sharh',
    previewBody: 'Rim huquqining zamonaviy fuqarolik kodekslariga ta’siri.'
  }
];

// 3. TARTIB VA ZICHLIK SOZLAMALARI (6 TA)
export interface LayoutDensityPreset {
  id: string;
  name: string;
  description: string;
  tokens: {
    doc_padding_card: string;
    doc_line_height: string;
    canvas_font_body: string;
    doc_padding_content: string;
  };
}

export const LAYOUT_DENSITY_PRESETS: LayoutDensityPreset[] = [
  {
    id: 'ultra_compact',
    name: 'O‘ta ixcham',
    description: 'Ko‘p ma’lumot va jadvallar uchun minimal bo‘sh joy (26px)',
    tokens: {
      doc_padding_card: '50px 64px',
      doc_line_height: '1.45',
      canvas_font_body: '26px',
      doc_padding_content: '24px'
    }
  },
  {
    id: 'compact',
    name: 'Ixcham',
    description: 'Qisqa testlar va tezkor eslatmalar uchun qulay zichlik (28px)',
    tokens: {
      doc_padding_card: '56px 64px',
      doc_line_height: '1.5',
      canvas_font_body: '28px',
      doc_padding_content: '28px'
    }
  },
  {
    id: 'normal',
    name: 'Standart',
    description: 'Oltin o‘rtalik: eng maqbul o‘qish qulayligi va to‘liqlik (32px)',
    tokens: {
      doc_padding_card: '64px 64px',
      doc_line_height: '1.55',
      canvas_font_body: '32px',
      doc_padding_content: '32px'
    }
  },
  {
    id: 'comfortable',
    name: 'Yirik',
    description: 'Katta shrift va kengroq o‘qish sur’ati (38px)',
    tokens: {
      doc_padding_card: '72px 64px',
      doc_line_height: '1.6',
      canvas_font_body: '38px',
      doc_padding_content: '40px'
    }
  },
  {
    id: 'spacious',
    name: 'Katta maydonli',
    description: 'Katta sarlavhalar va alohida ajratilgan qoidalar (42px)',
    tokens: {
      doc_padding_card: '80px 64px',
      doc_line_height: '1.65',
      canvas_font_body: '42px',
      doc_padding_content: '48px'
    }
  },
  {
    id: 'luxurious',
    name: 'Hashamatli (Luxurious)',
    description: 'Prezident va vazirlik darajasidagi eng keng hoshiyalar (46px)',
    tokens: {
      doc_padding_card: '96px 64px',
      doc_line_height: '1.75',
      canvas_font_body: '46px',
      doc_padding_content: '56px'
    }
  }
];

// 4. MUQOVA TARTIBI DIZAYNLARI (6 TA)
export interface CoverLayoutPreset {
  id: string;
  name: string;
  description: string;
  badge: string;
}

export const COVER_LAYOUT_PRESETS: CoverLayoutPreset[] = [
  {
    id: 'classic',
    name: 'Klassik markaziy',
    description: 'Markaziy sarlavha, adolat tarozisi va oltin ajratkich',
    badge: 'Klassik'
  },
  {
    id: 'left_aligned',
    name: 'Chapga tekislangan',
    description: 'Zamonaviy asimmetrik chap hoshiya va jiddiy chiziq',
    badge: 'Zamonaviy'
  },
  {
    id: 'minimal',
    name: 'Minimal nafislik',
    description: 'Ortiqcha ramkasiz, faqat toza tipografika va noziklik',
    badge: 'Minimal'
  },
  {
    id: 'bordered',
    name: 'Qo‘sh hoshiyali ramka',
    description: 'Akademik ikki qavatli hoshiya va saroy ramkasi',
    badge: 'Ramkali'
  },
  {
    id: 'crest_top',
    name: 'Yuqori gerb ulug‘vorligi',
    description: 'Tepada katta davlat va adolat ramzi, ulug‘vor shrift',
    badge: 'Gerbli'
  },
  {
    id: 'crest_side',
    name: 'Yon gerbli kompozitsiya',
    description: 'Emblema yon tomonda, zamonaviy rasmiy monografiya',
    badge: 'Monografiya'
  }
];

// Helper maps
export const COLOR_PRESET_BY_ID = new Map<string, ColorSchemePreset>(
  COLOR_SCHEME_PRESETS.map((p) => [p.id, p])
);

export const TYPOGRAPHY_PRESET_BY_ID = new Map<string, TypographyPairPreset>(
  TYPOGRAPHY_PAIR_PRESETS.map((p) => [p.id, p])
);

export const DENSITY_PRESET_BY_ID = new Map<string, LayoutDensityPreset>(
  LAYOUT_DENSITY_PRESETS.map((p) => [p.id, p])
);

export const COVER_PRESET_BY_ID = new Map<string, CoverLayoutPreset>(
  COVER_LAYOUT_PRESETS.map((p) => [p.id, p])
);

export const TOTAL_PRESET_COMBINATIONS =
  COLOR_SCHEME_PRESETS.length *
  TYPOGRAPHY_PAIR_PRESETS.length *
  LAYOUT_DENSITY_PRESETS.length *
  COVER_LAYOUT_PRESETS.length;

