'use client';

import { useCallback, useEffect, useState } from 'react';
import { Check, X, Loader2, RefreshCw, AlertCircle } from 'lucide-react';
import { useAuth } from '@/components/auth-context';
import { cn } from '@/lib/utils';
import { DepositRequestsTableSkeleton } from '@/components/ui/content-skeletons';
import { formatNumberSmart } from '@/lib/numberFormat';
import DepositApproveModal from '@/components/superadmin-dashboard/DepositApproveModal';
import DepositRejectModal from '@/components/superadmin-dashboard/DepositRejectModal';
import { getCryptoDepositTokenLabel } from '@/lib/cryptoDepositConfig';


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
  return formatNumberSmart(n, { maxFractionDigits: 8 });
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
    crypto: { label: 'Crypto', className: 'border-amber-500/35 bg-amber-500/[0.1] text-amber-100' },
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

function getAdminDepositTokenLabel(deposit) {
  if (deposit.paymentMethod === 'crypto' && deposit.payCurrency) {
    return getCryptoDepositTokenLabel(deposit.payCurrency) || deposit.token;
  }
  return deposit.token;
}

export default function SuperAdminDepositManagement() {
  const { token, ready } = useAuth();
  const [deposits, setDeposits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [processing, setProcessing] = useState({});

  const [approveTarget, setApproveTarget] = useState(null);
  const [activeTokens, setActiveTokens] = useState([]);
  const [loadingTokens, setLoadingTokens] = useState(false);
  const [creditToken, setCreditToken] = useState('');
  const [creditAmount, setCreditAmount] = useState('');
  const [modalError, setModalError] = useState('');
  const [approveSaving, setApproveSaving] = useState(false);

  const [rejectTarget, setRejectTarget] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [rejectModalError, setRejectModalError] = useState('');
  const [rejectSaving, setRejectSaving] = useState(false);

  const loadDeposits = useCallback(async () => {
    if (!token) {
      setLoading(false);
      return;
    }
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/superadmin/deposits?pendingReview=true&limit=50', {
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

  const loadTokens = useCallback(async () => {
    setLoadingTokens(true);
    try {
      const res = await fetch('/api/superadmin/tokens');
      const json = await res.json().catch(() => ({}));
      if (json.success && Array.isArray(json.data)) {
        setActiveTokens(json.data);
      } else {
        setActiveTokens([]);
      }
    } catch {
      setActiveTokens([]);
    } finally {
      setLoadingTokens(false);
    }
  }, []);

  useEffect(() => {
    if (!ready) return;
    loadDeposits();
    loadTokens();
  }, [ready, loadDeposits, loadTokens]);

  const openApproveModal = (deposit) => {
    setApproveTarget(deposit);
    setModalError('');
    const usd = activeTokens.find((t) => String(t.symbol).toUpperCase() === 'USD');
    const defaultSym = usd
      ? 'USD'
      : String(deposit.token || activeTokens[0]?.symbol || 'USD').toUpperCase();
    setCreditToken(defaultSym);
    setCreditAmount(
      deposit.amount != null && !Number.isNaN(Number(deposit.amount))
        ? String(deposit.amount)
        : ''
    );
  };

  const closeApproveModal = () => {
    if (approveSaving) return;
    setApproveTarget(null);
    setModalError('');
    setCreditToken('');
    setCreditAmount('');
  };

  const openRejectModal = (deposit) => {
    setRejectTarget(deposit);
    setRejectionReason('');
    setRejectModalError('');
  };

  const closeRejectModal = () => {
    if (rejectSaving) return;
    setRejectTarget(null);
    setRejectionReason('');
    setRejectModalError('');
  };

  const handleConfirmReject = async () => {
    if (!token || !rejectTarget) return;
    const reason = rejectionReason.trim();
    if (!reason) {
      setRejectModalError('Please enter a rejection reason.');
      return;
    }

    setRejectModalError('');
    setRejectSaving(true);
    const depositId = rejectTarget.id;
    setProcessing((prev) => ({ ...prev, [depositId]: 'cancel' }));

    try {
      const res = await fetch(`/api/superadmin/deposits/${depositId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ action: 'cancel', rejectionReason: reason }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(json.error || 'Failed to reject deposit');
      }
      setDeposits((prev) => prev.filter((d) => d.id !== depositId));
      closeRejectModal();
    } catch (err) {
      setRejectModalError(err.message);
    } finally {
      setRejectSaving(false);
      setProcessing((prev) => ({ ...prev, [depositId]: undefined }));
    }
  };

  const handleConfirmApprove = async () => {
    if (!token || !approveTarget) return;
    const amt = Number(String(creditAmount).replace(/,/g, ''));
    if (!creditToken) {
      setModalError('Select a token to credit.');
      return;
    }
    if (!Number.isFinite(amt) || amt <= 0) {
      setModalError('Enter a valid positive amount.');
      return;
    }

    setModalError('');
    setApproveSaving(true);
    const depositId = approveTarget.id;

    try {
      const res = await fetch(`/api/superadmin/deposits/${depositId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          action: 'approve',
          creditToken,
          creditAmount: amt,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(json.error || 'Failed to approve deposit');
      }
      setDeposits((prev) => prev.filter((d) => d.id !== depositId));
      closeApproveModal();
    } catch (err) {
      setModalError(err.message);
    } finally {
      setApproveSaving(false);
    }
  };

  if (!ready) {
    return (
      <div className="space-y-6 py-2">
        <div className="h-8 w-48 animate-pulse rounded-lg bg-white/[0.06]" aria-hidden />
        <DepositRequestsTableSkeleton rows={5} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-brand-heading">Pending Deposits</h2>
          <p className="mt-1 text-sm text-brand-muted">
            Review PayPal and manual crypto deposit requests from users.
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
              <p className="font-medium text-rose-100">Error</p>
              <p className="mt-1 text-sm text-rose-200/80">{error}</p>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <DepositRequestsTableSkeleton rows={6} />
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
                    Proof
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
              <tbody className="">
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
                        {getAdminDepositTokenLabel(deposit)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <PaymentMethodBadge method={deposit.paymentMethod} />
                    </td>
                    <td className="px-6 py-4">
                      <div className="max-w-[220px] space-y-1 text-xs">
                        {deposit.transactionHash ? (
                          <p className="truncate font-mono text-brand-muted" title={deposit.transactionHash}>
                            TX: {deposit.transactionHash}
                          </p>
                        ) : null}
                        {deposit.proofImageUrl ? (
                          <a
                            href={deposit.proofImageUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-brand-accent hover:underline"
                          >
                            View screenshot
                          </a>
                        ) : (
                          !deposit.transactionHash && (
                            <span className="text-brand-subtle">—</span>
                          )
                        )}
                      </div>
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
                          onClick={() => openApproveModal(deposit)}
                          disabled={processing[deposit.id] || approveSaving || rejectSaving}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/[0.12] px-3 py-1.5 text-xs font-semibold text-emerald-100 transition hover:border-emerald-500/50 hover:bg-emerald-500/[0.18] disabled:opacity-50"
                        >
                          <Check className="h-3 w-3" />
                          Approve
                        </button>
                        <button
                          onClick={() => openRejectModal(deposit)}
                          disabled={processing[deposit.id] || approveSaving || rejectSaving}
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

      {approveTarget ? (
        <DepositApproveModal
          deposit={approveTarget}
          tokens={activeTokens}
          loadingTokens={loadingTokens}
          creditToken={creditToken}
          setCreditToken={setCreditToken}
          creditAmount={creditAmount}
          setCreditAmount={setCreditAmount}
          modalError={modalError}
          saving={approveSaving}
          onClose={closeApproveModal}
          onConfirm={handleConfirmApprove}
        />
      ) : null}

      {rejectTarget ? (
        <DepositRejectModal
          deposit={rejectTarget}
          rejectionReason={rejectionReason}
          setRejectionReason={setRejectionReason}
          modalError={rejectModalError}
          saving={rejectSaving}
          onClose={closeRejectModal}
          onConfirm={handleConfirmReject}
        />
      ) : null}
    </div>
  );
}
