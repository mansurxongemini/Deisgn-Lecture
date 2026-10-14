import React, { createContext, useContext } from 'react';
import type { StyleAnnotation } from '../schema/styleAnnotation';
import { resolveStyleColor, resolveStyleSize } from '../schema/styleAnnotation';

export interface StylesContextValue {
  styles: StyleAnnotation[];
  isDark: boolean;
}

export const StylesContext = createContext<StylesContextValue>({
  styles: [],
  isDark: false
});

export const StylesProvider: React.FC<{
  styles?: StyleAnnotation[];
  isDark?: boolean;
  children: React.ReactNode;
}> = ({ styles = [], isDark = false, children }) => {
  return (
    <StylesContext.Provider value={{ styles, isDark }}>
      {children}
    </StylesContext.Provider>
  );
};

/**
 * Xavfsiz, boyitilgan inline formatlash:
 * - **qalin** (strong)
 * - *kursiv* (em)
 * - ==ta’kidlangan== (highlight mark)
 * - [[havola]] (Obsidian uslubidagi interaktiv chip)
 * - ?? (nozik "tekshiring" nishoni)
 * - {#id} belgisini tozalash
 * - Vizual uslub annotatsiyalari (StyleAnnotation: rang, o'lcham, tagiga chizish)
 *
 * Xavfsizlik kafolati: Hech qachon dangerouslySetInnerHTML ishlatilmaydi.
 * Foydalanuvchi yozgan har qanday HTML (<script>, <u>, <img>) sof matn (text node) sifatida ekranga chiqadi.
 */
