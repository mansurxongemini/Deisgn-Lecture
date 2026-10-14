import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  convertRawTextToMdPlus,
  buildCustomAiPrompt,
  type SmartIngestOptions
} from '../../services/aiGuide';
import {
  convertWithOpenRouter,
  getSavedOpenRouterKey,
  saveOpenRouterKey,
  getSavedOpenRouterModel,
  saveOpenRouterModel,
  POPULAR_OPENROUTER_MODELS,
  DEFAULT_OPENROUTER_MODEL
} from '../../services/openRouter';
import {
  Sparkles,
  Copy,
  Check,
  X,
  FileText,
  Bot,
  ExternalLink,
  PlusCircle,
  ArrowRight,
  Eye,
  EyeOff,
  Key,
  Cpu,
  Loader2,
  AlertCircle
} from 'lucide-react';
import './smartIngestion.css';

interface SmartIngestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyMdText: (convertedMd: string, mode: 'replace' | 'append') => void;
  initialRawText?: string;
}

type TabType = 'openrouter' | 'converter' | 'ai_prompt';

const SAMPLE_RAW_TEXT = `354-modda. Shartnoma erkinligi printsipi
Fuqarolar va yuridik shaxslar shartnoma tuzishda erkindirlar. Shartnoma tuzishga majburlashga yo'l qo'yilmaydi.

Oferta — bir yoki bir necha muayyan shaxsga qaratilgan, shartnoma tuzish haqidagi yetarli darajada aniq taklif.

Diqqat: Majburiyat bajarilmasa, kreditor zararni qoplashni talab qilishga haqli.

Maslahat: Har doim shartnomaning barcha muhim shartlarini yozma ravishda kelishib oling.

Savol: Shartnoma qachon tuzilgan hisoblanadi?
Javob: Oferta bergan taraf uning qabul qilinganligi (aksept) to'g'risidagi bildirishnomani olgan paytdan boshlab.`;

