export interface SlashCommandItem {
  id: string;
  command: string;
  aliases?: string[];
  label: string;
  desc: string;
  iconName: 'heading' | 'scale' | 'gavel' | 'help-circle' | 'table' | 'alert-triangle' | 'lightbulb' | 'bookmark' | 'columns' | 'list-ordered' | 'clock';
  template: string;
  placeholder: string;
}

export const SLASH_COMMANDS: SlashCommandItem[] = [
  {
    id: 'sarlavha',
    command: '/sarlavha',
    aliases: ['/title', '/h2', '/mavzu'],
    label: 'Sarlavha',
    desc: 'Yangi mavzu yoki bo‘lim sarlavhasi',
    iconName: 'heading',
    template: '## Yangi mavzu sarlavhasi\n',
    placeholder: 'Yangi mavzu sarlavhasi'
  },
  {
    id: 'norma',
    command: '/norma',
    aliases: ['/modda', '/qoida', '/qonun'],
    label: 'Norma (Modda)',
    desc: 'Qonun yoki kodeks moddasi matni',
    iconName: 'scale',
    template: ':::norma\nmodda: 1-modda\nmanba: O‘zbekiston Respublikasi Konstitutsiyasi\nO‘zbekiston — suveren, demokratik, huquqiy, ijtimoiy va dunyoviy davlat.\n:::\n',
    placeholder: 'O‘zbekiston — suveren, demokratik, huquqiy, ijtimoiy va dunyoviy davlat.'
  },
  {
    id: 'kazus',
    command: '/kazus',
    aliases: ['/case', '/nizo', '/sud'],
    label: 'Kazus (Yuridik nizo)',
    desc: 'Amaliy holat, savol, tahlil va sud xulosasi',
    iconName: 'gavel',
    template: ':::kazus\nvaziyat: Fuqaro A. va korxona o‘rtasida shartnoma majburiyatlari bo‘yicha nizo kelib chiqdi.\nsavol: Ushbu nizo qaysi sudlovga tegishli?\ntahlil: Fuqarolik protsessual kodeksining tegishli moddalariga asosan...\nxulosa: Da‘vo arizasi fuqarolik ishlari bo‘yicha tumanlararo sudiga taqdim etiladi.\n:::\n',
    placeholder: 'Fuqaro A. va korxona o‘rtasida shartnoma majburiyatlari bo‘yicha nizo kelib chiqdi.'
  },
  {
    id: 'savol',
    command: '/savol',
    aliases: ['/fleshkard', '/javob', '/qa'],
    label: 'Savol-Javob',
    desc: 'Fleshkard uchun savol va yashirin javob',
    iconName: 'help-circle',
    template: ':::savol\nsavol: Huquqiy davlatning asosiy tamoyillari nimalardan iborat?\njavob: Qonun ustuvorligi, hokimiyatlar bo‘linishi va inson huquqlarining oliy qadriyat deb tan olinishi.\n:::\n',
    placeholder: 'Huquqiy davlatning asosiy tamoyillari nimalardan iborat?'
  },
  {
    id: 'jadval',
    command: '/jadval',
    aliases: ['/table', '/qiyos'],
    label: 'Jadval',
    desc: 'Ustunli qiyosiy ma’lumotlar jadvali',
    iconName: 'table',
    template: ':::jadval\n| Asos | Moddiy huquq | Protsessual huquq |\n|---|---|---|\n| Mohiyati | Huquq va majburiyatlarni belgilaydi | Huquqlarni himoya qilish tartibini belgilaydi |\n| Manbasi | Fuqarolik, Jinoyat kodeksi | FPK, JPK, MPK |\n:::\n',
    placeholder: '| Asos | Moddiy huquq | Protsessual huquq |'
  },
  {
    id: 'ogoh',
    command: '/ogoh',
    aliases: ['/eslatma', '/warning', '/diqqat'],
    label: 'Ogoh (Eslatma)',
    desc: 'Diqqat qilinishi shart bo‘lgan qoida va ogohlantirish',
    iconName: 'alert-triangle',
    template: ':::ogoh\nQonunni buzgan holda olingan dalillardan odil sudlovni amalga oshirishda foydalanishga yo‘l qo‘yilmaydi.\n:::\n',
    placeholder: 'Qonunni buzgan holda olingan dalillardan odil sudlovni amalga oshirishda foydalanishga yo‘l qo‘yilmaydi.'
  },
  {
    id: 'maslahat',
    command: '/maslahat',
    aliases: ['/tavsiya', '/tip'],
    label: 'Maslahat',
    desc: 'Amaliy tavsiya va ko‘rsatma',
    iconName: 'lightbulb',
    template: ':::maslahat\nShartnoma tuzishda har doim nizolarni hal qilish tartibi va fors-major bandlarini aniq yozing.\n:::\n',
    placeholder: 'Shartnoma tuzishda har doim nizolarni hal qilish tartibi va fors-major bandlarini aniq yozing.'
  },
  {
    id: 'ta\'rif',
    command: '/ta\'rif',
    aliases: ['/tarif', '/taʼrif', '/atama', '/termin'],
    label: 'Ta’rif (Atama)',
    desc: 'Yuridik atama va tushunchaning qat’iy izohi',
    iconName: 'bookmark',
    template: 'ta\'rif: Yuridik javobgarlik: Huquqbuzarlik sodir etgan shaxsga nisbatan davlat majburlov choralarining qo‘llanilishi.\nmanba: Yuridik ensiklopediya\n',
    placeholder: 'Yuridik javobgarlik: Huquqbuzarlik sodir etgan shaxsga nisbatan davlat majburlov choralarining qo‘llanilishi.'
  },
  {
    id: 'taqqos',
    command: '/taqqos',
    aliases: ['/compare', '/farq'],
    label: 'Taqqos (Ikki ustun)',
    desc: 'Ikki tushunchaning qiyosiy taqqoslanishi',
    iconName: 'columns',
    template: ':::taqqos\nchap_sarlavha: Huquq layoqati\nong_sarlavha: Muomala layoqati\n- Tug‘ilgan paytdan vujudga keladi | Voyaga yetganda to‘liq paydo bo‘ladi\n- Barcha fuqarolarda teng | Sud qarori bilan cheklanishi mumkin\n:::\n',
    placeholder: 'Huquq layoqati'
  },
  {
    id: 'jarayon',
    command: '/jarayon',
    aliases: ['/bosqich', '/steps', '/tartib'],
    label: 'Jarayon (Bosqichlar)',
    desc: 'Ketma-ket tartibdagi harakatlar va bosqichlar',
    iconName: 'list-ordered',
    template: ':::jarayon\n1. Da‘vo arizasini tayyorlash va dalillarni jamlash\n2. Davlat bojini to‘lash va nusxalarni yuborish\n3. Arizani tegishli sudga taqdim etish\n4. Dastlabki sud majlisida ishtirok etish\n:::\n',
    placeholder: '1. Da‘vo arizasini tayyorlash va dalillarni jamlash'
  },
  {
    id: 'vaqt',
    command: '/vaqt',
    aliases: ['/timeline', '/sana', '/xronologiya'],
    label: 'Vaqt (Xronologiya)',
    desc: 'Muhim sanalar va voqealar zanjiri',
    iconName: 'clock',
    template: ':::vaqt\n1991-yil 31-avgust: O‘zbekiston Respublikasining davlat mustaqilligi e‘lon qilindi\n1992-yil 8-dekabr: O‘zbekiston Respublikasi Konstitutsiyasi qabul qilindi\n:::\n',
    placeholder: '1991-yil 31-avgust: O‘zbekiston Respublikasining davlat mustaqilligi e‘lon qilindi'
  }
];

