/**
 * Yuridik talabalar va oddiy foydalanuvchilar uchun
 * tushunarli, samimiy va amaliy qo‘llanma ma’lumotlari.
 * Hech qanday texnik jargonlarsiz (parser, AST, token, syntax o'rniga: qolip, belgi, qator boshidagi so'z).
 */

export interface LessonItem {
  id: string;
  title: string;
  badge: string;
  isCore: boolean; // Dastlabki 6 ta asosiy qolipmi yoki qo'shimchami
  whyNeeded: string;
  howToText: string;
  exampleSnippet: string;
  commonMistake: {
    wrong: string;
    explanation: string;
    correct: string;
  };
}

export interface WarningGuideItem {
  code: string;
  title: string;
  exampleSnippet: string;
  explanation: string;
  howToFix: string;
}

export interface FaqItem {
  question: string;
  answer: string;
  category: 'asosiy' | 'tahrirlash' | 'xavfsizlik' | 'pdf';
}

/**
 * 2 daqiqalik kirish uchun namunaviy matn (0 ogohlantirish bilan tahlil qilinadi)
 */
export const QUICK_INTRO_EXAMPLE = `# Fuqarolik Majburiyatlari
muallif: Rustam Karimov
uslub: classic
izoh: Shartnoma tuzish va bajarish asoslari

## 1-bo‘lim. Shartnoma erkinligi
Fuqarolik huquqida shartnoma tuzish erkinligi bosh tamoyil hisoblanadi.

norma: 354-modda: Shartnoma erkinligi printsipi
manba: Fuqarolik Kodeksi
Fuqarolar va yuridik shaxslar shartnoma tuzishda erkindirlar.

ogoh: Majburiyat bajarilmasa jarima undirilishi mumkin.

savol: Shartnoma qachon tuzilgan hisoblanadi?
javob: Barcha muhim shartlar bo‘yicha kelishuvga erishilganda.`;

/**
 * 10 ta asosiy darslik (ahamiyati bo'yicha tartiblangan)
 */
