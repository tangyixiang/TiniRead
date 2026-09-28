import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ViewMode, RenderMode, ThemeMode, WorkspaceFile } from './types';
import { api } from './api/client';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { CardList } from './components/CardList';
import { Editor } from './components/Editor';
import { DragDropOverlay } from './components/DragDropOverlay';

export const App: React.FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('focus');
  const [renderMode, setRenderMode] = useState<RenderMode>('rendered');
  const [theme, setTheme] = useState<ThemeMode>('theme-light');

  const [documents, setDocuments] = useState<WorkspaceFile[]>([]);
  const [currentDocPath, setCurrentDocPath] = useState<string>('');
  const [currentMarkdown, setCurrentMarkdown] = useState<string>('');
  const [saveStatus, setSaveStatus] = useState<string>('');

  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [contextMenuTrigger, setContextMenuTrigger] = useState<{ x: number; y: number } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const saveTimeoutRef = useRef<any>(null);

  // Undo / Redo history
  const historyStackRef = useRef<string[]>([]);
  const historyIndexRef = useRef<number>(-1);
  const isApplyingHistoryRef = useRef<boolean>(false);

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

  // Open a specific document
  const openDocument = useCallback(async (path: string) => {
    try {
      const doc = await api.readDocument(path);
      setCurrentDocPath(path);
      const content = doc.content || '';
      setCurrentMarkdown(content);
      historyStackRef.current = [content];
      historyIndexRef.current = 0;
    } catch (err) {
      console.error('Failed to read document:', err);
    }
  }, []);

  // Load workspace documents
  const loadWorkspace = useCallback(async () => {
    try {
      const docs = await api.fetchWorkspace();
      setDocuments(docs);
      if (docs.length > 0 && !currentDocPath) {
        openDocument(docs[0].path);
      }
    } catch (e) {
      console.warn('Load workspace error:', e);
    }
  }, [currentDocPath, openDocument]);

  useEffect(() => {
    loadWorkspace();
  }, [loadWorkspace]);

  // Save current document
  const handleSave = useCallback(async () => {
    if (!currentDocPath) {
      setSaveStatus('未关联文件');
      setTimeout(() => setSaveStatus(''), 2000);
      return;
    }
    try {
      await api.saveDocument(currentDocPath, currentMarkdown);
      setSaveStatus('已保存');
      setTimeout(() => setSaveStatus(''), 1800);
    } catch (err) {
      console.error('Save failed:', err);
      setSaveStatus('保存失败');
      setTimeout(() => setSaveStatus(''), 2000);
    }
  }, [currentDocPath, currentMarkdown]);

  // Handle markdown content change
  const handleMarkdownChange = (newMd: string) => {
    setCurrentMarkdown(newMd);
    pushHistory(newMd);

    // Auto-save debounce
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      if (currentDocPath) {
        api.saveDocument(currentDocPath, newMd).catch(() => {});
      }
    }, 1500);
  };

  // Create new blank document
  const handleNewDoc = () => {
    const defaultNew = '# 新建文档\n\n在此开始撰写文档内容...';
    setCurrentDocPath('');
    setCurrentMarkdown(defaultNew);
    historyStackRef.current = [defaultNew];
    historyIndexRef.current = 0;
  };

  // Import local file via input
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = (event.target?.result as string) || '';
      setCurrentDocPath(file.name);
      setCurrentMarkdown(text);
      historyStackRef.current = [text];
      historyIndexRef.current = 0;
    };
    reader.readAsText(file);
    e.target.value = '';
  };

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
        const reader = new FileReader();
        reader.onload = (event) => {
          const text = (event.target?.result as string) || '';
          setCurrentDocPath(file.name);
          setCurrentMarkdown(text);
          historyStackRef.current = [text];
          historyIndexRef.current = 0;
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
  }, []);

  // Global hotkeys (Ctrl+S, Ctrl+Z, Ctrl+Y)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isCmdOrCtrl = e.ctrlKey || e.metaKey;

      // Ctrl + S
      if (isCmdOrCtrl && e.key.toLowerCase() === 's') {
        e.preventDefault();
        handleSave();
        return;
      }

      // Ctrl + Z (Undo)
      if (isCmdOrCtrl && !e.shiftKey && e.key.toLowerCase() === 'z') {
        if (historyIndexRef.current > 0) {
          e.preventDefault();
          isApplyingHistoryRef.current = true;
          historyIndexRef.current -= 1;
          const target = historyStackRef.current[historyIndexRef.current];
          setCurrentMarkdown(target);
          setTimeout(() => { isApplyingHistoryRef.current = false; }, 50);
        }
        return;
      }

      // Ctrl + Y or Ctrl + Shift + Z (Redo)
      if ((isCmdOrCtrl && e.key.toLowerCase() === 'y') || (isCmdOrCtrl && e.shiftKey && e.key.toLowerCase() === 'z')) {
        if (historyIndexRef.current < historyStackRef.current.length - 1) {
          e.preventDefault();
          isApplyingHistoryRef.current = true;
          historyIndexRef.current += 1;
          const target = historyStackRef.current[historyIndexRef.current];
          setCurrentMarkdown(target);
          setTimeout(() => { isApplyingHistoryRef.current = false; }, 50);
        }
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSave]);

  const currentDocName = currentDocPath
    ? (currentDocPath.split(/[\\/]/).pop() || currentDocPath)
    : 'TiniRead 本地编辑与阅读';

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
          theme={theme}
          onThemeChange={setTheme}
          onInsertClick={(e) => {
            const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
            setContextMenuTrigger({ x: rect.left, y: rect.bottom + 6 });
          }}
          onImportClick={() => fileInputRef.current?.click()}
        />

        {/* Workspace Columns */}
        <div className="flex-1 flex overflow-hidden">
          {/* Column 1: Sidebar (Only visible in 'three' mode) */}
          {viewMode === 'three' && (
            <Sidebar
              documents={documents}
              currentDocPath={currentDocPath}
              onSelectDoc={openDocument}
            />
          )}

          {/* Column 2: Card List (Visible in 'two' and 'three' mode) */}
          {(viewMode === 'two' || viewMode === 'three') && (
            <CardList
              documents={documents}
              currentDocPath={currentDocPath}
              onSelectDoc={openDocument}
              onNewDoc={handleNewDoc}
            />
          )}

          {/* Column 3: In-Place Editor */}
          <Editor
            markdown={currentMarkdown}
            onChange={handleMarkdownChange}
            renderMode={renderMode}
            onSave={handleSave}
            saveStatus={saveStatus}
            contextMenuTrigger={contextMenuTrigger}
            onContextMenuTriggerHandled={() => setContextMenuTrigger(null)}
          />
        </div>

        {/* Drag and Drop Mask */}
        <DragDropOverlay isDragging={isDragging} />

        {/* Hidden File Input */}
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
