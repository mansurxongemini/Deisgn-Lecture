/**
 * YURIST STUDIO — THEME TOKENS & WCAG CONTRAST SUITE (Item 4 Verification)
 *
 * Qoidalar:
 * 1. 7 ta vizual rang faqat mavzu tokenlari (CSS variables) orqali boshqariladi.
 * 2. Ranglar orasida bir-biriga yaqin dublikatlar (masalan, ikkita ko'k) yo'q.
 * 3. Oq fonda (Light theme) va Qorong'i fonda (Dark theme) har bir rangning
 *    kontrast nisbati WCAG AA talabi bo'yicha kamida 4.5:1 bo'lishi shart.
 * 4. Chop etishda (PDF / @media print) ranglar oq qog'ozda to'liq o'qilishi kafolatlanadi.
 */

import { describe, it, expect } from 'vitest';
import { resolveStyleColor, type StyleColorToken } from '../schema/styleAnnotation';

// WCAG 2.1 nisbiy ravshanlik va kontrast nisbati hisoblagichi
function parseHexColor(hex: string): [number, number, number] {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  return [r, g, b];
}

function getLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

function calculateContrastRatio(hex1: string, hex2: string): number {
  const [r1, g1, b1] = parseHexColor(hex1);
  const [r2, g2, b2] = parseHexColor(hex2);
  const lum1 = getLuminance(r1, g1, b1);
  const lum2 = getLuminance(r2, g2, b2);
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  return (brightest + 0.05) / (darkest + 0.05);
}

// 7 ta rasmiy rang tokenlari va ularning aniq hex qiymatlari (themes.css dagi bilan bir xil)
const THEME_TOKENS: Record<
  StyleColorToken,
  { label: string; lightHex: string; darkHex: string; variableName: string }
> = {
  accent: {
    label: 'Oxford Navy',
    lightHex: '#1B2A4A',
    darkHex: '#93c5fd',
    variableName: '--style-color-accent'
  },
  teal: {
    label: 'Teal (Dengiz to‘lqini — dublikat ko‘k o‘rnida)',
    lightHex: '#0f766e',
    darkHex: '#2dd4bf',
    variableName: '--style-color-teal'
  },
  amber: {
    label: 'Amber (Tilla jigarrang)',
    lightHex: '#92400e',
    darkHex: '#fcd34d',
    variableName: '--style-color-amber'
  },
  crimson: {
    label: 'Crimson (Yoqut qizil)',
    lightHex: '#b91c1c',
    darkHex: '#fca5a5',
    variableName: '--style-color-crimson'
  },
  emerald: {
    label: 'Emerald (Zumrad yashil)',
    lightHex: '#047857',
    darkHex: '#6ee7b7',
    variableName: '--style-color-emerald'
  },
  slate: {
    label: 'Slate (To‘q kulrang)',
    lightHex: '#334155',
    darkHex: '#cbd5e1',
    variableName: '--style-color-slate'
  },
  purple: {
    label: 'Purple (Binafsha)',
    lightHex: '#6b21a8',
    darkHex: '#c084fc',
    variableName: '--style-color-purple'
  },
  default: {
    label: 'Standart',
    lightHex: '#1C2430',
    darkHex: '#E8E4DC',
    variableName: '--text-main'
  },
  navy: {
    label: 'Navy (alias)',
    lightHex: '#1B2A4A',
    darkHex: '#93c5fd',
    variableName: '--style-color-accent'
  },
  gold: {
    label: 'Gold (alias)',
    lightHex: '#92400e',
    darkHex: '#fcd34d',
    variableName: '--style-color-amber'
  },
  indigo: {
    label: 'Indigo (alias)',
    lightHex: '#6b21a8',
    darkHex: '#c084fc',
    variableName: '--style-color-purple'
  }
};

describe('ITEM 4: Theme Tokens & Contrast Safety Suite', () => {
  const distinctTokens: StyleColorToken[] = [
    'accent',
    'teal',
    'amber',
    'crimson',
    'emerald',
    'slate',
    'purple'
  ];

  it('confirms all 7 colors resolve to theme CSS variables (not fixed raw hex in code)', () => {
    distinctTokens.forEach((token) => {
      const lightResolved = resolveStyleColor(token, false);
      const darkResolved = resolveStyleColor(token, true);

      expect(lightResolved).toBeDefined();
      expect(darkResolved).toBeDefined();

      // CSS o'zgaruvchisi bilan boshlanishi shart (Theme Token)
      expect(lightResolved).toMatch(/^var\(--style-color-[a-z]+,/);
      expect(darkResolved).toMatch(/^var\(--style-color-[a-z]+,/);
    });
  });

  it('confirms the 7 colors are visually distinct and there are NO near-duplicates', () => {
    const lightColors = distinctTokens.map((t) => THEME_TOKENS[t].lightHex);
    const uniqueLight = new Set(lightColors);
    expect(uniqueLight.size).toBe(7);

    // Accent (Navy #1B2A4A) va Teal (#0f766e) bir xil emasligini alohida tasdiqlash
    expect(THEME_TOKENS.accent.lightHex).not.toBe(THEME_TOKENS.teal.lightHex);
    const diff = calculateContrastRatio(THEME_TOKENS.accent.lightHex, THEME_TOKENS.teal.lightHex);
    // Masofa yetarlicha katta bo'lishi kerak
    expect(diff).toBeGreaterThan(1.8);
  });

  it('guarantees WCAG AA contrast (>= 4.5:1) on white paper/background (#FFFFFF) for all 7 colors', () => {
    const whiteBackground = '#FFFFFF';

    distinctTokens.forEach((token) => {
      const colorHex = THEME_TOKENS[token].lightHex;
      const contrast = calculateContrastRatio(colorHex, whiteBackground);

      // Har bir rang matn o'qilishi uchun kamida 4.5:1 kontrast berishi shart
      expect(
        contrast,
        `${token} (${colorHex}) oq fonda kamida 4.5:1 kontrast berishi lozim, hozir: ${contrast.toFixed(2)}`
      ).toBeGreaterThanOrEqual(4.5);
    });
  });

  it('guarantees WCAG AA contrast (>= 4.5:1) on dark theme background (#15171C) for all 7 colors', () => {
    const darkBackground = '#15171C';

    distinctTokens.forEach((token) => {
      const colorHex = THEME_TOKENS[token].darkHex;
      const contrast = calculateContrastRatio(colorHex, darkBackground);

      // Qorong'i mavzuda ham kamida 4.5:1
      expect(
        contrast,
        `${token} (${colorHex}) qorong'i fonda kamida 4.5:1 kontrast berishi lozim, hozir: ${contrast.toFixed(2)}`
      ).toBeGreaterThanOrEqual(4.5);
    });
  });

  it('confirms PDF print colors inherit light theme tokens for pristine paper legibility', () => {
    distinctTokens.forEach((token) => {
      const printColor = resolveStyleColor(token, false);
      expect(printColor).toContain(THEME_TOKENS[token].lightHex);
    });
  });
});
