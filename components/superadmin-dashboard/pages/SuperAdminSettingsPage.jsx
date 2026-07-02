'use client';

import { useEffect, useState } from 'react';
import { Loader2, Save, Percent, DollarSign } from 'lucide-react';
import { useAuth } from '@/components/auth-context';
import { useWebsiteT } from '@/components/i18n/WebsiteLocaleProvider';
import { Skeleton } from '@/components/ui/Skeleton';
import FeedbackMessage from '@/components/ui/FeedbackMessage';

export default function SuperAdminSettingsPage() {
  const { t } = useWebsiteT();
  const { token, ready } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [transferFeeAmount, setTransferFeeAmount] = useState('0.50');
  const [transferFeeType, setTransferFeeType] = useState('fixed');

  const amountPlaceholder =
    transferFeeType === 'percentage'
      ? t('superadmin.settings.placeholderPercentage')
      : t('superadmin.settings.placeholderFixed');

  useEffect(() => {
    if (!ready || !token) return;
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await fetch('/api/superadmin/settings/transfer-fee', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const json = await res.json().catch(() => ({}));
        if (!res.ok || !json?.ok) {
          setError(json.error || t('superadmin.settings.couldNotLoad'));
          return;
        }
        setTransferFeeAmount(String(json.settings?.transferFeeAmount ?? 0));
        setTransferFeeType(json.settings?.transferFeeType === 'percentage' ? 'percentage' : 'fixed');
      } catch {
        setError(t('superadmin.settings.networkErrorLoad'));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [ready, token, t]);

  const onSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const amount = Number(transferFeeAmount);
      if (!Number.isFinite(amount) || amount < 0) {
        setError(t('superadmin.settings.invalidFeeAmount'));
        return;
      }

      const res = await fetch('/api/superadmin/settings/transfer-fee', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          transferFeeAmount: amount,
          transferFeeType,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json?.ok) {
        setError(json.error || t('superadmin.settings.couldNotSave'));
        return;
      }
      setTransferFeeAmount(String(json.settings?.transferFeeAmount ?? amount));
      setTransferFeeType(json.settings?.transferFeeType === 'percentage' ? 'percentage' : 'fixed');
      setSuccess(t('superadmin.settings.saveSuccess'));
    } catch {
      setError(t('superadmin.settings.networkErrorSave'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6" role="status" aria-label={t('superadmin.settings.loadingAria')}>
        <div className="border-b border-white/[0.06] pb-6">
          <Skeleton className="h-8 w-40 rounded-lg" />
          <Skeleton className="mt-3 h-4 w-full max-w-2xl" />
        </div>
        <div className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-gradient-to-b from-black/[0.35] to-[#060708] p-6 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)] sm:p-8">
          <div className="space-y-5">
            <Skeleton className="h-3 w-24" />
            <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_12rem]">
              <div className="space-y-2">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-12 w-full rounded-xl" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-3 w-14" />
                <Skeleton className="h-12 w-full rounded-xl" />
              </div>
            </div>
            <Skeleton className="h-3 w-72 max-w-full" />
            <Skeleton className="h-10 w-44 rounded-xl" />
          </div>
        </div>
        <span className="sr-only">{t('superadmin.settings.loadingSr')}</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="border-b border-white/[0.06] pb-6">
        <h1 className="text-xl font-semibold tracking-tight text-brand-heading sm:text-2xl">{t('superadmin.settings.title')}</h1>
        <p className="mt-1 max-w-2xl text-sm text-brand-muted">
          {t('superadmin.settings.subtitle')}
        </p>
      </div>

      {error ? <FeedbackMessage tone="error" title={t('superadmin.settings.errorTitle')} message={error} /> : null}
      {success ? <FeedbackMessage tone="success" title={t('superadmin.settings.savedTitle')} message={success} /> : null}

      <form
        onSubmit={onSave}
        className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-gradient-to-b from-black/[0.35] to-[#060708] p-6 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)] sm:p-8"
      >
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_100%_80%_at_50%_0%,rgba(201,162,39,0.06),transparent_55%)]"
          aria-hidden
        />
        <div className="relative space-y-5">
          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-brand-subtle">{t('superadmin.settings.transferFee')}</p>

          <div>
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.12em] text-brand-subtle">
                {t('superadmin.settings.amount')}
              </span>
              <div className="relative w-fit">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-brand-subtle">
                  {transferFeeType === 'percentage' ? (
                    <Percent className="h-4 w-4" strokeWidth={2} aria-hidden />
                  ) : (
                    <DollarSign className="h-4 w-4" strokeWidth={2} aria-hidden />
                  )}
                </span>
                <input
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="0.01"
                  value={transferFeeAmount}
                  onChange={(e) => setTransferFeeAmount(e.target.value)}
                  placeholder={amountPlaceholder}
                  className="rounded-xl border border-brand-border-muted bg-black/40 py-3 pl-10 pr-24 text-sm text-brand-heading placeholder:text-brand-subtle/70 focus:border-brand-accent/35 focus:outline-none focus:ring-2 focus:ring-brand-accent/20"
                />
                <select
                  value={transferFeeType}
                  onChange={(e) => setTransferFeeType(e.target.value === 'percentage' ? 'percentage' : 'fixed')}
                  className="absolute right-2 top-1/2 h-8 w-[5.25rem] -translate-y-1/2 rounded-lg border border-brand-border-muted bg-black/70 px-2 text-xs font-semibold text-brand-heading focus:border-brand-accent/35 focus:outline-none"
                  aria-label={t('superadmin.settings.feeTypeAria')}
                >
                  <option value="fixed">{t('superadmin.settings.feeTypeFixed')}</option>
                  <option value="percentage">{t('superadmin.settings.feeTypePercentage')}</option>
                </select>
              </div>
            </label>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="btn-primary inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold disabled:opacity-60"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} aria-hidden />
                {t('superadmin.common.saving')}
              </>
            ) : (
              <>
                <Save className="h-4 w-4" strokeWidth={2} aria-hidden />
                {t('superadmin.settings.saveTransferFee')}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
