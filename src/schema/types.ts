export type ThemeName = 'classic' | 'modern' | 'dark' | 'minimal';
export type SectionLayout = '1-col' | '2-col' | 'grid';
export type EmphasisLevel = 'low' | 'medium' | 'high';
export type BlockSize = 'sm' | 'md' | 'lg';
export type NoteVariant = 'tip' | 'warning' | 'important' | 'quote';

export interface BlockStyleOverride {
  accentColor?: string;
  size?: 'S' | 'M' | 'L';
  alignment?: 'left' | 'center' | 'right';
  hideInPdf?: boolean;
}

export type BlockStyleOverridesMap = Record<string, BlockStyleOverride>;

export interface BlockStyle {
  emphasis?: EmphasisLevel;
  color?: string;
  size?: BlockSize;
}

export interface BaseBlock {
  id?: string;
  style?: BlockStyle;
  sourceLine?: number;
  sourceEndLine?: number;
  syntaxStyle?: 'fenced' | 'line';
}

export interface TextBlock extends BaseBlock {
  type: 'text';
  text: string;
  lead?: boolean;
}

export interface ListBlock extends BaseBlock {
  type: 'list';
  items: string[];
  ordered?: boolean;
}

export interface DefinitionBlock extends BaseBlock {
  type: 'definition';
  term: string;
  definition: string;
  source?: string;
}

export interface NormBlock extends BaseBlock {
  type: 'norm';
  number: string;
  title: string;
  text: string;
  source?: string;
  effectiveDate?: string;
}

export interface TableBlock extends BaseBlock {
  type: 'table';
  title?: string;
  caption?: string; // orqaga moslik uchun
  headers: string[];
  rows: string[][];
}

export interface NoteBlock extends BaseBlock {
  type: 'note';
  variant?: NoteVariant;
  title?: string;
  text: string;
}

export interface CaseBlock extends BaseBlock {
  type: 'case';
  title?: string;
  name?: string; // orqaga moslik uchun
  court?: string;
  facts?: string;
  issue?: string;
  rule?: string;
  analysis?: string;
  conclusion?: string;
  isContinuation?: boolean;
}

export interface QaBlock extends BaseBlock {
  type: 'qa';
  question: string;
  answer: string;
  hint?: string;
  category?: string;
  isContinuation?: boolean;
}

export interface CompareBlockItem {
  title: string;
  points: string[];
  badge?: string;
}

export interface CompareBlock extends BaseBlock {
  type: 'compare';
  items: CompareBlockItem[];
}

export interface FlowStep {
  title: string;
  description?: string;
  sourceLine?: number;
}

export interface FlowBlock extends BaseBlock {
  type: 'flow';
  title?: string;
  steps: FlowStep[];
}

export interface TimelineEvent {
  date: string;
  title: string;
  description: string;
}

export interface TimelineBlock extends BaseBlock {
  type: 'timeline';
  events: TimelineEvent[];
}

export type Block =
  | TextBlock
  | ListBlock
  | DefinitionBlock
  | NormBlock
  | TableBlock
  | NoteBlock
  | CaseBlock
  | QaBlock
  | CompareBlock
  | FlowBlock
  | TimelineBlock;

export interface Section {
  id?: string;
  title: string;
  subtitle?: string;
  layout?: SectionLayout;
  pageBreak?: boolean;
  blocks: Block[];
  sourceLine?: number;
  subtitleSourceLine?: number;
}

export interface DocumentCover {
  enabled?: boolean;
  institution?: string;
  year?: string;
  subtitle?: string;
}

export interface LegalDocument {
  version?: string | number;
  id?: string;
  title: string;
  subtitle?: string;
  author?: string;
  institution?: string;
  year?: string | number;
  description?: string;
  language?: string;
  theme?: ThemeName;
  customStyle?: string;
  cover?: DocumentCover;
  toc?: boolean;
  sections: Section[];
  blockOverrides?: BlockStyleOverridesMap;
  sourceLine?: number;
  subtitleSourceLine?: number;
}

export interface ValidationIssue {
  path: string;
  message: string;
  severity: 'error' | 'warning';
  line?: number;
}

export interface ValidationResult {
  valid: boolean;
  document: LegalDocument | null;
  issues: ValidationIssue[];
  warnings: ValidationIssue[];
}
