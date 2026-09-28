import { invoke } from '@tauri-apps/api/core';
import { WorkspaceFile, DocumentData } from '../types';

function isTauriEnvironment(): boolean {
  return typeof window !== 'undefined' && ('__TAURI_INTERNALS__' in window || '__TAURI__' in window);
}

export const api = {
  isTauri(): boolean {
    return isTauriEnvironment();
  },

  async fetchWorkspace(): Promise<WorkspaceFile[]> {
    if (isTauriEnvironment()) {
      try {
        const res = await invoke<WorkspaceFile[]>('scan_workspace');
        return Array.isArray(res) ? res : [];
      } catch (err) {
        console.warn('scan_workspace failed:', err);
        return [];
      }
    }

    const res = await fetch('/api/workspace');
    if (!res.ok) throw new Error('获取工作区失败');
    const json = await res.json();
    return Array.isArray(json) ? json : (json.data || []);
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

  async saveDocument(path: string, htmlContent: string, title?: string): Promise<void> {
    if (isTauriEnvironment()) {
      await invoke('save_document', {
        path,
        htmlContent,
        html_content: htmlContent
      });
      return;
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
  }
};

