'use client';

import { useEffect, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import LocaleFlag from '@/components/i18n/LocaleFlag';
import { useWebsiteLocale } from '@/components/i18n/WebsiteLocaleProvider';
import {
  WEBSITE_LOCALES,
  WEBSITE_LOCALE_META,
} from '@/lib/i18n/website-locales';

export default function LanguageSwitcher({ className = '', compact = false }) {
  const { locale, setLocale, isTranslating, t } = useWebsiteLocale();
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  const current = WEBSITE_LOCALE_META[locale];

  useEffect(() => {
    if (!open) return;
    const onPointer = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const handleSelect = async (code) => {
    setOpen(false);
    if (code !== locale && !isTranslating) {
      await setLocale(code);
    }
  };

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        disabled={isTranslating}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={t('language.label')}
        className={`inline-flex h-10 shrink-0 items-center gap-1.5 rounded-xl border border-white/[0.1] bg-black/35 text-sm font-semibold text-brand-muted shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)] transition duration-200 hover:border-white/[0.14] hover:bg-[var(--brand-surface-hover)] hover:text-brand-heading focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent/40 focus-visible:ring-offset-2 focus-visible:ring-offset-brand-page disabled:cursor-wait disabled:opacity-70 ${
          compact ? 'px-2.5' : 'px-3 sm:px-3.5'
        }`}
      >
        <LocaleFlag locale={locale} className="h-[13px] w-[19px] shrink-0 rounded-[2px] shadow-sm ring-1 ring-white/10" />
        <span className={compact ? 'hidden min-[1280px]:inline' : 'hidden sm:inline'}>
          {current.nativeLabel}
        </span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-brand-subtle transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          aria-hidden
        />
      </button>

      {open ? (
        <div
          role="listbox"
          aria-label={t('language.label')}
          className="absolute right-0 top-[calc(100%+0.5rem)] z-[100] min-w-[12rem] space-y-1 overflow-hidden rounded-xl border border-white/[0.14] bg-[#0f1117] p-1.5 shadow-[0_24px_56px_-12px_rgba(0,0,0,0.9),0_0_0_1px_rgba(255,255,255,0.06)_inset]"
        >
          {WEBSITE_LOCALES.map((code) => {
            const meta = WEBSITE_LOCALE_META[code];
            const active = code === locale;
            return (
              <button
                key={code}
                type="button"
                role="option"
                aria-selected={active}
                onClick={() => handleSelect(code)}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition duration-150 ${
                  active
                    ? 'border border-brand-accent/30 bg-[rgba(201,162,39,0.16)]'
                    : 'border border-transparent bg-[#161a22] hover:border-white/[0.08] hover:bg-[#1c212b]'
                }`}
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/[0.1] bg-[#0a0c10]">
                  <LocaleFlag locale={code} className="h-[15px] w-[22px] rounded-[2px] shadow-sm" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold text-[#f1f5f9]">{meta.nativeLabel}</span>
                  <span className="block text-xs text-[#94a3b8]">{meta.label}</span>
                </span>
                {active ? (
                  <span className="h-2 w-2 shrink-0 rounded-full bg-brand-accent shadow-[0_0_8px_var(--brand-accent-soft)]" />
                ) : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
