'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, X, Loader2, Coins } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatNumberSmart } from '@/lib/numberFormat';

function formatAmount(n) {
  if (typeof n !== 'number' || Number.isNaN(n)) return '—';
  return formatNumberSmart(n, { maxFractionDigits: 8 });
}

function PaymentMethodBadge({ method, payCurrency }) {
  const cryptoLabel =
    payCurrency === 'btc'
      ? 'BTC'
      : payCurrency === 'eth'
        ? 'ERC20'
        : payCurrency === 'sol'
          ? 'SOL'
          : 'Crypto';
  const map = {
    paypal: { label: 'PayPal', className: 'border-blue-500/35 bg-blue-500/[0.1] text-blue-100' },
    crypto: { label: cryptoLabel, className: 'border-amber-500/35 bg-amber-500/[0.1] text-amber-100' },
  };
  const m = map[method] || { label: method, className: 'border-white/10 bg-white/5 text-brand-muted' };
  return (
    <span
      className={cn(
        'inline-flex rounded-md border px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-[0.06em]',
        m.className
      )}
    >
      {m.label}
    </span>
  );
}

export default function DepositApproveModal({
  deposit,
  tokens,
  loadingTokens,
  creditToken,
  setCreditToken,
  creditAmount,
  setCreditAmount,
  modalError,
  saving,
  onClose,
  onConfirm,
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, []);

  const selectedTokenMeta = tokens.find(
    (t) => String(t.symbol).toUpperCase() === String(creditToken).toUpperCase()
  );
  const amountNum = Number(String(creditAmount).replace(/,/g, ''));
  const canSubmit =
    creditToken && Number.isFinite(amountNum) && amountNum > 0 && !saving;

  if (!mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-end justify-center overflow-y-auto bg-black/80 p-3 backdrop-blur-sm sm:items-center sm:p-4"
      style={{
        paddingTop: 'max(0.75rem, env(safe-area-inset-top, 0px))',
        paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom, 0px))',
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="approve-deposit-title"
      onClick={(e) => {
        if (e.target === e.currentTarget && !saving) onClose();
      }}
    >
      <div
        className="my-auto flex w-full max-w-lg max-h-[min(92dvh,calc(100dvh-1.5rem))] flex-col overflow-hidden rounded-2xl border border-emerald-500/25 bg-[#0a0c12] shadow-2xl shadow-black/60 sm:max-h-[min(88dvh,calc(100dvh-3rem))]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="shrink-0 border-b border-white/[0.08] bg-gradient-to-r from-emerald-500/[0.08] to-transparent px-4 py-4 sm:px-6">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 pr-2">
              <p className="text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-emerald-300/80">
                Approve deposit
              </p>
              <h3 id="approve-deposit-title" className="mt-1 text-lg font-semibold text-brand-heading">
                Credit user wallet
              </h3>
              <p className="mt-1 truncate text-sm text-brand-muted">
                {deposit.user?.email || 'Unknown user'}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="shrink-0 rounded-lg border border-white/10 p-2 text-brand-subtle transition hover:bg-white/5 hover:text-white disabled:opacity-50"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto overscroll-contain px-4 py-4 sm:px-6 sm:py-5">
          <div className="rounded-xl border border-white/[0.08] bg-black/30 p-4 text-sm">
            <div className="flex justify-between gap-2">
              <span className="text-brand-subtle">Requested (USD)</span>
              <span className="font-mono font-semibold text-brand-heading">
                ${formatAmount(deposit.amount)}
              </span>
            </div>
            <div className="mt-2 flex justify-between gap-2">
              <span className="text-brand-subtle">Method</span>
              <PaymentMethodBadge method={deposit.paymentMethod} payCurrency={deposit.payCurrency} />
            </div>
            {deposit.proofImageUrl ? (
              <a
                href={deposit.proofImageUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-block text-xs font-medium text-brand-accent hover:underline"
              >
                View payment screenshot
              </a>
            ) : null}
          </div>

          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-brand-subtle">
              Select token to credit
            </p>
            {loadingTokens ? (
              <p className="text-sm text-brand-muted">Loading tokens...</p>
            ) : tokens.length === 0 ? (
              <p className="text-sm text-rose-200">No active tokens found.</p>
            ) : (
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {tokens.map((t) => {
                  const sym = String(t.symbol).toUpperCase();
                  const selected = creditToken === sym;
                  return (
                    <button
                      key={t._id || sym}
                      type="button"
                      onClick={() => setCreditToken(sym)}
                      className={cn(
                        'rounded-xl border px-3 py-3 text-left transition-all',
                        selected
                          ? 'border-emerald-500/60 bg-emerald-500/15 ring-1 ring-emerald-500/40'
                          : 'border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.06]'
                      )}
                    >
                      <span className="flex items-center gap-2">
                        <Coins
                          className={cn(
                            'h-4 w-4 shrink-0',
                            selected ? 'text-emerald-400' : 'text-brand-subtle'
                          )}
                        />
                        <span className="font-semibold text-brand-heading">{sym}</span>
                      </span>
                      {t.name ? (
                        <span className="mt-1 block truncate text-[0.65rem] text-brand-muted">
                          {t.name}
                        </span>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {creditToken ? (
            <label className="block space-y-2">
              <span className="text-xs font-semibold uppercase tracking-[0.12em] text-brand-subtle">
                Amount to send ({creditToken})
              </span>
              <input
                type="number"
                min="0"
                step="any"
                value={creditAmount}
                onChange={(e) => setCreditAmount(e.target.value)}
                placeholder="0.00"
                className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 font-mono text-lg text-brand-heading outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/30"
              />
              {selectedTokenMeta?.usdPerUnit ? (
                <p className="text-xs text-brand-muted">
                  Rate: 1 {creditToken} ≈ $
                  {formatNumberSmart(selectedTokenMeta.usdPerUnit, { maxFractionDigits: 6 })} USD
                </p>
              ) : null}
              <p className="text-xs text-emerald-200/80">
                User will receive{' '}
                <strong className="text-emerald-100">{creditAmount || '0'}</strong> {creditToken} in
                their wallet balance.
              </p>
            </label>
          ) : null}

          {modalError ? (
            <p className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-100">
              {modalError}
            </p>
          ) : null}
        </div>

        <div className="flex shrink-0 flex-col-reverse gap-2 border-t border-white/[0.08] bg-[#0a0c12] px-4 py-4 sm:flex-row sm:justify-end sm:px-6">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded-xl border border-white/10 px-4 py-2.5 text-sm font-medium text-brand-heading hover:bg-white/5 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={!canSubmit}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Approving...
              </>
            ) : (
              <>
                <Check className="h-4 w-4" />
                Approve & credit {creditToken || 'token'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
