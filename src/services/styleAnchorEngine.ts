/**
 * YURIST STUDIO — STYLE ANCHOR & TRACKING ENGINE (Step V-B)
 *
 * Matn tahrirlanganda (muharrirda yoki jonli ko'rinishda)
 * uslub bog'ichlarini (offsets & quote anchors) xatosiz
 * siljitish va qayta bog'lash xizmati.
 */

import {
  type StyleAnnotation,
  createTextQuoteAnchor
} from '../schema/styleAnnotation';

export interface TextChange {
  from: number;         // O'zgarish boshlangan belgi indeksi
  to: number;           // O'zgarish tugagan belgi indeksi
  insertText: string;   // Kiritilgan yangi matn (bo'sh bo'lsa - o'chirish)
}

export interface ReanchorResult {
  resolved: StyleAnnotation[];
  unresolved: StyleAnnotation[];
  warningMessage?: string;
}

/**
 * Matn ichidagi tahrir amali orqali barcha uslublarni siljitish (Operational Mapping)
 */
export function mapAnnotationsThroughChange(
  annotations: StyleAnnotation[],
  change: TextChange,
  fullNewText: string
): StyleAnnotation[] {
  const delta = change.insertText.length - (change.to - change.from);
  const now = Date.now();
  const nextAnnotations: StyleAnnotation[] = [];

  for (const ann of annotations) {
    // Agar uslub blok darajasida bo'lsa va matn offsetiga bog'lanmagan bo'lsa
    if (ann.kind === 'block' && ann.startOffset === 0 && ann.endOffset === 0) {
      nextAnnotations.push({ ...ann, updatedAt: now });
      continue;
    }

    const { startOffset, endOffset } = ann;

    // 1. O'zgarish uslubdan butunlay OLDIN yuz berdi
    if (change.to <= startOffset) {
      // Chegara: agar to === startOffset va insertText bor bo'lsa
      // Yangi yozilgan matn uslubdan oldin joylashadi, uslub orqaga siljiydi
      const newStart = startOffset + delta;
      const newEnd = endOffset + delta;
      if (newStart < newEnd && newEnd <= fullNewText.length) {
        nextAnnotations.push({
          ...ann,
          startOffset: newStart,
          endOffset: newEnd,
          quote: createTextQuoteAnchor(fullNewText, newStart, newEnd),
          updatedAt: now
        });
      }
      continue;
    }

    // 2. O'zgarish uslubdan butunlay KEYIN yuz berdi
    if (change.from >= endOffset) {
      // Chegara qoidasi (Boundary rule):
      // Agar change.from === endOffset bo'lsa, uslub oxiridan keyin yozilgan
      // yangi matn uslubni kengaytirmaydi! Uslub daxlsiz qoladi.
      nextAnnotations.push(ann);
      continue;
    }

    // 3. O'zgarish butun uslubni qamrab oldi yoki o'chirib yubordi
    if (change.from <= startOffset && change.to >= endOffset) {
      // Butun uslub o'chirilgan, bu uslub bekor bo'ladi
      continue;
    }

    // 4. O'zgarish ayni uslub ICHIDA yuz berdi (startOffset <= from < to <= endOffset)
    if (change.from >= startOffset && change.to <= endOffset) {
      // Chegara: agar from === startOffset bo'lsa va faqat insert bo'lsa
      // Foydalanuvchi uslub boshida yozganda uslub oldinga kengaymaydi
      if (change.from === startOffset && change.to === startOffset && change.insertText.length > 0) {
        const newStart = startOffset + change.insertText.length;
        const newEnd = endOffset + change.insertText.length;
        if (newStart < newEnd && newEnd <= fullNewText.length) {
          nextAnnotations.push({
            ...ann,
            startOffset: newStart,
            endOffset: newEnd,
            quote: createTextQuoteAnchor(fullNewText, newStart, newEnd),
            updatedAt: now
          });
        }
        continue;
      }

      // Uslub ichidagi oddiy yozish yoki o'chirish: uslub uzunligi delta ga o'zgaradi
      const newStart = startOffset;
      const newEnd = endOffset + delta;
      if (newEnd > newStart && newEnd <= fullNewText.length) {
        nextAnnotations.push({
          ...ann,
          startOffset: newStart,
          endOffset: newEnd,
          quote: createTextQuoteAnchor(fullNewText, newStart, newEnd),
          updatedAt: now
        });
      }
      continue;
    }

    // 5. Qisman kesishish (chap tomondan)
    if (change.from < startOffset && change.to > startOffset && change.to < endOffset) {
      const newStart = change.from + change.insertText.length;
      const newEnd = endOffset + delta;
      if (newEnd > newStart && newEnd <= fullNewText.length) {
        nextAnnotations.push({
          ...ann,
          startOffset: newStart,
          endOffset: newEnd,
          quote: createTextQuoteAnchor(fullNewText, newStart, newEnd),
          updatedAt: now
        });
      }
      continue;
    }

    // 6. Qisman kesishish (o'ng tomondan)
    if (change.from > startOffset && change.from < endOffset && change.to > endOffset) {
      const newStart = startOffset;
      const newEnd = change.from;
      if (newEnd > newStart && newEnd <= fullNewText.length) {
        nextAnnotations.push({
          ...ann,
          startOffset: newStart,
          endOffset: newEnd,
          quote: createTextQuoteAnchor(fullNewText, newStart, newEnd),
          updatedAt: now
        });
      }
      continue;
    }
  }

  return nextAnnotations;
}

