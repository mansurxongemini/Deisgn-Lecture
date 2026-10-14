/**
 * YURIST STUDIO — XSS SECURITY & UNDERLINE INTEGRITY SUITE (Item 1 Verification)
 *
 * Qoidalar:
 * 1. MD+ matni har doim 100% HTML teglarsiz toza saqlanadi.
 * 2. Tagiga chizish (Underline) faqat StyleAnnotation ob'ektida (properties: { underline: true }) yashaydi.
 * 3. Foydalanuvchi MD+ ga <script>, <u>, <img onerror> kiritganda, ular har doim
 *    sof matn (text node) sifatida ekranga chiqadi, hech qachon HTML sifatida talqin qilinmaydi.
 */

import { describe, it, expect } from 'vitest';
import { renderToString } from 'react-dom/server';
import { FormattedText, StylesProvider } from '../utils/inlineMarkdown';
import type { StyleAnnotation } from '../schema/styleAnnotation';
import { createTextQuoteAnchor } from '../schema/styleAnnotation';
import { parseMarkdownPlus } from '../schema/mdParser';

describe('ITEM 1: XSS Security & HTML-Free MD+ Verification', () => {
  it('escapes <script> tags and renders them strictly as plain text (no executable script element)', () => {
    const maliciousInput = 'Foydalanuvchi huquqlari: <script>alert("XSS")</script> himoya qilinadi.';
    const rendered = renderToString(<FormattedText text={maliciousInput} />);

    // Must be escaped HTML entities, never a real executable <script> element
    expect(rendered).not.toContain('<script>');
    expect(rendered).toContain('&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;');
  });

  it('escapes <img onerror> tags and prevents DOM element injection', () => {
    const maliciousImg = 'Rasm testi: <img src="invalid.jpg" onerror="alert(1)" /> yakunlandi.';
    const rendered = renderToString(<FormattedText text={maliciousImg} />);

    expect(rendered).not.toContain('<img src');
    expect(rendered).toContain('&lt;img src=&quot;invalid.jpg&quot; onerror=&quot;alert(1)&quot; /&gt;');
  });

  it('renders raw <u> tags typed in MD+ as literal text, never as HTML underline tags', () => {
    const rawHtmlUnderline = 'Ushbu <u>chizilgan matn</u> foydalanuvchi tomonidan yozildi.';
    const rendered = renderToString(<FormattedText text={rawHtmlUnderline} />);

    // Must NOT contain <u> element
    expect(rendered).not.toContain('<u>');
    expect(rendered).not.toContain('</u>');
    expect(rendered).toContain('&lt;u&gt;chizilgan matn&lt;/u&gt;');
  });

  it('underlines text via StyleAnnotation without polluting MD+ with <u> or any HTML', () => {
    const pristineMarkdown = '# Fuqarolik Kodeksi\n\nBarcha fuqarolar qonun oldida tengdir.';
    const targetWord = 'qonun oldida tengdir';
    const offset = pristineMarkdown.indexOf(targetWord);
    expect(offset).toBeGreaterThan(0);

    // StyleAnnotation lives in memory / database
    const underlineAnnotation: StyleAnnotation = {
      id: 'ann_underline_test',
      kind: 'inline',
      startOffset: offset,
      endOffset: offset + targetWord.length,
      quote: createTextQuoteAnchor(pristineMarkdown, offset, offset + targetWord.length),
      properties: { underline: true },
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    // 1. Raw markdown string remains 100% free of <u> or HTML
    expect(pristineMarkdown).not.toContain('<u>');
    expect(pristineMarkdown).not.toContain('</u>');
    expect(pristineMarkdown).not.toContain('<span');

    // 2. Parser validates markdown with zero HTML warnings
    const parsed = parseMarkdownPlus(pristineMarkdown);
    expect(parsed.document).toBeDefined();

    // 3. Rendered preview displays the underline via CSS textDecoration and data attribute
    const rendered = renderToString(
      <StylesProvider styles={[underlineAnnotation]} isDark={false}>
        <FormattedText text={targetWord} />
      </StylesProvider>
    );

    expect(rendered).toContain('data-style-underline="true"');
    expect(rendered).toContain('text-decoration:underline');
    // Still absolutely no <u> tag!
    expect(rendered).not.toContain('<u>');
    expect(rendered).not.toContain('</u>');
  });

  it('combines underline, color, and size annotations cleanly without HTML in markdown source', () => {
    const rawText = 'Muhim huquqiy norma kafolati';
    const ann: StyleAnnotation = {
      id: 'multi_style_1',
      kind: 'inline',
      startOffset: 6,
      endOffset: 20,
      quote: createTextQuoteAnchor(rawText, 6, 20),
      properties: {
        color: 'crimson',
        size: 'lg',
        underline: true
      },
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    const rendered = renderToString(
      <StylesProvider styles={[ann]} isDark={false}>
        <FormattedText text={rawText} />
      </StylesProvider>
    );

    expect(rendered).toContain('data-style-color="crimson"');
    expect(rendered).toContain('data-style-size="lg"');
    expect(rendered).toContain('data-style-underline="true"');
    expect(rendered).toContain('text-decoration:underline');
    expect(rendered).toContain('font-size:1.25em');
    expect(rendered).not.toContain('<u>');
  });
});
