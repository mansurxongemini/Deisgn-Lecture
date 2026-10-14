/**
 * YURIST STUDIO — PDF & PRINT STYLING FIDELITY SUITE (Item 5 Verification)
 *
 * Qoidalar:
 * 1. PDF / Chop etish rejimida (#print-export-host) ranglar, o'lchamlar,
 *    tagiga chizish, qalin va ta'kidlash xuddi ko'rinishdagidek (preview)
 *    aniq va o'zgarmas saqlanishi kerak.
 * 2. Print-media computed style tekshiruvi.
 */

import { describe, it, expect } from 'vitest';
import { renderToString } from 'react-dom/server';
import { FormattedText, StylesProvider } from '../utils/inlineMarkdown';
import type { StyleAnnotation } from '../schema/styleAnnotation';
import { createTextQuoteAnchor } from '../schema/styleAnnotation';
import { A4Document } from '../components/preview/A4Document';
import { DocumentPreview } from '../components/preview/DocumentPreview';
import type { LegalDocument } from '../schema/types';

describe('ITEM 5: PDF & Print Media Styling Fidelity Suite', () => {
  const sampleDoc: LegalDocument = {
    title: 'Mehnat Huquqi Darsligi',
    institution: 'Toshkent Davlat Yuridik Universiteti',
    sections: [
      {
        title: '1. Mehnat Shartnomasi Tushunchasi',
        blocks: [
          {
            id: 'b1',
            type: 'text',
            text: 'Mehnat shartnomasi xodim bilan ish beruvchi o‘rtasidagi kelishuvdir.',
            sourceLine: 3
          }
        ]
      }
    ]
  };

  it('preserves color, size, underline, bold, and highlight in print-media render tree', () => {
    const rawText = (sampleDoc.sections[0].blocks[0] as any).text;
    const targetWord = 'kelishuvdir';
    const offset = rawText.indexOf(targetWord);

    const styleAnnotations: StyleAnnotation[] = [
      {
        id: 'ann_color_crimson',
        kind: 'inline',
        startOffset: offset,
        endOffset: offset + targetWord.length,
        quote: createTextQuoteAnchor(rawText, offset, offset + targetWord.length),
        properties: {
          color: 'crimson',
          size: 'lg',
          underline: true
        },
        createdAt: Date.now(),
        updatedAt: Date.now()
      }
    ];

    // Render A4Document with printHost = true
    const html = renderToString(
      <StylesProvider styles={styleAnnotations} isDark={false}>
        <div id="print-export-host" className="print-export-host">
          <A4Document
            document={sampleDoc}
            activeTheme="classic"
            isPrintHost={true}
          />
        </div>
      </StylesProvider>
    );

    // 1. Verify container ID and print host class
    expect(html).toContain('id="print-export-host"');
    expect(html).toContain('class="print-export-host"');

    // 2. Verify styled word has exact print attributes matching preview
    expect(html).toContain('data-style-color="crimson"');
    expect(html).toContain('data-style-size="lg"');
    expect(html).toContain('data-style-underline="true"');

    // 3. Verify inline CSS rules matching preview computed styles
    expect(html).toContain('color:var(--style-color-crimson, #b91c1c)');
    expect(html).toContain('font-size:1.25em');
    expect(html).toContain('text-decoration:underline');
  });

  it('renders bold and highlight marks consistently for PDF print export', () => {
    const textWithMarks = 'Ushbu qoida **qat’iy majburiy** va ==alohida ahamiyatga ega==.';
    const html = renderToString(
      <StylesProvider styles={[]} isDark={false}>
        <FormattedText text={textWithMarks} />
      </StylesProvider>
    );

    expect(html).toContain('<strong class="doc-bold font-semibold text-current">qat’iy majburiy</strong>');
    expect(html).toContain('<mark class="doc-highlight');
    expect(html).toContain('alohida ahamiyatga ega</mark>');
  });

  it('renders 9:16 cards cleanly when printLayout="cards"', () => {
    const html = renderToString(
      <StylesProvider styles={[]} isDark={false}>
        <DocumentPreview
          document={sampleDoc}
          activeTheme="classic"
          isPrintHost={true}
          printLayout="cards"
        />
      </StylesProvider>
    );

    expect(html).toContain('class="print-cards-host doc-theme-classic"');
    expect(html).toContain('class="print-card-wrapper"');
    expect(html).toContain('study-card-9-16');
  });
});
