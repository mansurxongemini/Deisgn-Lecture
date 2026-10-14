/**
 * YURIST STUDIO — STYLE ANNOTATION SCHEMA (Step V-B)
 *
 * Vizual matn uslublari (rang, o'lcham, tagiga chizish va h.k.)
 * MD+ matnidan alohida, IndexedDB omborida saqlanadi.
 * MD+ matni toza va daxlsiz qoladi.
 */

export type StyleKind = 'inline' | 'block';

// Nisbiy o'lcham qadamlari (atrofdagi matnga nisbatan)
export type StyleSizeStep = 'sm' | 'base' | 'lg' | 'xl'; // kichik, oddiy, katta, juda katta

// Mavzu bilan uyg'unlashgan xavfsiz rang tokenlari (erkin color picker yo'q)
export type StyleColorToken =
  | 'default'
  | 'accent'
  | 'teal'
  | 'amber'
  | 'crimson'
  | 'emerald'
  | 'slate'
  | 'purple'
  // Legacy aliases
  | 'navy'
  | 'gold'
  | 'indigo';

export interface StyleProperties {
  color?: StyleColorToken;
  size?: StyleSizeStep;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  highlight?: boolean;
}

export interface TextQuoteAnchor {
  exact: string;   // Belgilangan matnning aynan o'zi
  prefix: string;  // Undan oldingi 12 ta belgi (matn o'zgarganda qayta topish uchun)
  suffix: string;  // Undan keyingi 12 ta belgi
}

export interface StyleAnnotation {
  id: string;              // Takrorlanmas identifikator (uuid)
  kind: StyleKind;         // 'inline' yoki 'block'
  blockId?: string;        // Butun blok uchun bo'lsa blok ID si
  startOffset: number;     // MD+ manba matnidagi boshlang'ich belgi indeksi (0-indexed)
  endOffset: number;       // MD+ manba matnidagi tugash belgi indeksi (exclusive)
  quote: TextQuoteAnchor;  // Matn kvotasi (bardoshli bog'ich)
  properties: StyleProperties;
  unresolved?: boolean;    // Agar tashqi tahrirda qayta bog'lanmay qolsa
  createdAt: number;
  updatedAt: number;
}

/**
 * 12 belgilik xavfsiz prefix va suffix ajratish
 */
export function createTextQuoteAnchor(
  fullText: string,
  start: number,
  end: number,
  contextLen = 12
): TextQuoteAnchor {
  const exact = fullText.slice(start, end);
  const prefix = fullText.slice(Math.max(0, start - contextLen), start);
  const suffix = fullText.slice(end, Math.min(fullText.length, end + contextLen));
  return { exact, prefix, suffix };
}

/**
 * Rang tokenini joriy mavzuga qarab xavfsiz CSS qiymatiga aylantirish
 * Barcha ranglar WCAG AA (>= 4.5:1) kontrast standartiga to'liq javob beradi.
 */
export function resolveStyleColor(token?: StyleColorToken, isDark = false): string | undefined {
  if (!token || token === 'default') return undefined;

  switch (token) {
    case 'accent':
    case 'navy':
      return isDark ? 'var(--style-color-accent, #93c5fd)' : 'var(--style-color-accent, #1B2A4A)';
    case 'teal':
      return isDark ? 'var(--style-color-teal, #2dd4bf)' : 'var(--style-color-teal, #0f766e)';
    case 'amber':
    case 'gold':
      return isDark ? 'var(--style-color-amber, #fcd34d)' : 'var(--style-color-amber, #92400e)';
    case 'crimson':
      return isDark ? 'var(--style-color-crimson, #fca5a5)' : 'var(--style-color-crimson, #b91c1c)';
    case 'emerald':
      return isDark ? 'var(--style-color-emerald, #6ee7b7)' : 'var(--style-color-emerald, #047857)';
    case 'slate':
      return isDark ? 'var(--style-color-slate, #cbd5e1)' : 'var(--style-color-slate, #334155)';
    case 'purple':
    case 'indigo':
      return isDark ? 'var(--style-color-purple, #c084fc)' : 'var(--style-color-purple, #6b21a8)';
    default:
      return undefined;
  }
}

/**
 * Nisbiy o'lcham qadamini em masshtabiga aylantirish
 */
export function resolveStyleSize(step?: StyleSizeStep): string | undefined {
  if (!step || step === 'base') return undefined;
  switch (step) {
    case 'sm':
      return '0.85em';
    case 'lg':
      return '1.25em';
    case 'xl':
      return '1.5em';
    default:
      return undefined;
  }
}
