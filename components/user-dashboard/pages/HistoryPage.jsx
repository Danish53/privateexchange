'use client';

import Link from 'next/link';
import {
  ArrowDown,
  ArrowUp,
  Activity,
  CheckCircle2,
  Wallet,
} from 'lucide-react';
import { LedgerTableSkeleton } from '@/components/ui/content-skeletons';
import Panel from '@/components/user-dashboard/Panel';
import { useUserWalletHistory } from '@/components/user-dashboard/useUserWalletHistory';
import { PLATFORM_TOKEN_SEED } from '@/lib/tokenCatalog';
import { useUserWallet } from '../useUserWallet';
import { useEffect, useState } from 'react';

function historyIcon(type) {
  if (type === 'fee') return 'fee';
  if (type === 'deposit' || type === 'admin_credit' || type === 'buy') return 'in';
  return 'out';
}

export default function HistoryPage() {
  const hist = useUserWalletHistory({ limit: 200, enableTokenFilter: true });
  const { tokens } = useUserWallet();
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage] = useState(10);
  const [typeFilter, setTypeFilter] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const filteredEntries = hist.entries.filter((tx) => {
    // ✅ Token filter (FIX)
    if (
      hist.tokenFilter !== 'all' &&
      tx.token?.toUpperCase() !== hist.tokenFilter.toUpperCase()
    ) {
      return false;
    }

    // ✅ Type filter
    if (typeFilter !== 'all' && tx.typeLabel !== typeFilter) return false;

    // ✅ Date filter
    const txDate = new Date(tx.date);

    if (startDate && txDate < new Date(startDate)) return false;
    if (endDate && txDate > new Date(endDate)) return false;

    return true;
  });

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(1);
    }
  }, [filteredEntries]);

  const totalPages = Math.max(1, Math.ceil(filteredEntries.length / rowsPerPage));

  const paginatedEntries = filteredEntries.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  return (
    <>
      <header className="mb-8 sm:mb-10">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-brand-subtle">Account</p>
            <h1 className="mt-1.5 text-2xl font-semibold tracking-[-0.03em] text-brand-heading sm:text-[1.75rem]">
              Transaction history
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-brand-muted">
              Your ledger: deposits, withdrawals, transfers, fees, and platform credits or debits. Filter by token or
              view everything in one place.
            </p>
          </div>
          <p className="shrink-0 text-xs font-medium tabular-nums text-brand-subtle">
            {!hist.loading && hist.totalForUser > 0
              ? `${hist.totalForUser.toLocaleString()} entries`
              : !hist.loading
                ? 'No entries yet'
                : ' '}
          </p>
        </div>
      </header>

      <div className="space-y-8">
        {!hist.loading && !hist.error && hist.totalForUser === 0 ? (
          <Panel
            title="No activity yet"
            subtitle="Ledger lines appear when your wallet has deposits, transfers, fees, or admin adjustments."
          >
            <p className="text-sm leading-relaxed text-brand-muted">
              Once movement is recorded on your account, it will show up here with date, type, and amount.
            </p>
            <Link
              href="/dashboard/user/wallet"
              className="btn-primary mt-5 inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold"
            >
              <Wallet className="h-4 w-4" strokeWidth={2} aria-hidden />
              Open wallet
            </Link>
          </Panel>
        ) : (
          <Panel
            title="All transactions"
            subtitle="Newest first · same data as your wallet page, with more rows and filters."
          >
            <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <label className="flex flex-col gap-1.5 text-xs sm:flex-row sm:items-center sm:gap-3">
                <span className="font-semibold uppercase tracking-[0.1em] text-brand-subtle">Token</span>
                <select
                  value={hist.tokenFilter}
                  onChange={(e) => hist.setTokenFilter(e.target.value)}
                  className="w-full max-w-xs rounded-xl border border-brand-border-muted bg-black/40 px-3 py-2 text-sm text-brand-heading focus:border-brand-accent/35 focus:outline-none focus:ring-2 focus:ring-brand-accent/20 sm:w-auto"
                >
                  <option value="all">All tokens</option>
                  {tokens.filter((t) => t.isActive === true).map((t) => (
                    <option key={t.slug} value={t.symbol} onChange={(e) => {
                      hist.setTokenFilter(e.target.value);
                      setCurrentPage(1); // ✅ add this
                    }}>
                      {t.name} ({t.symbol})
                    </option>
                  ))}
                </select>

                <select
                  value={typeFilter}
                  onChange={(e) => {
                    setTypeFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="rounded-xl px-3 py-2 text-sm bg-black/40 border border-white/10"
                >
                  <option value="all">All Types</option>
                  <option value="Deposit">Deposit</option>
                  <option value="Buy">Buy</option>
                  <option value="Withdrawal">Withdrawal</option>
                  <option value="Transfer">Transfer</option>
                  <option value="Fee">Fee</option>
                  <option value="Admin credit">Admin credit</option>
                  <option value="Admin debit">Admin debit</option>
                </select>

                {/* DATE FROM */}
                {/* <label className="flex items-center gap-1">
                  <span className="sr-only">From date</span>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => {
                      setStartDate(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="rounded-xl px-3 py-2 text-sm bg-black/40 border border-white/10"
                  />
                </label> */}

                {/* DATE TO */}
                {/* <label className="flex items-center gap-1">
                  <span className="sr-only">To date</span>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => {
                      setEndDate(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="rounded-xl px-3 py-2 text-sm bg-black/40 border border-white/10"
                  />
                </label> */}

              </label>
              <Link
                href="/dashboard/user/wallet"
                className="text-xs font-medium text-brand-accent transition hover:text-brand-accent-hover"
              >
                Wallet & balances
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
                  <span>Type / details</span>
                  <span className="hidden sm:block">Date</span>
                  <span className="hidden text-right sm:block">Status</span>
                  <span className="text-right">Amount</span>
                </div>
                {paginatedEntries.length === 0 ? (
                  <p className="px-4 py-10 text-center text-sm text-brand-muted sm:px-5">
                    No history found!
                  </p>
                ) : (
                  <ul className="divide-y divide-white/[0.04]">
                    {paginatedEntries.map((tx) => {
                      const icon = historyIcon(tx.type);
                      return (
                        <li
                          key={tx.id}
                          className="flex flex-wrap items-center justify-between gap-3 px-4 py-3.5 transition duration-150 hover:bg-[var(--brand-surface-hover)]/60 sm:px-5"
                        >
                          <div className="flex min-w-0 flex-1 items-center gap-3 sm:min-w-[12rem]">
                            <div
                              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/[0.06] ${icon === 'in'
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
                              <p className="font-medium text-brand-heading">{tx.typeLabel}</p>
                              <p className="text-xs text-brand-subtle">{tx.token}</p>
                              {tx.note ? (
                                <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-brand-muted">{tx.note}</p>
                              ) : null}
                            </div>
                          </div>
                          <div className="hidden min-w-0 flex-1 text-sm text-brand-muted sm:block">{tx.dateDisplay}</div>
                          <div className="hidden items-center justify-end sm:flex">
                            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/20 bg-emerald-500/[0.08] px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wide text-emerald-200/90">
                              <CheckCircle2 className="h-3 w-3" strokeWidth={2} aria-hidden />
                              {tx.status}
                            </span>
                          </div>
                          <span
                            className={`shrink-0 font-semibold tabular-nums ${tx.isCredit ? 'text-emerald-300/95' : 'text-red-300/90'
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

            <div className="flex items-center justify-between mt-4 text-sm">

              <span className="text-brand-muted">
                Page {currentPage} of {totalPages}
              </span>

              <div className="flex gap-2">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => p - 1)}
                  className="px-3 py-1 rounded bg-white/10 disabled:opacity-40"
                >
                  Prev
                </button>

                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((p) => p + 1)}
                  className="px-3 py-1 rounded bg-white/10 disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          </Panel>
        )}
      </div>
    </>
  );
}
