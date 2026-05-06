'use client';

import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';
import { cn } from '@/lib/utils';

const ToastContext = createContext(null);

const TONE_STYLES = {
  success: 'border-emerald-500/35 bg-[#10231a] text-emerald-100',
  error: 'border-rose-500/40 bg-[#2a1015] text-rose-100',
  info: 'border-sky-500/35 bg-[#0f1f2e] text-sky-100',
};

const TONE_ICONS = {
  success: CheckCircle2,
  error: AlertCircle,
  info: Info,
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const pushToast = useCallback((payload) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const tone = payload?.tone || 'info';
    const duration = Number.isFinite(payload?.duration) ? payload.duration : 4200;
    const next = {
      id,
      tone,
      title: payload?.title || '',
      message: payload?.message || '',
    };
    setToasts((prev) => [...prev, next]);
    window.setTimeout(() => dismissToast(id), Math.max(1800, duration));
  }, [dismissToast]);

  const api = useMemo(
    () => ({
      toast: pushToast,
      success: (message, opts = {}) => pushToast({ ...opts, tone: 'success', message }),
      error: (message, opts = {}) => pushToast({ ...opts, tone: 'error', message }),
      info: (message, opts = {}) => pushToast({ ...opts, tone: 'info', message }),
    }),
    [pushToast]
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 top-4 z-[12000] flex justify-center px-3 sm:top-5">
        <div className="flex w-full max-w-xl flex-col gap-2">
          {toasts.map((t) => {
            const Icon = TONE_ICONS[t.tone] || Info;
            return (
              <div
                key={t.id}
                className={cn(
                  'pointer-events-auto rounded-xl border px-4 py-3 shadow-2xl backdrop-blur',
                  'animate-in slide-in-from-top-2 fade-in duration-300',
                  TONE_STYLES[t.tone] || TONE_STYLES.info
                )}
                role="status"
                aria-live="polite"
              >
                <div className="flex items-start gap-3">
                  <Icon className="mt-0.5 h-5 w-5 shrink-0" />
                  <div className="min-w-0 flex-1">
                    {t.title ? <p className="text-sm font-semibold">{t.title}</p> : null}
                    <p className={cn('text-sm leading-relaxed', t.title ? 'mt-0.5' : '')}>{t.message}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => dismissToast(t.id)}
                    className="rounded-md p-1 text-white/70 transition hover:bg-white/10 hover:text-white"
                    aria-label="Dismiss message"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return ctx;
}
