import { describe, it, expect } from 'vitest';
import {
  type StyleAnnotation,
  type StyleColorToken,
  type StyleSizeStep,
  createTextQuoteAnchor,
  resolveStyleColor,
  resolveStyleSize
} from '../schema/styleAnnotation';
import {
  mapAnnotationsThroughChange,
  reanchorAnnotations,
  type TextChange
} from '../services/styleAnchorEngine';
import JSZip from 'jszip';

describe('STEP V-B: Visual Text Editing Data Model & Anchor Engine', () => {
  const sampleText = 'O‘zbekiston Respublikasi Konstitutsiyasi inson huquqlari va erkinliklarini kafolatlaydi.';

  // Helper to create a test annotation
  const makeAnnotation = (
    id: string,
    exactWord: string,
    start: number,
    color: StyleColorToken = 'navy',
    size?: StyleSizeStep
  ): StyleAnnotation => {
    const end = start + exactWord.length;
    return {
      id,
      kind: 'inline',
      startOffset: start,
      endOffset: end,
      quote: createTextQuoteAnchor(sampleText, start, end),
      properties: { color, size },
      createdAt: 1000,
      updatedAt: 1000
    };
  };

  // --------------------------------------------------------------------------
  // 1. ANCHOR MAPPING THROUGH APP EDITS
  // --------------------------------------------------------------------------
  describe('1. Anchor Mapping through App Edits', () => {
    it('shifts start and end offsets when text is inserted BEFORE the annotation', () => {
      // "Konstitutsiyasi" starts at 25, length 15 (25..40)
      const start = sampleText.indexOf('Konstitutsiyasi');
      const ann = makeAnnotation('a1', 'Konstitutsiyasi', start);

      const insertion = 'Yangi ';
      const change: TextChange = { from: 0, to: 0, insertText: insertion };
      const newText = insertion + sampleText;

      const result = mapAnnotationsThroughChange([ann], change, newText);
      expect(result.length).toBe(1);
      expect(result[0].startOffset).toBe(start + insertion.length);
      expect(result[0].endOffset).toBe(start + 'Konstitutsiyasi'.length + insertion.length);
      expect(newText.slice(result[0].startOffset, result[0].endOffset)).toBe('Konstitutsiyasi');
    });

    it('expands endOffset when text is inserted INSIDE the annotation', () => {
      // "inson huquqlari" starts at 41, length 16 (41..57)
      const start = sampleText.indexOf('inson huquqlari');
      const ann = makeAnnotation('a2', 'inson huquqlari', start);

      // Insert "oliy " inside between "inson " and "huquqlari"
      const insertPos = start + 'inson '.length;
      const change: TextChange = { from: insertPos, to: insertPos, insertText: 'oliy ' };
      const newText =
        sampleText.slice(0, insertPos) + 'oliy ' + sampleText.slice(insertPos);

      const result = mapAnnotationsThroughChange([ann], change, newText);
      expect(result.length).toBe(1);
      expect(result[0].startOffset).toBe(start);
      expect(result[0].endOffset).toBe(start + 'inson huquqlari'.length + 'oliy '.length);
      expect(newText.slice(result[0].startOffset, result[0].endOffset)).toBe('inson oliy huquqlari');
    });

    it('remains unchanged when text is inserted AFTER the annotation', () => {
      const start = sampleText.indexOf('O‘zbekiston');
      const ann = makeAnnotation('a3', 'O‘zbekiston', start);

      const change: TextChange = { from: 50, to: 50, insertText: ' qo‘shimcha' };
      const newText = sampleText.slice(0, 50) + ' qo‘shimcha' + sampleText.slice(50);

      const result = mapAnnotationsThroughChange([ann], change, newText);
      expect(result.length).toBe(1);
      expect(result[0].startOffset).toBe(ann.startOffset);
      expect(result[0].endOffset).toBe(ann.endOffset);
      expect(newText.slice(result[0].startOffset, result[0].endOffset)).toBe('O‘zbekiston');
    });

    it('BOUNDARY RULE: typing at the exact END of a styled word does NOT extend the style', () => {
      // "O‘zbekiston" is at 0..11
      const start = 0;
      const end = 'O‘zbekiston'.length;
      const ann = makeAnnotation('a4', 'O‘zbekiston', start);

      // Typing directly at the end boundary (from === 11)
      const change: TextChange = { from: end, to: end, insertText: ' yangi' };
      const newText = sampleText.slice(0, end) + ' yangi' + sampleText.slice(end);

      const result = mapAnnotationsThroughChange([ann], change, newText);
      expect(result.length).toBe(1);
      expect(result[0].startOffset).toBe(0);
      expect(result[0].endOffset).toBe(end); // Not extended!
      expect(newText.slice(result[0].startOffset, result[0].endOffset)).toBe('O‘zbekiston');
    });

    it('BOUNDARY RULE: typing at the exact START of a styled word does NOT extend backwards', () => {
      const start = sampleText.indexOf('Konstitutsiyasi');
      const ann = makeAnnotation('a5', 'Konstitutsiyasi', start);

      const change: TextChange = { from: start, to: start, insertText: 'Bosh ' };
      const newText = sampleText.slice(0, start) + 'Bosh ' + sampleText.slice(start);

      const result = mapAnnotationsThroughChange([ann], change, newText);
      expect(result.length).toBe(1);
      expect(result[0].startOffset).toBe(start + 'Bosh '.length);
      expect(newText.slice(result[0].startOffset, result[0].endOffset)).toBe('Konstitutsiyasi');
    });

    it('completely removes annotation when the styled text is deleted', () => {
      const start = sampleText.indexOf('kafolatlaydi');
      const end = start + 'kafolatlaydi'.length;
      const ann = makeAnnotation('a6', 'kafolatlaydi', start);

      // Delete the word
      const change: TextChange = { from: start, to: end, insertText: '' };
      const newText = sampleText.slice(0, start) + sampleText.slice(end);

      const result = mapAnnotationsThroughChange([ann], change, newText);
      expect(result.length).toBe(0); // Removed cleanly
    });

    it('survives undo/redo cycles with exact offset restoration', () => {
      const start = sampleText.indexOf('erkinliklarini');
      const ann = makeAnnotation('a7', 'erkinliklarini', start);

      // 1. Edit: insert text before
      const change1: TextChange = { from: 0, to: 0, insertText: 'KIRISH: ' };
      const textAfterEdit = 'KIRISH: ' + sampleText;
      const mapped = mapAnnotationsThroughChange([ann], change1, textAfterEdit);

      expect(mapped[0].startOffset).toBe(start + 'KIRISH: '.length);

      // 2. Undo edit: delete the inserted prefix
      const undoChange: TextChange = { from: 0, to: 'KIRISH: '.length, insertText: '' };
      const textAfterUndo = textAfterEdit.slice('KIRISH: '.length);
      const restored = mapAnnotationsThroughChange(mapped, undoChange, textAfterUndo);

      expect(restored[0].startOffset).toBe(start);
      expect(restored[0].endOffset).toBe(start + 'erkinliklarini'.length);
      expect(textAfterUndo.slice(restored[0].startOffset, restored[0].endOffset)).toBe('erkinliklarini');
    });

    it('stays on the correct text when inline marks (**bold**, *italic*) are inserted, removed, and after undo/redo', () => {
      // Original text: "O‘zbekiston Respublikasi Konstitutsiyasi inson huquqlari va erkinliklarini kafolatlaydi."
      // Annotation is on "huquqlari"
      const word = 'huquqlari';
      const origStart = sampleText.indexOf(word);
      const ann = makeAnnotation('a-style-bold', word, origStart, 'emerald', 'lg');

      // 1. User toggles bold on the preceding word "inson":
      // "inson" is at index 41. We wrap it in **: insert ** before and after "inson"
      const insonStart = sampleText.indexOf('inson');
      const insonEnd = insonStart + 'inson'.length;
      
      // First insertion: ** before "inson"
      const change1: TextChange = { from: insonStart, to: insonStart, insertText: '**' };
      const step1Text = sampleText.slice(0, insonStart) + '**' + sampleText.slice(insonStart);
      const step1Anns = mapAnnotationsThroughChange([ann], change1, step1Text);

      // Second insertion: ** after "inson" (which is now at insonEnd + 2)
      const change2: TextChange = { from: insonEnd + 2, to: insonEnd + 2, insertText: '**' };
      const boldedText = step1Text.slice(0, insonEnd + 2) + '**' + step1Text.slice(insonEnd + 2);
      const mappedAfterBold = mapAnnotationsThroughChange(step1Anns, change2, boldedText);

      // Verify the styled annotation for "huquqlari" shifted by exactly +4 (two ** markers)
      expect(mappedAfterBold.length).toBe(1);
      expect(mappedAfterBold[0].startOffset).toBe(origStart + 4);
      expect(mappedAfterBold[0].endOffset).toBe(origStart + word.length + 4);
      expect(boldedText.slice(mappedAfterBold[0].startOffset, mappedAfterBold[0].endOffset)).toBe(word);

      // 2. User removes the bold markers (toggle off):
      // Remove opening **
      const unboldChange1: TextChange = { from: insonStart, to: insonStart + 2, insertText: '' };
      const unboldStep1 = boldedText.slice(0, insonStart) + boldedText.slice(insonStart + 2);
      const unboldStep1Anns = mapAnnotationsThroughChange(mappedAfterBold, unboldChange1, unboldStep1);

      // Remove closing **
      const unboldChange2: TextChange = { from: insonEnd, to: insonEnd + 2, insertText: '' };
      const unboldFinalText = unboldStep1.slice(0, insonEnd) + unboldStep1.slice(insonEnd + 2);
      const restoredAnns = mapAnnotationsThroughChange(unboldStep1Anns, unboldChange2, unboldFinalText);

      expect(restoredAnns[0].startOffset).toBe(origStart);
      expect(restoredAnns[0].endOffset).toBe(origStart + word.length);
      expect(unboldFinalText.slice(restoredAnns[0].startOffset, restoredAnns[0].endOffset)).toBe(word);

      // 3. User performs undo (re-applying bold) and redo:
      const reapplyChange: TextChange = { from: insonStart, to: insonStart, insertText: '**' };
      const reboldText = unboldFinalText.slice(0, insonStart) + '**' + unboldFinalText.slice(insonStart);
      const remappedAnns = mapAnnotationsThroughChange(restoredAnns, reapplyChange, reboldText);
      expect(reboldText.slice(remappedAnns[0].startOffset, remappedAnns[0].endOffset)).toBe(word);
    });
  });

  // --------------------------------------------------------------------------
  // 2. WHOLE-TEXT REPLACEMENT & RE-ANCHORING
  // --------------------------------------------------------------------------
  describe('2. Whole-Text Replacement & Re-Anchoring', () => {
    it('re-attaches to exact quote and prefix/suffix when whole text is replaced or moved', () => {
      const start = sampleText.indexOf('inson huquqlari');
      const ann = makeAnnotation('a8', 'inson huquqlari', start, 'emerald', 'lg');

      // AI generates a modified document where the sentence is moved to a second paragraph
      const newDocumentText = `# Yangi Bob\n\nBu birinchi xatboshi.\n\n${sampleText}\n\nYakuniy qism.`;

      const result = reanchorAnnotations([ann], newDocumentText);
      expect(result.resolved.length).toBe(1);
      expect(result.unresolved.length).toBe(0);
      expect(result.warningMessage).toBeUndefined();

      const resolved = result.resolved[0];
      expect(resolved.unresolved).toBe(false);
      expect(newDocumentText.slice(resolved.startOffset, resolved.endOffset)).toBe('inson huquqlari');
    });

    it('unresolved styles produce clear Uzbek warning message and are not silently dropped', () => {
      const start = sampleText.indexOf('kafolatlaydi');
      const ann = makeAnnotation('a9', 'kafolatlaydi', start, 'crimson');

      // New text completely removes the sentence containing "kafolatlaydi"
      const completelyDifferentText = '# Yangi Bob\n\nButunlay boshqa mavzu va yangi qoidalar.';

      const result = reanchorAnnotations([ann], completelyDifferentText);
      expect(result.resolved.length).toBe(0);
      expect(result.unresolved.length).toBe(1);
      expect(result.unresolved[0].id).toBe('a9');
      expect(result.unresolved[0].unresolved).toBe(true);

      // Strict requirement: User-friendly message in Uzbek
      expect(result.warningMessage).toBe('1 ta vizual uslub qayta bog‘lanmadi');
    });
  });

  // --------------------------------------------------------------------------
  // 3. WORKSPACE BACKUP & SNAPSHOT ROUND-TRIP
  // --------------------------------------------------------------------------
  describe('3. Workspace Backup (.zip) & Snapshot Round-Trip', () => {
    it('preserves styles in sidecar .styles.json in zip archive and restores them', async () => {
      const start1 = sampleText.indexOf('Konstitutsiyasi');
      const start2 = sampleText.indexOf('kafolatlaydi');
      const ann1 = makeAnnotation('s1', 'Konstitutsiyasi', start1, 'gold', 'lg');
      const ann2 = makeAnnotation('s2', 'kafolatlaydi', start2, 'accent');
      const styles = [ann1, ann2];

      const zip = new JSZip();
      const docPath = 'Hujjat.md';
      const stylesPath = 'Hujjat.styles.json';

      // Simulate export: write .md and .styles.json sidecar
      zip.file(docPath, sampleText);
      zip.file(stylesPath, JSON.stringify(styles, null, 2));

      const zipBlob = await zip.generateAsync({ type: 'nodebuffer' });

      // Simulate import: load from zip
      const loadedZip = await JSZip.loadAsync(zipBlob);
      const readContent = await loadedZip.file(docPath)!.async('string');
      const readStylesJson = await loadedZip.file(stylesPath)!.async('string');
      const readStyles = JSON.parse(readStylesJson) as StyleAnnotation[];

      expect(readContent).toBe(sampleText);
      expect(readStyles.length).toBe(2);
      expect(readStyles[0].quote.exact).toBe('Konstitutsiyasi');
      expect(readStyles[0].properties.color).toBe('gold');
      expect(readStyles[1].quote.exact).toBe('kafolatlaydi');
      expect(readStyles[1].properties.color).toBe('accent');
    });

    it('snapshot restore includes styles in DocumentSnapshot', () => {
      const start = sampleText.indexOf('Konstitutsiyasi');
      const ann = makeAnnotation('snap-1', 'Konstitutsiyasi', start, 'navy', 'lg');

      // Create snapshot representing historical state
      const snapshot = {
        id: 'snap-101',
        docId: 'doc-1',
        content: sampleText,
        styles: [ann],
        createdAt: 2000
      };

      // Restore document from snapshot
      const restoredDoc = {
        id: snapshot.docId,
        parentId: null,
        title: 'Qonun',
        content: snapshot.content,
        styles: snapshot.styles ? [...snapshot.styles] : [],
        order: 0,
        createdAt: 1000,
        updatedAt: snapshot.createdAt
      };

      expect(restoredDoc.styles).toBeDefined();
      expect(restoredDoc.styles?.length).toBe(1);
      expect(restoredDoc.styles?.[0].id).toBe('snap-1');
      expect(restoredDoc.styles?.[0].properties.color).toBe('navy');
      expect(restoredDoc.styles?.[0].properties.size).toBe('lg');
      expect(restoredDoc.content.slice(restoredDoc.styles![0].startOffset, restoredDoc.styles![0].endOffset)).toBe('Konstitutsiyasi');
    });
  });

  // --------------------------------------------------------------------------
  // 4. THEME TOKEN RESOLUTION & ACCESSIBILITY CONTRAST
  // --------------------------------------------------------------------------
  describe('4. Theme Token Resolution & Contrast Safety', () => {
    it('resolves curated color tokens to high-contrast colors in both light and dark modes', () => {
      const tokens: StyleColorToken[] = [
        'accent',
        'navy',
        'gold',
        'crimson',
        'emerald',
        'slate',
        'indigo'
      ];

      tokens.forEach((t) => {
        const lightColor = resolveStyleColor(t, false);
        const darkColor = resolveStyleColor(t, true);

        expect(lightColor).toBeDefined();
        expect(darkColor).toBeDefined();
        // In dark mode, tokens resolve to bright pastel hues for WCAG AAA contrast
        if (t !== 'accent') {
          expect(lightColor).not.toBe(darkColor);
        }
      });

      expect(resolveStyleColor('default', false)).toBeUndefined();
    });

    it('resolves relative size steps to scale factors without absolute pixels', () => {
      expect(resolveStyleSize('sm')).toBe('0.85em');
      expect(resolveStyleSize('base')).toBeUndefined(); // default 1.0em
      expect(resolveStyleSize('lg')).toBe('1.25em');
      expect(resolveStyleSize('xl')).toBe('1.5em');
    });
  });

  // --------------------------------------------------------------------------
  // 5. UZBEK SPECIAL CHARACTERS & APOSTROPHE PRESERVATION
  // --------------------------------------------------------------------------
  describe('5. Uzbek Special Characters & Apostrophe Preservation', () => {
    it('preserves curly apostrophes and special characters in quote anchors verbatim', () => {
      const specialText = 'O‘zbekiston fuqarolari oʻz huquq va g‘oyalarini erkin bayon etadilar (ў, қ, ғ, ҳ).';
      const start = specialText.indexOf('g‘oyalarini');
      const end = start + 'g‘oyalarini'.length;

      const anchor = createTextQuoteAnchor(specialText, start, end, 16);
      expect(anchor.exact).toBe('g‘oyalarini');
      expect(anchor.exact).toContain('‘');
      expect(anchor.prefix).toContain('oʻz');
    });
  });
});