export const GUIDE_LESSONS: LessonItem[] = [
  {
    id: 'text-list',
    title: '1. Oddiy matn va ro‘yxatlar',
    badge: 'Asosiy',
    isCore: true,
    whyNeeded:
      'Qonun sharhlari, kirish so‘zlari va tushuntirishlarni kitob kabi chiroyli ko‘rinishda yozish uchun.',
    howToText:
      'Oddiy xatboshini hech qanday belgisiz yozing. Xatboshilar orasida bitta bo‘sh qator qoldiring. Ro‘yxat uchun har bir qator boshiga chiziqcha (-) yoki raqam (1.) qo‘ying. Muhim so‘zlarni **qalin** yoki ==sariq fonda== belgilashingiz mumkin.',
    exampleSnippet: `Shartnoma tuzishda taraflar erkindir. Majburiyatlarni buzish ==fuqarolik javobgarligiga== olib keladi.

- Oldi-sotdi shartnomasi
- Mulk ijarasi kelishuvi
- Pudrat va xizmat ko‘rsatish`,
    commonMistake: {
      wrong: `Shartnoma tuzish erkin.
- Oldi-sotdi
- Ijara (lekin orasida bo'sh qator qoldirilmagan)`,
      explanation:
        'Ro‘yxat yoki yangi fikr boshlanishidan oldin bitta bo‘sh qator qoldirish matnni kitobda chiroyli ajratib beradi.',
      correct: `Shartnoma tuzish erkin.

- Oldi-sotdi
- Ijara`
    }
  },
  {
    id: 'norm',
    title: '2. Qonun normasi (norma:)',
    badge: 'Asosiy',
    isCore: true,
    whyNeeded:
      'Modda raqami, uning sarlavhasi va rasmiy qonun matnini talaba diqqatini tortadigan qonuniy lavha ko‘rinishida chiqarish uchun.',
    howToText:
      'Qator boshida "norma:" deb yozing, ketidan modda raqami va sarlavhasini kiriting. Keyingi qatorda manbani (masalan: manba: Fuqarolik Kodeksi) va uning ostida qonunning asl matnini yozing.',
    exampleSnippet: `norma: 354-modda: Shartnoma erkinligi printsipi
manba: O‘zbekiston Respublikasi Fuqarolik Kodeksi
sana: 01.03.1997
Fuqarolar va yuridik shaxslar shartnoma tuzishda erkindirlar. Shartnoma tuzishga majburlashga yo‘l qo‘yilmaydi.`,
    commonMistake: {
      wrong: `norma: 354-modda`,
      explanation:
        'Faqat modda raqami yozilib, uning ostidagi matni tashlab ketilsa, dastur ogohlantirish beradi.',
      correct: `norma: 354-modda: Shartnoma erkinligi
Fuqarolar shartnoma tuzishda erkindirlar.`
    }
  },
  {
    id: 'notes',
    title: '3. Ogohlantirish va Maslahat (ogoh:, maslahat:)',
    badge: 'Asosiy',
    isCore: true,
    whyNeeded:
      'Muhim qonuniy ogohlantirishlar, jazo choralari yoki amaliy hayotiy tavsiyalarni alohida ramkada ko‘rsatish uchun.',
    howToText:
      'Qator boshida "ogoh:" (qizil/to‘q sariq hoshiyali) yoki "maslahat:" (yashil/ko‘k hoshiyali) deb yozing va davomidan fikringizni bildiring.',
    exampleSnippet: `ogoh: Majburiyatni bajarmaslik da’vo muddati o‘tgach huquqiy himoyadan mahrum qilishi mumkin.

maslahat: Ko‘chmas mulk oldi-sotdisini albatta notarial tasdiqlashdan o‘tkazing.`,
    commonMistake: {
      wrong: `Bu juda muhim ogoh: e'tibor bering`,
      explanation:
        '"ogoh:" so‘zi gap o‘rtasida kelsa, u oddiy matn bo‘lib qoladi. Qolip ishlashi uchun u qat’iy ravishda qator boshida turishi kerak.',
      correct: `ogoh: Bu juda muhim, e'tibor bering!`
    }
  },
  {
    id: 'qa',
    title: '4. Savol-javob va Fleshkard (savol:, javob:)',
    badge: 'Asosiy',
    isCore: true,
    whyNeeded:
      'O‘rganilgan mavzuni o‘z-o‘zini sinash va oraliq takrorlash (SM-2 fleshkardlari) orqali yodda saqlash uchun.',
    howToText:
      'Qator boshida "savol:" deb savolni yozing. Keyingi qatorda "javob:" bilan aniq javob bering. Istasangiz ostiga "maslahat:" deb yordamchi eslatma qo‘shishingiz mumkin.',
    exampleSnippet: `savol: Qanday holatda shartnoma tuzilgan deb hisoblanadi?
javob: Taraflar barcha muhim shartlar bo‘yicha qonuniy shaklda kelishuvga erishgan paytdan boshlab.
maslahat: Fuqarolik Kodeksining 364-moddasiga e'tibor bering.`,
    commonMistake: {
      wrong: `savol: Oferta nima?
Bu shartnoma taklifi.`,
      explanation:
        'Savoldan keyin "javob:" so‘zi qo‘yilmasa, dastur javob qayerdaligini tushunmaydi va ogohlantiradi.',
      correct: `savol: Oferta nima?
javob: Shartnoma tuzish haqidagi aniq taklif.`
    }
  },
  {
    id: 'definition',
    title: '5. Atama va ta’rif (ta\'rif:)',
    badge: 'Asosiy',
    isCore: true,
    whyNeeded:
      'Yuridik tushunchalar, lotincha atamalar va rasmiy ta’riflarni alohida lug‘at kartochkasi ko‘rinishida taqdim etish uchun.',
    howToText:
      'Qator boshida "ta\'rif:" (yoki "tarif:") deb yozing. Keyin atama nomini, ikki nuqta qo‘yib uning ta’rifini kiriting.',
    exampleSnippet: `ta'rif: Forc-major: Tomonlarning irodasiga bog‘liq bo‘lmagan, oldini olib bo‘lmas favqulodda holatlar.
manba: Fuqarolik Kodeksi 333-modda`,
    commonMistake: {
      wrong: `ta'rif: Forc-major`,
      explanation:
        'Atamadan keyin ikki nuqta va uning ta’rifi yozilmasa, lug‘at kartochkasi bo‘sh qoladi.',
      correct: `ta'rif: Forc-major: Favqulodda va yengib bo‘lmas vaziyatlar.`
    }
  },
  {
    id: 'table',
    title: '6. Qiyosiy jadval (| ... |)',
    badge: 'Asosiy',
    isCore: true,
    whyNeeded:
      'Taqqoslanadigan moddalar, muddatlar va huquqiy toifalarni ustun shaklida qulay solishtirish uchun.',
    howToText:
      'Standart Markdown jadvalidan foydalaning. Kataklar oralig‘ini | belgisi bilan ajrating. Ikkinchi qatorga | --- | --- | chiziqchasini qo‘ying.',
    exampleSnippet: `| Da’vo turi | Standart muddati | Qonuniy asosi |
| --- | --- | --- |
| Umumiy muddat | 3 yil | FK 150-modda |
| Maxsus muddat | 6 oy | FK 151-modda |`,
    commonMistake: {
      wrong: `| Muddat | Asos |
| 3 yil | FK 150-modda |`,
      explanation:
        'Sarlavha bilan qatorlar o‘rtasidagi | --- | --- | ajratgich qatori tushirib qoldirilsa, jadval to‘g‘ri shakllanmaydi.',
      correct: `| Muddat | Asos |
| --- | --- |
| 3 yil | FK 150-modda |`
    }
  },
  {
    id: 'case',
    title: '7. Amaliy sud kazusi (kazus:)',
    badge: 'Qo‘shimcha',
    isCore: false,
    whyNeeded:
      'Talabalar huquqni qo‘llash amaliyotini o‘rganishi uchun real sud nizolari va ularning yechimini ko‘rsatish.',
    howToText:
      '"kazus:" dan keyin ish nomini yozing. Keyingi qatorlarda fakt: (ish holatlari), qoida: (qaysi modda qo‘llandi) va xulosa: (sud hukmi) bandlarini to‘ldiring.',
    exampleSnippet: `kazus: Mahsulot yetkazib berish bo‘yicha nizo
manba: Toshkent tumanlararo iqtisodiy sudi
fakt: Yetkazib beruvchi tovarni 20 kun kechiktirdi va ob-havoni vaj qildi.
qoida: FK 333-moddasiga ko‘ra oddiy ob-havo o‘zgarishi fors-major hisoblanmaydi.
xulosa: Sud yetkazilgan zararni javobgardan to‘liq undirishga qaror qildi.`,
    commonMistake: {
      wrong: `kazus: Ijara nizosi
fakt: Ijara haqi to'lanmadi.
Sud da'voni qanoatlantirdi.`,
      explanation:
        'Kazusda "qoida:" va "xulosa:" aniq ko‘rsatilmasa, metodik jihatdan to‘liq bo‘lmaydi va tizim ogohlantiradi.',
      correct: `kazus: Ijara nizosi
fakt: Ijara haqi to'lanmadi.
qoida: FK 556-modda bo'yicha to'lov shart.
xulosa: Sud da'voni qanoatlantirdi.`
    }
  },
  {
    id: 'compare',
    title: '8. Tushunchalarni taqqoslash (taqqos:)',
    badge: 'Qo‘shimcha',
    isCore: false,
    whyNeeded:
      'Bir-biriga o‘xshash huquqiy institutlarning (masalan, shartnoma va bitim) o‘zaro farqlarini yonma-yon ko‘rsatish uchun.',
    howToText:
      '"taqqos: Mavzu A | Mavzu B" deb yozing. Ostida chiziqcha (-) bilan har bir mavzuning xususiyatlarini sanab o‘ting.',
    exampleSnippet: `taqqos: Huquqdan voz kechish | Shartnomani bekor qilish
- Huquqdan voz kechish: Bir tomonlama iroda bilan amalga oshadi
- Shartnomani bekor qilish: O‘zaro kelishuv yoki sud qarori talab etiladi`,
    commonMistake: {
      wrong: `taqqos: Voz kechish va Bekor qilish`,
      explanation:
        'Ikkita tushuncha o‘rtasida | (tik chiziq) qo‘yilishi shart, shunda ular ikkita alohida ustunga ajraladi.',
      correct: `taqqos: Voz kechish | Bekor qilish`
    }
  },
  {
    id: 'flow',
    title: '9. Bosqichlar va Harakatlar (jarayon:)',
    badge: 'Qo‘shimcha',
    isCore: false,
    whyNeeded:
      'Sud jarayoni, qonun loyihasi qabul qilinishi yoki shartnoma tuzish bosqichlarini xarita kabi ketma-ket tasvirlash uchun.',
    howToText:
      '"jarayon: Nomi" deb yozing va pastdagi qatorda bosqichlarni -> belgisi bilan bog‘lang.',
    exampleSnippet: `jarayon: Shartnoma tuzish va ro‘yxatdan o‘tkazish
Oferta berish -> Aksept olish -> Shartnoma imzolash -> Davlat ro‘yxatidan o‘tkazish`,
    commonMistake: {
      wrong: `jarayon: Ishni ko'rish
1. Da'vo
2. Majlis
3. Qaror`,
      explanation:
        'Jarayon blokida bosqichlar zanjirini hosil qilish uchun bosqichlar orasiga -> ko‘rsatkichi qo‘yiladi.',
      correct: `jarayon: Ishni ko'rish
Da'vo kiritish -> Sud majlisi -> Qaror qabul qilish`
    }
  },
  {
    id: 'timeline',
    title: '10. Tarixiy vaqt xaritasi (vaqt:)',
    badge: 'Qo‘shimcha',
    isCore: false,
    whyNeeded:
      'Qonunchilikning rivojlanish tarixi, sanalar va muhim voqealarni xronologik tartibda ko‘rsatish uchun.',
    howToText:
      '"vaqt: Sarlavha" deb yozing. Pastdagi qatorlarda sana va voqeani | bilan ajrating.',
    exampleSnippet: `vaqt: Fuqarolik Qonunchiligi Rivoji
1997-yil | Yangi Fuqarolik Kodeksining 1-qismi qabul qilindi
2020-yil | Tadbirkorlik sohasidagi yangi kafolatlar joriy etildi
2024-yil | Xususiy mulk daxlsizligi kuchaytirildi`,
    commonMistake: {
      wrong: `vaqt: Xronologiya
1997-yilda kodeks qabul qilingan`,
      explanation:
        'Sana bilan voqea matni orasida | belgisi bo‘lishi lozim.',
      correct: `vaqt: Xronologiya
1997-yil | Kodeks qabul qilingan`
    }
  }
];

