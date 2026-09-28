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
export type SidebarTab = 'workspace' | 'recent' | 'highlights';

export interface RecentDocument {
  id: string;
  file_path: string;
  file_name: string;
  title: string;
  snippet: string;
  word_count: number;
  last_opened_at: number;
  scroll_progress: number;
  is_pinned: boolean;
}

export interface DocumentHighlight {
  id: string;
  file_path: string;
  selected_text: string;
  color: string;
  note?: string;
  created_at: number;
}

export interface RecentWorkspace {
  path: string;
  name: string;
  last_opened_at: number;
}

export interface WorkspaceInfo {
  path: string;
  name: string;
  files: WorkspaceFile[];
}
