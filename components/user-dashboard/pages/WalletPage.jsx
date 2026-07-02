'use client';

import Link from 'next/link';
import {
  ArrowDown,
  ArrowUp,
  Activity,
  Wallet,
  CreditCard,
  Coins,
  Banknote,
  ArrowRightLeft,
  CheckCircle2,
} from 'lucide-react';
import { UsdHeroSkeleton, TokenBalanceCardsSkeleton, LedgerTableSkeleton } from '@/components/ui/content-skeletons';
import Panel from '@/components/user-dashboard/Panel';
import TokenBalanceList from '@/components/user-dashboard/TokenBalanceList';
import { useUserWallet } from '@/components/user-dashboard/useUserWallet';
import { useUserWalletHistory } from '@/components/user-dashboard/useUserWalletHistory';
import { PLATFORM_TOKEN_SEED } from '@/lib/tokenCatalog';
import { formatNumberSmart } from '@/lib/numberFormat';
import { useMemo } from 'react';
import { useWebsiteT } from '@/components/i18n/WebsiteLocaleProvider';
import { getLedgerTypeLabel } from '@/lib/i18n/dashboard-helpers';

function getWalletDepositMethods(t) {
  return [
    {
      id: 'paypal',
      name: t('dashboard.deposit.methods.paypal.name'),
      status: t('dashboard.common.available'),
      available: true,
      icon: Banknote,
      blurb: t('dashboard.wallet.paypalBlurb'),
    },
    {
      id: 'stripe',
      name: t('dashboard.deposit.methods.stripe.name'),
      status: t('dashboard.common.roadmap'),
      available: false,
      icon: CreditCard,
      blurb: t('dashboard.wallet.stripeBlurb'),
    },
    {
      id: 'crypto',
      name: t('dashboard.deposit.methods.crypto.name'),
      status: t('dashboard.common.available'),
      available: true,
      icon: Coins,
      blurb: t('dashboard.wallet.cryptoBlurb'),
    },
  ];
}

function historyIcon(type) {
  if (type === 'fee') return 'fee';
  if (type === 'deposit' || type === 'admin_credit' || type === 'buy') return 'in';
  return 'out';
}

