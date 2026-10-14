import type { BlockStyleOverridesMap } from './types';
import type { StyleAnnotation } from './styleAnnotation';

export type DocumentTheme = 'modern' | 'classic' | 'dark' | 'minimal';

export interface FolderItem {
  id: string;
  parentId: string | null; // null = root level
  name: string;
  order: number;
  isPinned?: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface DocumentItem {
  id: string;
  parentId: string | null; // null = root level
  title: string;
  content: string; // MD+ text
  order: number;
  theme?: DocumentTheme;
  customStyleId?: string;
  customStyleName?: string;
  blockOverrides?: BlockStyleOverridesMap;
  styles?: StyleAnnotation[];
  isPinned?: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface DocumentSnapshot {
  id: string;
  docId: string;
  content: string;
  styles?: StyleAnnotation[];
  createdAt: number;
}

export interface WorkspaceMeta {
  lastBackupAt: number | null;
  lastActiveDocId: string | null;
  recentDocIds: string[];
}

export interface WorkspaceManifest {
  version: string;
  exportedAt: number;
  folders: FolderItem[];
  documents: Omit<DocumentItem, 'content'>[];
  meta: WorkspaceMeta;
}

export interface BreadcrumbCrumb {
  id: string;
  name: string;
  isFolder: boolean;
}
