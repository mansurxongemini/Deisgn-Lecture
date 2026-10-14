import { describe, it, expect } from 'vitest';
import { parseMarkdownPlus } from '../schema/mdParser';
import { serializeToMarkdownPlus } from '../schema/mdSerializer';
import sampleConstitution from '../samples/constitutional_law.md?raw';
import sampleCivil from '../samples/civil_law.md?raw';

describe('MD+ to Rendered Document Integration', () => {
  it('to‘liq MD+ konspekt matnini hech qanday xatoliksiz AST ga o‘tkazadi va bloklar to‘liq shakllanadi', () => {
    // 1. Konstitutsiyaviy huquq namunasi
    const constResult = parseMarkdownPlus(sampleConstitution);
    expect(constResult.document).toBeDefined();
    expect(constResult.document.title).toContain('Konstitutsiyaviy Huquqi');
    expect(constResult.document.sections.length).toBeGreaterThan(0);

    const constBlocks = constResult.document.sections[0].blocks;
    expect(constBlocks.length).toBeGreaterThan(5);

    // Blok turlari to'g'ri biriktirilganligini tekshirish
    const blockTypes = constBlocks.map((b) => b.type);
    expect(blockTypes).toContain('text');
    expect(blockTypes).toContain('norm');
    expect(blockTypes).toContain('note');
    expect(blockTypes).toContain('table');
    expect(blockTypes).toContain('case');
    expect(blockTypes).toContain('qa');
    expect(blockTypes).toContain('compare');
    expect(blockTypes).toContain('flow');
    expect(blockTypes).toContain('timeline');

    // 2. Fuqarolik huquqi namunasi
    const civilResult = parseMarkdownPlus(sampleCivil);
    expect(civilResult.document).toBeDefined();
    expect(civilResult.document.title).toContain('Fuqarolik Huquqi');
    expect(civilResult.document.sections[0].blocks.length).toBeGreaterThan(5);
  });

  it('buzilgan yoki chala yozilgan MD+ matnida ham tizim qulab tushmaydi, xatosiz render obyekti hosil qiladi', () => {
    const malformedInputs = [
      '',
      '   \n\n   ',
      '# ',
      '## ',
      '§',
      '!',
      '+',
      'kazus:',
      '?',
      '~',
      '|',
      'taqqos:',
      'jarayon:',
      'vaqt:',
      'Random matn qatori hech qanday markersiz\n\nYana bir paragraf',
      `# Test Hujjati
## 1-bo'lim
kazus: Bo'sh kazus
? Javobsiz savol
§ 1-modda
manba: Manba
`
    ];

    malformedInputs.forEach((input) => {
      expect(() => {
        const res = parseMarkdownPlus(input);
        expect(res.document).toBeDefined();
        expect(res.document.sections).toBeDefined();
        // Serializatsiya ham xatoliksiz ishlashi kerak
        const roundTrip = serializeToMarkdownPlus(res.document);
        expect(typeof roundTrip).toBe('string');
      }).not.toThrow();
    });
  });

  it('foydalanuvchi JSON matni kiritganda ham (oddiy matn sifatida tushsa ham) qulab tushmaydi', () => {
    const jsonStr = JSON.stringify({
      version: '1.0',
      title: 'JSON Test Hujjat',
      sections: []
    });

    expect(() => {
      const res = parseMarkdownPlus(jsonStr);
      expect(res.document).toBeDefined();
      expect(res.document.title).toBeDefined();
    }).not.toThrow();
  });
});
