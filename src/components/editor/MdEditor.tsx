import React, { useRef, useMemo, useState, useEffect, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import type { ParserWarning } from '../../schema/mdParser';
import type { LegalDocument } from '../../schema/types';
import { validateLegalDocumentJson } from '../../schema/validator';
import { serializeToMarkdownPlus } from '../../schema/mdSerializer';
import { generateCheatSheetText } from '../../schema/mdSpec';
import {
  FileText,
  CheckCircle2,
  AlertTriangle,
  Copy,
  FolderOpen,
  Code2,
  HelpCircle,
  ArrowRight,
  Download,
  Upload,
  WrapText,
  X,
  Search,
  BookOpen,
  Plus,
  MoreHorizontal,
  Bold,
  Italic,
  ZoomIn,
  ZoomOut,
  Check,
  Sparkles
} from 'lucide-react';
import {
  SLASH_COMMANDS,
  filterSlashCommands,
  type SlashCommandItem
} from './slashCommands';
import { SlashCommandMenu } from './SlashCommandMenu';
import { SamplePickerModal } from './SamplePickerModal';
import { SmartIngestionModal } from './SmartIngestionModal';
import type { SampleDocItem } from '../../samples/catalog';
import './editor.css';

interface Props {
  value: string;
  onChange: (val: string) => void;
  warnings: ParserWarning[];
  onLoadSample?: () => void;
  onSelectSample?: (sample: SampleDocItem, mode: 'replace' | 'new_doc') => void;
  onCopyAiGuide: () => void;
  document?: LegalDocument;
  onOpenGuide?: (warningCode?: string) => void;
  onUndoCanvas?: () => boolean | void;
  onOpenSearch?: () => void;
  onOpenSmartIngestion?: () => void;
}

export const BLOCK_SNIPPETS = SLASH_COMMANDS.map((c) => ({
  id: c.id,
  name: c.label,
  desc: c.desc,
  snippet: c.template
}));

export interface CheatSheetItem {
  id: string;
  title: string;
  badge: string;
  snippet: string;
}

export const CHEAT_SHEET_ITEMS: CheatSheetItem[] = [
  {
    id: 'doc',
    title: 'Hujjat va bo‘lim sarlavhasi',
    badge: '# va meta',
    snippet: `# Fuqarolik Huquqi Asoslari\nmuallif: Abdullayev Nodir\nuslub: classic\nizoh: Majburiyatlar huquqi bo‘yicha konspekt\n\n## 1-Mavzu. Majburiyat Tushunchasi\nBo‘lim tavsifi va kirish matni shu yerda yoziladi.`
  },
  {
    id: 'norm',
    title: 'Qonun normasi',
    badge: 'norma:',
    snippet: `norma: 354-modda: Shartnoma erkinligi\nmanba: Fuqarolik Kodeksi\nsana: 01.03.1997\nFuqarolar va yuridik shaxslar shartnoma tuzishda erkindirlar.`
  },
  {
    id: 'case',
    title: 'Amaliy sud kazusi',
    badge: 'kazus:',
    snippet: `kazus: Tovarni yetkazib bermaslik bo‘yicha nizo\nfakt: Sotuvchi to‘lovni qabul qilib, tovarni belgilangan muddatda yetkazmadi.\nqoida: FK 382-moddasi (Majburiyatni buzish oqibatlari).\nxulosa: Da’vo to‘liq qanoatlantirildi va to‘langan summa hamda jarima undirildi.\nmanba: Toshkent tumanlararo iqtisodiy sudi`
  },
  {
    id: 'qa',
    title: 'Fleshkard (Savol-javob)',
    badge: 'savol: / javob:',
    snippet: `savol: Shartnoma tuzishning umumiy tartibi qanday?\njavob: Oferta (taklif) yuborish va uning ikkinchi taraf tomonidan akseptlanishi (qabul qilinishi) orqali tuziladi.\nmaslahat: FK 364-370 moddalariga qarang.`
  },
  {
    id: 'note',
    title: 'Eslatma va ogohlantirish',
    badge: 'ogoh: / maslahat:',
    snippet: `ogoh: Shartnomani muddatidan oldin bekor qilish taraflarning roziligi yoki sud qarori bilan amalga oshiriladi.\nmaslahat: Har bir bitimda javobgarlik va penya miqdorini aniq belgilash zarur.`
  },
  {
    id: 'def',
    title: 'Yuridik atama va ta’rif',
    badge: 'ta\'rif:',
    snippet: `ta'rif: Fors-major: Favqulodda, oldini olib bo‘lmaydigan va bartaraf etib bo‘lmas holatlar.\nmanba: Fuqarolik Kodeksi 333-modda 3-qism`
  },
  {
    id: 'compare',
    title: 'Qiyosiy tahlil',
    badge: 'taqqos:',
    snippet: `taqqos: Shartnoma | Bitim\n- Shartnoma: Ikki yoki undan ortiq shaxslarning o‘zaro kelishuvi\n- Bitim: Bir tomonlama iroda bildirish natijasida ham yuzaga kelishi mumkin`
  },
  {
    id: 'flow',
    title: 'Sud yoki huquqiy jarayon',
    badge: 'jarayon:',
    snippet: `jarayon: Sud muhokamasi bosqichlari\nDa’vo arizasi kiritish -> Ishni sudda ko‘rish -> Hal qiluv qarori chiqarish -> Ijro varaqasi berish`
  },
  {
    id: 'timeline',
    title: 'Xronologiya / Tarixiy sana',
    badge: 'vaqt:',
    snippet: `vaqt: Qonun qabul qilinishi\n1996 | Fuqarolik Kodeksi loyihasi ishlab chiqildi\n1997 | Oliy Majlis tomonidan qabul qilindi`
  },
  {
    id: 'table',
    title: 'Jadval ma’lumotlari',
    badge: '| Ustun |',
    snippet: `| Shartnoma turi | Subyektlar | Asosiy majburiyat |\n| --- | --- | --- |\n| Oldi-sotdi | Sotuvchi va Xaridor | Tovarni topshirish va haq to‘lash |\n| Ijara | Ijaraga beruvchi va Ijarachi | Mulkdan vaqtincha foydalanish |`
  },
  {
    id: 'inline',
    title: 'Ichki formatlash teglari',
    badge: 'Format',
    snippet: `**qalin matn**, *kursiv matn*, ==ajratilgan matn==, [[354-modda]] (havola)`
  }
];

// ---------------------------------------------------------------------------
// SINTAKSIS BO'YASH FUNKSIYASI (Gentle MD+ Highlighting)
// ---------------------------------------------------------------------------
const renderLineContent = (lineText: string, hasWarning: boolean) => {
  if (!lineText) {
    return '\u00A0';
  }

  // 1. Headings (#, ##, ###)
  const headingMatch = lineText.match(/^(#{1,6}\s+)(.*)$/);
  if (headingMatch) {
    return (
      <span className={`hl-heading ${hasWarning ? 'hl-error' : ''}`}>
        <span className="hl-heading-hash">{headingMatch[1]}</span>
        <span className="hl-heading-text">{headingMatch[2]}</span>
      </span>
    );
  }

  // 2. Metadata (muallif:, mavzu:, uslub: va h.k.)
  const metaMatch = lineText.match(/^([a-zA-Z0-9_\u0400-\u04FF]+:)(\s+.*)?$/);
  if (metaMatch) {
    return (
      <span className={`hl-metadata ${hasWarning ? 'hl-error' : ''}`}>
        <span className="hl-metadata-key">{metaMatch[1]}</span>
        <span className="hl-metadata-val">{metaMatch[2] || ''}</span>
      </span>
    );
  }

  // 3. Block markers (:::norma, :::kazus, :::)
  const markerMatch = lineText.match(/^(:::[a-zA-Z0-9_-]*)(\s+.*)?$/);
  if (markerMatch) {
    return (
      <span className={`hl-block-marker ${hasWarning ? 'hl-error' : ''}`}>
        {lineText}
      </span>
    );
  }

  // 4. Tables (| ... |)
  if (lineText.trim().startsWith('|') && lineText.trim().endsWith('|')) {
    return (
      <span className={`hl-table ${hasWarning ? 'hl-error' : ''}`}>
        {lineText}
      </span>
    );
  }

  // 5. Matn va inline belgilar (bold **, italic *, mark ==, code `)
  const parts: React.ReactNode[] = [];
  const regex = /(\*\*.*?\*\*|==.*?==|`.*?`|\*.*?\*)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(lineText)) !== null) {
    if (match.index > lastIndex) {
      parts.push(lineText.slice(lastIndex, match.index));
    }
    const token = match[0];
    if (token.startsWith('**') && token.endsWith('**')) {
      parts.push(<strong key={match.index} className="hl-bold">{token}</strong>);
    } else if (token.startsWith('==') && token.endsWith('==')) {
      parts.push(<mark key={match.index} className="hl-mark">{token}</mark>);
    } else if (token.startsWith('`') && token.endsWith('`')) {
      parts.push(<code key={match.index} className="hl-code">{token}</code>);
    } else if (token.startsWith('*') && token.endsWith('*')) {
      parts.push(<em key={match.index} className="hl-italic">{token}</em>);
    } else {
      parts.push(token);
    }
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < lineText.length) {
    parts.push(lineText.slice(lastIndex));
  }

  const content = parts.length > 0 ? parts : lineText;
  return <span className={hasWarning ? 'hl-error' : 'hl-body'}>{content}</span>;
};

interface GutterLineProps {
  lineNum: number;
  isActive: boolean;
  isJumped?: boolean;
  height?: number;
}
const GutterLine: React.FC<GutterLineProps> = React.memo(
  ({ lineNum, isActive, isJumped, height }) => (
    <div
      className={`editor-gutter-line ${isActive ? 'active' : ''} ${isJumped ? 'jump-flash' : ''}`}
      style={height ? { height: `${height}px` } : undefined}
    >
      <span className="editor-gutter-num">{lineNum}</span>
    </div>
  ),
  (prev, next) =>
    prev.lineNum === next.lineNum &&
    prev.isActive === next.isActive &&
    prev.isJumped === next.isJumped &&
    prev.height === next.height
);

interface BackdropLineProps {
  line: string;
  isActive: boolean;
  isJumped?: boolean;
  hasWarning: boolean;
}
const BackdropLine: React.FC<BackdropLineProps> = React.memo(
  ({ line, isActive, isJumped, hasWarning }) => (
    <div
      className={`editor-backdrop-line ${isActive ? 'active' : ''} ${isJumped ? 'jump-flash' : ''}`}
    >
      {renderLineContent(line, hasWarning)}
    </div>
  ),
  (prev, next) =>
    prev.line === next.line &&
    prev.isActive === next.isActive &&
    prev.isJumped === next.isJumped &&
    prev.hasWarning === next.hasWarning
);

export const MdEditor: React.FC<Props> = ({
  value,
  onChange,
  warnings,
  onLoadSample,
  onSelectSample,
  onCopyAiGuide,
  document: legalDoc,
  onOpenGuide,
  onUndoCanvas,
  onOpenSearch
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  const blockMenuRef = useRef<HTMLDivElement>(null);
  const overflowRef = useRef<HTMLDivElement>(null);
  const selectionRangeRef = useRef<{ start: number; end: number } | null>(null);

  const [showAdvancedJson, setShowAdvancedJson] = useState(false);
  const [showCheatSheet, setShowCheatSheet] = useState(false);
  const [cheatSearchQuery, setCheatSearchQuery] = useState('');
  const [copiedSnippetId, setCopiedSnippetId] = useState<string | null>(null);
  const [fullCopied, setFullCopied] = useState(false);
  const [jsonInputText, setJsonInputText] = useState('');
  const [jsonImportError, setJsonImportError] = useState<string | null>(null);
  const [isWordWrap, setIsWordWrap] = useState<boolean>(true);

  // Popover va modallar holatlari
  const [isBlockPickerOpen, setIsBlockPickerOpen] = useState(false);
  const [toolbarSearchQuery, setToolbarSearchQuery] = useState('');
  const [toolbarSelectedIndex, setToolbarSelectedIndex] = useState(0);

  const [isOverflowOpen, setIsOverflowOpen] = useState(false);
  const [isSamplePickerOpen, setIsSamplePickerOpen] = useState(false);
  const [isSmartIngestOpen, setIsSmartIngestOpen] = useState(false);
  const [smartIngestInitialText, setSmartIngestInitialText] = useState('');

  // Modallarni bir-birini to'smasdan ochish (Mutual modal exclusivity)
  const openCheatSheetModal = () => {
    setShowCheatSheet(true);
    setShowAdvancedJson(false);
    setIsSamplePickerOpen(false);
    setIsBlockPickerOpen(false);
    setIsOverflowOpen(false);
    setIsSlashMenuOpen(false);
    setIsSmartIngestOpen(false);
  };

  const openSamplePickerModal = () => {
    setIsSamplePickerOpen(true);
    setShowCheatSheet(false);
    setShowAdvancedJson(false);
    setIsBlockPickerOpen(false);
    setIsOverflowOpen(false);
    setIsSlashMenuOpen(false);
    setIsSmartIngestOpen(false);
  };

  const openAdvancedJsonModal = () => {
    setShowAdvancedJson(true);
    setShowCheatSheet(false);
    setIsSamplePickerOpen(false);
    setIsBlockPickerOpen(false);
    setIsOverflowOpen(false);
    setIsSlashMenuOpen(false);
    setIsSmartIngestOpen(false);
  };

  const openSmartIngestModal = () => {
    let sel = '';
    if (textareaRef.current) {
      const start = textareaRef.current.selectionStart;
      const end = textareaRef.current.selectionEnd;
      if (start !== end) {
        sel = textareaRef.current.value.slice(start, end);
      }
    }
    setSmartIngestInitialText(sel);
    setIsSmartIngestOpen(true);
    setShowCheatSheet(false);
    setShowAdvancedJson(false);
    setIsSamplePickerOpen(false);
    setIsBlockPickerOpen(false);
    setIsOverflowOpen(false);
    setIsSlashMenuOpen(false);
  };

  const handleApplySmartIngest = (convertedMd: string, mode: 'replace' | 'append') => {
    if (mode === 'append') {
      onChange(value.trim() ? `${value.trim()}\n\n${convertedMd}` : convertedMd);
    } else {
      onChange(convertedMd);
    }
  };

  // Esc klavishasi bosilganda barcha ochiq modal va popoverlarni yopish
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsBlockPickerOpen(false);
        setIsOverflowOpen(false);
        setIsSlashMenuOpen(false);
        setIsSamplePickerOpen(false);
        setIsSmartIngestOpen(false);
        setShowCheatSheet(false);
        setShowAdvancedJson(false);
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  const filteredCheatSheetItems = useMemo(() => {
    const q = cheatSearchQuery.trim().toLowerCase();
    if (!q) return CHEAT_SHEET_ITEMS;
    return CHEAT_SHEET_ITEMS.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        item.badge.toLowerCase().includes(q) ||
        item.snippet.toLowerCase().includes(q)
    );
  }, [cheatSearchQuery]);

  // Slash buyruqlar suzuvchi menyusi ("/" bo'sh qatorda yozilganda)
  const [isSlashMenuOpen, setIsSlashMenuOpen] = useState(false);
  const [slashQuery, setSlashQuery] = useState('');
  const [slashSelectedIndex, setSlashSelectedIndex] = useState(0);
  const [slashPosition, setSlashPosition] = useState<{ top: number; left: number }>({ top: 40, left: 24 });

  // Faol qator va ustun holati
  const [activeLineIndex, setActiveLineIndex] = useState<number>(0);
  const [cursorCol, setCursorCol] = useState<number>(1);
  const [jumpHighlightLine, setJumpHighlightLine] = useState<number | null>(null);
  const jumpHighlightTimerRef = useRef<any>(null);

  // Qator balandliklari (faqat o'ralgan qatorlar uchun)
  const [lineHeights, setLineHeights] = useState<number[]>([]);
  const singleLineHeightRef = useRef<number>(23.1);
  const charWidthRef = useRef<number>(8.4);
  const lastDispatchedLineRef = useRef<number>(-1);

  // Muharrir masshtabi (Zoom: 75% dan 200% gacha, Ctrl+G'ildirak yoki tugmalar bilan)
  const [editorZoom, setEditorZoom] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('yurist_editor_zoom');
      const val = saved ? parseFloat(saved) : 1.0;
      if (!isNaN(val) && val >= 0.75 && val <= 2.0) return val;
    }
    return 1.0;
  });

  // Qatorlar ro'yxati
  const lines = useMemo(() => {
    return (value || '').split('\n');
  }, [value]);

  // Ogohlantirishlar mavjud qatorlar
  const warningLineSet = useMemo(() => {
    const set = new Set<number>();
    for (const w of warnings) {
      if (w.line) set.add(w.line);
    }
    return set;
  }, [warnings]);

  // Statistik ma'lumotlar (yozish kechikishini bloklamaslik uchun 300ms debounced)
  const [debouncedValForStats, setDebouncedValForStats] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebouncedValForStats(value), 300);
    return () => clearTimeout(t);
  }, [value]);

  const stats = useMemo(() => {
    const text = debouncedValForStats || '';
    const linesCount = (text.match(/\n/g) || []).length + 1;
    const charCount = text.length;
    let words = 0;
    let inWord = false;
    for (let i = 0; i < text.length; i++) {
      if (text.charCodeAt(i) > 32) {
        if (!inWord) {
          words++;
          inWord = true;
        }
      } else {
        inWord = false;
      }
    }
    return { linesCount, charCount, words };
  }, [debouncedValForStats]);

  // Filtrlangan slash buyruqlar
  const filteredSlashCommands = useMemo(() => {
    return filterSlashCommands(slashQuery);
  }, [slashQuery]);

  const filteredToolbarCommands = useMemo(() => {
    return filterSlashCommands(toolbarSearchQuery);
  }, [toolbarSearchQuery]);

  // Kursor pozitsiyasini aniqlash (Zero-lag, optimallashtirilgan)
  const updateCursorPos = (val?: string, cursorIndex?: number) => {
    if (!textareaRef.current) return;
    const pos = cursorIndex !== undefined ? cursorIndex : (textareaRef.current.selectionStart || 0);
    const currentVal = val !== undefined ? val : (value || '');
    const textBefore = currentVal.slice(0, pos);
    const lineIdx = (textBefore.match(/\n/g) || []).length;
    const lastNl = textBefore.lastIndexOf('\n');
    const col = pos - lastNl;

    setActiveLineIndex((prev) => (prev !== lineIdx ? lineIdx : prev));
    setCursorCol(col);

    // V-E: Faqat qator o'zgargandagina preview bilan sinxronlash
    if (lastDispatchedLineRef.current !== lineIdx + 1) {
      lastDispatchedLineRef.current = lineIdx + 1;
      window.dispatchEvent(new CustomEvent('yurist:editor-cursor-line', { detail: { line: lineIdx + 1 } }));
    }
  };

  // Slash buyruq triggerini tekshirish ("/" bo'sh qatorda yozilganda ochish)
  const checkSlashTrigger = (text: string, cursorPos: number) => {
    const textBefore = text.slice(0, cursorPos);
    const lineStartPos = textBefore.lastIndexOf('\n') + 1;
    const lineTextBeforeCursor = textBefore.slice(lineStartPos);

    // Qator faqat bo'sh joylar va "/" dan iborat bo'lsa
    const trimmed = lineTextBeforeCursor.trimStart();
    if (trimmed.startsWith('/')) {
      const query = trimmed.slice(1);
      setSlashQuery(query);
      setSlashSelectedIndex(0);
      setIsSlashMenuOpen(true);

      const lineIdx = (textBefore.match(/\n/g) || []).length;
      const singleH = singleLineHeightRef.current || 23.1;
      let topPx = 16;
      if (lineHeights.length > 0 && lineIdx < lineHeights.length) {
        for (let i = 0; i <= lineIdx; i++) {
          topPx += lineHeights[i] > 0 ? lineHeights[i] : singleH;
        }
      } else {
        topPx = 16 + (lineIdx + 1) * singleH;
      }
      const scrollTop = textareaRef.current?.scrollTop || 0;
      const computedTop = Math.max(16, topPx - scrollTop);

      setSlashPosition({
        top: computedTop,
        left: 24
      });
    } else {
      setIsSlashMenuOpen(false);
    }
  };

  // Kursor sakrashining oldini olish: Har bir kiritish/o'chirishda kursor o'rnini saqlaymiz
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newVal = e.target.value;
    const newPos = e.target.selectionStart;

    selectionRangeRef.current = {
      start: newPos,
      end: e.target.selectionEnd
    };
    onChange(newVal);
    updateCursorPos(newVal, newPos);
    checkSlashTrigger(newVal, newPos);
  };

  // React re-render qilgach, kursor o'rnini darhol o'sha yerga tiklaymiz
  useLayoutEffect(() => {
    if (selectionRangeRef.current !== null && textareaRef.current) {
      const { start, end } = selectionRangeRef.current;
      textareaRef.current.setSelectionRange(start, end);
      selectionRangeRef.current = null;
    }
  }, [value]);

  // Popover tashqarisiga bosilganda yopish
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (blockMenuRef.current && !blockMenuRef.current.contains(target)) {
        setIsBlockPickerOpen(false);
      }
      if (overflowRef.current && !overflowRef.current.contains(target)) {
        setIsOverflowOpen(false);
      }
    };

    window.addEventListener('mousedown', handleClickOutside);
    return () => window.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Manba qatoriga sakrash (Kanvasdagi floating paneldan "Manbaga o'tish" bosilganda)
  useEffect(() => {
    const handleJump = (e: Event) => {
      const customEvent = e as CustomEvent<{ line: number }>;
      const targetLine = customEvent.detail?.line;
      if (!targetLine || !textareaRef.current) return;

      const textarea = textareaRef.current;
      let charIndex = 0;
      for (let i = 0; i < Math.min(targetLine - 1, lines.length); i++) {
        charIndex += lines[i].length + 1; // +1 for \n
      }

      // Xavfsiz: butun qatorni belgilab (select) qo'ymaslik — kursor qator boshida turadi
      textarea.focus();
      textarea.setSelectionRange(charIndex, charIndex);
      updateCursorPos();

      // Qatorning aniq piksel ofsetini hisoblash (word-wrap va ko'p qatorli bloklar bilan)
      const gutterEl = lineNumbersRef.current?.children[targetLine - 1] as HTMLElement | undefined;
      let lineTop = 0;
      if (gutterEl && gutterEl.offsetTop > 0) {
        lineTop = gutterEl.offsetTop;
      } else {
        let acc = 16;
        for (let i = 0; i < targetLine - 1 && i < lineHeights.length; i++) {
          acc += lineHeights[i] || 23.1;
        }
        lineTop = acc;
      }

      // Muharrir ko'rish maydoni markaziga silliq siljitish (center)
      const centeredTop = Math.max(0, lineTop - Math.floor(textarea.clientHeight / 2) + 12);
      try {
        textarea.scrollTo({ top: centeredTop, behavior: 'smooth' });
      } catch {
        textarea.scrollTop = centeredTop;
      }

      if (lineNumbersRef.current) {
        lineNumbersRef.current.scrollTop = centeredTop;
      }
      if (backdropRef.current) {
        backdropRef.current.scrollTop = centeredTop;
      }

      // Vizual chaqnash / animatsiya ko'rsatish
      setJumpHighlightLine(targetLine);
      if (jumpHighlightTimerRef.current) clearTimeout(jumpHighlightTimerRef.current);
      jumpHighlightTimerRef.current = setTimeout(() => {
        setJumpHighlightLine(null);
      }, 1800);
    };

    window.addEventListener('yurist:jump-to-source-line', handleJump);
    return () => {
      window.removeEventListener('yurist:jump-to-source-line', handleJump);
      if (jumpHighlightTimerRef.current) clearTimeout(jumpHighlightTimerRef.current);
    };
  }, [value, lines, lineHeights]);

  // Slash buyruq shablonini kiritish va placeholder matnini tanlash
  const handleInsertSlashCommand = (cmd: SlashCommandItem) => {
    setIsSlashMenuOpen(false);
    setIsBlockPickerOpen(false);
    const textarea = textareaRef.current;
    if (!textarea) return;

    const pos = textarea.selectionStart;
    const fullVal = textarea.value;
    const textBefore = fullVal.slice(0, pos);
    const textAfter = fullVal.slice(pos);
    const lineStartPos = textBefore.lastIndexOf('\n') + 1;

    // Qator boshidagi "/" va qidiruv so'zini tozalaymiz
    const prefixBeforeLine = fullVal.slice(0, lineStartPos);
    const needsLeadingNewline = prefixBeforeLine.length > 0 && !prefixBeforeLine.endsWith('\n');

    const insertText = (needsLeadingNewline ? '\n' : '') + cmd.template;
    const newVal = prefixBeforeLine + insertText + textAfter;

    // Placeholder matnini tanlash (selected for instant overwriting)
    const placeholderIdx = insertText.indexOf(cmd.placeholder);
    let selStart: number;
    let selEnd: number;

    if (placeholderIdx !== -1) {
      selStart = prefixBeforeLine.length + placeholderIdx;
      selEnd = selStart + cmd.placeholder.length;
    } else {
      selStart = prefixBeforeLine.length + insertText.length;
      selEnd = selStart;
    }

    selectionRangeRef.current = { start: selStart, end: selEnd };
    onChange(newVal);

    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(selStart, selEnd);
        updateCursorPos();
      }
    }, 20);
  };

  // Matnni formatlash funksiyasi (Qalin **, Kursiv *, Sariq mark ==, Kod `)
  const handleFormatEditorText = (marker: '**' | '*' | '==' | '`') => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const val = textarea.value;
    const selected = val.substring(start, end);

    let newVal: string;
    let newStart: number;
    let newEnd: number;

    const mLen = marker.length;
    if (selected.startsWith(marker) && selected.endsWith(marker) && selected.length >= mLen * 2) {
      const unwrapped = selected.slice(mLen, -mLen);
      newVal = val.substring(0, start) + unwrapped + val.substring(end);
      newStart = start;
      newEnd = start + unwrapped.length;
    } else if (
      start >= mLen &&
      val.substring(start - mLen, start) === marker &&
      end + mLen <= val.length &&
      val.substring(end, end + mLen) === marker
    ) {
      newVal = val.substring(0, start - mLen) + selected + val.substring(end + mLen);
      newStart = start - mLen;
      newEnd = end - mLen;
    } else {
      newVal = val.substring(0, start) + marker + selected + marker + val.substring(end);
      if (selected.length > 0) {
        newStart = start;
        newEnd = end + mLen * 2;
      } else {
        newStart = start + mLen;
        newEnd = start + mLen;
      }
    }

    selectionRangeRef.current = { start: newStart, end: newEnd };
    onChange(newVal);

    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(newStart, newEnd);
        updateCursorPos();
      }
    }, 10);
  };

  // Klaviatura hodisalarini boshqarish (Tab, Arrows, Enter, Escape, Ctrl+Z)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // 1. Agar Slash menyusi ochiq bo'lsa
    if (isSlashMenuOpen && filteredSlashCommands.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSlashSelectedIndex((prev) => (prev + 1) % filteredSlashCommands.length);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSlashSelectedIndex((prev) => (prev - 1 + filteredSlashCommands.length) % filteredSlashCommands.length);
        return;
      }
      if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        const targetCmd = filteredSlashCommands[slashSelectedIndex];
        if (targetCmd) {
          handleInsertSlashCommand(targetCmd);
        }
        return;
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        setIsSlashMenuOpen(false);
        return;
      }
    }

    if (e.key === 'Tab') {
      e.preventDefault();
      const textarea = textareaRef.current;
      if (!textarea) return;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const val = textarea.value;
      const newVal = val.substring(0, start) + '  ' + val.substring(end);
      selectionRangeRef.current = { start: start + 2, end: start + 2 };
      onChange(newVal);
    } else if ((e.ctrlKey || e.metaKey) && !e.shiftKey && !e.altKey && e.key.toLowerCase() === 'b') {
      e.preventDefault();
      handleFormatEditorText('**');
      return;
    } else if ((e.ctrlKey || e.metaKey) && !e.shiftKey && !e.altKey && e.key.toLowerCase() === 'i') {
      e.preventDefault();
      handleFormatEditorText('*');
      return;
    } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && !e.shiftKey) {
      if (onUndoCanvas) {
        const handled = onUndoCanvas();
        if (handled) {
          e.preventDefault();
        }
      }
    } else if (e.key === 'Escape') {
      setIsBlockPickerOpen(false);
      setIsOverflowOpen(false);
      setIsSlashMenuOpen(false);
      setIsSamplePickerOpen(false);
      setShowCheatSheet(false);
      setShowAdvancedJson(false);
    }
  };

  // Qator balandliklarini hisoblash (Word-wrap yoqilganda qator raqamlari aniq mos tushishi uchun)
  const remeasureLineHeights = () => {
    if (!textareaRef.current) return;
    const textarea = textareaRef.current;

    const style = window.getComputedStyle(textarea);
    const computedH = parseFloat(style.lineHeight) || (14 * 1.65 * editorZoom);
    singleLineHeightRef.current = computedH;

    if (!isWordWrap) {
      setLineHeights([]);
      return;
    }

    const padLeft = parseFloat(style.paddingLeft) || 20;
    const padRight = parseFloat(style.paddingRight) || 20;
    const contentWidth = Math.max(100, textarea.clientWidth - padLeft - padRight);

    // Monospace shriftda 1 ta belgining o'rtacha kengligi: fontSize * ~0.603
    const fontSize = parseFloat(style.fontSize) || (14 * editorZoom);
    const approxCharWidth = fontSize * 0.603;
    charWidthRef.current = approxCharWidth;

    const charsPerLine = Math.max(15, Math.floor(contentWidth / approxCharWidth));

    const heights = new Array<number>(lines.length);
    let hasAnyWrapped = false;

    for (let i = 0; i < lines.length; i++) {
      const lineLen = lines[i]?.length || 0;
      if (lineLen <= charsPerLine) {
        heights[i] = 0;
      } else {
        hasAnyWrapped = true;
        const rows = Math.max(1, Math.ceil(lineLen / charsPerLine));
        heights[i] = rows * computedH;
      }
    }

    if (!hasAnyWrapped) {
      setLineHeights([]);
    } else {
      setLineHeights(heights);
    }
  };

  const measureTimerRef = useRef<any>(null);

  // Matn yoki wrap o'zgarganda qayta hisoblash (yozish paytida 250ms debounce bilan)
  useEffect(() => {
    if (!isWordWrap) return;
    if (measureTimerRef.current) clearTimeout(measureTimerRef.current);
    measureTimerRef.current = setTimeout(() => {
      remeasureLineHeights();
    }, 250);
    return () => {
      if (measureTimerRef.current) clearTimeout(measureTimerRef.current);
    };
  }, [value, isWordWrap]);

  // Dastlabki yuklanishda yoki wrap rejimiga o'tganda darhol o'lchash
  useLayoutEffect(() => {
    if (isWordWrap) {
      remeasureLineHeights();
    }
  }, [isWordWrap]);

  useEffect(() => {
    if (!textareaRef.current) return;
    const ro = new ResizeObserver(() => {
      remeasureLineHeights();
    });
    ro.observe(textareaRef.current);
    return () => ro.disconnect();
  }, [isWordWrap]);

  // Sichqoncha g'ildiragi bilan Zoom (Ctrl + Wheel)
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;

    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const delta = e.deltaY < 0 ? 0.05 : -0.05;
        setEditorZoom((prev) => {
          const next = Math.min(2.0, Math.max(0.75, Math.round((prev + delta) * 100) / 100));
          localStorage.setItem('yurist_editor_zoom', String(next));
          return next;
        });
      }
    };

    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, []);

  useEffect(() => {
    if (isWordWrap) {
      remeasureLineHeights();
    }
  }, [editorZoom]);

  const handleScroll = () => {
    if (textareaRef.current) {
      const top = textareaRef.current.scrollTop;
      const left = textareaRef.current.scrollLeft;
      if (lineNumbersRef.current) {
        lineNumbersRef.current.scrollTop = top;
      }
      if (backdropRef.current) {
        backdropRef.current.scrollTop = top;
        backdropRef.current.scrollLeft = left;
      }
    }
  };


  // Foydalanuvchi JSON matnini tashlaganligini aniqlash
  const isPastedJson = useMemo(() => {
    const trimmed = (value || '').trim();
    return trimmed.startsWith('{') && trimmed.endsWith('}');
  }, [value]);

  // JSON ni MD+ ga avtomatik o'girish
  const handleConvertPastedJson = () => {
    try {
      const res = validateLegalDocumentJson(value);
      if (res.document) {
        const mdText = serializeToMarkdownPlus(res.document);
        onChange(mdText);
      } else {
        alert('JSON tuzilishi yaroqsiz: ' + (res.issues[0]?.message || 'Xatolik'));
      }
    } catch (e: any) {
      alert('JSON tahlilida xatolik: ' + e.message);
    }
  };

  // Ilg'or rejim: JSON import qilish
  const handleImportJson = () => {
    try {
      const res = validateLegalDocumentJson(jsonInputText);
      if (res.document) {
        const mdText = serializeToMarkdownPlus(res.document);
        onChange(mdText);
        setShowAdvancedJson(false);
        setJsonInputText('');
        setJsonImportError(null);
      } else {
        setJsonImportError(res.issues[0]?.message || 'JSON formati yaroqsiz');
      }
    } catch (e: any) {
      setJsonImportError('JSON sintaksis xatosi: ' + e.message);
    }
  };

  // Ilg'or rejim: JSON eksport qilish
  const handleExportJson = () => {
    if (!legalDoc) return;
    const jsonStr = JSON.stringify(legalDoc, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = window.document.createElement('a');
    a.href = url;
    a.download = `${legalDoc.id || 'hujjat'}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };



  return (
    <div className="editor-pane">
      {/* 5. Toolbar: faqat "Blok qo'shish", "Namuna", "Qidirish", "Qo'llanma" + "..." overflow */}
      <div className="editor-toolbar">
        <div className="editor-toolbar-title">
          <FileText size={15} className="editor-title-icon" />
          <span className="editor-title-text">Muharrir</span>
          <span className="editor-badge-pill">MD+</span>
        </div>

        <div className="editor-actions">
          {/* 1. Blok qo'shish */}
          <div className="editor-btn-wrapper" ref={blockMenuRef}>
            <button
              type="button"
              className={`editor-ghost-btn ${isBlockPickerOpen ? 'active' : ''}`}
              onClick={() => {
                setIsBlockPickerOpen(!isBlockPickerOpen);
                setIsOverflowOpen(false);
                setIsSlashMenuOpen(false);
              }}
              title="MD+ bloklarini qo‘shish (Norma, Kazus, Jadval, Fleshkard...)"
              aria-label="Blok qo‘shish"
              aria-expanded={isBlockPickerOpen}
            >
              <Plus size={14} />
              <span className="editor-btn-label-full">Blok qo‘shish</span>
              <span className="editor-btn-label-short">Blok</span>
            </button>

            {isBlockPickerOpen && (
              <SlashCommandMenu
                isOpen={isBlockPickerOpen}
                onClose={() => setIsBlockPickerOpen(false)}
                commands={filteredToolbarCommands}
                selectedIndex={toolbarSelectedIndex}
                onSelectIndex={setToolbarSelectedIndex}
                onSelectCommand={handleInsertSlashCommand}
                showSearchBar={true}
                searchQuery={toolbarSearchQuery}
                onSearchChange={(q) => {
                  setToolbarSearchQuery(q);
                  setToolbarSelectedIndex(0);
                }}
              />
            )}
          </div>

          {/* 2. Namuna */}
          <button
            type="button"
            className="editor-ghost-btn editor-btn-sample"
            onClick={openSamplePickerModal}
            title="Namunaviy yuridik konspektni tanlash va yuklash"
            aria-label="Namunaviy konspektni yuklash"
          >
            <FolderOpen size={14} />
            <span>Namuna</span>
          </button>

          {/* 2.5. Aqlli Formatlash (Smart Ingestion) */}
          <button
            type="button"
            className="editor-ghost-btn smart-ingest-btn"
            onClick={openSmartIngestModal}
            title="Oddiy matn yoki qonunni avtomatik konspektga aylantirish"
            aria-label="Aqlli formatlash"
          >
            <Sparkles size={14} className="text-amber-500" />
            <span className="editor-btn-label-full">Aqlli formatlash</span>
            <span className="editor-btn-label-short">AI</span>
          </button>

          {/* 3. Qidirish */}
          <button
            type="button"
            className="editor-ghost-btn editor-btn-search"
            onClick={() => {
              if (onOpenSearch) onOpenSearch();
            }}
            title="Qidiruv va buyruqlar paneli (Ctrl+K)"
            aria-label="Qidirish va buyruqlar"
          >
            <Search size={14} />
            <span className="editor-btn-label-full">Qidirish</span>
          </button>

          {/* 4. Formatlash tugmalari: Qalin (Bold) va Kursiv (Italic) */}
          <div className="editor-format-group">
            <button
              type="button"
              className="editor-ghost-btn editor-format-btn"
              onClick={() => handleFormatEditorText('**')}
              title="Qalin matn (**matn**) — Ctrl+B"
              aria-label="Qalin matn"
            >
              <Bold size={14} />
            </button>
            <button
              type="button"
              className="editor-ghost-btn editor-format-btn"
              onClick={() => handleFormatEditorText('*')}
              title="Kursiv matn (*matn*) — Ctrl+I"
              aria-label="Kursiv matn"
            >
              <Italic size={14} />
            </button>
          </div>


          {/* 5. Overflow "..." */}
          <div className="editor-btn-wrapper" ref={overflowRef}>
            <button
              type="button"
              className={`editor-ghost-btn editor-overflow-btn ${isOverflowOpen ? 'active' : ''}`}
              onClick={() => {
                setIsOverflowOpen(!isOverflowOpen);
                setIsBlockPickerOpen(false);
              }}
              title="Qo‘shimcha parametrlar va vositalar"
              aria-label="Qo‘shimcha amallar"
              aria-expanded={isOverflowOpen}
            >
              <MoreHorizontal size={16} />
            </button>

            {isOverflowOpen && (
              <div className="editor-dropdown-popover overflow-popover" role="menu">
                <button
                  type="button"
                  className="editor-dropdown-item"
                  onClick={() => {
                    setIsWordWrap(!isWordWrap);
                    setIsOverflowOpen(false);
                  }}
                  role="menuitem"
                >
                  <WrapText size={15} />
                  <span>Matnni o‘rash: {isWordWrap ? 'Yoqilgan' : 'O‘chirilgan'}</span>
                </button>

                <button
                  type="button"
                  className="editor-dropdown-item"
                  onClick={() => {
                    openSmartIngestModal();
                    setIsOverflowOpen(false);
                  }}
                  role="menuitem"
                >
                  <Sparkles size={15} />
                  <span>Aqlli formatlash / Matndan konspekt</span>
                </button>

                <button
                  type="button"
                  className="editor-dropdown-item"
                  onClick={() => {
                    onCopyAiGuide();
                    setIsOverflowOpen(false);
                  }}
                  role="menuitem"
                >
                  <Copy size={15} />
                  <span>AI uchun ko‘rsatmani nusxalash</span>
                </button>

                <button
                  type="button"
                  className="editor-dropdown-item"
                  onClick={openCheatSheetModal}
                  role="menuitem"
                >
                  <HelpCircle size={15} />
                  <span>MD+ qisqa ma’lumotnomasi</span>
                </button>

                <button
                  type="button"
                  className="editor-dropdown-item"
                  onClick={openAdvancedJsonModal}
                  role="menuitem"
                >
                  <Code2 size={15} />
                  <span>JSON boshqaruvi (Ilg‘or)</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* JSON aniqlanganda taklif banneri */}
      {isPastedJson && (
        <div className="editor-json-banner">
          <div className="editor-json-banner-text">
            💡 Siz JSON formatidagi matn kiritdingiz. Uni qulay <strong>MD+</strong> formatiga o‘giramizmi?
          </div>
          <button
            type="button"
            onClick={handleConvertPastedJson}
            className="editor-ghost-btn"
            style={{ background: 'var(--warning)', color: 'var(--on-accent)', fontWeight: 600 }}
          >
            MD+ ga aylantirish <ArrowRight size={13} />
          </button>
        </div>
      )}

      {/* 1, 2, 3. Muharrir maydoni: Gutter, Backdrop va Textarea */}
      <div
        className="editor-textarea-wrapper"
        style={{
          ['--editor-font-size' as any]: `${Math.round(14 * editorZoom)}px`,
          ['--editor-line-height' as any]: '1.65'
        }}
      >
        {/* Qator raqamlari (Gutter) — Word wrap bilan to'liq mos */}
        <div ref={lineNumbersRef} className="editor-line-numbers" aria-hidden="true">
          {lines.map((_, i) => (
            <GutterLine
              key={i}
              lineNum={i + 1}
              isActive={activeLineIndex === i}
              isJumped={jumpHighlightLine === i + 1}
              height={lineHeights[i] > 0 ? lineHeights[i] : undefined}
            />
          ))}
        </div>

        {/* Kontent maydoni: Backdrop va Textarea */}
        <div className="editor-content-area">
          {/* Orqa fon sintaksis qatlami */}
          <div ref={backdropRef} className="editor-backdrop" aria-hidden="true">
            <div className={`editor-highlight-layer ${isWordWrap ? '' : 'nowrap'}`}>
              {lines.map((line, i) => (
                <BackdropLine
                  key={i}
                  line={line}
                  isActive={activeLineIndex === i}
                  isJumped={jumpHighlightLine === i + 1}
                  hasWarning={warningLineSet.has(i + 1)}
                />
              ))}
            </div>
          </div>

          {/* Asosiy tahrirlash maydoni */}
          <textarea
            ref={textareaRef}
            className={`editor-textarea ${isWordWrap ? '' : 'nowrap'}`}
            value={value}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onKeyUp={() => updateCursorPos()}
            onClick={() => updateCursorPos()}
            onSelect={() => updateCursorPos()}
            onScroll={handleScroll}
            spellCheck={false}
            placeholder="# Hujjat sarlavhasi&#10;muallif: Ism Familiya&#10;mavzu: classic&#10;&#10;## 1-bo'lim nomi&#10;Oddiy matn xatboshisi..."
          />

          {/* Suzuvchi Slash Menyusi ("/" bo'sh qatorda yozilganda) */}
          {isSlashMenuOpen && (
            <SlashCommandMenu
              isOpen={isSlashMenuOpen}
              onClose={() => setIsSlashMenuOpen(false)}
              commands={filteredSlashCommands}
              selectedIndex={slashSelectedIndex}
              onSelectIndex={setSlashSelectedIndex}
              onSelectCommand={handleInsertSlashCommand}
              position={slashPosition}
              showSearchBar={false}
            />
          )}
        </div>
      </div>

      {/* 4. Status bar: validatsiya holati, qator/belgi/so'z — ixcham, samimiy */}
      <div className="editor-status-bar">
        <div className="editor-status-left">
          {warnings.length === 0 ? (
            <div className="status-val-ok">
              <CheckCircle2 size={13} />
              <span className="status-val-ok-text">MD+ formati to‘g‘ri</span>
            </div>
          ) : (
            <button
              type="button"
              className="status-val-warn"
              onClick={() => {
                const targetLine = warnings[0]?.line;
                if (targetLine) {
                  window.dispatchEvent(
                    new CustomEvent('yurist:jump-to-source-line', { detail: { line: targetLine } })
                  );
                } else if (onOpenGuide) {
                  onOpenGuide();
                }
              }}
              title="Ogohlantirish qatoriga o‘tish"
            >
              <AlertTriangle size={13} />
              <span>{warnings.length} ta ogohlantirish</span>
            </button>
          )}
        </div>

        <div className="editor-status-right">
          {/* Zoom nazorati */}
          <div className="editor-zoom-group" title="Muharrir masshtabi: Ctrl + G‘ildirak">
            <button
              type="button"
              className="editor-zoom-btn"
              onClick={() => setEditorZoom((z) => Math.max(0.75, Math.round((z - 0.1) * 10) / 10))}
              title="Kichraytirish (Ctrl + G'ildirak)"
              aria-label="Kichraytirish"
            >
              <ZoomOut size={12} />
            </button>
            <span
              className="editor-zoom-label"
              onClick={() => setEditorZoom(1.0)}
              title="100% ga qaytarish"
            >
              {Math.round(editorZoom * 100)}%
            </span>
            <button
              type="button"
              className="editor-zoom-btn"
              onClick={() => setEditorZoom((z) => Math.min(2.0, Math.round((z + 0.1) * 10) / 10))}
              title="Kattalashtirish (Ctrl + G'ildirak)"
              aria-label="Kattalashtirish"
            >
              <ZoomIn size={12} />
            </button>
          </div>
          <span className="status-stat-sep status-stat-sep-zoom">•</span>
          <span className="status-stat-item status-stat-pos">
            <span className="status-stat-pos-full">Qator {activeLineIndex + 1}, Ustun {cursorCol}</span>
            <span className="status-stat-pos-short">Q{activeLineIndex + 1}:U{cursorCol}</span>
          </span>
          <span className="status-stat-sep">•</span>
          <span className="status-stat-item">{stats.linesCount} qator</span>
          <span className="status-stat-sep">•</span>
          <span className="status-stat-item">{stats.charCount} belgi</span>
          <span className="status-stat-sep">•</span>
          <span className="status-stat-item">{stats.words} so‘z</span>
        </div>
      </div>

      {/* Cheat Sheet Modal */}
      {showCheatSheet && typeof document !== 'undefined' && createPortal(
        <div className="editor-modal-overlay" onClick={() => setShowCheatSheet(false)}>
          <div
            className="editor-modal-card cheat-sheet-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="editor-modal-header">
              <div className="editor-modal-title">
                <BookOpen size={17} style={{ color: 'var(--accent)' }} />
                <span>MD+ Formati Bo‘yicha Qisqa Ma’lumotnoma</span>
              </div>
              <button
                type="button"
                className="editor-modal-close"
                onClick={() => setShowCheatSheet(false)}
                aria-label="Yopish"
              >
                <X size={18} />
              </button>
            </div>

            <div className="cheat-sheet-toolbar">
              <div className="cheat-sheet-search">
                <Search size={14} style={{ color: 'var(--ink-2)' }} />
                <input
                  type="text"
                  placeholder="Blok turi yoki kalit so‘zni izlang..."
                  value={cheatSearchQuery}
                  onChange={(e) => setCheatSearchQuery(e.target.value)}
                  autoFocus
                />
              </div>

              <button
                type="button"
                className="cheat-copy-all-btn"
                onClick={() => {
                  navigator.clipboard.writeText(generateCheatSheetText());
                  setFullCopied(true);
                  setTimeout(() => setFullCopied(false), 2000);
                }}
                title="Barcha namuna sintaksisini nusxalash"
              >
                {fullCopied ? <Check size={14} color="var(--success)" /> : <Copy size={14} />}
                <span>{fullCopied ? 'Barchasi nusxalandi!' : 'Barchasini nusxalash'}</span>
              </button>
            </div>

            <div className="cheat-sheet-body">
              {filteredCheatSheetItems.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 'var(--space-8) 0', color: 'var(--ink-2)', fontSize: 'var(--ui-font-size-13)' }}>
                  «{cheatSearchQuery}» bo‘yicha blok turi topilmadi
                </div>
              ) : (
                filteredCheatSheetItems.map((item) => {
                  const isCopied = copiedSnippetId === item.id;
                  return (
                    <div key={item.id} className="cheat-card">
                      <div className="cheat-card-head">
                        <div className="cheat-card-title-group">
                          <span className="cheat-card-badge">{item.badge}</span>
                          <h4 className="cheat-card-title">{item.title}</h4>
                        </div>
                        <button
                          type="button"
                          className={`cheat-card-copy-btn ${isCopied ? 'copied' : ''}`}
                          onClick={() => {
                            navigator.clipboard.writeText(item.snippet);
                            setCopiedSnippetId(item.id);
                            setTimeout(() => setCopiedSnippetId(null), 2000);
                          }}
                          title="Ushbu blok namunasini nusxalash"
                        >
                          {isCopied ? <Check size={13} /> : <Copy size={13} />}
                          <span>{isCopied ? 'Nusxalandi!' : 'Nusxa olish'}</span>
                        </button>
                      </div>
                      <pre className="cheat-code-block">{item.snippet}</pre>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Ilg'or rejim: JSON Import / Eksport Modali */}
      {showAdvancedJson && typeof document !== 'undefined' && createPortal(
        <div className="editor-modal-overlay" onClick={() => setShowAdvancedJson(false)}>
          <div
            className="editor-modal-card"
            style={{ maxWidth: '600px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="editor-modal-header">
              <div className="editor-modal-title">
                <Code2 size={17} style={{ color: 'var(--accent)' }} />
                <span>Ilg‘or Rejim: JSON Boshqaruvi</span>
              </div>
              <button
                type="button"
                className="editor-modal-close"
                onClick={() => setShowAdvancedJson(false)}
                aria-label="Yopish"
              >
                <X size={18} />
              </button>
            </div>

            <div className="editor-modal-body">
              <p style={{ fontSize: 'var(--ui-font-size-13)', color: 'var(--ink-2)', margin: '0 0 var(--space-3) 0', lineHeight: 1.5 }}>
                Dasturning asosiy ish muhiti MD+ matn formatiga asoslangan. Bu yerda siz mavjud JSON faylni import
                qilishingiz yoki joriy hujjatning JSON modelini yuklab olishingiz mumkin.
              </p>

              <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-4)' }}>
                <button
                  type="button"
                  onClick={handleExportJson}
                  className="editor-ghost-btn"
                  style={{
                    flex: 1,
                    height: '36px',
                    border: '1px solid var(--line)',
                    background: 'var(--surface-2)',
                    justifyContent: 'center'
                  }}
                >
                  <Download size={15} />
                  <span>Joriy hujjatni JSON yuklab olish</span>
                </button>
              </div>

              <div>
                <label style={{ fontSize: 'var(--ui-font-size-12)', fontWeight: 600, display: 'block', marginBottom: 'var(--space-1)' }}>
                  JSON kodini kiriting va import qiling:
                </label>
                <textarea
                  value={jsonInputText}
                  onChange={(e) => setJsonInputText(e.target.value)}
                  placeholder='{"version": "1.0", "title": "...", "sections": [...]}'
                  style={{
                    width: '100%',
                    height: '130px',
                    background: 'var(--surface-2)',
                    color: 'var(--ink)',
                    border: '1px solid var(--line)',
                    borderRadius: 'var(--radius-sm)',
                    padding: 'var(--space-2)',
                    fontFamily: 'var(--font-mono, monospace)',
                    fontSize: 'var(--ui-font-size-12)',
                    boxSizing: 'border-box'
                  }}
                />
                {jsonImportError && (
                  <div style={{ color: 'var(--danger)', fontSize: 'var(--ui-font-size-12)', marginTop: 'var(--space-1)' }}>
                    ⚠️ {jsonImportError}
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 'var(--space-2)' }}>
                  <button
                    type="button"
                    onClick={handleImportJson}
                    className="editor-ghost-btn"
                    style={{
                      background: 'var(--accent)',
                      color: 'var(--on-accent)',
                      height: '36px',
                      padding: '0 var(--space-4)',
                      fontWeight: 600
                    }}
                    disabled={!jsonInputText.trim()}
                  >
                    <Upload size={14} />
                    <span>MD+ formatiga o‘tkazib import qilish</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Namuna tanlash modali (Task 10: 5 ta namuna va saqlanmagan matnni himoyalash) */}
      <SamplePickerModal
        isOpen={isSamplePickerOpen}
        onClose={() => setIsSamplePickerOpen(false)}
        currentContent={value}
        onSelectSample={(sample, mode) => {
          if (onSelectSample) {
            onSelectSample(sample, mode);
          } else if (mode === 'new_doc' && onLoadSample) {
            onLoadSample();
          } else {
            onChange(sample.content);
          }
          setIsSamplePickerOpen(false);
        }}
      />

      {/* Aqlli formatlash / Matndan konspekt modali */}
      <SmartIngestionModal
        isOpen={isSmartIngestOpen}
        initialRawText={smartIngestInitialText}
        onClose={() => setIsSmartIngestOpen(false)}
        onApplyMdText={handleApplySmartIngest}
      />
    </div>
  );
};

// Orqaga moslik uchun re-export
export { MdEditor as JsonEditor };
