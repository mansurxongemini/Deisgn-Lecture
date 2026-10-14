import { describe, it, expect } from 'vitest';
import { renderToString } from 'react-dom/server';
import { ExamTrainer } from '../components/exam/ExamTrainer';
import type { LegalDocument } from '../schema/types';

describe('ExamTrainer: Spaced Repetition Suite', () => {
  const sampleDoc: LegalDocument = {
    title: 'Fuqarolik Huquqi Imtihoni',
    institution: 'Toshkent Davlat Yuridik Universiteti',
    sections: [
      {
        title: '1-Bob. Shartnomalar',
        blocks: [
          {
            id: 'qa-1',
            type: 'qa',
            question: 'Shartnoma nima?',
            answer: 'Ikki yoki undan ortiq shaxslarning fuqarolik huquqlari va majburiyatlarini vujudga keltirish haqidagi kelishuvi.',
            hint: 'FK 353-moddasiga qarang',
            category: 'Majburiyatlar'
          },
          {
            id: 'qa-2',
            type: 'qa',
            question: 'Oferta nima?',
            answer: 'Shartnoma tuzish haqidagi yetarlicha aniq taklif.',
            category: 'Bitimlar'
          }
        ]
      }
    ]
  };

  it('savol-javoblarni interaktiv karta formatida render qilishi kerak', () => {
    const html = renderToString(
      <ExamTrainer
        document={sampleDoc}
        activeTheme="classic"
      />
    );

    // 1. Sarlavha va statistika paneli
    expect(html).toContain('Imtihon Trenajyori (SM-2)');
    expect(html).toContain('Fuqarolik Huquqi Imtihoni');
    expect(html).toContain('Bugungi reja:');
    expect(html).toContain('Ketma-ketlik:');

    // 2. Birinchi savol ko'rinishi
    expect(html).toContain('Shartnoma nima?');
    expect(html).toContain('1-Bob. Shartnomalar');
    expect(html).toContain('Majburiyatlar');
    expect(html).toContain('Maslahat:');
    expect(html).toContain('FK 353-moddasiga qarang');

    // 3. Javobni ochish tugmasi
    expect(html).toContain('Javobni ko‘rsatish');
    expect(html).toContain('Space');
  });

  it('hujjatda savollar bo‘lmaganda, ammo ta’riflar bo‘lganda ularni o‘quv kartasiga aylantirishi kerak', () => {
    const defDoc: LegalDocument = {
      title: 'Yuridik Atamalar',
      sections: [
        {
          title: 'Atamalar',
          blocks: [
            {
              id: 'def-1',
              type: 'definition',
              term: 'Delikt',
              definition: 'Zarar yetkazish natijasidagi huquqbuzarlik.',
              source: 'Fuqarolik Kodeksi'
            }
          ]
        }
      ]
    };

    const html = renderToString(
      <ExamTrainer
        document={defDoc}
        activeTheme="modern"
      />
    );

    expect(html).toContain('«Delikt» atamasining huquqiy ta’rifi nima?');
    expect(html).toContain('Atama va ta’rif');
    expect(html).toContain('Manba: Fuqarolik Kodeksi');
  });

  it('hech qanday savol yoki ta’rif bo‘lmaganda bo‘sh holat va aqlli formatlash tugmasini ko‘rsatishi kerak', () => {
    const emptyDoc: LegalDocument = {
      title: 'Bo‘sh Hujjat',
      sections: [
        {
          title: 'Matn',
          blocks: [
            {
              id: 'txt-1',
              type: 'text',
              text: 'Oddiy matn xatboshisi.'
            }
          ]
        }
      ]
    };

    const html = renderToString(
      <ExamTrainer
        document={emptyDoc}
        activeTheme="classic"
        onOpenAiIngestion={() => {}}
      />
    );

    expect(html).toContain('Savol-javoblar topilmadi');
    expect(html).toContain('Aqlli formatlash / Fleshkard yaratish');
  });

  it('savol-javoblar va ta’riflar birga kelganda ikkalasini ham navbatga olishi kerak', () => {
    const mixedDoc: LegalDocument = {
      title: 'Aralash Hujjat',
      sections: [
        {
          title: '1-Bo‘lim',
          blocks: [
            {
              id: 'qa-1',
              type: 'qa',
              question: 'Savol bir?',
              answer: 'Javob bir'
            },
            {
              id: 'def-1',
              type: 'definition',
              term: 'Majburiyat',
              definition: 'Bir shaxsning boshqa shaxs foydasiga muayyan harakatni amalga oshirish burchi.'
            }
          ]
        }
      ]
    };

    const html = renderToString(
      <ExamTrainer
        document={mixedDoc}
        activeTheme="classic"
      />
    );

    expect(html).toContain('Savol bir?');
    expect(html).toContain('Barchasi');
    expect(html).toContain('2');
  });
});