export default function WalletPage() {
  const { t, locale } = useWebsiteT();
  const depositMethods = useMemo(() => getWalletDepositMethods(t), [t]);
  const { loading, error, tokens, totalUsdFormatted } = useUserWallet();
  const hist = useUserWalletHistory({ limit: 100, enableTokenFilter: true });

  // Calculate total token count (sum of all token balances)
  const totalTokens = tokens.reduce((sum, token) => {
    if (!token || !token.balance) return sum;
    try {
      // Parse formatted balance string (e.g., "1,234.56") to number
      const balanceStr = String(token.balance).replace(/,/g, '');
      const balanceNum = parseFloat(balanceStr);
      return sum + (isNaN(balanceNum) ? 0 : balanceNum);
    } catch {
      return sum;
    }
  }, 0);
  
  // Format total tokens with commas and 2 decimal places
  const totalTokensFormatted = formatNumberSmart(totalTokens, {
    locale: 'en-US',
    minFractionDigits: 0,
    maxFractionDigits: 2,
  });

  return (
    <>
      <header className="mb-8 sm:mb-10">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-brand-subtle">
              {t('dashboard.wallet.eyebrow')}
            </p>
            <h1 className="mt-1.5 text-2xl font-semibold tracking-[-0.03em] text-brand-heading sm:text-[1.75rem]">
              {t('dashboard.wallet.title')}
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-brand-muted">
              {t('dashboard.wallet.subtitle')}
            </p>
          </div>
          {/* <p className="shrink-0 text-xs font-medium tabular-nums text-brand-subtle">
            {loading ? 'tokens' : `${totalTokensFormatted} tokens`} · live data
          </p> */}
        </div>
      </header>

      <div className="space-y-8">
        <section className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-gradient-to-br from-[var(--brand-accent-soft)]/30 via-black/25 to-[#060708] p-6 shadow-[0_28px_64px_-36px_rgba(201,162,39,0.3)] sm:p-7">
          <div
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_100%_0%,rgba(201,162,39,0.12),transparent_50%)]"
            aria-hidden
          />
          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-medium text-brand-muted">{t('dashboard.wallet.totalWalletUsd')}</p>
              <p className="mt-2 text-3xl font-semibold tabular-nums tracking-[-0.04em] text-brand-heading sm:text-[2.125rem]">
                {loading ? <UsdHeroSkeleton className="mt-0" /> : totalUsdFormatted}
              </p>
              <p className="mt-2 text-xs text-brand-subtle">
                {t('dashboard.common.usdBalance')}
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row lg:shrink-0">
              <Link
                href="/dashboard/user/transfer"
                className="btn-primary inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold"
              >
                <ArrowRightLeft className="h-4 w-4" strokeWidth={2} aria-hidden />
                {t('dashboard.wallet.sendTokens')}
              </Link>
              <Link
                href="/dashboard/user"
                className="btn-secondary inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold"
              >
                <Wallet className="h-4 w-4" strokeWidth={2} aria-hidden />
                {t('dashboard.common.overview')}
              </Link>
            </div>
          </div>
        </section>

        {/* <Panel title="Deposit methods" subtitle="How you can add funds when each channel is enabled for your account.">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {depositMethods.map((m) => {
              const Icon = m.icon;
              return (
                <button
                  key={m.id}
                  type="button"
                  className={`group relative overflow-hidden rounded-2xl border px-4 py-5 text-left transition duration-300 ${
                    m.available
                      ? 'border-white/[0.08] bg-gradient-to-b from-white/[0.05] to-black/30 hover:border-brand-accent/35 hover:shadow-[0_20px_48px_-28px_rgba(201,162,39,0.22)]'
                      : 'border-brand-border-muted/80 bg-black/20 opacity-90 hover:border-white/[0.1]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <span
                      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)] ${
                        m.available
                          ? 'border-brand-accent/25 bg-[var(--brand-accent-soft)]/40 text-brand-accent'
                          : 'border-white/[0.08] bg-white/[0.04] text-brand-subtle'
                      }`}
                    >
                      <Icon className="h-5 w-5" strokeWidth={1.75} aria-hidden />
                    </span>
                    <span
                      className={`shrink-0 rounded-full px-2.5 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wide ${
                        m.available
                          ? 'border border-emerald-500/25 bg-emerald-500/10 text-emerald-200/95'
                          : 'border border-white/[0.08] bg-white/[0.04] text-brand-muted'
                      }`}
                    >
                      {m.status}
                    </span>
                  </div>
                  <p className="mt-4 font-semibold text-brand-heading">{m.name}</p>
                  <p className="mt-1 text-xs text-brand-subtle">{m.blurb}</p>
                </button>
              );
            })}
          </div>
        </Panel> */}

        <Panel title={t('dashboard.overview.tokenBalances')} subtitle={t('dashboard.overview.tokenBalancesSub')}>
          {error ? (
            <div className="rounded-xl border border-red-500/25 bg-red-500/[0.08] px-4 py-3 text-sm text-red-200/95">
              {error}
            </div>
          ) : loading ? (
            <TokenBalanceCardsSkeleton count={5} className="mt-0" />
          ) : (
            <TokenBalanceList tokens={tokens} />
          )}
        </Panel>

        {hist.totalForUser > 0 ? (
          <Panel
            title={t('dashboard.wallet.recentLedger')}
            subtitle={t('dashboard.wallet.recentLedgerSub')}
          >
            <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <label className="flex flex-col gap-1.5 text-xs sm:flex-row sm:items-center sm:gap-3">
                <span className="font-semibold uppercase tracking-[0.1em] text-brand-subtle">{t('dashboard.common.token')}</span>
                <select
                  value={hist.tokenFilter}
                  onChange={(e) => hist.setTokenFilter(e.target.value)}
                  className="w-full max-w-xs rounded-xl border border-brand-border-muted bg-black/40 px-3 py-2 text-sm text-brand-heading focus:border-brand-accent/35 focus:outline-none focus:ring-2 focus:ring-brand-accent/20 sm:w-auto"
                >
                  <option value="all">{t('dashboard.common.allTokens')}</option>
                  {tokens.filter((t) => t.isActive === true).map((t) => (
                    <option key={t.slug} value={t.symbol}>
                      {t.name} ({t.symbol})
                    </option>
                  ))}
                </select>
              </label>
              <Link
                href="/dashboard/user/history"
                className="text-xs font-medium text-brand-accent transition hover:text-brand-accent-hover"
              >
                {t('dashboard.wallet.viewAllHistory')}
              </Link>
            </div>

            {hist.error ? (
              <div className="rounded-xl border border-red-500/25 bg-red-500/[0.08] px-4 py-3 text-sm text-red-200/95">
                {hist.error}
              </div>
            ) : hist.loading ? (
              <LedgerTableSkeleton rows={10} className="rounded-xl border border-white/[0.05] bg-black/[0.2]" />
            ) : (
              <div className="overflow-hidden rounded-xl border border-white/[0.05] bg-black/[0.2]">
                <div className="grid grid-cols-[1fr_auto] gap-4 border-b border-white/[0.06] px-4 py-2.5 text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-brand-subtle sm:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_auto_auto] sm:px-5">
                  <span>{t('dashboard.wallet.typeAsset')}</span>
                  <span className="hidden sm:block">{t('dashboard.common.date')}</span>
                  <span className="hidden text-right sm:block">{t('dashboard.common.status')}</span>
                  <span className="text-right">{t('dashboard.common.amount')}</span>
                </div>
                {hist.entries.length === 0 ? (
                  <p className="px-4 py-8 text-center text-sm text-brand-muted sm:px-5">
                    {t('dashboard.history.noEntriesYet')}
                  </p>
                ) : (
                  <ul className="divide-y divide-white/[0.04]">
                    {/* first 10 history entries list */}
                    {hist.entries.slice(0, 10).map((tx) => {
                      const icon = historyIcon(tx.type);
                      return (
                        <li
                          key={tx.id}
                          className="flex flex-wrap items-center justify-between gap-3 px-4 py-3.5 transition duration-150 hover:bg-[var(--brand-surface-hover)]/60 sm:px-5"
                        >
                          <div className="flex min-w-0 flex-1 items-center gap-3 sm:min-w-[12rem]">
                            <div
                              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/[0.06] ${
                                icon === 'in'
                                  ? 'bg-emerald-500/12 text-emerald-300'
                                  : icon === 'fee'
                                    ? 'bg-amber-500/12 text-amber-200/95'
                                    : 'bg-sky-500/10 text-sky-200/95'
                              }`}
                            >
                              {icon === 'in' ? (
                                <ArrowDown className="h-4 w-4" strokeWidth={2} aria-hidden />
                              ) : icon === 'fee' ? (
                                <Activity className="h-4 w-4" strokeWidth={2} aria-hidden />
                              ) : (
                                <ArrowUp className="h-4 w-4" strokeWidth={2} aria-hidden />
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium text-brand-heading">
                                {getLedgerTypeLabel(tx.type, t)}
                              </p>
                              <p className="text-xs text-brand-subtle">
                                {tx.token}
                                {tx.note ? ` · ${tx.note}` : ''}
                              </p>
                            </div>
                          </div>
                          <div className="hidden min-w-0 flex-1 text-sm text-brand-muted sm:block">
                            {tx.date
                              ? new Date(tx.date).toLocaleString(locale === 'es' ? 'es' : 'en', {
                                  dateStyle: 'medium',
                                  timeStyle: 'short',
                                })
                              : tx.dateDisplay}
                          </div>
                          <div className="hidden items-center justify-end sm:flex">
                            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/20 bg-emerald-500/[0.08] px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wide text-emerald-200/90">
                              <CheckCircle2 className="h-3 w-3" strokeWidth={2} aria-hidden />
                              {tx.status === 'pending'
                                ? t('dashboard.common.pending')
                                : tx.status === 'approved' || tx.status === 'completed'
                                  ? t('dashboard.common.approved')
                                  : tx.status === 'rejected' || tx.status === 'cancelled'
                                    ? t('dashboard.common.rejected')
                                    : tx.status}
                            </span>
                          </div>
                          <span
                            className={`shrink-0 font-semibold tabular-nums ${
                              tx.isCredit ? 'text-emerald-300/95' : 'text-red-300/90'
                            }`}
                          >
                            {tx.amountSigned}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            )}
          </Panel>
        ) : null}
      </div>
    </>
  );
}
