'use client';

import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/Skeleton';

/** Large USD / balance figure in hero cards and headers */
export function UsdHeroSkeleton({ className }) {
  return (
    <Skeleton
      className={cn('mt-2 inline-block h-9 w-36 max-w-[85vw] rounded-lg sm:h-10 sm:w-44', className)}
      aria-hidden
    />
  );
}

/** Compact inline amount (e.g. balance line in forms) */
export function UsdInlineSkeleton({ className }) {
  return <Skeleton className={cn('inline-block h-5 w-28 rounded-md', className)} aria-hidden />;
}

/** Matches TokenBalanceList: grid of token cards */
export function TokenBalanceCardsSkeleton({ count = 6, className }) {
  return (
    <div
      className={cn('mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5', className)}
      role="status"
      aria-label="Loading balances"
    >
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="relative overflow-hidden rounded-xl border border-white/[0.08] bg-black/30 p-4 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)]"
        >
          <div className="space-y-2 pl-2">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-5 w-24" />
          </div>
          <div className="mt-3 space-y-2 border-t border-white/[0.06] pt-3 pl-2">
            <Skeleton className="h-3 w-14" />
            <Skeleton className="h-7 w-32" />
          </div>
        </div>
      ))}
      <span className="sr-only">Loading token balances</span>
    </div>
  );
}

/** Wallet / history ledger: column header + rows with icon + copy + amount */
export function LedgerTableSkeleton({ rows = 8, className }) {
  return (
    <div
      className={cn('overflow-hidden rounded-xl border border-white/[0.05] bg-black/[0.2]', className)}
      role="status"
      aria-label="Loading transactions"
    >
      <div className="grid grid-cols-[1fr_auto] gap-4 border-b border-white/[0.06] px-4 py-2.5 sm:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_auto_auto] sm:px-5">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="hidden h-3 w-16 sm:block" />
        <Skeleton className="hidden h-3 w-14 sm:block sm:justify-self-end" />
        <Skeleton className="h-3 w-20 justify-self-end sm:w-16" />
      </div>
      <ul className="divide-y divide-white/[0.04]">
        {Array.from({ length: rows }).map((_, i) => (
          <li key={i} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3.5 sm:px-5">
            <div className="flex min-w-0 flex-1 items-center gap-3 sm:min-w-[12rem]">
              <Skeleton className="h-10 w-10 shrink-0 rounded-xl" />
              <div className="min-w-0 flex-1 space-y-2">
                <Skeleton className="h-4 w-[40%] max-w-[200px]" />
                <Skeleton className="h-3 w-[55%] max-w-[260px]" />
              </div>
            </div>
            <Skeleton className="h-4 w-24 shrink-0" />
          </li>
        ))}
      </ul>
      <span className="sr-only">Loading history</span>
    </div>
  );
}

/** User deposit requests table on buy page */
export function DepositRequestsTableSkeleton({ rows = 5, className }) {
  return (
    <div
      className={cn(
        'overflow-hidden rounded-2xl border border-brand-border-muted bg-[var(--brand-surface)]/40',
        className
      )}
      role="status"
      aria-label="Loading deposit requests"
    >
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-brand-border-muted bg-black/20">
              {['w-20', 'w-16', 'w-20', 'w-28', 'w-24'].map((w, i) => (
                <th key={i} className="px-4 py-3 text-left sm:px-6">
                  <Skeleton className={cn('h-3', w)} />
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="">
            {Array.from({ length: rows }).map((_, r) => (
              <tr key={r}>
                <td className="px-4 py-4 sm:px-6">
                  <Skeleton className="h-4 w-24" />
                </td>
                <td className="px-4 py-4 sm:px-6">
                  <Skeleton className="h-4 w-14" />
                </td>
                <td className="px-4 py-4 sm:px-6">
                  <Skeleton className="h-6 w-16 rounded-md" />
                </td>
                <td className="px-4 py-4 sm:px-6">
                  <Skeleton className="h-3 w-28" />
                </td>
                <td className="px-4 py-4 sm:px-6">
                  <Skeleton className="h-6 w-20 rounded-md" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <span className="sr-only">Loading deposit requests</span>
    </div>
  );
}

/** Superadmin (and similar) full-width data tables inside existing card chrome */
export function AdminDataTableSkeleton({
  rows = 10,
  headerCells = 6,
  minHeight = 'min-h-[280px]',
  className,
}) {
  return (
    <div className={cn('relative', minHeight, className)} role="status" aria-label="Loading table">
      <div className="border-b border-white/[0.08] bg-black/40 px-4 py-3.5">
        <div className="flex flex-wrap items-center gap-3 sm:gap-5">
          {Array.from({ length: headerCells }).map((_, i) => (
            <Skeleton
              key={i}
              className={cn(
                'h-3 shrink-0',
                i === 0 ? 'w-36' : i === headerCells - 1 ? 'ml-auto w-20' : 'w-24'
              )}
            />
          ))}
        </div>
      </div>
      <div className="divide-y divide-white/[0.04]">
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="flex flex-wrap items-center gap-4 px-4 py-3.5 sm:px-5">
            <Skeleton className="h-9 w-9 shrink-0 rounded-lg sm:h-10 sm:w-10" />
            <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-center sm:gap-6">
              <Skeleton className="h-4 w-full max-w-[220px]" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-24" />
            </div>
            <Skeleton className="h-8 w-24 shrink-0 rounded-lg" />
          </div>
        ))}
      </div>
      <span className="sr-only">Loading table data</span>
    </div>
  );
}

/** Buy page token picker grid */
export function BuyTokenPickerSkeleton({ count = 6, className }) {
  return (
    <div
      className={cn('grid grid-cols-2 gap-3 md:grid-cols-3', className)}
      role="status"
      aria-label="Loading tokens"
    >
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="rounded-xl border border-white/10 bg-gradient-to-br from-white/[0.04] to-black/25 p-4"
        >
          <div className="flex items-start gap-3">
            <Skeleton className="h-12 w-12 shrink-0 rounded-xl" />
            <div className="min-w-0 flex-1 space-y-2 pt-0.5">
              <Skeleton className="h-4 w-[72%] max-w-[120px]" />
              <Skeleton className="h-3 w-[48%] max-w-[80px]" />
              <div className="mt-2 flex justify-between gap-2">
                <Skeleton className="h-3 w-12" />
                <Skeleton className="h-3 w-14" />
              </div>
            </div>
          </div>
        </div>
      ))}
      <span className="sr-only">Loading tokens</span>
    </div>
  );
}

