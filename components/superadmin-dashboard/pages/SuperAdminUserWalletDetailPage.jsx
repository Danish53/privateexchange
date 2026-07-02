'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, Wallet, ShieldCheck, ShieldAlert } from 'lucide-react';
import { useAuth } from '@/components/auth-context';
import { useWebsiteT } from '@/components/i18n/WebsiteLocaleProvider';
import { cn } from '@/lib/utils';
import { AdminMemberWalletSkeleton, TokenBalanceCardsSkeleton } from '@/components/ui/content-skeletons';
import { PLATFORM_TOKEN_SEED } from '@/lib/tokenCatalog';
import { mergeAdminPermissions, hasAnyWalletsPermission } from '@/lib/adminPermissions';
import { avatarSrc } from '@/lib/avatarUrl';
import { emailInitials } from '@/components/user-dashboard/utils';
import FeedbackMessage from '@/components/ui/FeedbackMessage';

function tokenBalanceFromRow(row, symbolUpper) {
  const sym = String(symbolUpper).toUpperCase();
  const t = row?.tokens?.find((x) => String(x.symbol).toUpperCase() === sym);
  return t?.balance ?? '—';
}

export default function SuperAdminUserWalletDetailPage() {
  const { t } = useWebsiteT();
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
        setError(json.error || t('superadmin.userWalletDetail.couldNotLoad'));
        return;
      }
      setPayload(json);
    } catch {
      setError(t('superadmin.common.networkError'));
    } finally {
      setLoading(false);
    }
  }, [token, userId, t]);

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
      <FeedbackMessage
        tone="error"
        title={t('superadmin.userWalletDetail.invalidRequestTitle')}
        message={t('superadmin.userWalletDetail.missingUserId')}
      />
    );
  }

  if (!canViewWallets) {
    return (
      <FeedbackMessage
        tone="info"
        title={t('superadmin.userWalletDetail.accessRequiredTitle')}
        message={t('superadmin.userWalletDetail.noPermission')}
      />
    );
  }

  const w = payload?.wallet;
  const nonMember = payload?.memberWallet === false;
  const roleLabel =
    payload?.role === 'admin'
      ? t('superadmin.common.roleAdmin')
      : payload?.role === 'user'
        ? t('superadmin.common.roleUser')
        : payload?.role || '—';

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 border-b border-white/[0.06] pb-6">
        <Link
          href="/dashboard/superadmin/users"
          className="inline-flex w-fit items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-brand-accent hover:underline"
        >
          <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
          {t('superadmin.userWalletDetail.backToUsers')}
        </Link>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-brand-heading sm:text-2xl">
              {t('superadmin.userWalletDetail.title')}
            </h1>
            <p className="mt-1 text-sm text-brand-muted">{t('superadmin.userWalletDetail.subtitle')}</p>
          </div>
          {w && !nonMember && canAdjustWallets ? (
            <Link
              href={`/dashboard/superadmin/wallets/${encodeURIComponent(userId)}`}
              className="btn-primary inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold"
            >
              <Wallet className="h-4 w-4" strokeWidth={2} aria-hidden />
              {t('superadmin.userWalletDetail.manageBalances')}
            </Link>
          ) : null}
        </div>
      </div>

      {loading ? (
        <AdminMemberWalletSkeleton tokenCount={5} />
      ) : error ? (
        <FeedbackMessage
          tone="error"
          title={t('superadmin.userWalletDetail.walletErrorTitle')}
          message={error}
        />
      ) : nonMember ? (
        <div className="space-y-4 rounded-2xl border border-white/[0.08] bg-black/[0.25] p-6">
          {payload?.archived ? (
            <p className="text-sm text-brand-muted">
              {t('superadmin.userWalletDetail.archivedIntro')}{' '}
              <strong className="text-brand-heading">{t('superadmin.userWalletDetail.archivedStrong')}</strong>
              {t('superadmin.userWalletDetail.archivedOutro')}
            </p>
          ) : (
            <p className="text-sm text-brand-muted">
              <strong className="text-brand-heading">{t('superadmin.userWalletDetail.adminStrong')}</strong>{' '}
              {t('superadmin.userWalletDetail.adminNoWalletIntro')}{' '}
              <strong>{t('superadmin.userWalletDetail.userStrong')}</strong>.
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
                {t('superadmin.userWalletDetail.roleLabel', { role: roleLabel })}
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
                      {t('superadmin.wallets.kycVerified')}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-200/80">
                      <ShieldAlert className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
                      {t('superadmin.userWalletDetail.emailPending')}
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
                {t('superadmin.userWalletDetail.totalUsd')}
              </p>
              <p className="mt-1 text-2xl font-semibold tabular-nums text-brand-heading">{w.balanceDisplay}</p>
            </div>
          </div>

          <div>
            <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-brand-subtle">
              {t('superadmin.userWalletDetail.tokenBalances')}
            </h2>
            {loadingActiveTokens ? (
              <TokenBalanceCardsSkeleton count={5} className="mt-3" />
            ) : (
              <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                {activeTokens.filter((tok) => tok.slug !== 'usd').map((tok) => {
                  const sym = String(tok.symbol).toUpperCase();
                  const bal = tokenBalanceFromRow(w, sym);
                  return (
                    <div
                      key={tok.slug || tok._id}
                      className="relative overflow-hidden rounded-xl border border-white/[0.08] bg-black/30 p-4 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)]"
                    >
                      <p className="pl-2 text-[0.65rem] font-semibold uppercase tracking-wide text-brand-subtle">
                        {tok.symbol}
                      </p>
                      <p className="pl-2 mt-0.5 text-xs text-brand-muted">{tok.name}</p>
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
              {t('superadmin.userWalletDetail.region', { country: w.country })}
            </p>
          ) : null}
        </div>
      ) : (
        <div className="rounded-xl border border-white/[0.08] px-4 py-3 text-sm text-brand-muted">
          {t('superadmin.userWalletDetail.noWalletData')}
        </div>
      )}
    </div>
  );
}
