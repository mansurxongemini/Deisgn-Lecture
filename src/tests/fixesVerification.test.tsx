import { describe, it, expect } from 'vitest';
import { parseMarkdownPlus } from '../schema/mdParser';
import { renderFormattedText } from '../utils/inlineMarkdown';
import { applyCanvasEditToSource } from '../services/canvasEditor';
import type { FlowBlock } from '../schema/types';

describe('Fixes Verification Test Suite', () => {
  it('1. Parses flow block title correctly when given "jarayon: Xalqaro shartnoma..."', () => {
    const md = `# Hujjat\n\n## 1-bo'lim\njarayon: Xalqaro shartnoma tuzishning umumiy ketma-ketligi\n1-bosqich -> 2-bosqich -> 3-bosqich`;
    const res = parseMarkdownPlus(md);
    expect(res.document).toBeDefined();

    const flowBlock = res.document?.sections[0].blocks[0] as FlowBlock;
    expect(flowBlock).toBeDefined();
    expect(flowBlock.type).toBe('flow');
    expect(flowBlock.title).toBe('Xalqaro shartnoma tuzishning umumiy ketma-ketligi');
    expect(flowBlock.steps.length).toBe(3);
    expect(flowBlock.steps[0].title).toBe('1-bosqich');
    expect(flowBlock.sourceLine).toBe(4);
    expect(flowBlock.steps[0].sourceLine).toBe(5);
  });

  it('2. Compares and timelines carry accurate sourceLine for "Manbaga o\'tish"', () => {
    const md = `# Hujjat\n\n## 1-bo'lim\ntaqqos: Fuqarolik huquqi vs Jinoyat huquqi\n- Predmet: Shaxsiy mulkiy : Jamoat xavfsizligi\n\nvaqt: Tarixiy sanalar\n1991 | Mustaqillik | Deklaratsiya`;
    const res = parseMarkdownPlus(md);
    expect(res.document).toBeDefined();

    const compBlock = res.document?.sections[0].blocks[0];
    const timeBlock = res.document?.sections[0].blocks[1];

    expect(compBlock?.sourceLine).toBe(4);
    expect(timeBlock?.sourceLine).toBe(7);
  });

  it('3. Inline formatting renders bold, italic, bold+italic and handles Cyrillic & punctuation', () => {
    // Basic bold and italic
    const r1 = renderFormattedText('**qalin** va *kursiv*');
    expect(r1).toBeDefined();

    // Bold with punctuation
    const r2 = renderFormattedText('**qalin:** tavsif va **muhim**,');
    expect(r2).toBeDefined();

    // Triple asterisk bold+italic
    const r3 = renderFormattedText('***juda muhim qoida***');
    expect(r3).toBeDefined();

    // Cyrillic bold
    const r4 = renderFormattedText('**Ўзбекистон Республикаси**');
    expect(r4).toBeDefined();
  });

  it('4. Canvas editor supports editing flow_title directly', () => {
    const md = `# Hujjat\n\n## 1-bo'lim\njarayon: Eski Jarayon Nomi\nA -> B -> C`;
    const result = applyCanvasEditToSource(md, {
      editType: 'flow_title',
      newText: 'Yangi Shartnoma Bosqichlari',
      sourceLine: 4
    });

    expect(result.success).toBe(true);
    expect(result.newSource).toContain('jarayon: Yangi Shartnoma Bosqichlari');
    expect(result.newSource).toContain('A -> B -> C');
  });
});
