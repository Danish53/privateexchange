'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Plus, X } from 'lucide-react';
import { useWebsiteT } from '@/components/i18n/WebsiteLocaleProvider';
import FeedbackMessage from '@/components/ui/FeedbackMessage';
import { cn } from '@/lib/utils';

function TierFeatureSwitch({ id, label, description, checked, onChange, disabled }) {
  return (
    <label
      htmlFor={id}
      className={cn(
        'flex cursor-pointer items-center justify-between gap-4 rounded-xl border px-4 py-3.5 transition-all duration-200',
        checked
          ? 'border-brand-accent/55 bg-[var(--brand-accent-soft)]/30 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08),0_0_24px_-6px_var(--brand-accent-glow)] hover:bg-[var(--brand-accent-soft)]/40'
          : 'border-white/[0.12] bg-black/45 hover:bg-black/55',
        disabled && 'pointer-events-none cursor-not-allowed opacity-55'
      )}
    >
      <div className="min-w-0 pr-2">
        <span
          className={cn(
            'text-sm font-medium transition-colors duration-200',
            checked ? 'text-brand-accent' : 'text-brand-heading'
          )}
        >
          {label}
        </span>
        {description ? (
          <p
            className={cn(
              'mt-0.5 text-xs leading-snug transition-colors duration-200',
              checked ? 'text-brand-accent/75' : 'text-brand-muted'
            )}
          >
            {description}
          </p>
        ) : null}
      </div>
      <input
        id={id}
        type="checkbox"
        role="switch"
        className="sr-only"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span
        className={cn(
          'relative flex h-9 w-[3.75rem] shrink-0 items-center rounded-full border p-1 transition-all duration-200',
          checked
            ? 'justify-end border-brand-accent bg-brand-accent/50 shadow-[0_0_12px_-2px_var(--brand-accent-glow)]'
            : 'justify-start border-white/[0.18] bg-black/55'
        )}
        aria-hidden
      >
        <span
          className={cn(
            'pointer-events-none block h-7 w-7 rounded-full shadow-md ring-1 transition-all duration-200',
            checked
              ? 'bg-gradient-to-br from-amber-100 via-brand-accent to-amber-200/90 ring-brand-accent/40'
              : 'bg-white ring-black/15'
          )}
        />
      </span>
    </label>
  );
}

/**
 * @param {{
 *   backHref?: string;
 *   backLabel?: string;
 *   title: string;
 *   description: string;
 *   initialName?: string;
 *   initialMinUsd?: string;
 *   initialBenefits?: string[];
 *   initialTransferFee?: boolean;
 *   initialVipDrawings?: boolean;
 *   initialExecutiveEvents?: boolean;
 *   initialPrioritySupport?: boolean;
 *   submitLabel: string;
 *   saving: boolean;
 *   ready: boolean;
 *   error: string;
 *   setError: (msg: string) => void;
 *   onSave: (payload: {
 *     name: string;
 *     minValueUsd: number;
 *     benefits: string[];
 *     transfer_fee: boolean;
 *     vip_drawings: boolean;
 *     executive_events: boolean;
 *     priority_support: boolean;
 *   }) => Promise<void>;
 * }} props
 */
