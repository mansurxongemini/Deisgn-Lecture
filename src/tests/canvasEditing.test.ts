import { describe, it, expect } from 'vitest';
import { applyCanvasEditToSource } from '../services/canvasEditor';
import { parseMarkdownPlus } from '../schema/mdParser';

describe('TASK 7: Direct On-Canvas Editing Engine', () => {
  const sampleDocMd = `# Konstitutsiyaviy Huquq {#doc-head}
izoh: Asosiy qonun va davlat boshqaruvi asoslari

## 1-Bob. Asosiy Prinsiplar {#sec-prinsiplar}
Muqaddima va umumiy tushunchalar

Inson sha'ni va qadr-qimmati eng oliy qadriyatdir. {#p-human}

norma: 1-modda. Davlat suvereniteti {#norm-1}
O'zbekiston - suveren demokratik respublika.
manba: O'zbekiston Respublikasi Konstitutsiyasi
sana: 08.12.1992

ta'rif: Qonun ustuvorligi {#def-rule}
Barcha davlat organlari va fuqarolar qonunlarga so'zsiz bo'ysunishi shart.

? Huquqiy davlatning asosiy belgisi nima? {#qa-1}
= Qonun ustuvorligi va inson huquqlarining kafolatlanganligi.

! Muhim eslatma: Konstitutsiya oliy yuridik kuchga ega. {#note-1}

kazus: Sud amaliyoti bo'yicha nizo {#case-1}
`;

  it('1. Hujjat sarlavhasi (doc_title) tahrirlanganda {#id} saqlanadi va manbada yangilanadi', () => {
    const res = applyCanvasEditToSource(sampleDocMd, {
      editType: 'doc_title',
      newText: 'O‘zbekiston Konstitutsiyaviy Huquqi',
      sourceLine: 1
    });

    expect(res.success).toBe(true);
    expect(res.newSource).toContain('# O‘zbekiston Konstitutsiyaviy Huquqi {#doc-head}');
    
    // AST tekshiruvi
    const parsed = parseMarkdownPlus(res.newSource!);
    expect(parsed.document.title).toBe('O‘zbekiston Konstitutsiyaviy Huquqi');
  });

  it('2. Bo‘lim sarlavhasi (sec_title) tahrirlanganda manbada to‘g‘ri aks etadi', () => {
    const res = applyCanvasEditToSource(sampleDocMd, {
      editType: 'sec_title',
      newText: '1-Bob. Davlat Suvereniteti Asoslari',
      sourceLine: 4,
      sectionTitle: '1-Bob. Asosiy Prinsiplar'
    });

    expect(res.success).toBe(true);
    expect(res.newSource).toContain('## 1-Bob. Davlat Suvereniteti Asoslari {#sec-prinsiplar}');
    
    const parsed = parseMarkdownPlus(res.newSource!);
    expect(parsed.document.sections[0].title).toBe('1-Bob. Davlat Suvereniteti Asoslari');
  });

  it('3. Paragraf matni (paragraph) tahrirlanganda faqat o‘sha qator o‘zgaradi', () => {
    const res = applyCanvasEditToSource(sampleDocMd, {
      editType: 'paragraph',
      newText: 'Inson sha’ni, qadr-qimmati va erkinligi eng oliy qadriyatdir.',
      sourceLine: 7,
      blockId: 'p-human'
    });

    expect(res.success).toBe(true);
    expect(res.newSource).toContain('Inson sha’ni, qadr-qimmati va erkinligi eng oliy qadriyatdir. {#p-human}');
  });

  it('4. Qonun normasi sarlavhasi va matni (norm_title, norm_text) tahrirlanganda manba va sana saqlanadi', () => {
    // Sarlavha tahriri
    const resTitle = applyCanvasEditToSource(sampleDocMd, {
      editType: 'norm_title',
      newText: '1-modda. Yangilangan Davlat suvereniteti',
      sourceLine: 9,
      blockId: 'norm-1'
    });
    expect(resTitle.success).toBe(true);
    expect(resTitle.newSource).toContain('norma: 1-modda. Yangilangan Davlat suvereniteti {#norm-1}');

    // Matn tahriri
    const resText = applyCanvasEditToSource(resTitle.newSource!, {
      editType: 'norm_text',
      newText: 'O‘zbekiston — suveren, demokratik, huquqiy, ijtimoiy va dunyoviy davlat.',
      sourceLine: 9,
      blockId: 'norm-1'
    });
    expect(resText.success).toBe(true);
    expect(resText.newSource).toContain('O‘zbekiston — suveren, demokratik, huquqiy, ijtimoiy va dunyoviy davlat.');
    expect(resText.newSource).toContain('manba: O\'zbekiston Respublikasi Konstitutsiyasi');
    expect(resText.newSource).toContain('sana: 08.12.1992');
  });

  it('5. Savol-javob fleshkard (qa_question, qa_answer) tahrirlanganda markerlar buzilmaydi', () => {
    const parsedInit = parseMarkdownPlus(sampleDocMd);
    const qaBlock = parsedInit.document.sections[0].blocks.find((b) => b.id === 'qa-1');

    const resQ = applyCanvasEditToSource(sampleDocMd, {
      editType: 'qa_question',
      newText: 'Huquqiy demokratik davlatning tub mohiyati nima?',
      sourceLine: qaBlock?.sourceLine,
      blockId: 'qa-1'
    });
    expect(resQ.success).toBe(true);
    expect(resQ.newSource).toContain('? Huquqiy demokratik davlatning tub mohiyati nima? {#qa-1}');

    const resA = applyCanvasEditToSource(resQ.newSource!, {
      editType: 'qa_answer',
      newText: 'Konstitutsiya va qonunlarning barcha uchun so‘zsiz ustuvorligi.',
      sourceLine: qaBlock?.sourceLine,
      blockId: 'qa-1'
    });
    expect(resA.success).toBe(true);
    expect(resA.newSource).toContain('= Konstitutsiya va qonunlarning barcha uchun so‘zsiz ustuvorligi.');
  });

  it('6. Ta’rif atamasi (def_term) tahrirlanganda ta’rif markeri va id saqlanadi', () => {
    const parsedInit = parseMarkdownPlus(sampleDocMd);
    const defBlock = parsedInit.document.sections[0].blocks.find((b) => b.id === 'def-rule');

    const res = applyCanvasEditToSource(sampleDocMd, {
      editType: 'def_term',
      newText: 'Qonuniylik va huquqiy tartibot',
      sourceLine: defBlock?.sourceLine,
      blockId: 'def-rule'
    });
    expect(res.success).toBe(true);
    expect(res.newSource).toContain("ta'rif: Qonuniylik va huquqiy tartibot {#def-rule}");
  });

  it('7. Ogoh/maslahat eslatmasi (note_text) tahrirlanganda ! markeri saqlanadi', () => {
    const parsedInit = parseMarkdownPlus(sampleDocMd);
    const noteBlock = parsedInit.document.sections[0].blocks.find((b) => b.id === 'note-1');

    const res = applyCanvasEditToSource(sampleDocMd, {
      editType: 'note_text',
      newText: 'Eslatma: Barcha qonunlar Konstitutsiyaga qat’iy mos bo‘lishi lozim.',
      sourceLine: noteBlock?.sourceLine,
      blockId: 'note-1'
    });
    expect(res.success).toBe(true);
    expect(res.newSource).toContain('! Eslatma: Barcha qonunlar Konstitutsiyaga qat’iy mos bo‘lishi lozim. {#note-1}');
  });

  it('8. Xavfsizlik va butunlik himoyasi (Protect integrity): noto‘g‘ri tahrirlar hujjat tuzilishini buzmaydi', () => {
    // Agar foydalanuvchi butun bo'limni o'chiradigan yoki bo'shatib qo'yadigan noto'g'ri so'rov bersa
    const corruptedMd = '';
    const res = applyCanvasEditToSource(corruptedMd, {
      editType: 'sec_title',
      newText: 'Bo‘sh hujjat',
      sourceLine: 1
    });

    // Bo'sh hujjatda bo'lim topilmaydi yoki parser bo'sh deb rad etadi
    expect(res.success).toBe(false);
    expect(res.error).toBeDefined();
  });
});
