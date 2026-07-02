'use client';

import { ArrowRightLeft, Check, Gift, Headphones, Sparkles } from 'lucide-react';
import { getMembershipTierFeatures } from '@/lib/membershipTierFeatures';
import { useWebsiteT } from '@/components/i18n/WebsiteLocaleProvider';
import { cn } from '@/lib/utils';

const FEATURE_ICONS = {
  transfer: ArrowRightLeft,
  drawings: Gift,
  events: Sparkles,
  support: Headphones,
};

/**
 * @param {{ tier: Record<string, unknown> | null | undefined; title?: string; muted?: boolean; className?: string }} props
 */
export default function MembershipTierFeatures({
  tier,
  title,
  muted = false,
  className,
}) {
  const { t } = useWebsiteT();
  const resolvedTitle = title ?? t('membershipFeatures.includedDefault');
  const rawFeatures = getMembershipTierFeatures(tier);
  const features = rawFeatures.map((f) => ({
    ...f,
    label: t(`membershipFeatures.${f.key}.label`),
    description: t(`membershipFeatures.${f.key}.description`),
  }));

  if (!features.length) return null;

  return (
    <section
      className={cn(
        'relative mt-4 overflow-hidden rounded-xl border',
        muted
          ? 'border-white/[0.06] bg-black/20'
          : 'border-brand-accent/30 bg-gradient-to-b from-[var(--brand-accent-soft)]/12 via-black/40 to-black/50 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06),0_0_32px_-12px_rgba(201,162,39,0.15)]',
        className
      )}
    >
      {!muted ? (
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand-accent/50 to-transparent"
          aria-hidden
        />
      ) : null}

      <div className="border-b border-white/[0.06] px-3.5 py-2.5 sm:px-4 sm:py-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <span
              className={cn(
                'flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border',
                muted
                  ? 'border-white/[0.08] bg-black/30 text-brand-subtle'
                  : 'border-brand-accent/35 bg-brand-accent/10 text-brand-accent'
              )}
            >
              <Sparkles className="h-3.5 w-3.5" strokeWidth={2.25} aria-hidden />
            </span>
            <p
              className={cn(
                'text-[0.65rem] font-bold uppercase tracking-[0.14em]',
                muted ? 'text-brand-subtle' : 'text-brand-accent'
              )}
            >
              {resolvedTitle}
            </p>
          </div>
          <span
            className={cn(
              'shrink-0 rounded-full border px-2 py-0.5 text-[0.6rem] font-bold tabular-nums uppercase tracking-wide',
              muted
                ? 'border-white/[0.08] bg-black/25 text-brand-subtle'
                : 'border-brand-accent/30 bg-black/40 text-brand-accent'
            )}
          >
            {t('membershipFeatures.activeCount', { count: features.length })}
          </span>
        </div>
      </div>

      <ul className="divide-y divide-white/[0.06] p-1.5 sm:p-2">
        {features.map((f) => {
          const Icon = FEATURE_ICONS[f.icon] || Sparkles;
          return (
            <li key={f.key}>
              <div
                className={cn(
                  'flex items-center gap-3 rounded-lg px-2.5 py-2.5 transition-colors sm:gap-3.5 sm:px-3 sm:py-3',
                  muted ? 'opacity-80' : 'hover:bg-white/[0.03]'
                )}
              >
                <span
                  className={cn(
                    'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border shadow-sm',
                    muted
                      ? 'border-white/[0.08] bg-black/35 text-brand-subtle'
                      : 'border-brand-accent/40 bg-gradient-to-br from-[var(--brand-accent-soft)]/40 to-black/60 text-brand-accent'
                  )}
                >
                  <Icon className="h-[1.125rem] w-[1.125rem]" strokeWidth={2} aria-hidden />
                </span>
                <div className="min-w-0 flex-1">
                  <p
                    className={cn(
                      'text-sm font-semibold leading-snug',
                      muted ? 'text-brand-muted' : 'text-brand-heading'
                    )}
                  >
                    {f.label}
                  </p>
                  {f.description ? (
                    <p
                      className={cn(
                        'mt-0.5 text-xs leading-relaxed',
                        muted ? 'text-brand-subtle/80' : 'text-brand-muted'
                      )}
                    >
                      {f.description}
                    </p>
                  ) : null}
                </div>
                <span
                  className={cn(
                    'flex h-7 w-7 shrink-0 items-center justify-center rounded-full border',
                    muted
                      ? 'border-white/[0.1] bg-black/30 text-brand-subtle/70'
                      : 'border-brand-accent/45 bg-brand-accent/20 text-brand-accent shadow-[0_0_12px_-4px_var(--brand-accent-glow)]'
                  )}
                  aria-hidden
                >
                  <Check className="h-3.5 w-3.5" strokeWidth={2.75} />
                </span>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
