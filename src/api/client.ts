import { invoke } from '@tauri-apps/api/core';
import {
  WorkspaceFile,
  WorkspaceInfo,
  RecentWorkspace,
  DocumentData,
  RecentDocument,
  DocumentHighlight,
} from '../types';

function isTauriEnvironment(): boolean {
  return typeof window !== 'undefined' && ('__TAURI_INTERNALS__' in window || '__TAURI__' in window);
}

export const api = {
  isTauri(): boolean {
    return isTauriEnvironment();
  },

  async fetchWorkspace(path?: string): Promise<WorkspaceInfo> {
    if (isTauriEnvironment()) {
      try {
        const res = await invoke<WorkspaceInfo>('scan_workspace', { path });
        if (res && res.files) return res;
      } catch (err) {
        console.warn('scan_workspace failed:', err);
      }
      return { path: '', name: '工作区', files: [] };
    }

    const url = path ? `/api/workspace?path=${encodeURIComponent(path)}` : '/api/workspace';
    const res = await fetch(url);
    if (!res.ok) throw new Error('获取工作区失败');
    const json = await res.json();
    const files = Array.isArray(json) ? json : (json.data || []);
    return { path: path || '', name: path?.split('/').pop() || '工作区', files };
  },

  async readDocument(path: string): Promise<DocumentData> {
    if (isTauriEnvironment()) {
      return await invoke<DocumentData>('read_document', { path });
    }

    const res = await fetch(`/api/read?path=${encodeURIComponent(path)}`);
    if (!res.ok) throw new Error('读取文档失败');
    const json = await res.json();
    return json.data || json;
  },

  async saveDocument(path: string, htmlContent: string, title?: string): Promise<string> {
    if (isTauriEnvironment()) {
      return await invoke<string>('save_document', {
        path,
        htmlContent,
        html_content: htmlContent
      });
    }

    const res = await fetch('/api/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        path,
        title: title || path,
        html_content: htmlContent
      })
    });
    if (!res.ok) {
      throw new Error('保存文档失败');
    }
    return path;
  },

  async getRecentDocuments(): Promise<RecentDocument[]> {
    if (isTauriEnvironment()) {
      try {
        return await invoke<RecentDocument[]>('get_recent_documents');
      } catch (err) {
        console.warn('get_recent_documents failed:', err);
        return [];
      }
    }
    try {
      const stored = localStorage.getItem('tiniread_recent_docs');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  },

  async removeRecentDocument(id: string): Promise<void> {
    if (isTauriEnvironment()) {
      await invoke('remove_recent_document', { id });
      return;
    }
    try {
      const list = await this.getRecentDocuments();
      localStorage.setItem('tiniread_recent_docs', JSON.stringify(list.filter(d => d.id !== id)));
    } catch {}
  },

  async clearRecentDocuments(): Promise<void> {
    if (isTauriEnvironment()) {
      await invoke('clear_recent_documents');
      return;
    }
    localStorage.removeItem('tiniread_recent_docs');
  },

  async updateDocumentProgress(path: string, progress: number): Promise<void> {
    if (isTauriEnvironment()) {
      invoke('update_document_progress', { path, progress }).catch(() => {});
    }
  },

  async getDocumentHighlights(path: string): Promise<DocumentHighlight[]> {
    if (isTauriEnvironment()) {
      try {
        return await invoke<DocumentHighlight[]>('get_document_highlights', { path });
      } catch (err) {
        console.warn('get_document_highlights failed:', err);
        return [];
      }
    }
    try {
      const stored = localStorage.getItem(`tiniread_hl_${path}`);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  },

  async getAllHighlights(): Promise<DocumentHighlight[]> {
    if (isTauriEnvironment()) {
      try {
        return await invoke<DocumentHighlight[]>('get_all_highlights');
      } catch (err) {
        console.warn('get_all_highlights failed:', err);
        return [];
      }
    }
    return [];
  },

  async saveDocumentHighlight(
    filePath: string,
    selectedText: string,
    color: string,
    note?: string
  ): Promise<DocumentHighlight> {
    if (isTauriEnvironment()) {
      return await invoke<DocumentHighlight>('save_document_highlight', {
        filePath,
        selectedText,
        color,
        note
      });
    }
    const item: DocumentHighlight = {
      id: Date.now().toString(),
      file_path: filePath,
      selected_text: selectedText,
      color,
      note,
      created_at: Math.floor(Date.now() / 1000)
    };
    try {
      const list = await this.getDocumentHighlights(filePath);
      list.push(item);
      localStorage.setItem(`tiniread_hl_${filePath}`, JSON.stringify(list));
    } catch {}
    return item;
  },

  async deleteDocumentHighlight(id: string, filePath?: string): Promise<void> {
    if (isTauriEnvironment()) {
      await invoke('delete_document_highlight', { id });
      return;
    }
    if (filePath) {
      try {
        const list = await this.getDocumentHighlights(filePath);
        localStorage.setItem(`tiniread_hl_${filePath}`, JSON.stringify(list.filter(h => h.id !== id)));
      } catch {}
    }
  },

  async openFileDialog(): Promise<string | null> {
    if (isTauriEnvironment()) {
      try {
        return await invoke<string | null>('open_file_dialog');
      } catch (err) {
        console.warn('open_file_dialog failed:', err);
        return null;
      }
    }
    return null;
  },

  async saveFileDialog(defaultName?: string): Promise<string | null> {
    if (isTauriEnvironment()) {
      try {
        return await invoke<string | null>('save_file_dialog', { defaultName });
      } catch (err) {
        console.warn('save_file_dialog failed:', err);
        return null;
      }
    }
    return null;
  },

  async openFolderDialog(): Promise<string | null> {
    if (isTauriEnvironment()) {
      try {
        return await invoke<string | null>('open_folder_dialog');
      } catch (err) {
        console.warn('open_folder_dialog failed:', err);
        return null;
      }
    }
    return null;
  },

  async watchFile(path: string): Promise<void> {
    if (isTauriEnvironment()) {
      try {
        await invoke('watch_file', { path });
      } catch (err) {
        console.warn('watch_file failed:', err);
      }
    }
  },

  async unwatchFile(): Promise<void> {
    if (isTauriEnvironment()) {
      try {
        await invoke('unwatch_file');
      } catch (err) {
        console.warn('unwatch_file failed:', err);
      }
    }
  },

  async getRecentWorkspaces(): Promise<RecentWorkspace[]> {
    if (isTauriEnvironment()) {
      try {
        return await invoke<RecentWorkspace[]>('get_recent_workspaces');
      } catch (err) {
        console.warn('get_recent_workspaces failed:', err);
        return [];
      }
    }
    return [];
  },

  async removeRecentWorkspace(path: string): Promise<void> {
    if (isTauriEnvironment()) {
      try {
        await invoke('remove_recent_workspace', { path });
      } catch (err) {
        console.warn('remove_recent_workspace failed:', err);
      }
    }
  },

  async getLastActiveDoc(): Promise<string | null> {
    if (isTauriEnvironment()) {
      try {
        return await invoke<string | null>('get_last_active_doc');
      } catch (err) {
        console.warn('get_last_active_doc failed:', err);
        return null;
      }
    }
    return null;
  }
};
