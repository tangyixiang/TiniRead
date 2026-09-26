import React, { useEffect, useRef } from 'react';

export type InsertType = 'h1' | 'h2' | 'h3' | 'task' | 'callout' | 'code' | 'divider';

interface ContextMenuProps {
  position: { x: number; y: number } | null;
  onClose: () => void;
  onInsert: (type: InsertType) => void;
}

export const ContextMenu: React.FC<ContextMenuProps> = ({
  position,
  onClose,
  onInsert
}) => {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    if (position) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [position, onClose]);

  if (!position) return null;

  return (
    <div
      ref={menuRef}
      style={{
        top: `${position.y}px`,
        left: `${position.x}px`
      }}
      className="fixed z-50 w-44 bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-2xl shadow-2xl p-1.5 text-xs text-[var(--text-main)]"
    >
      <div className="px-2.5 py-1 text-[10px] font-semibold text-[var(--text-light)] uppercase tracking-wider">
        插入标题
      </div>
      <button
        onClick={() => { onInsert('h1'); onClose(); }}
        className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-[var(--bg-window)] flex items-center justify-between font-semibold"
      >
        <span>一级标题</span>
        <span className="text-[10px] font-mono text-[var(--text-light)]"># H1</span>
      </button>
      <button
        onClick={() => { onInsert('h2'); onClose(); }}
        className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-[var(--bg-window)] flex items-center justify-between font-medium"
      >
        <span>二级标题</span>
        <span className="text-[10px] font-mono text-[var(--text-light)]">## H2</span>
      </button>
      <button
        onClick={() => { onInsert('h3'); onClose(); }}
        className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-[var(--bg-window)] flex items-center justify-between"
      >
        <span>三级标题</span>
        <span className="text-[10px] font-mono text-[var(--text-light)]">### H3</span>
      </button>

      <div className="my-1 border-t border-[var(--border-subtle)]" />

      <div className="px-2.5 py-1 text-[10px] font-semibold text-[var(--text-light)] uppercase tracking-wider">
        常用块组件
      </div>
      <button
        onClick={() => { onInsert('task'); onClose(); }}
        className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-[var(--bg-window)] flex items-center gap-2"
      >
        <svg className="w-3.5 h-3.5 text-[var(--text-muted)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="9 11 12 14 22 4" />
          <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
        </svg>
        <span>待办清单</span>
      </button>
      <button
        onClick={() => { onInsert('callout'); onClose(); }}
        className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-[var(--bg-window)] flex items-center gap-2"
      >
        <svg className="w-3.5 h-3.5 text-[var(--text-muted)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
        <span>提示引语盒</span>
      </button>
      <button
        onClick={() => { onInsert('code'); onClose(); }}
        className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-[var(--bg-window)] flex items-center gap-2"
      >
        <svg className="w-3.5 h-3.5 text-[var(--text-muted)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="16 18 22 12 16 6" />
          <path d="M8 6 2 12 8 18" />
        </svg>
        <span>代码块</span>
      </button>
      <button
        onClick={() => { onInsert('divider'); onClose(); }}
        className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-[var(--bg-window)] flex items-center gap-2"
      >
        <svg className="w-3.5 h-3.5 text-[var(--text-muted)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
        <span>分割线</span>
      </button>
    </div>
  );
};
