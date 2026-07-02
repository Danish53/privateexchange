'use client';

import { useState, useEffect, useCallback } from 'react';
import { Coins, Calculator, Wallet, Loader2, CheckCircle, ArrowRight, Minus, Plus, AlertCircle, Check, RefreshCw } from 'lucide-react';
import Panel from '@/components/user-dashboard/Panel';
import { useUserWallet } from '@/components/user-dashboard/useUserWallet';
import { useAuth } from '@/components/auth-context';
import { cn } from '@/lib/utils';
import { formatCurrencySmart, formatNumberSmart } from '@/lib/numberFormat';
import { useToast } from '@/components/ui/toast-context';
import {
  UsdHeroSkeleton,
  UsdInlineSkeleton,
  BuyTokenPickerSkeleton,
  DepositRequestsTableSkeleton,
} from '@/components/ui/content-skeletons';
import { useWebsiteT } from '@/components/i18n/WebsiteLocaleProvider';

function formatDateTime(iso, locale) {
  if (!iso) return '—';
  try {
    return new Intl.DateTimeFormat(locale === 'es' ? 'es' : 'en', {
      dateStyle: 'short',
      timeStyle: 'short',
    }).format(new Date(iso));
  } catch {
    return '—';
  }
}

function formatDepositAmount(n) {
  if (typeof n !== 'number' || Number.isNaN(n)) return '—';
  return formatNumberSmart(n, { maxFractionDigits: 2 });
}

