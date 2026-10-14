import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  extractMarkdownFromAiResponse,
  getSavedOpenRouterKey,
  saveOpenRouterKey,
  getSavedOpenRouterModel,
  saveOpenRouterModel,
  convertWithOpenRouter,
  DEFAULT_OPENROUTER_MODEL,
  OPENROUTER_KEY_STORAGE,
  OPENROUTER_MODEL_STORAGE
} from '../services/openRouter';

class LocalStorageMock {
  private store: Record<string, string> = {};

  clear() {
    this.store = {};
  }

  getItem(key: string): string | null {
    return this.store[key] ?? null;
  }

  setItem(key: string, value: string): void {
    this.store[key] = String(value);
  }

  removeItem(key: string): void {
    delete this.store[key];
  }
}

const mockStorage = new LocalStorageMock();
// @ts-expect-error define global localStorage mock
globalThis.localStorage = mockStorage;

describe('OpenRouter Service Tests', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('extractMarkdownFromAiResponse', () => {
    it('toza matnni o‘zgarishsiz qaytaradi', () => {
      const input = '# Mavzu\nnorma: 1-modda\nMatn';
      expect(extractMarkdownFromAiResponse(input)).toBe(input);
    });

    it('```md ... ``` kod blokini tozalab matnni ajratib oladi', () => {
      const input = '```md\n# Konspekt\nnorma: 354-modda\n```';
      expect(extractMarkdownFromAiResponse(input)).toBe('# Konspekt\nnorma: 354-modda');
    });

    it('```markdown ... ``` kod blokini ham tozalaydi', () => {
      const input = '```markdown\n# Sarlavha\nta\'rif: Atama: Izoh\n```';
      expect(extractMarkdownFromAiResponse(input)).toBe('# Sarlavha\nta\'rif: Atama: Izoh');
    });

    it('AI kirish yoki yakuniy so‘zlar yozgan bo‘lsa ham faqat kod blokini ajratadi', () => {
      const input = 'Mana siz so‘ragan konspekt:\n```md\n# Yuridik Konspekt\nsavol: Nima?\njavob: Shu.\n```\nUmid qilamanki foydali bo‘ldi!';
      expect(extractMarkdownFromAiResponse(input)).toBe('# Yuridik Konspekt\nsavol: Nima?\njavob: Shu.');
    });

    it('bo‘sh matn uchun bo‘sh satr qaytaradi', () => {
      expect(extractMarkdownFromAiResponse('')).toBe('');
      // @ts-expect-error test null resilience
      expect(extractMarkdownFromAiResponse(null)).toBe('');
    });
  });

  describe('Kalit va model saqlash (LocalStorage)', () => {
    it('API kalitni xavfsiz saqlaydi va oladi', () => {
      expect(getSavedOpenRouterKey()).toBe('');
      saveOpenRouterKey('sk-or-v1-test-key-123');
      expect(getSavedOpenRouterKey()).toBe('sk-or-v1-test-key-123');
      expect(localStorage.getItem(OPENROUTER_KEY_STORAGE)).toBe('sk-or-v1-test-key-123');

      // Bo'sh kalit kiritilganda tozalaydi
      saveOpenRouterKey('   ');
      expect(getSavedOpenRouterKey()).toBe('');
    });

    it('Model nomini saqlaydi va default qiymatga tushadi', () => {
      expect(getSavedOpenRouterModel()).toBe(DEFAULT_OPENROUTER_MODEL);
      saveOpenRouterModel('anthropic/claude-3.5-haiku');
      expect(getSavedOpenRouterModel()).toBe('anthropic/claude-3.5-haiku');
      expect(localStorage.getItem(OPENROUTER_MODEL_STORAGE)).toBe('anthropic/claude-3.5-haiku');
    });
  });

  describe('convertWithOpenRouter API chaqiruvlari', () => {
    it('API kalit kiritilmaganda xatolik beradi', async () => {
      await expect(
        convertWithOpenRouter({
          apiKey: '',
          rawText: 'Matn'
        })
      ).rejects.toThrow('Iltimos, OpenRouter API kalitini kiriting.');
    });

    it('Xom matn kiritilmaganda xatolik beradi', async () => {
      await expect(
        convertWithOpenRouter({
          apiKey: 'sk-test',
          rawText: '   '
        })
      ).rejects.toThrow('Formatlash uchun xom matn kiritilmadi.');
    });

    it('Muvaffaqiyatli so‘rovda tozalangan MD+ matnini qaytaradi', async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              content: '```md\n# Fuqarolik Huquqi\nnorma: 1-modda\nMatn\n```'
            }
          }
        ]
      };

      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      } as Response);

      const result = await convertWithOpenRouter({
        apiKey: 'sk-valid-key',
        rawText: '1-modda. Fuqarolik qonunchiligi...',
        model: 'google/gemini-2.5-flash'
      });

      expect(result).toBe('# Fuqarolik Huquqi\nnorma: 1-modda\nMatn');
      expect(globalThis.fetch).toHaveBeenCalledTimes(1);
    });

    it('401 xatoligida aniq o‘zbekcha xabar beradi', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ error: { message: 'Unauthorized' } })
      } as Response);

      await expect(
        convertWithOpenRouter({
          apiKey: 'sk-invalid',
          rawText: 'Qonun matni'
        })
      ).rejects.toThrow('OpenRouter API kaliti noto‘g‘ri yoki bekor qilingan.');
    });

    it('402 kredit tugaganida tushunarli xabar beradi', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: false,
        status: 402,
        json: async () => ({ error: { message: 'Insufficient credits' } })
      } as Response);

      await expect(
        convertWithOpenRouter({
          apiKey: 'sk-empty-balance',
          rawText: 'Qonun matni'
        })
      ).rejects.toThrow('OpenRouter hisobingizda mablag‘ (kredit) yetarli emas.');
    });

    it('429 cheklov holatini to‘g‘ri ushlaydi', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: false,
        status: 429,
        json: async () => ({ error: { message: 'Rate limit' } })
      } as Response);

      await expect(
        convertWithOpenRouter({
          apiKey: 'sk-rate-limited',
          rawText: 'Qonun matni'
        })
      ).rejects.toThrow('So‘rovlar soni cheklovga (rate limit) yetdi.');
    });
  });
});
