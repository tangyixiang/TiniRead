import React, { useState } from 'react';
import { SidebarTab, RecentWorkspace } from '../types';
import appIcon from '../assets/app-icon.png';

interface SidebarProps {
  currentTab: SidebarTab;
  onTabChange: (tab: SidebarTab) => void;
  workspaceCount: number;
  recentCount: number;
  highlightsCount: number;
  currentWorkspace?: { path: string; name: string } | null;
  recentWorkspaces?: RecentWorkspace[];
  onSelectWorkspace?: (path: string) => void;
  onRemoveRecentWorkspace?: (path: string, e: React.MouseEvent) => void;
  onOpenFile: () => void;
  onOpenFolder?: () => void;
  onNewDoc: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onTabChange,
  workspaceCount,
  recentCount,
  highlightsCount,
  currentWorkspace,
  recentWorkspaces = [],
  onSelectWorkspace,
  onRemoveRecentWorkspace,
  onOpenFile,
  onOpenFolder,
  onNewDoc
}) => {
  const [isWorkspaceMenuOpen, setIsWorkspaceMenuOpen] = useState(false);

  return (
    <aside className="w-52 bg-[var(--bg-sidebar)] border-r border-[var(--border-subtle)] flex flex-col justify-between shrink-0 select-none">
      <div className="p-3 space-y-3">
        {/* Brand */}
        <div className="flex items-center gap-2.5 px-2 py-1">
          <img src={appIcon} alt="TiniRead" className="w-7 h-7 rounded-md object-contain shadow-xs" />
          <div className="flex flex-col justify-center">
            <div className="flex items-center text-sm tracking-tight text-[var(--text-main)] leading-tight">
              <span className="font-bold">TiniRead</span>
            </div>
          </div>
        </div>

        {/* Current Workspace Selector & Badge */}
        <div className="relative">
          <button
            onClick={() => setIsWorkspaceMenuOpen(!isWorkspaceMenuOpen)}
            className="w-full flex items-center justify-between p-2 rounded-xl bg-[var(--bg-card)] border border-[var(--border-subtle)] hover:border-[var(--border-strong)] transition cursor-pointer text-left shadow-2xs group"
            title={currentWorkspace?.path || '点击选择工作区'}
          >
            <div className="flex items-center gap-2 overflow-hidden min-w-0">
              <div className="w-6 h-6 rounded-lg bg-[var(--accent-pill)]/5 flex items-center justify-center text-[var(--text-main)] shrink-0">
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                </svg>
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-semibold text-[var(--text-main)] truncate leading-tight">
                  {currentWorkspace?.path ? currentWorkspace.name : '选择工作区'}
                </span>
                {currentWorkspace?.path && (
                  <span className="text-[10px] text-[var(--text-light)] truncate leading-tight">
                    {workspaceCount} 篇文档
                  </span>
                )}
              </div>
            </div>
            <svg
              className={`w-3.5 h-3.5 text-[var(--text-light)] group-hover:text-[var(--text-main)] transition shrink-0 ml-1 ${
                isWorkspaceMenuOpen ? 'rotate-180' : ''
              }`}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="m6 9 6 6 6-6" />
            </svg>
          </button>

          {/* Workspace Switcher Dropdown */}
          {isWorkspaceMenuOpen && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setIsWorkspaceMenuOpen(false)} />
              <div className="absolute top-full left-0 right-0 mt-1.5 p-1.5 rounded-xl bg-[var(--bg-card)] border border-[var(--border-subtle)] shadow-xl z-40 space-y-1 text-xs select-none">
                <div className="px-2 py-1 text-[10px] font-semibold text-[var(--text-light)] uppercase tracking-wider">
                  工作区
                </div>
                <div className="max-h-48 overflow-y-auto space-y-0.5">
                  {recentWorkspaces.length === 0 ? (
                    <div className="px-2 py-2 text-[11px] text-[var(--text-light)] text-center">暂无历史记录</div>
                  ) : (
                    recentWorkspaces.map((ws) => {
                      const isCurrent = ws.path === currentWorkspace?.path;
                      return (
                        <div
                          key={ws.path}
                          onClick={() => {
                            onSelectWorkspace?.(ws.path);
                            setIsWorkspaceMenuOpen(false);
                          }}
                          className={`flex items-center justify-between px-2 py-1.5 rounded-lg cursor-pointer transition group/item ${
                            isCurrent
                              ? 'bg-[var(--bg-window)] text-[var(--text-main)] font-semibold'
                              : 'text-[var(--text-muted)] hover:bg-[var(--bg-window)] hover:text-[var(--text-main)]'
                          }`}
                        >
                          <div className="flex flex-col min-w-0 pr-1">
                            <span className="truncate text-xs">{ws.name}</span>
                            <span className="truncate text-[9px] text-[var(--text-light)]">{ws.path}</span>
                          </div>
                          {!isCurrent && onRemoveRecentWorkspace && (
                            <button
                              onClick={(e) => onRemoveRecentWorkspace(ws.path, e)}
                              className="opacity-0 group-hover/item:opacity-100 p-1 text-[var(--text-light)] hover:text-rose-500 rounded transition"
                              title="移除记录"
                            >
                              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M18 6 6 18M6 6l12 12" />
                              </svg>
                            </button>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
                <div className="pt-1 border-t border-[var(--border-subtle)]">
                  <button
                    onClick={() => {
                      setIsWorkspaceMenuOpen(false);
                      onOpenFolder?.();
                    }}
                    className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-[var(--text-main)] hover:bg-[var(--bg-window)] transition text-xs font-medium cursor-pointer"
                  >
                    <svg className="w-3.5 h-3.5 text-[var(--text-light)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 5v14M5 12h14" />
                    </svg>
                    <span>打开工作区...</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Categories Navigation */}
        <nav className="space-y-1 text-xs">
          <button
            onClick={() => onTabChange('workspace')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl font-medium transition ${
              currentTab === 'workspace'
                ? 'bg-[var(--accent-pill)] text-[var(--accent-text)] font-semibold shadow-xs'
                : 'text-[var(--text-muted)] hover:bg-[var(--bg-window)] hover:text-[var(--text-main)]'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
              </svg>
              <span>工作区文档</span>
            </div>
            <span className="text-[11px] font-mono opacity-80">{workspaceCount}</span>
          </button>

          <button
            onClick={() => onTabChange('recent')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl font-medium transition ${
              currentTab === 'recent'
                ? 'bg-[var(--accent-pill)] text-[var(--accent-text)] font-semibold shadow-xs'
                : 'text-[var(--text-muted)] hover:bg-[var(--bg-window)] hover:text-[var(--text-main)]'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              <span>最近打开</span>
            </div>
            <span className="text-[11px] font-mono opacity-80">{recentCount}</span>
          </button>

          <button
            onClick={() => onTabChange('highlights')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl font-medium transition ${
              currentTab === 'highlights'
                ? 'bg-[var(--accent-pill)] text-[var(--accent-text)] font-semibold shadow-xs'
                : 'text-[var(--text-muted)] hover:bg-[var(--bg-window)] hover:text-[var(--text-main)]'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="m18 2 4 4-14 14H4v-4L18 2z" />
                <path d="m14.5 5.5 4 4" />
              </svg>
              <span>划线高亮</span>
            </div>
            <span className="text-[11px] font-mono opacity-80">{highlightsCount}</span>
          </button>
        </nav>
      </div>

      {/* Quick Action Footer */}
      <div className="p-3 border-t border-[var(--border-subtle)] space-y-1.5">
        <button
          onClick={onOpenFile}
          className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-[var(--text-muted)] hover:bg-[var(--bg-window)] hover:text-[var(--text-main)] transition cursor-pointer"
        >
          <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
          <span>打开本地文件...</span>
        </button>

        {onOpenFolder && (
          <button
            onClick={onOpenFolder}
            className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-[var(--text-muted)] hover:bg-[var(--bg-window)] hover:text-[var(--text-main)] transition cursor-pointer"
          >
            <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
            </svg>
            <span>打开工作区...</span>
          </button>
        )}

        <button
          onClick={onNewDoc}
          className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-[var(--text-muted)] hover:bg-[var(--bg-window)] hover:text-[var(--text-main)] transition cursor-pointer"
        >
          <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          <span>新建空白文档</span>
        </button>
      </div>
    </aside>
  );
};
