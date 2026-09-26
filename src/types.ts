export interface WorkspaceFile {
  name: string;
  path: string;
  is_dir: boolean;
  snippet?: string;
  word_count?: number;
  modified?: number;
}

export interface DocumentData {
  path: string;
  title: string;
  content: string;
  html_content?: string;
  word_count?: number;
  modified?: number;
}

export interface OutlineItem {
  id: string;
  text: string;
  level: number;
}

export type ViewMode = 'focus' | 'two' | 'three';
export type RenderMode = 'rendered' | 'source';
export type ThemeMode = 'theme-light' | 'theme-warm' | 'theme-dark';
