import React, { useMemo, useState, useEffect, useLayoutEffect, useRef, useCallback } from 'react';
import type { LegalDocument, ThemeName, Block, BlockStyleOverride, BlockStyleOverridesMap } from '../../schema/types';
import { paginateDocument, type StudyCard, type MeasuredHeights } from '../../services/paginator';
import { BlockRenderer } from '../blocks/BlockRenderer';
import { FormattedText, StylesProvider } from '../../utils/inlineMarkdown';
import { Scale, BookOpen, ChevronLeft, ChevronRight, Maximize2, X, MoreVertical, FileText, ZoomIn, ZoomOut, AlertTriangle, Layout, GraduationCap } from 'lucide-react';
import { getTokenValue } from '../../design/applyTokens';
import { CanvasFloatingToolbar } from './CanvasFloatingToolbar';
import { applyCanvasEditToSource, type CanvasEditType } from '../../services/canvasEditor';
import {
  type StyleColorToken,
  type StyleSizeStep,
  type StyleAnnotation,
  createTextQuoteAnchor,
  resolveStyleColor,
  resolveStyleSize
} from '../../schema/styleAnnotation';
import { BlockStylePopover } from './BlockStylePopover';
import { A4Document } from './A4Document';
import { ScreenReaderView } from './ScreenReaderView';
import { ExamTrainer } from '../exam/ExamTrainer';
import './canvasEditing.css';
import './blockStylePopover.css';
import './preview.css';

interface Props {
  document: LegalDocument;
  activeTheme?: ThemeName;
  forceShowAnswer?: boolean;
  isPrintHost?: boolean;
  rawMdText?: string;
  blockOverrides?: BlockStyleOverridesMap;
  styles?: StyleAnnotation[];
  onUpdateBlockOverride?: (blockId: string, override: BlockStyleOverride) => void;
  onResetBlockOverride?: (blockId: string) => void;
  onUpdateStyles?: (styles: StyleAnnotation[]) => void;
  onCanvasEdit?: (newMdText: string, isLive?: boolean) => void;
  onJumpToSourceLine?: (line: number) => void;
  onOpenAiIngestion?: () => void;
  printLayout?: 'a4' | 'cards';
  outputMode?: 'a4' | 'reader' | 'cards' | 'exam';
  onOutputModeChange?: (mode: 'a4' | 'reader' | 'cards' | 'exam') => void;
}

function getCaretCharacterOffsetWithin(element: HTMLElement): number {
  let caretOffset = 0;
  const doc = element.ownerDocument || document;
  const win = doc.defaultView || window;
  const sel = win.getSelection();
  if (sel && sel.rangeCount > 0) {
    const range = sel.getRangeAt(0);
    const preCaretRange = range.cloneRange();
    preCaretRange.selectNodeContents(element);
    preCaretRange.setEnd(range.endContainer, range.endOffset);
    caretOffset = preCaretRange.toString().length;
  }
  return caretOffset;
}

function setCaretCharacterOffsetWithin(element: HTMLElement, offset: number) {
  const doc = element.ownerDocument || document;
  const win = doc.defaultView || window;
  const sel = win.getSelection();
  if (!sel) return;

  let currentOffset = 0;
  let targetNode: Node | null = null;
  let targetOffset = 0;

  const walker = doc.createTreeWalker(element, NodeFilter.SHOW_TEXT);
  let node = walker.nextNode();
  while (node) {
    const len = node.nodeValue?.length || 0;
    if (currentOffset + len >= offset) {
      targetNode = node;
      targetOffset = offset - currentOffset;
      break;
    }
    currentOffset += len;
    node = walker.nextNode();
  }

  if (!targetNode) {
    let lastNode: Node | null = null;
    const walker2 = doc.createTreeWalker(element, NodeFilter.SHOW_TEXT);
    let n = walker2.nextNode();
    while (n) {
      lastNode = n;
      n = walker2.nextNode();
    }
    if (lastNode) {
      targetNode = lastNode;
      targetOffset = lastNode.nodeValue?.length || 0;
    } else {
      targetNode = element;
      targetOffset = 0;
    }
  }

  try {
    const range = doc.createRange();
    range.setStart(targetNode, targetOffset);
    range.collapse(true);
    sel.removeAllRanges();
    sel.addRange(range);
  } catch (err) {
    console.error('Failed to restore caret offset:', err);
  }
}

