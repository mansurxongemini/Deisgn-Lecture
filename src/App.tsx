import React, { useState, useEffect, useLayoutEffect, useMemo, useRef, useDeferredValue } from 'react';
import { parseMarkdownPlus } from './schema/mdParser';
import type { ThemeName, BlockStyleOverride, BlockStyleOverridesMap } from './schema/types';
import type { FolderItem, DocumentItem, WorkspaceMeta } from './schema/workspace';
import type { StyleAnnotation } from './schema/styleAnnotation';
import { DocumentPreview } from './components/preview/DocumentPreview';
import { MdEditor } from './components/editor/MdEditor';
import { GuidePage } from './components/guide/GuidePage';
import { OnboardingModal } from './components/onboarding/OnboardingModal';
import { Sidebar } from './components/sidebar/Sidebar';
import { CommandPalette } from './components/palette/CommandPalette';
import { generateAiInstructions } from './services/aiGuide';
import {
  initWorkspace,
  getAllFolders,
  getAllDocuments,
  getDocument,
  saveDocument,
  saveFolder,
  deleteDocument,
  deleteFolder,
  getWorkspaceMeta,
  saveWorkspaceMeta,
  saveSnapshot
} from './services/workspace/workspaceStorage';
import { canMoveFolder, getBreadcrumbPath } from './services/workspace/treeOps';
import { exportWorkspaceToZip, importWorkspaceFromZip } from './services/workspace/zipBackup';
import { workspaceChannel } from './services/workspace/channel';

import sampleConstitution from './samples/constitutional_law.md?raw';
import sampleCivil from './samples/civil_law.md?raw';
import type { SampleDocItem } from './samples/catalog';

import {
  Printer,
  HelpCircle,
  CheckCircle,
  BookOpen,
  PanelLeft,
  Download,
  FileDown,
  Archive,
  Upload,
  FilePlus,
  BookMarked,
  AlertTriangle,
  Menu,
  X,
  MoreHorizontal,
  ArrowLeft,
  Layout,
  Sparkles,
  GraduationCap
} from 'lucide-react';

import { SmartIngestionModal } from './components/editor/SmartIngestionModal';
import { getCustomStyles, loadCustomStyles, applyCustomStyle, type CustomStyle } from './design/customStyles';
import { resetAll } from './design/applyTokens';
import './tokens/typography.css';
import './tokens/themes.css';
import './components/blocks/blocks.css';
import './App.css';

