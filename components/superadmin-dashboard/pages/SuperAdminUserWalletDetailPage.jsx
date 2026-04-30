'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, Loader2, Wallet, ShieldCheck, ShieldAlert } from 'lucide-react';
import { useAuth } from '@/components/auth-context';
import { cn } from '@/lib/utils';
import { PLATFORM_TOKEN_SEED } from '@/lib/tokenCatalog';
import { mergeAdminPermissions, hasAnyWalletsPermission } from '@/lib/adminPermissions';
import { avatarSrc } from '@/lib/avatarUrl';
import { emailInitials } from '@/components/user-dashboard/utils';

function tokenBalanceFromRow(row, symbolUpper) {
  const sym = String(symbolUpper).toUpperCase();
  const t = row?.tokens?.find((x) => String(x.symbol).toUpperCase() === sym);
  return t?.balance ?? '—';
}

export default function SuperAdminUserWalletDetailPage() {
  const params = useParams();
  const userId = typeof params?.userId === 'string' ? params.userId : params?.userId?.[0] || '';
  const { token, ready, user } = useAuth();
  const canViewWallets = user?.role === 'superadmin' || hasAnyWalletsPermission(user);
  const canAdjustWallets =
    user?.role === 'superadmin' || mergeAdminPermissions(user?.adminPermissions).walletsAdjust;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [payload, setPayload] = useState(null);
  const [activeTokens, setActiveTokens] = useState([]);
  const [loadingActiveTokens, setLoadingActiveTokens] = useState(false);

  const load = useCallback(async () => {
    if (!token || !userId) return;
    setLoading(true);
    setError('');
    setPayload(null);
    try {
      const res = await fetch(`/api/superadmin/wallets?forUser=${encodeURIComponent(userId)}`, {
        cache: 'no-store',
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.ok) {
        setError(json.error || 'Could not load wallet.');
        return;
      }
      setPayload(json);
    } catch {
      setError('Network error.');
    } finally {
      setLoading(false);
    }
  }, [token, userId]);

  // Fetch active tokens from API
  useEffect(() => {
    const fetchActiveTokens = async () => {
      setLoadingActiveTokens(true);
      try {
        const res = await fetch('/api/superadmin/tokens');
        const data = await res.json();
        if (data.success && data.data.length > 0) {
          setActiveTokens(data.data);
        }
      } catch (err) {
        console.error('Failed to fetch active tokens:', err);
      } finally {
        setLoadingActiveTokens(false);
      }
    };
    fetchActiveTokens();
  }, []);

  useEffect(() => {
    if (!ready || !userId || !canViewWallets) return;
    void load();
  }, [ready, userId, load, canViewWallets]);

  if (!userId) {
    return (
      <div className="rounded-xl border border-red-500/25 bg-red-500/[0.08] px-4 py-3 text-sm text-red-200/95">
        Missing user id.
      </div>
    );
  }

  if (!canViewWallets) {
    return (
      <div className="rounded-xl border border-amber-500/25 bg-amber-500/[0.08] px-4 py-3 text-sm text-amber-100/95">
        You don&apos;t have permission to view wallets. Ask a super admin to grant wallet access.
      </div>
    );
  }

  const w = payload?.wallet;
  const nonMember = payload?.memberWallet === false;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 border-b border-white/[0.06] pb-6">
        <Link
          href="/dashboard/superadmin/users"
          className="inline-flex w-fit items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-brand-accent hover:underline"
        >
          <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
          Back to users
        </Link>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-brand-heading sm:text-2xl">
              Wallet & balances
            </h1>
            <p className="mt-1 text-sm text-brand-muted">
              Custodial token balances for this account (member wallets only).
            </p>
          </div>
          {w && !nonMember && canAdjustWallets ? (
            <Link
              href={`/dashboard/superadmin/wallets/${encodeURIComponent(userId)}`}
              className="btn-primary inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold"
            >
              <Wallet className="h-4 w-4" strokeWidth={2} aria-hidden />
              Manage balances
            </Link>
          ) : null}
        </div>
      </div>

      {loading ? (
        <div className="flex min-h-[240px] items-center justify-center py-16">
          <Loader2 className="h-9 w-9 animate-spin text-brand-accent/80" strokeWidth={1.5} aria-hidden />
        </div>
      ) : error ? (
        <div className="rounded-xl border border-red-500/25 bg-red-500/[0.08] px-4 py-3 text-sm text-red-200/95">
          {error}
        </div>
      ) : nonMember ? (
        <div className="space-y-4 rounded-2xl border border-white/[0.08] bg-black/[0.25] p-6">
          {payload?.archived ? (
            <p className="text-sm text-brand-muted">
              This account is <strong className="text-brand-heading">archived</strong>. Restore it under Users →
              Archived to use the wallet again.
            </p>
          ) : (
            <p className="text-sm text-brand-muted">
              <strong className="text-brand-heading">Administrator</strong> accounts don&apos;t have a member
              custodial wallet here. Member balances appear only for accounts with role <strong>User</strong>.
            </p>
          )}
          <div className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-black/30 px-4 py-3">
            <div className="relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/[0.1] bg-gradient-to-br from-[#2a2418] to-[#0f0e0c] text-[0.65rem] font-bold text-brand-accent">
              {payload?.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatarSrc(payload.avatarUrl)} alt="" className="h-full w-full object-cover" />
              ) : (
                emailInitials(payload?.email || '')
              )}
            </div>
            <div className="min-w-0">
              <p className="truncate font-medium text-brand-heading">{payload?.email}</p>
              {payload?.name ? <p className="truncate text-xs text-brand-muted">{payload.name}</p> : null}
              <p className="mt-1 text-[0.65rem] font-semibold uppercase tracking-wide text-brand-subtle">
                Role: {payload?.role === 'admin' ? 'Admin' : payload?.role || '—'}
              </p>
            </div>
          </div>
        </div>
      ) : w ? (
        <div className="space-y-6">
          <div className="flex flex-col gap-4 rounded-2xl border border-white/[0.08] bg-gradient-to-b from-black/[0.35] to-[#060708] p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
            <div className="flex items-center gap-4">
              <div className="relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/[0.1] bg-gradient-to-br from-[#2a2418] to-[#0f0e0c] text-sm font-bold text-brand-accent">
                {w.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={avatarSrc(w.avatarUrl)} alt="" className="h-full w-full object-cover" />
                ) : (
                  emailInitials(w.memberEmail)
                )}
              </div>
              <div className="min-w-0">
                <p className="truncate font-semibold text-brand-heading">{w.memberEmail}</p>
                {w.memberName ? (
                  <p className="truncate text-sm text-brand-muted">{w.memberName}</p>
                ) : null}
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  {w.emailVerified ? (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-300/95">
                      <ShieldCheck className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
                      Verified
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-200/80">
                      <ShieldAlert className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
                      Email pending
                    </span>
                  )}
                  <code className="rounded-md border border-white/[0.08] bg-black/40 px-2 py-0.5 text-[0.65rem] text-brand-subtle">
                    {w.walletId}
                  </code>
                </div>
              </div>
            </div>
            <div className="rounded-xl border border-brand-accent/20 bg-[var(--brand-accent-soft)]/15 px-4 py-3 text-right">
              <p className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-brand-subtle">
                Total (USD eq.)
              </p>
              <p className="mt-1 text-2xl font-semibold tabular-nums text-brand-heading">{w.balanceDisplay}</p>
            </div>
          </div>

          <div>
            <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-brand-subtle">Token balances</h2>
            {loadingActiveTokens ? (
              <div className="mt-3 flex min-h-[120px] items-center justify-center rounded-xl border border-white/[0.08] bg-black/25">
                <Loader2 className="h-6 w-6 animate-spin text-brand-accent/80" strokeWidth={1.5} aria-hidden />
              </div>
            ) : (
              <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                {(activeTokens.length > 0 ? activeTokens : PLATFORM_TOKEN_SEED).map((t) => {
                  const sym = String(t.symbol).toUpperCase();
                  const bal = tokenBalanceFromRow(w, sym);
                  return (
                    <div
                      key={t.slug || t._id}
                      className="relative overflow-hidden rounded-xl border border-white/[0.08] bg-black/30 p-4 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)]"
                    >
                      <span
                        className={cn(
                          'pointer-events-none absolute left-0 top-0 bottom-0 w-1 rounded-l-xl',
                          t.bar || 'bg-gray-500'
                        )}
                        aria-hidden
                      />
                      <p className="pl-2 text-[0.65rem] font-semibold uppercase tracking-wide text-brand-subtle">
                        {t.symbol}
                      </p>
                      <p className="pl-2 mt-0.5 text-xs text-brand-muted">{t.name}</p>
                      <p className="pl-2 mt-3 border-t border-white/[0.06] pt-2 font-mono text-lg font-semibold tabular-nums text-brand-heading">
                        {bal}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {w.country ? (
            <p className="text-xs text-brand-muted">
              Region: <span className="text-brand-heading">{w.country}</span>
            </p>
          ) : null}
        </div>
      ) : (
        <div className="rounded-xl border border-white/[0.08] px-4 py-3 text-sm text-brand-muted">
          No wallet data.
        </div>
      )}
    </div>
  );
}
