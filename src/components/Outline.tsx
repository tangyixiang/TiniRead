import React, { useEffect, useState } from 'react';
import { OutlineItem } from '../types';

interface OutlineProps {
  items: OutlineItem[];
  progress: number;
  onItemClick: (id: string) => void;
}

export const Outline: React.FC<OutlineProps> = ({
  items,
  progress,
  onItemClick
}) => {
  const [isScrolling, setIsScrolling] = useState(false);

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

  return (
    <aside className="sticky top-6 right-6 h-fit self-start ml-auto mr-6 z-20 hidden lg:flex flex-col w-44 max-h-[calc(100vh-140px)] p-3 rounded-2xl glass-panel text-xs select-none space-y-1.5">
      <div className="flex items-center justify-between text-[10px] font-semibold text-[var(--text-light)] uppercase tracking-wider pb-1 border-b border-[var(--border-subtle)] shrink-0">
        <span>实时大纲</span>
        <span className="font-mono">{progress}%</span>
      </div>
      <div
        id="dynamic-toc"
        className={`space-y-1 text-[11px] text-[var(--text-muted)] overflow-y-auto max-h-[calc(100vh-190px)] pr-1 ${
          isScrolling ? 'scrolling' : ''
        }`}
      >
        {items.length === 0 ? (
          <div className="py-2 text-[11px] text-[var(--text-light)] text-center">暂无标题大纲</div>
        ) : (
          items.map(item => {
            const indentClass = item.level === 1 ? 'font-bold text-[var(--text-main)] pl-0' :
                                item.level === 2 ? 'pl-2 font-medium text-[var(--text-main)]/85' :
                                'pl-4 text-[10px] text-[var(--text-muted)]';
            return (
              <button
                key={item.id}
                onClick={() => onItemClick(item.id)}
                className={`w-full text-left truncate py-1 px-1.5 rounded hover:bg-[var(--bg-window)]/60 hover:text-[var(--text-main)] transition block ${indentClass}`}
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
