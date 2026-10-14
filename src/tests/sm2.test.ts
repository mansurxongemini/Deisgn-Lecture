import { describe, it, expect } from 'vitest';
import { calculateSm2, createInitialProgress, isCardDue, computeSm2Stats } from '../services/sm2';

describe('SM-2 Spaced Repetition Algoritmi', () => {
  it('boshlang‘ich progress to‘g‘ri qiymatlarga ega bo‘lishi kerak', () => {
    const p = createInitialProgress('card-1');
    expect(p.cardId).toBe('card-1');
    expect(p.repetitions).toBe(0);
    expect(p.interval).toBe(0);
    expect(p.easeFactor).toBe(2.5);
    expect(p.history).toHaveLength(0);
  });

  it('birinchi muvaffaqiyatli takrorlashda (Good = 4) interval 1 kunga teng bo‘lishi kerak', () => {
    const p0 = createInitialProgress('card-1');
    const p1 = calculateSm2(p0, 4, '2026-10-02');
    expect(p1.repetitions).toBe(1);
    expect(p1.interval).toBe(1);
    expect(p1.dueDate).toBe('2026-10-03');
  });

  it('ikkinchi muvaffaqiyatli takrorlashda (Good = 4) interval 6 kunga teng bo‘lishi kerak', () => {
    const p0 = createInitialProgress('card-1');
    const p1 = calculateSm2(p0, 4, '2026-10-02');
    const p2 = calculateSm2(p1, 4, '2026-10-03');
    expect(p2.repetitions).toBe(2);
    expect(p2.interval).toBe(6);
    expect(p2.dueDate).toBe('2026-10-09');
  });

  it('uchinchi muvaffaqiyatli takrorlashda interval * easeFactor hisoblanishi kerak', () => {
    const p0 = createInitialProgress('card-1');
    const p1 = calculateSm2(p0, 4, '2026-10-01');
    const p2 = calculateSm2(p1, 4, '2026-10-02');
    const p3 = calculateSm2(p2, 4, '2026-10-08');
    expect(p3.repetitions).toBe(3);
    // interval = round(6 * 2.5) = 15
    expect(p3.interval).toBe(15);
  });

  it('qayta eslay olmaganda (Again = 1) repetitions 0 ga va interval 1 kunga tushishi kerak', () => {
    const p0 = createInitialProgress('card-1');
    const p1 = calculateSm2(p0, 5, '2026-10-01');
    const p2 = calculateSm2(p1, 5, '2026-10-02');
    expect(p2.repetitions).toBe(2);

    // Endi foydalanuvchi "Again" (1) bosdi
    const pFailed = calculateSm2(p2, 1, '2026-10-08');
    expect(pFailed.repetitions).toBe(0);
    expect(pFailed.interval).toBe(1);
    expect(pFailed.dueDate).toBe('2026-10-09');
    // Ease Factor kamaygan bo'lishi kerak, lekin minimal 1.3 dan pastga tushmaydi
    expect(pFailed.easeFactor).toBeLessThan(p2.easeFactor);
    expect(pFailed.easeFactor).toBeGreaterThanOrEqual(1.3);
  });

  it('isCardDue va computeSm2Stats to‘g‘ri hisoblanishi kerak', () => {
    const today = '2026-10-13';
    const pDue = createInitialProgress('c1');
    pDue.dueDate = '2026-10-12'; // kecha o'tgan
    expect(pDue.repetitions).toBe(0);
    expect(isCardDue(pDue, today)).toBe(true);

    const pFuture = createInitialProgress('c2');
    pFuture.repetitions = 3;
    pFuture.interval = 25; // mastered
    pFuture.dueDate = '2026-10-25'; // kelajakda
    expect(isCardDue(pFuture, today)).toBe(false);
    pFuture.history = [
      { date: '2026-10-11', rating: 4, interval: 1, easeFactor: 2.5 },
      { date: '2026-10-12', rating: 4, interval: 6, easeFactor: 2.5 },
      { date: '2026-10-13', rating: 5, interval: 25, easeFactor: 2.6 }
    ];

    const stats = computeSm2Stats([pDue, pFuture], 3, today);
    expect(stats.totalReviewed).toBe(1); // pFuture has repetitions
    expect(stats.mastered).toBe(1); // interval 25 > 21
    expect(stats.dueToday).toBe(2); // pDue (due) + 1 unstarted card
    expect(stats.streakDays).toBe(3); // 11, 12, 13 kunlar
  });
});