function DepositStatusBadge({ status, t }) {
  const map = {
    pending: { label: t('dashboard.common.pending'), className: 'border-amber-500/35 bg-amber-500/[0.12] text-amber-100' },
    completed: { label: t('dashboard.common.approved'), className: 'border-emerald-500/35 bg-emerald-500/[0.1] text-emerald-100' },
    cancelled: { label: t('dashboard.common.rejected'), className: 'border-rose-500/35 bg-rose-500/[0.1] text-rose-100' },
  };
  const m = map[status] || { label: status, className: 'border-white/10 bg-white/5 text-brand-muted' };
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

function PaymentMethodBadge({ method, t }) {
  const map = {
    paypal: { label: t('dashboard.deposit.paypalMethod'), className: 'border-blue-500/35 bg-blue-500/[0.1] text-blue-100' },
    crypto: { label: t('dashboard.deposit.cryptoMethod'), className: 'border-purple-500/35 bg-purple-500/[0.1] text-purple-100' },
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

// Helper function for token initials (similar to TokenBalanceList)
function tokenInitials(symbol) {
  const s = String(symbol || '').replace(/\s/g, '');
  if (s.length <= 3) return s.toUpperCase();
  return s.slice(0, 3).toUpperCase();
}

// Static bar colors mapping (fallback if not in token data)
const BAR_COLORS = {
  '759': 'bg-amber-500',
  'cristalino': 'bg-sky-400',
  'anejo': 'bg-orange-500',
  'raffle': 'bg-violet-500',
  'susu': 'bg-emerald-500',
};

export default function BuyCryptoPage() {
  const { t, locale } = useWebsiteT();
  const { token, ready } = useAuth();
  const toast = useToast();
  const { tokens: walletTokens, loading, reload: refreshWallet, totalUsdFormatted } = useUserWallet();
  const [tokens, setTokens] = useState([]);
  const [selectedToken, setSelectedToken] = useState(null);
  const [usdAmount, setUsdAmount] = useState('');
  const [calculatedTokens, setCalculatedTokens] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [usdBalance, setUsdBalance] = useState(0);
  const [selectedTokenBalance, setSelectedTokenBalance] = useState(0);
  const [loadingTokens, setLoadingTokens] = useState(true);
  const [myDeposits, setMyDeposits] = useState([]);
  const [depositsLoading, setDepositsLoading] = useState(false);
  const [depositsError, setDepositsError] = useState('');

  const loadMyDeposits = useCallback(async () => {
    if (!token) {
      setMyDeposits([]);
      return;
    }
    setDepositsError('');
    setDepositsLoading(true);
    try {
      const res = await fetch('/api/user/deposit?limit=100', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setDepositsError(json.error || t('dashboard.common.couldNotLoad'));
        setMyDeposits([]);
        return;
      }
      setMyDeposits(Array.isArray(json.deposits) ? json.deposits : []);
    } catch {
      setDepositsError(t('dashboard.common.networkError'));
      setMyDeposits([]);
    } finally {
      setDepositsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (!ready || !token) return;
    loadMyDeposits();
  }, [ready, token, loadMyDeposits]);

  // Load crypto tokens from API (dynamic from database)
  useEffect(() => {
    const fetchTokens = async () => {
      try {
        setLoadingTokens(true);
        const response = await fetch('/api/superadmin/tokens');
        const data = await response.json();

        if (data.success && Array.isArray(data.data)) {
          // Filter out USD token (slug '759') since you can't buy USD with USD
          // Also filter only active tokens
          const cryptoTokens = data.data
            .filter(t => t.isActive === true)
            .map(token => ({
              ...token,
              _id: token._id || token.slug,
              bar: token.bar || BAR_COLORS[token.slug] || 'bg-slate-500',
            }));

          setTokens(cryptoTokens);

          // Select first non-USD token by default
          if (cryptoTokens.length > 0) {
            // Fallback to first token (should not happen unless only USD token exists)
            setSelectedToken(cryptoTokens[0]);
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



  // Calculate tokens when USD amount or selected token changes
  useEffect(() => {
    if (!selectedToken || !usdAmount || isNaN(parseFloat(usdAmount))) {
      setCalculatedTokens(0);
      return;
    }

    const amount = parseFloat(usdAmount);
    if (amount <= 0 || selectedToken.usdPerUnit <= 0) {
      setCalculatedTokens(0);
      return;
    }

    const tokens = amount / selectedToken.usdPerUnit;
    setCalculatedTokens(tokens);
  }, [usdAmount, selectedToken]);

  // Extract USD balance from wallet tokens
  useEffect(() => {
    if (!walletTokens || walletTokens.length === 0) {
      setUsdBalance(0);
      return;
    }

    // Find USD token (slug 'usd')
    const usdToken = walletTokens.find(t => t.slug === 'usd');
    if (!usdToken) {
      setUsdBalance(0);
      return;
    }

    // Parse formatted balance string (e.g., "1,234.56") to number
    const balanceStr = String(usdToken.balance).replace(/,/g, '');
    const balanceNum = parseFloat(balanceStr);
    setUsdBalance(isNaN(balanceNum) ? 0 : balanceNum);
  }, [walletTokens]);

  // Extract selected token balance from wallet tokens
  useEffect(() => {
    if (!selectedToken || !walletTokens || walletTokens.length === 0) {
      setSelectedTokenBalance(0);
      return;
    }

    // Find the selected token in wallet tokens
    const tokenInWallet = walletTokens.find(t => t.slug === selectedToken.slug);
    if (!tokenInWallet) {
      setSelectedTokenBalance(0);
      return;
    }

    // Parse formatted balance string (e.g., "1,234.56") to number
    const balanceStr = String(tokenInWallet.balance).replace(/,/g, '');
    const balanceNum = parseFloat(balanceStr);
    setSelectedTokenBalance(isNaN(balanceNum) ? 0 : balanceNum);
  }, [selectedToken, walletTokens]);

  const handleBuy = async () => {
    if (!selectedToken || !usdAmount || !token) {
      const msg = t('dashboard.buy.selectToken');
      setMessage({ type: 'error', text: msg });
      toast.error(msg, { title: t('dashboard.buy.purchaseFailedTitle') });
      return;
    }

    const amount = parseFloat(usdAmount);
    if (isNaN(amount) || amount <= 0) {
      const msg = t('dashboard.buy.amountUsd');
      setMessage({ type: 'error', text: msg });
      toast.error(msg, { title: t('dashboard.buy.purchaseFailedTitle') });
      return;
    }

    if (amount > usdBalance) {
      const msg = t('dashboard.buy.insufficientUsd', {
        symbol: selectedToken.symbol,
        balance: formatCurrencySmart(usdBalance),
      });
      setMessage({ type: 'error', text: msg });
      toast.error(msg, { title: t('dashboard.buy.purchaseFailedTitle') });
      return;
    }

    setProcessing(true);
    setMessage({ type: '', text: '' });

    try {
      const res = await fetch('/api/user/buy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          tokenSlug: selectedToken.slug,
          usdAmount: amount,
        }),
      });

      // Check if response is OK before parsing JSON
      if (!res.ok) {
        const errorData = await res.json().catch(() => null);

        console.error('API error response:', errorData);

        throw new Error(
          errorData?.error || res.statusText || t('dashboard.buy.unknownError')
        );
      }

      const data = await res.json();

      if (data.ok) {
        setMessage({
          type: 'success',
          text: data.message || t('dashboard.buy.purchaseSuccess')
        });
        toast.success(data.message || t('dashboard.buy.confirmPurchase'), { title: t('dashboard.buy.purchaseCompleteTitle') });

        // Reset form
        setUsdAmount('');
        setCalculatedTokens(0);

        // Refresh wallet balance immediately
        refreshWallet();

        // Show transaction details
        if (data.transaction) {
          console.log('Transaction details:', data.transaction);
        }
      } else {
        setMessage({
          type: 'error',
          text: data.error || t('dashboard.buy.purchaseFailed')
        });
        toast.error(data.error || t('dashboard.transfer.transferFailed'), { title: t('dashboard.buy.purchaseFailedTitle') });
      }
    } catch (error) {
      console.error('Buy error:', error);
      const msg = `${t('dashboard.buy.errorPrefix')} ${error.message || t('dashboard.common.networkError')}`;
      setMessage({
        type: 'error',
        text: msg
      });
      toast.error(msg, { title: t('dashboard.buy.purchaseFailedTitle') });
    } finally {
      setProcessing(false);
    }
  };

  const formatCurrency = (amount) => {
    return formatCurrencySmart(amount);
  };

  const formatTokens = (amount) => {
    return formatNumberSmart(amount, { locale: locale === 'es' ? 'es' : 'en', maxFractionDigits: 2 });
  };

  return (
    <div className="space-y-8">
      <header className="mb-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-brand-subtle">
              {t('dashboard.buy.eyebrow')}
            </p>
            <h1 className="mt-1.5 text-2xl font-semibold tracking-[-0.03em] text-brand-heading sm:text-[1.75rem] flex items-center gap-3">
              <Coins className="w-7 h-7" />
              {t('dashboard.buy.title')}
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-brand-muted">
              {t('dashboard.buy.subtitle')}
            </p>
          </div>

          {/* USD Balance Card */}
          <div className="rounded-xl border border-white/[0.06] bg-black/[0.18] px-4 py-3 sm:px-5 sm:py-4">
            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-brand-subtle">
              {t('dashboard.buy.availableBalance')}
            </p>
            <p className="mt-2 text-3xl font-semibold tabular-nums tracking-[-0.04em] text-brand-heading sm:text-[2.25rem] sm:leading-none">
              {loading ? <UsdHeroSkeleton className="mt-0" /> : totalUsdFormatted}
            </p>
            <p className="mt-0.5 text-xs text-brand-muted">
              {t('dashboard.buy.readyToSpend')}
            </p>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: Buy form */}
        <div className="lg:col-span-2">
          <Panel>
            <div className="space-y-8">
              <div>
                <h2 className="text-lg font-semibold text-brand-heading mb-6">
                  {t('dashboard.buy.purchaseDetails')}
                </h2>

                {/* Token selection */}
                <div className="space-y-6">
                  <div>
                    <div className="mb-3">
                      <p className="text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-brand-subtle">
                        {t('dashboard.buy.selectToken')}
                      </p>
                      <p className="mt-1 text-sm text-brand-muted">
                        {t('dashboard.buy.selectTokenSub')}
                      </p>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {loadingTokens ? (
                        <BuyTokenPickerSkeleton count={6} className="col-span-full" />
                      ) : tokens.length > 0 ? (
                        tokens.filter((token) => token.slug !== 'usd').map((token) => {
                          const isSelected = selectedToken?._id === token._id;

                          return (
                            <button
                              key={token._id}
                              type="button"
                              onClick={() => setSelectedToken(token)}
                              className={`p-4 rounded-xl border transition-all duration-200
                                 ${isSelected
                                  ? 'border-white/30 bg-gradient-to-br from-white/10 to-black/30 shadow-lg shadow-black/20 ring-2 ring-white/20'
                                  : 'border-white/10 bg-gradient-to-br from-white/5 to-black/20 hover:border-white/20 hover:bg-white/10'
                                } cursor-pointer`}
                            >
                              <div className="flex items-start gap-3">
                                {/* Token avatar with color */}
                                <div className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-white/20 bg-gradient-to-br from-white/10 to-black/40">
                                  <span
                                    className={`absolute inset-0 opacity-30 ${token.bar}`}
                                    aria-hidden
                                  />
                                  <span className="relative z-[1] text-sm font-bold tracking-tight text-white">
                                    {tokenInitials(token.symbol)}
                                  </span>
                                </div>

                                <div className="flex-1 text-left">
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <div className="font-semibold text-white">
                                        {token.symbol}
                                      </div>
                                      <div className="text-xs text-gray-300">
                                        {token.name}
                                      </div>
                                    </div>
                                    {isSelected && (
                                      <CheckCircle className="h-5 w-5 text-emerald-400" />
                                    )}
                                  </div>

                                  <div className="mt-2 flex items-center justify-between">
                                    <div className="text-xs text-gray-400">
                                      {t('dashboard.buy.exchangeRate')}
                                    </div>
                                    <div className="text-sm font-medium text-white">
                                      ${formatNumberSmart(token.usdPerUnit, { maxFractionDigits: 2 })}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </button>
                          );
                        })
                      ) : (
                        <div className="col-span-3 text-center py-8 text-brand-muted">
                          {t('dashboard.buy.noTokensAvailable')}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* USD amount input */}
                  <div>
                    <div className="mb-3">
                      <p className="text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-brand-subtle">
                        {t('dashboard.buy.amountUsd')}
                      </p>
                      <p className="mt-1 text-sm text-brand-muted">
                        {t('dashboard.buy.amountUsdSub')}
                      </p>
                      <p className="mt-1 text-xs text-brand-subtle">
                        {t('dashboard.buy.availableBalance')}
                      </p>
                    </div>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-brand-subtle">$</span>
                      </div>
                      <input
                        type="number"
                        min="0.01"
                        step="0.01"
                        value={usdAmount}
                        onChange={(e) => setUsdAmount(e.target.value)}
                        className="pl-8 block w-full rounded-xl border border-white/[0.1] bg-white/[0.05] py-3.5 px-4 text-brand-heading placeholder:text-brand-muted focus:border-brand-accent focus:ring-1 focus:ring-brand-accent/30 focus:outline-none"
                        placeholder={t('dashboard.transfer.amountPlaceholder')}
                      />
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                        <span className="text-brand-subtle text-sm font-medium">USD</span>
                      </div>
                    </div>
                    <div className="mt-3 space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-brand-muted">{t('dashboard.buy.availableBalance')}:</span>
                        <span className="font-semibold tabular-nums text-brand-heading">
                          {loading ? <UsdInlineSkeleton className="inline-block align-middle" /> : `${totalUsdFormatted}`}
                        </span>
                      </div>
                      {selectedToken && (
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-brand-muted">{t('dashboard.transfer.availableBalance', { token: selectedToken.symbol, amount: '' })}</span>
                          <span className="font-semibold tabular-nums text-brand-heading">
                            {formatTokens(selectedTokenBalance)} {selectedToken.symbol}
                          </span>
                        </div>
                      )}
                      <div className="pt-1">
                        <p className="text-xs text-brand-subtle">
                          <span className="text-amber-400">{t('dashboard.buy.balanceNoteLabel')}</span>{' '}
                          {t('dashboard.buy.balanceNote')}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Calculation display */}
                  {calculatedTokens > 0 && selectedToken && (
                    <div className="rounded-xl border border-white/[0.06] bg-black/[0.18] p-5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-accent/10">
                            <Calculator className="h-5 w-5 text-brand-accent" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-brand-heading">
                              {t('dashboard.buy.purchaseDetails')}
                            </p>
                            <p className="text-xs text-brand-muted">
                              {t('dashboard.buy.subtitle')}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold tabular-nums text-brand-heading">
                            {formatTokens(calculatedTokens)} {selectedToken.symbol}
                          </div>
                          <div className="text-sm text-brand-muted">
                            {t('dashboard.buy.amountUsdFor', { amount: formatCurrency(parseFloat(usdAmount) || 0) })}
                          </div>
                        </div>
                      </div>
                      <div className="mt-4 pt-4 border-t border-white/[0.05] text-sm space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-red-500/10 flex items-center justify-center">
                              <Minus className="h-3 w-3 text-red-400" />
                            </div>
                            <span className="text-brand-muted">{t('dashboard.buy.usdDeductedFrom')}</span>
                            <span className="font-medium text-brand-heading">{t('dashboard.buy.usdBalanceLabel')}</span>
                          </div>
                          <span className="font-semibold text-red-300">
                            -{formatCurrency(parseFloat(usdAmount) || 0)} USD
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-green-500/10 flex items-center justify-center">
                              <Plus className="h-3 w-3 text-green-400" />
                            </div>
                            <span className="text-brand-muted">{t('dashboard.buy.tokensAddedTo')}</span>
                            <span className="font-medium text-brand-heading">{t('dashboard.buy.tokenBalanceLabel', { symbol: selectedToken.symbol })}</span>
                          </div>
                          <span className="font-semibold text-green-300">
                            +{formatTokens(calculatedTokens)} {selectedToken.symbol}
                          </span>
                        </div>
                        <div className="flex items-center justify-between pt-2 border-t border-white/[0.05]">
                            <span className="text-brand-muted">{t('dashboard.buy.exchangeRate')}</span>
                          <span className="font-semibold text-brand-heading">
                            {t('dashboard.buy.rateLine', {
                              symbol: selectedToken.symbol,
                              rate: formatNumberSmart(selectedToken.usdPerUnit, { maxFractionDigits: 2 }),
                            })}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Buy button */}
                  <div>
                    <button
                      onClick={handleBuy}
                      disabled={processing || !selectedToken || !usdAmount || parseFloat(usdAmount) <= 0 || parseFloat(usdAmount) > usdBalance}
                      className="group w-full flex items-center justify-center gap-3 py-3.5 px-6 bg-gradient-to-r from-brand-accent to-brand-accent/80 hover:from-brand-accent/90 hover:to-brand-accent/70 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all duration-200 shadow-lg shadow-brand-accent/20 hover:shadow-brand-accent/30"
                    >
                      {processing ? (
                        <>
                          <Loader2 className="h-5 w-5 animate-spin" />
                          <span>{t('dashboard.buy.processing')}</span>
                        </>
                      ) : (
                        <>
                          <Coins className="h-5 w-5" />
                          <span>
                            {t('dashboard.buy.confirmPurchase')} {selectedToken ? selectedToken.symbol : ''}
                          </span>
                          <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                        </>
                      )}
                    </button>
                  </div>

                  {message.text ? null : null}
                </div>
              </div>
            </div>
          </Panel>

          {/* <Panel>
            <div className="space-y-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-brand-heading">Your deposit requests</h2>
                  <p className="mt-1 text-sm text-brand-muted">
                    PayPal and other deposit submissions: pending, approved, or rejected by admin.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={loadMyDeposits}
                  disabled={depositsLoading}
                  className="inline-flex shrink-0 items-center gap-2 self-start rounded-lg border border-brand-border-muted bg-[var(--brand-surface)] px-3 py-2 text-sm font-medium text-brand-heading transition hover:border-brand-accent/30 hover:bg-[var(--brand-surface)]/80 disabled:opacity-50"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${depositsLoading ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
              </div>

              {depositsError && (
                <div className="rounded-xl border border-rose-500/30 bg-rose-500/[0.08] p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-rose-300" />
                    <div>
                      <p className="font-medium text-rose-100">Could not load requests</p>
                      <p className="mt-1 text-sm text-rose-200/80">{depositsError}</p>
                    </div>
                  </div>
                </div>
              )}

              {depositsLoading ? (
                <DepositRequestsTableSkeleton rows={5} />
              ) : myDeposits.length === 0 ? (
                <div className="rounded-2xl border border-brand-border-muted bg-[var(--brand-surface)]/40 p-8 text-center">
                  <div className="mx-auto max-w-sm">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-brand-border-muted bg-black/30">
                      <Check className="h-6 w-6 text-brand-muted" />
                    </div>
                    <h3 className="mt-4 text-sm font-semibold text-brand-heading">No deposit requests yet</h3>
                    <p className="mt-2 text-xs text-brand-muted">
                      When you submit a deposit (e.g. PayPal), it will appear here with its status.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="overflow-hidden rounded-2xl border border-brand-border-muted bg-[var(--brand-surface)]/40">
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="border-b border-brand-border-muted bg-black/20">
                          <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-brand-subtle sm:px-6">
                            Amount
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-brand-subtle sm:px-6">
                            Token
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-brand-subtle sm:px-6">
                            Method
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-brand-subtle sm:px-6">
                            Submitted
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-brand-subtle sm:px-6">
                            Status
                          </th>
                        </tr>
                      </thead>
                      <tbody className="">
                        {myDeposits.map((row) => (
                          <tr key={String(row.id)} className="hover:bg-white/[0.02]">
                            <td className="px-4 py-4 sm:px-6">
                              <span className="font-mono text-sm font-semibold tabular-nums text-brand-heading">
                                {formatDepositAmount(row.amount)}
                              </span>
                            </td>
                            <td className="px-4 py-4 sm:px-6">
                              <span className="font-mono text-xs font-semibold text-brand-accent">{row.token}</span>
                            </td>
                            <td className="px-4 py-4 sm:px-6">
                              <PaymentMethodBadge method={row.paymentMethod} t={t} />
                            </td>
                            <td className="px-4 py-4 sm:px-6">
                              <span className="whitespace-nowrap text-xs text-brand-muted">
                                {formatDateTime(row.createdAt)}
                              </span>
                            </td>
                            <td className="px-4 py-4 sm:px-6">
                              <DepositStatusBadge status={row.status} />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </Panel> */}

        </div>

        {/* Right column: Info panel */}
        <div className="space-y-6">
          <Panel>
            <h3 className="text-lg font-semibold text-brand-heading mb-4 flex items-center gap-2">
              <Wallet className="w-5 h-5 text-brand-accent" />
              {t('dashboard.buy.usdBalancePanel')}
            </h3>
            <div className="space-y-4">
              <div className="text-center p-4 bg-brand-card border border-brand-border rounded-lg">
                <div className="text-3xl font-bold text-brand-heading">
                  {loading ? <UsdHeroSkeleton className="mx-auto mt-0" /> : totalUsdFormatted}
                </div>
                <div className="text-sm text-brand-subtle mt-1">
                  {t('dashboard.buy.availableForPurchases')}
                </div>
              </div>

              <div className="text-sm text-brand-muted">
                <p className="mb-2">
                  {t('dashboard.buy.subtitle')}
                </p>
                <ul className="space-y-1 list-disc list-inside text-brand-subtle">
                  <li>{t('dashboard.buy.bulletSelectToken')}</li>
                  <li>{t('dashboard.buy.bulletEnterAmount')}</li>
                  <li>{t('dashboard.buy.bulletAutoCalculate')}</li>
                  <li>{t('dashboard.buy.bulletInstantProcess')}</li>
                  <li>{t('dashboard.buy.bulletBalanceUpdates')}</li>
                </ul>
              </div>
            </div>
          </Panel>

          <Panel>
            <h3 className="text-lg font-semibold text-brand-heading mb-4">
              {t('dashboard.buy.howItWorks')}
            </h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-brand-accent/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-semibold text-brand-accent">1</span>
                </div>
                <div>
                  <div className="font-medium text-brand-heading">{t('dashboard.buy.step1Title')}</div>
                  <div className="text-sm text-brand-subtle">
                    {t('dashboard.buy.step1Desc')}
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-brand-accent/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-semibold text-brand-accent">2</span>
                </div>
                <div>
                  <div className="font-medium text-brand-heading">{t('dashboard.buy.step2Title')}</div>
                  <div className="text-sm text-brand-subtle">
                    {t('dashboard.buy.step2Desc')}
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-brand-accent/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-semibold text-brand-accent">3</span>
                </div>
                <div>
                  <div className="font-medium text-brand-heading">{t('dashboard.buy.step3Title')}</div>
                  <div className="text-sm text-brand-subtle">
                    {t('dashboard.buy.step3Desc')}
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-brand-accent/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-semibold text-brand-accent">4</span>
                </div>
                <div>
                  <div className="font-medium text-brand-heading">{t('dashboard.buy.step4Title')}</div>
                  <div className="text-sm text-brand-subtle">
                    {t('dashboard.buy.step4Desc')}
                  </div>
                </div>
              </div>
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}