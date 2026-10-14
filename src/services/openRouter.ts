/**
 * OPENROUTER API INTEGRATION SERVICE
 *
 * Yurist Studio uchun OpenRouter orqali xom yuridik matnlarni
 * MD+ (Markdown Plus) formatiga avtomatik o'tkazish xizmati.
 */

import { generateAiPrompt } from '../schema/mdSpec';

export const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
export const OPENROUTER_KEY_STORAGE = 'yurist_openrouter_api_key';
export const OPENROUTER_MODEL_STORAGE = 'yurist_openrouter_model';

export interface OpenRouterModelOption {
  id: string;
  name: string;
  provider: string;
  badge?: string;
  recommended?: boolean;
}

export const POPULAR_OPENROUTER_MODELS: OpenRouterModelOption[] = [
  {
    id: 'google/gemini-2.5-flash',
    name: 'Gemini 2.5 Flash',
    provider: 'Google',
    badge: 'Tavsiya etiladi (Tez va arzon)',
    recommended: true
  },
  {
    id: 'anthropic/claude-3.5-haiku',
    name: 'Claude 3.5 Haiku',
    provider: 'Anthropic',
    badge: 'Yuqori aniqlikdagi tahrir'
  },
  {
    id: 'openai/gpt-4o-mini',
    name: 'GPT-4o Mini',
    provider: 'OpenAI',
    badge: 'Tezkor va barqaror'
  },
  {
    id: 'deepseek/deepseek-chat',
    name: 'DeepSeek V3',
    provider: 'DeepSeek',
    badge: 'Mantiqiy tahlil va arzon'
  },
  {
    id: 'meta-llama/llama-3.3-70b-instruct',
    name: 'Llama 3.3 70B',
    provider: 'Meta',
    badge: 'Ochiq manbali model'
  },
  {
    id: 'google/gemini-2.0-flash-exp:free',
    name: 'Gemini 2.0 Flash (Free)',
    provider: 'Google',
    badge: 'Bepul sinov'
  }
];

export const DEFAULT_OPENROUTER_MODEL = 'google/gemini-2.5-flash';

/**
 * Saqlangan OpenRouter API kalitini olish
 */
export function getSavedOpenRouterKey(): string {
  try {
    if (typeof localStorage === 'undefined') return '';
    return localStorage.getItem(OPENROUTER_KEY_STORAGE) || '';
  } catch {
    return '';
  }
}

/**
 * OpenRouter API kalitini saqlash
 */
export function saveOpenRouterKey(key: string): void {
  try {
    if (typeof localStorage === 'undefined') return;
    if (key.trim()) {
      localStorage.setItem(OPENROUTER_KEY_STORAGE, key.trim());
    } else {
      localStorage.removeItem(OPENROUTER_KEY_STORAGE);
    }
  } catch (err) {
    console.warn('OpenRouter kalitini saqlashda xatolik:', err);
  }
}

/**
 * Saqlangan model nomini olish
 */
export function getSavedOpenRouterModel(): string {
  try {
    if (typeof localStorage === 'undefined') return DEFAULT_OPENROUTER_MODEL;
    return localStorage.getItem(OPENROUTER_MODEL_STORAGE) || DEFAULT_OPENROUTER_MODEL;
  } catch {
    return DEFAULT_OPENROUTER_MODEL;
  }
}

/**
 * Tanlangan model nomini saqlash
 */
export function saveOpenRouterModel(model: string): void {
  try {
    if (typeof localStorage === 'undefined') return;
    if (model.trim()) {
      localStorage.setItem(OPENROUTER_MODEL_STORAGE, model.trim());
    }
  } catch (err) {
    console.warn('OpenRouter modelini saqlashda xatolik:', err);
  }
}


/**
 * AI javobidan sof Markdown/MD+ matnini ajratib olish (kod bloklarini tozalash)
 */
export function extractMarkdownFromAiResponse(rawResponse: string): string {
  if (!rawResponse) return '';

  let text = rawResponse.trim();

  // Agar javob ```md yoki ```markdown bilan o'ralgan bo'lsa
  const codeBlockMatch = text.match(/^```(?:md|markdown)?\s*\n([\s\S]*?)\n```$/i);
  if (codeBlockMatch && codeBlockMatch[1]) {
    text = codeBlockMatch[1].trim();
  } else {
    // Agar matn ichida birorta ```md ... ``` bloki bo'lsa
    const innerMatch = text.match(/```(?:md|markdown)?\s*\n([\s\S]*?)\n```/i);
    if (innerMatch && innerMatch[1]) {
      text = innerMatch[1].trim();
    }
  }

  return text;
}

export interface ConvertWithOpenRouterParams {
  apiKey: string;
  model?: string;
  rawText: string;
  detailLevel?: 'short' | 'detailed';
  includeQuestions?: boolean;
  signal?: AbortSignal;
}

/**
 * OpenRouter orqali matnni MD+ formatiga aylantirish
 */
export async function convertWithOpenRouter(
  params: ConvertWithOpenRouterParams
): Promise<string> {
  const {
    apiKey,
    model = DEFAULT_OPENROUTER_MODEL,
    rawText,
    detailLevel = 'detailed',
    includeQuestions = true,
    signal
  } = params;

  if (!apiKey || !apiKey.trim()) {
    throw new Error('Iltimos, OpenRouter API kalitini kiriting.');
  }

  if (!rawText || !rawText.trim()) {
    throw new Error('Formatlash uchun xom matn kiritilmadi.');
  }

  // Tizimli yo'riqnoma
  const fullPromptTemplate = generateAiPrompt({
    includeQuestions,
    detailLevel,
    rawText: rawText.trim()
  });

  const response = await fetch(OPENROUTER_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey.trim()}`,
      'HTTP-Referer': 'https://yurist-studio.local',
      'X-Title': 'Yurist Studio',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: model.trim() || DEFAULT_OPENROUTER_MODEL,
      messages: [
        {
          role: 'user',
          content: fullPromptTemplate
        }
      ],
      temperature: 0.2
    }),
    signal
  });

  if (!response.ok) {
    let errorDetail = '';
    try {
      const errJson = await response.json();
      errorDetail = errJson?.error?.message || JSON.stringify(errJson);
    } catch {
      errorDetail = await response.text();
    }

    if (response.status === 401) {
      throw new Error('OpenRouter API kaliti noto‘g‘ri yoki bekor qilingan. Iltimos, kalitni qayta tekshiring.');
    }
    if (response.status === 402) {
      throw new Error('OpenRouter hisobingizda mablag‘ (kredit) yetarli emas.');
    }
    if (response.status === 429) {
      throw new Error('So‘rovlar soni cheklovga (rate limit) yetdi. Biroz kuting va qayta urinib ko‘ring.');
    }
    throw new Error(`OpenRouter xatosi (${response.status}): ${errorDetail || 'Noma’lum xatolik'}`);
  }

  const data = await response.json();
  const rawAiContent = data?.choices?.[0]?.message?.content;

  if (!rawAiContent || typeof rawAiContent !== 'string') {
    throw new Error('OpenRouter modelidan bo‘sh javob qaytdi.');
  }

  return extractMarkdownFromAiResponse(rawAiContent);
}
