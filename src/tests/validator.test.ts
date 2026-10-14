import { describe, it, expect } from 'vitest';
import { validateLegalDocumentJson } from '../schema/validator';
import sampleConstitution from '../../public/samples/constitutional_law.json?raw';
import sampleCivil from '../../public/samples/civil_law.json?raw';

describe('Legal Document Validator (O‘zbek tilidagi xabarlar bilan)', () => {
  it('bo‘sh JSON kiritilganda to‘g‘ri xatolik qaytarishi kerak', () => {
    const res = validateLegalDocumentJson('');
    expect(res.valid).toBe(false);
    expect(res.issues[0].message).toContain('JSON matni bo‘sh');
  });

  it('noto‘g‘ri JSON sintaksisida aniq xatolik qaytarishi kerak', () => {
    const res = validateLegalDocumentJson('{ "title": "Test" broken }');
    expect(res.valid).toBe(false);
    expect(res.issues[0].message).toContain('JSON sintaksisida xatolik bor');
  });

  it('majburiy maydonlar (title, sections) yo‘qligini tekshirishi kerak', () => {
    const json = JSON.stringify({
      author: 'Ali Valiyev'
    });
    const res = validateLegalDocumentJson(json);
    expect(res.valid).toBe(false);
    const msgs = res.issues.map((i) => i.message);
    expect(msgs.some((m) => m.includes('"title"'))).toBe(true);
    expect(msgs.some((m) => m.includes('"sections"'))).toBe(true);
  });

  it('version maydoni son (1) yoki matn ("1.0") bo‘lganda to‘g‘ri qabul qilinishi va normallashishi kerak', () => {
    const json = JSON.stringify({
      version: 1,
      title: 'Yuridik hujjat',
      sections: [{ title: 'Kirish', blocks: [{ type: 'text', text: 'Matn' }] }]
    });
    const res = validateLegalDocumentJson(json);
    expect(res.valid).toBe(true);
    expect(res.document?.version).toBe('1');
  });

  it('version ko‘rsatilmaganda hujjat bloklanmasdan ogohlantirish berishi va 1.0 qilib olinishi kerak', () => {
    const json = JSON.stringify({
      title: 'Yuridik hujjat',
      sections: [{ title: 'Kirish', blocks: [{ type: 'text', text: 'Matn' }] }]
    });
    const res = validateLegalDocumentJson(json);
    expect(res.valid).toBe(true);
    expect(res.document?.version).toBe('1.0');
    expect(res.warnings.some((w) => w.message.includes('"version" ko‘rsatilmagan'))).toBe(true);
  });

  it('case va table bloklarida title ishlatilishi, legacy name/caption ham kechirilishi kerak', () => {
    const json = JSON.stringify({
      title: 'Sud amaliyoti',
      sections: [
        {
          title: 'Ishlar',
          blocks: [
            {
              type: 'case',
              name: 'Eski formatdagi ish nomi',
              facts: 'Faktlar',
              rule: 'Norma',
              conclusion: 'Xulosa'
            },
            {
              type: 'table',
              title: 'Yangi jadval sarlavhasi',
              headers: ['A'],
              rows: [['1']]
            }
          ]
        }
      ]
    });
    const res = validateLegalDocumentJson(json);
    expect(res.valid).toBe(true);
    expect(res.document?.sections[0].blocks[0].type).toBe('case');
    // Name avtomatik title ga normallashgan
    expect((res.document?.sections[0].blocks[0] as { title?: string }).title).toBe('Eski formatdagi ish nomi');
  });

  it('jadvalda qator va sarlavha kataklari mos kelmaganda aniq tushuntirish berishi kerak', () => {
    const json = JSON.stringify({
      version: '1.0',
      title: 'Yuridik hujjat',
      sections: [
        {
          title: '3-bo‘lim',
          blocks: [
            {
              type: 'text',
              text: 'Kirish'
            },
            {
              type: 'table',
              headers: ['A', 'B', 'C'],
              rows: [['1', '2', '3', '4']]
            }
          ]
        }
      ]
    });

    const res = validateLegalDocumentJson(json);
    expect(res.valid).toBe(false);
    const tableError = res.issues.find((i) => i.path.includes('rows[0]'));
    expect(tableError).toBeDefined();
    expect(tableError?.message).toContain('1-qatorda 4 ta katak bor, sarlavhada esa 3 ta');
  });

  it('noma’lum blok turini inkor qilishi kerak', () => {
    const json = JSON.stringify({
      version: '1.0',
      title: 'Hujjat',
      sections: [
        {
          title: 'Asosiy',
          blocks: [{ type: 'unknown_type' }]
        }
      ]
    });
    const res = validateLegalDocumentJson(json);
    expect(res.valid).toBe(false);
    expect(res.issues[0].message).toContain('noma’lum blok turi "unknown_type"');
  });

  it('to‘g‘ri hujjatda barqaror ID larni hosil qilib, ogohlantirishlar berishi kerak', () => {
    const json = JSON.stringify({
      version: '1.0',
      title: 'Konstitutsiya',
      sections: [
        {
          title: 'Muqaddima',
          blocks: [
            {
              type: 'norm',
              number: '1-modda',
              title: 'Davlat suvereniteti',
              text: 'O‘zbekiston — suveren, demokratik, huquqiy davlat.'
            },
            {
              type: 'qa',
              question: '1-modda nima haqida?',
              answer: 'Davlat suvereniteti haqida.'
            }
          ]
        }
      ]
    });

    const res = validateLegalDocumentJson(json);
    expect(res.valid).toBe(true);
    expect(res.document).not.toBeNull();
    // Sections va blocks avtomatik ID olgan bo'lishi kerak
    expect(res.document?.sections[0].id).toBeDefined();
    expect(res.document?.sections[0].blocks[0].id).toBeDefined();
    expect(res.document?.sections[0].blocks[1].id).toBeDefined();
    // ID ko'rsatilmaganligi haqida ogohlantirishlar bo'lishi kerak
    expect(res.warnings.length).toBeGreaterThan(0);
  });

  it('namunaviy konstitutsiyaviy huquq JSON hujjati to‘liq valid bo‘lishi kerak', () => {
    const res = validateLegalDocumentJson(sampleConstitution);
    expect(res.valid).toBe(true);
    expect(res.document?.title).toContain('Konstitutsiyaviy');
    expect(res.issues).toHaveLength(0);
  });

  it('namunaviy fuqarolik huquqi JSON hujjati to‘liq valid bo‘lishi kerak', () => {
    const res = validateLegalDocumentJson(sampleCivil);
    expect(res.valid).toBe(true);
    expect(res.document?.title).toContain('Fuqarolik');
    expect(res.issues).toHaveLength(0);
  });
});
