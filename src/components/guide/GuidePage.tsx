import React, { useState, useMemo } from 'react';
import {
  Search,
  BookOpen,
  Sparkles,
  Check,
  Copy,
  ArrowLeft,
  ArrowRight,
  Printer,
  AlertTriangle,
  HelpCircle,
  Play,
  FileText,
  Scale,
  ExternalLink,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { parseMarkdownPlus } from '../../schema/mdParser';
import { BlockRenderer } from '../blocks/BlockRenderer';
import {
  GUIDE_LESSONS,
  WARNING_GUIDES,
  FAQ_LIST,
  QUICK_INTRO_EXAMPLE
} from './guideData';
import { generateAiPrompt } from '../../schema/mdSpec';
import './guide.css';

interface Props {
  onBackToStudio: () => void;
  onTrySnippet: (snippet: string) => void;
  initialWarningCode?: string | null;
}

// 5 bosqichli "Birinchi hujjatim" qadamlari
interface WalkthroughStep {
  step: number;
  title: string;
  instruction: string;
  codeSnippet: string;
}

const WALKTHROUGH_STEPS: WalkthroughStep[] = [
  {
    step: 1,
    title: '1. Hujjat sarlavhasi',
    instruction: 'Hujjat nomini bitta panjara (#) belgisi bilan boshlang.',
    codeSnippet: '# Mening Birinchi Konspektim\nmuallif: Talaba'
  },
  {
    step: 2,
    title: '2. Bo‘lim sarlavhasi',
    instruction: 'Mavzu bo‘limlarini ikkita panjara (##) bilan ajrating.',
    codeSnippet: '## 1-Mavzu. Qonun ustuvorligi'
  },
  {
    step: 3,
    title: '3. Oddiy matn',
    instruction: 'O‘z fikringiz yoki kirish sharhini hech qanday belgisi yo‘q oddiy matn sifatida yozing.',
    codeSnippet: 'Huquqiy davlatda inson qadr-qimmati va erkinligi eng oliy qadriyat hisoblanadi.'
  },
  {
    step: 4,
    title: '4. Qonun normasi',
    instruction: 'Qator boshiga "norma:" deb moddani, keyin manba va modda matnini kiriting.',
    codeSnippet: 'norma: 13-modda: Inson huquqlari kafolati\nmanba: O‘zbekiston Respublikasi Konstitutsiyasi\nInsonning huquq va erkinliklari bevosita amal qiladi.'
  },
  {
    step: 5,
    title: '5. Savol-javob (Fleshkard)',
    instruction: 'Mavzuni mustahkamlash uchun "savol:" va "javob:" qatorlarini qo‘shing.',
    codeSnippet: 'savol: Inson huquqlari qanday amal qiladi?\njavob: Bevosita amal qiladi va qonunlarning mazmunini belgilaydi.'
  }
];

export const GuidePage: React.FC<Props> = ({
  onBackToStudio,
  onTrySnippet,
  initialWarningCode
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<
    'all' | 'intro' | 'walkthrough' | 'lessons' | 'ai' | 'warnings' | 'faq' | 'cheatsheet'
  >(initialWarningCode ? 'warnings' : 'all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Walkthrough holati
  const [walkthroughStep, setWalkthroughStep] = useState(1);
  const [walkthroughText, setWalkthroughText] = useState(
    WALKTHROUGH_STEPS[0].codeSnippet
  );

  // FAQ ochilgan/yopilgan holati
  const [openFaqIndexes, setOpenFaqIndexes] = useState<number[]>([0, 1]);

  const toggleFaq = (index: number) => {
    if (openFaqIndexes.includes(index)) {
      setOpenFaqIndexes(openFaqIndexes.filter((i) => i !== index));
    } else {
      setOpenFaqIndexes([...openFaqIndexes, index]);
    }
  };

  const copyText = async (id: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2500);
    } catch {}
  };

  // Walkthrough bosqichini o'zgartirish
  const handleWalkthroughStepChange = (targetStep: number) => {
    setWalkthroughStep(targetStep);
    // 1-dan targetStep gacha bo'lgan barcha qismlarni birlashtiramiz
    const combined = WALKTHROUGH_STEPS.slice(0, targetStep)
      .map((s) => s.codeSnippet)
      .join('\n\n');
    setWalkthroughText(combined);
  };

  // Walkthrough mini-muharririning jonli tahlili
  const walkthroughParsed = useMemo(() => {
    return parseMarkdownPlus(walkthroughText);
  }, [walkthroughText]);

  // 2 daqiqalik kirish matnining tahlili
  const introParsed = useMemo(() => {
    return parseMarkdownPlus(QUICK_INTRO_EXAMPLE);
  }, []);

  // Qidiruv filtri
  const queryLower = searchQuery.toLowerCase().trim();

  const filteredLessons = useMemo(() => {
    if (!queryLower) return GUIDE_LESSONS;
    return GUIDE_LESSONS.filter(
      (l) =>
        l.title.toLowerCase().includes(queryLower) ||
        l.whyNeeded.toLowerCase().includes(queryLower) ||
        l.howToText.toLowerCase().includes(queryLower) ||
        l.exampleSnippet.toLowerCase().includes(queryLower)
    );
  }, [queryLower]);

  const filteredWarnings = useMemo(() => {
    if (!queryLower) return WARNING_GUIDES;
    return WARNING_GUIDES.filter(
      (w) =>
        w.title.toLowerCase().includes(queryLower) ||
        w.code.toLowerCase().includes(queryLower) ||
        w.explanation.toLowerCase().includes(queryLower) ||
        w.howToFix.toLowerCase().includes(queryLower)
    );
  }, [queryLower]);

  const filteredFaqs = useMemo(() => {
    if (!queryLower) return FAQ_LIST;
    return FAQ_LIST.filter(
      (f) =>
        f.question.toLowerCase().includes(queryLower) ||
        f.answer.toLowerCase().includes(queryLower)
    );
  }, [queryLower]);

  // Tayyor AI prompt matni
  const aiPromptText = useMemo(() => {
    return generateAiPrompt({
      includeQuestions: true,
      detailLevel: 'detailed',
      rawText: '[Konspekt yoki qonun moddalaringiz matnini shu yerga qo‘ying]'
    });
  }, []);

  return (
    <div className="guide-container">
      {/* 1. Yuqori qism (Header) */}
      <header className="guide-header no-print">
        <div className="guide-hero">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 10,
                  background: 'linear-gradient(135deg, #1e293b, #334155)',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <BookOpen size={20} />
              </div>
              <h1 className="guide-hero-title">MD+ Formati Qo‘llanmasi</h1>
            </div>
            <p className="guide-hero-subtitle">
              Hech qanday murakkab texnik so‘zlarsiz: yuridik konspektlaringizni chiroyli
              kitob va eslab qolish kartochkalariga aylantirishning eng oson yo‘li.
            </p>
          </div>

          <button
            type="button"
            className="guide-back-btn"
            onClick={onBackToStudio}
            title="Asosiy muharrirga qaytish"
          >
            <ArrowLeft size={16} />
            Studiyaga qaytish
          </button>
        </div>

        {/* Qidiruv */}
        <div className="guide-search-wrapper">
          <Search size={18} className="guide-search-icon" />
          <input
            type="text"
            className="guide-search-input"
            placeholder="Mavzuni qidiring... Masalan: norma, savol, jadval, xato..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Bo'limlar tablari */}
        <nav className="guide-tabs" aria-label="Qo‘llanma bo‘limlari">
          <button
            type="button"
            className={`guide-tab-btn ${activeTab === 'all' ? 'active' : ''}`}
            onClick={() => setActiveTab('all')}
          >
            Barchasi
          </button>
          <button
            type="button"
            className={`guide-tab-btn ${activeTab === 'intro' ? 'active' : ''}`}
            onClick={() => setActiveTab('intro')}
          >
            2 daqiqada tushunish
          </button>
          <button
            type="button"
            className={`guide-tab-btn ${activeTab === 'walkthrough' ? 'active' : ''}`}
            onClick={() => setActiveTab('walkthrough')}
          >
            Birinchi hujjatim
          </button>
          <button
            type="button"
            className={`guide-tab-btn ${activeTab === 'lessons' ? 'active' : ''}`}
            onClick={() => setActiveTab('lessons')}
          >
            Qoliplar darsligi
          </button>
          <button
            type="button"
            className={`guide-tab-btn ${activeTab === 'ai' ? 'active' : ''}`}
            onClick={() => setActiveTab('ai')}
          >
            AI bilan ishlash
          </button>
          <button
            type="button"
            className={`guide-tab-btn ${activeTab === 'warnings' ? 'active' : ''}`}
            onClick={() => setActiveTab('warnings')}
          >
            Ogohlantirishlar
          </button>
          <button
            type="button"
            className={`guide-tab-btn ${activeTab === 'faq' ? 'active' : ''}`}
            onClick={() => setActiveTab('faq')}
          >
            Savol-javob (FAQ)
          </button>
          <button
            type="button"
            className={`guide-tab-btn ${activeTab === 'cheatsheet' ? 'active' : ''}`}
            onClick={() => setActiveTab('cheatsheet')}
          >
            Chop etiladigan Cheat Sheet
          </button>
        </nav>
      </header>

      {/* 2. Bo‘lim: "2 daqiqada tushunish" */}
      {(activeTab === 'all' || activeTab === 'intro') && !searchQuery && (
        <section className="guide-card" id="intro">
          <div className="guide-card-header">
            <h2 className="guide-card-title">
              <Sparkles size={22} style={{ color: '#f59e0b' }} />
              2 daqiqada tushunish: Oddiy kundalik o‘xshatish
            </h2>
            <button
              type="button"
              className="guide-action-btn guide-action-primary"
              onClick={() => onTrySnippet(QUICK_INTRO_EXAMPLE)}
            >
              <Play size={14} />
              Ushbu namunani sinab ko‘rish
            </button>
          </div>

          <p style={{ fontSize: '0.98rem', lineHeight: 1.6, color: 'var(--text-main)', margin: '0 0 16px 0' }}>
            Tasavvur qiling, siz daftarga oshxona retseptini yozyapsiz. Siz shunchaki:
            <br />
            <strong># Osh tayyorlash</strong>, keyingi qatorda <strong>jarayon: Go‘shtni qovurish -&gt; Guruchni damlash</strong> deb yozasiz.
            Qolganini tajribali oshpaz o‘zi tushunib, dasturxonga chiroyli taom qilib keltiradi.
            <br /><br />
            <strong>MD+ formati ham xuddi shunday:</strong> siz qator boshiga birgina so‘z
            (masalan, <code>norma:</code> yoki <code>savol:</code>) deb yozasiz, qolgan barcha
            go‘zal dizaynni, ramkalarni va rang-barang kartalarni tizimning o‘zi avtomatik chizib beradi!
          </p>

          <div className="guide-split-preview">
            <div className="guide-code-box">
              <div style={{ fontSize: '0.78rem', color: '#a6adc8', marginBottom: 8, fontWeight: 600 }}>
                SIZ YOZADIGAN SODDA MATN:
              </div>
              <pre>{QUICK_INTRO_EXAMPLE}</pre>
              <div className="guide-code-toolbar">
                <button
                  type="button"
                  className="guide-action-btn guide-action-secondary"
                  onClick={() => copyText('intro', QUICK_INTRO_EXAMPLE)}
                >
                  {copiedId === 'intro' ? <Check size={14} /> : <Copy size={14} />}
                  {copiedId === 'intro' ? 'Nusxalandi!' : 'Nusxa olish'}
                </button>
              </div>
            </div>

            <div className="guide-rendered-box">
              <div style={{ fontSize: '0.78rem', color: '#64748b', marginBottom: 12, fontWeight: 700, textTransform: 'uppercase' }}>
                HOSIL BO‘LADIGAN NATIJA:
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {introParsed.document.sections.flatMap((s) => s.blocks).map((block) => (
                  <BlockRenderer key={block.id} block={block} />
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 3. Bo‘lim: "Birinchi hujjatim" (5 bosqichli interaktiv ko‘rgazma) */}
      {(activeTab === 'all' || activeTab === 'walkthrough') && !searchQuery && (
        <section className="guide-card" id="walkthrough">
          <div className="guide-card-header">
            <h2 className="guide-card-title">
              <FileText size={22} style={{ color: '#2563eb' }} />
              Birinchi hujjatim: 5 qadamda o‘rganish
            </h2>
            <button
              type="button"
              className="guide-action-btn guide-action-primary"
              onClick={() => onTrySnippet(walkthroughText)}
            >
              <ExternalLink size={14} />
              Muharrirda to‘liq ochish
            </button>
          </div>

          <p style={{ fontSize: '0.94rem', color: 'var(--text-muted)', margin: '0 0 16px 0' }}>
            Qadamlarni ketma-ket bosing yoki chap tomondagi matnni o‘zingiz xohlagancha o‘zgartirib ko‘ring.
            O‘ng tomonda hosil bo‘layotgan sahifa darhol yangilanadi:
          </p>

          <div className="guide-step-indicators">
            {WALKTHROUGH_STEPS.map((stepItem) => (
              <button
                key={stepItem.step}
                type="button"
                className={`guide-step-dot ${walkthroughStep === stepItem.step ? 'active' : ''} ${
                  walkthroughStep > stepItem.step ? 'completed' : ''
                }`}
                onClick={() => handleWalkthroughStepChange(stepItem.step)}
              >
                {stepItem.title}
              </button>
            ))}
          </div>

          <div
            style={{
              padding: '12px 16px',
              background: '#eff6ff',
              borderRadius: 8,
              border: '1px solid #bfdbfe',
              color: '#1e3a8a',
              fontSize: '0.9rem',
              marginBottom: 16
            }}
          >
            <strong>{WALKTHROUGH_STEPS[walkthroughStep - 1].title}:</strong>{' '}
            {WALKTHROUGH_STEPS[walkthroughStep - 1].instruction}
          </div>

          <div className="guide-walkthrough-container">
            {/* Chap tomon: Mini muharrir */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                JONLI MINI-MUHARRIR (O‘zgartirib ko‘rishingiz mumkin):
              </div>
              <textarea
                style={{
                  width: '100%',
                  height: 230,
                  padding: 12,
                  borderRadius: 10,
                  background: '#181825',
                  color: '#cdd6f4',
                  fontFamily: 'var(--font-mono, monospace)',
                  fontSize: '0.88rem',
                  lineHeight: 1.5,
                  border: '1px solid #313244',
                  boxSizing: 'border-box',
                  resize: 'vertical',
                  outline: 'none'
                }}
                value={walkthroughText}
                onChange={(e) => setWalkthroughText(e.target.value)}
                spellCheck={false}
              />

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                  {walkthroughParsed.warnings.length === 0 ? (
                    <span style={{ color: '#16a34a', fontWeight: 600 }}>✓ Format toza va to‘g‘ri</span>
                  ) : (
                    <span style={{ color: '#d97706', fontWeight: 600 }}>
                      ⚠ {walkthroughParsed.warnings.length} ta eslatma bor
                    </span>
                  )}
                </div>

                <div style={{ display: 'flex', gap: 8 }}>
                  {walkthroughStep < 5 && (
                    <button
                      type="button"
                      className="guide-action-btn guide-action-primary"
                      onClick={() => handleWalkthroughStepChange(walkthroughStep + 1)}
                    >
                      Keyingi qadam <ArrowRight size={14} />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* O'ng tomon: Jonli karta ko'rinishi */}
            <div className="guide-rendered-box" style={{ minHeight: 230 }}>
              <div style={{ fontSize: '0.78rem', color: '#64748b', marginBottom: 12, fontWeight: 700 }}>
                HOSIL BO‘LGAN KARTA:
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {walkthroughParsed.document.sections.flatMap((s) => s.blocks).length === 0 ? (
                  <div style={{ color: '#94a3b8', fontStyle: 'italic', fontSize: '0.9rem' }}>
                    Matn kiritsangiz bu yerda o‘quv kartasi aks etadi...
                  </div>
                ) : (
                  walkthroughParsed.document.sections
                    .flatMap((s) => s.blocks)
                    .map((b) => <BlockRenderer key={b.id} block={b} />)
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 4. Bo‘lim: "Qoliplar darsligi" (6 Asosiy va 4 Qo‘shimcha) */}
      {(activeTab === 'all' || activeTab === 'lessons') && (
        <section id="lessons">
          <div style={{ marginBottom: 20 }}>
            <h2
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize: '1.6rem',
                margin: '0 0 6px 0',
                color: 'var(--text-main)'
              }}
            >
              Qoliplar Darsligi
            </h2>
            <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.95rem' }}>
              Dastlabki <strong>6 ta asosiy qolip</strong> har qanday yuridik konspekt uchun yetarli.
              Qolgan 4 tasi esa murakkab sud ishlari va taqqoslashlar uchun qo‘shimcha imkoniyatdir.
            </p>
          </div>

          {filteredLessons.map((lesson) => {
            const parsedExample = parseMarkdownPlus(lesson.exampleSnippet);
            const blocks = parsedExample.document.sections.flatMap((s) => s.blocks);

            return (
              <article key={lesson.id} className="guide-card" id={`lesson-${lesson.id}`}>
                {/* Darslik sarlavhasi va nishoni */}
                <div className="guide-card-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <h3 className="guide-card-title">{lesson.title}</h3>
                    <span
                      style={{
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        padding: '3px 8px',
                        borderRadius: 12,
                        background: lesson.isCore ? '#dbeafe' : '#f1f5f9',
                        color: lesson.isCore ? '#1e40af' : '#475569'
                      }}
                    >
                      {lesson.badge}
                    </span>
                  </div>

                  <button
                    type="button"
                    className="guide-action-btn guide-action-primary"
                    onClick={() => onTrySnippet(lesson.exampleSnippet)}
                  >
                    <Play size={13} />
                    Sinab ko‘rish
                  </button>
                </div>

                {/* 1. Nima uchun kerak */}
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    Nima uchun kerak?
                  </div>
                  <p style={{ fontSize: '0.95rem', margin: '4px 0 0 0', lineHeight: 1.5, color: 'var(--text-main)' }}>
                    {lesson.whyNeeded}
                  </p>
                </div>

                {/* 2. Qanday yoziladi */}
                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    Qanday yoziladi?
                  </div>
                  <p style={{ fontSize: '0.92rem', margin: '4px 0 0 0', lineHeight: 1.5, color: 'var(--text-main)' }}>
                    {lesson.howToText}
                  </p>
                </div>

                {/* 3. Yonma-yon ko'rinish: Matn va Natija */}
                <div className="guide-split-preview">
                  <div className="guide-code-box">
                    <div style={{ fontSize: '0.76rem', color: '#a6adc8', marginBottom: 6, fontWeight: 600 }}>
                      MATN NAMUNASI:
                    </div>
                    <pre>{lesson.exampleSnippet}</pre>
                    <div className="guide-code-toolbar">
                      <button
                        type="button"
                        className="guide-action-btn guide-action-secondary"
                        onClick={() => copyText(lesson.id, lesson.exampleSnippet)}
                      >
                        {copiedId === lesson.id ? <Check size={14} /> : <Copy size={14} />}
                        {copiedId === lesson.id ? 'Nusxalandi!' : 'Nusxa olish'}
                      </button>
                    </div>
                  </div>

                  <div className="guide-rendered-box">
                    <div style={{ fontSize: '0.76rem', color: '#64748b', marginBottom: 10, fontWeight: 700 }}>
                      NATIJA (EKRANDAGI KO‘RINISHI):
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {blocks.map((b) => (
                        <BlockRenderer key={b.id} block={b} />
                      ))}
                    </div>
                  </div>
                </div>

                {/* 4. Ko'p uchraydigan xato va uni to'g'rilash */}
                <div style={{ marginTop: 20 }}>
                  <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#dc2626', textTransform: 'uppercase' }}>
                    Ko‘p uchraydigan xato va to‘g‘ri shakli:
                  </div>

                  <div className="guide-mistake-box">
                    {/* Xato namuna */}
                    <div className="guide-mistake-col">
                      <span className="guide-badge-wrong">✕ XATO NAMUNA</span>
                      <pre
                        style={{
                          margin: '4px 0 0 0',
                          padding: 10,
                          borderRadius: 6,
                          background: '#fff1f2',
                          color: '#9f1239',
                          fontFamily: 'var(--font-mono, monospace)',
                          fontSize: '0.82rem',
                          border: '1px solid #fecdd3',
                          whiteSpace: 'pre-wrap'
                        }}
                      >
                        {lesson.commonMistake.wrong}
                      </pre>
                      <span style={{ fontSize: '0.82rem', color: '#991b1b', marginTop: 4 }}>
                        {lesson.commonMistake.explanation}
                      </span>
                    </div>

                    {/* To'g'ri namuna */}
                    <div className="guide-mistake-col">
                      <span className="guide-badge-correct">✓ TO‘G‘RI SHAKLI</span>
                      <pre
                        style={{
                          margin: '4px 0 0 0',
                          padding: 10,
                          borderRadius: 6,
                          background: '#f0fdf4',
                          color: '#166534',
                          fontFamily: 'var(--font-mono, monospace)',
                          fontSize: '0.82rem',
                          border: '1px solid #bbf7d0',
                          whiteSpace: 'pre-wrap'
                        }}
                      >
                        {lesson.commonMistake.correct}
                      </pre>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </section>
      )}

      {/* 5. Bo‘lim: "AI bilan ishlash" */}
      {(activeTab === 'all' || activeTab === 'ai') && !searchQuery && (
        <section className="guide-card" id="ai">
          <div className="guide-card-header">
            <h2 className="guide-card-title">
              <Sparkles size={22} style={{ color: '#8b5cf6' }} />
              AI (ChatGPT, Claude, Gemini) bilan 4 qadamda ishlash
            </h2>
            <button
              type="button"
              className="guide-action-btn guide-action-primary"
              onClick={() => copyText('ai-prompt', aiPromptText)}
            >
              {copiedId === 'ai-prompt' ? <Check size={14} /> : <Copy size={14} />}
              {copiedId === 'ai-prompt' ? 'Ko‘rsatma nusxalandi!' : 'AI ko‘rsatmasini nusxalash'}
            </button>
          </div>

          <p style={{ fontSize: '0.95rem', color: 'var(--text-main)', lineHeight: 1.6, margin: '0 0 16px 0' }}>
            Konspektingizni qo‘lda yozib o‘tirishingiz shart emas. Tayyor AI ko‘rsatmamiz orqali
            istalgan kitob, ma’ruza yoki sud amaliyotini bir zumda chiroyli MD+ formatiga o‘tkazib olasiz.
          </p>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: 16,
              marginBottom: 20
            }}
          >
            <div
              style={{
                padding: 16,
                background: '#f8fafc',
                borderRadius: 10,
                border: '1px solid #e2e8f0'
              }}
            >
              <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#1e293b', marginBottom: 6 }}>
                1. Promptni nusxalang
              </div>
              <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b', lineHeight: 1.5 }}>
                Tepada joylashgan "AI ko‘rsatmasini nusxalash" tugmasini bosing. Unda barcha qoliplar va qoidalar yozilgan.
              </p>
            </div>

            <div
              style={{
                padding: 16,
                background: '#f8fafc',
                borderRadius: 10,
                border: '1px solid #e2e8f0'
              }}
            >
              <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#1e293b', marginBottom: 6 }}>
                2. O‘z matningizni qo‘shing
              </div>
              <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b', lineHeight: 1.5 }}>
                Ko‘rsatma ostidagi belgilangan joyga o‘qituvchingiz konspektini yoki Lex.uz’dagi qonun matnini qo‘ying.
              </p>
            </div>

            <div
              style={{
                padding: 16,
                background: '#f8fafc',
                borderRadius: 10,
                border: '1px solid #e2e8f0'
              }}
            >
              <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#1e293b', marginBottom: 6 }}>
                3. AI ga yuboring
              </div>
              <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b', lineHeight: 1.5 }}>
                ChatGPT, Claude yoki Gemini’ga yuboring. AI uni 100% toza va qat’iy MD+ matniga aylantirib beradi.
              </p>
            </div>

            <div
              style={{
                padding: 16,
                background: '#f8fafc',
                borderRadius: 10,
                border: '1px solid #e2e8f0'
              }}
            >
              <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#1e293b', marginBottom: 6 }}>
                4. Studiyaga tashlang
              </div>
              <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b', lineHeight: 1.5 }}>
                AI bergan natijani Yurist Studio muharririga joylashtiring va tayyor PDF o‘quv qo‘llanmasidan bahramand bo‘ling.
              </p>
            </div>
          </div>

          {/* AI natijasini tekshirish usuli */}
          <div
            style={{
              padding: 16,
              background: '#fffbeb',
              borderRadius: 10,
              border: '1px solid #fef3c7'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#b45309', fontWeight: 700, marginBottom: 6 }}>
              <AlertTriangle size={18} />
              AI natijasini tekshirish: "??" nishoni
            </div>
            <p style={{ margin: 0, fontSize: '0.9rem', color: '#92400e', lineHeight: 1.5 }}>
              Agar sun’iy intellekt biron-bir modda raqami yoki sanaga 100% ishonmasa, ko‘rsatmaga binoan uning yoniga{' '}
              <code>??</code> belgisini qo‘yadi (masalan: <code>150-modda??</code>). Dastur ushbu belgini ko‘rganda matn ustida sariq
              <strong>«tekshiring»</strong> nishonini chiqaradi. Konspektni chop etishdan oldin o‘sha moddani Lex.uz orqali bir bor solishtirib olishingiz maqsadga muvofiqdir.
            </p>
          </div>
        </section>
      )}

      {/* 6. Bo‘lim: "Ogohlantirishlar nimani anglatadi" */}
      {(activeTab === 'all' || activeTab === 'warnings') && (
        <section className="guide-card" id="warnings">
          <div className="guide-card-header">
            <h2 className="guide-card-title">
              <AlertTriangle size={22} style={{ color: '#d97706' }} />
              Ogohlantirishlar nimani anglatadi?
            </h2>
          </div>

          <p style={{ fontSize: '0.95rem', color: 'var(--text-muted)', margin: '0 0 16px 0' }}>
            Muharrirda biron xatolik yuz bersa, tizim hech qachon qulab tushmaydi va matningizni o‘chirib yubormaydi.
            U faqat pastdagi sariq xabarlar orqali nima yetishmayotganini eslatadi:
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {filteredWarnings.map((warn) => (
              <div key={warn.code} className="guide-warn-item" id={`warn-${warn.code}`}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10, flexWrap: 'wrap' }}>
                  <div style={{ fontWeight: 700, fontSize: '0.98rem', color: '#1e293b' }}>
                    {warn.title}
                  </div>
                  <span
                    style={{
                      fontFamily: 'var(--font-mono, monospace)',
                      fontSize: '0.72rem',
                      background: '#fef3c7',
                      color: '#b45309',
                      padding: '2px 8px',
                      borderRadius: 4,
                      fontWeight: 600
                    }}
                  >
                    kod: {warn.code}
                  </span>
                </div>

                <div style={{ marginTop: 8, fontSize: '0.9rem', color: '#475569', lineHeight: 1.5 }}>
                  {warn.explanation}
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'minmax(200px, 1fr) 2fr',
                    gap: 12,
                    marginTop: 10,
                    alignItems: 'center'
                  }}
                >
                  <pre
                    style={{
                      margin: 0,
                      padding: 8,
                      borderRadius: 6,
                      background: '#fff1f2',
                      color: '#9f1239',
                      fontFamily: 'var(--font-mono, monospace)',
                      fontSize: '0.8rem',
                      border: '1px solid #fecdd3',
                      whiteSpace: 'pre-wrap'
                    }}
                  >
                    {warn.exampleSnippet}
                  </pre>

                  <div style={{ fontSize: '0.86rem', color: '#15803d' }}>
                    <strong>Qanday tuzatiladi:</strong> {warn.howToFix}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 7. Bo‘lim: "Savol-javob (FAQ)" */}
      {(activeTab === 'all' || activeTab === 'faq') && (
        <section className="guide-card" id="faq">
          <div className="guide-card-header">
            <h2 className="guide-card-title">
              <HelpCircle size={22} style={{ color: '#059669' }} />
              Savol-javob (FAQ) — Tez-tez beriladigan savollar
            </h2>
          </div>

          <p style={{ fontSize: '0.95rem', color: 'var(--text-muted)', margin: '0 0 16px 0' }}>
            Foydalanuvchilarimizdan kelgan eng dolzarb va amaliy savollarga ochiq javoblar:
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {filteredFaqs.map((faq, idx) => {
              const isOpen = openFaqIndexes.includes(idx);
              return (
                <div key={idx} className="guide-faq-item" style={{ cursor: 'pointer' }} onClick={() => toggleFaq(idx)}>
                  <div className="guide-faq-q" style={{ justifyContent: 'space-between' }}>
                    <span>❓ {faq.question}</span>
                    {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </div>

                  {isOpen && (
                    <div style={{ marginTop: 8, borderTop: '1px solid #f1f5f9', paddingTop: 8 }}>
                      <p className="guide-faq-a">{faq.answer}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* 8. Bo‘lim: "Chop etiladigan bir varaqli Cheat Sheet" */}
      {(activeTab === 'all' || activeTab === 'cheatsheet') && !searchQuery && (
        <section className="guide-card" id="cheatsheet">
          <div className="guide-card-header">
            <h2 className="guide-card-title">
              <Scale size={22} style={{ color: '#1e293b' }} />
              Chop etiladigan bir varaqli eslatma (Cheat Sheet)
            </h2>
            <button
              type="button"
              className="guide-action-btn guide-action-primary"
              onClick={() => window.print()}
            >
              <Printer size={14} />
              Qog‘ozga chop etish
            </button>
          </div>

          <p style={{ fontSize: '0.92rem', color: 'var(--text-muted)', margin: '0 0 16px 0' }}>
            Ushbu qisqa eslatmani printerdan chiqarib, ish stoli yoki kitobingiz ichiga solib qo‘yishingiz mumkin.
            Avval <strong>6 ta asosiy qolip</strong>, so‘ngra <strong>qo‘shimcha qoliplar</strong> joylashtirilgan:
          </p>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: 16,
              background: '#f8fafc',
              padding: 20,
              borderRadius: 12,
              border: '1px solid #e2e8f0'
            }}
          >
            {/* 1. Asosiy qoliplar */}
            <div>
              <div
                style={{
                  fontSize: '0.85rem',
                  fontWeight: 800,
                  color: '#1e40af',
                  borderBottom: '2px solid #bfdbfe',
                  paddingBottom: 6,
                  marginBottom: 10
                }}
              >
                1. ASOSIY 6 TA QOLIP
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: '0.84rem' }}>
                <div>
                  <strong># Hujjat nomi</strong> — Hujjat sarlavhasi
                  <br />
                  <span style={{ color: '#64748b' }}>muallif: Ism, uslub: classic</span>
                </div>
                <div>
                  <strong>## Bo‘lim nomi</strong> — Mavzu bo‘limlari
                </div>
                <div>
                  <strong>Oddiy matn</strong> — Hech qanday belgisiz matn
                  <br />
                  <span style={{ color: '#64748b' }}>- Ro‘yxat bandi (chiziqcha bilan)</span>
                </div>
                <div>
                  <strong>norma: 354-modda: Sarlavha</strong>
                  <br />
                  <span style={{ color: '#64748b' }}>manba: Fuqarolik Kodeksi</span>
                </div>
                <div>
                  <strong>ogoh:</strong> Xavf / javobgarlik eslatmasi
                  <br />
                  <strong>maslahat:</strong> Tavsiya / amaliy yo‘riqnoma
                </div>
                <div>
                  <strong>savol:</strong> Savol matni?
                  <br />
                  <strong>javob:</strong> Qonuniy aniq javob
                </div>
              </div>
            </div>

            {/* 2. Qo'shimcha qoliplar */}
            <div>
              <div
                style={{
                  fontSize: '0.85rem',
                  fontWeight: 800,
                  color: '#475569',
                  borderBottom: '2px solid #cbd5e1',
                  paddingBottom: 6,
                  marginBottom: 10
                }}
              >
                2. QO‘SHIMCHA MAXSUS QOLIPLAR
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: '0.84rem' }}>
                <div>
                  <strong>ta'rif: Atama:</strong> Ta’rif matni
                  <br />
                  <span style={{ color: '#64748b' }}>manba: Qonun nomi</span>
                </div>
                <div>
                  <strong>| Ustun 1 | Ustun 2 |</strong> — Qiyosiy jadval
                  <br />
                  <span style={{ color: '#64748b' }}>| --- | --- | (ajratgich qatori)</span>
                </div>
                <div>
                  <strong>kazus: Sud ishi sarlavhasi</strong>
                  <br />
                  <span style={{ color: '#64748b' }}>fakt: ... / qoida: ... / xulosa: ...</span>
                </div>
                <div>
                  <strong>taqqos: Mavzu A | Mavzu B</strong>
                  <br />
                  <span style={{ color: '#64748b' }}>- Bandlar solishtiriladi</span>
                </div>
                <div>
                  <strong>jarayon: Harakat nomi</strong>
                  <br />
                  <span style={{ color: '#64748b' }}>1-qadam -&gt; 2-qadam -&gt; Natija</span>
                </div>
                <div>
                  <strong>vaqt: Xronologiya</strong>
                  <br />
                  <span style={{ color: '#64748b' }}>Sana | Voqea bayoni</span>
                </div>
              </div>
            </div>

            {/* 3. Matn ichidagi qulayliklar */}
            <div>
              <div
                style={{
                  fontSize: '0.85rem',
                  fontWeight: 800,
                  color: '#15803d',
                  borderBottom: '2px solid #bbf7d0',
                  paddingBottom: 6,
                  marginBottom: 10
                }}
              >
                3. MATN ICHIDAGI BELGILAR
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: '0.84rem' }}>
                <div>
                  <code>**qalin**</code> — <strong>Qalin ajratilgan matn</strong>
                </div>
                <div>
                  <code>*kursiv*</code> — <em>Yotiq nozik matn</em>
                </div>
                <div>
                  <code>==matn==</code> — <mark style={{ background: '#fef08a', padding: '1px 4px', borderRadius: 2 }}>Sariq rangli matn</mark>
                </div>
                <div>
                  <code>[[354-modda]]</code> — Bosiladigan chip havola
                </div>
                <div>
                  <code>??</code> — Shubhali joyni belgilash ("tekshiring")
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Quyi tugma: Studiyaga qaytish */}
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: 24 }} className="no-print">
        <button
          type="button"
          className="guide-action-btn guide-action-primary"
          style={{ padding: '10px 24px', fontSize: '0.95rem' }}
          onClick={onBackToStudio}
        >
          <ArrowLeft size={16} />
          Yurist Studio Muharririga Qaytish
        </button>
      </div>
    </div>
  );
};