/**
 * Tizimdagi ogohlantirishlar lug'ati (oddiy inson tilida tushuntirilgan)
 */
export const WARNING_GUIDES: WarningGuideItem[] = [
  {
    code: 'missing-answer',
    title: 'Savol uchun javob topilmadi',
    exampleSnippet: `savol: Majburiyat nima?`,
    explanation:
      'Siz "savol:" deb savol yozgansiz, ammo uning javobini kiritmagansiz. Dastur baribir hujjatni chizadi, lekin savol javobsiz qoladi.',
    howToFix:
      'Savol ostiga "javob: [Javob matni]" qatorini qo‘shing.'
  },
  {
    code: 'missing-norm-text',
    title: 'Norma matni bo‘sh qoldirildi',
    exampleSnippet: `norma: 100-modda: Nomlanishi`,
    explanation:
      'Modda raqami va nomi yozilgan, ammo uning rasmiy qonuniy matni kiritilmagan.',
    howToFix:
      'Modda sarlavhasi ostidagi qatorda qonun matnini yozing.'
  },
  {
    code: 'missing-case-fields',
    title: 'Kazus blokida qoida: yoki xulosa: topilmadi',
    exampleSnippet: `kazus: Nizo ishi
fakt: Holat yozildi`,
    explanation:
      'Sud kazusi to‘liq bo‘lishi uchun uning qoidasi (qonun asosi) va xulosasi (sud qarori) kiritilishi shart.',
    howToFix:
      'Kazus ichiga "qoida: [Qonun moddasi]" va "xulosa: [Sud qarori]" qatorlarini qo‘shing.'
  },
  {
    code: 'missing-definition',
    title: 'Atamadan keyin ta’rif yozilmadi',
    exampleSnippet: `ta'rif: Restitutsiya:`,
    explanation:
      'Atama nomi yozilgan, ammo uning huquqiy tushunchasi kiritilmagan.',
    howToFix:
      'Ikki nuqtadan keyin atamaning tushuntirishini yozing.'
  },
  {
    code: 'table-column-mismatch',
    title: 'Jadvaldagi ustunlar soni sarlavhaga mos kelmadi',
    exampleSnippet: `| Modda | Nomi | Izoh |
| --- | --- | --- |
| 1-modda | Umumiy |`,
    explanation:
      'Jadval sarlavhasida 3 ta ustun bor, ammo pastdagi qatorda 2 ta katak yozilgan.',
    howToFix:
      'Yetishmayotgan ustun uchun | belgisini qo‘yib, qiymat yozing.'
  },
  {
    code: 'unknown-theme',
    title: 'Noma’lum uslub kiritildi',
    exampleSnippet: `uslub: chiroyli`,
    explanation:
      'Dasturda 4 ta rasmiy dizayn mavzusi mavjud: classic, modern, dark, minimal.',
    howToFix:
      'uslub: qatoriga shu 4 tasidan birini yozing (masalan: uslub: classic).'
  }
];

