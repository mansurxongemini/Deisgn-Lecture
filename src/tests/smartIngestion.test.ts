import { describe, it, expect } from 'vitest';
import { convertRawTextToMdPlus, generateAiInstructions } from '../services/aiGuide';

describe('Smart Ingestion: convertRawTextToMdPlus', () => {
  it('xom matnni to‘g‘ri norma, ta’rif va eslatmalarga ajratishi kerak', () => {
    const raw = `354-modda. Shartnoma erkinligi printsipi
Fuqarolar va yuridik shaxslar shartnoma tuzishda erkindirlar.

Oferta — shartnoma tuzish haqidagi aniq taklif.

Diqqat: Majburiyat buzilsa javobgarlik kelib chiqadi.

Maslahat: Shartnomani har doim yozma tuzing.`;

    const result = convertRawTextToMdPlus(raw, { docTitle: 'Shartnoma Huquqi' });

    expect(result).toContain('# Shartnoma Huquqi');
    expect(result).toContain('norma: 354-modda: Shartnoma erkinligi printsipi');
    expect(result).toContain('Fuqarolar va yuridik shaxslar shartnoma tuzishda erkindirlar.');
    expect(result).toContain("ta'rif: Oferta: shartnoma tuzish haqidagi aniq taklif.");
    expect(result).toContain('ogoh: Majburiyat buzilsa javobgarlik kelib chiqadi.');
    expect(result).toContain('maslahat: Shartnomani har doim yozma tuzing.');
  });

  it('savol-javoblarni savol: va javob: bloklariga o‘tkazishi kerak', () => {
    const raw = `Savol: Delikt nima?
Javob: Huquqbuzarlik natijasida yetkazilgan zarar.`;

    const result = convertRawTextToMdPlus(raw);
    expect(result).toContain('savol: Delikt nima?');
    expect(result).toContain('javob: Huquqbuzarlik natijasida yetkazilgan zarar.');
  });

  it('agar savollar bo‘lmasa va includeQuestions=true bo‘lsa, ta’riflardan savol generatsiya qilishi kerak', () => {
    const raw = `Akkreditiv — bankning to‘lov kafolati.`;
    const result = convertRawTextToMdPlus(raw, { includeQuestions: true });

    expect(result).toContain("ta'rif: Akkreditiv: bankning to‘lov kafolati.");
    expect(result).toContain('## Takrorlash va Imtihon Savollari');
    expect(result).toContain('savol: Akkreditiv nima?');
    expect(result).toContain('javob: bankning to‘lov kafolati.');
  });

  it('colon sintaksisidagi ta’riflar va sarlavhasiz moddalarni toza formatlashi kerak', () => {
    const raw = `ta'rif: Garov: Majburiyatni ta'minlash vositasi
354-modda. Shartnoma erkinligi`;

    const result = convertRawTextToMdPlus(raw, { includeQuestions: false });
    expect(result).toContain("ta'rif: Garov: Majburiyatni ta'minlash vositasi");
    expect(result).toContain('norma: 354-modda: Shartnoma erkinligi');
    // trailing newline bo'lmasligi kerak
    expect(result).not.toContain('norma: 354-modda: Shartnoma erkinligi\n\n\n');
  });

  it('generateAiInstructions to‘liq prompt qaytarishi kerak', () => {
    const prompt = generateAiInstructions('Modda matni');
    expect(prompt).toContain('Siz — yuridik fanlar bo‘yicha tajribali metodist');
    expect(prompt).toContain('Modda matni');
  });
});
