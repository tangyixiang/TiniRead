import React from 'react';
import { WorkspaceFile } from '../types';
import appIcon from '../assets/app-icon.png';

interface SidebarProps {
  documents: WorkspaceFile[];
  currentDocPath: string;
  onSelectDoc: (path: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  documents,
  currentDocPath,
  onSelectDoc
}) => {
  return (
    <aside className="w-52 bg-[var(--bg-sidebar)] border-r border-[var(--border-subtle)] flex flex-col justify-between shrink-0 transition-all duration-200">
      <div className="p-3 space-y-4">
        {/* Brand */}
        <div className="flex items-center gap-2.5 px-2 py-1 select-none">
          <img src={appIcon} alt="TiniRead" className="w-7 h-7 rounded-md object-contain shadow-xs" />
          <div className="flex flex-col justify-center">
            <div className="flex items-center text-sm tracking-tight text-[var(--text-main)] leading-tight">
              <span className="font-bold">TiniRead</span>
            </div>
          </div>
        </div>

        {/* Workspace Nav Header */}
        <nav className="space-y-1 text-xs">
          <div className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-[var(--accent-pill)] text-[var(--accent-text)] font-semibold transition shadow-sm">
            <div className="flex items-center gap-2.5">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
              </svg>
              <span>工作区文档</span>
            </div>
            <span className="text-[11px] font-mono opacity-80">{documents.length}</span>
          </div>
        </nav>

        {/* Document List Tree */}
        <div className="pt-2">
          <div className="flex items-center justify-between px-2 pb-2 text-[11px] font-semibold text-[var(--text-light)]">
            <span>文档列表</span>
          </div>
          <div className="space-y-0.5 text-xs overflow-y-auto max-h-64">
            {documents.length === 0 ? (
              <div className="px-2 py-3 text-xs text-[var(--text-light)] text-center">暂无文档</div>
            ) : (
              documents.map(doc => {
                const isActive = doc.path === currentDocPath;
                return (
                  <button
                    key={doc.path}
                    onClick={() => onSelectDoc(doc.path)}
                    className={`w-full text-left flex items-center gap-2 px-2.5 py-1.5 rounded-lg transition truncate ${
                      isActive
                        ? 'bg-[var(--bg-window)] text-[var(--text-main)] font-semibold'
                        : 'text-[var(--text-muted)] hover:bg-[var(--bg-window)] hover:text-[var(--text-main)]'
                    }`}
                  >
                    <svg className="w-3.5 h-3.5 shrink-0 opacity-70" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                      <polyline points="14 2 14 8 20 8" />
                    </svg>
                    <span className="truncate">{doc.name}</span>
                  </button>
                );
              })
            )}
          </div>
        </div>
      </div>
    </aside>
  );
};
