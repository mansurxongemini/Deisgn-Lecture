/**
 * MD+ (Markdown Plus) formati uchun yagona haqiqat manbasi (Single Source of Truth).
 * Barcha asosiy belgilar so‘z ko‘rinishida (Primary word form) taqdim etiladi.
 * Simvollar (§ ~ ? = ! +) va @ prefiksi yashirin muqobillar (silent aliases) hisoblanadi.
 */

export interface MarkerSpec {
  id: string;
  name: string;
  primaryMarker: string;
  aliases: string[];
  description: string;
  example: string;
  rule: string;
}

export const MD_MARKERS: MarkerSpec[] = [
  {
    id: 'doc_title',
    name: 'Hujjat sarlavhasi',
    primaryMarker: '#',
    aliases: ['#'],
    description: 'Hujjatning bosh sarlavhasi va metama’lumotlari',
    example: '# Fuqarolik Huquqi\nmuallif: TDYU\nuslub: classic\nizoh: Majburiyatlar qonunchiligi',
    rule: 'Faqat bitta bo‘ladi, ostida muallif, uslub (classic, modern, dark, minimal) va izoh ko‘rsatiladi'
  },
  {
    id: 'section_title',
    name: 'Bo‘lim sarlavhasi',
    primaryMarker: '##',
    aliases: ['##'],
    description: 'Yangi mavzu yoki bob bo‘limi',
    example: '## 1-bob. Shartnoma asoslari\nBo‘lim tavsifi yoki kichik izohi',
    rule: '## dan keyingi qator (bo‘sh joy qoldirmasdan) bo‘limning izohi (subtitle) hisoblanadi'
  },
  {
    id: 'norm',
    name: 'Qonun normasi',
    primaryMarker: 'norma:',
    aliases: ['@norma', '§'],
    description: 'Modda yoki normativ-huquqiy hujjat qoidasi',
    example: 'norma: 354-modda: Shartnoma erkinligi printsipi\nmanba: Fuqarolik Kodeksi\nsana: 01.03.1997\nFuqarolar va yuridik shaxslar shartnoma tuzishda erkindirlar.',
    rule: 'norma: dan keyin modda raqami va sarlavhasi, ostida manba/sana (ixtiyoriy) va norma matni'
  },
  {
    id: 'definition',
    name: 'Atama va ta’rif',
    primaryMarker: "ta'rif:",
    aliases: ['tarif:', "taʼrif:", "ta'rif:", '@tarif', '@tarif:', '~'],
    description: 'Yuridik atama va uning rasmiy tushunchasi',
    example: "ta'rif: Delikt: Huquqbuzarlik natijasida yetkazilgan zarar.\nmanba: Fuqarolik Kodeksi",
    rule: "ta'rif: Atama: ta’rif matni (ostida ixtiyoriy manba:)"
  },
  {
    id: 'qa',
    name: 'Savol-javob (Flashcard)',
    primaryMarker: 'savol: / javob:',
    aliases: ['@savol', '@javob', '?', '='],
    description: 'O‘z-o‘zini tekshirish savoli va javobi',
    example: 'savol: Oferta nima?\njavob: Shartnoma tuzish haqidagi aniq taklif.\nmaslahat: FK 367-moddasiga qarang.',
    rule: 'savol: savol matni, javob: javob matni, ostida ixtiyoriy maslahat:'
  },
  {
    id: 'warning_note',
    name: 'Ogohlantirish',
    primaryMarker: 'ogoh:',
    aliases: ['@ogoh', '!'],
    description: 'Qat’iy qoida yoki muhim ogohlantirish',
    example: 'ogoh: Majburiyat buzilsa umumiy da’vo muddati 3 yil.',
    rule: 'ogoh: dan keyin ogohlantirish matni yoziladi'
  },
  {
    id: 'tip_note',
    name: 'Maslahat',
    primaryMarker: 'maslahat:',
    aliases: ['@maslahat', '+'],
    description: 'Amaliy tavsiya yoki maslahat',
    example: 'maslahat: Shartnomani har doim yozma rasmiylashtiring.',
    rule: 'maslahat: dan keyin amaliy tavsiya yoziladi'
  },
  {
    id: 'case',
    name: 'Kazus (Sud ishi)',
    primaryMarker: 'kazus:',
    aliases: ['@kazus'],
    description: 'Sud amaliyoti yoki o‘quv kazusi',
    example: 'kazus: Ijara nizosi\nfakt: Tomonlar og‘zaki kelishgan.\nqoida: FK 574-moddasi yozma shaklni talab qiladi.\nxulosa: Da’vo qanoatlantirilmasin.\nmanba: Toshkent shahar sudi',
    rule: 'Sarlavhadan keyin fakt:, qoida:, xulosa: va ixtiyoriy manba: yoziladi'
  },
  {
    id: 'list',
    name: 'Ro‘yxat',
    primaryMarker: '- yoki 1.',
    aliases: ['*', '-'],
    description: 'Tartiblangan yoki tartiblanmagan ro‘yxat',
    example: '- Shartnoma predmeti\n- Taraflarning huquqlari\n- Majburiyatlar',
    rule: 'Har bir band yangi qatorda - yoki 1. bilan boshlanadi'
  },
  {
    id: 'table',
    name: 'Jadval',
    primaryMarker: '|',
    aliases: ['|'],
    description: 'Klassik Markdown jadvali',
    example: '| Turi | Muddati |\n| --- | --- |\n| Umumiy | 3 yil |\n| Maxsus | 6 oy |',
    rule: 'Standart Markdown ustun va qatorlari'
  },
  {
    id: 'compare',
    name: 'Taqqoslash',
    primaryMarker: 'taqqos:',
    aliases: ['@taqqos'],
    description: 'Ikki tushunchaning o‘zaro farqlari',
    example: 'taqqos: Voz kechish | Bekor qilish\n- Voz kechish: Bir tomonlama harakat\n- Bekor qilish: Sud yoki o‘zaro kelishuv',
    rule: 'taqqos: A | B va ostida ularning farqli bandlari'
  },
  {
    id: 'flow',
    name: 'Jarayon / Bosqichlar',
    primaryMarker: 'jarayon:',
    aliases: ['@jarayon'],
    description: 'Ketma-ket harakatlar zanjiri',
    example: 'jarayon: Shartnoma tuzish bosqichlari\nOferta yuborish -> Aksept olish -> Imzolash',
    rule: 'jarayon: Sarlavha va ostida a -> b -> c zanjiri'
  },
  {
    id: 'timeline',
    name: 'Vaqt xaritasi',
    primaryMarker: 'vaqt:',
    aliases: ['@vaqt'],
    description: 'Xronologik voqealar ro‘yxati',
    example: 'vaqt: Qonun qabul qilinishi\n1997-yil | Qonun qabul qilindi\n2023-yil | Yangi tahrir kuchga kirdi',
    rule: 'vaqt: Sarlavha va ostida sana | voqea qatorlari'
  }
];