export function renderFormattedText(
  text: string | undefined | null,
  onChipClick?: (target: string) => void,
  styles?: StyleAnnotation[],
  isDark = false
): React.ReactNode {
  if (!text) return null;

  // {#id} suffiksini matndan olib tashlash
  const cleanedText = text.replace(/\{#[a-zA-Z0-9_-]+\}/g, '').trim();

  // Matnni regex orqali tokenlarga ajratish:
  // O'zbek tili harflari (lotin va kirill) va tutuq belgilari:
  const UZ_CHAR = "[a-zA-Z0-9_\u0400-\u04FF\\u02BB\\u02BC\\u2018\\u2019']";
  const regex = new RegExp(
    `(` +
      `(?<!${UZ_CHAR})\\*\\*\\*(?!\\s)(?:[^*]|\\*(?!\\*\\*))+?(?<!\\s)\\*\\*\\*(?!${UZ_CHAR})` +
      `|` +
      `(?<!${UZ_CHAR})\\*\\*(?!\\s)(?:[^*]|\\*(?!\\*))+?(?<!\\s)\\*\\*(?!${UZ_CHAR})` +
      `|` +
      `(?<!${UZ_CHAR}|\\*)\\*(?!\\s|\\*)(?:[^*])+?(?<!\\s|\\*)\\*(?!${UZ_CHAR}|\\*)` +
      `|` +
      `(?<!${UZ_CHAR})___(?!\\s)(?:[^_]|_(?!___))+?(?<!\\s)___(?!${UZ_CHAR})` +
      `|` +
      `(?<!${UZ_CHAR})__(?!\\s)(?:[^_]|_(?!__))+?(?<!\\s)__(?!${UZ_CHAR})` +
      `|` +
      `(?<!${UZ_CHAR}|_)_(?!\\s|_)(?:[^_])+?(?<!\\s|_)_(?!${UZ_CHAR}|_)` +
      `|` +
      `(?<!${UZ_CHAR})==(?!\\s)(?:[^=]|=(?!=))+?(?<!\\s)==(?!${UZ_CHAR})` +
      `|` +
      `\\[\\[[^\\]]+\\]\\]` +
      `|` +
      `\\?\\?` +
    `)`,
    'g'
  );
  const parts = cleanedText.split(regex);

  const applyAnnotationsToSegment = (segText: string, keyPrefix: string): React.ReactNode => {
    if (!styles || styles.length === 0 || !segText) {
      return segText;
    }

    // Ushbu matn segmentiga mos keluvchi annotatsiyalarni topish
    const matchingAnns = styles.filter(
      (ann) => !ann.unresolved && ann.quote?.exact && segText.includes(ann.quote.exact)
    );

    if (matchingAnns.length === 0) {
      return segText;
    }

    // Eng birinchi mos keluvchi annotatsiya bo'yicha bo'lish
    const ann = matchingAnns[0];
    const matchIdx = segText.indexOf(ann.quote.exact);
    if (matchIdx === -1) return segText;

    const before = segText.slice(0, matchIdx);
    const exact = ann.quote.exact;
    const after = segText.slice(matchIdx + exact.length);

    const cssColor = resolveStyleColor(ann.properties.color, isDark);
    const cssSize = resolveStyleSize(ann.properties.size);

    return (
      <React.Fragment key={keyPrefix}>
        {before && applyAnnotationsToSegment(before, `${keyPrefix}_b`)}
        <span
          data-style-annotation-id={ann.id}
          data-style-color={ann.properties.color}
          data-style-size={ann.properties.size}
          data-style-underline={ann.properties.underline ? 'true' : undefined}
          style={{
            color: cssColor,
            fontSize: cssSize,
            textDecoration: ann.properties.underline ? 'underline' : undefined,
            fontWeight: ann.properties.bold ? 'bold' : undefined,
            fontStyle: ann.properties.italic ? 'italic' : undefined,
            backgroundColor: ann.properties.highlight ? 'rgba(254, 240, 138, 0.4)' : undefined
          }}
        >
          {exact}
        </span>
        {after && applyAnnotationsToSegment(after, `${keyPrefix}_a`)}
      </React.Fragment>
    );
  };

  return parts.map((part, index) => {
    if (!part) return null;

    // 0. Qalin va kursiv (***matn*** yoki ___matn___)
    if (
      (part.startsWith('***') && part.endsWith('***') && part.length >= 6) ||
      (part.startsWith('___') && part.endsWith('___') && part.length >= 6)
    ) {
      const inner = part.slice(3, -3);
      return (
        <strong key={index} className="doc-bold font-semibold text-current">
          <em className="doc-italic italic">
            {applyAnnotationsToSegment(inner, `bold_italic_${index}`)}
          </em>
        </strong>
      );
    }

    // 1. Qalin matn (**matn** yoki __matn__)
    if (
      (part.startsWith('**') && part.endsWith('**') && part.length >= 4) ||
      (part.startsWith('__') && part.endsWith('__') && part.length >= 4)
    ) {
      const inner = part.slice(2, -2);
      return (
        <strong key={index} className="doc-bold font-semibold text-current">
          {applyAnnotationsToSegment(inner, `bold_${index}`)}
        </strong>
      );
    }

    // 2. Kursiv matn (*matn* yoki _matn_)
    if (
      (part.startsWith('*') && part.endsWith('*') && part.length >= 2) ||
      (part.startsWith('_') && part.endsWith('_') && part.length >= 2)
    ) {
      const inner = part.slice(1, -1);
      return (
        <em key={index} className="doc-italic italic">
          {applyAnnotationsToSegment(inner, `italic_${index}`)}
        </em>
      );
    }

    // 3. Sariq ta'kidlash
    if (part.startsWith('==') && part.endsWith('==') && part.length >= 4) {
      const inner = part.slice(2, -2);
      return (
        <mark
          key={index}
          className="doc-highlight rounded px-1 py-0.5 bg-amber-100 text-amber-950 dark:bg-amber-900/40 dark:text-amber-200"
        >
          {applyAnnotationsToSegment(inner, `highlight_${index}`)}
        </mark>
      );
    }

    // 4. Obsidian uslubidagi havola chipi: [[130-modda]]
    if (part.startsWith('[[') && part.endsWith(']]') && part.length >= 4) {
      const linkTarget = part.slice(2, -2).trim();
      return (
        <span
          key={index}
          className="doc-chip inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-xs font-medium cursor-pointer transition-colors bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 dark:bg-indigo-950/50 dark:text-indigo-300 dark:border-indigo-800"
          title={`"${linkTarget}" ga o'tish`}
          onClick={() => onChipClick?.(linkTarget)}
        >
          <span className="opacity-70">§</span>
          <span>{linkTarget}</span>
        </span>
      );
    }

    // 5. Noaniq ma'lumot belgisi (?? -> Tekshiring nishoni)
    if (part === '??') {
      return (
        <span
          key={index}
          className="doc-unverified inline-flex items-center px-1.5 py-0.2 mx-0.5 rounded text-[11px] font-semibold bg-rose-100 text-rose-700 border border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-900"
          title="Ushbu ma'lumot tekshirilishi lozim"
        >
          ⚠️ tekshiring
        </span>
      );
    }

    // Oddiy xavfsiz matn (HTML teglari hech qachon bajarilmaydi, faqat matn sifatida chiqadi)
    return <span key={index}>{applyAnnotationsToSegment(part, `text_${index}`)}</span>;
  });
}

export const FormattedText: React.FC<{
  text: string | undefined | null;
  className?: string;
  onChipClick?: (target: string) => void;
}> = ({ text, className, onChipClick }) => {
  const { styles, isDark } = useContext(StylesContext);
  return <span className={className}>{renderFormattedText(text, onChipClick, styles, isDark)}</span>;
};