export default function MembershipTierForm({
  backHref = '/dashboard/superadmin/membership',
  backLabel,
  title,
  description,
  initialName = '',
  initialMinUsd = '',
  initialBenefits = [],
  initialTransferFee = false,
  initialVipDrawings = false,
  initialExecutiveEvents = false,
  initialPrioritySupport = false,
  submitLabel,
  saving,
  ready,
  error,
  setError,
  onSave,
}) {
  const { t } = useWebsiteT();
  const resolvedBackLabel = backLabel ?? t('superadmin.membership.form.backToMembership');

  const [name, setName] = useState(initialName);
  const [minUsd, setMinUsd] = useState(initialMinUsd);
  const [transferFee, setTransferFee] = useState(Boolean(initialTransferFee));
  const [vipDrawings, setVipDrawings] = useState(Boolean(initialVipDrawings));
  const [executiveEvents, setExecutiveEvents] = useState(Boolean(initialExecutiveEvents));
  const [prioritySupport, setPrioritySupport] = useState(Boolean(initialPrioritySupport));
  const [benefitDraft, setBenefitDraft] = useState('');
  const [benefits, setBenefits] = useState(() =>
    Array.isArray(initialBenefits) ? [...initialBenefits] : []
  );

  /** Default `[]` is a new reference every render; depending on it reset the form every frame and blocked typing. */
  const initialBenefitsKey = useMemo(
    () => JSON.stringify(Array.isArray(initialBenefits) ? initialBenefits : []),
    [initialBenefits]
  );

  const initialFlagsKey = useMemo(
    () =>
      JSON.stringify({
        t: !!initialTransferFee,
        v: !!initialVipDrawings,
        e: !!initialExecutiveEvents,
        p: !!initialPrioritySupport,
      }),
    [initialTransferFee, initialVipDrawings, initialExecutiveEvents, initialPrioritySupport]
  );

  useEffect(() => {
    setName(initialName);
    setMinUsd(initialMinUsd);
    setTransferFee(Boolean(initialTransferFee));
    setVipDrawings(Boolean(initialVipDrawings));
    setExecutiveEvents(Boolean(initialExecutiveEvents));
    setPrioritySupport(Boolean(initialPrioritySupport));
    try {
      const parsed = JSON.parse(initialBenefitsKey);
      setBenefits(Array.isArray(parsed) ? parsed.map((b) => String(b ?? '')) : []);
    } catch {
      setBenefits([]);
    }
    setBenefitDraft('');
  }, [initialName, initialMinUsd, initialBenefitsKey, initialFlagsKey, initialTransferFee, initialVipDrawings, initialExecutiveEvents, initialPrioritySupport]);

  const addBenefit = useCallback(() => {
    const trimmed = benefitDraft.trim();
    if (!trimmed) return;
    setBenefits((prev) => [...prev, trimmed]);
    setBenefitDraft('');
    setError('');
  }, [benefitDraft, setError]);

  const removeBenefit = useCallback((index) => {
    setBenefits((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!ready) {
      setError(t('superadmin.membership.errors.signInAgain'));
      return;
    }

    const trimmed = name.trim();
    if (!trimmed) {
      setError(t('superadmin.membership.form.enterTierName'));
      return;
    }
    const minNum = Number.parseFloat(String(minUsd).replace(/,/g, ''));
    if (!Number.isFinite(minNum) || minNum < 0) {
      setError(t('superadmin.membership.form.invalidMinValue'));
      return;
    }
    if (benefits.length === 0) {
      setError(t('superadmin.membership.form.addOneBenefit'));
      return;
    }

    try {
      await onSave({
        name: trimmed,
        minValueUsd: minNum,
        benefits,
        transfer_fee: transferFee,
        vip_drawings: vipDrawings,
        executive_events: executiveEvents,
        priority_support: prioritySupport,
      });
    } catch {
      /* parent sets error */
    }
  };

  return (
    <div className="space-y-8">
      <div className="border-b border-white/[0.06] pb-6">
        <Link
          href={backHref}
          className="inline-flex items-center gap-2 text-sm font-medium text-brand-muted transition hover:text-brand-heading"
        >
          <ArrowLeft className="h-4 w-4" strokeWidth={2} aria-hidden />
          {resolvedBackLabel}
        </Link>
        <h1 className="mt-4 text-xl font-semibold tracking-tight text-brand-heading sm:text-2xl">{title}</h1>
        <p className="mt-1 max-w-2xl text-sm text-brand-muted">{description}</p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="relative rounded-2xl border border-white/[0.08] bg-[var(--brand-surface)]/50 p-6 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)] sm:p-8"
      >
        <div
          className="pointer-events-none absolute inset-0 rounded-2xl bg-[radial-gradient(ellipse_70%_50%_at_10%_0%,rgba(201,162,39,0.09),transparent_55%)]"
          aria-hidden
        />

        <div className="relative z-10 mx-auto max-w-xl space-y-6">
          <FeedbackMessage tone="error" message={error} />

          <div>
            <label htmlFor="tier-name" className="text-xs font-semibold uppercase tracking-[0.12em] text-brand-subtle">
              {t('superadmin.membership.form.tierName')}
            </label>
            <input
              id="tier-name"
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError('');
              }}
              placeholder={t('superadmin.membership.form.tierNamePlaceholder')}
              autoComplete="off"
              className="mt-2 w-full rounded-xl border border-white/[0.1] bg-black/35 px-4 py-3 text-sm text-brand-heading outline-none ring-brand-accent/20 placeholder:text-brand-subtle/60 focus:border-brand-accent/40 focus:ring-2"
            />
          </div>

          <div>
            <label htmlFor="tier-min" className="text-xs font-semibold uppercase tracking-[0.12em] text-brand-subtle">
              {t('superadmin.membership.form.minimumValueUsd')}
            </label>
            <div className="relative mt-2">
              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm text-brand-muted">
                $
              </span>
              <input
                id="tier-min"
                type="text"
                inputMode="decimal"
                value={minUsd}
                onChange={(e) => {
                  setMinUsd(e.target.value);
                  setError('');
                }}
                placeholder="0.00"
                className="w-full rounded-xl border border-white/[0.1] bg-black/35 py-3 pl-8 pr-4 text-sm tabular-nums text-brand-heading outline-none ring-brand-accent/20 placeholder:text-brand-subtle/60 focus:border-brand-accent/40 focus:ring-2"
              />
            </div>
          </div>

          <fieldset className="rounded-xl border-2 border-brand-accent/35 bg-black/35 p-4 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)]">
            <legend className="px-1 text-xs font-bold uppercase tracking-[0.14em] text-brand-accent">
              {t('superadmin.membership.form.tierFeaturesLegend')}
            </legend>
            <p className="mb-3 text-xs leading-relaxed text-brand-muted">
              {t('superadmin.membership.form.tierFeaturesHint')}
            </p>
            <div className="space-y-2">
              <TierFeatureSwitch
                id="tier-flag-transfer-fee"
                label={t('superadmin.membership.form.waivedTransferFees')}
                description={t('superadmin.membership.form.waivedTransferFeesDesc')}
                checked={transferFee}
                onChange={(v) => {
                  setTransferFee(v);
                  setError('');
                }}
                disabled={saving}
              />
              <TierFeatureSwitch
                id="tier-flag-vip-drawings"
                label={t('superadmin.membership.form.vipDrawings')}
                description={t('superadmin.membership.form.vipDrawingsDesc')}
                checked={vipDrawings}
                onChange={(v) => {
                  setVipDrawings(v);
                  setError('');
                }}
                disabled={saving}
              />
              <TierFeatureSwitch
                id="tier-flag-executive-events"
                label={t('superadmin.membership.form.executiveEvents')}
                description={t('superadmin.membership.form.executiveEventsDesc')}
                checked={executiveEvents}
                onChange={(v) => {
                  setExecutiveEvents(v);
                  setError('');
                }}
                disabled={saving}
              />
              <TierFeatureSwitch
                id="tier-flag-priority-support"
                label={t('superadmin.membership.form.prioritySupport')}
                description={t('superadmin.membership.form.prioritySupportDesc')}
                checked={prioritySupport}
                onChange={(v) => {
                  setPrioritySupport(v);
                  setError('');
                }}
                disabled={saving}
              />
            </div>
          </fieldset>

          <div>
            <span className="text-xs font-semibold uppercase tracking-[0.12em] text-brand-subtle">{t('superadmin.membership.form.benefits')}</span>
            <div className="mt-2 flex gap-2">
              <input
                type="text"
                value={benefitDraft}
                onChange={(e) => setBenefitDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addBenefit();
                  }
                }}
                placeholder={t('superadmin.membership.form.benefitPlaceholder')}
                className="min-w-0 flex-1 rounded-xl border border-white/[0.1] bg-black/35 px-4 py-3 text-sm text-brand-heading outline-none ring-brand-accent/20 placeholder:text-brand-subtle/60 focus:border-brand-accent/40 focus:ring-2"
              />
              <button
                type="button"
                onClick={addBenefit}
                className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl border border-brand-accent/40 bg-[var(--brand-accent-soft)]/25 px-4 py-3 text-sm font-semibold text-brand-accent transition hover:bg-[var(--brand-accent-soft)]/40"
                aria-label={t('superadmin.membership.form.addBenefit')}
              >
                <Plus className="h-4 w-4" strokeWidth={2} aria-hidden />
                {t('superadmin.membership.form.add')}
              </button>
            </div>

            {benefits.length > 0 ? (
              <ul className="mt-4 space-y-2">
                {benefits.map((b, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 rounded-xl border border-white/[0.06] bg-black/30 px-3 py-2.5 text-sm text-brand-heading"
                  >
                    <span className="min-w-0 flex-1 leading-snug">{b}</span>
                    <button
                      type="button"
                      onClick={() => removeBenefit(i)}
                      className="shrink-0 rounded-lg p-1 text-brand-muted transition hover:bg-white/[0.06] hover:text-rose-300"
                      aria-label={t('superadmin.membership.form.removeBenefit')}
                    >
                      <X className="h-4 w-4" strokeWidth={2} />
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>

          <div className="flex flex-wrap gap-3 pt-2">
            <button
              type="submit"
              disabled={saving || !ready}
              className={cn(
                'btn-primary inline-flex items-center justify-center rounded-xl px-6 py-2.5 text-sm font-semibold',
                (saving || !ready) && 'pointer-events-none opacity-60'
              )}
            >
              {saving ? t('superadmin.common.saving') : submitLabel}
            </button>
            <Link
              href={backHref}
              className="inline-flex items-center justify-center rounded-xl border border-white/[0.12] bg-black/25 px-6 py-2.5 text-sm font-semibold text-brand-heading transition hover:bg-white/[0.04]"
            >
              {t('superadmin.common.cancel')}
            </Link>
          </div>
        </div>
      </form>
    </div>
  );
}
