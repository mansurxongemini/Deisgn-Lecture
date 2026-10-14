export type Sm2Rating = 1 | 2 | 4 | 5;

export interface CardReviewRecord {
  date: string;
  rating: Sm2Rating;
  interval: number;
  easeFactor: number;
}

export interface CardProgress {
  cardId: string;
  repetitions: number;
  interval: number; // kunlarda
  easeFactor: number; // standart 2.5, minimal 1.3
  dueDate: string; // YYYY-MM-DD
  lastReviewed?: string;
  history: CardReviewRecord[];
}

export interface Sm2Stats {
  totalReviewed: number;
  streakDays: number;
  dueToday: number;
  mastered: number; // interval > 21 kun
}

export const INITIAL_EASE_FACTOR = 2.5;
export const MIN_EASE_FACTOR = 1.3;

/**
 * Bugungi sanani foydalanuvchining mahalliy vaqtida YYYY-MM-DD formatida olish
 */
export function getTodayDateString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Sanaga kunlar qo‘shish (mahalliy kalendar bo'yicha)
 */
export function addDays(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(y, (m || 1) - 1, d || 1);
  dt.setDate(dt.getDate() + days);
  const year = dt.getFullYear();
  const month = String(dt.getMonth() + 1).padStart(2, '0');
  const day = String(dt.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Boshlang'ich bo'sh progress yaratish
 */
export function createInitialProgress(cardId: string): CardProgress {
  return {
    cardId,
    repetitions: 0,
    interval: 0,
    easeFactor: INITIAL_EASE_FACTOR,
    dueDate: getTodayDateString(),
    history: []
  };
}

/**
 * SM-2 algoritmining asosiy hisoblash funksiyasi
 *
 * @param current Mavjud kartochka holati
 * @param rating Foydalanuvchi bahosi (1: Yana, 2: Qiyin, 4: Yaxshi, 5: Oson)
 * @param reviewDate Ko'rib chiqilgan sana (default: bugun)
 */
export function calculateSm2(
  current: CardProgress,
  rating: Sm2Rating,
  reviewDate: string = getTodayDateString()
): CardProgress {
  let { repetitions, interval, easeFactor } = current;

  // Baholash shkalasi: 3 va undan yuqori muvaffaqiyatli hisoblanadi
  const isSuccessful = rating >= 3;

  if (!isSuccessful) {
    // Xato yoki eslay olmadi (Yana / Qiyin-1): zanjir uziladi, ertaga yana takrorlanadi
    repetitions = 0;
    interval = 1;
  } else {
    // Muvaffaqiyatli eslandi
    if (repetitions === 0) {
      interval = 1;
    } else if (repetitions === 1) {
      interval = 6;
    } else {
      interval = Math.round(interval * easeFactor);
    }
    repetitions += 1;
  }

  // Yangi Ease Factor (EF) hisoblash:
  // EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
  const q = rating;
  const efDelta = 0.1 - (5 - q) * (0.08 + (5 - q) * 0.02);
  easeFactor = Math.max(MIN_EASE_FACTOR, +(easeFactor + efDelta).toFixed(3));

  const dueDate = addDays(reviewDate, interval);

  const updatedRecord: CardReviewRecord = {
    date: reviewDate,
    rating,
    interval,
    easeFactor
  };

  return {
    cardId: current.cardId,
    repetitions,
    interval,
    easeFactor,
    dueDate,
    lastReviewed: reviewDate,
    history: [...current.history, updatedRecord]
  };
}

/**
 * Kartochkaning bugun takrorlash muddati kelganligini tekshiradi.
 */
export function isCardDue(progress?: CardProgress, todayDate: string = getTodayDateString()): boolean {
  if (!progress) return true;
  if (progress.repetitions === 0) return true;
  return progress.dueDate <= todayDate;
}

/**
 * Berilgan sana bo'yicha ketma-ket takrorlash kunlari (streak)ni hisoblash
 */
export function calculateStreak(allDates: string[], todayDate: string = getTodayDateString()): number {
  if (allDates.length === 0) return 0;
  const uniqueDates = new Set(allDates);
  const yesterday = addDays(todayDate, -1);

  let currentTarget = uniqueDates.has(todayDate) ? todayDate : (uniqueDates.has(yesterday) ? yesterday : null);
  if (!currentTarget) return 0;

  let streak = 0;
  while (uniqueDates.has(currentTarget)) {
    streak++;
    currentTarget = addDays(currentTarget, -1);
  }
  return streak;
}

/**
 * Barcha kartalar progressidan umumiy SM-2 statistikasini hisoblash
 */
export function computeSm2Stats(
  progressInput: Record<string, CardProgress> | CardProgress[],
  totalKnownCardsCount?: number,
  todayDate: string = getTodayDateString()
): Sm2Stats {
  const list = Array.isArray(progressInput) ? progressInput : Object.values(progressInput);
  let totalReviewed = 0;
  let dueCount = 0;
  let mastered = 0;
  const allReviewDates: string[] = [];

  list.forEach((p) => {
    if (p.repetitions > 0 || (p.history && p.history.length > 0)) {
      totalReviewed++;
    }
    if (p.interval > 21) {
      mastered++;
    }
    if (isCardDue(p, todayDate)) {
      dueCount++;
    }
    if (p.history) {
      p.history.forEach((h) => {
        if (h.date) allReviewDates.push(h.date);
      });
    }
  });

  // Agar totalKnownCardsCount mavjud bo'lsa va ro'yxatdagilardan ko'p bo'lsa,
  // yangi boshlanmagan kartalar ham dueToday ga qo'shiladi
  if (totalKnownCardsCount !== undefined && totalKnownCardsCount > list.length) {
    const unstartedCount = totalKnownCardsCount - list.length;
    dueCount += unstartedCount;
  }

  const streakDays = calculateStreak(allReviewDates, todayDate);

  return {
    totalReviewed,
    streakDays,
    dueToday: dueCount,
    mastered
  };
}
