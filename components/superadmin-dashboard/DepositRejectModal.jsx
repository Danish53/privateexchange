'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Loader2, AlertCircle } from 'lucide-react';
import { useWebsiteT } from '@/components/i18n/WebsiteLocaleProvider';
import { formatNumberSmart } from '@/lib/numberFormat';
import { getCryptoDepositTokenLabel } from '@/lib/cryptoDepositConfig';

function formatAmount(n) {
  if (typeof n !== 'number' || Number.isNaN(n)) return '—';
  return formatNumberSmart(n, { maxFractionDigits: 8 });
}

export default function DepositRejectModal({
  deposit,
  rejectionReason,
  setRejectionReason,
  modalError,
  saving,
  onClose,
  onConfirm,
}) {
  const { t } = useWebsiteT();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, []);

  if (!mounted || !deposit) return null;

  const tokenLabel =
    deposit.paymentMethod === 'crypto' && deposit.payCurrency
      ? getCryptoDepositTokenLabel(deposit.payCurrency)
      : deposit.token;

  const canSubmit = Boolean(rejectionReason?.trim()) && !saving;

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-end justify-center overflow-y-auto bg-black/80 p-3 backdrop-blur-sm sm:items-center sm:p-4"
      style={{
        paddingTop: 'max(0.75rem, env(safe-area-inset-top, 0px))',
        paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom, 0px))',
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="reject-deposit-title"
      onClick={(e) => {
        if (e.target === e.currentTarget && !saving) onClose();
      }}
    >
      <div
        className="my-auto w-full max-w-md overflow-hidden rounded-2xl border border-rose-500/25 bg-[#0a0c12] shadow-2xl shadow-black/60"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="border-b border-white/[0.08] bg-gradient-to-r from-rose-500/[0.08] to-transparent px-4 py-4 sm:px-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-rose-300/80">
                {t('superadmin.payments.rejectModal.eyebrow')}
              </p>
              <h3 id="reject-deposit-title" className="mt-1 text-lg font-semibold text-brand-heading">
                {t('superadmin.payments.rejectModal.title')}
              </h3>
              <p className="mt-1 truncate text-sm text-brand-muted">
                {deposit.user?.email || t('superadmin.payments.rejectModal.unknownUser')}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="shrink-0 rounded-lg border border-white/10 p-2 text-brand-subtle transition hover:bg-white/5 hover:text-white disabled:opacity-50"
              aria-label={t('superadmin.common.close')}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="space-y-4 px-4 py-4 sm:px-6 sm:py-5">
          <div className="rounded-xl border border-white/[0.08] bg-black/30 p-3 text-sm">
            <div className="flex justify-between gap-2">
              <span className="text-brand-subtle">{t('superadmin.payments.rejectModal.amount')}</span>
              <span className="font-mono font-semibold text-brand-heading">
                {formatAmount(deposit.amount)} {tokenLabel}
              </span>
            </div>
            <div className="mt-2 flex justify-between gap-2">
              <span className="text-brand-subtle">{t('superadmin.payments.rejectModal.method')}</span>
              <span className="font-semibold text-amber-200">
                {deposit.paymentMethod === 'crypto'
                  ? t('superadmin.payments.rejectModal.crypto')
                  : deposit.paymentMethod}
              </span>
            </div>
          </div>

          <label className="block space-y-2">
            <span className="text-xs font-semibold uppercase tracking-[0.12em] text-brand-subtle">
              {t('superadmin.payments.rejectModal.rejectionReason')} <span className="text-rose-300">*</span>
            </span>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              rows={3}
              placeholder={t('superadmin.payments.rejectModal.placeholder')}
              className="w-full resize-none rounded-xl border border-white/10 bg-black/40 px-3 py-2.5 text-sm text-brand-heading outline-none placeholder:text-brand-subtle focus:border-rose-500/50 focus:outline-none focus:ring-0"
            />
          </label>

          {modalError ? (
            <p className="flex items-start gap-2 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-100">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              {modalError}
            </p>
          ) : null}
        </div>

        <div className="flex flex-col-reverse gap-2 border-t border-white/[0.08] px-4 py-4 sm:flex-row sm:justify-end sm:px-6">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded-xl border border-white/10 px-4 py-2.5 text-sm font-medium text-brand-heading hover:bg-white/5 disabled:opacity-50"
          >
            {t('superadmin.common.cancel')}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={!canSubmit}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-rose-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-rose-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {t('superadmin.payments.rejectModal.rejecting')}
              </>
            ) : (
              t('superadmin.payments.rejectModal.confirm')
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
