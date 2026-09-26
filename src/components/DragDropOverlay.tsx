import React from 'react';

interface DragDropOverlayProps {
  isDragging: boolean;
}

export const DragDropOverlay: React.FC<DragDropOverlayProps> = ({ isDragging }) => {
  if (!isDragging) return null;

  return (
    <div className="absolute inset-0 bg-[var(--bg-card)]/90 backdrop-blur-md border-2 border-dashed border-[var(--text-main)] z-50 flex flex-col items-center justify-center pointer-events-none transition-all">
      <div className="w-14 h-14 rounded-2xl bg-[var(--bg-window)] border border-[var(--border-subtle)] flex items-center justify-center text-[var(--text-main)] shadow-sm mb-3">
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="17 8 12 3 7 8" />
          <line x1="12" y1="3" x2="12" y2="15" />
        </svg>
      </div>
      <div className="text-sm font-bold text-[var(--text-main)]">释放导入文件</div>
    </div>
  );
};
