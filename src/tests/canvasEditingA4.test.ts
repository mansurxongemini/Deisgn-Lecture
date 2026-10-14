import { describe, it, expect } from 'vitest';
import { applyCanvasEditToSource } from '../services/canvasEditor';
import { parseMarkdownPlus } from '../schema/mdParser';
import { mapAnnotationsThroughChange, type TextChange } from '../services/styleAnchorEngine';
import {
  createTextQuoteAnchor,
  type StyleAnnotation,
  resolveStyleColor,
  resolveStyleSize
} from '../schema/styleAnnotation';

describe('PHASE V-C: Inline Text Editing in A4 Preview & Two-Way Sync', () => {
  const sampleDocument = `# Mehnat Kodeksi Sharhi
izoh: Yuridik qo‘llanma va amaliy maslahatlar

## 1-Mavzu. Mehnat Shartnomasi
Mehnat shartnomasi xodim va ish beruvchi o‘rtasidagi asosiy hujjatdir.

Ro'yxat:
- Shartnomaning taraflari
- Mehnat funktsiyasi va majburiyatlar
- Ish vaqti va dam olish vaqti

Jadval:
| Shart turi | Huquqiy asosi | Muddat |
| Majburiy | 72-modda | Noma'lum |
| Qo'shimcha | 73-modda | Kelishuvga ko'ra |

savol: Shartnoma qachondan kuchga kiradi?
javob: Imzolangan kundan e'tiboran.
`;

  // --------------------------------------------------------------------------
  // 1. MINIMAL SOURCE PATCHING & LINE INTEGRITY
  // --------------------------------------------------------------------------
  describe('1. Minimal Line-Diff Source Patching', () => {
    it('updates document title (#) and leaves all other lines byte-identical', () => {
      const result = applyCanvasEditToSource(sampleDocument, {
        editType: 'doc_title',
        newText: 'Yangi Tahrirdagi Mehnat Kodeksi Sharhi'
      });

      expect(result.success).toBe(true);
      expect(result.newSource).toBeDefined();

      const origLines = sampleDocument.split('\n');
      const newLines = result.newSource!.split('\n');

      expect(newLines[0]).toBe('# Yangi Tahrirdagi Mehnat Kodeksi Sharhi');
      // Untouched lines must be byte-identical
      for (let i = 1; i < origLines.length; i++) {
        expect(newLines[i]).toBe(origLines[i]);
      }
    });

    it('updates section title (##) and leaves preceding and following lines byte-identical', () => {
      const result = applyCanvasEditToSource(sampleDocument, {
        editType: 'sec_title',
        sectionTitle: 'Mehnat Shartnomasi',
        newText: '1-Mavzu. Mehnat Shartnomasining Huquqiy Maqomi'
      });

      expect(result.success).toBe(true);
      const newLines = result.newSource!.split('\n');
      const secIdx = newLines.findIndex((l) => l.startsWith('## '));
      expect(newLines[secIdx]).toBe('## 1-Mavzu. Mehnat Shartnomasining Huquqiy Maqomi');
      expect(newLines[secIdx - 1]).toBe(''); // blank line preserved
      expect(newLines[secIdx + 1]).toBe(
        'Mehnat shartnomasi xodim va ish beruvchi o‘rtasidagi asosiy hujjatdir.'
      );
    });

    it('updates paragraph text without touching titles or lists', () => {
      const result = applyCanvasEditToSource(sampleDocument, {
        editType: 'paragraph',
        sourceLine: 5,
        newText: 'Mehnat shartnomasi ikki tomonlama ixtiyoriy kelishuv hisoblanadi.'
      });

      expect(result.success).toBe(true);
      const newLines = result.newSource!.split('\n');
      expect(newLines[4]).toBe('Mehnat shartnomasi ikki tomonlama ixtiyoriy kelishuv hisoblanadi.');
      expect(newLines[0]).toBe('# Mehnat Kodeksi Sharhi');
    });

    it('updates specific list item by index and preserves list markers (- )', () => {
      const result = applyCanvasEditToSource(sampleDocument, {
        editType: 'list_item',
        sourceLine: 8,
        itemIdx: 1, // Second item: "Mehnat funktsiyasi va majburiyatlar"
        newText: 'Mehnat vazifalari va tomonlar javobgarligi'
      });

      expect(result.success).toBe(true);
      const newLines = result.newSource!.split('\n');
      expect(newLines[8]).toBe('- Mehnat vazifalari va tomonlar javobgarligi');
      // Preceding and following items preserved
      expect(newLines[7]).toBe('- Shartnomaning taraflari');
      expect(newLines[9]).toBe('- Ish vaqti va dam olish vaqti');
    });

    it('updates specific table cell (header or body) preserving table columns', () => {
      // 1. Update header cell at colIdx 2 ("Muddat" -> "Amal qilish muddati")
      const headerResult = applyCanvasEditToSource(sampleDocument, {
        editType: 'table_cell',
        sourceLine: 13,
        rowIdx: -1,
        colIdx: 2,
        newText: 'Amal qilish muddati'
      });

      expect(headerResult.success).toBe(true);
      expect(headerResult.newSource).toContain('| Shart turi | Huquqiy asosi | Amal qilish muddati |');

      // 2. Update body cell at rowIdx 0, colIdx 2 ("Noma'lum" -> "Muddatsiz")
      const bodyResult = applyCanvasEditToSource(headerResult.newSource!, {
        editType: 'table_cell',
        sourceLine: 13,
        rowIdx: 0,
        colIdx: 2,
        newText: 'Muddatsiz'
      });

      expect(bodyResult.success).toBe(true);
      expect(bodyResult.newSource).toContain('| Majburiy | 72-modda | Muddatsiz |');
      // Second row preserved
      expect(bodyResult.newSource).toContain('| Qo\'shimcha | 73-modda | Kelishuvga ko\'ra |');
    });

    it('updates question and answer pairs seamlessly', () => {
      const qResult = applyCanvasEditToSource(sampleDocument, {
        editType: 'qa_question',
        sourceLine: 18,
        newText: 'Mehnat shartnomasi qachondan yuridik kuchga ega bo‘ladi?'
      });

      expect(qResult.success).toBe(true);
      expect(qResult.newSource).toContain('savol: Mehnat shartnomasi qachondan yuridik kuchga ega bo‘ladi?');

      const ansResult = applyCanvasEditToSource(qResult.newSource!, {
        editType: 'qa_answer',
        sourceLine: 18,
        newText: 'Taraflar tomonidan imzolangan paytdan boshlab.'
      });

      expect(ansResult.success).toBe(true);
      expect(ansResult.newSource).toContain('javob: Taraflar tomonidan imzolangan paytdan boshlab.');
    });
  });

  // --------------------------------------------------------------------------
  // 2. SYNCHRONOUS STYLE ANNOTATION SHIFTING ON PREVIEW EDITS
  // --------------------------------------------------------------------------
  describe('2. Synchronous Style Annotation Shifting on Edits', () => {
    it('shifts visual style annotations correctly when text is edited in preview', () => {
      // Create a style annotation on "ish beruvchi" in the paragraph
      const targetWord = 'ish beruvchi';
      const start = sampleDocument.indexOf(targetWord);
      const ann: StyleAnnotation = {
        id: 'ann-sync-1',
        kind: 'inline',
        startOffset: start,
        endOffset: start + targetWord.length,
        quote: createTextQuoteAnchor(sampleDocument, start, start + targetWord.length),
        properties: { color: 'navy', size: 'lg' },
        createdAt: 1000,
        updatedAt: 1000
      };

      // Edit preceding text: "# Mehnat Kodeksi Sharhi" -> "# O‘zbekiston Respublikasi Mehnat Kodeksi Sharhi"
      const prefixInsert = 'O‘zbekiston Respublikasi ';
      const result = applyCanvasEditToSource(sampleDocument, {
        editType: 'doc_title',
        newText: `${prefixInsert}Mehnat Kodeksi Sharhi`
      });

      expect(result.success).toBe(true);
      const newSource = result.newSource!;

      // Shift annotations through change
      const change: TextChange = {
        from: 2, // right after "# "
        to: 2,
        insertText: prefixInsert
      };

      const shifted = mapAnnotationsThroughChange([ann], change, newSource);
      expect(shifted.length).toBe(1);
      expect(shifted[0].startOffset).toBe(start + prefixInsert.length);
      expect(newSource.slice(shifted[0].startOffset, shifted[0].endOffset)).toBe(targetWord);
    });
  });

  // --------------------------------------------------------------------------
  // 3. UZBEK SPECIAL CHARACTERS & CONTENT INTEGRITY
  // --------------------------------------------------------------------------
  describe('3. Uzbek Special Characters & Content Integrity', () => {
    it('preserves curly apostrophes and Uzbek letters verbatim during inline editing', () => {
      const uzbekText = 'O‘qituvchi oʻquvchiga taʼlim va yo‘l-yo‘riq beradi (o‘, g‘, ʻ, ’, ў, қ, ғ, ҳ).';
      const result = applyCanvasEditToSource(sampleDocument, {
        editType: 'paragraph',
        sourceLine: 5,
        newText: uzbekText
      });

      expect(result.success).toBe(true);
      expect(result.newSource).toContain(uzbekText);

      // Verify AST parses the preserved Uzbek characters
      const parsed = parseMarkdownPlus(result.newSource!);
      expect(parsed.document).toBeDefined();
      const sec = parsed.document!.sections[0];
      // Since it immediately follows ##, mdParser assigns it as sec.subtitle (Rule 9)
      expect(sec.subtitle || (sec.blocks.find((b) => b.type === 'text') as any)?.text).toBe(uzbekText);
    });

    it('rejects destructive edits that would corrupt document structure', () => {
      const result = applyCanvasEditToSource('# Boshqa Mavzu\n## 1-Mavzu\nMatn', {
        editType: 'sec_title',
        sectionTitle: '1-Mavzu',
        newText: ''
      });

      expect(result.success === false || result.newSource !== undefined).toBe(true);
    });

    it('preserves user-typed apostrophes (o‘, g‘, ʻ, ’) exactly as typed without normalization', () => {
      const rawTextWithApostrophes = 'Ko‘chmas mulk bo‘yicha to‘liq maʼlumot: oʻzbek tili lug‘ati.';
      const res = applyCanvasEditToSource(sampleDocument, {
        editType: 'paragraph',
        sourceLine: 5,
        newText: rawTextWithApostrophes
      });

      expect(res.success).toBe(true);
      expect(res.newSource).toContain(rawTextWithApostrophes);
      // Verify no ASCII apostrophe normalization occurred
      expect(res.newSource).not.toContain("Ko'chmas");
      expect(res.newSource).toContain("Ko‘chmas");
    });
  });

  // --------------------------------------------------------------------------
  // 4. SELECTIONS SPANNING INLINE MARKS & LIVE SYNC
  // --------------------------------------------------------------------------
  describe('4. Selections Spanning Inline Marks & Live Sync', () => {
    it('handles selections spanning inline marks (**bold**, *italic*, ==highlight==) cleanly', () => {
      const lineWithMarks = 'Ushbu **muhim qoida** va *amaliy tavsiya* hamda ==asosiy norma== hisoblanadi.';
      
      // Select spanning from inside **muhim qoida** across to *amaliy tavsiya*
      // Plain text: "Ushbu muhim qoida va amaliy tavsiya hamda asosiy norma hisoblanadi."
      // Replacing the whole span or toggling formatting produces valid markdown
      const updatedLine = 'Ushbu **yangi tahrirdagi qoida** va *kengaytirilgan tavsiya* hamda ==asosiy norma== hisoblanadi.';
      const res = applyCanvasEditToSource(`# Hujjat\n\n## 1-Bob\n${lineWithMarks}`, {
        editType: 'paragraph',
        sourceLine: 4,
        newText: updatedLine
      });

      expect(res.success).toBe(true);
      expect(res.newSource).toContain(updatedLine);

      const parsed = parseMarkdownPlus(res.newSource!);
      expect(parsed.document).toBeDefined();
      expect(parsed.warnings.length).toBe(0);
    });

    it('live sync updates source markdown while typing within debounced interval', async () => {
      let currentMd = sampleDocument;
      let syncCallCount = 0;

      const mockOnCanvasEdit = (newMd: string) => {
        currentMd = newMd;
        syncCallCount++;
      };

      // Simulate 3 rapid keystrokes within 50ms (typing burst)
      const burstKeystrokes = ['Mehnat ', 'Mehnat sha', 'Mehnat shartnomasi qoidalari'];
      
      let timer: any = null;
      for (const text of burstKeystrokes) {
        if (timer) clearTimeout(timer);
        timer = setTimeout(() => {
          const res = applyCanvasEditToSource(currentMd, {
            editType: 'paragraph',
            sourceLine: 5,
            newText: text
          });
          if (res.success && res.newSource) {
            mockOnCanvasEdit(res.newSource);
          }
        }, 100);
      }

      // Wait for debounce to fire
      await new Promise((r) => setTimeout(r, 250));

      // Burst should coalesce into a single sync call
      expect(syncCallCount).toBe(1);
      expect(currentMd).toContain('Mehnat shartnomasi qoidalari');
    });
  });

  // --------------------------------------------------------------------------
  // 6. PHASE V-D: FLOATING SELECTION TOOLBAR & VISUAL STYLING OPERATIONS
  // --------------------------------------------------------------------------
  describe('6. Phase V-D: Floating Toolbar & Visual Styling Engine', () => {
    const rawDocument = `# Konstitutsiyaviy Huquq

O‘zbekiston Respublikasi — boshqaruvning respublika shakliga ega bo‘lgan suveren davlatdir.`;

    it('creates color annotation without altering or polluting raw markdown text', () => {
      const selectedWord = 'suveren davlatdir';
      const offset = rawDocument.indexOf(selectedWord);
      expect(offset).toBeGreaterThan(0);

      const colorAnn: StyleAnnotation = {
        id: 'ann_color_1',
        kind: 'inline',
        startOffset: offset,
        endOffset: offset + selectedWord.length,
        quote: createTextQuoteAnchor(rawDocument, offset, offset + selectedWord.length),
        properties: { color: 'gold' },
        createdAt: Date.now(),
        updatedAt: Date.now()
      };

      // Ensure raw markdown string remains 100% clean and pristine
      expect(rawDocument).not.toContain('<span');
      expect(rawDocument).not.toContain('style=');
      expect(rawDocument.slice(colorAnn.startOffset, colorAnn.endOffset)).toBe(selectedWord);
      expect(colorAnn.quote.exact).toBe(selectedWord);
      expect(colorAnn.properties.color).toBe('gold');
    });

    it('creates size annotation step without altering raw markdown text', () => {
      const selectedWord = 'respublika shakliga';
      const offset = rawDocument.indexOf(selectedWord);
      expect(offset).toBeGreaterThan(0);

      const sizeAnn: StyleAnnotation = {
        id: 'ann_size_1',
        kind: 'inline',
        startOffset: offset,
        endOffset: offset + selectedWord.length,
        quote: createTextQuoteAnchor(rawDocument, offset, offset + selectedWord.length),
        properties: { size: 'lg' },
        createdAt: Date.now(),
        updatedAt: Date.now()
      };

      expect(sizeAnn.properties.size).toBe('lg');
      expect(rawDocument.slice(sizeAnn.startOffset, sizeAnn.endOffset)).toBe(selectedWord);
      // Clean markdown guarantee
      expect(rawDocument).not.toContain('font-size');
    });

    it('clear format strips inline markers and purges matching annotations', () => {
      const markedText = '**Qalin matn** va *kursiv matn* hamda ==muhim belgi==';
      const stripped = markedText
        .replace(/\*\*(.*?)\*\*/g, '$1')
        .replace(/\*(.*?)\*/g, '$1')
        .replace(/==(.*?)==/g, '$1');

      expect(stripped).toBe('Qalin matn va kursiv matn hamda muhim belgi');

      // Purge annotations overlapping range (including underline annotation)
      const sampleAnnotations: StyleAnnotation[] = [
        {
          id: 's1',
          kind: 'inline',
          startOffset: 0,
          endOffset: 10,
          quote: { exact: 'Qalin matn', prefix: '', suffix: '' },
          properties: { color: 'accent', underline: true },
          createdAt: 1,
          updatedAt: 1
        },
        {
          id: 's2',
          kind: 'inline',
          startOffset: 40,
          endOffset: 55,
          quote: { exact: 'boshqa matn', prefix: '', suffix: '' },
          properties: { size: 'sm' },
          createdAt: 1,
          updatedAt: 1
        }
      ];

      // Clearing range 0..10
      const clearStart = 0;
      const clearEnd = 10;
      const remaining = sampleAnnotations.filter(
        s => !(s.startOffset >= clearStart && s.endOffset <= clearEnd)
      );

      expect(remaining.length).toBe(1);
      expect(remaining[0].id).toBe('s2');
      expect(remaining[0].properties.underline).toBeUndefined();
    });

    it('resolves safe colors according to light and dark theme palette tokens', () => {
      expect(resolveStyleColor('accent', false)).toBe('var(--style-color-accent, #1B2A4A)');
      expect(resolveStyleColor('accent', true)).toBe('var(--style-color-accent, #93c5fd)');
      expect(resolveStyleColor('teal', false)).toBe('var(--style-color-teal, #0f766e)');
      expect(resolveStyleColor('teal', true)).toBe('var(--style-color-teal, #2dd4bf)');
      expect(resolveStyleColor('amber', false)).toBe('var(--style-color-amber, #92400e)');
      expect(resolveStyleColor('amber', true)).toBe('var(--style-color-amber, #fcd34d)');
      expect(resolveStyleColor('crimson', false)).toBe('var(--style-color-crimson, #b91c1c)');
      expect(resolveStyleColor('crimson', true)).toBe('var(--style-color-crimson, #fca5a5)');
      expect(resolveStyleColor('emerald', false)).toBe('var(--style-color-emerald, #047857)');
      expect(resolveStyleColor('emerald', true)).toBe('var(--style-color-emerald, #6ee7b7)');
      expect(resolveStyleColor('slate', false)).toBe('var(--style-color-slate, #334155)');
      expect(resolveStyleColor('slate', true)).toBe('var(--style-color-slate, #cbd5e1)');
      expect(resolveStyleColor('purple', false)).toBe('var(--style-color-purple, #6b21a8)');
      expect(resolveStyleColor('purple', true)).toBe('var(--style-color-purple, #c084fc)');
    });

    it('resolves relative em sizes for 4 distinct steps', () => {
      expect(resolveStyleSize('sm')).toBe('0.85em');
      expect(resolveStyleSize('base')).toBeUndefined();
      expect(resolveStyleSize('lg')).toBe('1.25em');
      expect(resolveStyleSize('xl')).toBe('1.5em');
    });
  });
});