export interface InlineFormatSpec {
  name: string;
  syntax: string;
  description: string;
  example: string;
}

export const INLINE_FORMATS: InlineFormatSpec[] = [
  {
    name: 'Qalin matn',
    syntax: '**matn**',
    description: 'Muhim atamalarni ajratib ko‘rsatish',
    example: '**shartnoma erkinligi**'
  },
  {
    name: 'Kursiv matn',
    syntax: '*matn*',
    description: 'Qo‘shimcha urg‘u berish',
    example: '*e’tibor bering*'
  },
  {
    name: 'Ajratilgan matn (Highlight)',
    syntax: '==matn==',
    description: 'Sariq marker bilan belgilash',
    example: '==haqiqiy emas=='
  },
  {
    name: 'Ichki havola (Chip)',
    syntax: '[[modda-nomi]]',
    description: 'Hujjatdagi boshqa modda yoki sarlavhaga havola',
    example: '[[354-modda]]'
  },
  {
    name: 'Tekshirish belgisi',
    syntax: '??',
    description: 'AI yoki foydalanuvchi ishonchi komil bo‘lmagan joyga nozik belgi qo‘yadi',
    example: '3 yil?? muddatda'
  },
  {
    name: 'Barqaror identifikator',
    syntax: '{#id}',
    description: 'Blokning doimiy identifikatori (tahrirda takrorlash tarixini saqlash uchun)',
    example: 'savol: Oferta nima? {#savol-1}'
  }
];

/**
 * Bir ekranlik ixcham Cheat-Sheet matnini yaratadi (Faqat asosiy so‘z ko‘rinishida o‘rgatadi).
 */
