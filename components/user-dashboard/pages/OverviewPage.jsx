'use client';

import Link from 'next/link';
import { ArrowRight, ArrowRightLeft, Gift, Wallet, Loader2 } from 'lucide-react';
import Panel from '@/components/user-dashboard/Panel';
import TokenBalanceList from '@/components/user-dashboard/TokenBalanceList';
import { MEMBERSHIP } from '@/components/user-dashboard/constants';
import { useUserWallet } from '@/components/user-dashboard/useUserWallet';
import { useUserWalletHistory } from '@/components/user-dashboard/useUserWalletHistory';

function overviewHistoryIcon(type) {
  if (type === 'fee') return 'fee';
  if (type === 'deposit' || type === 'admin_credit') return 'in';
  return 'out';
}

export default function OverviewPage() {
  const { loading, error, tokens, totalUsdFormatted } = useUserWallet();
  const hist = useUserWalletHistory({ limit: 4, enableTokenFilter: false });

  return (
    <>
      <header className="mb-8 sm:mb-10">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-brand-subtle">
              Dashboard
            </p>
            <h1 className="mt-1.5 text-2xl font-semibold tracking-[-0.03em] text-brand-heading sm:text-[1.75rem]">
              Overview
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-brand-muted">
              Wallet value in USD (reference rates), token balances, and shortcuts to send funds or open drawings.
            </p>
          </div>
          {/* <p className="shrink-0 text-xs font-medium tabular-nums text-brand-subtle">
            Live wallet · {tokens.length} tokens
          </p> */}
        </div>
      </header>

      <div className="space-y-8">
        <div className="grid gap-5 lg:grid-cols-12 lg:gap-6">
          <div className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-gradient-to-br from-[var(--brand-accent-soft)]/35 via-black/25 to-[#060708] p-6 shadow-[0_28px_64px_-36px_rgba(201,162,39,0.35)] sm:p-7 lg:col-span-12">
            <div
              className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_100%_-20%,rgba(201,162,39,0.14),transparent_55%)]"
              aria-hidden
            />
            <div className="relative flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-brand-muted">Total balance (USD eq.)</p>
                <p className="mt-2 text-3xl font-semibold tabular-nums tracking-[-0.04em] text-brand-heading sm:text-[2.25rem] sm:leading-none">
                  {loading ? (
                    <span className="inline-flex items-center gap-2 text-brand-muted">
                      <Loader2 className="h-7 w-7 animate-spin text-brand-accent/80" strokeWidth={1.5} aria-hidden />
                    </span>
                  ) : (
                    totalUsdFormatted
                  )}
                </p>
                <p className="mt-2 text-xs text-brand-subtle">
                  Sum of listed token balances using each asset&apos;s reference rate.
                </p>
              </div>
              <span className="inline-flex items-center rounded-full border border-white/[0.1] bg-black/30 px-3.5 py-1.5 text-xs font-semibold text-brand-heading shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)]">
                {MEMBERSHIP.tier} account
              </span>
            </div>
            <div className="relative mt-7 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/dashboard/user/wallet"
                className="btn-primary inline-flex flex-1 items-center justify-center gap-2 rounded-xl py-3 text-center text-sm font-semibold"
              >
                <Wallet className="h-4 w-4" strokeWidth={2} aria-hidden />
                Wallet
              </Link>
              <Link
                href="/dashboard/user/transfer"
                className="btn-secondary inline-flex flex-1 items-center justify-center gap-2 rounded-xl py-3 text-center text-sm font-semibold"
              >
                <ArrowRightLeft className="h-4 w-4" strokeWidth={2} aria-hidden />
                Send tokens
              </Link>
            </div>
          </div>
        </div>

        <Panel title="Token balances" subtitle="Per-token rows from your wallet · USD uses each token’s reference rate">
          {error ? (
            <div className="rounded-xl border border-red-500/25 bg-red-500/[0.08] px-4 py-3 text-sm text-red-200/95">
              {error}
            </div>
          ) : loading ? (
            <div className="flex min-h-[160px] items-center justify-center rounded-xl border border-brand-border-muted bg-black/20">
              <Loader2 className="h-8 w-8 animate-spin text-brand-accent/80" strokeWidth={1.5} aria-hidden />
            </div>
          ) : (
            <TokenBalanceList tokens={tokens} />
          )}
        </Panel>

        {!hist.loading && hist.totalForUser > 0 ? (
          <div>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-sm font-semibold tracking-tight text-brand-heading">Recent activity</h2>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <Link
                  href="/dashboard/user/history"
                  className="text-xs font-medium text-brand-accent transition hover:text-brand-accent-hover"
                >
                  Full history
                </Link>
                <Link
                  href="/dashboard/user/wallet"
                  className="text-xs font-medium text-brand-muted transition hover:text-brand-accent"
                >
                  Wallet
                </Link>
              </div>
            </div>
            <div className="overflow-hidden rounded-xl border border-brand-border-muted bg-black/[0.22] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)]">
              {hist.error ? (
                <p className="px-4 py-4 text-sm text-red-200/90 sm:px-5">{hist.error}</p>
              ) : (
                <ul className="divide-y divide-white/[0.04]">
                  {hist.entries.map((tx) => {
                    const icon = overviewHistoryIcon(tx.type);
                    return (
                      <li
                        key={tx.id}
                        className="flex flex-wrap items-center justify-between gap-3 px-4 py-3.5 sm:px-5"
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <span
                            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[0.65rem] font-bold uppercase ${
                              icon === 'in'
                                ? 'bg-emerald-500/15 text-emerald-300'
                                : icon === 'fee'
                                  ? 'bg-amber-500/15 text-amber-200/90'
                                  : 'bg-sky-500/15 text-sky-300'
                            }`}
                          >
                            {icon === 'in' ? 'In' : icon === 'fee' ? 'Fee' : 'Out'}
                          </span>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-brand-heading">{tx.typeLabel}</p>
                            <p className="text-xs text-brand-subtle">
                              {tx.token} · {tx.dateDisplay}
                            </p>
                          </div>
                        </div>
                        <span
                          className={`shrink-0 font-semibold tabular-nums ${
                            tx.isCredit ? 'text-emerald-300/95' : 'text-brand-heading'
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
          </div>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2">
          <Link
            href="/dashboard/user/transfer"
            className="group relative overflow-hidden rounded-2xl border border-brand-border-muted bg-gradient-to-br from-black/35 to-black/20 p-6 text-left shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)] transition-colors duration-200 hover:border-brand-accent/30"
          >
            <div className="flex items-start justify-between gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-xl border border-brand-accent/20 bg-[var(--brand-accent-soft)]/50 text-brand-accent">
                <ArrowRightLeft className="h-6 w-6" strokeWidth={1.75} aria-hidden />
              </span>
              <ArrowRight className="h-5 w-5 shrink-0 text-brand-subtle transition duration-200 group-hover:translate-x-0.5 group-hover:text-brand-accent" />
            </div>
            <h3 className="mt-4 text-base font-semibold text-brand-heading">Peer-to-peer transfer</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-brand-muted">
              Send to email or username. Network fees may apply.
            </p>
          </Link>
          <Link
            href="/dashboard/user/drawings"
            className="group relative overflow-hidden rounded-2xl border border-brand-border-muted bg-gradient-to-br from-black/35 to-black/20 p-6 text-left shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)] transition-colors duration-200 hover:border-brand-accent/30"
          >
            <div className="flex items-start justify-between gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-xl border border-brand-accent/20 bg-[var(--brand-accent-soft)]/50 text-brand-accent">
                <Gift className="h-6 w-6" strokeWidth={1.75} aria-hidden />
              </span>
              <ArrowRight className="h-5 w-5 shrink-0 text-brand-subtle transition duration-200 group-hover:translate-x-0.5 group-hover:text-brand-accent" />
            </div>
            <h3 className="mt-4 text-base font-semibold text-brand-heading">Drawings</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-brand-muted">
              View open pools when they are published on the platform.
            </p>
          </Link>
        </div>
      </div>
    </>
  );
}