export const App: React.FC = () => {
  const [folders, setFolders] = useState<FolderItem[]>([]);
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [activeDocId, setActiveDocId] = useState<string | null>(null);
  const [meta, setMeta] = useState<WorkspaceMeta>({
    lastBackupAt: null,
    lastActiveDocId: null,
    recentDocIds: []
  });

  const [mdText, setMdText] = useState<string>(sampleConstitution);
  const [theme, setTheme] = useState<ThemeName>('classic');
  const [windowWidth, setWindowWidth] = useState<number>(() => {
    return typeof window !== 'undefined' ? window.innerWidth : 1440;
  });
  const [viewMode, setViewMode] = useState<'both' | 'edit' | 'preview'>(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 1280) {
      return 'preview';
    }
    return 'both';
  });
  const [currentView, setCurrentView] = useState<'studio' | 'guide'>('studio');
  const [selectedWarningCode, setSelectedWarningCode] = useState<string | null>(null);
  const [showOnboarding, setShowOnboarding] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [undoToast, setUndoToast] = useState<{ message: string; onUndo: () => void } | null>(null);

  // Popover menus
  const [isExportMenuOpen, setIsExportMenuOpen] = useState<boolean>(false);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState<boolean>(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const [isGlobalSmartIngestOpen, setIsGlobalSmartIngestOpen] = useState<boolean>(false);
  const [printLayout, setPrintLayout] = useState<'a4' | 'cards'>('a4');
  const [previewOutputMode, setPreviewOutputMode] = useState<'a4' | 'reader' | 'cards' | 'exam'>(() => {
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


  // Saving status (saved | saving | unsaved | conflict | error)
  type SaveStatus = 'saved' | 'saving' | 'unsaved' | 'conflict' | 'error';
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('saved');
  const dirtyDocIdRef = useRef<string | null>(null);
  const pendingSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activeDocIdRef = useRef<string | null>(null);
  const mdTextRef = useRef<string>(sampleConstitution);
  const switchSeqRef = useRef<number>(0);
  const [conflictDoc, setConflictDoc] = useState<{ id: string; remoteContent: string } | null>(null);

  // Synchronize mutable refs safely via useLayoutEffect
  useLayoutEffect(() => {
    activeDocIdRef.current = activeDocId;
    mdTextRef.current = mdText;
  }, [activeDocId, mdText]);

  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(() => {
    if (typeof window !== 'undefined' && window.innerWidth <= 768) {
      return false;
    }
    const saved = localStorage.getItem('yurist_sidebar_open');
    return saved !== null ? saved === 'true' : true;
  });

  const [isPaletteOpen, setIsPaletteOpen] = useState<boolean>(false);


  const exportMenuRef = useRef<HTMLDivElement>(null);
  const moreMenuRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);


  // Ekran o'lchami o'zgarganda: 1280px dan pastda alohida tablar (Yozish / Ko'rish), 768px da drawer
  useEffect(() => {
    const handleResize = () => {
      const w = window.innerWidth;
      setWindowWidth(w);
      if (w < 1280) {
        setViewMode((prev) => (prev === 'both' ? 'preview' : prev));
      }
      if (w <= 768) {
        setIsSidebarOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);


  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(e.target as Node)) {
        setIsExportMenuOpen(false);
      }
      if (moreMenuRef.current && !moreMenuRef.current.contains(e.target as Node)) {
        setIsMoreMenuOpen(false);
      }
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(e.target as Node)) {
        setIsMobileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Boshlang'ich yuklash: Workspace IndexedDB omborini tekshirish va ishga tushirish
  useEffect(() => {
    async function loadWorkspace() {
      try {
        const { defaultDocId } = await initWorkspace(sampleCivil, sampleConstitution);
        const [loadedFolders, loadedDocs, loadedMeta] = await Promise.all([
          getAllFolders(),
          getAllDocuments(),
          getWorkspaceMeta()
        ]);

        setFolders(loadedFolders);
        setDocuments(loadedDocs);
        setMeta(loadedMeta);

        const targetId = loadedMeta.lastActiveDocId && loadedDocs.some((d) => d.id === loadedMeta.lastActiveDocId)
          ? loadedMeta.lastActiveDocId
          : defaultDocId;

        const activeDoc = loadedDocs.find((d) => d.id === targetId) || loadedDocs[0];
        if (activeDoc) {
          setActiveDocId(activeDoc.id);
          const emergencyDraft = localStorage.getItem(`yurist_unsaved_draft_${activeDoc.id}`);
          if (emergencyDraft && emergencyDraft !== activeDoc.content) {
            activeDoc.content = emergencyDraft;
            setMdText(emergencyDraft);
            localStorage.removeItem(`yurist_unsaved_draft_${activeDoc.id}`);
          } else {
            setMdText(activeDoc.content);
          }

          const styles = await loadCustomStyles();
          const parsed = parseMarkdownPlus(activeDoc.content);
          const styleTarget = activeDoc.customStyleId || activeDoc.customStyleName || parsed.document.customStyle;

          let matchedStyle: CustomStyle | undefined;
          if (styleTarget) {
            matchedStyle = styles.find((s) => s.id === styleTarget || s.name.toLowerCase() === styleTarget.toLowerCase());
          }

          if (matchedStyle) {
            await applyCustomStyle(matchedStyle);
          } else if (activeDoc.theme) {
            setTheme(activeDoc.theme as ThemeName);
          }
        }
      } catch (err) {
        console.error('Workspace yuklashda xatolik:', err);
      }
    }

    loadWorkspace();

    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('intro') === '1') {
      setShowOnboarding(true);
    }

    // Favqulodda xavfsizlik: oyna to'satdan yopilganda saqlanmagan qoralamani zaxiralash
    const handleBeforeUnload = () => {
      const curId = activeDocIdRef.current;
      if (curId && dirtyDocIdRef.current === curId) {
        try {
          localStorage.setItem(`yurist_unsaved_draft_${curId}`, mdTextRef.current);
        } catch {
          // localStorage to'lgan bo'lsa xavfsiz o'tib ketiladi
        }
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  // Multi-tab BroadcastChannel sinxronizatsiyasi va ziddiyat (conflict) himoyasi
  useEffect(() => {
    const unsubscribe = workspaceChannel.subscribe(async (event) => {
      if (event.type === 'DOC_UPDATED') {
        const curActiveId = activeDocIdRef.current;
        if (event.docId === curActiveId) {
          const currentDoc = documents.find((d) => d.id === curActiveId);
          const hasDirtyDraft =
            dirtyDocIdRef.current === curActiveId ||
            (currentDoc && currentDoc.content !== mdTextRef.current) ||
            saveStatus === 'unsaved';

          // Agar joriy tabda saqlanmagan mahalliy tahrir bo'lsa, ziddiyat deb belgilaymiz va USTIGA YOZMAYMIZ!
          if (hasDirtyDraft) {
            const remote = await getDocument(event.docId);
            if (remote && remote.content !== mdTextRef.current) {
              setSaveStatus('conflict');
              setConflictDoc({ id: event.docId, remoteContent: remote.content });
              showToast('Boshqa oynada o‘zgarish kiritildi! Mahalliy qoralama saqlab qolindi.');
              return;
            }
          }

          const updated = await getDocument(event.docId);
          if (updated && activeDocIdRef.current === event.docId) {
            mdTextRef.current = updated.content;
            setMdText(updated.content);
            setSaveStatus('saved');
          }
        }
        const allDocs = await getAllDocuments();
        setDocuments(allDocs);
      } else if (event.type === 'WORKSPACE_CHANGED') {
        const [allFolders, allDocs] = await Promise.all([getAllFolders(), getAllDocuments()]);
        setFolders(allFolders);
        setDocuments(allDocs);
      }
    });

    return unsubscribe;
  }, [activeDocId, mdText, documents, saveStatus]);

  // Global klaviatura yorliqlari (Ctrl+B, Ctrl+K, Ctrl+N, Ctrl+E)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const modifier = isMac ? e.metaKey : e.ctrlKey;

      if (modifier && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        setIsSidebarOpen((prev) => {
          const next = !prev;
          localStorage.setItem('yurist_sidebar_open', String(next));
          return next;
        });
      } else if (modifier && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsPaletteOpen((prev) => !prev);
      } else if (modifier && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        handleCreateDoc();
      } else if (modifier && e.key.toLowerCase() === 'e') {
        e.preventDefault();
        setViewMode((prev) => {
          if (prev === 'both') return 'edit';
          if (prev === 'edit') return 'preview';
          return 'both';
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [folders, documents, activeDocId]);

  const documentsRef = useRef(documents);
  useEffect(() => {
    documentsRef.current = documents;
  }, [documents]);

  const saveStatusRef = useRef(saveStatus);
  useEffect(() => {
    saveStatusRef.current = saveStatus;
  }, [saveStatus]);

  // Hujjat matni o'zgarganda IndexedDB'ga saqlash (debounce 1200ms — yozish to'xtagach)
  useEffect(() => {
    if (!activeDocId) return;

    const currentDoc = documentsRef.current.find((d) => d.id === activeDocId);
    if (!currentDoc) return;

    // Matn o'zgarmagan bo'lsa
    if (currentDoc.content === mdText) {
      if (saveStatusRef.current !== 'saving' && saveStatusRef.current !== 'conflict') {
        setSaveStatus('saved');
      }
      dirtyDocIdRef.current = null;
      return;
    }

    // Ziddiyat (conflict) holatida avtomatik yozib yuborishni to'xtatamiz
    if (saveStatusRef.current === 'conflict' || conflictDoc !== null) {
      return;
    }

    dirtyDocIdRef.current = activeDocId;
    if (saveStatusRef.current !== 'unsaved') {
      setSaveStatus('unsaved');
    }

    if (pendingSaveTimerRef.current) {
      clearTimeout(pendingSaveTimerRef.current);
    }

    const targetDocId = activeDocId;

    pendingSaveTimerRef.current = setTimeout(async () => {
      try {
        if (activeDocIdRef.current !== targetDocId) return;
        setSaveStatus('saving');
        const textToSave = mdTextRef.current;
        const docToSave = documentsRef.current.find((d) => d.id === targetDocId);
        if (docToSave && docToSave.content !== textToSave) {
          const updated: DocumentItem = {
            ...docToSave,
            content: textToSave,
            updatedAt: Date.now()
          };
          await saveDocument(updated);
          await saveSnapshot(targetDocId, textToSave);
          setDocuments((prev) => prev.map((d) => (d.id === targetDocId ? updated : d)));
          workspaceChannel.broadcastDocUpdated(targetDocId);
        }
        if (activeDocIdRef.current === targetDocId) {
          if (mdTextRef.current === textToSave) {
            dirtyDocIdRef.current = null;
            setSaveStatus('saved');
          } else {
            // Agar saqlash jarayonida foydalanuvchi yangi harf yozgan bo'lsa, qoralama holatini saqlab qolamiz
            dirtyDocIdRef.current = targetDocId;
            setSaveStatus('unsaved');
          }
        }
      } catch (err) {
        console.error('Saqlashda xatolik:', err);
        if (activeDocIdRef.current === targetDocId) {
          setSaveStatus('error');
        }
      }
    }, 1000);

    return () => {
      if (pendingSaveTimerRef.current) {
        clearTimeout(pendingSaveTimerRef.current);
      }
    };
  }, [mdText, activeDocId, conflictDoc]);

  // Saqlash xatoligi bo'lganda qayta urinish
  const handleRetrySave = async () => {
    if (!activeDocId) return;
    setSaveStatus('saving');
    try {
      const currentDoc = documents.find((d) => d.id === activeDocId);
      if (currentDoc) {
        const updated: DocumentItem = {
          ...currentDoc,
          content: mdText,
          updatedAt: Date.now()
        };
        await saveDocument(updated);
        await saveSnapshot(activeDocId, mdText);
        setDocuments((prev) => prev.map((d) => (d.id === activeDocId ? updated : d)));
        workspaceChannel.broadcastDocUpdated(activeDocId);
      }
      dirtyDocIdRef.current = null;
      setSaveStatus('saved');
      showToast('Hujjat saqlandi!');
    } catch {
      setSaveStatus('error');
      showToast('Saqlashda xatolik yuz berdi');
    }
  };

  // Ziddiyatni (Conflict) hal qilish amallari
  const handleKeepMyDraft = async () => {
    if (!activeDocId) return;
    try {
      setSaveStatus('saving');
      const cur = documents.find((d) => d.id === activeDocId);
      if (cur) {
        const updated = { ...cur, content: mdText, updatedAt: Date.now() };
        await saveDocument(updated);
        await saveSnapshot(activeDocId, mdText);
        setDocuments((prev) => prev.map((d) => (d.id === activeDocId ? updated : d)));
        workspaceChannel.broadcastDocUpdated(activeDocId);
      }
      dirtyDocIdRef.current = null;
      setConflictDoc(null);
      setSaveStatus('saved');
      showToast('Mahalliy qoralama saqlandi!');
    } catch {
      setSaveStatus('error');
    }
  };

  const handleAdoptRemote = () => {
    if (!conflictDoc) return;
    setMdText(conflictDoc.remoteContent);
    dirtyDocIdRef.current = null;
    setConflictDoc(null);
    setSaveStatus('saved');
    showToast('Tashqi tahrir qabul qilindi.');
  };

  const handleSaveAsCopy = async () => {
    if (!activeDocId) return;
    try {
      const cur = documents.find((d) => d.id === activeDocId);
      const title = `${cur?.title || 'Hujjat'} (mahalliy nusxa)`;
      const now = Date.now();
      const newDoc: DocumentItem = {
        id: `doc_${now}_${Math.random().toString(36).substring(2, 7)}`,
        parentId: cur?.parentId || null,
        title,
        content: mdText,
        order: documents.length,
        createdAt: now,
        updatedAt: now
      };
      await saveDocument(newDoc);
      setDocuments((prev) => [...prev, newDoc]);
      workspaceChannel.broadcastWorkspaceChanged('CREATE_DOC');

      if (conflictDoc) {
        setMdText(conflictDoc.remoteContent);
      }
      dirtyDocIdRef.current = null;
      setConflictDoc(null);
      setSaveStatus('saved');
      showToast(`«${title}» yangi hujjat sifatida saqlandi!`);
    } catch {
      setSaveStatus('error');
    }
  };

  // Undo xabarnomasi taymeri (7 soniya)
  useEffect(() => {
    if (!undoToast) return;
    const timer = setTimeout(() => {
      setUndoToast(null);
    }, 7000);
    return () => clearTimeout(timer);
  }, [undoToast]);

  // ---------------------------------------------------------------------------
  // Per-block style overrides state & persistence (Task 8)
  // ---------------------------------------------------------------------------
  const [localBlockOverrides, setLocalBlockOverrides] = useState<BlockStyleOverridesMap>({});

  const activeDoc = useMemo(() => {
    return documents.find((d) => d.id === activeDocId);
  }, [documents, activeDocId]);

  const effectiveBlockOverrides: BlockStyleOverridesMap = useMemo(() => {
    return activeDoc?.blockOverrides || localBlockOverrides;
  }, [activeDoc?.blockOverrides, localBlockOverrides]);

  const handleUpdateBlockOverride = async (blockId: string, override: BlockStyleOverride) => {
    if (!activeDocId) {
      setLocalBlockOverrides((prev) => ({
        ...prev,
        [blockId]: {
          ...(prev[blockId] || {}),
          ...override
        }
      }));
      return;
    }

    const currentDoc = documents.find((d) => d.id === activeDocId);
    if (!currentDoc) return;
    const currentOverrides = currentDoc.blockOverrides || {};
    const updatedOverrides = {
      ...currentOverrides,
      [blockId]: {
        ...(currentOverrides[blockId] || {}),
        ...override
      }
    };

    const updatedDoc: DocumentItem = {
      ...currentDoc,
      blockOverrides: updatedOverrides,
      updatedAt: Date.now()
    };

    await saveDocument(updatedDoc);
    setDocuments((prev) => prev.map((d) => (d.id === activeDocId ? updatedDoc : d)));
    workspaceChannel.broadcastDocUpdated(activeDocId);
  };

  const handleResetBlockOverride = async (blockId: string) => {
    if (!activeDocId) {
      setLocalBlockOverrides((prev) => {
        const copy = { ...prev };
        delete copy[blockId];
        return copy;
      });
      return;
    }

    const currentDoc = documents.find((d) => d.id === activeDocId);
    if (!currentDoc) return;
    const currentOverrides = { ...(currentDoc.blockOverrides || {}) };
    delete currentOverrides[blockId];

    const updatedDoc: DocumentItem = {
      ...currentDoc,
      blockOverrides: currentOverrides,
      updatedAt: Date.now()
    };

    await saveDocument(updatedDoc);
    setDocuments((prev) => prev.map((d) => (d.id === activeDocId ? updatedDoc : d)));
    workspaceChannel.broadcastDocUpdated(activeDocId);
  };

  // Katta hujjatlarda (1000-2000 qator) matn yozish paytida muharrir kechikishsiz (0ms)
  // ishlashi uchun preview renderini yozish to'xtaguncha (300ms) kechiktiramiz
  const [debouncedPreviewText, setDebouncedPreviewText] = useState(mdText);
  const previewDebounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Agar matn keskin o'zgargan bo'lsa (namuna ochilganda yoki hujjat almashganda), darhol o'tkazamiz
    const prevLen = debouncedPreviewText ? debouncedPreviewText.length : 0;
    const curLen = mdText ? mdText.length : 0;
    if (Math.abs(curLen - prevLen) > 80 || !debouncedPreviewText) {
      setDebouncedPreviewText(mdText);
      return;
    }

    if (previewDebounceTimerRef.current) {
      clearTimeout(previewDebounceTimerRef.current);
    }
    previewDebounceTimerRef.current = setTimeout(() => {
      setDebouncedPreviewText(mdText);
    }, 280);

    return () => {
      if (previewDebounceTimerRef.current) {
        clearTimeout(previewDebounceTimerRef.current);
      }
    };
  }, [mdText]);

  // React 19 Concurrent: yozish paytida kadr chizilishini (< 35ms) bloklamaslik uchun
  const previewMdText = useDeferredValue(debouncedPreviewText);

  const { document: parsedDoc, warnings } = useMemo(() => {
    const res = parseMarkdownPlus(previewMdText);
    if (res.document) {
      res.document.blockOverrides = effectiveBlockOverrides;
    }
    return res;
  }, [previewMdText, effectiveBlockOverrides]);

  // Hujjat mavzusi o'zgarganda
  useEffect(() => {
    if (parsedDoc?.theme) {
      setTheme(parsedDoc.theme);
    }
  }, [parsedDoc?.theme]);

  // Chop etish / PDF eksport uchun kechiktirilgan (debounced) hujjat —
  // matn yozish paytida #print-export-host har bir harfda keraksiz qayta chizilmasligi uchun
  const [printDoc, setPrintDoc] = useState(parsedDoc);
  useEffect(() => {
    const timer = setTimeout(() => {
      setPrintDoc(parsedDoc);
    }, 600);
    return () => clearTimeout(timer);
  }, [parsedDoc]);

  useEffect(() => {
    const handleBeforePrint = () => {
      setPrintDoc(parsedDoc);
    };
    window.addEventListener('beforeprint', handleBeforePrint);
    return () => window.removeEventListener('beforeprint', handleBeforePrint);
  }, [parsedDoc]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Hujjatni tanlash (Zero Content Loss va Cross-save xatolaridan to'liq himoyalangan)
  const handleSelectDoc = async (id: string) => {
    if (id === activeDocIdRef.current) return;

    const switchSeq = ++switchSeqRef.current;

    // 1. Agar avvalgi hujjatda saqlanmagan tahrir bo'lsa, uni darhol o'sha hujjat ID si ostida saqlaymiz
    const prevDocId = dirtyDocIdRef.current;
    const prevText = mdTextRef.current;

    if (pendingSaveTimerRef.current) {
      clearTimeout(pendingSaveTimerRef.current);
      pendingSaveTimerRef.current = null;
    }

    if (prevDocId && prevDocId !== id) {
      const prevDoc = documents.find((d) => d.id === prevDocId);
      if (prevDoc && prevDoc.content !== prevText) {
        try {
          const updated: DocumentItem = {
            ...prevDoc,
            content: prevText,
            updatedAt: Date.now()
          };
          await saveDocument(updated);
          await saveSnapshot(prevDocId, prevText);
          setDocuments((prev) => prev.map((d) => (d.id === prevDocId ? updated : d)));
          workspaceChannel.broadcastDocUpdated(prevDocId);
        } catch (e) {
          console.error('Avvalgi hujjatni saqlashda xatolik:', e);
        }
      }
      dirtyDocIdRef.current = null;
    }

    // 2. Agar yangiroq hujjat tanlovi boshlangan bo'lsa, bu yuklashni bekor qilamiz
    if (switchSeq !== switchSeqRef.current) return;

    const doc = documents.find((d) => d.id === id) || (await getDocument(id));
    if (switchSeq !== switchSeqRef.current) return;

    if (doc) {
      activeDocIdRef.current = doc.id;
      mdTextRef.current = doc.content;
      dirtyDocIdRef.current = null;
      setActiveDocId(doc.id);
      setMdText(doc.content);
      setConflictDoc(null);
      setSaveStatus('saved');

      const styles = getCustomStyles();
      const parsed = parseMarkdownPlus(doc.content);
      const styleTarget = doc.customStyleId || doc.customStyleName || parsed.document.customStyle;

      let matchedStyle: CustomStyle | undefined;
      if (styleTarget) {
        matchedStyle = styles.find((s) => s.id === styleTarget || s.name.toLowerCase() === styleTarget.toLowerCase());
      }

      if (matchedStyle) {
        await applyCustomStyle(matchedStyle);
      } else {
        await resetAll();
        if (doc.theme) {
          setTheme(doc.theme as ThemeName);
        }
      }

      const updatedRecents = [doc.id, ...meta.recentDocIds.filter((x) => x !== doc.id)].slice(0, 10);
      setMeta((prev) => ({ ...prev, recentDocIds: updatedRecents, lastActiveDocId: doc.id }));
      saveWorkspaceMeta({ recentDocIds: updatedRecents, lastActiveDocId: doc.id });
      setCurrentView('studio');
    }
  };


  // V-E: Yagona bog'langan Undo/Redo tarixi (Shared across Editor & Preview)
  interface HistoryStep {
    content: string;
    styles?: StyleAnnotation[];
    source: 'editor' | 'preview_text' | 'preview_style';
    timestamp: number;
  }

  const sharedUndoStackRef = useRef<HistoryStep[]>([]);
  const sharedRedoStackRef = useRef<HistoryStep[]>([]);
  const lastHistoryPushRef = useRef<{ source: string; timestamp: number } | null>(null);

  const pushHistoryStep = (
    prevContent: string,
    prevStyles: StyleAnnotation[] | undefined,
    source: 'editor' | 'preview_text' | 'preview_style'
  ) => {
    const now = Date.now();
    const last = lastHistoryPushRef.current;

    // Yozish to'lqinlarini birlashtirish (Coalescing typing burst within 800ms)
    if (last && last.source === source && source !== 'preview_style' && now - last.timestamp < 800) {
      last.timestamp = now;
      return;
    }

    sharedUndoStackRef.current.push({
      content: prevContent,
      styles: prevStyles ? JSON.parse(JSON.stringify(prevStyles)) : undefined,
      source,
      timestamp: now
    });

    if (sharedUndoStackRef.current.length > 60) {
      sharedUndoStackRef.current.shift();
    }

    sharedRedoStackRef.current = [];
    lastHistoryPushRef.current = { source, timestamp: now };
  };

  const handleSharedUndo = (): boolean => {
    if (sharedUndoStackRef.current.length === 0) return false;
    const curDoc = documents.find((d) => d.id === activeDocId);
    const step = sharedUndoStackRef.current.pop()!;

    sharedRedoStackRef.current.push({
      content: mdText,
      styles: curDoc?.styles ? JSON.parse(JSON.stringify(curDoc.styles)) : undefined,
      source: step.source,
      timestamp: Date.now()
    });

    setMdText(step.content);
    if (step.styles !== undefined && curDoc && activeDocId) {
      const updatedDoc = { ...curDoc, styles: step.styles, updatedAt: Date.now() };
      saveDocument(updatedDoc).catch(console.error);
      setDocuments((prev) => prev.map((d) => (d.id === activeDocId ? updatedDoc : d)));
    }
    showToast('Tahrir bekor qilindi (Undo)');
    return true;
  };

  const handleSharedRedo = (): boolean => {
    if (sharedRedoStackRef.current.length === 0) return false;
    const curDoc = documents.find((d) => d.id === activeDocId);
    const step = sharedRedoStackRef.current.pop()!;

    sharedUndoStackRef.current.push({
      content: mdText,
      styles: curDoc?.styles ? JSON.parse(JSON.stringify(curDoc.styles)) : undefined,
      source: step.source,
      timestamp: Date.now()
    });

    setMdText(step.content);
    if (step.styles !== undefined && curDoc && activeDocId) {
      const updatedDoc = { ...curDoc, styles: step.styles, updatedAt: Date.now() };
      saveDocument(updatedDoc).catch(console.error);
      setDocuments((prev) => prev.map((d) => (d.id === activeDocId ? updatedDoc : d)));
    }
    showToast('Tahrir qaytarildi (Redo)');
    return true;
  };

  useEffect(() => {
    const onUndo = () => handleSharedUndo();
    const onRedo = () => handleSharedRedo();

    window.addEventListener('yurist:undo', onUndo);
    window.addEventListener('yurist:redo', onRedo);
    return () => {
      window.removeEventListener('yurist:undo', onUndo);
      window.removeEventListener('yurist:redo', onRedo);
    };
  }, [mdText, activeDocId, documents]);

  const handleCanvasEdit = (newMdText: string, isLive = false) => {
    if (!isLive) {
      const curDoc = documents.find((d) => d.id === activeDocId);
      pushHistoryStep(mdText, curDoc?.styles, 'preview_text');
      showToast('Kanvas tahriri manbaga saqlandi');
    }
    setMdText(newMdText);
  };

  const handleUpdateStyles = async (newStyles: StyleAnnotation[]) => {
    if (!activeDocId) return;
    const curDoc = documents.find((d) => d.id === activeDocId);
    if (!curDoc) return;
    pushHistoryStep(mdText, curDoc.styles, 'preview_style');
    const updatedDoc: DocumentItem = {
      ...curDoc,
      styles: newStyles,
      updatedAt: Date.now()
    };
    try {
      await saveDocument(updatedDoc);
      setDocuments((prev) => prev.map((d) => (d.id === activeDocId ? updatedDoc : d)));
      workspaceChannel.broadcastDocUpdated(activeDocId);
    } catch (err) {
      console.error('Uslublarni saqlashda xatolik:', err);
    }
  };

  const handleJumpToSourceLine = (line: number) => {
    if (viewMode === 'preview') {
      const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768;
      setViewMode(isMobile ? 'edit' : 'both');
    }
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('yurist:jump-to-source-line', { detail: { line } }));
    }, 60);
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('yurist:jump-to-source-line', { detail: { line } }));
    }, 200);
  };

  // Yangi hujjat yaratish
  const handleCreateDoc = async (parentId: string | null = null) => {
    const targetParent = parentId !== undefined ? parentId : (documents.find((d) => d.id === activeDocId)?.parentId || null);
    const now = Date.now();
    const newDoc: DocumentItem = {
      id: `doc_${now}_${Math.random().toString(36).substring(2, 7)}`,
      parentId: targetParent,
      title: 'Yangi hujjat',
      content: `# Yangi hujjat\n\n## 1-Mavzu. Kirish\nnorma: 1-modda\nMatnni bu yerga kiriting...`,
      order: documents.length,
      theme: 'modern',
      createdAt: now,
      updatedAt: now
    };

    await saveDocument(newDoc);
    setDocuments((prev) => [...prev, newDoc]);
    setActiveDocId(newDoc.id);
    setMdText(newDoc.content);
    workspaceChannel.broadcastWorkspaceChanged('CREATE_DOC');
    showToast('«Yangi hujjat» yaratildi');
  };

  // Namunani yuklash (Task 10: Mavjud hujjatni almashtirish yoki yangi hujjat sifatida ochish)
  const handleSelectSample = async (sample: SampleDocItem, mode: 'replace' | 'new_doc') => {
    if (mode === 'replace' && activeDocId) {
      setMdText(sample.content);
      const activeDoc = documents.find((d) => d.id === activeDocId);
      if (activeDoc) {
        const updated = {
          ...activeDoc,
          title: sample.title,
          content: sample.content,
          theme: sample.theme,
          updatedAt: Date.now()
        };
        await saveDocument(updated);
        setDocuments((prev) => prev.map((d) => (d.id === activeDocId ? updated : d)));
      }
      showToast(`«${sample.title}» joriy hujjatga yuklandi`);
    } else {
      const now = Date.now();
      const newDoc: DocumentItem = {
        id: `doc_${now}_${Math.random().toString(36).substring(2, 7)}`,
        parentId: documents.find((d) => d.id === activeDocId)?.parentId || null,
        title: sample.title,
        content: sample.content,
        order: documents.length,
        theme: sample.theme,
        createdAt: now,
        updatedAt: now
      };
      await saveDocument(newDoc);
      setDocuments((prev) => [...prev, newDoc]);
      setActiveDocId(newDoc.id);
      setMdText(newDoc.content);
      workspaceChannel.broadcastWorkspaceChanged('CREATE_DOC');
      showToast(`«${sample.title}» yangi hujjat sifatida ochildi`);
    }
  };

  // Yangi papka ochish
  const handleCreateFolder = async (parentId: string | null = null) => {
    const targetParent = parentId !== undefined ? parentId : (documents.find((d) => d.id === activeDocId)?.parentId || null);
    const now = Date.now();
    const newFolder: FolderItem = {
      id: `folder_${now}_${Math.random().toString(36).substring(2, 7)}`,
      parentId: targetParent,
      name: 'Yangi papka',
      order: folders.length,
      createdAt: now,
      updatedAt: now
    };

    await saveFolder(newFolder);
    setFolders((prev) => [...prev, newFolder]);
    workspaceChannel.broadcastWorkspaceChanged('CREATE_FOLDER');
    showToast('«Yangi papka» ochildi');
  };

  // Qayta nomlash
  const handleRenameFolder = async (id: string, name: string) => {
    const target = folders.find((f) => f.id === id);
    if (!target) return;
    const updated = { ...target, name, updatedAt: Date.now() };
    await saveFolder(updated);
    setFolders((prev) => prev.map((f) => (f.id === id ? updated : f)));
    workspaceChannel.broadcastWorkspaceChanged('RENAME_FOLDER');
  };

  const handleRenameDoc = async (id: string, title: string) => {
    const target = documents.find((d) => d.id === id);
    if (!target) return;
    const updated = { ...target, title, updatedAt: Date.now() };
    await saveDocument(updated);
    setDocuments((prev) => prev.map((d) => (d.id === id ? updated : d)));
    workspaceChannel.broadcastWorkspaceChanged('RENAME_DOC');
  };

  // O'chirish (UNDO toast bilan)
  const handleDeleteDoc = async (docId: string) => {
    const docToDelete = documents.find((d) => d.id === docId);
    if (!docToDelete) return;

    await deleteDocument(docId);
    const remaining = documents.filter((d) => d.id !== docId);
    setDocuments(remaining);

    if (activeDocId === docId) {
      if (remaining.length > 0) {
        handleSelectDoc(remaining[0].id);
      } else {
        setActiveDocId(null);
        setMdText('');
      }
    }

    workspaceChannel.broadcastWorkspaceChanged('DELETE_DOC');

    setUndoToast({
      message: `«${docToDelete.title}» o‘chirildi`,
      onUndo: async () => {
        await saveDocument(docToDelete);
        setDocuments((prev) => [...prev, docToDelete]);
        handleSelectDoc(docToDelete.id);
        workspaceChannel.broadcastWorkspaceChanged('RESTORE_DOC');
        setUndoToast(null);
        showToast('Hujjat qayta tiklandi!');
      }
    });
  };

  const handleDeleteFolder = async (folderId: string) => {
    const folder = folders.find((f) => f.id === folderId);
    if (!folder) return;

    const result = await deleteFolder(folderId);
    const deletedFolderIds = new Set(result.deletedFolders.map((f) => f.id));
    const deletedDocIds = new Set(result.deletedDocs.map((d) => d.id));

    setFolders((prev) => prev.filter((f) => !deletedFolderIds.has(f.id)));
    const remainingDocs = documents.filter((d) => !deletedDocIds.has(d.id));
    setDocuments(remainingDocs);

    if (activeDocId && deletedDocIds.has(activeDocId)) {
      if (remainingDocs.length > 0) {
        handleSelectDoc(remainingDocs[0].id);
      } else {
        setActiveDocId(null);
        setMdText('');
      }
    }

    workspaceChannel.broadcastWorkspaceChanged('DELETE_FOLDER');

    setUndoToast({
      message: `«${folder.name}» papkasi o‘chirildi`,
      onUndo: async () => {
        for (const f of result.deletedFolders) {
          await saveFolder(f);
        }
        for (const d of result.deletedDocs) {
          await saveDocument(d);
        }
        setFolders((prev) => [...prev, ...result.deletedFolders]);
        setDocuments((prev) => [...prev, ...result.deletedDocs]);
        workspaceChannel.broadcastWorkspaceChanged('RESTORE_FOLDER');
        setUndoToast(null);
        showToast('Papka qayta tiklandi!');
      }
    });
  };

  // Nusxasini yaratish
  const handleDuplicateDoc = async (id: string) => {
    const target = documents.find((d) => d.id === id);
    if (!target) return;
    const now = Date.now();
    const duplicated: DocumentItem = {
      ...target,
      id: `doc_${now}_${Math.random().toString(36).substring(2, 7)}`,
      title: `${target.title} (nusxa)`,
      createdAt: now,
      updatedAt: now
    };
    await saveDocument(duplicated);
    setDocuments((prev) => [...prev, duplicated]);
    workspaceChannel.broadcastWorkspaceChanged('DUPLICATE_DOC');
    showToast('Hujjat nusxasi yaratildi');
  };

  // Pin/Unpin
  const handleTogglePinDoc = async (id: string) => {
    const target = documents.find((d) => d.id === id);
    if (!target) return;
    const updated = { ...target, isPinned: !target.isPinned, updatedAt: Date.now() };
    await saveDocument(updated);
    setDocuments((prev) => prev.map((d) => (d.id === id ? updated : d)));
  };

  const handleTogglePinFolder = async (id: string) => {
    const target = folders.find((f) => f.id === id);
    if (!target) return;
    const updated = { ...target, isPinned: !target.isPinned, updatedAt: Date.now() };
    await saveFolder(updated);
    setFolders((prev) => prev.map((f) => (f.id === id ? updated : f)));
  };

  // Ko'chirish (Drag & Drop)
  const handleMoveItem = async (itemId: string, itemType: 'folder' | 'document', targetParentId: string | null) => {
    if (itemType === 'folder') {
      if (!canMoveFolder(itemId, targetParentId, folders)) return;
      const target = folders.find((f) => f.id === itemId);
      if (!target) return;
      const updated = { ...target, parentId: targetParentId, updatedAt: Date.now() };
      await saveFolder(updated);
      setFolders((prev) => prev.map((f) => (f.id === itemId ? updated : f)));
    } else {
      const target = documents.find((d) => d.id === itemId);
      if (!target) return;
      const updated = { ...target, parentId: targetParentId, updatedAt: Date.now() };
      await saveDocument(updated);
      setDocuments((prev) => prev.map((d) => (d.id === itemId ? updated : d)));
    }
    workspaceChannel.broadcastWorkspaceChanged('MOVE_ITEM');
  };

  // AI yo'riqnomasi
  const handleCopyAiGuide = async () => {
    const guide = generateAiInstructions();
    try {
      await navigator.clipboard.writeText(guide);
      showToast('MD+ formati bo‘yicha AI ko‘rsatmasi va namunalar nusxalandi! Endi ChatGPT yoki Claude’ga tashlang.');
    } catch {
      showToast('Nusxalashda xatolik yuz berdi.');
    }
  };

  // Qo'llanma sahifasini ochish
  const handleOpenGuide = (warningCode?: string) => {
    setSelectedWarningCode(warningCode || null);
    setCurrentView('guide');
  };

  const handleBackToStudio = () => {
    setCurrentView('studio');
  };

  const handleTrySnippet = (snippet: string) => {
    setMdText(snippet);
    setCurrentView('studio');
    showToast('Namuna muharrirga yuklandi!');
  };

  // Chop etish (A4 yoki 9:16 kartalar)
  const handlePrintA4 = () => {
    setPrintLayout('a4');
    document.body.setAttribute('data-print-layout', 'a4');
    setIsExportMenuOpen(false);
    setIsMobileMenuOpen(false);
    window.addEventListener(
      'afterprint',
      () => {
        document.body.removeAttribute('data-print-layout');
      },
      { once: true }
    );
    setTimeout(() => {
      window.print();
    }, 60);
  };

  const handlePrintCards = () => {
    setPrintLayout('cards');
    document.body.setAttribute('data-print-layout', 'cards');
    setIsExportMenuOpen(false);
    setIsMobileMenuOpen(false);
    window.addEventListener(
      'afterprint',
      () => {
        document.body.removeAttribute('data-print-layout');
      },
      { once: true }
    );
    setTimeout(() => {
      window.print();
    }, 60);
  };

  const handlePrint = () => {
    handlePrintA4();
  };

  const handleApplyGlobalSmartIngest = (convertedMd: string, mode: 'replace' | 'append') => {
    if (mode === 'append') {
      const nextText = mdText.trim() ? `${mdText.trim()}\n\n${convertedMd}` : convertedMd;
      const curDoc = documents.find((d) => d.id === activeDocId);
      pushHistoryStep(mdText, curDoc?.styles, 'editor');
      setMdText(nextText);
      showToast('Yangi bo‘limlar hujjat oxiriga qo‘shildi');
    } else {
      const curDoc = documents.find((d) => d.id === activeDocId);
      pushHistoryStep(mdText, curDoc?.styles, 'editor');
      setMdText(convertedMd);
      showToast('Hujjat muvaffaqiyatli almashtirildi');
    }
  };



  // Markdown (.md) yuklab olish
  const handleDownloadMd = () => {
    const activeDoc = documents.find((d) => d.id === activeDocId);
    const fileName = `${activeDoc?.title || 'hujjat'}.md`;
    const blob = new Blob([mdText], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = window.document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
    setIsExportMenuOpen(false);
    showToast('Markdown (.md) fayli yuklab olindi');
  };

  // Butun ish maydonini .zip arxivlash
  const handleExportZip = async () => {
    try {
      const zipBlob = await exportWorkspaceToZip();
      const url = URL.createObjectURL(zipBlob);
      const a = window.document.createElement('a');
      a.href = url;
      a.download = `Ish_Maydoni_Zaxira_${new Date().toISOString().slice(0, 10)}.zip`;
      a.click();
      URL.revokeObjectURL(url);
      setMeta((prev) => ({ ...prev, lastBackupAt: Date.now() }));
      setIsExportMenuOpen(false);
      showToast('Butun ish maydoni (.zip) zaxirasi saqlandi!');
    } catch (err) {
      console.error(err);
      showToast('Zaxiralashda xatolik yuz berdi');
    }
  };

  // Butun ish maydonini .zip arxivdan tiklash
  const handleImportZip = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      showToast('Zaxira tekshirilmoqda va tiklanmoqda...');
      const res = await importWorkspaceFromZip(file);

      const [loadedFolders, loadedDocs, loadedMeta] = await Promise.all([
        getAllFolders(),
        getAllDocuments(),
        getWorkspaceMeta()
      ]);

      setFolders(loadedFolders);
      setDocuments(loadedDocs);
      setMeta(loadedMeta);

      if (loadedDocs.length > 0) {
        setActiveDocId(loadedDocs[0].id);
        setMdText(loadedDocs[0].content);
        if (loadedDocs[0].theme) {
          setTheme(loadedDocs[0].theme as ThemeName);
        }
      }

      setIsExportMenuOpen(false);
      showToast(`Zaxira tiklandi: ${res.foldersCount} ta papka, ${res.docsCount} ta hujjat!`);
    } catch (err) {
      console.error('Zaxira tiklashda xatolik:', err);
      showToast('Arxiv faylini ochishda xatolik yuz berdi');
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Breadcrumbs
  const breadcrumbPath = useMemo(() => {
    if (!activeDocId) return [];
    return getBreadcrumbPath(activeDocId, true, folders, documents);
  }, [activeDocId, folders, documents]);




  return (
    <div
      className={`app-container theme-${theme}`}
      data-ui-theme="light"
      data-document-theme={theme}
    >
      {/* Asosiy Ish Maydoni (Workspace Container) */}
      <div className="workspace-container" style={{ display: 'flex', width: '100vw', height: '100vh', overflow: 'hidden' }}>
        {/* Chap Yon Panel (Sidebar) */}
        <Sidebar
          isOpen={isSidebarOpen}
          onToggleOpen={() => {
            setIsSidebarOpen((prev) => {
              const next = !prev;
              localStorage.setItem('yurist_sidebar_open', String(next));
              return next;
            });
          }}
          folders={folders}
          documents={documents}
          activeDocId={activeDocId}
          recentDocIds={meta.recentDocIds}
          lastBackupAt={meta.lastBackupAt}
          onSelectDoc={handleSelectDoc}
          onCreateDoc={() => handleCreateDoc()}
          onCreateFolder={() => handleCreateFolder()}
          onRenameFolder={handleRenameFolder}
          onRenameDoc={handleRenameDoc}
          onDeleteFolder={handleDeleteFolder}
          onDeleteDoc={handleDeleteDoc}
          onDuplicateDoc={handleDuplicateDoc}
          onTogglePinDoc={handleTogglePinDoc}
          onTogglePinFolder={handleTogglePinFolder}
          onMoveItem={handleMoveItem}
          onOpenHelp={() => handleOpenGuide()}
          onOpenCommandPalette={() => setIsPaletteOpen(true)}
          onExportZip={handleExportZip}
        />

        {isSidebarOpen && (
          <div
            className="sidebar-backdrop"
            onClick={() => setIsSidebarOpen(false)}
            aria-label="Panelni yopish"
          />
        )}

        {/* Asosiy Kontent Maydoni */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', minWidth: 0 }}>
          {/* Yuqori Navigatsiya Paneli (Clean De-cluttered Navbar) */}
          <header className="app-navbar no-print">
            <div className="brand-section">
              {!isSidebarOpen && (
                <button
                  type="button"
                  className="nav-btn"
                  onClick={() => {
                    setIsSidebarOpen(true);
                    localStorage.setItem('yurist_sidebar_open', 'true');
                  }}
                  title="Yon panelni ochish (Ctrl+B)"
                  style={{ padding: '6px 8px' }}
                >
                  <PanelLeft size={16} strokeWidth={2} />
                </button>
              )}

              {/* Breadcrumb Path */}
              {breadcrumbPath.length > 0 ? (
                <div className="breadcrumb-nav">
                  {breadcrumbPath.map((crumb, idx) => (
                    <React.Fragment key={crumb.id}>
                      {idx > 0 && <span className="crumb-sep">/</span>}
                      <span className={idx === breadcrumbPath.length - 1 ? 'crumb-current' : 'crumb-item'}>
                        {crumb.name}
                      </span>
                    </React.Fragment>
                  ))}
                  {saveStatus === 'saved' && (
                    <span className="crumb-saved-badge" title="Barcha o‘zgarishlar IndexedDB omborida tasdiqlanib saqlangan">
                      <span className="save-dot saved" /> Saqlandi
                    </span>
                  )}
                  {saveStatus === 'unsaved' && (
                    <span className="crumb-saved-badge" title="Tahrirlar kiritildi (500ms dan so‘ng avtomatik saqlanadi)">
                      <span className="save-dot unsaved" /> O‘zgartirilgan
                    </span>
                  )}
                  {saveStatus === 'saving' && (
                    <span className="crumb-saved-badge" title="IndexedDB omboriga yozilmoqda…">
                      <span className="save-dot saving" /> Saqlanmoqda…
                    </span>
                  )}
                  {saveStatus === 'conflict' && (
                    <span className="crumb-saved-badge conflict-btn" title="Boshqa oynada o‘zgarish kiritilgan!">
                      <span className="save-dot conflict" /> Ziddiyat aniqlandi
                    </span>
                  )}
                  {saveStatus === 'error' && (
                    <button
                      type="button"
                      className="crumb-saved-badge error-btn"
                      onClick={handleRetrySave}
                      title="Qayta urinish uchun bosing"
                    >
                      <span className="save-dot error" /> Xatolik
                    </button>
                  )}
                </div>
              ) : (
                <div style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--ink)' }}>
                  Ish maydoni
                </div>
              )}
            </div>

            {/* Mode Switcher Pill yoki Qo'llanma indikatori */}
            {currentView === 'studio' ? (
              <div className="view-mode-pill" role="tablist" aria-label="Ko‘rinish rejimlari">
                <button
                  type="button"
                  role="tab"
                  aria-selected={viewMode === 'edit'}
                  className={`mode-tab ${viewMode === 'edit' ? 'active' : ''}`}
                  onClick={() => setViewMode('edit')}
                >
                  Yozish
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={viewMode === 'preview'}
                  className={`mode-tab ${viewMode === 'preview' ? 'active' : ''}`}
                  onClick={() => setViewMode('preview')}
                >
                  Ko‘rish
                </button>
                {windowWidth >= 1280 && (
                  <button
                    type="button"
                    role="tab"
                    aria-selected={viewMode === 'both'}
                    className={`mode-tab mode-tab-both ${viewMode === 'both' ? 'active' : ''}`}
                    onClick={() => setViewMode('both')}
                  >
                    Ikkalasi
                  </button>
                )}
              </div>
            ) : (
              <div className="guide-header-indicator" role="status" aria-label="Qo‘llanma bo‘limi">
                <BookOpen size={14} className="guide-header-icon" />
                <span>Qo‘llanma va Yordam</span>
              </div>
            )}

            {/* Desktop Navbar Controls (>768px): Eksport va "..." menyusi */}
            <div className="nav-controls nav-controls-desktop">
              {currentView === 'guide' ? (
                <button
                  type="button"
                  className="nav-btn nav-btn-primary guide-back-nav-btn"
                  onClick={handleBackToStudio}
                  title="Ish maydoniga qaytish"
                >
                  <ArrowLeft size={14} strokeWidth={2} />
                  <span>Hujjatga qaytish</span>
                </button>
              ) : (
                <>
                  {/* ONE Export / Share Menu — Single Primary Button */}
                  <div className="dropdown-menu-wrap" ref={exportMenuRef}>
                    <button
                      type="button"
                      className="nav-btn nav-btn-primary"
                      onClick={() => setIsExportMenuOpen((prev) => !prev)}
                      title="Eksport va chop etish"
                      aria-label="Eksport menyusi"
                      aria-expanded={isExportMenuOpen}
                    >
                      <Download size={14} strokeWidth={2} />
                      <span>Eksport</span>
                    </button>

                    {isExportMenuOpen && (
                      <div className="dropdown-popover-card" style={{ width: '270px' }}>
                        <button
                          type="button"
                          className="dropdown-menu-item"
                          onClick={handlePrintA4}
                        >
                          <Printer size={15} />
                          <div>
                            <div>A4 Kitobiy PDF</div>
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Kitob va rasmiy chop etish uchun</div>
                          </div>
                        </button>

                        <button
                          type="button"
                          className="dropdown-menu-item"
                          onClick={handlePrintCards}
                        >
                          <Layout size={15} />
                          <div>
                            <div>9:16 O‘quv Kartalari PDF</div>
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Mobil slaydlar va taqdimot uchun</div>
                          </div>
                        </button>

                        <div className="dropdown-tip-box">
                          💡 <strong>Eng aniq PDF:</strong> Chrome darchasida <em>Margins: None</em> va <em>Background graphics: On</em> qiling.
                        </div>

                        <button
                          type="button"
                          className="dropdown-menu-item"
                          onClick={handleDownloadMd}
                        >
                          <FileDown size={15} />
                          <div>
                            <div>Markdown (.md)</div>
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Faqat ushbu hujjatni yuklash</div>
                          </div>
                        </button>

                        <button
                          type="button"
                          className="dropdown-menu-item"
                          onClick={handleExportZip}
                        >
                          <Archive size={15} />
                          <div>
                            <div>Ish maydoni zaxirasi (.zip)</div>
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Barcha papka va hujjatlar</div>
                          </div>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Ikkinchi darajali amallar ("..." Menyusi) */}
                  <div className="dropdown-menu-wrap" ref={moreMenuRef}>
                    <button
                      type="button"
                      className={`nav-btn nav-btn-more ${isMoreMenuOpen ? 'active' : ''}`}
                      onClick={() => setIsMoreMenuOpen((prev) => !prev)}
                      title="Qo‘shimcha vositalar va sozlamalar (...)"
                      aria-label="Qo‘shimcha amallar"
                      aria-expanded={isMoreMenuOpen}
                    >
                      <MoreHorizontal size={16} strokeWidth={2} />
                    </button>

                    {isMoreMenuOpen && (
                      <div className="dropdown-popover-card" style={{ minWidth: '240px', padding: '10px' }}>
                        {/* Aqlli Formatlash */}
                        <button
                          type="button"
                          className="dropdown-menu-item"
                          onClick={() => {
                            setIsMoreMenuOpen(false);
                            setIsGlobalSmartIngestOpen(true);
                          }}
                        >
                          <Sparkles size={15} />
                          <div>
                            <div>Aqlli formatlash</div>
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Xom matndan konspekt yasash</div>
                          </div>
                        </button>

                        {/* Imtihon Trenajyori */}
                        <button
                          type="button"
                          className="dropdown-menu-item"
                          onClick={() => {
                            setIsMoreMenuOpen(false);
                            setViewMode('preview');
                            setPreviewOutputMode('exam');
                            localStorage.setItem('yurist_preview_output_mode', 'exam');
                            showToast('Imtihon rejimiga o‘tildi');
                          }}
                        >
                          <GraduationCap size={15} />
                          <div>
                            <div>Imtihon trenajyori (SM-2)</div>
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Oraliq takrorlash va fleshkardlar</div>
                          </div>
                        </button>

                        {/* Qo'llanma */}
                        <button
                          type="button"
                          className="dropdown-menu-item"
                          onClick={() => {
                            setIsMoreMenuOpen(false);
                            setSelectedWarningCode(null);
                            setCurrentView('guide');
                          }}
                        >
                          <HelpCircle size={15} />
                          <span>Qo‘llanma va Yordam</span>
                        </button>

                        <div style={{ borderTop: '1px solid var(--line-soft)', margin: '8px 0' }} />

                        {/* Zaxiradan tiklash */}
                        <button
                          type="button"
                          className="dropdown-menu-item"
                          onClick={() => {
                            setIsMoreMenuOpen(false);
                            fileInputRef.current?.click();
                          }}
                        >
                          <Upload size={15} />
                          <div>
                            <div>Zaxiradan tiklash (.zip)</div>
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Arxivdan ish maydonini yuklash</div>
                          </div>
                        </button>
                      </div>
                    )}
                  </div>
                </>
              )}

              <input
                type="file"
                ref={fileInputRef}
                accept=".zip"
                style={{ display: 'none' }}
                onChange={handleImportZip}
              />
            </div>

            {/* Mobile Navbar Controls (<=768px: Compact Overflow / Hamburger Menu) */}
            <div className="nav-controls nav-controls-mobile" ref={mobileMenuRef}>
              <button
                type="button"
                className={`nav-btn nav-mobile-menu-btn ${isMobileMenuOpen ? 'active' : ''}`}
                onClick={() => setIsMobileMenuOpen((prev) => !prev)}
                title="Barcha vositalar va sozlamalar"
                aria-label="Asosiy menyu"
                aria-expanded={isMobileMenuOpen}
              >
                {isMobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
              </button>

              {isMobileMenuOpen && (
                <div className="dropdown-popover-card nav-mobile-dropdown">
                  {/* Eksport bo'limi */}
                  <div className="nav-mobile-section-header">Eksport va Chop etish</div>
                  <button
                    type="button"
                    className="dropdown-menu-item"
                    onClick={handlePrintA4}
                  >
                    <Printer size={15} />
                    <span>A4 Kitobiy PDF</span>
                  </button>
                  <button
                    type="button"
                    className="dropdown-menu-item"
                    onClick={handlePrintCards}
                  >
                    <Layout size={15} />
                    <span>9:16 Kartalar PDF</span>
                  </button>
                  <button
                    type="button"
                    className="dropdown-menu-item"
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      setIsGlobalSmartIngestOpen(true);
                    }}
                  >
                    <Sparkles size={15} />
                    <span>Aqlli formatlash</span>
                  </button>
                  <button
                    type="button"
                    className="dropdown-menu-item"
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      handleDownloadMd();
                    }}
                  >
                    <FileDown size={15} />
                    <span>Markdown (.md) yuklash</span>
                  </button>
                  <button
                    type="button"
                    className="dropdown-menu-item"
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      handleExportZip();
                    }}
                  >
                    <Archive size={15} />
                    <span>Arxiv zaxirasi (.zip)</span>
                  </button>
                  <button
                    type="button"
                    className="dropdown-menu-item"
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      fileInputRef.current?.click();
                    }}
                  >
                    <Upload size={15} />
                    <span>Zaxiradan tiklash (.zip)</span>
                  </button>





                  <div className="nav-mobile-divider" />
                  <div className="nav-mobile-section-header">Sozlamalar</div>

                  {/* Qo'llanma */}
                  <button
                    type="button"
                    className="dropdown-menu-item"
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      if (currentView === 'guide') {
                        setCurrentView('studio');
                      } else {
                        setSelectedWarningCode(null);
                        setCurrentView('guide');
                      }
                    }}
                  >
                    <HelpCircle size={15} />
                    <span>{currentView === 'guide' ? 'Hujjatga qaytish' : 'Qo‘llanma va Yordam'}</span>
                  </button>
                </div>
              )}
            </div>
          </header>

          {/* Asosiy Kontent Bo'limi */}
          {currentView === 'guide' ? (
            <main className="guide-view-container" style={{ flex: 1, overflowY: 'auto' }}>
              <GuidePage
                onBackToStudio={handleBackToStudio}
                onTrySnippet={handleTrySnippet}
                initialWarningCode={selectedWarningCode}
              />
            </main>
          ) : !activeDoc ? (
            /* Calm Designed Empty State (Mockup 2) */
            <div className="workspace-empty-state">
              <div className="empty-state-icon-box">
                <BookMarked size={28} strokeWidth={1.7} />
              </div>
              <h2 className="empty-state-heading">Hujjat tanlanmagan</h2>
              <p className="empty-state-text">
                O‘qish yoki tahrirlashni boshlash uchun chap menyudan hujjatni tanlang, namunani oching yoki yangi hujjat yarating.
              </p>
              <div className="empty-state-btn-group">
                <button
                  type="button"
                  className="nav-btn nav-btn-primary"
                  onClick={() => handleCreateDoc()}
                >
                  <FilePlus size={14} />
                  <span>Yangi hujjat yaratish</span>
                  <span className="shortcut-kbd" style={{ background: 'rgba(255,255,255,0.2)', color: '#fff', border: 'none' }}>
                    Ctrl+N
                  </span>
                </button>

                <button
                  type="button"
                  className="nav-btn"
                  onClick={() => {
                    const sample = documents.find((d) => d.parentId === 'folder_samples') || documents[0];
                    if (sample) handleSelectDoc(sample.id);
                  }}
                >
                  <BookOpen size={14} />
                  <span>Namunani ko‘rish</span>
                </button>
              </div>

              <div className="empty-state-shortcuts-bar">
                <div><span className="shortcut-kbd">Ctrl + K</span> Qidiruv va buyruqlar</div>
                <div><span className="shortcut-kbd">Ctrl + B</span> Yon panel</div>
                <div><span className="shortcut-kbd">Ctrl + E</span> Rejimni almashtirish</div>
              </div>
            </div>
          ) : (
            <>
              {conflictDoc && (
                <div className="conflict-banner no-print" role="alert">
                  <AlertTriangle size={18} style={{ color: 'var(--warning)', flexShrink: 0 }} />
                  <div className="conflict-message">
                    <strong>Tahrirlash ziddiyati:</strong> Bu hujjat boshqa oyna yoki qurilmada o‘zgartirilgan. Sizda saqlanmagan mahalliy qoralama mavjud.
                  </div>
                  <div className="conflict-actions">
                    <button
                      type="button"
                      className="nav-btn nav-btn-primary"
                      onClick={handleKeepMyDraft}
                      title="Joriy oynadagi qoralamani saqlash"
                    >
                      Mening qoralamamni saqlash
                    </button>
                    <button
                      type="button"
                      className="nav-btn"
                      onClick={handleSaveAsCopy}
                      title="Qoralamani alohida yangi hujjat qilib nusxalash"
                    >
                      Alohida nusxa sifatida saqlash
                    </button>
                    <button
                      type="button"
                      className="nav-btn"
                      style={{ color: 'var(--danger)', borderColor: 'var(--danger-border)' }}
                      onClick={handleAdoptRemote}
                      title="Boshqa oynadagi o'zgarishlarni qabul qilish va joriy qoralamani bekor qilish"
                    >
                      Tashqi tahrirni qabul qilish
                    </button>
                  </div>
                </div>
              )}
              <main className="workspace-container" style={{ flex: 1, overflow: 'hidden' }}>
                {/* Muharrir ustuni */}
                {viewMode !== 'preview' && (
                  <section
                    className={`editor-column no-print ${viewMode === 'edit' ? 'full-width' : ''}`}
                    aria-label="MD+ Muharriri"
                  >
                    <MdEditor
                      value={mdText}
                      onChange={(val) => {
                        const curDoc = documents.find((d) => d.id === activeDocId);
                        pushHistoryStep(mdText, curDoc?.styles, 'editor');
                        setMdText(val);
                      }}
                      warnings={warnings}
                      onOpenGuide={handleOpenGuide}
                      onLoadSample={() => handleCreateDoc()}
                      onSelectSample={handleSelectSample}
                      onCopyAiGuide={handleCopyAiGuide}
                      onUndoCanvas={handleSharedUndo}
                      onOpenSearch={() => setIsPaletteOpen(true)}
                    />
                  </section>
                )}

              {/* Natija (O'quv kartochkalari) ustuni */}
              {viewMode !== 'edit' && (
                <section
                  className={`preview-column ${viewMode === 'preview' ? 'full-width' : ''}`}
                  aria-label="Hujjat ko‘rinishi"
                >
                  {parsedDoc ? (
                    <DocumentPreview
                      document={parsedDoc}
                      activeTheme={theme}
                      rawMdText={previewMdText}
                      blockOverrides={effectiveBlockOverrides}
                      onUpdateBlockOverride={handleUpdateBlockOverride}
                      onResetBlockOverride={handleResetBlockOverride}
                      onCanvasEdit={handleCanvasEdit}
                      onJumpToSourceLine={handleJumpToSourceLine}
                      styles={activeDoc?.styles}
                      onUpdateStyles={handleUpdateStyles}
                      onOpenAiIngestion={() => setIsGlobalSmartIngestOpen(true)}
                      outputMode={previewOutputMode}
                      onOutputModeChange={setPreviewOutputMode}
                    />
                  ) : (
                    <div className="preview-empty-state">
                      <p>Hujjat hali tayyor emas. Matn kiriting.</p>
                    </div>
                  )}
                </section>
              )}


            </main>
          </>
        )}
        </div>
      </div>

      {/* Buyruqlar Paneli (Ctrl+K) */}
      <CommandPalette
        isOpen={isPaletteOpen}
        onClose={() => setIsPaletteOpen(false)}
        documents={documents}
        folders={folders}
        onSelectDoc={handleSelectDoc}
        onCreateDoc={() => handleCreateDoc()}
        onCreateFolder={() => handleCreateFolder()}
        onToggleSidebar={() => {
          setIsSidebarOpen((prev) => !prev);
        }}
        onPrint={handlePrint}
        onOpenHelp={() => handleOpenGuide()}
        onToggleViewMode={() => {
          setViewMode((prev) => {
            if (prev === 'both') return 'edit';
            if (prev === 'edit') return 'preview';
            return 'both';
          });
        }}
        onOpenSmartIngest={() => setIsGlobalSmartIngestOpen(true)}
        onOpenExam={() => {
          setViewMode('preview');
          setPreviewOutputMode('exam');
          localStorage.setItem('yurist_preview_output_mode', 'exam');
          window.dispatchEvent(new Event('storage'));
          showToast('Imtihon rejimiga o‘tildi');
        }}
      />

      {/* Undo Toast (O'chirishni bekor qilish) */}
      {undoToast && (
        <div className="undo-toast-notice">
          <span>{undoToast.message}</span>
          <button className="undo-toast-button" onClick={undoToast.onUndo}>
            Bekor qilish
          </button>
        </div>
      )}

      {/* Qisqa xabarlar (Toast) */}
      {toastMessage && (
        <div className="toast-notice" role="status">
          <CheckCircle size={18} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Boshlang'ich tanishtiruv (Onboarding) */}
      {showOnboarding && (
        <OnboardingModal
          isOpen={showOnboarding}
          onClose={() => setShowOnboarding(false)}
          onLoadSample={() => handleCreateDoc()}
          onOpenGuide={() => handleOpenGuide()}
        />
      )}

      {/* Aqlli Formatlash / Matndan konspekt modali */}
      <SmartIngestionModal
        isOpen={isGlobalSmartIngestOpen}
        onClose={() => setIsGlobalSmartIngestOpen(false)}
        onApplyMdText={handleApplyGlobalSmartIngest}
      />

      {/* Chop etish / PDF eksport uchun mustaqil render hosti (ekranda yashirin, chop etishda barcha sahifalar to'liq chiqadi) */}
      <div id="print-export-host" className="print-export-host" aria-hidden="true">
        {printDoc && (
          <DocumentPreview
            document={printDoc}
            activeTheme={theme}
            forceShowAnswer={true}
            isPrintHost={true}
            blockOverrides={effectiveBlockOverrides}
            styles={activeDoc?.styles}
            printLayout={printLayout}
          />
        )}
      </div>
    </div>
  );
};

export default App;
