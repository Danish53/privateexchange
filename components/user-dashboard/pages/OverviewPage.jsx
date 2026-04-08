import Link from 'next/link';
import {
  ArrowRight,
  ArrowRightLeft,
  Gift,
  ArrowDown,
  Zap,
  Wallet,
  TrendingUp,
} from 'lucide-react';
import Panel from '@/components/user-dashboard/Panel';
import TokenBalanceList from '@/components/user-dashboard/TokenBalanceList';
import { TOTAL_BALANCE, MEMBERSHIP, TRANSACTIONS } from '@/components/user-dashboard/constants';

export default function OverviewPage() {
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
              Portfolio snapshot, USD equivalents, and shortcuts to move funds or join drawings.
            </p>
          </div>
          <p className="shrink-0 text-xs font-medium tabular-nums text-brand-subtle">
            As of today · demo data
          </p>
        </div>
      </header>

      <div className="space-y-8">
        <div className="grid gap-5 lg:grid-cols-12 lg:gap-6">
          <div className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-gradient-to-br from-[var(--brand-accent-soft)]/35 via-black/25 to-[#060708] p-6 shadow-[0_28px_64px_-36px_rgba(201,162,39,0.35)] sm:p-7 lg:col-span-7">
            <div
              className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_100%_-20%,rgba(201,162,39,0.14),transparent_55%)]"
              aria-hidden
            />
            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(105deg,transparent_40%,rgba(255,255,255,0.02)_50%,transparent_60%)]" aria-hidden />
            <div className="relative flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-brand-muted">Total balance (USD eq.)</p>
                <p className="mt-2 text-3xl font-semibold tabular-nums tracking-[-0.04em] text-brand-heading sm:text-[2.25rem] sm:leading-none">
                  {TOTAL_BALANCE}
                </p>
                <p className="mt-2 flex items-center gap-1.5 text-xs text-brand-subtle">
                  <TrendingUp className="h-3.5 w-3.5 text-emerald-400/90" strokeWidth={2} aria-hidden />
                  <span>Aggregated across all listed tokens</span>
                </p>
              </div>
              <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/[0.08] px-3.5 py-1.5 text-xs font-semibold text-emerald-200/95 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)]">
                <Zap className="h-3.5 w-3.5 text-emerald-300" strokeWidth={2} aria-hidden />
                {MEMBERSHIP.tier} member
              </span>
            </div>
            <div className="relative mt-7 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/dashboard/user/wallet"
                className="btn-primary inline-flex flex-1 items-center justify-center gap-2 rounded-xl py-3 text-center text-sm font-semibold"
              >
                <Wallet className="h-4 w-4" strokeWidth={2} aria-hidden />
                Deposit
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

          <div className="grid gap-3 sm:grid-cols-3 lg:col-span-5 lg:grid-cols-1 lg:gap-3">
            {[
              { label: 'Total deposits', value: '$5,000', sub: 'All-time', icon: ArrowDown },
              { label: 'Total transfers', value: '48', sub: 'Completed', icon: ArrowRightLeft },
              { label: 'Drawing entries', value: '12', sub: 'Active pools', icon: Gift },
            ].map((s) => (
              <div
                key={s.label}
                className="group flex items-center gap-4 rounded-xl border border-brand-border-muted bg-black/[0.28] px-4 py-3.5 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)] transition duration-200 hover:border-white/[0.1] hover:bg-[var(--brand-surface-hover)]"
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/[0.06] bg-gradient-to-b from-white/[0.06] to-black/40 text-brand-accent shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)] transition duration-200 group-hover:border-brand-accent/20">
                  <s.icon className="h-[1.125rem] w-[1.125rem]" strokeWidth={2} aria-hidden />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-brand-subtle">
                    {s.label}
                  </p>
                  <p className="mt-0.5 text-lg font-semibold tabular-nums tracking-tight text-brand-heading">
                    {s.value}
                  </p>
                  <p className="text-[0.7rem] text-brand-muted/90">{s.sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <Panel title="Token balances" subtitle="All ecosystem tokens · USD shown for reference">
          <TokenBalanceList />
        </Panel>

        <div>
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-sm font-semibold tracking-tight text-brand-heading">Recent activity</h2>
            <Link
              href="/dashboard/user/wallet"
              className="text-xs font-medium text-brand-accent transition hover:text-brand-accent-hover"
            >
              View wallet
            </Link>
          </div>
          <div className="overflow-hidden rounded-xl border border-brand-border-muted bg-black/[0.22] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)]">
            <ul className="divide-y divide-white/[0.04]">
              {TRANSACTIONS.slice(0, 4).map((tx, i) => (
                <li
                  key={`${tx.date}-${tx.type}-${i}`}
                  className="flex flex-wrap items-center justify-between gap-3 px-4 py-3.5 sm:px-5"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[0.65rem] font-bold uppercase ${
                        tx.type === 'deposit'
                          ? 'bg-emerald-500/15 text-emerald-300'
                          : tx.type === 'transfer'
                            ? 'bg-sky-500/15 text-sky-300'
                            : 'bg-white/[0.06] text-brand-muted'
                      }`}
                    >
                      {tx.type === 'deposit' ? 'In' : tx.type === 'transfer' ? 'Out' : 'Fee'}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium capitalize text-brand-heading">{tx.type}</p>
                      <p className="text-xs text-brand-subtle">
                        {tx.token} · {tx.date}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`shrink-0 font-semibold tabular-nums ${
                      tx.amount.startsWith('+') ? 'text-emerald-300/95' : 'text-brand-heading'
                    }`}
                  >
                    {tx.amount}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Link
            href="/dashboard/user/transfer"
            className="group relative overflow-hidden rounded-2xl border border-brand-border-muted bg-gradient-to-br from-black/35 to-black/20 p-6 text-left shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)] transition duration-300 hover:-translate-y-0.5 hover:border-brand-accent/35 hover:shadow-[0_24px_48px_-28px_rgba(201,162,39,0.25)]"
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
            className="group relative overflow-hidden rounded-2xl border border-brand-border-muted bg-gradient-to-br from-black/35 to-black/20 p-6 text-left shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)] transition duration-300 hover:-translate-y-0.5 hover:border-brand-accent/35 hover:shadow-[0_24px_48px_-28px_rgba(201,162,39,0.25)]"
          >
            <div className="flex items-start justify-between gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-xl border border-brand-accent/20 bg-[var(--brand-accent-soft)]/50 text-brand-accent">
                <Gift className="h-6 w-6" strokeWidth={1.75} aria-hidden />
              </span>
              <ArrowRight className="h-5 w-5 shrink-0 text-brand-subtle transition duration-200 group-hover:translate-x-0.5 group-hover:text-brand-accent" />
            </div>
            <h3 className="mt-4 text-base font-semibold text-brand-heading">Drawings & rewards</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-brand-muted">
              Enter with tokens and track your drawing history.
            </p>
          </Link>
        </div>
      </div>
    </>
  );
}