/** Superadmin overview stats row */
export function AdminStatsRowSkeleton({ cards = 4, className }) {
  return (
    <div className={cn('grid gap-4 sm:grid-cols-2 lg:grid-cols-4', className)} role="status" aria-label="Loading stats">
      {Array.from({ length: cards }).map((_, i) => (
        <div
          key={i}
          className="rounded-2xl border border-white/[0.08] bg-black/[0.25] p-5 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)]"
        >
          <Skeleton className="h-3 w-24" />
          <Skeleton className="mt-4 h-8 w-20" />
          <Skeleton className="mt-2 h-3 w-32" />
        </div>
      ))}
      <span className="sr-only">Loading overview</span>
    </div>
  );
}

/** Superadmin overview: daily + weekly chart panels */
export function AdminChartsRowSkeleton({ className }) {
  return (
    <div className={cn('grid gap-6 xl:grid-cols-2', className)} role="status" aria-label="Loading charts">
      {Array.from({ length: 2 }).map((_, i) => (
        <div
          key={i}
          className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-gradient-to-b from-black/[0.35] to-[#060708] p-5 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)] sm:p-6"
        >
          <Skeleton className="h-4 w-44 max-w-[85%]" />
          <Skeleton className="mt-2 h-3 w-28" />
          <Skeleton className="mt-5 h-[260px] w-full rounded-xl" />
        </div>
      ))}
      <span className="sr-only">Loading chart data</span>
    </div>
  );
}

/** Superadmin user wallet detail: header strip + token balance cards */
export function AdminMemberWalletSkeleton({ tokenCount = 5, className }) {
  return (
    <div className={cn('space-y-6', className)} role="status" aria-label="Loading wallet">
      <div className="flex flex-col gap-4 rounded-2xl border border-white/[0.08] bg-gradient-to-b from-black/[0.35] to-[#060708] p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-14 w-14 shrink-0 rounded-full" />
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-5 w-full max-w-[280px]" />
            <Skeleton className="h-4 w-40 max-w-full" />
            <div className="flex flex-wrap gap-2 pt-1">
              <Skeleton className="h-6 w-20 rounded-md" />
              <Skeleton className="h-6 w-36 rounded-md" />
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-brand-accent/20 bg-[var(--brand-accent-soft)]/15 px-4 py-3 sm:min-w-[8rem] sm:text-right">
          <Skeleton className="h-3 w-24 sm:ml-auto" />
          <Skeleton className="mt-2 h-8 w-28 sm:ml-auto" />
        </div>
      </div>
      <TokenBalanceCardsSkeleton count={tokenCount} className="mt-0" />
      <span className="sr-only">Loading wallet data</span>
    </div>
  );
}

/** Superadmin wallet adjust: admin adjustment history card grid */
export function AdminAdjustmentHistorySkeleton({ cards = 6, className }) {
  return (
    <div className={cn('mt-6', className)} role="status" aria-label="Loading adjustment history">
      <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: cards }).map((_, i) => (
          <li
            key={i}
            className="rounded-xl border border-white/[0.06] bg-black/35 px-3 py-3 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)]"
          >
            <Skeleton className="h-3 w-28" />
            <Skeleton className="mt-3 h-4 w-full max-w-[200px]" />
            <Skeleton className="mt-2 h-5 w-20 rounded-md" />
          </li>
        ))}
      </ul>
      <span className="sr-only">Loading history</span>
    </div>
  );
}
