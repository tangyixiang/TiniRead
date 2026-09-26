import React from 'react';

interface SelectionToolbarProps {
  position: { top: number; left: number } | null;
  onFormat: (cmd: string, value?: string) => void;
  onHighlight: (colorClass: string) => void;
  onHeading: (level: number) => void;
  onInlineCode: () => void;
}

export const SelectionToolbar: React.FC<SelectionToolbarProps> = ({
  position,
  onFormat,
  onHighlight,
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
      className="fixed z-50 bg-[var(--text-main)] text-[var(--bg-card)] rounded-xl shadow-2xl p-1 flex items-center gap-0.5 text-xs transition-opacity duration-150"
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
      <button
        onClick={() => onHighlight('hl-yellow')}
        className="px-2 py-1 rounded-lg hover:bg-white/20 text-yellow-300 font-semibold transition"
        title="黄高亮"
      >
        黄高亮
      </button>
      <button
        onClick={() => onHighlight('hl-green')}
        className="px-2 py-1 rounded-lg hover:bg-white/20 text-emerald-300 font-semibold transition"
        title="绿高亮"
      >
        绿高亮
      </button>
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
