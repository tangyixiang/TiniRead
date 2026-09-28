import React from 'react';

interface SelectionToolbarProps {
  position: { top: number; left: number } | null;
  onFormat: (cmd: string, value?: string) => void;
  onHighlight: (colorClass: string) => void;
  onClearHighlight?: () => void;
  onHeading: (level: number) => void;
  onInlineCode: () => void;
}

const HIGHLIGHT_COLORS = [
  { id: 'hl-yellow', bg: 'bg-amber-300', title: '柠檬黄高亮' },
  { id: 'hl-green', bg: 'bg-emerald-300', title: '薄荷绿高亮' },
  { id: 'hl-blue', bg: 'bg-sky-300', title: '天空蓝高亮' },
  { id: 'hl-pink', bg: 'bg-pink-300', title: '珊瑚粉高亮' },
  { id: 'hl-purple', bg: 'bg-purple-300', title: '薰衣草紫高亮' }
];

export const SelectionToolbar: React.FC<SelectionToolbarProps> = ({
  position,
  onFormat,
  onHighlight,
  onClearHighlight,
  onHeading,
  onInlineCode
}) => {
  if (!position) return null;

  return (
    <div
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
        transform: 'translate(-50%, -100%)'
      }}
      className="fixed z-50 bg-[var(--text-main)] text-[var(--bg-card)] rounded-xl shadow-2xl p-1 flex items-center gap-0.5 text-xs transition-opacity duration-150 select-none"
      onMouseDown={(e) => e.preventDefault()}
    >
      <button
        onClick={() => onFormat('bold')}
        className="px-2 py-1 rounded-lg hover:bg-white/20 font-bold transition"
        title="加粗"
      >
        B
      </button>
      <button
        onClick={() => onFormat('italic')}
        className="px-2 py-1 rounded-lg hover:bg-white/20 italic transition"
        title="斜体"
      >
        I
      </button>
      <button
        onClick={() => onFormat('strikeThrough')}
        className="px-2 py-1 rounded-lg hover:bg-white/20 line-through transition"
        title="删除线"
      >
        S
      </button>

      <div className="w-px h-3.5 bg-white/20 mx-1" />

      {/* 5-Color Highlights & Clear */}
      <div className="flex items-center gap-1 px-1">
        {HIGHLIGHT_COLORS.map((c) => (
          <button
            key={c.id}
            onClick={() => onHighlight(c.id)}
            className={`w-3.5 h-3.5 rounded-full ${c.bg} hover:scale-125 transition-transform shadow-xs`}
            title={c.title}
          />
        ))}
        {onClearHighlight && (
          <button
            onClick={onClearHighlight}
            className="w-3.5 h-3.5 rounded-full border border-white/40 flex items-center justify-center hover:bg-white/20 hover:scale-125 transition-transform ml-0.5 text-white/70 hover:text-white"
            title="清除高亮"
          >
            <svg className="w-2 h-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}
      </div>

      <div className="w-px h-3.5 bg-white/20 mx-1" />

      <button
        onClick={() => onHeading(1)}
        className="px-2 py-1 rounded-lg hover:bg-white/20 font-medium transition"
        title="设为一级标题"
      >
        H1
      </button>
      <button
        onClick={() => onHeading(2)}
        className="px-2 py-1 rounded-lg hover:bg-white/20 font-medium transition"
        title="设为二级标题"
      >
        H2
      </button>
      <button
        onClick={onInlineCode}
        className="px-2 py-1 rounded-lg hover:bg-white/20 font-mono text-[11px] transition"
        title="行内代码"
      >
        &lt;/&gt;
      </button>
    </div>
  );
};
