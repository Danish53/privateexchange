'use client';

import { useCallback, useEffect, useState } from 'react';
import { Check, X, Loader2, RefreshCw, AlertCircle } from 'lucide-react';
import { useAuth } from '@/components/auth-context';
import { cn } from '@/lib/utils';

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

function StatusBadge({ status }) {
  const map = {
    pending: { label: 'Pending', className: 'border-amber-500/35 bg-amber-500/[0.12] text-amber-100' },
    completed: { label: 'Completed', className: 'border-emerald-500/35 bg-emerald-500/[0.1] text-emerald-100' },
    cancelled: { label: 'Cancelled', className: 'border-rose-500/35 bg-rose-500/[0.1] text-rose-100' },
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

function PaymentMethodBadge({ method }) {
  const map = {
    paypal: { label: 'PayPal', className: 'border-blue-500/35 bg-blue-500/[0.1] text-blue-100' },
    crypto: { label: 'Crypto', className: 'border-purple-500/35 bg-purple-500/[0.1] text-purple-100' },
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

export default function SuperAdminDepositManagement() {
  const { token, ready } = useAuth();
  const [deposits, setDeposits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [processing, setProcessing] = useState({});

  const loadDeposits = useCallback(async () => {
    if (!token) {
      setLoading(false);
      return;
    }
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/superadmin/deposits?status=pending&limit=50', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(json.error || 'Could not load deposits.');
        setDeposits([]);
        return;
      }
      setDeposits(json.deposits || []);
    } catch {
      setError('Network error.');
      setDeposits([]);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (!ready) return;
    loadDeposits();
  }, [ready, loadDeposits]);

  const handleAction = async (depositId, action) => {
    if (!token) return;
    setProcessing((prev) => ({ ...prev, [depositId]: action }));
    try {
      const res = await fetch(`/api/superadmin/deposits/${depositId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ action }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(json.error || `Failed to ${action} deposit`);
      }
      // Remove from list
      setDeposits((prev) => prev.filter((d) => d.id !== depositId));
    } catch (err) {
      setError(err.message);
    } finally {
      setProcessing((prev) => ({ ...prev, [depositId]: undefined }));
    }
  };

  if (!ready) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-brand-accent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-brand-heading">Pending Deposits</h2>
          <p className="mt-1 text-sm text-brand-muted">
            Review and approve or reject deposit requests from users.
          </p>
        </div>
        <button
          onClick={loadDeposits}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-lg border border-brand-border-muted bg-[var(--brand-surface)] px-3 py-2 text-sm font-medium text-brand-heading transition hover:border-brand-accent/30 hover:bg-[var(--brand-surface)]/80 disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/[0.08] p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-rose-300" />
            <div>
              <p className="font-medium text-rose-100">Error loading deposits</p>
              <p className="mt-1 text-sm text-rose-200/80">{error}</p>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-brand-accent" />
        </div>
      ) : deposits.length === 0 ? (
        <div className="rounded-2xl border border-brand-border-muted bg-[var(--brand-surface)]/40 p-8 text-center">
          <div className="mx-auto max-w-sm">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-brand-border-muted bg-black/30">
              <Check className="h-6 w-6 text-brand-muted" />
            </div>
            <h3 className="mt-4 text-sm font-semibold text-brand-heading">No pending deposits</h3>
            <p className="mt-2 text-sm text-brand-muted">
              All deposit requests have been processed. New requests will appear here.
            </p>
          </div>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-brand-border-muted bg-[var(--brand-surface)]/40">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-brand-border-muted bg-black/20">
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-brand-subtle">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-brand-subtle">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-brand-subtle">
                    Token
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-brand-subtle">
                    Method
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-brand-subtle">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-brand-subtle">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-brand-subtle">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border-muted/50">
                {deposits.map((deposit) => (
                  <tr key={deposit.id} className="hover:bg-white/[0.02]">
                    <td className="px-6 py-4">
                      <div className="min-w-0 max-w-[200px]">
                        <p className="truncate text-sm font-medium text-brand-heading">
                          {deposit.user?.email || 'Unknown'}
                        </p>
                        {deposit.user?.firstName || deposit.user?.lastName ? (
                          <p className="truncate text-xs text-brand-muted">
                            {deposit.user.firstName} {deposit.user.lastName}
                          </p>
                        ) : null}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-mono text-sm font-semibold tabular-nums text-brand-heading">
                        {formatAmount(deposit.amount)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-mono text-xs font-semibold text-brand-accent">
                        {deposit.token}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <PaymentMethodBadge method={deposit.paymentMethod} />
                    </td>
                    <td className="px-6 py-4">
                      <span className="whitespace-nowrap text-xs text-brand-muted">
                        {formatDateTime(deposit.createdAt)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={deposit.status} />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleAction(deposit.id, 'approve')}
                          disabled={processing[deposit.id]}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/[0.12] px-3 py-1.5 text-xs font-semibold text-emerald-100 transition hover:border-emerald-500/50 hover:bg-emerald-500/[0.18] disabled:opacity-50"
                        >
                          {processing[deposit.id] === 'approve' ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <Check className="h-3 w-3" />
                          )}
                          Approve
                        </button>
                        <button
                          onClick={() => handleAction(deposit.id, 'cancel')}
                          disabled={processing[deposit.id]}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-rose-500/30 bg-rose-500/[0.12] px-3 py-1.5 text-xs font-semibold text-rose-100 transition hover:border-rose-500/50 hover:bg-rose-500/[0.18] disabled:opacity-50"
                        >
                          {processing[deposit.id] === 'cancel' ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <X className="h-3 w-3" />
                          )}
                          Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}