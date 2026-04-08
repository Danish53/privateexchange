'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
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
  ShieldCheck,
  ShieldAlert,
  Archive,
  RotateCcw,
} from 'lucide-react';
import { useAuth } from '@/components/auth-context';
import { emailInitials } from '@/components/user-dashboard/utils';
import { cn } from '@/lib/utils';

function formatDate(iso) {
  if (!iso) return '—';
  try {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(iso));
  } catch {
    return '—';
  }
}

function RoleBadge({ role }) {
  const map = {
    user: { label: 'Member', className: 'border-slate-500/30 bg-slate-500/10 text-slate-200' },
    admin: { label: 'Admin', className: 'border-amber-500/35 bg-amber-500/[0.12] text-amber-100' },
  };
  const m = map[role] || { label: role, className: 'border-white/10 bg-white/5 text-brand-muted' };
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md border px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-[0.08em]',
        m.className
      )}
    >
      {m.label}
    </span>
  );
}

export default function SuperAdminUsersPage() {
  const { token, ready, user } = useAuth();
  const [listView, setListView] = useState('active');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
  const [sorting, setSorting] = useState([{ id: 'createdAt', desc: true }]);
  const [busyId, setBusyId] = useState(null);

  useEffect(() => {
    const t = window.setTimeout(() => setSearch(searchInput.trim()), 400);
    return () => window.clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    setPagination((p) => ({ ...p, pageIndex: 0 }));
  }, [search]);

  useEffect(() => {
    setPagination((p) => ({ ...p, pageIndex: 0 }));
    setSorting(
      listView === 'archived' ? [{ id: 'deletedAt', desc: true }] : [{ id: 'createdAt', desc: true }]
    );
  }, [listView]);

  const sortBy = sorting[0]?.id ?? (listView === 'archived' ? 'deletedAt' : 'createdAt');
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
        status: listView === 'archived' ? 'archived' : 'active',
      });
      if (search) params.set('search', search);
      const res = await fetch(`/api/superadmin/users?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(json.error || 'Could not load users.');
        setRows([]);
        return;
      }
      setRows(json.users ?? []);
      setTotal(json.total ?? 0);
      setTotalPages(Math.max(1, json.totalPages ?? 1));
    } catch {
      setError('Network error.');
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [token, pagination.pageIndex, pagination.pageSize, search, sortBy, sortOrder, listView]);

  useEffect(() => {
    if (!ready) return;
    load();
  }, [ready, load]);

  const archiveUser = async (id) => {
    if (
      !window.confirm(
        'Archive this account? They will be signed out and cannot log in until you restore them.'
      )
    ) {
      return;
    }
    if (!token) return;
    setBusyId(id);
    setError('');
    try {
      const res = await fetch(`/api/superadmin/users/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(json.error || 'Could not archive user.');
        return;
      }
      await load();
    } catch {
      setError('Network error.');
    } finally {
      setBusyId(null);
    }
  };

  const restoreUser = async (id) => {
    if (!window.confirm('Restore this account? They will be able to sign in again.')) return;
    if (!token) return;
    setBusyId(id);
    setError('');
    try {
      const res = await fetch(`/api/superadmin/users/${id}/restore`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(json.error || 'Could not restore user.');
        return;
      }
      await load();
    } catch {
      setError('Network error.');
    } finally {
      setBusyId(null);
    }
  };

  const myId = user?.id;

  const columns = useMemo(
    () => [
      {
        id: 'email',
        accessorKey: 'email',
        header: 'User',
        cell: ({ row }) => {
          const u = row.original;
          const initials = emailInitials(u.email);
          return (
            <div className="flex items-center gap-3">
              <div className="relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/[0.1] bg-gradient-to-br from-[#2a2418] to-[#0f0e0c] text-[0.65rem] font-bold text-brand-accent">
                {u.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={u.avatarUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  initials
                )}
              </div>
              <div className="min-w-0">
                <p className="truncate font-medium text-brand-heading">{u.email}</p>
                {u.name ? (
                  <p className="truncate text-xs text-brand-muted">{u.name}</p>
                ) : null}
              </div>
            </div>
          );
        },
      },
      {
        id: 'role',
        accessorKey: 'role',
        header: 'Role',
        cell: ({ row }) => <RoleBadge role={row.original.role} />,
      },
      {
        id: 'emailVerified',
        accessorKey: 'emailVerified',
        header: 'Verified',
        cell: ({ row }) =>
          row.original.emailVerified ? (
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-300/95">
              <ShieldCheck className="h-3.5 w-3.5 shrink-0" strokeWidth={2} aria-hidden />
              Yes
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-200/80">
              <ShieldAlert className="h-3.5 w-3.5 shrink-0" strokeWidth={2} aria-hidden />
              Pending
            </span>
          ),
      },
      {
        id: 'country',
        accessorKey: 'country',
        header: 'Location',
        cell: ({ row }) => (
          <span className="text-sm text-brand-muted">{row.original.country || '—'}</span>
        ),
        enableSorting: false,
      },
      {
        id: 'createdAt',
        accessorKey: 'createdAt',
        header: 'Joined',
        cell: ({ row }) => (
          <span className="whitespace-nowrap text-sm tabular-nums text-brand-muted">
            {formatDate(row.original.createdAt)}
          </span>
        ),
      },
      ...(listView === 'archived'
        ? [
            {
              id: 'deletedAt',
              accessorKey: 'deletedAt',
              header: 'Archived',
              cell: ({ row }) => (
                <span className="whitespace-nowrap text-sm tabular-nums text-amber-200/85">
                  {formatDate(row.original.deletedAt)}
                </span>
              ),
            },
          ]
        : []),
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => {
          const u = row.original;
          const self = myId && u.id === myId;
          const isBusy = busyId === u.id;
          if (listView === 'active') {
            return (
              <div className="flex justify-end">
                <button
                  type="button"
                  disabled={self || isBusy}
                  onClick={() => archiveUser(u.id)}
                  title={self ? 'Cannot archive your own session' : 'Archive user'}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-transparent px-2.5 py-1.5 text-xs font-semibold text-brand-muted transition hover:border-red-500/25 hover:bg-red-500/[0.08] hover:text-red-200 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {isBusy ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
                  ) : (
                    <Archive className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
                  )}
                  Archive
                </button>
              </div>
            );
          }
          return (
            <div className="flex justify-end">
              <button
                type="button"
                disabled={isBusy}
                onClick={() => restoreUser(u.id)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-transparent px-2.5 py-1.5 text-xs font-semibold text-emerald-200/90 transition hover:border-emerald-500/25 hover:bg-emerald-500/[0.08] disabled:opacity-40"
              >
                {isBusy ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
                ) : (
                  <RotateCcw className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
                )}
                Restore
              </button>
            </div>
          );
        },
        enableSorting: false,
      },
    ],
    [listView, busyId, myId]
  );

  const table = useReactTable({
    data: rows,
    columns,
    state: { sorting, pagination },
    onSortingChange: (updater) => {
      setSorting((prev) => {
        const next = typeof updater === 'function' ? updater(prev) : updater;
        if (!next.length) {
          return listView === 'archived'
            ? [{ id: 'deletedAt', desc: true }]
            : [{ id: 'createdAt', desc: true }];
        }
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
          <h1 className="text-xl font-semibold tracking-tight text-brand-heading sm:text-2xl">Users</h1>
          <p className="mt-1 max-w-2xl text-sm text-brand-muted">
            Operators and members (super admin accounts are not listed). Archive removes access until restored.
          </p>
        </div>
        <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex rounded-xl border border-brand-border-muted bg-black/30 p-0.5">
            <button
              type="button"
              onClick={() => setListView('active')}
              className={cn(
                'rounded-lg px-4 py-2 text-xs font-semibold uppercase tracking-[0.08em] transition',
                listView === 'active'
                  ? 'bg-[var(--brand-accent-soft)] text-brand-heading shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)]'
                  : 'text-brand-muted hover:text-brand-heading'
              )}
            >
              Active
            </button>
            <button
              type="button"
              onClick={() => setListView('archived')}
              className={cn(
                'rounded-lg px-4 py-2 text-xs font-semibold uppercase tracking-[0.08em] transition',
                listView === 'archived'
                  ? 'bg-[var(--brand-accent-soft)] text-brand-heading shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)]'
                  : 'text-brand-muted hover:text-brand-heading'
              )}
            >
              Archived
            </button>
          </div>
          <div className="relative flex-1 sm:max-w-sm">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-subtle"
              strokeWidth={2}
              aria-hidden
            />
            <input
              type="search"
              placeholder="Search email or name…"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full rounded-xl border border-brand-border-muted bg-black/30 py-2.5 pl-10 pr-4 text-sm text-brand-heading placeholder:text-brand-subtle/80 focus:border-brand-accent/35 focus:outline-none focus:ring-2 focus:ring-brand-accent/25"
              autoComplete="off"
            />
          </div>
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
          <div className="flex min-h-[320px] items-center justify-center py-16">
            <Loader2 className="h-9 w-9 animate-spin text-brand-accent/80" strokeWidth={1.5} aria-hidden />
          </div>
        ) : (
          <>
            <div className="relative overflow-x-auto">
              <table className="w-full min-w-[860px] border-collapse text-left text-sm">
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
                              header.column.id === 'email' && 'pl-5',
                              header.column.id === 'actions' && 'w-[120px] pr-5 text-right',
                              canSort && 'cursor-pointer select-none hover:text-brand-heading'
                            )}
                            onClick={
                              canSort
                                ? header.column.getToggleSortingHandler()
                                : undefined
                            }
                          >
                            <span
                              className={cn(
                                'inline-flex items-center',
                                header.column.id === 'actions' && 'w-full justify-end'
                              )}
                            >
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
                        {listView === 'archived'
                          ? 'No archived accounts.'
                          : 'No users match your search.'}
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
                              cell.column.id === 'email' && 'pl-5',
                              cell.column.id === 'actions' && 'pr-5 text-right'
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
                <span className="font-medium text-brand-subtle">{total.toLocaleString()}</span> total
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
