import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach } from 'vitest';
import {
  DESIGN_TOKENS,
  TOKEN_BY_ID,
  TOKEN_BY_CSS_VAR,
  generateCssVariablesString
} from '../design/tokens';
import {
  setToken,
  resetToken,
  resetAll,
  getTokenValue,
  getTokenOverrides,
  initTokenEngine
} from '../design/applyTokens';
import fs from 'fs';
import path from 'path';

// Node environment DOM mocks
const mockStyles: Record<string, string> = {};
if (typeof document === 'undefined') {
  (global as any).document = {
    documentElement: {
      style: {
        setProperty(name: string, val: string) { mockStyles[name] = val; },
        getPropertyValue(name: string) { return mockStyles[name] || ''; },
        removeProperty(name: string) { delete mockStyles[name]; }
      }
    },
    getElementById() { return null; },
    createElement() {
      return { id: '', textContent: '', style: {} };
    },
    head: {
      appendChild() {},
      prepend() {}
    },
    querySelectorAll() { return []; }
  };
  (global as any).window = {
    dispatchEvent() {}
  };
}

describe('TASK 3: Runtime Design Token Engine', () => {
  beforeEach(async () => {
    await resetAll();
  });

  describe('1. Typed Token Registry (tokens.ts)', () => {
    it('should have a non-empty registry of design tokens', () => {
      expect(DESIGN_TOKENS.length).toBeGreaterThan(30);
    });

    it('each token must have required schema fields', () => {
      const ids = new Set<string>();
      const cssVars = new Set<string>();

      for (const token of DESIGN_TOKENS) {
        // Unique ID and cssVar
        expect(ids.has(token.id), `Duplicate token id: ${token.id}`).toBe(false);
        expect(cssVars.has(token.cssVar), `Duplicate cssVar: ${token.cssVar}`).toBe(false);
        ids.add(token.id);
        cssVars.add(token.cssVar);

        // Required fields
        expect(token.id).toBeTruthy();
        expect(token.cssVar.startsWith('--')).toBe(true);
        expect(token.label).toBeTruthy();
        expect(['color', 'typography', 'spacing', 'radius', 'shadow', 'layout']).toContain(token.category);
        expect(['color', 'size', 'font', 'spacing', 'radius', 'shadow']).toContain(token.type);
        expect(token.defaultValue).toBeTruthy();
        expect(['ui', 'doc']).toContain(token.scope);

        // Numeric tokens must have min, max, step
        if (token.type === 'size' && token.unit === 'px') {
          expect(token.min).toBeDefined();
          expect(token.max).toBeDefined();
          expect(token.step).toBeDefined();
        }
      }
    });

    it('indexes tokens by id and cssVar correctly', () => {
      expect(TOKEN_BY_ID.get('ui_bg')).toBeDefined();
      expect(TOKEN_BY_ID.get('ui_bg')?.cssVar).toBe('--bg');
      expect(TOKEN_BY_CSS_VAR.get('--bg')?.id).toBe('ui_bg');

      expect(TOKEN_BY_ID.get('doc_bg')).toBeDefined();
      expect(TOKEN_BY_ID.get('doc_bg')?.scope).toBe('doc');
      expect(TOKEN_BY_ID.get('canvas_font_h1')?.defaultValue).toBe('52px');
    });

    it('generates two scopes: data-ui-theme and data-document-theme', () => {
      const { uiCss, docCss, combinedCss } = generateCssVariablesString();

      expect(uiCss).toContain(':root, [data-ui-theme]');
      expect(uiCss).toContain('--bg: #F7F5F1;');
      expect(uiCss).toContain('--accent: #1B2A4A;');

      expect(docCss).toContain('[data-document-theme]');
      expect(docCss).toContain('.study-card-9-16');
      expect(docCss).toContain('--doc-bg: #FAF8F5;');
      expect(docCss).toContain('--canvas-font-hero: 74px;');

      expect(combinedCss).toContain(uiCss);
      expect(combinedCss).toContain(docCss);
    });
  });

  describe('2. Runtime Updates and Overrides (applyTokens.ts)', () => {
    it('setToken updates live CSS variable and overrides map', async () => {
      await initTokenEngine();

      await setToken('ui_accent', '#2563EB');
      expect(getTokenValue('ui_accent')).toBe('#2563EB');
      expect(document.documentElement.style.getPropertyValue('--accent')).toBe('#2563EB');

      const overrides = getTokenOverrides();
      expect(overrides['ui_accent']).toBe('#2563EB');
    });

    it('setToken works with cssVar string as identifier', async () => {
      await setToken('--canvas-font-h1', '60px');
      expect(getTokenValue('canvas_font_h1')).toBe('60px');
      expect(document.documentElement.style.getPropertyValue('--canvas-font-h1')).toBe('60px');
    });

    it('resetToken restores default value for single token', async () => {
      const defaultBg = TOKEN_BY_ID.get('ui_bg')?.defaultValue;
      await setToken('ui_bg', '#112233');
      expect(getTokenValue('ui_bg')).toBe('#112233');

      await resetToken('ui_bg');
      expect(getTokenValue('ui_bg')).toBe(defaultBg);
      expect(document.documentElement.style.getPropertyValue('--bg')).toBe('');
      expect(getTokenOverrides()['ui_bg']).toBeUndefined();
    });

    it('resetAll restores all defaults and clears overrides', async () => {
      await setToken('ui_bg', '#112233');
      await setToken('doc_bg', '#334455');
      await setToken('canvas_font_hero', '88px');

      expect(Object.keys(getTokenOverrides()).length).toBe(3);

      await resetAll();

      expect(Object.keys(getTokenOverrides()).length).toBe(0);
      expect(document.documentElement.style.getPropertyValue('--bg')).toBe('');
      expect(document.documentElement.style.getPropertyValue('--doc-bg')).toBe('');
      expect(document.documentElement.style.getPropertyValue('--canvas-font-hero')).toBe('');
    });
  });

  describe('3. Zero Hardcoded CSS Invariant', () => {
    it('all component CSS files must have 0 hardcoded hex colors, font-sizes, paddings, and radii', () => {
      const componentFiles = [
        'src/App.css',
        'src/index.css',
        'src/components/preview/preview.css',
        'src/components/editor/editor.css',
        'src/components/sidebar/sidebar.css',
        'src/components/palette/palette.css',
        'src/components/guide/guide.css',
        'src/components/blocks/blocks.css'
      ];

      for (const relPath of componentFiles) {
        const fullPath = path.resolve(process.cwd(), relPath);
        if (!fs.existsSync(fullPath)) continue;
        const content = fs.readFileSync(fullPath, 'utf8');

        const hexMatches = content.match(/#[0-9a-fA-F]{3,8}\b/g) || [];
        const fontSizeMatches = content.match(/font-size:\s*[0-9]+px/g) || [];
        const paddingMatches = content.match(/padding(-[a-z]+)?:\s*[^;]*[0-9]+px/g) || [];
        const radiusMatches = content.match(/border-radius:\s*[0-9]+px/g) || [];

        expect(
          hexMatches,
          `${relPath} contains hardcoded hex colors: ${hexMatches.join(', ')}`
        ).toEqual([]);

        expect(
          fontSizeMatches,
          `${relPath} contains hardcoded pixel font-sizes: ${fontSizeMatches.join(', ')}`
        ).toEqual([]);

        expect(
          paddingMatches,
          `${relPath} contains hardcoded pixel paddings: ${paddingMatches.join(', ')}`
        ).toEqual([]);

        expect(
          radiusMatches,
          `${relPath} contains hardcoded pixel border-radii: ${radiusMatches.join(', ')}`
        ).toEqual([]);
      }
    });
  });
});
