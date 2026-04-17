'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';
import {
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Loader2,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Activity,
  BookOpen,
  Layers,
  Clock,
} from 'lucide-react';
import { useAuth } from '@/components/auth-context';
import { cn } from '@/lib/utils';

const TYPE_LABELS = {
  deposit: 'Deposit',
  withdrawal: 'Withdrawal',
  transfer: 'Transfer',
  fee: 'Fee',
  admin_credit: 'Admin credit',
  admin_debit: 'Admin debit',
};

const TYPE_ORDER = ['deposit', 'withdrawal', 'transfer', 'fee', 'admin_credit', 'admin_debit'];

const TOKEN_FILTERS = ['759', 'CRISTALINO', 'ANEJO', 'RAFFLE', 'SUSU'];

function formatDateTime(iso) {
  if (!iso) return '—';
  try {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: 'short',
      timeStyle: 'short',
    }).format(new Date(iso));
  } catch {
    return '—';
  }
}

function formatAmount(n) {
  if (typeof n !== 'number' || Number.isNaN(n)) return '—';
  return new Intl.NumberFormat(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 6,
  }).format(n);
}

function TypeBadge({ type }) {
  const label = TYPE_LABELS[type] || type;
  const styles = {
    deposit: 'border-emerald-500/35 bg-emerald-500/[0.1] text-emerald-100',
    withdrawal: 'border-rose-500/35 bg-rose-500/[0.1] text-rose-100',
    transfer: 'border-sky-500/35 bg-sky-500/[0.1] text-sky-100',
    fee: 'border-amber-500/35 bg-amber-500/[0.12] text-amber-100',
    admin_credit: 'border-violet-500/35 bg-violet-500/[0.1] text-violet-100',
    admin_debit: 'border-orange-500/35 bg-orange-500/[0.1] text-orange-100',
  };
  return (
    <span
      className={cn(
        'inline-flex rounded-md border px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-[0.06em]',
        styles[type] || 'border-white/10 bg-white/5 text-brand-muted'
      )}
    >
      {label}
    </span>
  );
}

function SummaryCard({ icon: Icon, label, value, hint }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-black/[0.28] p-4 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)]">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-brand-subtle">{label}</p>
          <p className="mt-1.5 text-xl font-semibold tabular-nums tracking-tight text-brand-heading">{value}</p>
          {hint ? <p className="mt-1 text-[0.7rem] text-brand-muted">{hint}</p> : null}
        </div>
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/[0.08] bg-gradient-to-b from-white/[0.06] to-black/40 text-brand-accent">
          <Icon className="h-[1.125rem] w-[1.125rem]" strokeWidth={2} aria-hidden />
        </span>
      </div>
    </div>
  );
}

