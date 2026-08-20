import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastMessage {
  id: string;
  title?: string;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType, title?: string) => void;
  success: (message: string, title?: string) => void;
  error: (message: string, title?: string) => void;
  warning: (message: string, title?: string) => void;
  info: (message: string, title?: string) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (message: string, type: ToastType = 'info', title?: string) => {
      const id = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const newToast: ToastMessage = { id, message, type, title };

      setToasts((prev) => [...prev, newToast]);

      // Auto dismiss after 4.5 seconds
      setTimeout(() => {
        removeToast(id);
      }, 4500);
    },
    [removeToast]
  );

  const success = useCallback(
    (message: string, title: string = 'Berhasil!') => showToast(message, 'success', title),
    [showToast]
  );

  const error = useCallback(
    (message: string, title: string = 'Terjadi Kesalahan') => showToast(message, 'error', title),
    [showToast]
  );

  const warning = useCallback(
    (message: string, title: string = 'Perhatian') => showToast(message, 'warning', title),
    [showToast]
  );

  const info = useCallback(
    (message: string, title: string = 'Informasi') => showToast(message, 'info', title),
    [showToast]
  );

  return (
    <ToastContext.Provider value={{ showToast, success, error, warning, info }}>
      {children}

      {/* Floating Top Notification Container */}
      <div
        id="toast-container"
        className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] flex flex-col gap-2.5 w-full max-w-md px-4 pointer-events-none"
      >
        {toasts.map((toast) => {
          const typeStyles = {
            success: {
              bg: 'bg-emerald-950/95 border-emerald-500/50 text-emerald-100',
              icon: <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />,
              titleColor: 'text-emerald-300 font-bold',
            },
            error: {
              bg: 'bg-rose-950/95 border-rose-500/50 text-rose-100',
              icon: <XCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />,
              titleColor: 'text-rose-300 font-bold',
            },
            warning: {
              bg: 'bg-amber-950/95 border-amber-500/50 text-amber-100',
              icon: <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />,
              titleColor: 'text-amber-300 font-bold',
            },
            info: {
              bg: 'bg-slate-900/95 border-sky-500/50 text-slate-100',
              icon: <Info className="w-5 h-5 text-sky-400 shrink-0 mt-0.5" />,
              titleColor: 'text-sky-300 font-bold',
            },
          }[toast.type];

          return (
            <div
              key={toast.id}
              id={`toast-${toast.id}`}
              className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-2xl border shadow-2xl backdrop-blur-md transition-all animate-in fade-in slide-in-from-top-4 duration-200 ${typeStyles.bg}`}
            >
              {typeStyles.icon}
              <div className="flex-1 text-xs">
                {toast.title && <div className={`text-xs ${typeStyles.titleColor}`}>{toast.title}</div>}
                <p className="text-[11px] leading-relaxed text-slate-200 mt-0.5">{toast.message}</p>
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                className="p-1 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                title="Tutup Notifikasi"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    // Fallback if rendered outside provider
    return {
      showToast: (msg: string) => console.log('Toast:', msg),
      success: (msg: string) => console.log('Success Toast:', msg),
      error: (msg: string) => console.error('Error Toast:', msg),
      warning: (msg: string) => console.warn('Warning Toast:', msg),
      info: (msg: string) => console.info('Info Toast:', msg),
    };
  }
  return context;
};
