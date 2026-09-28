import React, { useEffect, useState } from 'react';
import { OutlineItem } from '../types';

interface OutlineProps {
  items: OutlineItem[];
  progress: number;
  onItemClick: (id: string) => void;
  docPath?: string;
}

export const Outline: React.FC<OutlineProps> = ({
  items,
  progress,
  onItemClick,
  docPath
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isScrolling, setIsScrolling] = useState(false);

  // Whenever switching to a different md file, reset to collapsed state
  useEffect(() => {
    setIsExpanded(false);
  }, [docPath]);

  useEffect(() => {
    let timer: any = null;
    const handleScroll = () => {
      setIsScrolling(true);
      clearTimeout(timer);
      timer = setTimeout(() => setIsScrolling(false), 800);
    };
    const scrollContainer = document.getElementById('reader-scroll-area');
    if (scrollContainer) {
      scrollContainer.addEventListener('scroll', handleScroll);
    }
    return () => {
      if (scrollContainer) {
        scrollContainer.removeEventListener('scroll', handleScroll);
      }
      clearTimeout(timer);
    };
  }, []);

  if (!isExpanded) {
    return (
      <aside className="sticky top-6 right-6 h-fit self-start ml-auto mr-6 z-20 hidden lg:flex items-center select-none">
        <button
          onClick={() => setIsExpanded(true)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-full glass-panel hover:bg-[var(--bg-card)] border border-[var(--border-subtle)] hover:border-[var(--border-strong)] text-[var(--text-muted)] hover:text-[var(--text-main)] transition cursor-pointer shadow-sm group"
          title="展开实时大纲"
        >
          <svg className="w-3.5 h-3.5 text-[var(--text-light)] group-hover:text-[var(--text-main)] transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h10M4 18h14" />
          </svg>
          <span className="text-xs font-medium">大纲</span>
          <span className="font-mono text-[10px] text-[var(--text-light)]">{progress}%</span>
          <svg className="w-3 h-3 text-[var(--text-light)] group-hover:translate-x-0.5 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </aside>
    );
  }

  return (
    <aside className="sticky top-6 right-6 h-fit self-start ml-auto mr-6 z-20 hidden lg:flex flex-col w-52 max-h-[calc(100vh-140px)] p-3 rounded-2xl glass-panel text-xs select-none space-y-2 border border-[var(--border-subtle)] shadow-md transition-all">
      <div className="flex items-center justify-between text-[11px] font-semibold text-[var(--text-muted)] pb-1.5 border-b border-[var(--border-subtle)] shrink-0">
        <div className="flex items-center gap-1.5">
          <svg className="w-3.5 h-3.5 text-[var(--text-light)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h10M4 18h14" />
          </svg>
          <span className="text-[var(--text-main)]">实时大纲</span>
          {items.length > 0 && (
            <span className="text-[10px] px-1.5 py-0.2 bg-[var(--bg-window)] text-[var(--text-muted)] rounded-full font-mono">
              {items.length}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] text-[var(--text-light)]">{progress}%</span>
          <button
            onClick={() => setIsExpanded(false)}
            className="p-1 rounded-md hover:bg-[var(--bg-window)] text-[var(--text-light)] hover:text-[var(--text-main)] transition cursor-pointer"
            title="收起大纲"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
      <div
        id="dynamic-toc"
        className={`space-y-1 text-[11px] text-[var(--text-muted)] overflow-y-auto max-h-[calc(100vh-190px)] pr-1 ${
          isScrolling ? 'scrolling' : ''
        }`}
      >
        {items.length === 0 ? (
          <div className="py-3 text-[11px] text-[var(--text-light)] text-center">暂无标题大纲</div>
        ) : (
          items.map((item) => {
            const indentClass =
              item.level === 1
                ? 'font-bold text-[var(--text-main)] pl-0'
                : item.level === 2
                ? 'pl-2.5 font-medium text-[var(--text-main)]/85'
                : 'pl-5 text-[10px] text-[var(--text-muted)]';
            return (
              <button
                key={item.id}
                onClick={() => onItemClick(item.id)}
                className={`w-full text-left truncate py-1 px-1.5 rounded hover:bg-[var(--bg-window)]/70 hover:text-[var(--text-main)] transition block cursor-pointer ${indentClass}`}
              >
                {item.text}
              </button>
            );
          })
        )}
      </div>
    </aside>
  );
};
