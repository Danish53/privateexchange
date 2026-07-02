'use client';

import { Check, Coins, Copy, Loader2, Upload } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useWebsiteT } from '@/components/i18n/WebsiteLocaleProvider';

/** Step 1: shown when user picks BTC / ETH / SOL */
export function CryptoDepositAddressPanel({ selectedCrypto, copied, onCopyAddress }) {
  const { t } = useWebsiteT();
  if (!selectedCrypto) return null;

  return (
    <div className="mt-6 rounded-xl border border-amber-500/25 bg-amber-500/[0.06] p-5">
      <div className="flex items-center gap-3 border-b border-white/10 pb-4">
        <Coins className="h-8 w-8 shrink-0 text-amber-400" />
        <div>
          <p className="font-semibold text-white">
            {selectedCrypto.name} — {selectedCrypto.network}
          </p>
          <p className="text-sm text-amber-200/75">{t('dashboard.crypto.sendToAddress')}</p>
        </div>
      </div>

      <div className="mt-5 flex flex-col items-center gap-5 sm:flex-row sm:items-start">
        {selectedCrypto.qrImage ? (
          <div className="rounded-xl bg-white p-3 shadow-lg">
            <img
              src={selectedCrypto.qrImage}
              alt={t('dashboard.crypto.qrAlt', { name: selectedCrypto.name })}
              className="h-44 w-44 object-contain sm:h-48 sm:w-48"
            />
          </div>
        ) : null}
        <div className="w-full flex-1">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-amber-200/80">
            {t('dashboard.deposit.depositAddress')}
          </p>
          <div className="mt-2 flex items-start gap-2 rounded-lg border border-white/10 bg-black/40 p-3">
            <code className="flex-1 break-all font-mono text-sm leading-relaxed text-white">
              {selectedCrypto.address}
            </code>
            <button
              type="button"
              onClick={() => onCopyAddress(selectedCrypto.address)}
              className="shrink-0 rounded-lg bg-white/10 p-2 hover:bg-white/20"
              aria-label={t('dashboard.crypto.copyAddress')}
            >
              {copied ? (
                <Check className="h-5 w-5 text-emerald-400" />
              ) : (
                <Copy className="h-5 w-5 text-white" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Step 2: amount + hash or screenshot; submit hidden until proof provided */
export default function ManualCryptoDepositFlow({
  selectedCrypto,
  amount,
  setAmount,
  selectedMethodData,
  transactionRef,
  setTransactionRef,
  proofPreview,
  onProofFileChange,
  paymentError,
  processingPayment,
  onSubmit,
}) {
  const { t } = useWebsiteT();
  const hasProof = Boolean(transactionRef?.trim()) || Boolean(proofPreview);
  const minAmount = selectedMethodData?.minAmount ?? 1;
  const hasValidAmount =
    amount !== '' && !Number.isNaN(parseFloat(amount)) && parseFloat(amount) >= minAmount;
  const showSubmit = hasProof && hasValidAmount;
  const coinLabel = selectedCrypto ? String(selectedCrypto.id).toUpperCase() : 'USD';

  return (
    <div className="space-y-6">
      {selectedCrypto ? (
        <div className="rounded-lg border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-brand-subtle">
          {t('dashboard.crypto.depositingVia')}{' '}
          <span className="font-semibold text-white">
            {selectedCrypto.name} ({selectedCrypto.network})
          </span>
        </div>
      ) : null}

      <div className="rounded-xl border border-white/10 bg-white/5 p-6">
        <h4 className="text-lg font-semibold text-white">
          {t('dashboard.crypto.depositAmount')} ({coinLabel})
        </h4>
        <p className="mt-1 text-sm text-brand-subtle">
          {t('dashboard.crypto.enterCoinAmount', { coin: coinLabel })}
        </p>
        <div className="mt-4 flex items-center rounded-xl border border-white/10 bg-black/30 p-4">
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            className="deposit-field flex-1 bg-transparent text-2xl font-bold text-white outline-none placeholder:text-white/30 focus:outline-none focus:ring-0"
            min={selectedMethodData?.minAmount}
            max={selectedMethodData?.maxAmount}
            step="any"
          />
          <div className="ml-4 shrink-0 rounded-lg bg-amber-500/15 px-3 py-2 ring-1 ring-amber-500/30">
            <span className="font-semibold text-amber-100">{coinLabel}</span>
          </div>
        </div>
        {amount && !hasValidAmount ? (
          <p className="mt-2 text-xs text-amber-200/80">
            {t('dashboard.crypto.minimumDeposit', { amount: minAmount, coin: coinLabel })}
          </p>
        ) : null}
      </div>

      <div className="rounded-xl border border-white/10 bg-white/5 p-6">
        <h4 className="text-lg font-semibold text-white">{t('dashboard.crypto.paymentProof')}</h4>
        <p className="mt-1 text-sm text-brand-subtle">{t('dashboard.crypto.proofOr')}</p>
        <div className="mt-4 space-y-4">
          <div>
            <label className="mb-2 block text-sm text-brand-subtle">{t('dashboard.crypto.txIdOrHash')}</label>
            <input
              type="text"
              value={transactionRef}
              onChange={(e) => setTransactionRef(e.target.value)}
              placeholder={t('dashboard.crypto.pasteHash')}
              className="w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-amber-400/50"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm text-brand-subtle">{t('dashboard.crypto.paymentScreenshot')}</label>
            <label
              className={cn(
                'flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-white/20 bg-black/20 px-4 py-8 transition hover:border-amber-400/40 hover:bg-black/30'
              )}
            >
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={onProofFileChange}
              />
              {proofPreview ? (
                <img
                  src={proofPreview}
                  alt={t('dashboard.crypto.paymentProof')}
                  className="max-h-40 rounded-lg object-contain"
                />
              ) : (
                <>
                  <Upload className="h-8 w-8 text-amber-400/80" />
                  <p className="mt-2 text-sm text-white">{t('dashboard.crypto.clickUpload')}</p>
                  <p className="mt-1 text-xs text-brand-subtle">{t('dashboard.crypto.fileFormats')}</p>
                </>
              )}
            </label>
          </div>
        </div>

        {!hasProof ? (
          <p className="mt-4 rounded-lg border border-amber-500/25 bg-amber-500/10 px-3 py-2 text-xs text-amber-100">
            {t('dashboard.crypto.hashOrScreenshotRequired')}
          </p>
        ) : null}

        {paymentError ? (
          <p className="mt-4 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-200">
            {paymentError}
          </p>
        ) : null}

        {showSubmit ? (
          <>
            <button
              type="button"
              onClick={onSubmit}
              disabled={processingPayment}
              className="mt-6 w-full rounded-xl bg-amber-500 py-3 text-base font-semibold text-black hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {processingPayment ? (
                <>
                  <Loader2 className="mr-2 inline h-5 w-5 animate-spin" />
                  {t('dashboard.crypto.submittingRequest')}
                </>
              ) : (
                t('dashboard.crypto.submitDeposit')
              )}
            </button>
            <p className="mt-3 text-center text-xs text-amber-200/70">
              {t('dashboard.crypto.pendingUntilApproved')}
            </p>
          </>
        ) : null}
      </div>
    </div>
  );
}
