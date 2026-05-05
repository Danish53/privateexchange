'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowRightLeft, ShieldCheck, Wallet, Info, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import Panel from '@/components/user-dashboard/Panel';
import { useAuth } from '@/components/auth-context';
import { useUserWallet } from '@/components/user-dashboard/useUserWallet';
import { Skeleton } from '@/components/ui/Skeleton';

export default function TransferPage() {
  const { token, user } = useAuth();
  const { tokens: walletTokens, loading: walletLoading } = useUserWallet();
  const [tokens, setTokens] = useState([]);
  const [loadingTokens, setLoadingTokens] = useState(true);
  const [loadingFee, setLoadingFee] = useState(true);
  const [transferFee, setTransferFee] = useState({ amount: 0.5, type: 'fixed' });
  const [recipientEmail, setRecipientEmail] = useState('');
  const [recipient, setRecipient] = useState(null);
  const [recipientError, setRecipientError] = useState('');
  const [checkingRecipient, setCheckingRecipient] = useState(false);
  const [selectedToken, setSelectedToken] = useState('');
  const [amount, setAmount] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Fetch tokens from API
  useEffect(() => {
    const fetchTokens = async () => {
      try {
        setLoadingTokens(true);
        const response = await fetch('/api/superadmin/tokens');
        const data = await response.json();

        if (data.success && Array.isArray(data.data)) {
          // Filter only active tokens
          const activeTokens = data.data.filter(t => t.isActive !== false);
          setTokens(activeTokens);
          if (activeTokens.length > 0) {
            setSelectedToken(activeTokens[0].symbol);
          }
        } else {
          console.error('Failed to fetch tokens:', data);
          setTokens([]);
        }
      } catch (error) {
        console.error('Error fetching tokens:', error);
        setTokens([]);
      } finally {
        setLoadingTokens(false);
      }
    };

    fetchTokens();
  }, []);

  useEffect(() => {
    if (!token) return;
    const loadFee = async () => {
      try {
        setLoadingFee(true);
        const res = await fetch('/api/user/transfer-fee', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const json = await res.json().catch(() => ({}));
        if (!res.ok || !json?.ok) return;
        const nextAmount = Number(json?.transferFee?.amount);
        const nextType = json?.transferFee?.type === 'percentage' ? 'percentage' : 'fixed';
        if (Number.isFinite(nextAmount) && nextAmount >= 0) {
          setTransferFee({ amount: nextAmount, type: nextType });
        }
      } catch {
        // keep defaults
      } finally {
        setLoadingFee(false);
      }
    };
    loadFee();
  }, [token]);

  const isVipUser = user?.isVip === true;
  const amountNum = Number(amount);
  const normalizedAmount = Number.isFinite(amountNum) && amountNum > 0 ? amountNum : 0;
  const feeAmount = isVipUser
    ? 0
    : transferFee.type === 'percentage'
      ? (normalizedAmount * transferFee.amount) / 100
      : transferFee.amount;
  const totalDebit = normalizedAmount + feeAmount;
  const feeDisplay =
    transferFee.type === 'percentage' ? `${transferFee.amount} %` : transferFee.amount.toFixed(8);
  const selectedTokenWallet = walletTokens.find(
    (t) => String(t.symbol || '').toUpperCase() === String(selectedToken || '').toUpperCase()
  );
  const selectedTokenBalance = Number(String(selectedTokenWallet?.balance || '0').replace(/,/g, '')) || 0;
  const hasEnoughBalance = selectedTokenBalance >= totalDebit;
  const amountError =
    normalizedAmount > 0 && !walletLoading && !hasEnoughBalance
      ? `Insufficient ${selectedToken} balance. Available ${selectedTokenBalance.toFixed(8)}, required ${totalDebit.toFixed(8)}.`
      : '';
  const canSubmit = !!recipient && !!selectedToken && normalizedAmount > 0 && hasEnoughBalance && !submitting;

  const verifyRecipient = async () => {
    const email = recipientEmail.trim().toLowerCase();
    setRecipient(null);
    setRecipientError('');
    setSubmitError('');
    setSubmitSuccess('');
    if (!email) return;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setRecipientError('Please enter a valid email address.');
      return;
    }
    if (!token) return;
    try {
      setCheckingRecipient(true);
      const res = await fetch(`/api/user/transfer/recipient?email=${encodeURIComponent(email)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json?.ok) {
        setRecipientError(json.error || 'Recipient not found.');
        return;
      }
      setRecipient(json.recipient);
    } catch {
      setRecipientError('Could not verify recipient right now.');
    } finally {
      setCheckingRecipient(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');
    setSubmitSuccess('');
    if (!canSubmit || !token) {
      setSubmitError('Please complete recipient, token, and amount.');
      return;
    }
    try {
      setSubmitting(true);
      const res = await fetch('/api/user/transfer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          recipientEmail: recipient.email,
          tokenSymbol: selectedToken,
          amount: normalizedAmount,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json?.ok) {
        setSubmitError(json.error || 'Transfer failed.');
        return;
      }
      setSubmitSuccess(json.message || 'Transfer completed.');
      setAmount('');
    } catch {
      setSubmitError('Network error while transferring.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <header className="mb-8 sm:mb-10">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-brand-subtle">
              Move funds
            </p>
            <h1 className="mt-1.5 text-2xl font-semibold tracking-[-0.03em] text-brand-heading sm:text-[1.75rem]">
              Transfer
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-brand-muted">
              Send tokens to another user by email or username. Fees follow the schedule below; VIP members may have
              the standard transfer fee waived under program rules.
            </p>
          </div>
          <p className="shrink-0 text-xs font-medium tabular-nums text-brand-subtle">
            In-app transfer (not on-chain)
          </p>
        </div>
      </header>

      <div className="space-y-8">
        <section className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-gradient-to-br from-[var(--brand-accent-soft)]/25 via-black/25 to-[#060708] p-6 shadow-[0_28px_64px_-36px_rgba(201,162,39,0.28)] sm:p-7">
          <div
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_75%_55%_at_100%_0%,rgba(201,162,39,0.1),transparent_55%)]"
            aria-hidden
          />
          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex gap-4">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-brand-accent/25 bg-[var(--brand-accent-soft)]/40 text-brand-accent">
                <ArrowRightLeft className="h-6 w-6" strokeWidth={1.75} aria-hidden />
              </span>
              <div>
                <p className="text-sm font-medium text-brand-muted">Standard transfer fee</p>
                <p className="mt-1 text-2xl font-semibold tabular-nums tracking-tight text-brand-heading">
                  {loadingFee ? <Skeleton className="h-8 w-24" /> : `${feeDisplay}`}
                </p>
                <p className="mt-2 text-xs font-medium text-brand-muted">
                  {isVipUser
                    ? 'VIP user: transfer fee is waived for your account.'
                    : 'Transfer fee applies as configured by platform settings.'}
                </p>
              </div>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row lg:shrink-0">
              <Link
                href="/dashboard/user/wallet"
                className="btn-secondary inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold"
              >
                <Wallet className="h-4 w-4" strokeWidth={2} aria-hidden />
                Wallet balances
              </Link>
            </div>
          </div>
        </section>

        <Panel title="Send tokens" subtitle="Choose recipient, asset, and amount — review before confirming.">
          <form className="mx-auto max-w-xl space-y-6" onSubmit={handleSubmit}>
            <div>
              <label className="auth-label" htmlFor="rcp">
                Recipient
              </label>
              <p className="mb-2 text-xs text-brand-subtle">Email only</p>
              <input
                id="rcp"
                type="email"
                className="auth-input"
                placeholder="user@example.com"
                value={recipientEmail}
                onChange={(e) => {
                  setRecipientEmail(e.target.value);
                  setRecipient(null);
                  setRecipientError('');
                }}
                onBlur={verifyRecipient}
                autoComplete="off"
              />
              {checkingRecipient ? (
                <p className="mt-2 inline-flex items-center gap-2 text-xs text-brand-muted">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Verifying recipient...
                </p>
              ) : null}
              {recipient ? (
                <p className="mt-2 inline-flex items-center gap-2 text-xs text-emerald-300/95">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Recipient: {recipient.name}
                </p>
              ) : null}
              {recipientError ? (
                <p className="mt-2 inline-flex items-center gap-2 text-xs text-rose-300">
                  <AlertCircle className="h-3.5 w-3.5" />
                  {recipientError}
                </p>
              ) : null}
            </div>

            <div>
              <label className="auth-label" htmlFor="tok">
                Token
              </label>
              <div className="relative">
                {loadingTokens ? (
                  <div
                    className="auth-input flex items-center pr-10"
                    role="status"
                    aria-label="Loading tokens"
                  >
                    <Skeleton className="h-4 w-48 max-w-[75%] rounded-md" aria-hidden />
                    <span className="sr-only">Loading token list</span>
                  </div>
                ) : (
                  <>
                    <select
                      id="tok"
                      className="auth-input appearance-none pr-10"
                      value={selectedToken}
                      onChange={(e) => setSelectedToken(e.target.value)}
                      disabled={tokens.length === 0}
                    >
                      {tokens.map((t) => (
                        <option key={t.symbol} value={t.symbol}>
                          {t.name} ({t.symbol})
                        </option>
                      ))}
                    </select>
                    <span
                      className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-brand-subtle"
                      aria-hidden
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </span>
                  </>
                )}
              </div>
              <p className="mt-2 text-xs text-brand-muted">
                {walletLoading
                  ? 'Loading balance...'
                  : `Available ${selectedToken || 'token'} balance: ${selectedTokenBalance.toFixed(8)}`}
              </p>
            </div>

            <div>
              <label className="auth-label" htmlFor="amt">
                Amount
              </label>
              <input
                id="amt"
                type="number"
                inputMode="decimal"
                min="0"
                step="any"
                className="auth-input tabular-nums"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
              />
              {amountError ? (
                <p className="mt-2 inline-flex items-center gap-2 text-xs text-rose-300">
                  <AlertCircle className="h-3.5 w-3.5" />
                  {amountError}
                </p>
              ) : null}
            </div>

            <div className="overflow-hidden rounded-xl border border-white/[0.08] bg-black/[0.28] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)]">
              <div className="border-b border-white/[0.06] px-4 py-3 sm:px-5">
                <div className="flex items-start gap-2">
                  <Info className="mt-0.5 h-4 w-4 shrink-0 text-brand-accent" strokeWidth={2} aria-hidden />
                  <p className="text-xs leading-relaxed text-brand-muted">
                    Transfers are irreversible once submitted. Double-check the recipient and token before
                    confirming.
                  </p>
                </div>
              </div>
              <div className="space-y-3 px-4 py-4 sm:px-5">
                {
                  amount ? <div className="flex items-center justify-between text-sm">
                    <span className="text-brand-muted">Network / transfer fee</span>
                    <span className="font-semibold tabular-nums text-brand-heading">
                      {loadingFee ? <Skeleton className="h-5 w-20" /> : `${feeAmount.toFixed(4)} ${selectedToken || ''}`}
                    </span>
                  </div> : ""
                }
                <div className="flex items-center justify-between text-sm">
                  <span className="text-brand-muted">VIP fee waiver</span>
                  <span className="inline-flex items-center gap-1.5 font-semibold text-emerald-300/95">
                    <ShieldCheck className="h-4 w-4" strokeWidth={2} aria-hidden />
                    {isVipUser ? 'Eligible' : 'Not eligible'}
                  </span>
                </div>
                <div className="border-t border-dashed border-white/[0.08] pt-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-brand-heading">Estimated total</span>
                    {
                      amount ? <span className="text-lg font-semibold tabular-nums text-brand-accent">
                        {loadingFee ? '...' : `${totalDebit.toFixed(4)} ${selectedToken || ''}`}
                      </span> : ""
                    }
                  </div>
                  <p className="mt-1 text-xs text-brand-subtle">
                    {isVipUser
                      ? 'Standard transfer fee waived for VIP user.'
                      : `Includes ${transferFee.type} transfer fee (${feeDisplay}).`}
                  </p>
                </div>
              </div>
            </div>

            {submitError ? (
              <div className="rounded-xl border border-red-500/25 bg-red-500/[0.08] px-4 py-3 text-sm text-red-200/95">
                {submitError}
              </div>
            ) : null}
            {submitSuccess ? (
              <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/[0.08] px-4 py-3 text-sm text-emerald-100/95">
                {submitSuccess}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={!canSubmit}
              className="btn-primary w-full justify-center rounded-xl py-3.5 text-sm font-semibold disabled:opacity-60"
            >
              {submitting ? 'Sending...' : 'Review & send'}
            </button>
          </form>
        </Panel>
      </div>
    </>
  );
}