export function generateCheatSheetText(): string {
  return `=== MD+ FORMATI BO‘YICHA BIR EKRANLIK QO‘LLANMA ===

1. Hujjat va bo‘lim:
   # Hujjat sarlavhasi
   muallif: Ism Familiya
   uslub: classic | modern | dark | minimal
   izoh: Qisqacha tavsif
   ## 1-bo‘lim nomi
   Bo‘lim ostidagi izoh matni...

2. Qonun normasi:
   norma: 354-modda: Shartnoma erkinligi
   manba: Fuqarolik Kodeksi
   sana: 01.03.1997
   Normaning rasmiy matni shu yerda yoziladi...

3. Eslatma va maslahat:
   ogoh: Majburiyat buzilsa javobgarlik kelib chiqadi.
   maslahat: Shartnomani notarial tasdiqlang.

4. Amaliy sud kazusi:
   kazus: Ish sarlavhasi
   fakt: Ish holatlari...
   qoida: Qo‘llaniladigan qonun qoidasi...
   xulosa: Yakuniy sud qarori...
   manba: Toshkent shahar sudi

5. Fleshkard (Savol-javob):
   savol: Qonunning asosiy printsipi nima?
   javob: Taraflarning tengligi va shartnoma erkinligi.
   maslahat: FK 354-moddasiga qarang.

6. Atama va ta’rif:
   ta'rif: Forc-major: Favqulodda va oldini olib bo‘lmas vaziyatlar.
   manba: Fuqarolik Kodeksi

7. Maxsus bloklar:
   taqqos: Shartnoma | Bitim
   - Shartnoma: Ikki yoki undan ortiq taraflar kelishuvi
   - Bitim: Bir tomonlama ham bo‘lishi mumkin

   jarayon: Sud muhokamasi
   Da’vo kiritish -> Sud majlisi -> Qaror qabul qilish

   vaqt: Xronologiya
   1997 | Kodeks qabul qilindi
   2023 | Referendum o‘tkazildi

8. Matn, ro‘yxat va jadval:
   Oddiy xatboshi hech qanday markersiz yoziladi.
   - Ro‘yxat bandi 1
   - Ro‘yxat bandi 2
   | Ustun 1 | Ustun 2 |
   | --- | --- |
   | Qiymat 1 | Qiymat 2 |

9. Ichki belgilar:
   **qalin**, *kursiv*, ==ajratilgan==, [[354-modda]] (havola), ?? (tekshiring)`;
}

export interface PromptTemplateOptions {
  includeQuestions: boolean;
  detailLevel: 'short' | 'detailed';
  rawText?: string;
}

/**
 * Foydalanuvchi istalgan AIga (ChatGPT, Claude, Gemini) berishi uchun
 * to‘liq va professional tizimli prompt generatsiya qiladi.
 */
