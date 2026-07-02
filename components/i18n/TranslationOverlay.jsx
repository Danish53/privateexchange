'use client';

import LocaleFlag from '@/components/i18n/LocaleFlag';
import { useWebsiteLocale } from '@/components/i18n/WebsiteLocaleProvider';
import { WEBSITE_LOCALE_META } from '@/lib/i18n/website-locales';

export default function TranslationOverlay() {
  const { isTranslating, targetLocale, t } = useWebsiteLocale();

  if (!isTranslating) return null;

  const toCode = targetLocale || 'es';
  const fromCode = toCode === 'es' ? 'en' : 'es';
  const to = WEBSITE_LOCALE_META[toCode];

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-[#030406]/82 backdrop-blur-md"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="relative mx-4 w-full max-w-sm overflow-hidden rounded-2xl border border-white/[0.1] bg-gradient-to-b from-[#0d0f14] to-[#060709] px-8 py-10 text-center shadow-[0_32px_80px_-24px_rgba(0,0,0,0.85)]">
        <div
          className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-brand-accent/[0.08] blur-3xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -bottom-12 -left-8 h-28 w-28 rounded-full bg-sky-500/[0.06] blur-3xl"
          aria-hidden
        />

        <div className="relative flex items-center justify-center gap-5">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/[0.1] bg-black/40 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)] animate-pulse">
            <LocaleFlag locale={fromCode} className="h-7 w-10 rounded-[3px] shadow-md ring-1 ring-white/10" />
          </span>

          <div className="flex flex-col items-center gap-2" aria-hidden>
            <div className="flex gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-brand-accent/80 animate-bounce [animation-delay:0ms]" />
              <span className="h-1.5 w-1.5 rounded-full bg-brand-accent/80 animate-bounce [animation-delay:120ms]" />
              <span className="h-1.5 w-1.5 rounded-full bg-brand-accent/80 animate-bounce [animation-delay:240ms]" />
            </div>
            <div className="h-px w-10 bg-gradient-to-r from-transparent via-brand-accent/50 to-transparent" />
          </div>

          <span className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/[0.1] bg-black/40 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)] animate-pulse [animation-delay:150ms]">
            <LocaleFlag locale={toCode} className="h-7 w-10 rounded-[3px] shadow-md ring-1 ring-white/10" />
          </span>
        </div>

        <p className="relative mt-8 text-base font-semibold tracking-tight text-brand-heading">
          {t('overlay.translating')}
        </p>
        <p className="relative mt-2 text-sm text-brand-muted">
          {t('overlay.switchingTo', { language: to.nativeLabel })}
        </p>

        <div className="relative mx-auto mt-6 h-1 w-40 overflow-hidden rounded-full bg-white/[0.06]">
          <div className="h-full w-1/2 rounded-full bg-gradient-to-r from-brand-accent/20 via-brand-accent to-brand-accent/20 animate-[shimmer_1.1s_ease-in-out_infinite]" />
        </div>
      </div>
    </div>
  );
}
