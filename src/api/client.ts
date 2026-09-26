import { WorkspaceFile, DocumentData } from '../types';

declare global {
  interface Window {
    __TAURI__?: {
      core?: {
        invoke: <T = any>(cmd: string, args?: Record<string, any>) => Promise<T>;
      };
      invoke?: <T = any>(cmd: string, args?: Record<string, any>) => Promise<T>;
    };
    __TAURI_INTERNALS__?: {
      invoke?: <T = any>(cmd: string, args?: Record<string, any>) => Promise<T>;
    };
  }
}

function getTauriInvoker() {
  return window.__TAURI__?.core?.invoke || window.__TAURI__?.invoke || window.__TAURI_INTERNALS__?.invoke || null;
}

export const api = {
  isTauri(): boolean {
    return !!getTauriInvoker();
  },

  async fetchWorkspace(): Promise<WorkspaceFile[]> {
    const invoker = getTauriInvoker();
    if (invoker) {
      const res = await invoker<WorkspaceFile[]>('scan_workspace');
      return Array.isArray(res) ? res : [];
    }

    const res = await fetch('/api/workspace');
    if (!res.ok) throw new Error('获取工作区失败');
    const json = await res.json();
    return Array.isArray(json) ? json : (json.data || []);
  },

  async readDocument(path: string): Promise<DocumentData> {
    const invoker = getTauriInvoker();
    if (invoker) {
      const res = await invoker<DocumentData>('read_document', { path });
      return res;
    }

    const res = await fetch(`/api/read?path=${encodeURIComponent(path)}`);
    if (!res.ok) throw new Error('读取文档失败');
    const json = await res.json();
    return json.data || json;
  },

  async saveDocument(path: string, htmlContent: string, title?: string): Promise<void> {
    const invoker = getTauriInvoker();
    if (invoker) {
      await invoker('save_document', {
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