export default function SuperAdminTransactionsPage() {
  const { token, ready } = useAuth();
  const [userSearch, setUserSearch] = useState('');
  const [userDebounced, setUserDebounced] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [tokenFilter, setTokenFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [summary, setSummary] = useState(null);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 15 });
  const [sorting, setSorting] = useState([{ id: 'createdAt', desc: true }]);

  useEffect(() => {
    const t = window.setTimeout(() => setUserDebounced(userSearch.trim()), 400);
    return () => window.clearTimeout(t);
  }, [userSearch]);

  useEffect(() => {
    setPagination((p) => ({ ...p, pageIndex: 0 }));
  }, [userDebounced, typeFilter, tokenFilter, dateFrom, dateTo]);

  const sortBy = sorting[0]?.id ?? 'createdAt';
  const sortOrder = sorting[0]?.desc ? 'desc' : 'asc';

  const load = useCallback(async () => {
    if (!token) {
      setLoading(false);
      return;
    }
    setError('');
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(pagination.pageIndex + 1),
        limit: String(pagination.pageSize),
        sortBy,
        sortOrder,
      });
      if (userDebounced) params.set('user', userDebounced);
      if (typeFilter) params.set('type', typeFilter);
      if (tokenFilter) params.set('token', tokenFilter);
      if (dateFrom) params.set('dateFrom', dateFrom);
      if (dateTo) params.set('dateTo', dateTo);

      const res = await fetch(`/api/superadmin/ledger?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(json.error || 'Could not load ledger.');
        setRows([]);
        setSummary(null);
        return;
      }
      setRows(json.entries ?? []);
      setTotal(json.total ?? 0);
      setTotalPages(Math.max(1, json.totalPages ?? 1));
      setSummary(json.summary ?? null);
    } catch {
      setError('Network error.');
      setRows([]);
      setSummary(null);
    } finally {
      setLoading(false);
    }
  }, [
    token,
    pagination.pageIndex,
    pagination.pageSize,
    userDebounced,
    typeFilter,
    tokenFilter,
    dateFrom,
    dateTo,
    sortBy,
    sortOrder,
  ]);

  useEffect(() => {
    if (!ready) return;
    load();
  }, [ready, load]);

  const columns = useMemo(
    () => [
      {
        id: 'createdAt',
        accessorKey: 'createdAt',
        header: 'Time',
        cell: ({ row }) => (
          <span className="whitespace-nowrap text-xs tabular-nums text-brand-muted">
            {formatDateTime(row.original.createdAt)}
          </span>
        ),
      },
      {
        id: 'type',
        accessorKey: 'type',
        header: 'Type',
        cell: ({ row }) => <TypeBadge type={row.original.type} />,
      },
      {
        id: 'user',
        header: 'Account',
        cell: ({ row }) => {
          const u = row.original.user;
          return (
            <div className="min-w-0 max-w-[200px]">
              <p className="truncate text-sm font-medium text-brand-heading">{u.email || '—'}</p>
              {u.name ? <p className="truncate text-xs text-brand-muted">{u.name}</p> : null}
            </div>
          );
        },
        enableSorting: false,
      },
      {
        id: 'token',
        accessorKey: 'token',
        header: 'Token',
        cell: ({ row }) => (
          <span className="font-mono text-xs font-semibold text-brand-accent">{row.original.token}</span>
        ),
      },
      {
        id: 'amount',
        accessorKey: 'amount',
        header: 'Amount',
        cell: ({ row }) => {
          const sign = row.original.signedAmount >= 0 ? '+' : '';
          const cls =
            row.original.signedAmount >= 0 ? 'text-emerald-300/95' : 'text-rose-200/95';
          return (
            <span className={cn('font-medium tabular-nums', cls)}>
              {sign}
              {formatAmount(row.original.signedAmount)}
            </span>
          );
        },
      },
      {
        id: 'counterparty',
        header: 'Counterparty',
        cell: ({ row }) => {
          const cp = row.original.counterparty;
          if (!cp?.email) return <span className="text-sm text-brand-muted">—</span>;
          return (
            <div className="min-w-0 max-w-[180px]">
              <p className="truncate text-xs text-brand-muted">{cp.email}</p>
            </div>
          );
        },
        enableSorting: false,
      },
      {
        id: 'details',
        header: 'Reference / note',
        cell: ({ row }) => {
          const ref = row.original.externalRef;
          const note = row.original.note;
          if (!ref && !note) return <span className="text-sm text-brand-muted">—</span>;
          return (
            <div className="max-w-[220px]">
              {ref ? (
                <p className="truncate font-mono text-[0.7rem] text-brand-subtle">{ref}</p>
              ) : null}
              {note ? <p className="truncate text-xs text-brand-muted">{note}</p> : null}
            </div>
          );
        },
        enableSorting: false,
      },
    ],
    []
  );

  const table = useReactTable({
    data: rows,
    columns,
    state: { sorting, pagination },
    onSortingChange: (updater) => {
      setSorting((prev) => {
        const next = typeof updater === 'function' ? updater(prev) : updater;
        if (!next.length) return [{ id: 'createdAt', desc: true }];
        return next;
      });
      setPagination((p) => ({ ...p, pageIndex: 0 }));
    },
    onPaginationChange: setPagination,
    manualPagination: true,
    manualSorting: true,
    pageCount: totalPages,
    rowCount: total,
    getCoreRowModel: getCoreRowModel(),
  });

  const SortIcon = ({ columnId }) => {
    const sort = sorting[0];
    if (sort?.id !== columnId) {
      return <ArrowUpDown className="ml-1.5 inline h-3.5 w-3.5 opacity-40" strokeWidth={2} aria-hidden />;
    }
    return sort.desc ? (
      <ArrowDown className="ml-1.5 inline h-3.5 w-3.5 text-brand-accent" strokeWidth={2} aria-hidden />
    ) : (
      <ArrowUp className="ml-1.5 inline h-3.5 w-3.5 text-brand-accent" strokeWidth={2} aria-hidden />
    );
  };

  const byType = summary?.byType || {};
  const typeBreakdown = TYPE_ORDER.filter((k) => byType[k]).map((k) => `${TYPE_LABELS[k] || k}: ${byType[k]}`);

  return (
    <div className="space-y-6">
      <div className="border-b border-white/[0.06] pb-6">
        <h1 className="text-xl font-semibold tracking-tight text-brand-heading sm:text-2xl">Transactions</h1>
        <p className="mt-1 max-w-3xl text-sm text-brand-muted">
          Append-only ledger: deposits, withdrawals, transfers, fees, and admin adjustments. Entries are immutable;
          balances are derived from the stream—no silent balance edits.
        </p>
      </div>

      {/* <div className="relative overflow-hidden rounded-2xl border border-brand-accent/15 bg-gradient-to-br from-[var(--brand-accent-soft)]/20 via-black/20 to-[#060708] p-5 sm:p-6">
        <div className="flex gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-brand-accent/25 bg-black/30 text-brand-accent">
            <BookOpen className="h-5 w-5" strokeWidth={2} aria-hidden />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-brand-heading">Ledger management</p>
            <p className="mt-1 text-sm leading-relaxed text-brand-muted">
              Filter by user, token, type, and date range. When the transaction engine is wired, new lines will appear
              here automatically; admin tools will post <strong className="font-medium text-brand-subtle">admin_credit</strong>{' '}
              / <strong className="font-medium text-brand-subtle">admin_debit</strong> with mandatory notes for audit.
            </p>
          </div>
        </div>
      </div> */}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          icon={Layers}
          label="All-time lines"
          value={summary != null ? summary.totalAllTime.toLocaleString() : '—'}
          hint="Total ledger rows in database"
        />
        <SummaryCard
          icon={Clock}
          label="Last 24 hours"
          value={summary != null ? summary.last24h.toLocaleString() : '—'}
          hint="New entries (any filter)"
        />
        <SummaryCard
          icon={Activity}
          label="Matching filter"
          value={summary != null ? summary.filteredTotal.toLocaleString() : '—'}
          hint="Rows that match current filters"
        />
        <SummaryCard
          icon={Filter}
          label="By type (filtered)"
          value={typeBreakdown.length ? `${typeBreakdown.length} types` : '—'}
          hint={typeBreakdown.length ? typeBreakdown.join(' · ') : 'Apply filters to see mix'}
        />
      </div>

      <div className="rounded-2xl border border-white/[0.08] bg-black/[0.2] p-4 sm:p-5">
        <p className="mb-3 text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-brand-subtle">Filters</p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <div className="relative sm:col-span-2">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-subtle"
              strokeWidth={2}
              aria-hidden
            />
            <input
              type="search"
              placeholder="User email or name…"
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              className="w-full rounded-xl border border-brand-border-muted bg-black/40 py-2.5 pl-10 pr-3 text-sm text-brand-heading placeholder:text-brand-subtle/70 focus:border-brand-accent/35 focus:outline-none focus:ring-2 focus:ring-brand-accent/20"
            />
          </div>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="rounded-xl border border-brand-border-muted bg-black/40 px-3 py-2.5 text-sm text-brand-heading focus:border-brand-accent/35 focus:outline-none focus:ring-2 focus:ring-brand-accent/20"
          >
            <option value="">All types</option>
            {TYPE_ORDER.map((k) => (
              <option key={k} value={k}>
                {TYPE_LABELS[k]}
              </option>
            ))}
          </select>
          <select
            value={tokenFilter}
            onChange={(e) => setTokenFilter(e.target.value)}
            className="rounded-xl border border-brand-border-muted bg-black/40 px-3 py-2.5 text-sm text-brand-heading focus:border-brand-accent/35 focus:outline-none focus:ring-2 focus:ring-brand-accent/20"
          >
            <option value="">All tokens</option>
            {TOKEN_FILTERS.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="rounded-xl border border-brand-border-muted bg-black/40 px-3 py-2.5 text-sm text-brand-heading focus:border-brand-accent/35 focus:outline-none focus:ring-2 focus:ring-brand-accent/20"
            aria-label="From date"
          />
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="rounded-xl border border-brand-border-muted bg-black/40 px-3 py-2.5 text-sm text-brand-heading focus:border-brand-accent/35 focus:outline-none focus:ring-2 focus:ring-brand-accent/20"
            aria-label="To date"
          />
        </div>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-500/25 bg-red-500/[0.08] px-4 py-3 text-sm text-red-200/95">
          {error}
        </div>
      ) : null}

      <div className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-gradient-to-b from-black/[0.35] to-[#060708] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)]">
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_100%_80%_at_50%_0%,rgba(201,162,39,0.05),transparent_55%)]"
          aria-hidden
        />

        {loading ? (
          <div className="flex min-h-[280px] items-center justify-center py-16">
            <Loader2 className="h-9 w-9 animate-spin text-brand-accent/80" strokeWidth={1.5} aria-hidden />
          </div>
        ) : (
          <>
            <div className="relative overflow-x-auto">
              <table className="w-full min-w-[980px] border-collapse text-left text-sm">
                <thead>
                  {table.getHeaderGroups().map((hg) => (
                    <tr key={hg.id} className="border-b border-white/[0.08] bg-black/40">
                      {hg.headers.map((header) => {
                        const canSort = header.column.getCanSort();
                        const colId = header.column.id;
                        return (
                          <th
                            key={header.id}
                            className={cn(
                              'whitespace-nowrap px-4 py-3.5 text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-brand-subtle',
                              canSort && 'cursor-pointer select-none hover:text-brand-heading'
                            )}
                            onClick={canSort ? header.column.getToggleSortingHandler() : undefined}
                          >
                            <span className="inline-flex items-center">
                              {flexRender(header.column.columnDef.header, header.getContext())}
                              {canSort ? <SortIcon columnId={colId} /> : null}
                            </span>
                          </th>
                        );
                      })}
                    </tr>
                  ))}
                </thead>
                <tbody>
                  {table.getRowModel().rows.length === 0 ? (
                    <tr>
                      <td
                        colSpan={columns.length}
                        className="px-5 py-16 text-center text-sm text-brand-muted"
                      >
                        <p className="font-medium text-brand-subtle">No ledger entries yet</p>
                        <p className="mx-auto mt-2 max-w-md text-xs leading-relaxed">
                          When deposits, transfers, and fees flow through the transaction engine, each movement will
                          appear here as an immutable line. You can seed or import rows via your backend or a migration
                          script.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    table.getRowModel().rows.map((row, i) => (
                      <tr
                        key={row.id}
                        className={cn(
                          'border-b border-white/[0.05] transition-colors hover:bg-white/[0.03]',
                          i % 2 === 1 && 'bg-black/[0.15]'
                        )}
                      >
                        {row.getVisibleCells().map((cell) => (
                          <td key={cell.id} className="px-4 py-3.5 align-middle">
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </td>
                        ))}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="relative flex flex-col gap-4 border-t border-white/[0.06] bg-black/25 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-brand-muted">
                <span className="font-medium text-brand-subtle">{total.toLocaleString()}</span> matching
                {total > 0 ? (
                  <>
                    {' '}
                    · Showing{' '}
                    <span className="font-medium text-brand-subtle tabular-nums">
                      {pagination.pageIndex * pagination.pageSize + 1}
                      –
                      {Math.min((pagination.pageIndex + 1) * pagination.pageSize, total)}
                    </span>
                  </>
                ) : (
                  <span className="text-brand-subtle/80"> · No rows</span>
                )}
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-1 rounded-lg border border-brand-border-muted bg-black/30 p-0.5">
                  <button
                    type="button"
                    className="rounded-md p-2 text-brand-muted transition hover:bg-[var(--brand-surface-hover)] hover:text-brand-heading disabled:opacity-30"
                    disabled={pagination.pageIndex <= 0}
                    onClick={() => setPagination((p) => ({ ...p, pageIndex: 0 }))}
                    aria-label="First page"
                  >
                    <ChevronsLeft className="h-4 w-4" strokeWidth={2} />
                  </button>
                  <button
                    type="button"
                    className="rounded-md p-2 text-brand-muted transition hover:bg-[var(--brand-surface-hover)] hover:text-brand-heading disabled:opacity-30"
                    disabled={pagination.pageIndex <= 0}
                    onClick={() =>
                      setPagination((p) => ({ ...p, pageIndex: Math.max(0, p.pageIndex - 1) }))
                    }
                    aria-label="Previous page"
                  >
                    <ChevronLeft className="h-4 w-4" strokeWidth={2} />
                  </button>
                  <span className="min-w-[7rem] px-2 text-center text-xs font-medium tabular-nums text-brand-heading">
                    Page {pagination.pageIndex + 1} of {totalPages}
                  </span>
                  <button
                    type="button"
                    className="rounded-md p-2 text-brand-muted transition hover:bg-[var(--brand-surface-hover)] hover:text-brand-heading disabled:opacity-30"
                    disabled={pagination.pageIndex >= totalPages - 1}
                    onClick={() =>
                      setPagination((p) => ({
                        ...p,
                        pageIndex: Math.min(totalPages - 1, p.pageIndex + 1),
                      }))
                    }
                    aria-label="Next page"
                  >
                    <ChevronRight className="h-4 w-4" strokeWidth={2} />
                  </button>
                  <button
                    type="button"
                    className="rounded-md p-2 text-brand-muted transition hover:bg-[var(--brand-surface-hover)] hover:text-brand-heading disabled:opacity-30"
                    disabled={pagination.pageIndex >= totalPages - 1}
                    onClick={() =>
                      setPagination((p) => ({ ...p, pageIndex: totalPages - 1 }))
                    }
                    aria-label="Last page"
                  >
                    <ChevronsRight className="h-4 w-4" strokeWidth={2} />
                  </button>
                </div>
                <label className="flex items-center gap-2 text-xs text-brand-muted">
                  <span className="hidden sm:inline">Rows</span>
                  <select
                    value={pagination.pageSize}
                    onChange={(e) => {
                      const pageSize = Number(e.target.value);
                      setPagination({ pageIndex: 0, pageSize });
                    }}
                    className="rounded-lg border border-brand-border-muted bg-black/40 px-2 py-1.5 text-xs font-medium text-brand-heading focus:border-brand-accent/35 focus:outline-none focus:ring-2 focus:ring-brand-accent/20"
                  >
                    {[10, 15, 25, 50, 100].map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