export const DocumentPreview: React.FC<Props> = React.memo(({
  document: doc,
  activeTheme,
  forceShowAnswer,
  isPrintHost,
  rawMdText,
  blockOverrides,
  styles,
  onUpdateBlockOverride,
  onResetBlockOverride,
  onUpdateStyles,
  onCanvasEdit,
  onJumpToSourceLine,
  onOpenAiIngestion,
  printLayout = 'a4',
  outputMode: propOutputMode,
  onOutputModeChange
}) => {
  const currentTheme = activeTheme || doc.theme || 'classic';
  const containerRef = useRef<HTMLDivElement>(null);
  const measurerRef = useRef<HTMLDivElement>(null);

  // Chiqish formati rejimi (A4 Hujjat / O'quvchi / Kartalar / Imtihon)
  const [internalOutputMode, setInternalOutputMode] = useState<'a4' | 'reader' | 'cards' | 'exam'>(() => {
    if (propOutputMode) return propOutputMode;
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const qMode = params.get('mode');
      if (qMode === 'cards' || qMode === 'reader' || qMode === 'a4' || qMode === 'exam') return qMode;
      const saved = typeof localStorage !== 'undefined' ? localStorage.getItem('yurist_preview_output_mode') : null;
      if (saved === 'reader' || saved === 'cards' || saved === 'a4' || saved === 'exam') return saved;
      if (window.innerWidth <= 768) {
        return 'cards';
      }
    }
    return 'cards';
  });

  const outputMode = propOutputMode || internalOutputMode;

  const setOutputMode = useCallback((mode: 'a4' | 'reader' | 'cards' | 'exam') => {
    setInternalOutputMode(mode);
    onOutputModeChange?.(mode);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('yurist_preview_output_mode', mode);
    }
  }, [onOutputModeChange]);

  // storage hodisasini kuzatish
  useEffect(() => {
    const handleStorageChange = () => {
      const saved = localStorage.getItem('yurist_preview_output_mode');
      if (saved === 'reader' || saved === 'cards' || saved === 'a4' || saved === 'exam') {
        setInternalOutputMode(saved);
        onOutputModeChange?.(saved);
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [onOutputModeChange]);

  // A4 masshtab sozlamalari (Fit width / Fit page / 100% / zoom +/-)
  const [a4ScaleMode, setA4ScaleMode] = useState<'fit-width' | 'fit-page' | '100%' | 'custom'>(() => {
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem('yurist_a4_scale_mode');
      if (saved === 'fit-page' || saved === '100%' || saved === 'custom') return saved;
    }
    return 'fit-width';
  });

  const [a4CustomZoom, setA4CustomZoom] = useState<number>(() => {
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem('yurist_a4_custom_zoom');
      const val = saved ? parseFloat(saved) : 1.0;
      if (!isNaN(val) && val >= 0.25 && val <= 2.5) return val;
    }
    return 1.0;
  });

  const [a4PageCount, setA4PageCount] = useState<number>(1);
  const a4ViewportRef = useRef<HTMLDivElement>(null);
  const [a4ViewportSize, setA4ViewportSize] = useState<{ width: number; height: number }>({ width: 800, height: 900 });

  useEffect(() => {
    const updateSize = () => {
      if (a4ViewportRef.current) {
        setA4ViewportSize({
          width: a4ViewportRef.current.clientWidth,
          height: a4ViewportRef.current.clientHeight
        });
      }
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, [outputMode]);

  const SHEET_WIDTH = 794;
  const SHEET_HEIGHT = 1123;

  const a4CalculatedScale = useMemo(() => {
    if (a4ScaleMode === '100%') return 1.0;
    if (a4ScaleMode === 'custom') return a4CustomZoom;

    const padX = a4ViewportSize.width <= 480 ? 24 : 48;
    const padY = 64;
    const availW = Math.max(100, a4ViewportSize.width - padX);
    const availH = Math.max(100, a4ViewportSize.height - padY);

    if (a4ScaleMode === 'fit-page') {
      const scaleW = availW / SHEET_WIDTH;
      const scaleH = availH / SHEET_HEIGHT;
      return Math.min(1.5, Math.max(0.2, Math.min(scaleW, scaleH)));
    }

    // Default: 'fit-width'
    return Math.min(1.5, Math.max(0.2, availW / SHEET_WIDTH));
  }, [a4ScaleMode, a4CustomZoom, a4ViewportSize]);

  const handleA4ZoomIn = () => {
    const next = Math.min(2.5, Math.round((a4CalculatedScale + 0.1) * 10) / 10);
    setA4ScaleMode('custom');
    setA4CustomZoom(next);
    localStorage.setItem('yurist_a4_scale_mode', 'custom');
    localStorage.setItem('yurist_a4_custom_zoom', String(next));
  };

  const handleA4ZoomOut = () => {
    const next = Math.max(0.25, Math.round((a4CalculatedScale - 0.1) * 10) / 10);
    setA4ScaleMode('custom');
    setA4CustomZoom(next);
    localStorage.setItem('yurist_a4_scale_mode', 'custom');
    localStorage.setItem('yurist_a4_custom_zoom', String(next));
  };

  const handleSetA4ScaleMode = (mode: 'fit-width' | 'fit-page' | '100%') => {
    setA4ScaleMode(mode);
    localStorage.setItem('yurist_a4_scale_mode', mode);
  };

  // Sichqoncha g'ildiragi bilan Zoom (Ctrl + Wheel)
  useEffect(() => {
    const el = a4ViewportRef.current;
    if (!el) return;

    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const delta = e.deltaY < 0 ? 0.08 : -0.08;
        setA4ScaleMode('custom');
        setA4CustomZoom((prev) => {
          const base = a4ScaleMode === 'custom' ? prev : a4CalculatedScale;
          const next = Math.min(2.5, Math.max(0.25, Math.round((base + delta) * 100) / 100));
          localStorage.setItem('yurist_a4_scale_mode', 'custom');
          localStorage.setItem('yurist_a4_custom_zoom', String(next));
          return next;
        });
      }
    };

    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, [a4CalculatedScale, a4ScaleMode]);

  // Saqlangan masshtab rejimini yuklash (fit, 100%, fit-width)
  const [scaleMode, setScaleMode] = useState<'fit' | '100%' | 'fit-width'>(() => {
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem('yurist_card_scale_mode');
      return saved === '100%' || saved === 'fit-width' ? saved : 'fit';
    }
    return 'fit';
  });

  const [activeCardIndex, setActiveCardIndex] = useState<number>(1);
  const hasUserScrolledRef = useRef<boolean>(false);
  const cardRatiosRef = useRef<Map<number, number>>(new Map());
  const [fitScale, setFitScale] = useState<number>(0.42);
  const [fitWidthScale, setFitWidthScale] = useState<number>(0.55);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [fullscreenScale, setFullscreenScale] = useState<number>(0.52);
  const [measuredHeights, setMeasuredHeights] = useState<MeasuredHeights | null>(null);
  const [coverLayout, setCoverLayout] = useState<string>(() => {
    return getTokenValue('doc_cover_layout') || 'classic';
  });

  // Mobil/ixcham navigator uchun o'lcham parametrlari popoveri holati
  const [isNavOverflowOpen, setIsNavOverflowOpen] = useState<boolean>(false);
  const navOverflowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isNavOverflowOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (navOverflowRef.current && !navOverflowRef.current.contains(e.target as Node)) {
        setIsNavOverflowOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isNavOverflowOpen]);

  useEffect(() => {
    const handleTokenChange = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail?.id === 'doc_cover_layout') {
        setCoverLayout(customEvent.detail.value || 'classic');
      }
    };
    const handleReset = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail?.id === 'doc_cover_layout') {
        setCoverLayout('classic');
      }
    };
    const handleResetAll = () => setCoverLayout('classic');

    window.addEventListener('yurist:token-changed', handleTokenChange);
    window.addEventListener('yurist:token-reset', handleReset);
    window.addEventListener('yurist:tokens-reset-all', handleResetAll);

    return () => {
      window.removeEventListener('yurist:token-changed', handleTokenChange);
      window.removeEventListener('yurist:token-reset', handleReset);
      window.removeEventListener('yurist:tokens-reset-all', handleResetAll);
    };
  }, []);

  // ---------------------------------------------------------------------------
  // ON-CANVAS DIRECT EDITING STATE & CONTROLLERS (Task 7)
  // ---------------------------------------------------------------------------
  const [activeEditing, setActiveEditing] = useState<{
    element: HTMLElement;
    editType: CanvasEditType;
    sourceLine?: number;
    blockId?: string;
    originalText: string;
    sectionTitle?: string;
    itemIdx?: number;
    rowIdx?: number;
    colIdx?: number;
  } | null>(null);

  const [toolbarPos, setToolbarPos] = useState<{ top: number; left: number } | null>(null);
  const [protectedTooltip, setProtectedTooltip] = useState<{ message: string; top: number; left: number } | null>(null);
  const activeEditingRef = useRef<typeof activeEditing>(null);
  useLayoutEffect(() => {
    activeEditingRef.current = activeEditing;
  }, [activeEditing]);
  const caretOffsetRef = useRef<number>(0);

  // Matn tahrirlanayotganda tanlov/kursor joylashuvini uzluksiz kuzatib borish
  useEffect(() => {
    if (!activeEditing) return;
    const handleSelectionChange = () => {
      const sel = window.getSelection();
      if (!sel || sel.rangeCount === 0) return;
      if (activeEditing.element && activeEditing.element.contains(sel.anchorNode)) {
        caretOffsetRef.current = getCaretCharacterOffsetWithin(activeEditing.element);
      }
    };
    document.addEventListener('selectionchange', handleSelectionChange);
    return () => {
      document.removeEventListener('selectionchange', handleSelectionChange);
    };
  }, [activeEditing]);

  // React qayta render qilganda kursor pozitsiyasini o'chib ketmasdan aniq tiklash
  useLayoutEffect(() => {
    if (!activeEditing) return;
    let el = activeEditing.element;
    if (!document.contains(el)) {
      const selector =
        `[data-canvas-editable="true"][data-edit-type="${activeEditing.editType}"]` +
        (activeEditing.sourceLine ? `[data-source-line="${activeEditing.sourceLine}"]` : '') +
        (activeEditing.blockId ? `[data-block-id="${activeEditing.blockId}"]` : '');
      const found = document.querySelector<HTMLElement>(selector);
      if (found) {
        el = found;
        el.contentEditable = 'true';
        el.classList.add('canvas-is-editing');
        setActiveEditing((prev) => (prev ? { ...prev, element: el } : null));
      }
    }
    if (document.contains(el)) {
      const activeEl = document.activeElement;
      const isFocused = activeEl === el || el.contains(activeEl);
      if (isFocused) {
        setCaretCharacterOffsetWithin(el, caretOffsetRef.current);
      }
    }
  });

  // Suzuvchi panel o'rnini yangilash (Viewport clamp & flip)
  const updateToolbarPosition = (el: HTMLElement) => {
    let rect = el.getBoundingClientRect();
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0 && !sel.isCollapsed) {
      const range = sel.getRangeAt(0);
      const rangeRect = range.getBoundingClientRect();
      if (rangeRect && rangeRect.width > 0 && rangeRect.height > 0) {
        rect = rangeRect;
      }
    }

    const isMobile = window.innerWidth <= 768;
    const toolbarWidth = isMobile ? Math.min(360, window.innerWidth - 24) : 320;
    const toolbarHalf = toolbarWidth / 2;

    // Viewport gorizontal chegaralari (clamp)
    const centerLeft = rect.left + rect.width / 2;
    const clampedLeft = Math.max(
      toolbarHalf + 12,
      Math.min(window.innerWidth - toolbarHalf - 12, centerLeft)
    );

    // Vertikal joylashuv va Flip (varaqning yuqori chegarasida pastga ag'darilish)
    let top = rect.top - 8;
    if (top < 65) {
      top = rect.bottom + 8;
    }

    // Mobil / sensorli qurilmalarda tizim menyusi (iOS/Android) bilan to'qnashmaslik uchun
    if (isMobile) {
      top = Math.min(window.innerHeight - 70, rect.bottom + 12);
    }

    setToolbarPos({
      top: Math.max(10, top),
      left: clampedLeft
    });
  };

  // V-E: Muharrir kursori harakatlanganda (Editor -> Preview sinxronizatsiyasi)
  useEffect(() => {
    let syncTimer: any = null;
    const handleCursorSync = (e: Event) => {
      const customEv = e as CustomEvent<{ line: number }>;
      const targetLine = customEv.detail?.line;
      if (!targetLine || !containerRef.current) return;

      if (syncTimer) clearTimeout(syncTimer);
      syncTimer = setTimeout(() => {
        if (!containerRef.current) return;
        const elements = Array.from(containerRef.current.querySelectorAll<HTMLElement>('[data-source-line]'));
        if (elements.length === 0) return;

        let closestEl: HTMLElement | null = null;
        let minDiff = Infinity;

        for (const el of elements) {
          const lineStr = el.getAttribute('data-source-line');
          if (lineStr) {
            const line = parseInt(lineStr, 10);
            const diff = Math.abs(line - targetLine);
            if (diff < minDiff) {
              minDiff = diff;
              closestEl = el;
            }
          }
        }

        if (closestEl && minDiff <= 3) {
          containerRef.current.querySelectorAll('.preview-sync-highlight').forEach((h) => {
            h.classList.remove('preview-sync-highlight');
          });
          closestEl.classList.add('preview-sync-highlight');
          if (outputMode !== 'cards') {
            closestEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          }
        }
      }, 120);
    };

    window.addEventListener('yurist:editor-cursor-line', handleCursorSync);
    return () => {
      window.removeEventListener('yurist:editor-cursor-line', handleCursorSync);
      if (syncTimer) clearTimeout(syncTimer);
    };
  }, [outputMode]);

  // V-E: Qayta bog'lanmagan uslublar holati
  const unresolvedStyles = useMemo(() => {
    return (styles || []).filter((s) => s.unresolved);
  }, [styles]);
  const [showUnresolvedList, setShowUnresolvedList] = useState(false);

  const handleDismissUnresolved = (id: string) => {
    if (onUpdateStyles && styles) {
      onUpdateStyles(styles.filter((s) => s.id !== id));
    }
  };

  const liveSyncTimerRef = useRef<NodeJS.Timeout | null>(null);

  // 3-Talab: Yozish paytida ~600ms debounce bilan jonli sinxronizatsiya (Live sync)
  const liveSyncCurrentEdit = (active = activeEditingRef.current) => {
    if (!active || !onCanvasEdit || !rawMdText) return;
    const { element, editType, sourceLine, blockId, sectionTitle, itemIdx, rowIdx, colIdx } = active;
    const currentText = (element.innerText || element.textContent || '').replace(/\u00a0/g, ' ').trim();
    if (!currentText || currentText === active.originalText.trim()) return;

    const result = applyCanvasEditToSource(rawMdText, {
      editType,
      newText: currentText,
      sourceLine,
      blockId,
      originalText: active.originalText,
      sectionTitle,
      itemIdx,
      rowIdx,
      colIdx
    });

    if (result.success && result.newSource && result.newSource !== rawMdText) {
      onCanvasEdit(result.newSource, true);
    }
  };

  // Tahrirni manba matniga commit qilish (xavfsizlik va butunlik tekshiruvi bilan)
  const commitCurrentEdit = (active = activeEditingRef.current) => {
    if (liveSyncTimerRef.current) {
      clearTimeout(liveSyncTimerRef.current);
      liveSyncTimerRef.current = null;
    }
    if (!active) return;
    const { element, editType, sourceLine, blockId, originalText, sectionTitle, itemIdx, rowIdx, colIdx } = active;
    element.contentEditable = 'false';
    element.classList.remove('canvas-is-editing');
    element.onpaste = null;
    element.oninput = null;
    element.onkeydown = null;
    element.onkeyup = null;
    element.onmouseup = null;

    const newText = (element.innerText || element.textContent || '').replace(/\u00a0/g, ' ').trim();
    if (newText === originalText.trim()) {
      setActiveEditing(null);
      setToolbarPos(null);
      return;
    }

    if (onCanvasEdit && rawMdText) {
      const result = applyCanvasEditToSource(rawMdText, {
        editType,
        newText,
        sourceLine,
        blockId,
        originalText,
        sectionTitle,
        itemIdx,
        rowIdx,
        colIdx
      });

      if (result.success && result.newSource) {
        onCanvasEdit(result.newSource, false);
      } else {
        // Butunlik buzilsa yoki xatolik bo'lsa, asl matn tiklanadi
        element.innerText = originalText;
        setProtectedTooltip({
          message: result.error || 'Bu qismni muharrirda tahrirlang',
          top: element.getBoundingClientRect().top,
          left: element.getBoundingClientRect().left + element.getBoundingClientRect().width / 2
        });
        setTimeout(() => setProtectedTooltip(null), 3000);
      }
    }

    setActiveEditing(null);
    setToolbarPos(null);
  };

  // Oyna o'lchami yoki skroll o'zgarganda panel o'rnini qayta hisoblash
  useEffect(() => {
    if (!activeEditing) return;
    const handleReposition = () => {
      if (activeEditing.element) {
        updateToolbarPosition(activeEditing.element);
      }
    };
    window.addEventListener('resize', handleReposition);
    window.addEventListener('scroll', handleReposition, true);
    return () => {
      window.removeEventListener('resize', handleReposition);
      window.removeEventListener('scroll', handleReposition, true);
    };
  }, [activeEditing]);

  // Tashqariga bosish yoki Escape orqali commit qilish
  useEffect(() => {
    if (!activeEditing) return;

    const handleDocumentMouseDown = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.closest('.canvas-floating-toolbar') ||
        activeEditing.element.contains(target) ||
        target === activeEditing.element
      ) {
        return;
      }
      commitCurrentEdit(activeEditing);
    };

    const handleDocumentKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        commitCurrentEdit(activeEditing);
      } else if (e.key === 'Enter') {
        const singleLineTypes: CanvasEditType[] = ['doc_title', 'sec_title', 'norm_title', 'case_title'];
        if (singleLineTypes.includes(activeEditing.editType)) {
          e.preventDefault();
          commitCurrentEdit(activeEditing);
        }
      }
    };

    document.addEventListener('mousedown', handleDocumentMouseDown);
    document.addEventListener('keydown', handleDocumentKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleDocumentMouseDown);
      document.removeEventListener('keydown', handleDocumentKeyDown);
    };
  }, [activeEditing, rawMdText]);

  // Kanvasdagi element bosilganda
  const handleCanvasClick = (e: React.MouseEvent) => {
    if (isPrintHost || isFullscreen) return;

    const target = e.target as HTMLElement;

    // 1. Himoyalangan (murakkab) bloklar tekshiruvi
    const protectedEl = target.closest('[data-canvas-protected="true"]') as HTMLElement | null;
    if (protectedEl) {
      const msg = protectedEl.getAttribute('data-protected-msg') || 'Bu qismni muharrirda tahrirlang';
      const rect = protectedEl.getBoundingClientRect();
      setProtectedTooltip({
        message: msg,
        top: rect.top,
        left: rect.left + rect.width / 2
      });
      setTimeout(() => setProtectedTooltip(null), 2500);
      return;
    }

    // 2. Tahrirlanadigan element tekshiruvi
    const editableEl = target.closest('[data-canvas-editable="true"]') as HTMLElement | null;
    if (!editableEl) {
      if (activeEditing && !target.closest('.canvas-floating-toolbar')) {
        commitCurrentEdit(activeEditing);
      }
      return;
    }

    if (activeEditing && activeEditing.element === editableEl) {
      return;
    }

    if (activeEditing) {
      commitCurrentEdit(activeEditing);
    }

    const editType = (editableEl.getAttribute('data-edit-type') as CanvasEditType) || 'paragraph';
    const sourceLineStr =
      editableEl.getAttribute('data-source-line') ||
      editableEl.closest('[data-source-line]')?.getAttribute('data-source-line');
    let sourceLine = sourceLineStr ? parseInt(sourceLineStr, 10) : undefined;
    const blockId =
      editableEl.getAttribute('data-block-id') ||
      editableEl.closest('[data-block-id]')?.getAttribute('data-block-id') ||
      undefined;
    const sectionTitle =
      editableEl.getAttribute('data-section-title') ||
      editableEl.closest('[data-section-title]')?.getAttribute('data-section-title') ||
      undefined;

    // Fallback: agar sourceLine hali ham topilmagan bo'lsa, blok va bo'limlar orqali qidiramiz
    if (!sourceLine && blockId && doc.sections) {
      for (const sec of doc.sections) {
        const found = (sec.blocks || []).find((b) => b.id === blockId);
        if (found && found.sourceLine) {
          sourceLine = found.sourceLine;
          break;
        }
      }
    }
    if (!sourceLine && editType === 'doc_title') {
      sourceLine = doc.sourceLine || 1;
    }
    if (!sourceLine && editType === 'doc_subtitle') {
      sourceLine = doc.subtitleSourceLine;
    }
    if (!sourceLine && editType === 'sec_title' && sectionTitle && doc.sections) {
      const foundSec = doc.sections.find((s) => s.title === sectionTitle);
      if (foundSec && foundSec.sourceLine) {
        sourceLine = foundSec.sourceLine;
      }
    }

    const originalText = (editableEl.innerText || editableEl.textContent || '').trim();

    const itemIdxStr = editableEl.getAttribute('data-item-idx');
    const itemIdx = itemIdxStr ? parseInt(itemIdxStr, 10) : undefined;
    const rowIdxStr = editableEl.getAttribute('data-row-idx');
    const rowIdx = rowIdxStr ? parseInt(rowIdxStr, 10) : undefined;
    const colIdxStr = editableEl.getAttribute('data-col-idx');
    const colIdx = colIdxStr ? parseInt(colIdxStr, 10) : undefined;

    // 1(b) Qoidasi: Faqat toza matnni paste qilish (HTML/span teglarsiz)
    editableEl.onpaste = (pasteEv: ClipboardEvent) => {
      pasteEv.preventDefault();
      const text = pasteEv.clipboardData?.getData('text/plain') || '';
      document.execCommand('insertText', false, text);
    };

    // 3-Talab: Yozish paytida ~600ms debounce bilan jonli sinxronizatsiya
    editableEl.oninput = () => {
      caretOffsetRef.current = getCaretCharacterOffsetWithin(editableEl);
      if (liveSyncTimerRef.current) clearTimeout(liveSyncTimerRef.current);
      liveSyncTimerRef.current = setTimeout(() => {
        liveSyncCurrentEdit(activeEditingRef.current);
      }, 600);
      updateToolbarPosition(editableEl);
    };

    editableEl.onkeyup = () => {
      caretOffsetRef.current = getCaretCharacterOffsetWithin(editableEl);
    };
    editableEl.onmouseup = () => {
      caretOffsetRef.current = getCaretCharacterOffsetWithin(editableEl);
    };

    // V-E: Klaviatura tejamkorligi (Ctrl+B/I/U, Esc, Ctrl+Z/Y)
    editableEl.onkeydown = (ev: KeyboardEvent) => {
      if (ev.key === 'Escape') {
        ev.preventDefault();
        commitCurrentEdit();
        setActiveEditing(null);
        setToolbarPos(null);
        return;
      }

      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const mod = isMac ? ev.metaKey : ev.ctrlKey;

      if (mod) {
        const key = ev.key.toLowerCase();
        if (key === 'b') {
          ev.preventDefault();
          handleApplyFormat('bold');
        } else if (key === 'i') {
          ev.preventDefault();
          handleApplyFormat('italic');
        } else if (key === 'u') {
          ev.preventDefault();
          handleApplyFormat('underline');
        } else if (key === 'z') {
          ev.preventDefault();
          if (ev.shiftKey) {
            window.dispatchEvent(new CustomEvent('yurist:redo'));
          } else {
            window.dispatchEvent(new CustomEvent('yurist:undo'));
          }
        } else if (key === 'y') {
          ev.preventDefault();
          window.dispatchEvent(new CustomEvent('yurist:redo'));
        }
      }
    };

    editableEl.contentEditable = 'true';
    editableEl.classList.add('canvas-is-editing');
    editableEl.focus();

    setTimeout(() => {
      if (document.activeElement === editableEl || editableEl.contains(document.activeElement)) {
        caretOffsetRef.current = getCaretCharacterOffsetWithin(editableEl);
      }
    }, 0);

    // V-E: Tanlov sinxronizatsiyasi (Preview -> Muharrir mos qatorini kursor bilan belgilash)
    // Faqat hodisani yuboramiz, foydalanuvchini majburlab rejimdan chiqarmaymiz
    if (sourceLine) {
      window.dispatchEvent(new CustomEvent('yurist:editor-cursor-line', { detail: { line: sourceLine } }));
    }

    updateToolbarPosition(editableEl);

    setActiveEditing({
      element: editableEl,
      editType,
      sourceLine,
      blockId,
      originalText,
      sectionTitle,
      itemIdx,
      rowIdx,
      colIdx
    });
  };

  // Himoyalangan element ustiga kelganda xabar
  const handleCanvasMouseOver = (e: React.MouseEvent) => {
    const protectedEl = (e.target as HTMLElement).closest('[data-canvas-protected="true"]') as HTMLElement | null;
    if (protectedEl) {
      const msg = protectedEl.getAttribute('data-protected-msg') || 'Bu qismni muharrirda tahrirlang';
      const rect = protectedEl.getBoundingClientRect();
      setProtectedTooltip({
        message: msg,
        top: rect.top,
        left: rect.left + rect.width / 2
      });
    }
  };

  const handleCanvasMouseOut = (e: React.MouseEvent) => {
    const toEl = e.relatedTarget as HTMLElement | null;
    if (!toEl || !toEl.closest('[data-canvas-protected="true"]')) {
      setProtectedTooltip(null);
    }
  };

  const [activeStyleColor, setActiveStyleColor] = useState<StyleColorToken | undefined>();
  const [activeStyleSize, setActiveStyleSize] = useState<StyleSizeStep | undefined>();

  // Suzuvchi panel orqali matnni formatlash (Qalin, Kursiv, Tagiga chizish, Belgilash)
  const handleApplyFormat = (formatType: 'bold' | 'italic' | 'underline' | 'highlight') => {
    if (!activeEditing) return;
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;
    const range = sel.getRangeAt(0);

    if (!activeEditing.element.contains(range.commonAncestorContainer)) return;

    const selectedText = range.toString();
    if (!selectedText) return;

    if (formatType === 'underline') {
      const container = range.commonAncestorContainer;
      const el = container.nodeType === Node.ELEMENT_NODE ? (container as HTMLElement) : container.parentElement;
      const existingUnderlineSpan = el?.closest('[data-style-underline="true"]') as HTMLElement | null;

      if (existingUnderlineSpan) {
        const parent = existingUnderlineSpan.parentNode;
        while (existingUnderlineSpan.firstChild) {
          parent?.insertBefore(existingUnderlineSpan.firstChild, existingUnderlineSpan);
        }
        parent?.removeChild(existingUnderlineSpan);

        if (onUpdateStyles && rawMdText) {
          const offset = rawMdText.indexOf(selectedText);
          if (offset !== -1 && styles) {
            onUpdateStyles(styles.filter((s) => !(s.startOffset === offset && s.properties.underline)));
          }
        }
      } else {
        const span = document.createElement('span');
        span.style.textDecoration = 'underline';
        span.setAttribute('data-style-underline', 'true');
        span.appendChild(range.extractContents());
        range.insertNode(span);

        if (onUpdateStyles && rawMdText) {
          const offset = rawMdText.indexOf(selectedText);
          if (offset !== -1) {
            const newAnn: StyleAnnotation = {
              id: `style_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
              kind: 'inline',
              blockId: activeEditing.blockId,
              startOffset: offset,
              endOffset: offset + selectedText.length,
              quote: createTextQuoteAnchor(rawMdText, offset, offset + selectedText.length),
              properties: { underline: true },
              createdAt: Date.now(),
              updatedAt: Date.now()
            };
            const existing = styles || [];
            onUpdateStyles([...existing.filter((s) => s.startOffset !== offset || !s.properties.underline), newAnn]);
          }
        }
      }
      updateToolbarPosition(activeEditing.element);
      return;
    }

    let marker = '**';
    if (formatType === 'italic') marker = '*';
    if (formatType === 'highlight') marker = '==';

    let newContent = '';
    if (selectedText.startsWith(marker) && selectedText.endsWith(marker) && selectedText.length >= marker.length * 2) {
      newContent = selectedText.slice(marker.length, selectedText.length - marker.length);
    } else {
      newContent = `${marker}${selectedText}${marker}`;
    }

    range.deleteContents();
    const textNode = document.createTextNode(newContent);
    range.insertNode(textNode);

    sel.removeAllRanges();
    const newRange = document.createRange();
    newRange.selectNodeContents(textNode);
    sel.addRange(newRange);

    updateToolbarPosition(activeEditing.element);
    liveSyncCurrentEdit(activeEditingRef.current);
    if (activeEditing.element) {
      activeEditing.element.dispatchEvent(new Event('input', { bubbles: true }));
    }
  };

  // Rang palitrasi orqali rang berish
  const handleColorChange = (color: StyleColorToken) => {
    if (!activeEditing) return;
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;
    const range = sel.getRangeAt(0);
    if (!activeEditing.element.contains(range.commonAncestorContainer)) return;

    setActiveStyleColor(color);
    const cssColor = resolveStyleColor(color, currentTheme === 'dark');
    if (!cssColor) return;

    const span = document.createElement('span');
    span.style.color = cssColor;
    span.setAttribute('data-style-color', color);
    span.appendChild(range.extractContents());
    range.insertNode(span);

    if (onUpdateStyles && rawMdText) {
      const selectedText = span.innerText || '';
      if (selectedText) {
        const offset = rawMdText.indexOf(selectedText);
        if (offset !== -1) {
          const newAnn: StyleAnnotation = {
            id: `style_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
            kind: 'inline',
            blockId: activeEditing.blockId,
            startOffset: offset,
            endOffset: offset + selectedText.length,
            quote: createTextQuoteAnchor(rawMdText, offset, offset + selectedText.length),
            properties: { color },
            createdAt: Date.now(),
            updatedAt: Date.now()
          };
          const existing = styles || [];
          onUpdateStyles([...existing.filter(s => s.startOffset !== offset), newAnn]);
        }
      }
    }

    if (liveSyncTimerRef.current) clearTimeout(liveSyncTimerRef.current);
    liveSyncTimerRef.current = setTimeout(() => {
      liveSyncCurrentEdit(activeEditingRef.current);
    }, 200);
  };

  // O'lcham tanlash
  const handleSizeChange = (size: StyleSizeStep) => {
    if (!activeEditing) return;
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;
    const range = sel.getRangeAt(0);
    if (!activeEditing.element.contains(range.commonAncestorContainer)) return;

    setActiveStyleSize(size);
    const cssSize = resolveStyleSize(size);
    if (!cssSize) return;

    const span = document.createElement('span');
    span.style.fontSize = cssSize;
    span.setAttribute('data-style-size', size);
    span.appendChild(range.extractContents());
    range.insertNode(span);

    if (onUpdateStyles && rawMdText) {
      const selectedText = span.innerText || '';
      if (selectedText) {
        const offset = rawMdText.indexOf(selectedText);
        if (offset !== -1) {
          const newAnn: StyleAnnotation = {
            id: `style_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
            kind: 'inline',
            blockId: activeEditing.blockId,
            startOffset: offset,
            endOffset: offset + selectedText.length,
            quote: createTextQuoteAnchor(rawMdText, offset, offset + selectedText.length),
            properties: { size },
            createdAt: Date.now(),
            updatedAt: Date.now()
          };
          const existing = styles || [];
          onUpdateStyles([...existing.filter(s => s.startOffset !== offset), newAnn]);
        }
      }
    }

    if (liveSyncTimerRef.current) clearTimeout(liveSyncTimerRef.current);
    liveSyncTimerRef.current = setTimeout(() => {
      liveSyncCurrentEdit(activeEditingRef.current);
    }, 200);
  };

  // Uslubni tozalash
  const handleClearStyle = () => {
    if (!activeEditing) return;
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;
    const range = sel.getRangeAt(0);
    if (!activeEditing.element.contains(range.commonAncestorContainer)) return;

    const raw = range.toString()
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\*(.*?)\*/g, '$1')
      .replace(/==(.*?)==/g, '$1');

    range.deleteContents();
    const textNode = document.createTextNode(raw);
    range.insertNode(textNode);
    setActiveStyleColor(undefined);
    setActiveStyleSize(undefined);

    if (onUpdateStyles && rawMdText && raw) {
      const offset = rawMdText.indexOf(raw);
      if (offset !== -1 && styles) {
        onUpdateStyles(styles.filter(s => !(s.startOffset >= offset && s.endOffset <= offset + raw.length)));
      }
    }

    if (liveSyncTimerRef.current) clearTimeout(liveSyncTimerRef.current);
    liveSyncTimerRef.current = setTimeout(() => {
      liveSyncCurrentEdit(activeEditingRef.current);
    }, 200);
  };

  // Suzuvchi paneldan "Manbaga o'tish"
  const handleJumpToSource = () => {
    if (!activeEditing) return;
    let line = activeEditing.sourceLine;
    if (!line && activeEditing.blockId && doc.sections) {
      for (const sec of doc.sections) {
        const found = (sec.blocks || []).find((b) => b.id === activeEditing.blockId);
        if (found && found.sourceLine) {
          line = found.sourceLine;
          break;
        }
      }
    }
    if (!line && activeEditing.editType === 'doc_title') {
      line = doc.sourceLine || 1;
    }
    if (!line && activeEditing.editType === 'doc_subtitle') {
      line = doc.subtitleSourceLine;
    }
    if (!line && activeEditing.editType === 'sec_title' && activeEditing.sectionTitle && doc.sections) {
      const foundSec = doc.sections.find((s) => s.title === activeEditing.sectionTitle);
      if (foundSec && foundSec.sourceLine) {
        line = foundSec.sourceLine;
      }
    }

    commitCurrentEdit(activeEditing);
    if (line) {
      if (onJumpToSourceLine) {
        onJumpToSourceLine(line);
      }
      window.dispatchEvent(new CustomEvent('yurist:jump-to-source-line', { detail: { line } }));
    }
  };

  // ---------------------------------------------------------------------------
  // PER-BLOCK STYLE OVERRIDES STATE (Task 8)
  // ---------------------------------------------------------------------------
  const [internalOverrides, setInternalOverrides] = useState<BlockStyleOverridesMap>(
    () => doc.blockOverrides || {}
  );
  const effectiveOverrides: BlockStyleOverridesMap = useMemo(() => {
    return blockOverrides || doc.blockOverrides || internalOverrides;
  }, [blockOverrides, doc.blockOverrides, internalOverrides]);

  const [activeBlockPopover, setActiveBlockPopover] = useState<{
    block: Block;
    anchorRect: DOMRect;
  } | null>(null);

  const handleOpenBlockPopover = (block: Block, anchorRect: DOMRect) => {
    setActiveBlockPopover({ block, anchorRect });
  };

  const handleUpdateOverride = (blockId: string, override: BlockStyleOverride) => {
    if (onUpdateBlockOverride) {
      onUpdateBlockOverride(blockId, override);
    } else {
      setInternalOverrides((prev) => ({
        ...prev,
        [blockId]: override
      }));
    }
  };

  const handleResetOverride = (blockId: string) => {
    if (onResetBlockOverride) {
      onResetBlockOverride(blockId);
    } else {
      setInternalOverrides((prev) => {
        const copy = { ...prev };
        delete copy[blockId];
        return copy;
      });
    }
  };

  const getBlockOverride = (bId?: string): BlockStyleOverride | undefined => {
    if (!bId) return undefined;
    if (effectiveOverrides[bId]) return effectiveOverrides[bId];
    const baseId = bId.replace(/-p\d+$/, '').replace(/-step\d+$/, '').replace(/-chunk\d+$/, '');
    return effectiveOverrides[baseId];
  };

  // Haqiqiy brauzer DOM o'lchovlari (A talabi: Paginate from MEASURED heights)
  useLayoutEffect(() => {
    if (!measurerRef.current) return;
    const container = measurerRef.current;

    const heights: MeasuredHeights = {
      sectionHeaders: {},
      blocks: {},
      tableHeaders: {},
      tableRows: {},
      listItems: {},
      normParas: {}
    };

    // Bo'lim sarlavhalari balandligini o'lchash
    container.querySelectorAll('[data-measure-sec]').forEach((el) => {
      const secTitle = el.getAttribute('data-measure-sec');
      if (secTitle) {
        heights.sectionHeaders![secTitle] = Math.ceil((el as HTMLElement).offsetHeight) + 28; // gap
      }
    });

    // Atomik bloklar balandligini o'lchash
    container.querySelectorAll('[data-measure-block]').forEach((el) => {
      const blockId = el.getAttribute('data-measure-block');
      if (blockId) {
        heights.blocks![blockId] = Math.ceil((el as HTMLElement).offsetHeight) + 28; // gap & margin
      }
    });

    // Jadval sarlavhasi (thead + caption) va qatorlarini o'lchash
    container.querySelectorAll('[data-measure-tbl-head]').forEach((el) => {
      const tblId = el.getAttribute('data-measure-tbl-head');
      if (tblId) {
        // 40px wrapper margin + 24px container margin + 28px gap
        heights.tableHeaders![tblId] = Math.ceil((el as HTMLElement).offsetHeight) + 80;
      }
    });
    container.querySelectorAll('[data-measure-tbl-row]').forEach((el) => {
      const tblId = el.getAttribute('data-measure-tbl-row');
      const rowIdx = parseInt(el.getAttribute('data-row-idx') || '0', 10);
      if (tblId) {
        if (!heights.tableRows![tblId]) heights.tableRows![tblId] = [];
        heights.tableRows![tblId][rowIdx] = Math.ceil((el as HTMLElement).offsetHeight);
      }
    });

    // Ro'yxat bandlarini o'lchash (16px margin-bottom hisobga olinadi)
    container.querySelectorAll('[data-measure-lst-item]').forEach((el) => {
      const lstId = el.getAttribute('data-measure-lst-item');
      const itemIdx = parseInt(el.getAttribute('data-item-idx') || '0', 10);
      if (lstId) {
        if (!heights.listItems![lstId]) heights.listItems![lstId] = [];
        heights.listItems![lstId][itemIdx] = Math.ceil((el as HTMLElement).offsetHeight) + 55; // margin + line-height buffer
      }
    });

    // Qonun normasi xatboshilarini o'lchash (24px margin-bottom hisobga olinadi)
    container.querySelectorAll('[data-measure-norm-p]').forEach((el) => {
      const normId = el.getAttribute('data-measure-norm-p');
      const pIdx = parseInt(el.getAttribute('data-p-idx') || '0', 10);
      if (normId) {
        if (!heights.normParas![normId]) heights.normParas![normId] = [];
        heights.normParas![normId][pIdx] = Math.ceil((el as HTMLElement).offsetHeight) + 28; // 24px margin + buffer
      }
    });

    setMeasuredHeights(heights);
  }, [doc, effectiveOverrides]);

  const cards: StudyCard[] = useMemo(() => {
    const docWithOverrides: LegalDocument = {
      ...doc,
      blockOverrides: effectiveOverrides
    };
    return paginateDocument(docWithOverrides, measuredHeights || undefined);
  }, [doc, measuredHeights, effectiveOverrides]);

  // Hujjat yoki kartalar o'zgarganda boshlang'ich 1-kartaga qaytarish
  useEffect(() => {
    setActiveCardIndex(1);
    hasUserScrolledRef.current = false;
  }, [cards]);

  // Bo'limlarning boshlang'ich karta raqamlari xaritasi (Mundarija uchun)
  const sectionStartCardMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const card of cards) {
      if (card.cardType === 'content' && card.sectionTitle && !card.isContinuation) {
        if (!map.has(card.sectionTitle)) {
          map.set(card.sectionTitle, card.cardIndex);
        }
      }
    }
    return map;
  }, [cards]);

  // Masshtab rejimini almashtirish va eslab qolish
  const handleScaleModeChange = (mode: 'fit' | '100%' | 'fit-width') => {
    setScaleMode(mode);
    localStorage.setItem('yurist_card_scale_mode', mode);
  };

  // Konteyner o'lchamiga mos "Moslash" (Fit) va "Kenglikka" (Fit-width) masshtablarini hisoblash
  useEffect(() => {
    const computeFitScale = () => {
      if (!containerRef.current) return;
      const el = containerRef.current;
      const parentCol = el.parentElement || el;
      const availableW = parentCol.clientWidth || window.innerWidth;
      const availableH = parentCol.clientHeight || window.innerHeight;

      // 1080x1920 kartaning to'liq ko'rinishi uchun masshtab
      const horizontalPad = availableW < 500 ? 32 : 48;
      // Yuqori format paneli, suzuvchi navigator va hoshiyalar uchun to'liq bo'shliq
      const verticalPad = availableH < 650 ? 176 : 180;

      // 1. Moslash (fit): Butun sahifa (1080x1920) ekranda to'liq ko'rinishi uchun (yon hoshiyalar me'yoriy)
      const scaleW = (availableW - horizontalPad) / 1080;
      const scaleH = (availableH - verticalPad) / 1920;
      const bestFit = Math.min(scaleW, scaleH);
      const clampedFit = Math.max(0.18, Math.min(0.9, Number(bestFit.toFixed(3))));
      setFitScale(clampedFit);

      // 2. Kenglikka (fit-width): Karta eni ishchi maydon enini to'ldiradi
      const bestWidthScale = (availableW - horizontalPad) / 1080;
      const clampedWidthScale = Math.max(0.2, Math.min(1.5, Number(bestWidthScale.toFixed(3))));
      setFitWidthScale(clampedWidthScale);

      // 3. To'liq ekran uchun masshtab (oyna balandligining 94% qismini qamrab oladi)
      const vh = window.innerHeight;
      const vw = window.innerWidth;
      const fsH = (vh * 0.94) / 1920;
      const fsW = (vw * 0.92) / 1080;
      const bestFs = Math.max(0.25, Math.min(1.0, Number(Math.min(fsW, fsH).toFixed(3))));
      setFullscreenScale(bestFs);
    };

    computeFitScale();
    const observer = new ResizeObserver(() => {
      computeFitScale();
    });
    if (containerRef.current?.parentElement) {
      observer.observe(containerRef.current.parentElement);
    }
    if (containerRef.current) {
      observer.observe(containerRef.current);
    }
    window.addEventListener('resize', computeFitScale);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', computeFitScale);
    };
  }, []);

  // Ekranda ko'rinib turgan faol kartani aniqlash va skroll bilan sinxronlash
  useEffect(() => {
    if (isFullscreen) return;
    const container = containerRef.current;
    if (!container) return;

    const scrollEl = container.parentElement || container;

    // Eng dominant (ekranda eng ko'p ko'rinib turgan) kartani aniqlash
    const updateDominantCard = () => {
      const cardEls = container.querySelectorAll<HTMLElement>('[id^="card-"]');
      if (!cardEls.length) return;

      const currentScrollTop = scrollEl.scrollTop || container.scrollTop || window.scrollY || 0;
      // Agar skroll eng yuqori nuqtada bo'lsa (<= 15px), qat'iy 1-karta
      if (currentScrollTop <= 15) {
        setActiveCardIndex(1);
        return;
      }

      // Foydalanuvchi hali skroll qilmagan bo'lsa, 1-kartada qoladi
      if (!hasUserScrolledRef.current) {
        return;
      }

      const viewportRect = scrollEl.getBoundingClientRect();
      let maxVisibleHeight = 0;
      let dominantIdx = 1;

      cardEls.forEach((el) => {
        const rect = el.getBoundingClientRect();
        const vTop = Math.max(rect.top, viewportRect.top);
        const vBottom = Math.min(rect.bottom, viewportRect.bottom);
        const visibleH = Math.max(0, vBottom - vTop);

        if (visibleH > maxVisibleHeight) {
          maxVisibleHeight = visibleH;
          const match = el.id.match(/^card-(\d+)$/);
          if (match) {
            dominantIdx = parseInt(match[1], 10);
          }
        }
      });

      if (maxVisibleHeight > 0) {
        setActiveCardIndex((prev) => (prev !== dominantIdx ? dominantIdx : prev));
      }
    };

    let rafId: number | null = null;
    const handleScroll = () => {
      hasUserScrolledRef.current = true;
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(updateDominantCard);
    };

    scrollEl.addEventListener('scroll', handleScroll, { passive: true });
    if (scrollEl !== container) {
      container.addEventListener('scroll', handleScroll, { passive: true });
    }

    // Observer: har bir kartaning ko'rinish ulushini (intersection ratio) xaritada saqlaydi
    // va har doim eng KATTA nisbatga (largest visible ratio) ega kartani tanlaydi
    const cardRatios = cardRatiosRef.current;
    cardRatios.clear();

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const match = entry.target.id.match(/^card-(\d+)$/);
          if (match) {
            const idx = parseInt(match[1], 10);
            cardRatios.set(idx, entry.isIntersecting ? entry.intersectionRatio : 0);
          }
        }

        // Boshlang'ich yuklanishda (hali skroll qilinmagan) 1-kartada qat'iy turadi
        if (!hasUserScrolledRef.current) {
          return;
        }

        let maxRatio = 0;
        let dominantIdx = 1;

        for (const [idx, ratio] of cardRatios.entries()) {
          if (ratio > maxRatio) {
            maxRatio = ratio;
            dominantIdx = idx;
          }
        }

        if (maxRatio > 0) {
          setActiveCardIndex((prev) => (prev !== dominantIdx ? dominantIdx : prev));
        }
      },
      {
        root: scrollEl === document.body ? null : scrollEl,
        threshold: [0, 0.05, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0]
      }
    );

    const cardEls = container.querySelectorAll('[id^="card-"]');
    cardEls.forEach((el) => observer.observe(el));

    return () => {
      observer.disconnect();
      scrollEl.removeEventListener('scroll', handleScroll);
      if (scrollEl !== container) {
        container.removeEventListener('scroll', handleScroll);
      }
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [cards, isFullscreen, scaleMode]);

  // To'liq ekran taqdimot rejimiga kirish
  const enterFullscreen = async () => {
    const vh = window.innerHeight;
    const vw = window.innerWidth;
    const fsH = (vh * 0.94) / 1920;
    const fsW = (vw * 0.92) / 1080;
    setFullscreenScale(Math.max(0.25, Math.min(1.0, Number(Math.min(fsH, fsW).toFixed(3)))));
    setIsFullscreen(true);
    try {
      if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
      }
    } catch {
      // Brauzer taqiqlasa ham ichki modal holati ishlaydi
    }
  };

  // To'liq ekrandan chiqish
  const exitFullscreen = async () => {
    setIsFullscreen(false);
    try {
      if (document.fullscreenElement && document.exitFullscreen) {
        await document.exitFullscreen();
      }
    } catch {
      // Ignored
    }
  };

  // Fullscreen o'zgarishini kuzatish (Esc bosilganda va oyna o'lchami o'zgarganda)
  useEffect(() => {
    const onFsChange = () => {
      if (!document.fullscreenElement) {
        setIsFullscreen(false);
      } else {
        const vh = window.innerHeight;
        const vw = window.innerWidth;
        const fsH = (vh * 0.94) / 1920;
        const fsW = (vw * 0.92) / 1080;
        setFullscreenScale(Math.max(0.25, Math.min(1.0, Number(Math.min(fsH, fsW).toFixed(3)))));
      }
    };
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  // To'liq ekranda klaviatura orqali varoqlash (Chap/O'ng, Esc)
  useEffect(() => {
    if (!isFullscreen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key === ' ') {
        e.preventDefault();
        setActiveCardIndex((prev) => Math.min(cards.length, prev + 1));
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveCardIndex((prev) => Math.max(1, prev - 1));
      } else if (e.key === 'Escape') {
        exitFullscreen();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen, cards.length]);

  // Touch sensorli surish (Swipe gestures)
  const touchStartXRef = useRef<number | null>(null);
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0].clientX;
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartXRef.current === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchEndX - touchStartXRef.current;
    if (diff < -50) {
      // Chapga surish -> Keyingi karta
      setActiveCardIndex((prev) => Math.min(cards.length, prev + 1));
    } else if (diff > 50) {
      // O'ngga surish -> Oldingi karta
      setActiveCardIndex((prev) => Math.max(1, prev - 1));
    }
    touchStartXRef.current = null;
  };

  // Kartaga o'tish (Skroll)
  const scrollToCard = (index: number) => {
    const targetIdx = Math.max(1, Math.min(cards.length, index));
    setActiveCardIndex(targetIdx);
    const el = window.document.getElementById(`card-${targetIdx}`);
    if (el) {
      if (scaleMode === 'fit') {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  const currentScale =
    scaleMode === '100%' ? 1.0 :
      scaleMode === 'fit-width' ? fitWidthScale :
        fitScale;

  // Alohida 9:16 kartani render qilish (Mantiqiy 1080x1920 layout)
  const renderCard = (card: StudyCard, scale: number, isFullscreenCard = false) => {
    const formattedNum = String(card.cardIndex).padStart(2, '0');
    const formattedTotal = String(card.totalCards).padStart(2, '0');
    const isInteractive = !isFullscreenCard && !isPrintHost;
    const wrapperClass = isPrintHost ? 'print-card-wrapper' : 'card-scale-wrapper';
    const cardId = isInteractive ? `card-${card.cardIndex}` : undefined;

    // 1. Muqova kartasi (Cover card)
    if (card.cardType === 'cover') {
      return (
        <div
          key={card.id}
          id={cardId}
          className={wrapperClass}
          style={{ '--card-scale': scale } as React.CSSProperties}
          onClick={() => {
            if (!isFullscreenCard && !isPrintHost) {
              setActiveCardIndex(card.cardIndex);
            }
          }}
        >
          <article
            className={`study-card-9-16 card-cover layout-${coverLayout}`}
            data-cover-layout={coverLayout}
            aria-label={`Muqova kartasi, ${card.cardIndex} / ${card.totalCards}`}
          >
            <header className="cover-header">
              {doc.cover?.institution && (
                <div className="cover-institution">{doc.cover.institution}</div>
              )}
              <div className="cover-crest-container">
                <Scale className="cover-crest" />
              </div>
            </header>

            <div className="cover-body">
              <h1
                className="cover-title"
                data-canvas-editable="true"
                data-edit-type="doc_title"
                data-source-line={doc.sourceLine}
              >
                <FormattedText text={doc.title} />
              </h1>
              <div className="cover-divider" />
              {(doc.cover?.subtitle || doc.subtitle) && (
                <p
                  className="cover-subtitle"
                  data-canvas-editable="true"
                  data-edit-type="doc_subtitle"
                  data-source-line={doc.subtitleSourceLine}
                >
                  <FormattedText text={doc.cover?.subtitle || doc.subtitle} />
                </p>
              )}
            </div>

            <footer className="cover-footer">
              {doc.author && <div className="cover-author">{doc.author}</div>}
              <div className="cover-year">
                {doc.cover?.year ? `Toshkent — ${doc.cover.year}` : 'O‘quv-uslubiy nashr (9:16)'}
              </div>
              <div style={{ marginTop: 12 }}>
                <span className="card-number-badge">
                  {formattedNum} / {formattedTotal}
                </span>
              </div>
            </footer>
          </article>
        </div>
      );
    }

    // 2. Mundarija kartasi (TOC card)
    if (card.cardType === 'toc') {
      return (
        <div
          key={card.id}
          id={cardId}
          className={wrapperClass}
          style={{ '--card-scale': scale } as React.CSSProperties}
          onClick={() => {
            if (!isFullscreenCard && !isPrintHost) {
              setActiveCardIndex(card.cardIndex);
            }
          }}
        >
          <article
            className="study-card-9-16 card-toc"
            aria-label={`Mundarija kartasi, ${card.cardIndex} / ${card.totalCards}`}
          >
            <header className="card-header-meta">
              <span className="card-header-title">{doc.title}</span>
              <span className="card-number-badge">
                {formattedNum} / {formattedTotal}
              </span>
            </header>

            <div className="card-content-area">
              <div className="card-section-header">
                <h2 className="card-section-title">{card.sectionTitle || 'Mundarija'}</h2>
              </div>

              <ul className="card-toc-list">
                {doc.sections.map((sec, sIdx) => {
                  const startCard = sectionStartCardMap.get(sec.title) || sIdx + 1;
                  const formattedCardNum = String(startCard).padStart(2, '0');
                  return (
                    <li
                      key={sec.id || sIdx}
                      className="card-toc-item"
                      onClick={() => !isFullscreenCard && scrollToCard(startCard)}
                      style={{ cursor: !isFullscreenCard ? 'pointer' : 'default' }}
                    >
                      <span className="card-toc-link">
                        <FormattedText text={sec.title} />
                      </span>
                      <span className="card-toc-number">
                        {formattedCardNum}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>

            <footer className="card-footer-meta">
              <div className="card-footer-left">
                <BookOpen size={24} />
                <span>Yurist O‘quv Studiyasi</span>
              </div>
            </footer>
          </article>
        </div>
      );
    }

    // 3. Mazmun kartasi (Content card)
    return (
      <div
        key={card.id}
        id={cardId}
        className={wrapperClass}
        style={{ '--card-scale': scale } as React.CSSProperties}
        onClick={() => {
          if (!isFullscreenCard && !isPrintHost) {
            setActiveCardIndex(card.cardIndex);
          }
        }}
      >
        <article
          className="study-card-9-16 card-content"
          aria-label={`${card.sectionTitle || 'Bo‘lim'}, ${card.cardIndex} / ${card.totalCards}`}
        >
          {/* Kolontitul */}
          <header className="card-header-meta">
            <span
              className="card-header-title"
              title={card.sectionTitle ? card.sectionTitle : doc.title}
            >
              {card.sectionTitle ? card.sectionTitle : doc.title}
            </span>
            <span className="card-number-badge">
              {formattedNum} / {formattedTotal}
            </span>
          </header>

          {/* Asosiy bloklar */}
          <div
            className="card-content-area"
            style={
              card.scale && card.scale < 1
                ? { transform: `scale(${card.scale})`, transformOrigin: 'top center' }
                : undefined
            }
          >
            {card.sectionTitle && !card.isContinuation && (
              <div className="card-section-header">
                <h2
                  className="card-section-title"
                  data-canvas-editable="true"
                  data-edit-type="sec_title"
                  data-source-line={card.sectionSourceLine}
                  data-section-title={card.sectionTitle}
                >
                  <FormattedText text={card.sectionTitle} />
                </h2>
                {card.sectionSubtitle && (
                  <p
                    className="card-section-subtitle"
                    data-canvas-editable="true"
                    data-edit-type="sec_subtitle"
                    data-source-line={card.sectionSubtitleSourceLine}
                    data-section-title={card.sectionTitle}
                  >
                    <FormattedText text={card.sectionSubtitle} />
                  </p>
                )}
              </div>
            )}

            {card.isContinuation && (
              <div
                className="card-continuation-badge"
                style={{
                  fontSize: '34px',
                  color: 'var(--text-muted)',
                  fontStyle: 'italic',
                  marginBottom: 8
                }}
              >
                (davomi)
              </div>
            )}

            {card.blocks.map((block) => (
              <BlockRenderer
                key={block.id}
                block={block}
                forceShowAnswer={forceShowAnswer ?? true}
                override={getBlockOverride(block.id)}
                onOpenStylePopover={handleOpenBlockPopover}
                isPrintHost={isPrintHost}
              />
            ))}
          </div>

          {/* Quyi kolontitul */}
          <footer className="card-footer-meta">
            <div className="card-footer-left">
              <BookOpen size={24} />
              <span>{doc.title}</span>
            </div>
          </footer>
        </article>
      </div>
    );
  };

  const renderOutputModeTabs = () => (
    <div className="output-mode-tabs" role="tablist" aria-label="Format tanlagich">
      <button
        type="button"
        role="tab"
        aria-selected={outputMode === 'a4'}
        className={`output-mode-tab ${outputMode === 'a4' ? 'active' : ''}`}
        onClick={() => {
          setOutputMode('a4');
          localStorage.setItem('yurist_preview_output_mode', 'a4');
        }}
        title="A4 Hujjat (Kitob va chop etish)"
      >
        <FileText size={14} />
        <span className="mode-tab-label-full">A4 Hujjat</span>
        <span className="mode-tab-label-short">A4</span>
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={outputMode === 'cards'}
        className={`output-mode-tab ${outputMode === 'cards' ? 'active' : ''}`}
        onClick={() => {
          setOutputMode('cards');
          localStorage.setItem('yurist_preview_output_mode', 'cards');
        }}
        title="9:16 O‘quv kartalari (Mobil taqdimot va vizual kartalar)"
      >
        <Layout size={14} />
        <span className="mode-tab-label-full">9:16 Kartalar</span>
        <span className="mode-tab-label-short">Kartalar</span>
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={outputMode === 'reader'}
        className={`output-mode-tab ${outputMode === 'reader' ? 'active' : ''}`}
        onClick={() => {
          setOutputMode('reader');
          localStorage.setItem('yurist_preview_output_mode', 'reader');
        }}
        title="O‘quvchi (Uzluksiz qulay o‘qish)"
      >
        <BookOpen size={14} />
        <span className="mode-tab-label-full">O‘quvchi</span>
        <span className="mode-tab-label-short">O‘quvchi</span>
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={outputMode === 'exam'}
        className={`output-mode-tab ${outputMode === 'exam' ? 'active' : ''}`}
        onClick={() => {
          setOutputMode('exam');
          localStorage.setItem('yurist_preview_output_mode', 'exam');
        }}
        title="Imtihon Trenajyori (Oraliq takrorlash - SM-2)"
      >
        <GraduationCap size={14} />
        <span className="mode-tab-label-full">Imtihon (SM-2)</span>
        <span className="mode-tab-label-short">Imtihon</span>
      </button>
    </div>
  );

  if (isPrintHost) {
    if (printLayout === 'cards') {
      return (
        <StylesProvider styles={styles} isDark={currentTheme === 'dark'}>
          <div className={`print-cards-host doc-theme-${currentTheme}`}>
            {cards.map((c) => renderCard(c, 1, false))}
          </div>
        </StylesProvider>
      );
    }
    return (
      <StylesProvider styles={styles} isDark={currentTheme === 'dark'}>
        <A4Document
          document={doc}
          activeTheme={currentTheme}
          blockOverrides={blockOverrides}
          isPrintHost={true}
        />
      </StylesProvider>
    );
  }

  if (outputMode === 'exam') {
    return (
      <div className={`preview-container doc-theme-${currentTheme} exam-preview-host`}>
        <div className="output-view-mode-bar no-print">
          {renderOutputModeTabs()}
        </div>
        <ExamTrainer
          document={doc}
          activeTheme={currentTheme}
          onOpenAiIngestion={onOpenAiIngestion}
          onJumpToSourceLine={onJumpToSourceLine}
        />
      </div>
    );
  }

  if (outputMode === 'reader') {
    return (
      <StylesProvider styles={styles} isDark={currentTheme === 'dark'}>
        <div
          className={`preview-container doc-theme-${currentTheme} reader-preview-host`}
          onClick={handleCanvasClick}
          onMouseOver={handleCanvasMouseOver}
          onMouseOut={handleCanvasMouseOut}
        >
          <div className="output-view-mode-bar no-print">
            {renderOutputModeTabs()}
          </div>
          <ScreenReaderView
            document={doc}
            activeTheme={currentTheme}
            blockOverrides={blockOverrides}
            onOpenStylePopover={handleOpenBlockPopover}
          />

          {/* Canvas Floating Toolbar */}
          <CanvasFloatingToolbar
            position={toolbarPos}
            sourceLine={activeEditing?.sourceLine}
            activeColor={activeStyleColor}
            activeSize={activeStyleSize}
            onFormat={handleApplyFormat}
            onColorChange={handleColorChange}
            onSizeChange={handleSizeChange}
            onClearStyle={handleClearStyle}
            onJumpToSource={handleJumpToSource}
          />

          {/* Himoyalangan blok xabarnomasi (Protected Tooltip) */}
          {protectedTooltip && (
            <div
              className="canvas-protected-tooltip"
              style={{ top: `${protectedTooltip.top}px`, left: `${protectedTooltip.left}px` }}
            >
              <span>🔒 {protectedTooltip.message}</span>
            </div>
          )}

          {/* V-E: Qayta bog'lanmagan uslublar xabarnomasi (Recoverable List UI) */}
          {unresolvedStyles && unresolvedStyles.length > 0 && (
            <div className="unresolved-styles-banner" role="status" aria-live="polite">
              <div className="unresolved-styles-badge">
                <AlertTriangle size={14} className="unresolved-alert-icon" />
                <span>{unresolvedStyles.length} ta uslub qayta bog‘lanmadi</span>
              </div>
              <button
                type="button"
                className="unresolved-styles-toggle-btn"
                onClick={() => setShowUnresolvedList(!showUnresolvedList)}
              >
                {showUnresolvedList ? 'Yopish' : 'Ko‘rish'}
              </button>

              {showUnresolvedList && (
                <div className="unresolved-styles-popover">
                  <div className="unresolved-styles-header">
                    <span>Qayta bog‘lanmagan uslublar</span>
                    <button
                      type="button"
                      className="unresolved-styles-close-btn"
                      onClick={() => setShowUnresolvedList(false)}
                    >
                      ✕
                    </button>
                  </div>
                  <div className="unresolved-styles-list">
                    {unresolvedStyles.map((ann) => (
                      <div key={ann.id} className="unresolved-style-item">
                        <span className="unresolved-style-quote">«{ann.quote.exact}»</span>
                        <span className="unresolved-style-desc">
                          {ann.properties.color ? `rang: ${ann.properties.color}` : ''}
                          {ann.properties.size ? ` ${ann.properties.size}` : ''}
                          {ann.properties.underline ? ' chizilgan' : ''}
                        </span>
                        <button
                          type="button"
                          className="unresolved-style-dismiss-btn"
                          title="Uslubni o'chirish"
                          onClick={() => handleDismissUnresolved(ann.id)}
                        >
                          O‘chirish
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Per-Block Style Controls Popover */}
          {activeBlockPopover && (
            <BlockStylePopover
              block={activeBlockPopover.block}
              anchorRect={activeBlockPopover.anchorRect}
              currentOverride={getBlockOverride(activeBlockPopover.block.id) || {}}
              onUpdate={(override) => {
                if (activeBlockPopover.block.id) {
                  handleUpdateOverride(activeBlockPopover.block.id, override);
                }
              }}
              onReset={() => {
                if (activeBlockPopover.block.id) {
                  handleResetOverride(activeBlockPopover.block.id);
                }
              }}
              onClose={() => setActiveBlockPopover(null)}
            />
          )}
        </div>
      </StylesProvider>
    );
  }

  if (outputMode === 'a4') {
    const totalUnscaledHeight = a4PageCount * SHEET_HEIGHT + Math.max(0, a4PageCount - 1) * 24 + 48;

    return (
      <StylesProvider styles={styles} isDark={currentTheme === 'dark'}>
        <div
          className={`preview-container doc-theme-${currentTheme} a4-preview-host`}
          onClick={handleCanvasClick}
          onMouseOver={handleCanvasMouseOver}
          onMouseOut={handleCanvasMouseOut}
        >
        <div className="output-view-mode-bar no-print">
          {renderOutputModeTabs()}

          {/* A4 Scaling Controls: Kenglikka / Sahifaga / 100% / Zoom +/- */}
          <div className="a4-scale-controls">
            <button
              type="button"
              className={`a4-scale-btn ${a4ScaleMode === 'fit-width' ? 'active' : ''}`}
              onClick={() => handleSetA4ScaleMode('fit-width')}
              title="Kenglikka moslash (Fit width)"
            >
              Kenglikka
            </button>
            <button
              type="button"
              className={`a4-scale-btn ${a4ScaleMode === 'fit-page' ? 'active' : ''}`}
              onClick={() => handleSetA4ScaleMode('fit-page')}
              title="Sahifaga moslash (Fit page)"
            >
              Sahifaga
            </button>
            <div className="a4-zoom-group">
              <button
                type="button"
                className="a4-zoom-btn"
                onClick={handleA4ZoomOut}
                title="Kichiklashtirish (-10%)"
                aria-label="Kichiklashtirish"
              >
                <ZoomOut size={13} />
              </button>
              <button
                type="button"
                className={`a4-zoom-label ${a4ScaleMode === '100%' ? 'active' : ''}`}
                onClick={() => handleSetA4ScaleMode('100%')}
                title="100% asl o‘lchamga qaytarish"
                aria-label="100% masshtab"
                style={{ background: 'none', border: 'none', cursor: 'pointer', font: 'inherit', color: 'inherit' }}
              >
                {Math.round(a4CalculatedScale * 100)}%
              </button>
              <button
                type="button"
                className="a4-zoom-btn"
                onClick={handleA4ZoomIn}
                title="Kattalashtirish (+10%)"
                aria-label="Kattalashtirish"
              >
                <ZoomIn size={13} />
              </button>
            </div>
          </div>


        </div>

        <div className="a4-scroll-viewport" ref={a4ViewportRef}>
          <div
            className="a4-scaling-sizer"
            style={{
              width: `${SHEET_WIDTH * a4CalculatedScale}px`,
              minHeight: `${totalUnscaledHeight * a4CalculatedScale}px`,
              margin: '0 auto',
              position: 'relative'
            }}
          >
            <div
              className="a4-scaling-wrapper"
              style={{
                width: `${SHEET_WIDTH}px`,
                transform: `scale(${a4CalculatedScale})`,
                transformOrigin: 'top left',
                position: 'absolute',
                top: 0,
                left: 0
              }}
            >
              <A4Document
                document={doc}
                activeTheme={currentTheme}
                blockOverrides={blockOverrides}
                onOpenStylePopover={handleOpenBlockPopover}
                isPrintHost={false}
                onPageCountChange={setA4PageCount}
              />
            </div>
          </div>
        </div>

        {/* Canvas Floating Toolbar */}
        <CanvasFloatingToolbar
          position={toolbarPos}
          sourceLine={activeEditing?.sourceLine}
          activeColor={activeStyleColor}
          activeSize={activeStyleSize}
          onFormat={handleApplyFormat}
          onColorChange={handleColorChange}
          onSizeChange={handleSizeChange}
          onClearStyle={handleClearStyle}
          onJumpToSource={handleJumpToSource}
        />

        {/* Himoyalangan blok xabarnomasi (Protected Tooltip) */}
        {protectedTooltip && (
          <div
            className="canvas-protected-tooltip"
            style={{ top: `${protectedTooltip.top}px`, left: `${protectedTooltip.left}px` }}
          >
            <span>🔒 {protectedTooltip.message}</span>
          </div>
        )}

        {/* Per-Block Style Controls Popover */}
        {activeBlockPopover && (
          <BlockStylePopover
            block={activeBlockPopover.block}
            anchorRect={activeBlockPopover.anchorRect}
            currentOverride={getBlockOverride(activeBlockPopover.block.id) || {}}
            onUpdate={(override) => {
              if (activeBlockPopover.block.id) {
                handleUpdateOverride(activeBlockPopover.block.id, override);
              }
            }}
            onReset={() => {
              if (activeBlockPopover.block.id) {
                handleResetOverride(activeBlockPopover.block.id);
              }
            }}
            onClose={() => setActiveBlockPopover(null)}
          />
        )}
          {/* V-E: Qayta bog'lanmagan uslublar xabarnomasi (Recoverable List UI) */}
          {unresolvedStyles && unresolvedStyles.length > 0 && (
            <div className="unresolved-styles-banner" role="status" aria-live="polite">
              <div className="unresolved-styles-badge">
                <AlertTriangle size={14} className="unresolved-alert-icon" />
                <span>{unresolvedStyles.length} ta uslub qayta bog‘lanmadi</span>
              </div>
              <button
                type="button"
                className="unresolved-styles-toggle-btn"
                onClick={() => setShowUnresolvedList(!showUnresolvedList)}
              >
                {showUnresolvedList ? 'Yopish' : 'Ko‘rish'}
              </button>

              {showUnresolvedList && (
                <div className="unresolved-styles-popover">
                  <div className="unresolved-styles-header">
                    <span>Qayta bog‘lanmagan uslublar</span>
                    <button
                      type="button"
                      className="unresolved-styles-close-btn"
                      onClick={() => setShowUnresolvedList(false)}
                    >
                      ✕
                    </button>
                  </div>
                  <div className="unresolved-styles-list">
                    {unresolvedStyles.map((ann) => (
                      <div key={ann.id} className="unresolved-style-item">
                        <span className="unresolved-style-quote">«{ann.quote.exact}»</span>
                        <span className="unresolved-style-desc">
                          {ann.properties.color ? `rang: ${ann.properties.color}` : ''}
                          {ann.properties.size ? ` ${ann.properties.size}` : ''}
                          {ann.properties.underline ? ' chizilgan' : ''}
                        </span>
                        <button
                          type="button"
                          className="unresolved-style-dismiss-btn"
                          title="Uslubni o'chirish"
                          onClick={() => handleDismissUnresolved(ann.id)}
                        >
                          O‘chirish
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </StylesProvider>
    );
  }

  return (
    <StylesProvider styles={styles} isDark={currentTheme === 'dark'}>
      <div
        ref={containerRef}
        className={`preview-container doc-theme-${currentTheme} mode-${scaleMode === '100%' ? '100' : scaleMode}`}
        data-document-theme={currentTheme}
        onClick={handleCanvasClick}
        onMouseOver={handleCanvasMouseOver}
        onMouseOut={handleCanvasMouseOut}
      >
      {/* Yuqori format tanlagich */}
      <div className="output-view-mode-bar output-view-mode-bar-cards no-print">
        {renderOutputModeTabs()}
      </div>

      {/* 1. Yuqori suzuvchi boshqaruv paneli (Floating Navigator - 40px Frosted White Pill) */}
      <div className="card-nav-floating preview-floating-navigator no-print" role="navigation" aria-label="Karta boshqaruvi">
        <button
          type="button"
          className="card-nav-circle-btn"
          onClick={() => scrollToCard(activeCardIndex - 1)}
          disabled={activeCardIndex <= 1}
          title="Oldingi karta"
          aria-label="Oldingi karta"
        >
          <ChevronLeft size={16} />
        </button>

        <span className="card-nav-counter">
          {activeCardIndex}/{cards.length} karta
        </span>

        <button
          type="button"
          className="card-nav-circle-btn"
          onClick={() => scrollToCard(activeCardIndex + 1)}
          disabled={activeCardIndex >= cards.length}
          title="Keyingi karta"
          aria-label="Keyingi karta"
        >
          <ChevronRight size={16} />
        </button>

        <div className="card-nav-divider card-nav-desktop-divider" />

        {/* Karta o'lchami va ko'rinish tanlagich (Desktop) */}
        <div className="card-size-selector card-size-selector-desktop">
          <button
            type="button"
            className={`card-size-btn ${scaleMode === 'fit' ? 'active' : ''}`}
            onClick={() => handleScaleModeChange('fit')}
            title="Ekranga to'liq moslashtirib ko'rsatish"
          >
            Moslash
          </button>
          <button
            type="button"
            className={`card-size-btn ${scaleMode === '100%' ? 'active' : ''}`}
            onClick={() => handleScaleModeChange('100%')}
            title="Asl 100% o'lchamda ko'rish"
          >
            100%
          </button>
          <button
            type="button"
            className={`card-size-btn ${scaleMode === 'fit-width' ? 'active' : ''}`}
            onClick={() => handleScaleModeChange('fit-width')}
            title="Kenglik bo'yicha moslashtirish"
          >
            Kenglikka
          </button>

          <div className="card-nav-divider" />

          <button
            type="button"
            className="card-size-btn card-fullscreen-btn"
            onClick={enterFullscreen}
            title="To'liq ekran taqdimot rejimi"
          >
            <Maximize2 size={13} /> Fullscreen
          </button>
        </div>

        {/* Mobil / ixcham ko'rinish uchun parametrlar popoveri (Mobile / Compact) */}
        <div className="card-nav-overflow-wrap" ref={navOverflowRef}>
          <button
            type="button"
            className={`card-nav-circle-btn card-nav-overflow-btn ${isNavOverflowOpen ? 'active' : ''}`}
            onClick={() => setIsNavOverflowOpen((prev) => !prev)}
            title="Karta ko‘rinishi va masshtabi"
            aria-label="Karta parametrlari"
            aria-expanded={isNavOverflowOpen}
          >
            <MoreVertical size={16} />
          </button>

          {isNavOverflowOpen && (
            <div className="card-nav-overflow-popover">
              <div className="card-nav-popover-header">Masshtab</div>
              <button
                type="button"
                className={`card-size-btn ${scaleMode === 'fit' ? 'active' : ''}`}
                onClick={() => {
                  handleScaleModeChange('fit');
                  setIsNavOverflowOpen(false);
                }}
              >
                Moslash
              </button>
              <button
                type="button"
                className={`card-size-btn ${scaleMode === '100%' ? 'active' : ''}`}
                onClick={() => {
                  handleScaleModeChange('100%');
                  setIsNavOverflowOpen(false);
                }}
              >
                100%
              </button>
              <button
                type="button"
                className={`card-size-btn ${scaleMode === 'fit-width' ? 'active' : ''}`}
                onClick={() => {
                  handleScaleModeChange('fit-width');
                  setIsNavOverflowOpen(false);
                }}
              >
                Kenglikka
              </button>
              <div className="card-nav-popover-divider" />
              <button
                type="button"
                className="card-size-btn card-fullscreen-btn"
                onClick={() => {
                  enterFullscreen();
                  setIsNavOverflowOpen(false);
                }}
              >
                <Maximize2 size={13} /> Fullscreen
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 2. lar Ro'yxati */}
      {cards.map((card) => renderCard(card, currentScale))}

      {/* 3. TO'LIQ EKRAN TAQDIMOT REJIMI (Fullscreen Presentation Mode) */}
      {isFullscreen && (
        <div
          className={`fullscreen-presentation-overlay doc-theme-${currentTheme}`}
          data-document-theme={currentTheme}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          role="dialog"
          aria-label="To'liq ekran taqdimot rejimi"
        >
          {/* Yuqori panel: Karta hisoblagichi va Chiqish tugmasi */}
          <div className="fullscreen-topbar">
            <span className="fullscreen-counter">
              {String(activeCardIndex).padStart(2, '0')} / {String(cards.length).padStart(2, '0')}
            </span>
            <button
              type="button"
              className="fullscreen-close-btn"
              onClick={exitFullscreen}
              title="Chiqish (Esc)"
              aria-label="Taqdimot rejimidan chiqish"
            >
              <X size={20} />
            </button>
          </div>

          {/* O'rtada: Yagona karta */}
          <div className="fullscreen-card-container">
            {/* Bosish zonalari (Taqdimotda chap/o'ng bosilsa varoqlaydi) */}
            <div
              className="fullscreen-tap-zone fullscreen-tap-left"
              onClick={() => setActiveCardIndex((prev) => Math.max(1, prev - 1))}
              title="Oldingi karta"
            />
            <div
              className="fullscreen-tap-zone fullscreen-tap-right"
              onClick={() => setActiveCardIndex((prev) => Math.min(cards.length, prev + 1))}
              title="Keyingi karta"
            />

            {/* Oldingi karta tugmasi */}
            <button
              type="button"
              className="fullscreen-nav-btn fullscreen-nav-prev"
              onClick={() => setActiveCardIndex((prev) => Math.max(1, prev - 1))}
              disabled={activeCardIndex <= 1}
              title="Oldingi karta (←)"
            >
              <ChevronLeft size={28} />
            </button>

            {/* Joriy aktiv karta */}
            {cards[activeCardIndex - 1] && (
              <div
                className={`fullscreen-card-wrapper doc-theme-${currentTheme}`}
                data-document-theme={currentTheme}
              >
                {renderCard(cards[activeCardIndex - 1], fullscreenScale, true)}
              </div>
            )}

            {/* Keyingi karta tugmasi */}
            <button
              type="button"
              className="fullscreen-nav-btn fullscreen-nav-next"
              onClick={() => setActiveCardIndex((prev) => Math.min(cards.length, prev + 1))}
              disabled={activeCardIndex >= cards.length}
              title="Keyingi karta (→)"
            >
              <ChevronRight size={28} />
            </button>
          </div>
        </div>
      )}

      {/* Offscreen Measurement Container (A talabi bo'yicha haqiqiy brauzer layout o'lchamlari) */}
      <div
        ref={measurerRef}
        className="no-print"
        style={{
          position: 'fixed',
          top: -99999,
          left: -99999,
          width: '1080px',
          visibility: 'hidden',
          pointerEvents: 'none',
          zIndex: -100
        }}
        aria-hidden="true"
      >
        <div
          className={`pagination-measurer pagination-measurer-card doc-theme-${currentTheme}`}
          data-document-theme={currentTheme}
          data-measurer="true"
          aria-hidden="true"
          style={{ position: 'relative', width: 1080, height: 'auto', minHeight: 0, maxHeight: 'none', transform: 'none', padding: '80px 70px', boxSizing: 'border-box' }}
        >
          <div className="card-content-area" style={{ width: 940 }}>
            {(doc.sections || []).map((sec, sIdx) => (
              <React.Fragment key={sec.id || sIdx}>
                <div data-measure-sec={sec.title} className="card-section-header">
                  <h2 className="card-section-title"><FormattedText text={sec.title} /></h2>
                  {sec.subtitle && <p className="card-section-subtitle"><FormattedText text={sec.subtitle} /></p>}
                </div>
                {(sec.blocks || []).map((block, bIdx) => {
                  const bId = block.id || `blk-${sIdx}-${bIdx}`;
                  const override = getBlockOverride(bId);
                  if (block.type === 'table') {
                    return (
                      <React.Fragment key={bId}>
                        <div data-measure-tbl-head={bId} className="table-wrapper">
                          {block.title && <div className="table-caption">{block.title}</div>}
                          <table className="study-table" data-col-count={(block.headers || []).length}>
                            <thead>
                              <tr>
                                {(block.headers || []).map((h, i) => <th key={i}>{h}</th>)}
                              </tr>
                            </thead>
                          </table>
                        </div>
                        <table className="study-table" data-col-count={(block.headers || []).length} style={{ width: '100%' }}>
                          <tbody>
                            {(block.rows || []).map((row, rIdx) => (
                              <tr key={rIdx} data-measure-tbl-row={bId} data-row-idx={rIdx}>
                                {row.map((cell, cIdx) => <td key={cIdx}>{cell}</td>)}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </React.Fragment>
                    );
                  }
                  if (block.type === 'list') {
                    return (
                      <ul key={bId} className="study-list">
                        {(block.items || []).map((it, iIdx) => (
                          <li key={iIdx} data-measure-lst-item={bId} data-item-idx={iIdx} className="study-list-item">
                            <FormattedText text={it} />
                          </li>
                        ))}
                      </ul>
                    );
                  }
                  if (block.type === 'norm') {
                    const paras = (block.text || '').split(/\n+/).filter(Boolean);
                    const sizeClass = override?.size === 'S' ? 'block-size-s' : override?.size === 'L' ? 'block-size-l' : '';
                    return (
                      <div key={bId} className={`norm-plaque ${sizeClass}`.trim()}>
                        {paras.map((p, pIdx) => (
                          <div key={pIdx} data-measure-norm-p={bId} data-p-idx={pIdx} className="norm-body">
                            <FormattedText text={p} />
                          </div>
                        ))}
                      </div>
                    );
                  }
                  return (
                    <div key={bId} data-measure-block={bId}>
                      <BlockRenderer block={block} override={override} />
                    </div>
                  );
                })}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>

      {/* 4. Canvas Floating Toolbar */}
      <CanvasFloatingToolbar
        position={toolbarPos}
        sourceLine={activeEditing?.sourceLine}
        activeColor={activeStyleColor}
        activeSize={activeStyleSize}
        onFormat={handleApplyFormat}
        onColorChange={handleColorChange}
        onSizeChange={handleSizeChange}
        onClearStyle={handleClearStyle}
        onJumpToSource={handleJumpToSource}
      />

      {/* 5. Himoyalangan blok xabarnomasi (Protected Tooltip) */}
      {protectedTooltip && (
        <div
          className="canvas-protected-tooltip"
          style={{ top: `${protectedTooltip.top}px`, left: `${protectedTooltip.left}px` }}
        >
          <span>🔒 {protectedTooltip.message}</span>
        </div>
      )}

      {/* 6. Per-Block Style Controls Popover (Task 8) */}
      {activeBlockPopover && (
        <BlockStylePopover
          block={activeBlockPopover.block}
          anchorRect={activeBlockPopover.anchorRect}
          currentOverride={getBlockOverride(activeBlockPopover.block.id) || {}}
          onUpdate={(override) => {
            if (activeBlockPopover.block.id) {
              handleUpdateOverride(activeBlockPopover.block.id, override);
            }
          }}
          onReset={() => {
            if (activeBlockPopover.block.id) {
              handleResetOverride(activeBlockPopover.block.id);
            }
          }}
          onClose={() => setActiveBlockPopover(null)}
        />
      )}
      {/* V-E: Qayta bog'lanmagan uslublar xabarnomasi (Recoverable List UI) */}
      {unresolvedStyles && unresolvedStyles.length > 0 && (
        <div className="unresolved-styles-banner" role="status" aria-live="polite">
          <div className="unresolved-styles-badge">
            <AlertTriangle size={14} className="unresolved-alert-icon" />
            <span>{unresolvedStyles.length} ta uslub qayta bog‘lanmadi</span>
          </div>
          <button
            type="button"
            className="unresolved-styles-toggle-btn"
            onClick={() => setShowUnresolvedList(!showUnresolvedList)}
          >
            {showUnresolvedList ? 'Yopish' : 'Ko‘rish'}
          </button>

          {showUnresolvedList && (
            <div className="unresolved-styles-popover">
              <div className="unresolved-styles-header">
                <span>Qayta bog‘lanmagan uslublar</span>
                <button
                  type="button"
                  className="unresolved-styles-close-btn"
                  onClick={() => setShowUnresolvedList(false)}
                >
                  ✕
                </button>
              </div>
              <div className="unresolved-styles-list">
                {unresolvedStyles.map((ann) => (
                  <div key={ann.id} className="unresolved-style-item">
                    <span className="unresolved-style-quote">«{ann.quote.exact}»</span>
                    <span className="unresolved-style-desc">
                      {ann.properties.color ? `rang: ${ann.properties.color}` : ''}
                      {ann.properties.size ? ` ${ann.properties.size}` : ''}
                      {ann.properties.underline ? ' chizilgan' : ''}
                    </span>
                    <button
                      type="button"
                      className="unresolved-style-dismiss-btn"
                      title="Uslubni o'chirish"
                      onClick={() => handleDismissUnresolved(ann.id)}
                    >
                      O‘chirish
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  </StylesProvider>
  );
}, (prev, next) => {
  return (
    prev.document === next.document &&
    prev.activeTheme === next.activeTheme &&
    prev.forceShowAnswer === next.forceShowAnswer &&
    prev.isPrintHost === next.isPrintHost &&
    prev.printLayout === next.printLayout &&
    prev.outputMode === next.outputMode &&
    prev.rawMdText === next.rawMdText &&
    prev.blockOverrides === next.blockOverrides &&
    prev.styles === next.styles
  );
});

export default DocumentPreview;