/**
 * Matn tashqi manbadan to'liq almashganda (AI javobi, import, paste)
 * uslublarni quote anchor (exact + prefix + suffix) orqali qayta bog'lash
 */
export function reanchorAnnotations(
  annotations: StyleAnnotation[],
  newText: string
): ReanchorResult {
  const resolved: StyleAnnotation[] = [];
  const unresolved: StyleAnnotation[] = [];
  const now = Date.now();

  for (const ann of annotations) {
    if (ann.kind === 'block' && ann.startOffset === 0 && ann.endOffset === 0) {
      resolved.push({ ...ann, unresolved: false, updatedAt: now });
      continue;
    }

    const { exact, prefix, suffix } = ann.quote;

    // 1. Agar exact bo'sh bo'lsa
    if (!exact || exact.length === 0) {
      unresolved.push({ ...ann, unresolved: true, updatedAt: now });
      continue;
    }

    let foundPos = -1;

    // 2. Birinchi navbatda avvalgi startOffset atrofidan (±200 belgi) qidirish
    const windowStart = Math.max(0, ann.startOffset - 200);
    const windowEnd = Math.min(newText.length, ann.endOffset + 200);
    const windowText = newText.slice(windowStart, windowEnd);

    const localIdx = windowText.indexOf(exact);
    if (localIdx !== -1) {
      // Agar o'sha oraliqda topilsa
      foundPos = windowStart + localIdx;
    } else {
      // 3. Agar oraliqda topilmasa, butun matndan exact qidirish
      // Prefix va Suffix mosligini tekshirib eng yaxshi mos keluvchisini tanlash
      let searchIdx = 0;
      let bestMatchPos = -1;
      let bestScore = -1;

      while ((searchIdx = newText.indexOf(exact, searchIdx)) !== -1) {
        let score = 0;
        const candidatePrefix = newText.slice(Math.max(0, searchIdx - prefix.length), searchIdx);
        const candidateSuffix = newText.slice(
          searchIdx + exact.length,
          Math.min(newText.length, searchIdx + exact.length + suffix.length)
        );

        if (prefix && candidatePrefix === prefix) score += 2;
        else if (prefix && candidatePrefix.slice(-6) === prefix.slice(-6)) score += 1;

        if (suffix && candidateSuffix === suffix) score += 2;
        else if (suffix && candidateSuffix.slice(0, 6) === suffix.slice(0, 6)) score += 1;

        // Nisbiy masofa yaqinligini ham inobatga olish
        const dist = Math.abs(searchIdx - ann.startOffset);
        score += Math.max(0, 2 - dist / 500);

        if (score > bestScore) {
          bestScore = score;
          bestMatchPos = searchIdx;
        }

        searchIdx += exact.length;
      }

      if (bestMatchPos !== -1) {
        foundPos = bestMatchPos;
      }
    }

    // 4. Natijani fiksatsiya qilish
    if (foundPos !== -1) {
      const newEnd = foundPos + exact.length;
      resolved.push({
        ...ann,
        startOffset: foundPos,
        endOffset: newEnd,
        quote: createTextQuoteAnchor(newText, foundPos, newEnd),
        unresolved: false,
        updatedAt: now
      });
    } else {
      // Hech qachon indamay yo'qotilmaydi — unresolved ro'yxatda saqlanadi
      unresolved.push({
        ...ann,
        unresolved: true,
        updatedAt: now
      });
    }
  }

  const warningMessage =
    unresolved.length > 0
      ? `${unresolved.length} ta vizual uslub qayta bog‘lanmadi`
      : undefined;

  return { resolved, unresolved, warningMessage };
}
