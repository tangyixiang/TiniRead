import React, { useState } from 'react';
import { WorkspaceFile } from '../types';

interface CardListProps {
  documents: WorkspaceFile[];
  currentDocPath: string;
  onSelectDoc: (path: string) => void;
  onNewDoc: () => void;
}

export const CardList: React.FC<CardListProps> = ({
  documents,
  currentDocPath,
  onSelectDoc,
  onNewDoc
}) => {
  const [filterText, setFilterText] = useState('');

  const filteredDocs = documents.filter(doc =>
    doc.name.toLowerCase().includes(filterText.toLowerCase()) ||
    (doc.snippet && doc.snippet.toLowerCase().includes(filterText.toLowerCase()))
  );

  return (
    <section className="w-72 bg-[var(--bg-card)] border-r border-[var(--border-subtle)] flex flex-col shrink-0">
      <div className="p-3 border-b border-[var(--border-subtle)] flex items-center justify-between gap-2">
        <div className="flex-1 flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-[var(--bg-window)] border border-[var(--border-subtle)] text-xs">
          <svg className="w-3.5 h-3.5 text-[var(--text-light)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
          <input
            type="text"
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            placeholder="筛选文档与标题..."
            className="w-full bg-transparent text-[var(--text-main)] outline-none placeholder-[var(--text-light)] text-xs"
          />
        </div>
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
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
        {filteredDocs.length === 0 ? (
          <div className="py-8 text-center text-xs text-[var(--text-light)]">未找到匹配文档</div>
        ) : (
          filteredDocs.map(doc => {
            const isActive = doc.path === currentDocPath;
            const snippetText = doc.snippet || '本地 Markdown 文档';
            return (
              <div
                key={doc.path}
                onClick={() => onSelectDoc(doc.path)}
                className={`p-3.5 rounded-2xl border transition cursor-pointer select-none space-y-2 ${
                  isActive
                    ? 'border-2 border-[var(--text-main)] bg-[var(--bg-card)] shadow-sm'
                    : 'border-[var(--border-subtle)] hover:border-[var(--border-strong)] hover:shadow-sm bg-[var(--bg-card)]'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-xs leading-snug text-[var(--text-main)] truncate">
                    {doc.name}
                  </h3>
                </div>
                <p className="text-[11px] leading-relaxed text-[var(--text-muted)] line-clamp-2">
                  {snippetText}
                </p>
                <div className="flex items-center justify-between text-[10px] text-[var(--text-light)] pt-1">
                  <span className="px-1.5 py-0.5 rounded-md bg-[var(--bg-window)] text-[var(--text-muted)] font-medium">文档</span>
                  <span className="font-mono">{doc.word_count || 0} 字</span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
};
