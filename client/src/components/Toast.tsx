/* eslint-disable react-refresh/only-export-components */
import { useState, useCallback, useRef } from 'react';

export interface Toast {
  id: number;
  message: string;
  type: 'error' | 'success' | 'info';
}

interface ToastContainerProps {
  toasts: Toast[];
  onDismiss: (id: number) => void;
}

/** Renders the active toast stack (bottom-right, stacked upward). */
export function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
  return (
    <div
      aria-live="polite"
      className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 items-end"
      style={{ maxWidth: '360px' }}
    >
      {toasts.map(t => (
        <div
          key={t.id}
          role="alert"
          className={`flex items-start gap-3 px-4 py-3 rounded-2xl shadow-2xl border text-sm font-medium font-body animate-fade-in ${
            t.type === 'error'
              ? 'bg-error-container text-on-error-container border-error/20'
              : t.type === 'success'
              ? 'bg-tertiary-container text-on-tertiary-container border-tertiary/20'
              : 'bg-surface text-on-surface border-outline-variant/30'
          }`}
          style={{ backdropFilter: 'blur(12px)' }}
        >
          <span className="material-symbols-outlined text-base mt-0.5 shrink-0">
            {t.type === 'error' ? 'error' : t.type === 'success' ? 'check_circle' : 'info'}
          </span>
          <span className="flex-1 leading-snug">{t.message}</span>
          <button
            onClick={() => onDismiss(t.id)}
            className="shrink-0 opacity-60 hover:opacity-100 transition-opacity"
            aria-label="Dismiss"
          >
            <span className="material-symbols-outlined text-base">close</span>
          </button>
        </div>
      ))}
    </div>
  );
}

/** Hook — returns a `toast()` function and the `<ToastContainer />` element. */
export function useToast(duration = 4500) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const counter = useRef(0);

  const dismiss = useCallback((id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const toast = useCallback(
    (message: string, type: Toast['type'] = 'info') => {
      const id = ++counter.current;
      setToasts(prev => [...prev, { id, message, type }]);
      setTimeout(() => dismiss(id), duration);
    },
    [dismiss, duration]
  );

  const container = (
    <ToastContainer toasts={toasts} onDismiss={dismiss} />
  );

  return { toast, container };
}