export function generateAiPrompt(options: PromptTemplateOptions): string {
  const { includeQuestions, detailLevel, rawText = '' } = options;

  const detailInstruction =
    detailLevel === 'short'
      ? '- Matnni juda ixcham, faqat eng zarur mohiyat va qonuniy asoslarni qoldirib umumlashtiring. Har bir blok 2-4 qatordan oshmasin.'
      : '- Matnni to‘liq va batafsil yoriting, barcha muhim tushunchalar, moddalar, faktlar va tushuntirishlarni saqlang.';

  const questionsInstruction = includeQuestions
    ? '- Har bir bo‘lim (##) oxirida talabalar o‘rganishi va takrorlashi uchun 3 tadan 5 tagacha sifatli savol-javob (savol: va javob:) bloklarini qo‘shing.'
    : '- Savol-javob bloklarini faqat manbada to‘g‘ridan-to‘g‘ri savol mavjud bo‘lsagina kiriting.';

  return `Siz — yuridik fanlar bo‘yicha tajribali metodist va tahlilchisiz.
Quyida berilgan konspekt yoki qonun hujjatini zich, professional, chop etishga tayyor A4 formatdagi yuridik konspekt ("MD+" formati)ga o‘tkazib bering.

QAT’IY TALABLAR:
1. Javobingizni FAQAT bitta Markdown kod blokida (\`\`\`md ... \`\`\`) bering. Kod blokidan oldin yoki keyin hech qanday kirish/xulosa so‘zlari yozmang.
2. QAT’IYAN MAN ETILADI: Chiqarilayotgan matnda "Ro'yxat:", "Jadval:" yoki "Inline belgilar:" kabi sun'iy yorliq yoki so‘zlarni aslo yozmang! Ro‘yxat bandlarini to‘g‘ridan-to‘g‘ri "-" yoki "1." bilan, jadvallarni esa bevosita "|" bilan boshlang.
3. SANA QOIDASI: Sanani (sana:) faqat manbada aniq ko‘rsatilgan bo‘lsa bering (masalan: "sana: 26.06.1945 (imzolangan)"). Agar sana manbada bo‘lmasa, uni qoldirib keting yoki ?? bilan belgilang. Hech qachon o‘zingizdan "kuchga kirgan sana" to‘qimang!
4. Manbadagi modda raqamlari, atamalar va qonuniy iqtiboslarni aslo o‘zgartirmang va to‘qimang.
5. Agar biror ma’lumot noaniq yoki shubhali bo‘lsa, oxiriga ?? belgisini qo‘ying (masalan: "3 yil??").
6. O‘zbek lotin alifbosida, rasmiy, tushunarli va imlo xatolarisiz yozing.
7. Har bir bo‘lim (##) ostida matn uzluksiz oqimda, ixcham bloklar bilan joylashsin.
${detailInstruction}
${questionsInstruction}

MD+ FORMATI VA BIR BUTUN NAMUNA HUJJAT:
\`\`\`md
# Xalqaro Shartnomalar Huquqi
muallif: Xalqaro huquq kafedrasi
uslub: classic
izoh: Xalqaro shartnomalarni tuzish, ratifikatsiya qilish va bajarish asoslari

## 1-Mavzu. Xalqaro shartnomaning tushunchasi va turlari
Xalqaro shartnoma xalqaro huquq subyektlari o‘rtasida tuziladigan asosiy yozma hujjatdir.

norma: 2-modda. Xalqaro shartnoma atamasi
manba: Xalqaro shartnomalar huquqi to‘g‘risidagi Vena konvensiyasi
sana: 23.05.1969
Davlatlar o‘rtasida yozma shaklda tuzilgan va xalqaro huquq bilan tartibga solinadigan xalqaro bitim xalqaro shartnoma hisoblanadi.

ta'rif: Ratifikatsiya: Davlatning xalqaro shartnoma bilan bog‘liqligiga rozilik bildirishini tasdiqlovchi oliy davlat organi akti.
manba: Vena konvensiyasi 14-modda

ogoh: Davlat shartnomani bajarmaslik uchun o‘z ichki qonunchiligiga tayanishi taqiqlanadi (27-modda).

- Davlatlararo shartnomalar (davlat rahbarlari nomidan tuziladi)
- Hukumatlararo shartnomalar (ijro organi nomidan tuziladi)
- Idoralararo shartnomalar (vazirliklar va idoralar o‘rtasida tuziladi)

| Shartnoma turi | Ishtirokchilar soni | Kuchga kirish tartibi |
| --- | --- | --- |
| Ikki tomonlama | 2 ta davlat | Ratifikatsiya yorliqlari almashilgan kundan |
| Ko‘p tomonlama | 3 va undan ortiq | Depozitariyga yorliqlar topshirilgach |

kazus: Milliy qonun va xalqaro norma to‘qnashuvi
vaziyat: Ichki bojxona qoidalarida xorijiy yuklarga qo‘shimcha boj belgilangan, ammo davlat qo‘shilgan xalqaro bitimda ushbu tovarlar bojsiz o‘tishi belgilangan.
qoida: Konstitutsiyaning 15-moddasiga muvofiq, xalqaro huquqning umum e’tirof etilgan prinsiplari ustuvorlikka ega.
xulosa: Bojxona organi xalqaro bitim normasini to‘g‘ridan-to‘g‘ri qo‘llashi va boj undirmasligi shart.

taqqos: Ratifikatsiya | Tasdiqlash
- Ratifikatsiya: Parlament qonuni bilan amalga oshiriladi
- Ratifikatsiya: Siyosiy va strategik ahamiyatga ega bitimlar uchun shart
- Tasdiqlash: Hukumat qarori bilan amalga oshiriladi
- Tasdiqlash: Texnik va idoralararo bitimlar uchun qo‘llaniladi

jarayon: Xalqaro shartnoma tuzish bosqichlari
Muzokaralar olib borish -> Matnni qabul qilish -> Imzolash -> Ratifikatsiya qilish -> Kuchga kirishi -> Majburiyatlarning bajarilishi

savol: Pacta sunt servanda qoidasining ma’nosi nima?
javob: Har bir amaldagi shartnoma uning ishtirokchilari uchun majburiydir va vijdonan bajarilishi shart.
maslahat: Vena konvensiyasining 26-moddasiga qarang.
\`\`\`

ASOSIY MATN:
---
${rawText.trim() || '[Konspekt yoki matningizni shu yerga qo‘ying]'}
---`;
}
