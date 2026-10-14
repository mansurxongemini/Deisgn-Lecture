import civilRaw from './civil_law.md?raw';
import constRaw from './constitutional_law.md?raw';
import xalqaroRaw from './xalqaro_huquq.md?raw';
import caseStudyRaw from './case_study.md?raw';
import flashcardsRaw from './flashcards.md?raw';
import blankRaw from './blank.md?raw';

export interface SampleDocItem {
  id: string;
  title: string;
  badge: string;
  description: string;
  theme: 'modern' | 'classic';
  content: string;
}

export const SAMPLE_CATALOG: SampleDocItem[] = [
  {
    id: 'civil_law',
    title: 'Fuqarolik huquqi',
    badge: 'Klassik dars',
    description: 'Shartnoma erkinligi, majburiyatlar, zararlar jadvali va sud amaliyoti',
    theme: 'classic',
    content: civilRaw
  },
  {
    id: 'constitutional_law',
    title: 'Konstitutsiyaviy huquq',
    badge: 'Davlat huquqi',
    description: 'Inson qadri, odil sudlov kafolatlari, xabeas korpus va xronologiya',
    theme: 'classic',
    content: constRaw
  },
  {
    id: 'xalqaro_huquq',
    title: 'Xalqaro ommaviy huquq',
    badge: 'Xalqaro huquq',
    description: 'BMT Nizomi, Vena konvensiyasi, xalqaro sud kazusi va shartnomalar jarayoni',
    theme: 'classic',
    content: xalqaroRaw
  },
  {
    id: 'case_study',
    title: 'Kazus shabloni',
    badge: 'Sud amaliyoti',
    description: 'Amaliy holat, faktlar, savol, moddiy norma va yakuniy xulosalar',
    theme: 'classic',
    content: caseStudyRaw
  },
  {
    id: 'flashcards',
    title: 'Fleshkard darsi',
    badge: 'Savol-Javob',
    description: 'Imtihon va testlar uchun savol-javoblar, atamalar va taqqoslash',
    theme: 'modern',
    content: flashcardsRaw
  },
  {
    id: 'blank',
    title: 'Bo‘sh hujjat',
    badge: 'Toza qoralama',
    description: 'Boshlang‘ich sarlavha va standart norma bilan yangi toza hujjat',
    theme: 'modern',
    content: blankRaw
  }
];