/**
 * Tez-tez beriladigan savollar (FAQ - kamida 10 ta real savol)
 */
export const FAQ_LIST: FaqItem[] = [
  {
    question: 'Gap oxiridagi so‘roq (?) yoki undov (!) belgisi xato keltirib chiqaradimi?',
    answer:
      'Aslo yo‘q! Belgilar faqat qat’iy ravishda qator boshida kelgandagina maxsus qolip sifatida olinadi. Gap ichidagi yoki oxiridagi "?", "!", "+", "=" belgilari oddiy matn sifatida xavfsiz aks etadi.',
    category: 'tahrirlash'
  },
  {
    question: 'Bo‘sh qator (Enter) nima vazifani bajaradi?',
    answer:
      'Bo‘sh qator bir fikrni (xatboshini) ikkinchisidan ajratadi. Xuddi Word yoki kitobdagidek, yangi mavzu yoki yangi qolip boshlashdan oldin bitta bo‘sh qator qoldirish tavsiya etiladi.',
    category: 'tahrirlash'
  },
  {
    question: 'Mening yozgan hujjatlarim qayerda saqlanadi, internet o‘chsa yo‘qolib ketmaydimi?',
    answer:
      'Barcha yozganlaringiz to‘g‘ridan-to‘g‘ri kompyuteringiz yoki telefoningizning xotirasida (IndexedDB) avtomatik saqlanadi. Internet o‘chib qolsa ham hujjatingiz xavfsiz turadi.',
    category: 'xavfsizlik'
  },
  {
    question: 'Telefon raqamimni matnga yozsam (+998...) ogohlantirish beradimi?',
    answer:
      'Yo‘q. Dastur "+" belgisidan keyin raqam kelganini aniqlaydi va uni maslahat bloki emas, balki telefon raqami deb to‘g‘ri tushunadi.',
    category: 'tahrirlash'
  },
  {
    question: 'Word yoki Telegramdan konspektni to‘g‘ridan-to‘g‘ri tashlasam bo‘ladimi?',
    answer:
      'Ha, albatta. Istalgan matnni tashlashingiz mumkin. Tizim uni xatosiz qabul qiladi va chiroyli sahifaga aylantiradi. Uni yanada boyitish uchun kerakli joylarga "norma:" yoki "savol:" kabi qoliplarni qo‘shib qo‘yishingiz mumkin.',
    category: 'asosiy'
  },
  {
    question: 'Qonun moddasi raqami va sarlavhasini qanday ajratish kerak?',
    answer:
      '"norma:" dan keyin avval modda raqami, so‘ng ikki nuqta qo‘yib sarlavhasi yoziladi. Masalan: "norma: 354-modda: Shartnoma erkinligi".',
    category: 'tahrirlash'
  },
  {
    question: 'AI (ChatGPT/Claude/Gemini) tayyorlab bergan matnda xatolar bo‘lsa nima qilish kerak?',
    answer:
      'AI ba’zan moddalar raqamida adashishi mumkin. Bosh sahifadagi AI ko‘rsatmasi AIni noaniq ma’lumotlar yoniga "??" qo‘yishga majburlaydi. Agar matnda sariq "tekshiring" belgisini ko‘rsangiz, o‘sha joyni rasmiy qonun hujjatidan bir bor tekshirib oling.',
    category: 'asosiy'
  },
  {
    question: 'Hujjatni qanday qilib qog‘ozga yoki PDF faylga aylantirsam bo‘ladi?',
    answer:
      'Yuqori o‘ng burchakdagi "PDF yuklab olish" tugmasini bosing. Eng mukammal va aniq natija uchun Google Chrome brauzeridan foydalanib, chop etish oynasida "Save as PDF" (PDF sifatida saqlash)ni tanlang.',
    category: 'pdf'
  },
  {
    question: 'Obsidian havolasi ([[130-modda]]) nima uchun kerak?',
    answer:
      'Agar matn ichida [[354-modda]] deb yozsangiz, u o‘quv kartasida bosiladigan chiroyli nishon (chip)ga aylanadi. Talaba uni bosganda hujjat ichidagi tegishli moddaga o‘tishi qulay bo‘ladi.',
    category: 'asosiy'
  },
  {
    question: 'Nega JSON emas, aynan shu sodda format (MD+) tanlangan?',
    answer:
      'Chunki JSON dasturchilar uchun mo‘ljallangan — unda bitta qavs yoki vergul tushib qolsa butun fayl buziladi. MD+ esa oddiy matn: uni har qanday talaba 2 daqiqada o‘rganadi va unda hech qachon xato qilib tizimni buzib bo‘lmaydi.',
    category: 'asosiy'
  }
];
