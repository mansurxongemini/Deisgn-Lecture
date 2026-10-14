import { generateAiPrompt, type PromptTemplateOptions } from '../schema/mdSpec';

export interface SmartIngestOptions {
  includeQuestions?: boolean;
  docTitle?: string;
  author?: string;
  theme?: string;
}

/**
 * Sun’iy intellekt (ChatGPT, Claude, Gemini) uchun yuridik konspekt
 * MD+ formati bo‘yicha to‘liq va professional yo‘riqnoma.
 */
export function generateAiInstructions(rawText: string = ''): string {
  return generateAiPrompt({
    includeQuestions: true,
    detailLevel: 'detailed',
    rawText: rawText || '[Konspekt yoki qonun matningizni shu yerga qo‘ying]'
  });
}

/**
 * Maxsus sozlamalar bilan AI promptini generatsiya qilish
 */
export function buildCustomAiPrompt(options: PromptTemplateOptions): string {
  return generateAiPrompt(options);
}

/**
 * Xom huquqiy matnni mijoz tomonda (oflayn, zudlik bilan) MD+ formatiga
 * intellektual tahlil qilib o'tkazuvchi konvertor funksiyasi.
 */
export function convertRawTextToMdPlus(rawText: string, options: SmartIngestOptions = {}): string {
  if (!rawText || !rawText.trim()) {
    return '';
  }

  const {
    includeQuestions = true,
    docTitle,
    author = 'Yurist Studio',
    theme = 'classic'
  } = options;

  const lines = rawText.trim().split(/\r?\n/);
  const blocks: string[] = [];
  const createdQaCount = { count: 0 };
  const extractedDefinitions: Array<{ term: string; def: string }> = [];
  const extractedNorms: Array<{ num: string; title: string; text: string }> = [];

  // 1. Agar birinchi qatorda # bo'lmasa, sarlavha blokini qo'shish
  let hasDocTitle = false;
  if (lines.length > 0 && lines[0].startsWith('# ')) {
    hasDocTitle = true;
  } else {
    const firstLine = lines[0].trim();
    const isLikelyContentLine = /^(?:\d+[-–]modda|norma:|savol:|\?|ta'?rif:|ogoh:|maslahat:|kazus:|[^\s—–-]{2,40}\s*[—–-]\s*(?:bu\s+)?)/i.test(firstLine);
    const guessedTitle = docTitle || (!isLikelyContentLine && firstLine.length < 70 && !firstLine.includes(':') ? firstLine : 'Yuridik Konspekt');
    blocks.push(`# ${guessedTitle}\nmuallif: ${author}\nuslub: ${theme}\nizoh: Avtomatik formatlangan yuridik konspekt`);
    if (!docTitle && !isLikelyContentLine && firstLine.length < 70 && !firstLine.includes(':')) {
      lines.shift();
    }
  }

  const isBlockStartLine = (str: string): boolean => {
    return /^(?:##|\d+[-–]bob|\d+[-–]mavzu|bob\s+\d+|mavzu\s+\d+|savol:|\?|ogoh:|diqqat:|muhim:|maslahat:|tavsiya:|eslatma:|norma:|\d+[-–]modda|[§]\s*\d+|ta'?rif:|atama:|kazus:|taqqos:|jarayon:)/i.test(str.trim());
  };

  // Qatorlarni xatboshilarga guruhlash
  const paragraphs: string[] = [];
  let currentPara: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      if (currentPara.length > 0) {
        paragraphs.push(currentPara.join('\n'));
        currentPara = [];
      }
    } else {
      if (currentPara.length > 0 && isBlockStartLine(trimmed)) {
        paragraphs.push(currentPara.join('\n'));
        currentPara = [];
      }
      currentPara.push(line);
    }
  }
  if (currentPara.length > 0) {
    paragraphs.push(currentPara.join('\n'));
  }

  // Har bir xatboshini mantiqiy blok turiga ajratish
  for (let pIdx = 0; pIdx < paragraphs.length; pIdx++) {
    const pText = paragraphs[pIdx].trim();
    if (!pText) continue;

    // 1. Bo'lim sarlavhasi (##)
    const sectionMatch = pText.match(/^(?:##\s+(.*)|(\d+[-–]bob|\d+[-–]mavzu|bob\s+\d+|mavzu\s+\d+)[:.]?\s*(.*))$/i);
    if (sectionMatch) {
      const sTitle = sectionMatch[1] || `${sectionMatch[2] || ''}. ${sectionMatch[3] || ''}`.trim();
      blocks.push(`## ${sTitle}`);
      continue;
    }

    // 2. Savol-Javob bloki (savol: ... javob: ...)
    const qaMatch = pText.match(/(?:savol|\?|question)\s*[:.]?\s*(.+?)(?:\r?\n|\s+)(?:javob|answer)\s*[:.]?\s*([\s\S]+)/i);
    if (qaMatch) {
      const q = qaMatch[1].trim();
      const a = qaMatch[2].trim();
      blocks.push(`savol: ${q}\njavob: ${a}`);
      createdQaCount.count++;
      continue;
    }

    // 3. Ogohlantirish (ogoh:) yoki Maslahat (maslahat:)
    const warnMatch = pText.match(/^(?:ogoh|diqqat|muhim|ogohlantirish)\s*[:.]?\s*(.+)$/i);
    if (warnMatch) {
      blocks.push(`ogoh: ${warnMatch[1].trim()}`);
      continue;
    }
    const tipMatch = pText.match(/^(?:maslahat|tavsiya|eslatma)\s*[:.]?\s*(.+)$/i);
    if (tipMatch) {
      blocks.push(`maslahat: ${tipMatch[1].trim()}`);
      continue;
    }

    // 4. Qonun normasi (norma: 354-modda...)
    // Masalan: "354-modda. Shartnoma erkinligi\nFuqarolar va yuridik shaxslar..."
    const normMatch = pText.match(/^(?:norma:\s*)?(?:(\d+[-–]modda|[§]\s*\d+)\.?\s*[:–-]?\s*([^\n\r]*))(?:\r?\n([\s\S]+))?$/i);
    if (normMatch && normMatch[1]) {
      const moddaNum = normMatch[1].trim();
      const moddaTitle = normMatch[2]?.trim() || 'Modda qoidasi';
      const moddaBody = normMatch[3]?.trim() || '';
      blocks.push(moddaBody ? `norma: ${moddaNum}: ${moddaTitle}\n${moddaBody}` : `norma: ${moddaNum}: ${moddaTitle}`);
      extractedNorms.push({ num: moddaNum, title: moddaTitle, text: moddaBody });
      continue;
    }

    // 5. Atama va ta'rif (ta'rif: X: Y yoki X — bu Y)
    const explicitDefMatch = pText.match(/^(?:ta'?rif:\s*)([^:\n\r]{2,60})\s*:\s*([^\n\r]+)$/i) ||
      pText.match(/^(?:atama:\s*)([^\n\r]+)(?:\r?\n|\s+)(?:ta'?rif:\s*)([^\n\r]+)$/i);
    if (explicitDefMatch) {
      const term = explicitDefMatch[1].trim();
      const def = explicitDefMatch[2].trim();
      blocks.push(`ta'rif: ${term}: ${def}`);
      extractedDefinitions.push({ term, def });
      continue;
    }

    const dashDefMatch = pText.match(/^([^—–:-]{3,50})\s*[—–-]\s*(?:bu\s+)?([^\n\r]+)$/i);
    if (dashDefMatch && !pText.startsWith('- ') && !pText.startsWith('* ')) {
      const term = dashDefMatch[1].trim();
      const def = dashDefMatch[2].trim();
      blocks.push(`ta'rif: ${term}: ${def}`);
      extractedDefinitions.push({ term, def });
      continue;
    }

    // 6. Sud amaliyoti / Kazus (kazus: ...)
    const caseMatch = pText.match(/^(?:kazus|sud ishi|amaliy kazus)\s*[:.]?\s*([^\n\r]*)(?:\r?\n([\s\S]+))?$/i);
    if (caseMatch) {
      const cTitle = caseMatch[1]?.trim() || 'Sud ishi amaliyoti';
      const cBody = caseMatch[2]?.trim() || '';
      // Ichki bo'laklarni tekshirish (fakt, qoida, xulosa)
      if (cBody.includes('fakt:') || cBody.includes('qoida:') || cBody.includes('xulosa:')) {
        blocks.push(`kazus: ${cTitle}\n${cBody}`);
      } else {
        const factText = cBody || 'Holat tafsilotlari bayon etilmagan.';
        blocks.push(`kazus: ${cTitle}\nfakt: ${factText}\nqoida: Amaldagi qonunchilik normalari.\nxulosa: Qonun talablari asosida hal qilinsin.`);
      }
      continue;
    }

    // 7. Qiyosiy tahlil yoki Taqqoslash (taqqos: A | B)
    if (pText.startsWith('taqqos:')) {
      blocks.push(pText);
      continue;
    }

    // 8. Jarayon (jarayon: ...)
    if (pText.startsWith('jarayon:')) {
      blocks.push(pText);
      continue;
    }

    // 9. Ro'yxat yoki oddiy matn
    blocks.push(pText);
  }

  // 10. Agar matnda savol-javoblar umuman bo'lmasa va includeQuestions=true bo'lsa,
  // ajratib olingan ta'riflar va normalardan foydalanib o'quv fleshkardlarini generatsiya qilish
  if (includeQuestions && createdQaCount.count === 0) {
    const generatedQaList: string[] = [];

    // Ta'riflardan savol
    extractedDefinitions.slice(0, 3).forEach((d) => {
      generatedQaList.push(`savol: ${d.term} nima?\njavob: ${d.def}`);
    });

    // Normalardan savol
    extractedNorms.slice(0, 2).forEach((n) => {
      generatedQaList.push(`savol: ${n.num} qoidasi nimani belgilaydi?\njavob: ${n.title}. ${n.text ? n.text.slice(0, 120) + '...' : ''}`);
    });

    if (generatedQaList.length > 0) {
      blocks.push(`## Takrorlash va Imtihon Savollari`);
      generatedQaList.forEach((qa) => blocks.push(qa));
    }
  }

  return (hasDocTitle ? '' : '') + blocks.join('\n\n');
}
