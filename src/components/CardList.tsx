import React, { useState } from 'react';
import { WorkspaceFile, RecentDocument, DocumentHighlight, SidebarTab } from '../types';

interface CardListProps {
  currentTab: SidebarTab;
  onTabChange: (tab: SidebarTab) => void;
  showTabSwitcher: boolean;
  documents: WorkspaceFile[];
  recentDocs: RecentDocument[];
  highlights: DocumentHighlight[];
  currentDocPath: string;
  onSelectDoc: (path: string) => void;
  onSelectHighlight?: (hl: DocumentHighlight) => void;
  onOpenFolder?: () => void;
  onNewDoc: () => void;
  onRemoveRecent: (id: string, e: React.MouseEvent) => void;
  onClearRecent: () => void;
  onDeleteHighlight: (id: string, e: React.MouseEvent) => void;
}

function formatRelativeTime(timestamp: number): string {
  if (!timestamp) return '未知时间';
  const now = Math.floor(Date.now() / 1000);
  const diff = now - timestamp;
  if (diff < 60) return '刚刚';
  if (diff < 3600) return `${Math.floor(diff / 60)} 分钟前`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} 小时前`;
  if (diff < 259200) return `${Math.floor(diff / 86400)} 天前`;
  const date = new Date(timestamp * 1000);
  return `${date.getMonth() + 1}月${date.getDate()}日`;
}

function getHighlightBadge(color: string): { bg: string; border: string; text: string } {
  switch (color) {
    case 'hl-green':
      return { bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', text: 'text-emerald-600 dark:text-emerald-400' };
    case 'hl-blue':
      return { bg: 'bg-sky-500/10', border: 'border-sky-500/30', text: 'text-sky-600 dark:text-sky-400' };
    case 'hl-pink':
      return { bg: 'bg-pink-500/10', border: 'border-pink-500/30', text: 'text-pink-600 dark:text-pink-400' };
    case 'hl-purple':
      return { bg: 'bg-purple-500/10', border: 'border-purple-500/30', text: 'text-purple-600 dark:text-purple-400' };
    case 'hl-yellow':
    default:
      return { bg: 'bg-amber-500/10', border: 'border-amber-500/30', text: 'text-amber-600 dark:text-amber-400' };
  }
}

export const CardList: React.FC<CardListProps> = ({
  currentTab,
  onTabChange,
  showTabSwitcher,
  documents,
  recentDocs,
  highlights,
  currentDocPath,
  onSelectDoc,
  onSelectHighlight,
  onOpenFolder,
  onNewDoc,
  onRemoveRecent,
  onClearRecent,
  onDeleteHighlight
}) => {
  const [filterText, setFilterText] = useState('');

  const filteredWorkspaceDocs = documents.filter(
    (doc) =>
      doc.name.toLowerCase().includes(filterText.toLowerCase()) ||
      (doc.snippet && doc.snippet.toLowerCase().includes(filterText.toLowerCase()))
  );

  const filteredRecentDocs = recentDocs.filter(
    (doc) =>
      doc.file_name.toLowerCase().includes(filterText.toLowerCase()) ||
      (doc.title && doc.title.toLowerCase().includes(filterText.toLowerCase())) ||
      (doc.snippet && doc.snippet.toLowerCase().includes(filterText.toLowerCase()))
  );

  const filteredHighlights = highlights.filter(
    (hl) =>
      hl.selected_text.toLowerCase().includes(filterText.toLowerCase()) ||
      (hl.note && hl.note.toLowerCase().includes(filterText.toLowerCase())) ||
      hl.file_path.toLowerCase().includes(filterText.toLowerCase())
  );

  return (
    <section className="w-80 bg-[var(--bg-card)] border-r border-[var(--border-subtle)] flex flex-col shrink-0 select-none">
      {/* Tab Switcher (Visible in Two-Column mode) */}
      {showTabSwitcher && (
        <div className="p-2 border-b border-[var(--border-subtle)] flex items-center gap-1 bg-[var(--bg-sidebar)]">
          <button
            onClick={() => onTabChange('workspace')}
            className={`flex-1 py-1 rounded-lg text-xs font-medium transition ${
              currentTab === 'workspace'
                ? 'bg-[var(--bg-card)] text-[var(--text-main)] shadow-xs'
                : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
            }`}
          >
            工作区 ({documents.length})
          </button>
          <button
            onClick={() => onTabChange('recent')}
            className={`flex-1 py-1 rounded-lg text-xs font-medium transition ${
              currentTab === 'recent'
                ? 'bg-[var(--bg-card)] text-[var(--text-main)] shadow-xs'
                : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
            }`}
          >
            最近 ({recentDocs.length})
          </button>
          <button
            onClick={() => onTabChange('highlights')}
            className={`flex-1 py-1 rounded-lg text-xs font-medium transition ${
              currentTab === 'highlights'
                ? 'bg-[var(--bg-card)] text-[var(--text-main)] shadow-xs'
                : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
            }`}
          >
            高亮 ({highlights.length})
          </button>
        </div>
      )}

      {/* Top Search & Actions */}
      <div className="p-3 border-b border-[var(--border-subtle)] flex items-center justify-between gap-2">
        <div className="flex-1 flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-[var(--bg-window)] border border-[var(--border-subtle)] text-xs">
          <svg className="w-3.5 h-3.5 text-[var(--text-light)] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
          <input
            type="text"
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            placeholder={
              currentTab === 'workspace'
                ? '搜索工作区文档...'
                : currentTab === 'recent'
                ? '搜索最近打开记录...'
                : '搜索划线批注内容...'
            }
            className="w-full bg-transparent text-[var(--text-main)] outline-none placeholder-[var(--text-light)] text-xs"
          />
        </div>

        {currentTab === 'recent' ? (
          <button
            onClick={onClearRecent}
            disabled={recentDocs.length === 0}
            className="p-1.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-window)] text-[var(--text-muted)] hover:text-rose-500 disabled:opacity-40 transition"
            title="清空历史"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 6h18" />
              <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
              <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
            </svg>
          </button>
        ) : (
          <button
            onClick={onNewDoc}
            className="p-1.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-window)] text-[var(--text-main)] hover:bg-[var(--text-main)] hover:text-white transition"
            title="新建空白文档"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </button>
        )}
      </div>

      {/* Card Content List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
        {/* Workspace Documents */}
        {currentTab === 'workspace' &&
          filteredWorkspaceDocs.map((doc) => {
            const isActive = doc.path === currentDocPath;
            const snippetText = doc.snippet || '暂无描述';
            return (
              <div
                key={doc.path}
                onClick={() => onSelectDoc(doc.path)}
                className={`p-3.5 rounded-2xl border transition cursor-pointer select-none space-y-2 ${
                  isActive
                    ? 'border-2 border-[var(--text-main)] bg-[var(--bg-card)] shadow-xs'
                    : 'border-[var(--border-subtle)] hover:border-[var(--border-strong)] hover:shadow-xs bg-[var(--bg-card)]'
                }`}
              >
                <h3 className="font-semibold text-xs leading-snug text-[var(--text-main)] truncate">
                  {doc.name}
                </h3>
                <p className="text-[11px] leading-relaxed text-[var(--text-muted)] line-clamp-2">
                  {snippetText}
                </p>
                <div className="flex items-center justify-between text-[10px] text-[var(--text-light)] pt-1">
                  <span className="px-1.5 py-0.5 rounded-md bg-[var(--bg-window)] text-[var(--text-muted)] font-medium">
                    文档
                  </span>
                  <span className="font-mono">{doc.word_count || 0} 字</span>
                </div>
              </div>
            );
          })}

        {/* Recent Documents History */}
        {currentTab === 'recent' && (
          filteredRecentDocs.length === 0 ? (
            <div className="py-12 text-center text-xs text-[var(--text-light)]">暂无最近打开记录</div>
          ) : (
            filteredRecentDocs.map((doc) => {
              const isActive = doc.file_path === currentDocPath;
              const snippetText = doc.snippet || '暂无描述';
              return (
                <div
                  key={doc.id}
                  onClick={() => onSelectDoc(doc.file_path)}
                  className={`group relative p-3.5 rounded-2xl border transition cursor-pointer select-none space-y-2 ${
                    isActive
                      ? 'border-2 border-[var(--text-main)] bg-[var(--bg-card)] shadow-xs'
                      : 'border-[var(--border-subtle)] hover:border-[var(--border-strong)] hover:shadow-xs bg-[var(--bg-card)]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-xs leading-snug text-[var(--text-main)] truncate">
                      {doc.title || doc.file_name}
                    </h3>
                    <button
                      onClick={(e) => onRemoveRecent(doc.id, e)}
                      className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-rose-500/10 hover:text-rose-500 text-[var(--text-light)] transition"
                      title="移除记录"
                    >
                      <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                  </div>
                  <p className="text-[10px] font-mono text-[var(--text-light)] truncate" title={doc.file_path}>
                    {doc.file_path}
                  </p>
                  <p className="text-[11px] leading-relaxed text-[var(--text-muted)] line-clamp-2">
                    {snippetText}
                  </p>
                  <div className="flex items-center justify-between text-[10px] text-[var(--text-light)] pt-1">
                    <span className="font-mono">{formatRelativeTime(doc.last_opened_at)}</span>
                    <span className="font-mono">{doc.word_count || 0} 字</span>
                  </div>
                </div>
              );
            })
          )
        )}

        {/* Highlights List */}
        {currentTab === 'highlights' && (
          filteredHighlights.length === 0 ? (
            <div className="py-12 text-center text-xs text-[var(--text-light)]">暂无划线高亮</div>
          ) : (
            filteredHighlights.map((hl) => {
              const badge = getHighlightBadge(hl.color);
              const fileName = hl.file_path.split(/[\\/]/).pop() || hl.file_path;
              return (
                <div
                  key={hl.id}
                  onClick={() => (onSelectHighlight ? onSelectHighlight(hl) : onSelectDoc(hl.file_path))}
                  className="group relative p-3.5 rounded-2xl border border-[var(--border-subtle)] hover:border-[var(--border-strong)] hover:shadow-xs bg-[var(--bg-card)] transition cursor-pointer select-none space-y-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-medium border ${badge.bg} ${badge.border} ${badge.text}`}>
                      划线
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono text-[var(--text-light)] truncate max-w-[120px]">
                        {fileName}
                      </span>
                      <button
                        onClick={(e) => onDeleteHighlight(hl.id, e)}
                        className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-rose-500/10 hover:text-rose-500 text-[var(--text-light)] transition"
                        title="删除高亮"
                      >
                        <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <line x1="18" y1="6" x2="6" y2="18" />
                          <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  <blockquote className="text-[12px] leading-relaxed text-[var(--text-main)] italic border-l-2 border-[var(--border-strong)] pl-2 line-clamp-3">
                    {hl.selected_text}
                  </blockquote>
                  {hl.note && (
                    <p className="text-[11px] text-[var(--text-muted)] bg-[var(--bg-window)] p-1.5 rounded-lg">
                      批注: {hl.note}
                    </p>
                  )}
                  <div className="text-[10px] font-mono text-[var(--text-light)] text-right">
                    {formatRelativeTime(hl.created_at)}
                  </div>
                </div>
              );
            })
          )
        )}
      </div>
    </section>
  );
};
