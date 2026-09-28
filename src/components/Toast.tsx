import React, { useEffect } from 'react';

export type ToastType = 'success' | 'info' | 'warning' | 'error';

export interface ToastMessage {
  id: string;
  type: ToastType;
  message: string;
}

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

const ToastItem: React.FC<{ toast: ToastMessage; onDismiss: (id: string) => void }> = ({ toast, onDismiss }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss(toast.id);
    }, 2000);
    return () => clearTimeout(timer);
  }, [toast.id, onDismiss]);

  let borderColor = 'border-[var(--border-subtle)]';
  let badgeBg = 'bg-[var(--bg-window)]';
  let textCol = 'text-[var(--text-main)]';

  if (toast.type === 'success') {
    borderColor = 'border-emerald-500/30';
    badgeBg = 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400';
  } else if (toast.type === 'error') {
    borderColor = 'border-rose-500/30';
    badgeBg = 'bg-rose-500/10 text-rose-600 dark:text-rose-400';
  } else if (toast.type === 'warning') {
    borderColor = 'border-amber-500/30';
    badgeBg = 'bg-amber-500/10 text-amber-600 dark:text-amber-400';
  }

  return (
    <div
      className={`pointer-events-auto flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-[var(--bg-card)]/95 backdrop-blur-md border ${borderColor} shadow-lg text-xs font-medium ${textCol} transition-all duration-200 animate-in fade-in slide-in-from-top-2`}
    >
      <span className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${badgeBg}`}>
        {toast.type === 'success' && (
          <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        )}
        {toast.type === 'error' && (
          <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        )}
        {toast.type === 'warning' && (
          <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        )}
        {toast.type === 'info' && (
          <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="16" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12.01" y2="8" />
          </svg>
        )}
      </span>
      <span>{toast.message}</span>
    </div>
  );
};

export const Toast: React.FC<ToastProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  // Strictly render at most 3 newest toasts
  const visibleToasts = toasts.slice(-3);

  return (
    <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-2 pointer-events-none">
      {visibleToasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
};
