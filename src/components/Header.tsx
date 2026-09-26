import React, { useState, useRef, useEffect } from 'react';
import { ViewMode, RenderMode, ThemeMode } from '../types';

interface HeaderProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  renderMode: RenderMode;
  onRenderModeChange: (mode: RenderMode) => void;
  docTitle: string;
  theme: ThemeMode;
  onThemeChange: (theme: ThemeMode) => void;
  onInsertClick: (e: React.MouseEvent) => void;
  onImportClick: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  viewMode,
  onViewModeChange,
  renderMode,
  onRenderModeChange,
  docTitle,
  theme,
  onThemeChange,
  onInsertClick,
  onImportClick
}) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="h-11 border-b border-[var(--border-subtle)] px-4 flex items-center justify-between shrink-0 bg-[var(--bg-card)]">
      <div id="header-left-group" className="flex items-center gap-2">
        {/* View mode switcher */}
        <div className="flex items-center bg-[var(--bg-window)] p-0.5 rounded-lg border border-[var(--border-subtle)] text-xs text-[var(--text-muted)]">
          <button
            onClick={() => onViewModeChange('focus')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition ${
              viewMode === 'focus'
                ? 'bg-[var(--bg-card)] text-[var(--text-main)] shadow-sm font-medium'
                : 'hover:text-[var(--text-main)]'
            }`}
            title="专注模式"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="4" y="4" width="16" height="16" rx="2" />
            </svg>
            <span>专注</span>
          </button>

          <button
            onClick={() => onViewModeChange('two')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition ${
              viewMode === 'two'
                ? 'bg-[var(--bg-card)] text-[var(--text-main)] shadow-sm font-medium'
                : 'hover:text-[var(--text-main)]'
            }`}
            title="双栏视图"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="16" rx="2" />
              <line x1="10" y1="4" x2="10" y2="20" />
            </svg>
            <span>双栏</span>
          </button>

          <button
            onClick={() => onViewModeChange('three')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition ${
              viewMode === 'three'
                ? 'bg-[var(--bg-card)] text-[var(--text-main)] shadow-sm font-medium'
                : 'hover:text-[var(--text-main)]'
            }`}
            title="三栏视图"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="16" rx="2" />
              <line x1="8" y1="4" x2="8" y2="20" />
              <line x1="14" y1="4" x2="14" y2="20" />
            </svg>
            <span>三栏</span>
          </button>
        </div>

        {/* Rendered / Source toggle */}
        <div className="flex items-center bg-[var(--bg-window)] p-0.5 rounded-lg border border-[var(--border-subtle)] text-xs text-[var(--text-muted)]">
          <button
            onClick={() => onRenderModeChange('rendered')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition ${
              renderMode === 'rendered'
                ? 'bg-[var(--bg-card)] text-[var(--text-main)] shadow-sm font-medium'
                : 'hover:text-[var(--text-main)]'
            }`}
            title="阅读模式"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
            <span>阅读</span>
          </button>
          <button
            onClick={() => onRenderModeChange('source')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition ${
              renderMode === 'source'
                ? 'bg-[var(--bg-card)] text-[var(--text-main)] shadow-sm font-medium'
                : 'hover:text-[var(--text-main)]'
            }`}
            title="文本模式"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="16 18 22 12 16 6" />
              <polyline points="8 6 2 12 8 18" />
            </svg>
            <span>文本</span>
          </button>
        </div>
      </div>

      {/* Center Status / Document Title */}
      <div className="flex items-center text-xs text-[var(--text-main)] font-semibold truncate max-w-[360px]">
        <span>{docTitle || 'MarkView 本地编辑与阅读'}</span>
      </div>

      {/* Right Action Tools */}
      <div className="flex items-center gap-2">
        <button
          onClick={onInsertClick}
          className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-[var(--text-main)] bg-[var(--bg-window)] border border-[var(--border-subtle)] rounded-lg hover:border-[var(--text-light)] transition"
          title="插入"
        >
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          <span>插入</span>
        </button>

        <button
          onClick={onImportClick}
          className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-[var(--text-main)] bg-[var(--bg-window)] border border-[var(--border-subtle)] rounded-lg hover:border-[var(--text-light)] transition"
          title="导入"
        >
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
          <span>导入</span>
        </button>

        {/* Theme Switcher */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="p-1.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-window)] text-[var(--text-muted)] hover:text-[var(--text-main)] transition"
            title="切换风格"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="5" />
              <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
            </svg>
          </button>
          {dropdownOpen && (
            <div className="absolute right-0 top-full mt-1.5 w-32 bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-xl shadow-lg p-1 z-50 text-xs">
              <button
                onClick={() => { onThemeChange('theme-light'); setDropdownOpen(false); }}
                className={`w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-[var(--bg-window)] font-medium ${
                  theme === 'theme-light' ? 'text-[var(--text-main)] bg-[var(--bg-window)]' : 'text-[var(--text-muted)]'
                }`}
              >
                浅灰冷白
              </button>
              <button
                onClick={() => { onThemeChange('theme-warm'); setDropdownOpen(false); }}
                className={`w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-[var(--bg-window)] font-medium ${
                  theme === 'theme-warm' ? 'text-[var(--text-main)] bg-[var(--bg-window)]' : 'text-[var(--text-muted)]'
                }`}
              >
                温润羊皮
              </button>
              <button
                onClick={() => { onThemeChange('theme-dark'); setDropdownOpen(false); }}
                className={`w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-[var(--bg-window)] font-medium ${
                  theme === 'theme-dark' ? 'text-[var(--text-main)] bg-[var(--bg-window)]' : 'text-[var(--text-muted)]'
                }`}
              >
                深邃极夜
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