/**
 * Oddiy va noaniq (fuzzy) qidiruv funksiyasi
 */
export function filterSlashCommands(rawQuery: string): SlashCommandItem[] {
  let cleanQuery = rawQuery.trim().toLowerCase();
  if (cleanQuery.startsWith('/')) {
    cleanQuery = cleanQuery.slice(1);
  }

  if (!cleanQuery) {
    return SLASH_COMMANDS.slice(0, 8);
  }

  // 1. To'g'ridan-to'g'ri mos tushishlar (command, aliases, label)
  const exactOrPrefix: SlashCommandItem[] = [];
  const partialMatches: SlashCommandItem[] = [];
  const fuzzyMatches: SlashCommandItem[] = [];

  for (const item of SLASH_COMMANDS) {
    const cmdWithoutSlash = item.command.slice(1).toLowerCase();
    const labelLower = item.label.toLowerCase();
    const descLower = item.desc.toLowerCase();
    const aliasMatches = (item.aliases || []).some(a => a.toLowerCase().includes(cleanQuery));

    if (cmdWithoutSlash.startsWith(cleanQuery) || labelLower.startsWith(cleanQuery)) {
      exactOrPrefix.push(item);
    } else if (
      cmdWithoutSlash.includes(cleanQuery) ||
      labelLower.includes(cleanQuery) ||
      descLower.includes(cleanQuery) ||
      aliasMatches
    ) {
      partialMatches.push(item);
    } else {
      // Fuzzy tekshiruv: qidiruv so'zidagi harflar tartib bo'yicha uchrashi
      let qIdx = 0;
      const targetStr = `${cmdWithoutSlash} ${labelLower}`;
      for (let i = 0; i < targetStr.length && qIdx < cleanQuery.length; i++) {
        if (targetStr[i] === cleanQuery[qIdx]) {
          qIdx++;
        }
      }
      if (qIdx === cleanQuery.length) {
        fuzzyMatches.push(item);
      }
    }
  }

  return [...exactOrPrefix, ...partialMatches, ...fuzzyMatches].slice(0, 8);
}
