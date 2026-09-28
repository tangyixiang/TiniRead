import React, { useState, useEffect, useRef, useCallback } from 'react';
import { listen } from '@tauri-apps/api/event';
import { ViewMode, RenderMode, ThemeMode, WorkspaceFile, RecentDocument, DocumentHighlight, SidebarTab, RecentWorkspace } from './types';
import { api } from './api/client';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { CardList } from './components/CardList';
import { Editor } from './components/Editor';
import { DragDropOverlay } from './components/DragDropOverlay';
import { Toast, ToastMessage, ToastType } from './components/Toast';

export const App: React.FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('three');
  const [renderMode, setRenderMode] = useState<RenderMode>('rendered');
  const [theme, setTheme] = useState<ThemeMode>('theme-light');
  const [sidebarTab, setSidebarTab] = useState<SidebarTab>('workspace');

  const [documents, setDocuments] = useState<WorkspaceFile[]>([]);
  const [currentWorkspace, setCurrentWorkspace] = useState<{ path: string; name: string } | null>(null);
  const [recentWorkspaces, setRecentWorkspaces] = useState<RecentWorkspace[]>([]);
  const [recentDocs, setRecentDocs] = useState<RecentDocument[]>([]);
  const [allHighlights, setAllHighlights] = useState<DocumentHighlight[]>([]);

  const [currentDocPath, setCurrentDocPath] = useState<string>('');
  const [currentMarkdown, setCurrentMarkdown] = useState<string>('');
  const [saveStatus, setSaveStatus] = useState<string>('');
  const [isDirty, setIsDirty] = useState<boolean>(false);
  const [initialScrollProgress, setInitialScrollProgress] = useState<number>(0);
  const [targetHighlightText, setTargetHighlightText] = useState<string | null>(null);
  const [externalConflict, setExternalConflict] = useState<{ path: string; content: string } | null>(null);

  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [contextMenuTrigger, setContextMenuTrigger] = useState<{ x: number; y: number } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const saveTimeoutRef = useRef<any>(null);
  const savedMarkdownRef = useRef<string>('');
  const currentDocPathRef = useRef<string>('');
  const currentMarkdownRef = useRef<string>('');
  const isDirtyRef = useRef<boolean>(false);

  // Undo / Redo history
  const historyStackRef = useRef<string[]>([]);
  const historyIndexRef = useRef<number>(-1);
  const isApplyingHistoryRef = useRef<boolean>(false);
  const hasInitializedRef = useRef<boolean>(false);

  // Toast notifications (strictly capped to at most 3 with deduplication)
  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = Date.now().toString() + Math.random().toString().slice(2, 6);
    setToasts((prev) => {
      const filtered = prev.filter((t) => {
        if (t.message === message) return false;
        if (message.startsWith('已加载文档') && t.message.startsWith('已加载文档')) {
          return false;
        }
        return true;
      });
      return [...filtered.slice(-2), { id, message, type }];
    });
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Push history state
  const pushHistory = useCallback((md: string) => {
    if (isApplyingHistoryRef.current) return;
    const stack = historyStackRef.current;
    const idx = historyIndexRef.current;
    if (idx >= 0 && stack[idx] === md) return;

    const newStack = stack.slice(0, idx + 1);
    newStack.push(md);
    if (newStack.length > 40) newStack.shift();
    historyStackRef.current = newStack;
    historyIndexRef.current = newStack.length - 1;
  }, []);

  // Theme application
  useEffect(() => {
    document.documentElement.className = theme;
  }, [theme]);

  // Platform detection for Mac/Windows titlebar styling
  useEffect(() => {
    const isMac = /macintosh|mac os x/i.test(navigator.userAgent);
    document.body.classList.add(isMac ? 'platform-mac' : 'platform-win');
  }, []);

  // Load recent workspaces from SQLite
  const loadRecentWorkspaces = useCallback(async () => {
    try {
      const recents = await api.getRecentWorkspaces();
      setRecentWorkspaces(recents);
    } catch (e) {
      console.warn('Load recent workspaces error:', e);
    }
  }, []);

  // Load recent documents from SQLite
  const loadRecentDocs = useCallback(async () => {
    try {
      const recents = await api.getRecentDocuments();
      setRecentDocs(recents);
    } catch (e) {
      console.warn('Load recent docs error:', e);
    }
  }, []);

  // Load all highlights from SQLite
  const loadHighlights = useCallback(async () => {
    try {
      const hls = await api.getAllHighlights();
      setAllHighlights(hls);
    } catch (e) {
      console.warn('Load highlights error:', e);
    }
  }, []);

  // Open a specific document
  const openDocument = useCallback(
    async (path: string) => {
      try {
        setExternalConflict(null);
        const doc = await api.readDocument(path);
        const resolvedPath = doc.path || path;
        setCurrentDocPath(resolvedPath);
        const content = doc.content || '';
        setCurrentMarkdown(content);
        savedMarkdownRef.current = content;
        currentMarkdownRef.current = content;
        setIsDirty(false);
        historyStackRef.current = [content];
        historyIndexRef.current = 0;

        // Find scroll progress if available
        const found = recentDocs.find((r) => r.file_path === resolvedPath);
        if (found && found.scroll_progress > 0) {
          setInitialScrollProgress(found.scroll_progress);
        } else {
          setInitialScrollProgress(0);
        }

        loadRecentDocs();
        loadHighlights();
      } catch (err) {
        console.error('Failed to read document:', err);
        showToast('读取文档失败', 'error');
      }
    },
    [recentDocs, loadRecentDocs, loadHighlights, showToast]
  );

  // Sync refs to avoid stale closures in event listener
  useEffect(() => {
    currentDocPathRef.current = currentDocPath;
  }, [currentDocPath]);

  useEffect(() => {
    currentMarkdownRef.current = currentMarkdown;
  }, [currentMarkdown]);

  useEffect(() => {
    isDirtyRef.current = isDirty;
  }, [isDirty]);

  // Watch current document file changes
  useEffect(() => {
    if (currentDocPath) {
      api.watchFile(currentDocPath);
    } else {
      api.unwatchFile();
    }

    return () => {
      api.unwatchFile();
    };
  }, [currentDocPath]);

  // Handle external file changes
  const handleExternalFileChange = useCallback(
    (path: string, newContent: string) => {
      const current = currentDocPathRef.current;
      if (!current) return;

      const normalize = (p: string) => p.replace(/\\/g, '/').toLowerCase();
      const currentNorm = normalize(current);
      const pathNorm = normalize(path);

      if (pathNorm !== currentNorm && !pathNorm.endsWith(currentNorm.split('/').pop() || '')) {
        return;
      }

      if (newContent === currentMarkdownRef.current) {
        return;
      }

      currentMarkdownRef.current = newContent;

      if (!isDirtyRef.current) {
        setCurrentMarkdown(newContent);
        savedMarkdownRef.current = newContent;
        historyStackRef.current = [newContent];
        historyIndexRef.current = 0;
        setExternalConflict(null);
        showToast('已自动同步外部修改', 'info');
      } else {
        setExternalConflict({ path, content: newContent });
      }
    },
    [showToast]
  );

  // Listen for Tauri file-changed events
  useEffect(() => {
    let unlistenFn: (() => void) | null = null;

    if (api.isTauri()) {
      listen<{ path: string; content: string }>('file-changed', (event) => {
        if (event && event.payload) {
          handleExternalFileChange(event.payload.path, event.payload.content);
        }
      }).then((unlisten) => {
        unlistenFn = unlisten;
      });
    }

    return () => {
      if (unlistenFn) unlistenFn();
    };
  }, [handleExternalFileChange]);

  const handleReloadExternal = () => {
    if (!externalConflict) return;
    setCurrentMarkdown(externalConflict.content);
    savedMarkdownRef.current = externalConflict.content;
    setIsDirty(false);
    historyStackRef.current = [externalConflict.content];
    historyIndexRef.current = 0;
    setExternalConflict(null);
    showToast('已载入外部最新内容', 'info');
  };

  const handleKeepLocal = () => {
    setExternalConflict(null);
    showToast('已保留当前本地编辑', 'info');
  };

  // Load workspace documents
  const loadWorkspace = useCallback(async (customPath?: string) => {
    try {
      const info = await api.fetchWorkspace(customPath);
      setDocuments(info.files || []);
      if (info.path) {
        setCurrentWorkspace({ path: info.path, name: info.name });
      } else {
        setCurrentWorkspace(null);
      }
      loadRecentWorkspaces();
    } catch (e) {
      console.warn('Load workspace error:', e);
    }
  }, [loadRecentWorkspaces]);

  // Initial application setup & restoration
  useEffect(() => {
    if (hasInitializedRef.current) return;
    hasInitializedRef.current = true;

    const initApp = async () => {
      await loadWorkspace();
      loadRecentDocs();
      loadHighlights();
      loadRecentWorkspaces();

      try {
        const lastDoc = await api.getLastActiveDoc();
        if (lastDoc) {
          openDocument(lastDoc);
        }
      } catch (err) {
        console.warn('Restore last active doc error:', err);
      }
    };

    initApp();
  }, [loadWorkspace, loadRecentDocs, loadHighlights, loadRecentWorkspaces, openDocument]);

  // Save current document
  const handleSave = useCallback(async () => {
    let targetPath = currentDocPath;
    if (!targetPath) {
      // Unnamed document: trigger native save as dialog
      const chosen = await api.saveFileDialog('未命名文档.md');
      if (!chosen) return;
      targetPath = chosen;
      setCurrentDocPath(chosen);
    }

    try {
      const savedPath = await api.saveDocument(targetPath, currentMarkdown);
      if (savedPath) setCurrentDocPath(savedPath);
      savedMarkdownRef.current = currentMarkdown;
      setIsDirty(false);
      setSaveStatus('已保存');
      showToast('文档已成功保存', 'success');
      loadWorkspace();
      loadRecentDocs();
      setTimeout(() => setSaveStatus(''), 1800);
    } catch (err) {
      console.error('Save failed:', err);
      setSaveStatus('保存失败');
      showToast('保存失败，请检查文件权限', 'error');
      setTimeout(() => setSaveStatus(''), 2000);
    }
  }, [currentDocPath, currentMarkdown, showToast, loadWorkspace, loadRecentDocs]);

  // Handle markdown content change
  const handleMarkdownChange = (newMd: string) => {
    setCurrentMarkdown(newMd);
    pushHistory(newMd);
    setIsDirty(newMd !== savedMarkdownRef.current);

    // Auto-save debounce
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(async () => {
      if (currentDocPath) {
        try {
          await api.saveDocument(currentDocPath, newMd);
          savedMarkdownRef.current = newMd;
          setIsDirty(false);
          setSaveStatus('已自动保存');
          setTimeout(() => setSaveStatus(''), 1500);
        } catch {
          // Silent fallback for auto-save
        }
      }
    }, 1500);
  };

  // Create new blank document
  const handleNewDoc = useCallback(() => {
    setExternalConflict(null);
    setCurrentDocPath('');
    setCurrentMarkdown('');
    savedMarkdownRef.current = '';
    setIsDirty(false);
    historyStackRef.current = [''];
    historyIndexRef.current = 0;
    setInitialScrollProgress(0);
    showToast('已新建空白文档', 'info');
  }, [showToast]);

  // Open and switch workspace folder
  const handleOpenFolder = useCallback(async () => {
    const chosen = await api.openFolderDialog();
    if (chosen) {
      await loadWorkspace(chosen);
      showToast(`已加载工作区：${chosen.split(/[\\/]/).pop() || chosen}`, 'info');
    }
  }, [loadWorkspace, showToast]);

  // Switch to another workspace
  const handleSelectWorkspace = useCallback(
    async (path: string) => {
      await loadWorkspace(path);
      showToast(`已切换工作区：${path.split(/[\\/]/).pop() || path}`, 'info');
    },
    [loadWorkspace, showToast]
  );

  // Remove workspace from recent list
  const handleRemoveRecentWorkspace = useCallback(
    async (path: string, e: React.MouseEvent) => {
      e.stopPropagation();
      await api.removeRecentWorkspace(path);
      loadRecentWorkspaces();
      showToast('已移除工作区记录', 'info');
    },
    [loadRecentWorkspaces, showToast]
  );

  // Open file via native dialog or input fallback
  const handleOpenFile = async () => {
    if (api.isTauri()) {
      const chosen = await api.openFileDialog();
      if (chosen) {
        await openDocument(chosen);
      }
      return;
    }

    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Import local file via input fallback
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = (event.target?.result as string) || '';
      setCurrentDocPath(file.name);
      setCurrentMarkdown(text);
      savedMarkdownRef.current = text;
      setIsDirty(false);
      historyStackRef.current = [text];
      historyIndexRef.current = 0;
      showToast(`已打开：${file.name}`, 'info');
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Add highlight to SQLite
  const handleAddHighlight = useCallback(
    async (selectedText: string, colorClass: string) => {
      if (!currentDocPath) return;
      try {
        await api.saveDocumentHighlight(currentDocPath, selectedText, colorClass);
        loadHighlights();
        showToast('已保存划线高亮', 'success');
      } catch (err) {
        console.error('Save highlight error:', err);
      }
    },
    [currentDocPath, loadHighlights, showToast]
  );

  // Remove single recent doc record
  const handleRemoveRecent = useCallback(
    async (id: string, e: React.MouseEvent) => {
      e.stopPropagation();
      await api.removeRecentDocument(id);
      loadRecentDocs();
      showToast('已移除该记录', 'info');
    },
    [loadRecentDocs, showToast]
  );

  // Clear all recent doc records
  const handleClearRecent = useCallback(async () => {
    await api.clearRecentDocuments();
    loadRecentDocs();
    showToast('已清空最近记录', 'info');
  }, [loadRecentDocs, showToast]);

  // Delete single highlight
  const handleDeleteHighlight = useCallback(
    async (id: string, e: React.MouseEvent) => {
      e.stopPropagation();
      await api.deleteDocumentHighlight(id, currentDocPath);
      loadHighlights();
      showToast('已删除高亮', 'info');
    },
    [currentDocPath, loadHighlights, showToast]
  );

  // Jump to and locate highlight
  const handleSelectHighlight = useCallback(
    async (hl: DocumentHighlight) => {
      if (hl.file_path !== currentDocPath) {
        await openDocument(hl.file_path);
      }
      setTargetHighlightText(hl.selected_text);
    },
    [currentDocPath, openDocument]
  );

  // Remove highlight by text
  const handleRemoveHighlight = useCallback(
    async (removedText: string) => {
      if (!currentDocPath) return;
      const clean = removedText.trim();
      const matched = allHighlights.find(
        (h) =>
          h.file_path === currentDocPath &&
          (h.selected_text.trim() === clean ||
            h.selected_text.includes(clean) ||
            clean.includes(h.selected_text))
      );
      if (matched) {
        await api.deleteDocumentHighlight(matched.id, currentDocPath);
        loadHighlights();
      }
      showToast('已清除高亮', 'info');
    },
    [currentDocPath, allHighlights, loadHighlights, showToast]
  );

  // Scroll progress update
  const handleScrollProgressChange = useCallback(
    (progress: number) => {
      if (currentDocPath) {
        api.updateDocumentProgress(currentDocPath, progress);
      }
    },
    [currentDocPath]
  );

  // Drag and drop file import
  useEffect(() => {
    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
      setIsDragging(true);
    };
    const handleDragLeave = (e: DragEvent) => {
      e.preventDefault();
      if (e.clientX <= 0 || e.clientY <= 0) {
        setIsDragging(false);
      }
    };
    const handleDrop = (e: DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer?.files?.[0];
      if (file && (file.name.endsWith('.md') || file.name.endsWith('.markdown') || file.name.endsWith('.txt'))) {
        // In desktop environments, file object might carry absolute path
        const possiblePath = (file as any).path;
        if (possiblePath) {
          openDocument(possiblePath);
          return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
          const text = (event.target?.result as string) || '';
          setCurrentDocPath(file.name);
          setCurrentMarkdown(text);
          savedMarkdownRef.current = text;
          setIsDirty(false);
          historyStackRef.current = [text];
          historyIndexRef.current = 0;
          showToast(`已拖拽导入：${file.name}`, 'info');
        };
        reader.readAsText(file);
      }
    };

    window.addEventListener('dragover', handleDragOver);
    window.addEventListener('dragleave', handleDragLeave);
    window.addEventListener('drop', handleDrop);

    return () => {
      window.removeEventListener('dragover', handleDragOver);
      window.removeEventListener('dragleave', handleDragLeave);
      window.removeEventListener('drop', handleDrop);
    };
  }, [openDocument, showToast]);

  // Global hotkeys (Cmd/Ctrl+S, Cmd/Ctrl+O, Cmd/Ctrl+Z, Cmd/Ctrl+Y)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isCmdOrCtrl = e.ctrlKey || e.metaKey;

      // Cmd/Ctrl + N (New Blank Document)
      if (isCmdOrCtrl && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        handleNewDoc();
        return;
      }

      // Cmd/Ctrl + S
      if (isCmdOrCtrl && e.key.toLowerCase() === 's') {
        e.preventDefault();
        handleSave();
        return;
      }

      // Cmd/Ctrl + O
      if (isCmdOrCtrl && e.key.toLowerCase() === 'o') {
        e.preventDefault();
        handleOpenFile();
        return;
      }

      // Cmd/Ctrl + Z (Undo)
      if (isCmdOrCtrl && !e.shiftKey && e.key.toLowerCase() === 'z') {
        if (historyIndexRef.current > 0) {
          e.preventDefault();
          isApplyingHistoryRef.current = true;
          historyIndexRef.current -= 1;
          const target = historyStackRef.current[historyIndexRef.current];
          setCurrentMarkdown(target);
          setTimeout(() => {
            isApplyingHistoryRef.current = false;
          }, 50);
        }
        return;
      }

      // Cmd/Ctrl + Y or Shift+Cmd/Ctrl+Z (Redo)
      if ((isCmdOrCtrl && e.key.toLowerCase() === 'y') || (isCmdOrCtrl && e.shiftKey && e.key.toLowerCase() === 'z')) {
        if (historyIndexRef.current < historyStackRef.current.length - 1) {
          e.preventDefault();
          isApplyingHistoryRef.current = true;
          historyIndexRef.current += 1;
          const target = historyStackRef.current[historyIndexRef.current];
          setCurrentMarkdown(target);
          setTimeout(() => {
            isApplyingHistoryRef.current = false;
          }, 50);
        }
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSave, handleNewDoc, handleOpenFile]);

  const currentDocName = currentDocPath
    ? currentDocPath.split(/[\\/]/).pop() || currentDocPath
    : '未命名文档.md';

  return (
    <div className="h-screen w-screen flex flex-col antialiased overflow-hidden select-none">
      <div className="flex-1 bg-[var(--bg-card)] flex flex-col overflow-hidden relative">
        {/* Header */}
        <Header
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          renderMode={renderMode}
          onRenderModeChange={setRenderMode}
          docTitle={currentDocName}
          isDirty={isDirty}
          theme={theme}
          onThemeChange={setTheme}
          onInsertClick={(e) => {
            const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
            setContextMenuTrigger({ x: rect.left, y: rect.bottom + 6 });
          }}
          onImportClick={handleOpenFile}
        />

        {/* External File Conflict Banner */}
        {externalConflict && (
          <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-2 flex items-center justify-between text-xs text-amber-800 dark:text-amber-300 z-20 shrink-0">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span>外部文件已被修改，当前存在未保存的编辑草稿。</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleReloadExternal}
                className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded font-medium transition cursor-pointer"
              >
                重新载入外部内容
              </button>
              <button
                onClick={handleKeepLocal}
                className="px-2.5 py-1 bg-[var(--bg-card)] hover:bg-[var(--bg-window)] border border-[var(--border-subtle)] text-[var(--text-main)] rounded font-medium transition cursor-pointer"
              >
                保留当前编辑
              </button>
            </div>
          </div>
        )}

        {/* Workspace Columns */}
        <div className="flex-1 flex overflow-hidden">
          {/* Column 1: Sidebar Navigation (Visible in 'three' mode) */}
          {viewMode === 'three' && (
            <Sidebar
              currentTab={sidebarTab}
              onTabChange={setSidebarTab}
              workspaceCount={documents.length}
              recentCount={recentDocs.length}
              highlightsCount={allHighlights.length}
              currentWorkspace={currentWorkspace}
              recentWorkspaces={recentWorkspaces}
              onSelectWorkspace={handleSelectWorkspace}
              onRemoveRecentWorkspace={handleRemoveRecentWorkspace}
              onOpenFile={handleOpenFile}
              onOpenFolder={handleOpenFolder}
              onNewDoc={handleNewDoc}
            />
          )}

          {/* Column 2: Card List (Visible in 'two' and 'three' mode) */}
          {(viewMode === 'two' || viewMode === 'three') && (
            <CardList
              currentTab={sidebarTab}
              onTabChange={setSidebarTab}
              showTabSwitcher={viewMode === 'two'}
              documents={documents}
              recentDocs={recentDocs}
              highlights={allHighlights}
              currentDocPath={currentDocPath}
              onSelectDoc={openDocument}
              onSelectHighlight={handleSelectHighlight}
              onOpenFolder={handleOpenFolder}
              onNewDoc={handleNewDoc}
              onRemoveRecent={handleRemoveRecent}
              onClearRecent={handleClearRecent}
              onDeleteHighlight={handleDeleteHighlight}
            />
          )}

          {/* Column 3: In-Place Editor */}
          <Editor
            currentDocPath={currentDocPath}
            markdown={currentMarkdown}
            onChange={handleMarkdownChange}
            renderMode={renderMode}
            onSave={handleSave}
            saveStatus={saveStatus}
            contextMenuTrigger={contextMenuTrigger}
            onContextMenuTriggerHandled={() => setContextMenuTrigger(null)}
            onAddHighlight={handleAddHighlight}
            onRemoveHighlight={handleRemoveHighlight}
            initialScrollProgress={initialScrollProgress}
            onScrollProgressChange={handleScrollProgressChange}
            targetHighlightText={targetHighlightText}
            onHighlightLocated={() => setTargetHighlightText(null)}
          />
        </div>

        {/* Global Toast Alerts */}
        <Toast toasts={toasts} onDismiss={dismissToast} />

        {/* Drag and Drop Mask */}
        <DragDropOverlay isDragging={isDragging} />

        {/* Hidden Fallback File Input */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileInputChange}
          accept=".md,.markdown,.txt"
          className="hidden"
        />
      </div>
    </div>
  );
};
