import React, { useState, useEffect, useMemo, useCallback } from 'react';
import type { LegalDocument, ThemeName, QaBlock, DefinitionBlock } from '../../schema/types';
import {
  calculateSm2,
  createInitialProgress,
  computeSm2Stats,
  calculateStreak,
  isCardDue,
  getTodayDateString,
  type CardProgress,
  type Sm2Rating
} from '../../services/sm2';
import { getAllCardProgress, saveCardProgress } from '../../services/storage';
import { FormattedText } from '../../utils/inlineMarkdown';
import {
  Brain,
  GraduationCap,
  Flame,
  CheckCircle2,
  Trophy,
  Eye,
  EyeOff,
  RotateCcw,
  Sparkles,
  HelpCircle,
  Award,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import './examTrainer.css';

export interface ExamCardItem {
  id: string;
  sourceLine?: number;
  sectionTitle: string;
  category?: string;
  question: string;
  answer: string;
  hint?: string;
  isDefinition?: boolean;
}

interface ExamTrainerProps {
  document: LegalDocument;
  activeTheme?: ThemeName;
  onOpenAiIngestion?: () => void;
  onJumpToSourceLine?: (line: number) => void;
}

type FilterMode = 'due' | 'all' | 'hard' | 'mastered';

export const ExamTrainer: React.FC<ExamTrainerProps> = ({
  document: doc,
  activeTheme = 'classic',
  onOpenAiIngestion,
  onJumpToSourceLine
}) => {
  const [progressMap, setProgressMap] = useState<Record<string, CardProgress>>({});
  const [filterMode, setFilterMode] = useState<FilterMode>('due');
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isAnswerRevealed, setIsAnswerRevealed] = useState<boolean>(false);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [reviewedSessionCount, setReviewedSessionCount] = useState<number>(0);

  function hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash).toString(36).slice(0, 8);
  }

  // 1. Hujjatdan barcha savol-javob va ta'rif kartalarini yig'ish
  const cards: ExamCardItem[] = useMemo(() => {
    const result: ExamCardItem[] = [];
    const docPrefix = doc.title ? doc.title.toLowerCase().replace(/[^a-z0-9]/g, '_').slice(0, 20) : 'doc';

    (doc.sections || []).forEach((sec, secIdx) => {
      const secTitle = sec.title || `Bo‘lim ${secIdx + 1}`;
      (sec.blocks || []).forEach((b, bIdx) => {
        if (b.type === 'qa') {
          const qa = b as QaBlock;
          const cardId = qa.id || `${docPrefix}_qa_${hashString(qa.question)}_${bIdx}`;
          result.push({
            id: cardId,
            sourceLine: qa.sourceLine,
            sectionTitle: secTitle,
            category: qa.category,
            question: qa.question,
            answer: qa.answer,
            hint: qa.hint,
            isDefinition: false
          });
        } else if (b.type === 'definition') {
          const def = b as DefinitionBlock;
          const cardId = def.id || `${docPrefix}_def_${hashString(def.term)}_${bIdx}`;
          result.push({
            id: cardId,
            sourceLine: def.sourceLine,
            sectionTitle: secTitle,
            category: 'Atama va ta’rif',
            question: `«${def.term}» atamasining huquqiy ta’rifi nima?`,
            answer: def.definition,
            hint: def.source ? `Manba: ${def.source}` : undefined,
            isDefinition: true
          });
        }
      });
    });

    return result;
  }, [doc]);

  // 2. IndexedDB omboridan kartalar progressini yuklash
  useEffect(() => {
    let isMounted = true;
    getAllCardProgress().then((loaded) => {
      if (isMounted) {
        setProgressMap(loaded || {});
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  const todayDate = useMemo(() => getTodayDateString(), []);

  // 3. Joriy hujjat kartalariga moslangan SM-2 statistikasi
  const docProgressMap = useMemo(() => {
    const cardIdSet = new Set(cards.map((c) => c.id));
    const scoped: Record<string, CardProgress> = {};
    Object.entries(progressMap).forEach(([id, prog]) => {
      if (cardIdSet.has(id)) {
        scoped[id] = prog;
      }
    });
    return scoped;
  }, [progressMap, cards]);

  const allReviewDates = useMemo(() => {
    const dates: string[] = [];
    Object.values(progressMap).forEach((p) => {
      if (p.history) {
        p.history.forEach((h) => {
          if (h.date) dates.push(h.date);
        });
      }
    });
    return dates;
  }, [progressMap]);

  const overallStreak = useMemo(() => {
    return calculateStreak(allReviewDates, todayDate);
  }, [allReviewDates, todayDate]);

  const stats = useMemo(() => {
    const base = computeSm2Stats(docProgressMap, cards.length, todayDate);
    return {
      ...base,
      streakDays: overallStreak
    };
  }, [docProgressMap, cards.length, todayDate, overallStreak]);

  // 4. Filtrlangan navbat (Queue)
  const activeQueue = useMemo(() => {
    if (cards.length === 0) return [];

    if (filterMode === 'due') {
      return cards.filter((c) => {
        const prog = progressMap[c.id];
        return isCardDue(prog, todayDate);
      });
    }

    if (filterMode === 'hard') {
      return cards.filter((c) => {
        const prog = progressMap[c.id];
        if (!prog || !prog.history || prog.history.length === 0) return false;
        const lastRating = prog.history[prog.history.length - 1].rating;
        return lastRating === 1 || lastRating === 2;
      });
    }

    if (filterMode === 'mastered') {
      return cards.filter((c) => {
        const prog = progressMap[c.id];
        return prog && prog.interval > 21;
      });
    }

    return cards;
  }, [cards, filterMode, progressMap, todayDate]);

  // Hujjat o'zgarganda yoki navbat chegarasidan chiqqanda indeksni qayta sozlash
  useEffect(() => {
    setCurrentIndex(0);
    setIsAnswerRevealed(false);
    setIsCompleted(false);
  }, [doc]);

  useEffect(() => {
    if (activeQueue.length > 0 && currentIndex >= activeQueue.length) {
      setCurrentIndex(0);
    }
  }, [activeQueue.length, currentIndex]);

  // Joriy karta
  const currentCard = activeQueue[currentIndex] || null;
  const currentProgress = currentCard ? progressMap[currentCard.id] || null : null;

  // Baholash funksiyasi
  const handleRate = useCallback((rating: Sm2Rating) => {
    if (!currentCard) return;

    const currentProg = progressMap[currentCard.id] || createInitialProgress(currentCard.id);
    const updated = calculateSm2(currentProg, rating, todayDate);

    // Xotirada va IndexedDB da saqlash
    setProgressMap((prev) => ({
      ...prev,
      [currentCard.id]: updated
    }));
    saveCardProgress(updated).catch((err) => {
      console.warn('Card progress saqlash xatosi:', err);
    });

    setReviewedSessionCount((prev) => prev + 1);
    setIsAnswerRevealed(false);

    if (currentIndex + 1 >= activeQueue.length) {
      setIsCompleted(true);
    } else {
      setCurrentIndex((prev) => prev + 1);
    }
  }, [currentCard, progressMap, todayDate, currentIndex, activeQueue.length]);

  // Klaviatura orqali tezkor boshqarish: Space -> ko'rsatish, 1, 2, 4, 5 -> baholash
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Input yoki textarea yoki contenteditable da bo'lsa ishlamasin
      const el = e.target as HTMLElement;
      if (el?.tagName === 'INPUT' || el?.tagName === 'TEXTAREA' || el?.isContentEditable) return;

      if (e.code === 'Space') {
        e.preventDefault();
        setIsAnswerRevealed((prev) => !prev);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        if (currentIndex + 1 < activeQueue.length) {
          setCurrentIndex((prev) => prev + 1);
          setIsAnswerRevealed(false);
        } else if (activeQueue.length > 0) {
          setIsCompleted(true);
        }
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        if (currentIndex > 0) {
          setCurrentIndex((prev) => prev - 1);
          setIsAnswerRevealed(false);
        }
      } else if (isAnswerRevealed) {
        if (e.key === '1') {
          e.preventDefault();
          handleRate(1);
        } else if (e.key === '2') {
          e.preventDefault();
          handleRate(2);
        } else if (e.key === '4') {
          e.preventDefault();
          handleRate(4);
        } else if (e.key === '5') {
          e.preventDefault();
          handleRate(5);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAnswerRevealed, handleRate, currentIndex, activeQueue.length]);

  // Restart / Reset queue
  const handleRestart = (newMode: FilterMode = 'all') => {
    setFilterMode(newMode);
    setCurrentIndex(0);
    setIsAnswerRevealed(false);
    setIsCompleted(false);
  };

  if (cards.length === 0) {
    return (
      <div className={`exam-trainer-container doc-theme-${activeTheme}`}>
        <div className="exam-empty-card">
          <div className="exam-empty-icon-wrap">
            <Brain size={48} className="exam-empty-icon" />
          </div>
          <h2 className="exam-empty-title">Savol-javoblar topilmadi</h2>
          <p className="exam-empty-desc">
            Ushbu hujjatda hali <code>savol:</code> va <code>javob:</code> bloklari mavjud emas.
            Oraliq takrorlash trenajyori hujjatdagi barcha fleshkardlar asosida ishlaydi.
          </p>
          <div className="exam-empty-actions">
            {onOpenAiIngestion && (
              <button
                type="button"
                className="exam-action-btn exam-btn-primary"
                onClick={onOpenAiIngestion}
              >
                <Sparkles size={16} />
                <span>Aqlli formatlash / Fleshkard yaratish</span>
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`exam-trainer-container doc-theme-${activeTheme}`}>
      {/* 1. Yuqori statistik ma'lumotlar va boshqaruv paneli */}
      <header className="exam-header-bar no-print">
        <div className="exam-header-left">
          <div className="exam-header-title-row">
            <GraduationCap size={20} className="exam-cap-icon" />
            <h2 className="exam-header-title">Imtihon Trenajyori (SM-2)</h2>
          </div>
          <span className="exam-doc-label">{doc.title}</span>
        </div>

        {/* Statistik pill lar */}
        <div className="exam-stats-pills">
          <div className="exam-stat-pill" title="Bugun takrorlash muddati kelgan savollar">
            <span className="stat-pill-label">Bugungi reja:</span>
            <span className="stat-pill-val stat-val-due">{stats.dueToday}</span>
          </div>

          <div className="exam-stat-pill" title="Jami takrorlangan kartalar soni">
            <span className="stat-pill-label">O‘rganilgan:</span>
            <span className="stat-pill-val">{stats.totalReviewed}/{cards.length}</span>
          </div>

          <div className="exam-stat-pill" title="Doimiy esda qolgan (interval > 21 kun)">
            <CheckCircle2 size={13} className="text-emerald-500" />
            <span className="stat-pill-label">O‘zlashtirildi:</span>
            <span className="stat-pill-val stat-val-mastered">{stats.mastered}</span>
          </div>

          <div className="exam-stat-pill stat-pill-streak" title="Ketma-ket kunlik o‘rganish zanjiri">
            <Flame size={14} className="streak-flame-icon" />
            <span className="stat-pill-label">Ketma-ketlik:</span>
            <span className="stat-pill-val">{stats.streakDays} kun</span>
          </div>
        </div>
      </header>

      {/* 2. Filtrlar va progress indikatori */}
      <div className="exam-subnav-bar no-print">
        <div className="exam-filter-tabs" role="tablist">
          <button
            type="button"
            className={`exam-tab-btn ${filterMode === 'due' ? 'active' : ''}`}
            onClick={() => handleRestart('due')}
          >
            Muddati kelganlar ({stats.dueToday})
          </button>
          <button
            type="button"
            className={`exam-tab-btn ${filterMode === 'all' ? 'active' : ''}`}
            onClick={() => handleRestart('all')}
          >
            Barchasi ({cards.length})
          </button>
          <button
            type="button"
            className={`exam-tab-btn ${filterMode === 'hard' ? 'active' : ''}`}
            onClick={() => handleRestart('hard')}
          >
            Qiyin kartalar
          </button>
          <button
            type="button"
            className={`exam-tab-btn ${filterMode === 'mastered' ? 'active' : ''}`}
            onClick={() => handleRestart('mastered')}
          >
            O‘zlashtirilganlar ({stats.mastered})
          </button>
        </div>

        <div className="exam-progress-counter">
          <span>Karta {Math.min(currentIndex + 1, activeQueue.length)} / {activeQueue.length}</span>
          <div className="exam-progress-track">
            <div
              className="exam-progress-fill"
              style={{
                width: `${activeQueue.length > 0 ? ((currentIndex + (isCompleted ? 1 : 0)) / activeQueue.length) * 100 : 0}%`
              }}
            />
          </div>
        </div>
      </div>

      {/* 3. Mashg'ulot tugaganda (Victory / Completion Card) */}
      {isCompleted ? (
        <div className="exam-completion-card">
          <div className="exam-completion-trophy">
            <Trophy size={56} className="text-amber-500" />
          </div>
          <h2 className="exam-completion-title">Mashg‘ulot yakunlandi! 🎉</h2>
          <p className="exam-completion-desc">
            Ushbu turdagi barcha savollar oraliqli takrorlash (SM-2) algoritmi asosida baholandi
            va keyingi takrorlash muddati taqsimlandi.
          </p>

          <div className="exam-session-summary-grid">
            <div className="session-summary-box">
              <span className="summary-val">{reviewedSessionCount}</span>
              <span className="summary-lbl">Ushbu sessiyada ko‘rildi</span>
            </div>
            <div className="session-summary-box">
              <span className="summary-val">{stats.mastered}</span>
              <span className="summary-lbl">O‘zlashtirilgan kartalar</span>
            </div>
            <div className="session-summary-box">
              <span className="summary-val">{stats.streakDays} kun 🔥</span>
              <span className="summary-lbl">Kunlik faollik streak</span>
            </div>
          </div>

          <div className="exam-completion-actions">
            <button
              type="button"
              className="exam-action-btn exam-btn-primary"
              onClick={() => handleRestart('all')}
            >
              <RotateCcw size={15} />
              <span>Barcha savollarni qayta takrorlash</span>
            </button>
            <button
              type="button"
              className="exam-action-btn exam-btn-secondary"
              onClick={() => handleRestart('hard')}
            >
              <span>Faqat qiyinlarini mashq qilish</span>
            </button>
          </div>
        </div>
      ) : activeQueue.length === 0 ? (
        <div className="exam-card-stage">
          <div className="exam-empty-card" style={{ marginTop: '24px' }}>
            <div className="exam-empty-icon-wrap">
              <CheckCircle2 size={40} className="text-emerald-500" />
            </div>
            <h2 className="exam-empty-title">
              {filterMode === 'hard'
                ? 'Qiyin kartalar yo‘q'
                : filterMode === 'mastered'
                ? 'O‘zlashtirilgan kartalar hali mavjud emas'
                : 'Bugungi barcha takrorlashlar bajarildi! 🎉'}
            </h2>
            <p className="exam-empty-desc">
              {filterMode === 'hard'
                ? 'Mashg‘ulot davomida 1 (Yana) yoki 2 (Qiyin) baholangan savollar shu yerda to‘planadi.'
                : filterMode === 'mastered'
                ? 'Oralig‘i 21 kundan oshgan mustahkamlangan kartalar shu bo‘limda ko‘rinadi.'
                : 'Bugungi barcha rejalashtirilgan savollar ko‘rib chiqildi. Barcha savollarni mashq qilish uchun quyidagi tugmani bosing.'}
            </p>
            <div className="exam-empty-actions">
              <button
                type="button"
                className="exam-action-btn exam-btn-primary"
                onClick={() => handleRestart('all')}
              >
                <RotateCcw size={15} />
                <span>Barcha savollarni ko‘rish ({cards.length})</span>
              </button>
            </div>
          </div>
        </div>
      ) : currentCard ? (
        /* 4. Asosiy Interaktiv Fleshkard (Card view) */
        <div className="exam-card-stage">
          <article className="exam-flashcard-box" aria-live="polite">
            {/* Karta tepasi: Kategoriya, Bo'lim, Jump to Source */}
            <div className="exam-card-top-meta">
              <div className="exam-card-badges">
                <span className="exam-badge-section">{currentCard.sectionTitle}</span>
                {currentCard.category && (
                  <span className="exam-badge-category">{currentCard.category}</span>
                )}
                {currentProgress && currentProgress.interval > 0 && (
                  <span className="exam-badge-interval" title="Keyingi takrorlash oralig'i">
                    Oraliq: {currentProgress.interval} kun (EF: {currentProgress.easeFactor.toFixed(2)})
                  </span>
                )}
              </div>

              {currentCard.sourceLine && onJumpToSourceLine && (
                <button
                  type="button"
                  className="exam-source-jump-btn no-print"
                  onClick={() => onJumpToSourceLine(currentCard.sourceLine!)}
                  title="Matndagi joylashuviga o‘tish"
                >
                  Matnda: {currentCard.sourceLine}-qator
                </button>
              )}
            </div>

            {/* Savol qismi (Question Front) */}
            <div className="exam-card-question-area">
              <div className="exam-question-icon-wrap">
                <HelpCircle size={22} className="exam-question-icon" />
              </div>
              <div className="exam-question-text">
                <FormattedText text={currentCard.question} />
              </div>
            </div>

            {/* Eslatma / Hint agar mavjud bo'lsa */}
            {currentCard.hint && (
              <div className="exam-card-hint-box">
                <span className="exam-hint-label">💡 Maslahat: </span>
                <span className="exam-hint-text">
                  <FormattedText text={currentCard.hint} />
                </span>
              </div>
            )}

            {/* Javob qismi (Answer Back - agar ochilgan bo'lsa) */}
            {isAnswerRevealed ? (
              <div className="exam-card-answer-revealed">
                <div className="exam-answer-divider" />
                <div className="exam-answer-header">
                  <Award size={18} className="exam-answer-icon" />
                  <span className="exam-answer-label">To‘g‘ri javob:</span>
                </div>
                <div className="exam-answer-text">
                  <FormattedText text={currentCard.answer} />
                </div>
              </div>
            ) : (
              <div className="exam-reveal-prompt-area">
                <button
                  type="button"
                  className="exam-reveal-big-btn"
                  onClick={() => setIsAnswerRevealed(true)}
                  aria-expanded={false}
                >
                  <Eye size={18} />
                  <span>Javobni ko‘rsatish</span>
                  <span className="exam-key-badge">Space</span>
                </button>
              </div>
            )}

            {/* 5. Baholash paneli (SM-2 4 xil baho tugmalari) */}
            {isAnswerRevealed && (
              <div className="exam-rating-bar" role="group" aria-label="Javobni baholash">
                <div className="exam-rating-prompt">
                  Xotirangizni baholang:
                </div>

                <div className="exam-rating-buttons-row">
                  <button
                    type="button"
                    className="exam-rate-btn rate-btn-again"
                    onClick={() => handleRate(1)}
                    title="Eslay olmadim (Ertaga qayta takrorlanadi)"
                  >
                    <div className="rate-num-badge">1</div>
                    <div className="rate-info">
                      <span className="rate-title">Yana</span>
                      <span className="rate-sub">1 kun</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    className="exam-rate-btn rate-btn-hard"
                    onClick={() => handleRate(2)}
                    title="Qiyinchilik bilan esladim"
                  >
                    <div className="rate-num-badge">2</div>
                    <div className="rate-info">
                      <span className="rate-title">Qiyin</span>
                      <span className="rate-sub">Oraliq kamayadi</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    className="exam-rate-btn rate-btn-good"
                    onClick={() => handleRate(4)}
                    title="Yaxshi esladim"
                  >
                    <div className="rate-num-badge">4</div>
                    <div className="rate-info">
                      <span className="rate-title">Yaxshi</span>
                      <span className="rate-sub">Standart</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    className="exam-rate-btn rate-btn-easy"
                    onClick={() => handleRate(5)}
                    title="Juda oson, to‘liq yodda"
                  >
                    <div className="rate-num-badge">5</div>
                    <div className="rate-info">
                      <span className="rate-title">Oson</span>
                      <span className="rate-sub">Tezlashtirilgan</span>
                    </div>
                  </button>
                </div>

                <div className="exam-keyboard-tip">
                  💡 Klaviatura yordamida: <strong>1</strong> (Yana), <strong>2</strong> (Qiyin), <strong>4</strong> (Yaxshi), <strong>5</strong> (Oson)
                </div>
              </div>
            )}
          </article>

          {/* Pastki navigatsiya: Oldingi / Keyingi kartaga o'tish */}
          <div className="exam-stage-footer-nav no-print">
            <button
              type="button"
              className="exam-nav-circle-btn"
              onClick={() => {
                if (currentIndex > 0) {
                  setCurrentIndex((prev) => prev - 1);
                  setIsAnswerRevealed(false);
                }
              }}
              disabled={currentIndex <= 0}
              title="Oldingi karta"
            >
              <ChevronLeft size={16} />
              <span>Oldingisi</span>
            </button>

            {isAnswerRevealed ? (
              <button
                type="button"
                className="exam-toggle-reveal-link"
                onClick={() => setIsAnswerRevealed(false)}
              >
                <EyeOff size={14} />
                <span>Javobni yashirish</span>
              </button>
            ) : (
              <span />
            )}

            <button
              type="button"
              className="exam-nav-circle-btn"
              onClick={() => {
                if (currentIndex + 1 < activeQueue.length) {
                  setCurrentIndex((prev) => prev + 1);
                  setIsAnswerRevealed(false);
                } else {
                  setIsCompleted(true);
                }
              }}
              title="Keyingi karta"
            >
              <span>Keyingisi</span>
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
};
