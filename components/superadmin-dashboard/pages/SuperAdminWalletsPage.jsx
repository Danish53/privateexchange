'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';
import {
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Loader2,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Wallet,
  ShieldCheck,
  ShieldAlert,
} from 'lucide-react';
import { useAuth } from '@/components/auth-context';
import { emailInitials } from '@/components/user-dashboard/utils';
import { cn } from '@/lib/utils';
import { mergeAdminPermissions } from '@/lib/adminPermissions';
import { avatarSrc } from '@/lib/avatarUrl';

function formatDate(iso) {
  if (!iso) return '—';
  try {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: 'medium',
    }).format(new Date(iso));
  } catch {
    return '—';
  }
}

function shortId(id) {
  if (!id || id.length < 10) return id || '—';
  return `${id.slice(0, 6)}…${id.slice(-4)}`;
}

export default function SuperAdminWalletsPage() {
  const router = useRouter();
  const { token, ready, user } = useAuth();
  const canAdjustWallets =
    user?.role === 'superadmin' || mergeAdminPermissions(user?.adminPermissions).walletsAdjust;
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
  const [sorting, setSorting] = useState([{ id: 'createdAt', desc: true }]);

  useEffect(() => {
    const t = window.setTimeout(() => setSearch(searchInput.trim()), 400);
    return () => window.clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    setPagination((p) => ({ ...p, pageIndex: 0 }));
  }, [search]);

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
      if (search) params.set('search', search);
      const res = await fetch(`/api/superadmin/wallets?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(json.error || 'Could not load wallets.');
        setRows([]);
        return;
      }
      setRows(json.wallets ?? []);
      setTotal(json.total ?? 0);
      setTotalPages(Math.max(1, json.totalPages ?? 1));
    } catch {
      setError('Network error.');
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [token, pagination.pageIndex, pagination.pageSize, search, sortBy, sortOrder]);

  useEffect(() => {
    if (!ready) return;
    load();
  }, [ready, load]);

  const columns = useMemo(() => {
    const base = [
      {
        id: 'memberEmail',
        accessorKey: 'memberEmail',
        header: 'User',
        cell: ({ row }) => {
          const w = row.original;
          const initials = emailInitials(w.memberEmail);
          return (
            <div className="flex items-center gap-3">
              <div className="relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/[0.1] bg-gradient-to-br from-[#2a2418] to-[#0f0e0c] text-[0.65rem] font-bold text-brand-accent">
                {w.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={avatarSrc(w.avatarUrl)} alt="" className="h-full w-full object-cover" />
                ) : (
                  initials
                )}
              </div>
              <div className="min-w-0">
                <p className="truncate font-medium text-brand-heading">{w.memberEmail}</p>
                {w.memberName ? (
                  <p className="truncate text-xs text-brand-muted">{w.memberName}</p>
                ) : null}
              </div>
            </div>
          );
        },
      },
      {
        id: 'walletId',
        accessorKey: 'walletId',
        header: 'Wallet ID',
        cell: ({ row }) => (
          <code className="rounded-md border border-white/[0.08] bg-black/40 px-2 py-1 text-[0.7rem] text-brand-subtle">
            {shortId(row.original.walletId)}
          </code>
        ),
        enableSorting: false,
      },
      {
        id: 'emailVerified',
        accessorKey: 'emailVerified',
        header: 'KYC',
        cell: ({ row }) =>
          row.original.emailVerified ? (
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-300/95">
              <ShieldCheck className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
              Verified
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-200/80">
              <ShieldAlert className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
              Pending
            </span>
          ),
      },
      {
        id: 'balanceDisplay',
        accessorKey: 'balanceDisplay',
        header: 'Total (USD eq.)',
        cell: ({ row }) => (
          <span className="font-medium tabular-nums text-brand-heading">{row.original.balanceDisplay}</span>
        ),
        enableSorting: false,
      },
    ];
    if (canAdjustWallets) {
      base.push({
        id: 'actions',
        header: 'Adjust',
        cell: ({ row }) => (
          <button
            type="button"
            onClick={() =>
              router.push(`/dashboard/superadmin/wallets/${encodeURIComponent(row.original.walletId)}`)
            }
            className="inline-flex items-center gap-1.5 rounded-lg border border-brand-accent/35 bg-[var(--brand-accent-soft)]/25 px-3 py-2 text-xs font-semibold text-brand-accent transition hover:bg-[var(--brand-accent-soft)]/40"
          >
            <Wallet className="h-3.5 w-3.5 shrink-0" strokeWidth={2} aria-hidden />
            Manage
          </button>
        ),
        enableSorting: false,
      });
    }
    base.push({
        id: 'country',
        accessorKey: 'country',
        header: 'Region',
        cell: ({ row }) => (
          <span className="text-sm text-brand-muted">{row.original.country || '—'}</span>
        ),
        enableSorting: false,
      },
      {
        id: 'createdAt',
        accessorKey: 'openedAt',
        header: 'Opened',
        cell: ({ row }) => (
          <span className="whitespace-nowrap text-sm tabular-nums text-brand-muted">
            {formatDate(row.original.openedAt)}
          </span>
        ),
      }
    );
    return base;
  }, [router, canAdjustWallets]);

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

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 border-b border-white/[0.06] pb-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-brand-heading sm:text-2xl">Wallets</h1>
          {/* <p className="mt-1 max-w-2xl text-sm text-brand-muted">
            Wallet
          </p> */}
        </div>
        <div className="relative w-full lg:max-w-sm">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-subtle"
            strokeWidth={2}
            aria-hidden
          />
          <input
            type="search"
            placeholder="Search user email or name…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full rounded-xl border border-brand-border-muted bg-black/30 py-2.5 pl-10 pr-4 text-sm text-brand-heading placeholder:text-brand-subtle/80 focus:border-brand-accent/35 focus:outline-none focus:ring-2 focus:ring-brand-accent/25"
            autoComplete="off"
          />
        </div>
      </div>

      {/* <div className="relative overflow-hidden rounded-2xl border border-brand-accent/15 bg-gradient-to-br from-[var(--brand-accent-soft)]/25 via-black/20 to-[#060708] p-5 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)] sm:p-6">
        <div className="flex gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-brand-accent/25 bg-black/30 text-brand-accent">
            <Info className="h-5 w-5" strokeWidth={2} aria-hidden />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-brand-heading">How you see wallets</p>
            <p className="mt-1 text-sm leading-relaxed text-brand-muted">
              Rows are <strong className="font-medium text-brand-subtle">user accounts</strong> with role{' '}
              <code className="rounded bg-black/40 px-1 py-0.5 text-[0.7rem] text-brand-accent">user</code> that are not
          archived. The wallet ID matches the user&apos;s internal user ID (same record drives profile + wallet).
          Admins and super admins do not appear in this list—only end-user wallets.
            </p>
          </div>
        </div>
      </div> */}

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-white/[0.08] bg-black/[0.28] p-5 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)]">
          <div className="flex items-center gap-2 text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-brand-subtle">
            <Wallet className="h-3.5 w-3.5 text-brand-accent" strokeWidth={2} aria-hidden />
            Scope
          </div>
          <p className="mt-2 text-sm text-brand-muted">User wallets only · one row per user</p>
        </div>
        <div className="rounded-2xl border border-white/[0.08] bg-black/[0.28] p-5 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)]">
          <div className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-brand-subtle">Balances</div>
          <p className="mt-2 text-sm text-brand-muted">
            Per-token amounts come from the database; credits and debits write ledger lines the user can see in
            wallet history.
          </p>
        </div>
        <div className="rounded-2xl border border-white/[0.08] bg-black/[0.28] p-5 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)]">
          <div className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-brand-subtle">Archived users</div>
          <p className="mt-2 text-sm text-brand-muted">
            Soft-deleted users are hidden here until restored under Users → Archived.
          </p>
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
              <table className="w-full min-w-[1040px] border-collapse text-left text-sm">
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
                              header.column.id === 'memberEmail' && 'pl-5',
                              canSort && 'cursor-pointer select-none hover:text-brand-heading'
                            )}
                            onClick={
                              canSort ? header.column.getToggleSortingHandler() : undefined
                            }
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
                        No user wallets found.
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
                          <td
                            key={cell.id}
                            className={cn(
                              'px-4 py-3.5 align-middle',
                              cell.column.id === 'memberEmail' && 'pl-5'
                            )}
                          >
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
                <span className="font-medium text-brand-subtle">{total.toLocaleString()}</span> user wallets
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
                    {[10, 20, 30, 50].map((n) => (
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