export const SmartIngestionModal: React.FC<SmartIngestionModalProps> = ({
  isOpen,
  onClose,
  onApplyMdText,
  initialRawText = ''
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('openrouter');
  const [rawText, setRawText] = useState<string>(initialRawText);
  const [docTitle, setDocTitle] = useState<string>('');
  const [includeQuestions, setIncludeQuestions] = useState<boolean>(true);
  const [detailLevel, setDetailLevel] = useState<'short' | 'detailed'>('detailed');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // OpenRouter holatlari
  const [apiKey, setApiKey] = useState<string>(getSavedOpenRouterKey);
  const [selectedModel, setSelectedModel] = useState<string>(getSavedOpenRouterModel);
  const [showApiKey, setShowApiKey] = useState<boolean>(false);
  const [isLoadingAi, setIsLoadingAi] = useState<boolean>(false);
  const [aiResultMd, setAiResultMd] = useState<string>('');
  const [aiError, setAiError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (isOpen && initialRawText) {
      setRawText(initialRawText);
    }
  }, [isOpen, initialRawText]);

  // Kalit yoki model o'zgarganda saqlash
  const handleApiKeyChange = (val: string) => {
    setApiKey(val);
    saveOpenRouterKey(val);
  };

  const handleModelChange = (val: string) => {
    setSelectedModel(val);
    saveOpenRouterModel(val);
  };

  // Oflayn konvertatsiya natijasi
  const convertedMd = useMemo(() => {
    if (!rawText.trim()) return '';
    const opts: SmartIngestOptions = {
      includeQuestions,
      docTitle: docTitle.trim() || undefined
    };
    return convertRawTextToMdPlus(rawText, opts);
  }, [rawText, docTitle, includeQuestions]);

  // AI Prompt matni
  const aiPromptText = useMemo(() => {
    return buildCustomAiPrompt({
      includeQuestions,
      detailLevel,
      rawText: rawText.trim() || '[Xom matningiz]'
    });
  }, [includeQuestions, detailLevel, rawText]);

  // OpenRouter chaqiruvi
  const handleRunOpenRouter = async () => {
    if (!apiKey.trim()) {
      setAiError('Iltimos, avval OpenRouter API kalitini kiriting.');
      return;
    }
    if (!rawText.trim()) {
      setAiError('Formatlash uchun xom matn kiritilmadi.');
      return;
    }

    setAiError(null);
    setIsLoadingAi(true);

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      const result = await convertWithOpenRouter({
        apiKey,
        model: selectedModel || DEFAULT_OPENROUTER_MODEL,
        rawText,
        detailLevel,
        includeQuestions,
        signal: abortController.signal
      });
      setAiResultMd(result);
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') {
        setAiError('AI tahlili foydalanuvchi tomonidan bekor qilindi.');
      } else {
        const msg = err instanceof Error ? err.message : 'Noma’lum xatolik yuz berdi.';
        setAiError(msg);
      }
    } finally {
      setIsLoadingAi(false);
      abortControllerRef.current = null;
    }
  };

  const handleCancelAi = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  };

  if (!isOpen) return null;

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => {
      setCopiedKey((curr) => (curr === key ? null : curr));
    }, 2000);
  };

  const handleLoadSample = () => {
    setRawText(SAMPLE_RAW_TEXT);
    setDocTitle('Shartnoma Huquqi Asoslari');
  };

  return (
    <div className="smart-ingest-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="smart-ingest-modal" onClick={(e) => e.stopPropagation()}>
        {/* Modal Tepasi */}
        <div className="smart-ingest-header">
          <div className="smart-ingest-title-wrap">
            <div className="smart-ingest-icon-bubble">
              <Sparkles size={20} className="smart-sparkle-icon" />
            </div>
            <div>
              <h2 className="smart-ingest-title">Aqlli Formatlash va Matndan Konspekt</h2>
              <p className="smart-ingest-subtitle">
                OpenRouter AI yordamida qonun va ma’ruzalarni professional MD+ konspektiga aylantiring
              </p>
            </div>
          </div>
          <button
            type="button"
            className="smart-ingest-close-btn"
            onClick={onClose}
            aria-label="Yopish"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tablar */}
        <div className="smart-ingest-tabs-bar" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'openrouter'}
            className={`smart-tab-btn ${activeTab === 'openrouter' ? 'active' : ''}`}
            onClick={() => setActiveTab('openrouter')}
          >
            <Sparkles size={15} />
            <span>OpenRouter AI (Jonli)</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'converter'}
            className={`smart-tab-btn ${activeTab === 'converter' ? 'active' : ''}`}
            onClick={() => setActiveTab('converter')}
          >
            <FileText size={15} />
            <span>Tezkor Oflayn Konvertor</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'ai_prompt'}
            className={`smart-tab-btn ${activeTab === 'ai_prompt' ? 'active' : ''}`}
            onClick={() => setActiveTab('ai_prompt')}
          >
            <Bot size={15} />
            <span>Tashqi AI Prompt (Nusxalash)</span>
          </button>
        </div>

        {/* Tab 1: OpenRouter AI */}
        {activeTab === 'openrouter' && (
          <div className="smart-ingest-body-converter">
            {/* OpenRouter Sozlamalar paneli */}
            <div className="smart-openrouter-config-box">
              <div className="smart-openrouter-inputs-grid">
                <div>
                  <label className="smart-field-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Key size={13} />
                    <span>OpenRouter API kalit:</span>
                    <a
                      href="https://openrouter.ai/keys"
                      target="_blank"
                      rel="noreferrer"
                      className="smart-btn-link"
                      style={{ marginLeft: 'auto', fontSize: '0.74rem' }}
                    >
                      Kalit olish
                      <ExternalLink size={11} style={{ marginLeft: 3 }} />
                    </a>
                  </label>
                  <div className="smart-api-key-wrap">
                    <input
                      type={showApiKey ? 'text' : 'password'}
                      className="smart-api-key-input"
                      placeholder="sk-or-v1-..."
                      value={apiKey}
                      onChange={(e) => handleApiKeyChange(e.target.value)}
                      autoComplete="off"
                    />
                    <button
                      type="button"
                      className="smart-eye-toggle-btn"
                      onClick={() => setShowApiKey(!showApiKey)}
                      title={showApiKey ? 'Yashirish' : 'Ko‘rsatish'}
                      aria-label={showApiKey ? 'API kalitni yashirish' : 'API kalitni ko‘rsatish'}
                    >
                      {showApiKey ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="smart-field-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Cpu size={13} />
                    <span>AI Model:</span>
                  </label>
                  <select
                    className="smart-model-select"
                    value={selectedModel}
                    onChange={(e) => handleModelChange(e.target.value)}
                    aria-label="AI modelni tanlash"
                  >
                    {POPULAR_OPENROUTER_MODELS.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} ({m.provider}) {m.badge ? `— ${m.badge}` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="smart-openrouter-options-row">
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                  <label className="smart-checkbox-label">
                    <input
                      type="checkbox"
                      checked={includeQuestions}
                      onChange={(e) => setIncludeQuestions(e.target.checked)}
                    />
                    <span>Savol-javoblar (fleshkard) yaratish</span>
                  </label>
                  <label className="smart-checkbox-label">
                    <input
                      type="radio"
                      name="detailLevelOpenRouter"
                      checked={detailLevel === 'detailed'}
                      onChange={() => setDetailLevel('detailed')}
                    />
                    <span>To‘liq</span>
                  </label>
                  <label className="smart-checkbox-label">
                    <input
                      type="radio"
                      name="detailLevelOpenRouter"
                      checked={detailLevel === 'short'}
                      onChange={() => setDetailLevel('short')}
                    />
                    <span>Ixcham</span>
                  </label>
                </div>

                <div className="smart-ai-action-bar">
                  {isLoadingAi ? (
                    <div className="smart-ai-loading-indicator">
                      <Loader2 size={16} className="smart-spinner" />
                      <span>AI formatlamoqda...</span>
                      <button
                        type="button"
                        className="smart-btn-secondary"
                        onClick={handleCancelAi}
                        style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                      >
                        Bekor qilish
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      className="smart-btn-run-ai"
                      onClick={handleRunOpenRouter}
                      disabled={!rawText.trim() || !apiKey.trim()}
                    >
                      <Sparkles size={15} />
                      <span>AI bilan formatlash</span>
                    </button>
                  )}
                </div>
              </div>

              {aiError && (
                <div className="smart-error-box">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <AlertCircle size={16} style={{ flexShrink: 0 }} />
                    <span>{aiError}</span>
                  </div>
                  <button
                    type="button"
                    className="smart-btn-link"
                    onClick={() => setAiError(null)}
                    aria-label="Xatolik xabarini yopish"
                    style={{ color: 'var(--danger)', textDecoration: 'none' }}
                  >
                    <X size={14} />
                  </button>
                </div>
              )}
            </div>

            {/* Asosiy 2 ustunli maydon */}
            <div className="smart-ingest-panes-grid">
              <div className="smart-pane smart-pane-left">
                <div className="smart-pane-header">
                  <span className="smart-pane-label">Xom matn (Qonun moddalari yoki ma’ruza):</span>
                  <button
                    type="button"
                    className="smart-btn-link"
                    onClick={handleLoadSample}
                    title="Namunaviy yuridik matnni sinab ko‘rish"
                  >
                    Namuna yuklash
                  </button>
                </div>
                <textarea
                  className="smart-raw-textarea"
                  placeholder="Bu yerga xom ma’ruza matni yoki qonun moddalarini tashlang..."
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                  autoFocus
                />
              </div>

              <div className="smart-pane smart-pane-right">
                <div className="smart-pane-header">
                  <span className="smart-pane-label">OpenRouter AI Natijasi (MD+):</span>
                  {aiResultMd && (
                    <button
                      type="button"
                      className="smart-btn-link"
                      onClick={() => handleCopy(aiResultMd, 'ai_result_copy')}
                    >
                      {copiedKey === 'ai_result_copy' ? (
                        <>
                          <Check size={13} /> Nusxalandi
                        </>
                      ) : (
                        <>
                          <Copy size={13} /> Nusxa olish
                        </>
                      )}
                    </button>
                  )}
                </div>

                <div className="smart-result-view">
                  {aiResultMd ? (
                    <pre className="smart-code-preview">{aiResultMd}</pre>
                  ) : (
                    <div className="smart-empty-state">
                      <Sparkles size={32} className="smart-empty-icon" />
                      <p>
                        API kalitingizni kiriting va <strong>"AI bilan formatlash"</strong> tugmasini bosing.
                        Natija bir zumda shu yerda paydo bo‘ladi.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Pastki harakat tugmalari */}
            <div className="smart-ingest-footer">
              <div className="smart-footer-hint">
                💡 OpenRouter orqali moddalar, kazuslar, qoidalar va test savollari to‘liq tuzilmaga solinadi.
              </div>
              <div className="smart-footer-actions">
                <button
                  type="button"
                  className="smart-btn-secondary"
                  onClick={onClose}
                >
                  Bekor qilish
                </button>
                <button
                  type="button"
                  className="smart-btn-secondary"
                  disabled={!aiResultMd}
                  onClick={() => {
                    onApplyMdText(aiResultMd, 'append');
                    onClose();
                  }}
                  title="Hujjat oxiriga qo‘shish"
                >
                  <PlusCircle size={15} />
                  <span>Hujjat oxiriga qo‘shish</span>
                </button>
                <button
                  type="button"
                  className="smart-btn-primary"
                  disabled={!aiResultMd}
                  onClick={() => {
                    onApplyMdText(aiResultMd, 'replace');
                    onClose();
                  }}
                  title="Mavjud hujjatni almashtirish"
                >
                  <ArrowRight size={15} />
                  <span>Muharrirga joylash (Almashtirish)</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Tezkor Oflayn Konvertor */}
        {activeTab === 'converter' && (
          <div className="smart-ingest-body-converter">
            <div className="smart-ingest-panes-grid">
              {/* Chap panel: Xom matn kiritish */}
              <div className="smart-pane smart-pane-left">
                <div className="smart-pane-header">
                  <span className="smart-pane-label">Xom matn (Oflayn tahlil uchun):</span>
                  <button
                    type="button"
                    className="smart-btn-link"
                    onClick={handleLoadSample}
                    title="Namunaviy yuridik matnni sinab ko‘rish"
                  >
                    Namuna yuklash
                  </button>
                </div>
                <textarea
                  className="smart-raw-textarea"
                  placeholder="Bu yerga oddiy matn, qonun moddalari yoki konspektni tashlang..."
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                />

                <div className="smart-options-row">
                  <div className="smart-option-field">
                    <label className="smart-field-label">Sarlavha (ixtiyoriy):</label>
                    <input
                      type="text"
                      className="smart-text-input"
                      placeholder="Avtomatik aniqlanadi"
                      value={docTitle}
                      onChange={(e) => setDocTitle(e.target.value)}
                    />
                  </div>
                  <label className="smart-checkbox-label">
                    <input
                      type="checkbox"
                      checked={includeQuestions}
                      onChange={(e) => setIncludeQuestions(e.target.checked)}
                    />
                    <span>Savol-javoblar (Fleshkard) qo‘shish</span>
                  </label>
                </div>
              </div>

              {/* O'ng panel: MD+ Natija */}
              <div className="smart-pane smart-pane-right">
                <div className="smart-pane-header">
                  <span className="smart-pane-label">Oflayn tuzilgan MD+ konspekt:</span>
                  {convertedMd && (
                    <button
                      type="button"
                      className="smart-btn-link"
                      onClick={() => handleCopy(convertedMd, 'converted_copy')}
                    >
                      {copiedKey === 'converted_copy' ? (
                        <>
                          <Check size={13} /> Nusxalandi
                        </>
                      ) : (
                        <>
                          <Copy size={13} /> Nusxa olish
                        </>
                      )}
                    </button>
                  )}
                </div>

                <div className="smart-result-view">
                  {convertedMd ? (
                    <pre className="smart-code-preview">{convertedMd}</pre>
                  ) : (
                    <div className="smart-empty-state">
                      <Sparkles size={32} className="smart-empty-icon" />
                      <p>Chap panelga matn tashlang, u bir zumda norma, kazus va ta’riflarga ajratiladi.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Pastki harakat tugmalari */}
            <div className="smart-ingest-footer">
              <div className="smart-footer-hint">
                💡 Tanib olinadigan bloklar: <code>354-modda</code> (norma), <code>Atama — ta’rif</code>, <code>Diqqat:</code> (ogoh), <code>Savol:</code> va <code>Javob:</code>.
              </div>
              <div className="smart-footer-actions">
                <button
                  type="button"
                  className="smart-btn-secondary"
                  onClick={onClose}
                >
                  Bekor qilish
                </button>
                <button
                  type="button"
                  className="smart-btn-secondary"
                  disabled={!convertedMd}
                  onClick={() => {
                    onApplyMdText(convertedMd, 'append');
                    onClose();
                  }}
                  title="Hujjat oxiriga qo‘shish"
                >
                  <PlusCircle size={15} />
                  <span>Hujjat oxiriga qo‘shish</span>
                </button>
                <button
                  type="button"
                  className="smart-btn-primary"
                  disabled={!convertedMd}
                  onClick={() => {
                    onApplyMdText(convertedMd, 'replace');
                    onClose();
                  }}
                  title="Mavjud hujjatni almashtirish"
                >
                  <ArrowRight size={15} />
                  <span>Muharrirga joylash (Almashtirish)</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: AI Prompt Generatori */}
        {activeTab === 'ai_prompt' && (
          <div className="smart-ingest-body-ai">
            <div className="smart-ai-config-bar">
              <div className="smart-ai-field">
                <label className="smart-field-label">Tafsilot darajasi:</label>
                <div className="smart-radio-group">
                  <label className="smart-radio-label">
                    <input
                      type="radio"
                      name="detailLevel"
                      checked={detailLevel === 'detailed'}
                      onChange={() => setDetailLevel('detailed')}
                    />
                    <span>To‘liq va batafsil</span>
                  </label>
                  <label className="smart-radio-label">
                    <input
                      type="radio"
                      name="detailLevel"
                      checked={detailLevel === 'short'}
                      onChange={() => setDetailLevel('short')}
                    />
                    <span>Ixcham (Xulosa)</span>
                  </label>
                </div>
              </div>

              <label className="smart-checkbox-label">
                <input
                  type="checkbox"
                  checked={includeQuestions}
                  onChange={(e) => setIncludeQuestions(e.target.checked)}
                />
                <span>3-5 ta takrorlash savol-javoblarini generatsiya qilish</span>
              </label>

              <div className="smart-ai-links">
                <a
                  href="https://chatgpt.com"
                  target="_blank"
                  rel="noreferrer"
                  className="smart-external-link"
                >
                  <span>ChatGPT ni ochish</span>
                  <ExternalLink size={13} />
                </a>
                <a
                  href="https://claude.ai"
                  target="_blank"
                  rel="noreferrer"
                  className="smart-external-link"
                >
                  <span>Claude ni ochish</span>
                  <ExternalLink size={13} />
                </a>
              </div>
            </div>

            <div className="smart-prompt-preview-wrap">
              <div className="smart-pane-header">
                <span className="smart-pane-label">Tayyor professional prompt:</span>
                <button
                  type="button"
                  className="smart-copy-btn"
                  onClick={() => handleCopy(aiPromptText, 'ai_prompt_copy')}
                >
                  {copiedKey === 'ai_prompt_copy' ? (
                    <>
                      <Check size={14} /> Nusxalandi!
                    </>
                  ) : (
                    <>
                      <Copy size={14} /> Promptni nusxalash
                    </>
                  )}
                </button>
              </div>
              <textarea
                className="smart-prompt-textarea"
                readOnly
                value={aiPromptText}
              />
            </div>

            <div className="smart-ingest-footer">
              <div className="smart-footer-hint">
                1. "Promptni nusxalash"ni bosing. 2. ChatGPT yoki Claude ga tashlang. 3. Olingan MD+ javobini muharrirga qo‘ying.
              </div>
              <div className="smart-footer-actions">
                <button
                  type="button"
                  className="smart-btn-primary"
                  onClick={() => handleCopy(aiPromptText, 'ai_prompt_copy')}
                >
                  <Copy size={15} />
                  <span>Promptni nusxalash</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
