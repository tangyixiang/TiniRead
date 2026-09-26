import React, { useRef, useEffect, useState, useCallback } from 'react';
import { RenderMode, OutlineItem } from '../types';
import { Outline } from './Outline';
import { SelectionToolbar } from './SelectionToolbar';
import { ContextMenu, InsertType } from './ContextMenu';
import { parseMarkdownToHtml, domToMarkdown } from '../utils/markdown';

interface EditorProps {
  markdown: string;
  onChange: (newMd: string) => void;
  renderMode: RenderMode;
  onSave: () => void;
  saveStatus: string;
  contextMenuTrigger?: { x: number; y: number } | null;
  onContextMenuTriggerHandled?: () => void;
}

export const Editor: React.FC<EditorProps> = ({
  markdown,
  onChange,
  renderMode,
  onSave,
  saveStatus,
  contextMenuTrigger,
  onContextMenuTriggerHandled
}) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const sourceRef = useRef<HTMLTextAreaElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const [outlineItems, setOutlineItems] = useState<OutlineItem[]>([]);
  const [readProgress, setReadProgress] = useState(0);
  const [wordCount, setWordCount] = useState(0);

  const [selectionPos, setSelectionPos] = useState<{ top: number; left: number } | null>(null);
  const [contextMenuPos, setContextMenuPos] = useState<{ x: number; y: number } | null>(null);

  const isInternalChange = useRef(false);

  // Update outline and word count
  const updateOutlineAndStats = useCallback(() => {
    // Word count
    const cleanText = markdown.replace(/[#*`~>-]/g, '').trim();
    const count = cleanText ? (cleanText.match(/[\u4e00-\u9fa5]|\b\w+\b/g)?.length || cleanText.length) : 0;
    setWordCount(count);

    // Extract headings for outline
    if (contentRef.current && renderMode === 'rendered') {
      const headings = Array.from(contentRef.current.querySelectorAll('h1, h2, h3'));
      const items: OutlineItem[] = headings.map((h, idx) => {
        let id = h.id;
        if (!id) {
          id = `heading-node-${idx}`;
          h.id = id;
        }
        return {
          id,
          text: (h.textContent || '').trim(),
          level: parseInt(h.tagName[1], 10)
        };
      });
      setOutlineItems(items);
    } else {
      // Parse headings directly from markdown
      const lines = markdown.split('\n');
      const items: OutlineItem[] = [];
      let idx = 0;
      for (const line of lines) {
        const trimmed = line.trim();
        const m = trimmed.match(/^(#{1,3})\s+(.*)/);
        if (m) {
          items.push({
            id: `heading-node-${idx++}`,
            text: m[2].trim(),
            level: m[1].length
          });
        }
      }
      setOutlineItems(items);
    }
  }, [markdown, renderMode]);

  // Sync markdown into contenteditable DOM when markdown changes externally
  useEffect(() => {
    if (renderMode === 'rendered' && contentRef.current) {
      if (!isInternalChange.current) {
        contentRef.current.innerHTML = parseMarkdownToHtml(markdown);
      }
      isInternalChange.current = false;
    }
    updateOutlineAndStats();
  }, [markdown, renderMode, updateOutlineAndStats]);

  // Handle external insert block trigger from Header
  useEffect(() => {
    if (contextMenuTrigger) {
      setContextMenuPos(contextMenuTrigger);
      onContextMenuTriggerHandled?.();
    }
  }, [contextMenuTrigger, onContextMenuTriggerHandled]);

  // Scroll progress tracker
  const handleScroll = () => {
    if (!scrollAreaRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollAreaRef.current;
    const maxScroll = scrollHeight - clientHeight;
    const pct = maxScroll > 0 ? Math.min(100, Math.round((scrollTop / maxScroll) * 100)) : 0;
    setReadProgress(pct);
  };

  // Scroll to heading on outline click
  const handleOutlineClick = (id: string) => {
    if (renderMode !== 'rendered') return;
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Contenteditable input handling
  const handleContentInput = () => {
    if (!contentRef.current) return;
    isInternalChange.current = true;
    const newMd = domToMarkdown(contentRef.current);
    onChange(newMd);
  };

  // Checkbox toggle inside contenteditable
  const handleContentClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;

    // Checkbox clicked
    if (target.tagName.toLowerCase() === 'input' && (target as HTMLInputElement).type === 'checkbox') {
      const checkbox = target as HTMLInputElement;
      const span = checkbox.nextElementSibling as HTMLElement | null;
      if (span) {
        if (checkbox.checked) {
          span.classList.add('line-through', 'text-[var(--text-light)]');
          span.classList.remove('text-[var(--text-main)]');
        } else {
          span.classList.remove('line-through', 'text-[var(--text-light)]');
          span.classList.add('text-[var(--text-main)]');
        }
      }
      handleContentInput();
      return;
    }

    // Copy code button clicked
    if (target.classList.contains('copy-btn')) {
      const code = target.getAttribute('data-code') || '';
      navigator.clipboard.writeText(code).then(() => {
        const originText = target.innerText;
        target.innerText = '已复制';
        setTimeout(() => {
          target.innerText = originText;
        }, 1500);
      });
      return;
    }
  };

  // Text selection tracking for bubble toolbar
  const handleSelectionCheck = () => {
    if (renderMode !== 'rendered') {
      setSelectionPos(null);
      return;
    }
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed || !sel.rangeCount) {
      setSelectionPos(null);
      return;
    }
    const text = sel.toString().trim();
    if (!text) {
      setSelectionPos(null);
      return;
    }
    const range = sel.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) {
      setSelectionPos(null);
      return;
    }
    setSelectionPos({
      top: rect.top - 8,
      left: rect.left + rect.width / 2
    });
  };

  // Formatting operations
  const handleFormat = (cmd: string, val: string = '') => {
    document.execCommand(cmd, false, val);
    handleContentInput();
  };

  const handleHighlight = (colorClass: string) => {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed || !sel.rangeCount) return;
    const range = sel.getRangeAt(0);
    const mark = document.createElement('mark');
    mark.className = colorClass;
    mark.textContent = range.toString();
    range.deleteContents();
    range.insertNode(mark);
    sel.removeAllRanges();
    setSelectionPos(null);
    handleContentInput();
  };

  const handleHeadingTransform = (level: number) => {
    const sel = window.getSelection();
    if (!sel || !sel.rangeCount) return;
    const node = sel.anchorNode;
    let block = node?.nodeType === Node.TEXT_NODE ? node.parentElement : (node as HTMLElement);
    while (block && block.parentElement !== contentRef.current) {
      block = block.parentElement;
    }
    if (block) {
      const hTag = document.createElement(`h${level}`);
      hTag.className = level === 1
        ? 'text-2xl md:text-3xl font-bold text-[var(--text-main)] tracking-tight mt-7 mb-4 pb-2.5 border-b border-[var(--border-subtle)]'
        : 'text-xl font-bold text-[var(--text-main)] tracking-tight mt-8 mb-3';
      hTag.innerHTML = block.innerHTML;
      block.replaceWith(hTag);
      setSelectionPos(null);
      handleContentInput();
    }
  };

  const handleInlineCode = () => {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed || !sel.rangeCount) return;
    const range = sel.getRangeAt(0);
    const code = document.createElement('code');
    code.className = 'font-mono text-xs bg-[var(--bg-window)] px-1.5 py-0.5 rounded text-purple-600';
    code.textContent = range.toString();
    range.deleteContents();
    range.insertNode(code);
    sel.removeAllRanges();
    setSelectionPos(null);
    handleContentInput();
  };

  // Context menu operations
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenuPos({ x: e.clientX, y: e.clientY });
  };

  const handleInsertBlock = (type: InsertType) => {
    if (renderMode === 'rendered') {
      const container = contentRef.current;
      if (!container) return;

      let newEl: HTMLElement | null = null;
      if (type === 'h1') {
        const h1 = document.createElement('h1');
        h1.className = 'text-2xl md:text-3xl font-bold text-[var(--text-main)] tracking-tight mt-7 mb-4 pb-2.5 border-b border-[var(--border-subtle)]';
        h1.innerText = '一级新标题';
        newEl = h1;
      } else if (type === 'h2') {
        const h2 = document.createElement('h2');
        h2.className = 'text-xl font-bold text-[var(--text-main)] tracking-tight mt-8 mb-3';
        h2.innerText = '二级新标题';
        newEl = h2;
      } else if (type === 'h3') {
        const h3 = document.createElement('h3');
        h3.className = 'text-base font-bold text-[var(--text-main)] tracking-tight mt-6 mb-2';
        h3.innerText = '三级新标题';
        newEl = h3;
      } else if (type === 'task') {
        const div = document.createElement('div');
        div.className = 'flex items-center gap-3 p-1 rounded-xl hover:bg-[var(--bg-window)] cursor-pointer transition';
        div.innerHTML = `
          <input type="checkbox" class="w-4 h-4 rounded-md border-[var(--border-strong)] text-[var(--text-main)] focus:ring-0">
          <span class="text-[14px] leading-relaxed text-[var(--text-main)]">新待办任务事项</span>
        `;
        newEl = div;
      } else if (type === 'callout') {
        const div = document.createElement('div');
        div.className = 'p-4 rounded-2xl bg-[var(--callout-bg)] border border-[var(--callout-border)] flex items-start gap-3 text-sm leading-relaxed text-[var(--text-main)] my-4';
        div.innerHTML = `
          <div class="w-5 h-5 rounded-lg bg-[var(--text-main)] text-[var(--bg-card)] flex items-center justify-center shrink-0 text-[10px] font-bold mt-0.5">!</div>
          <div>
            <div class="font-semibold text-[var(--text-main)] mb-1">NOTE</div>
            <div>在此记录重点提示与引语信息...</div>
          </div>
        `;
        newEl = div;
      } else if (type === 'code') {
        const div = document.createElement('div');
        div.className = 'rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-window)] overflow-hidden my-3';
        div.innerHTML = `
          <div class="flex items-center justify-between px-4 py-2 border-b border-[var(--border-subtle)] text-[11px] text-[var(--text-muted)]">
            <span class="font-mono font-medium text-[var(--text-main)]">javascript</span>
            <button class="copy-btn hover:text-[var(--text-main)] transition font-medium" data-code="// 在此输入代码...">复制</button>
          </div>
          <pre class="p-4 text-xs font-mono overflow-x-auto leading-6 text-[var(--text-main)]"><code>// 在此编写你的代码...</code></pre>
        `;
        newEl = div;
      } else if (type === 'divider') {
        const hr = document.createElement('hr');
        hr.className = 'my-6 border-t border-[var(--border-subtle)]';
        newEl = hr;
      }

      if (newEl) {
        container.appendChild(newEl);
        handleContentInput();
        newEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    } else {
      // Text mode
      let insertSnippet = '';
      if (type === 'h1') insertSnippet = '\n# 一级新标题\n';
      else if (type === 'h2') insertSnippet = '\n## 二级新标题\n';
      else if (type === 'h3') insertSnippet = '\n### 三级新标题\n';
      else if (type === 'task') insertSnippet = '\n- [ ] 新待办任务事项\n';
      else if (type === 'callout') insertSnippet = '\n> [!NOTE]\n> 在此记录重点提示与引语信息...\n';
      else if (type === 'code') insertSnippet = '\n```javascript\n// 在此编写你的代码...\n```\n';
      else if (type === 'divider') insertSnippet = '\n---\n';

      const newMd = markdown + insertSnippet;
      onChange(newMd);
    }
  };

  return (
    <main className="flex-1 bg-[var(--bg-reader)] flex flex-col overflow-hidden relative">
      <div
        id="reader-scroll-area"
        ref={scrollAreaRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto flex justify-center relative scroll-smooth"
      >
        {/* Outline */}
        <Outline
          items={outlineItems}
          progress={readProgress}
          onItemClick={handleOutlineClick}
        />

        {/* Document Body */}
        <div className="w-full max-w-3xl px-8 md:px-12 py-10 space-y-6 absolute left-1/2 -translate-x-1/2">
          {renderMode === 'rendered' ? (
            <div
              ref={contentRef}
              contentEditable
              suppressContentEditableWarning
              onInput={handleContentInput}
              onClick={handleContentClick}
              onContextMenu={handleContextMenu}
              onMouseUp={handleSelectionCheck}
              onKeyUp={handleSelectionCheck}
              className="editor-body text-[14px] leading-relaxed text-[var(--text-main)] cursor-text space-y-4"
              data-placeholder="在此自由编写文字，支持右键一键插入标题与块，或选中文字调整格式..."
            />
          ) : (
            <textarea
              ref={sourceRef}
              value={markdown}
              onChange={(e) => onChange(e.target.value)}
              onContextMenu={handleContextMenu}
              className="w-full min-h-[calc(100vh-260px)] p-0 bg-transparent text-[14px] leading-7 text-[var(--text-main)] font-mono outline-none border-none resize-none overflow-hidden placeholder-[var(--text-light)]"
              placeholder="在此输入 Markdown 纯文本..."
            />
          )}

          <div className="pt-8 pb-10 text-center text-xs text-[var(--text-light)] font-mono select-none">
            — 尽览于此 · MarkView —
          </div>
        </div>
      </div>

      {/* Reader Bottom Status Bar */}
      <footer className="h-8 px-6 border-t border-[var(--border-subtle)] glass-panel backdrop-blur-sm flex items-center justify-between text-xs text-[var(--text-muted)] shrink-0 select-none z-10">
        <div className="flex items-center gap-2">
          <span>当前字数</span>
          <span className="font-mono font-medium text-[var(--text-main)]">{wordCount} 字</span>
        </div>
        <div className="flex items-center gap-3 text-[11px] text-[var(--text-light)]">
          <span className={`transition-opacity duration-200 font-medium ${saveStatus ? 'opacity-100' : 'opacity-0'}`}>
            {saveStatus || '已保存'}
          </span>
          <span className="font-mono text-[10px] hidden sm:inline">Ctrl+S 保存</span>
        </div>
      </footer>

      {/* Floating Selection Toolbar */}
      <SelectionToolbar
        position={selectionPos}
        onFormat={handleFormat}
        onHighlight={handleHighlight}
        onHeading={handleHeadingTransform}
        onInlineCode={handleInlineCode}
      />

      {/* Context Menu */}
      <ContextMenu
        position={contextMenuPos}
        onClose={() => setContextMenuPos(null)}
        onInsert={handleInsertBlock}
      />
    </main>
  );
};
