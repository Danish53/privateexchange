'use client';

import {
  Coins,
  Shield,
  Zap,
  Settings2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';
import CreateTokenModal from '../tokenmodal/CreateTokenModal';
import { AdminStatsRowSkeleton } from '@/components/ui/content-skeletons';
import { formatNumberSmart } from '@/lib/numberFormat';
import { useWebsiteT } from '@/components/i18n/WebsiteLocaleProvider';

function StatChip({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-white/[0.08] bg-black/[0.28] px-4 py-3">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-white/[0.08] bg-gradient-to-b from-white/[0.06] to-black/40 text-brand-accent">
        <Icon className="h-[1.125rem] w-[1.125rem]" strokeWidth={2} aria-hidden />
      </span>
      <div>
        <p className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-brand-subtle">{label}</p>
        <p className="mt-0.5 text-sm font-semibold text-brand-heading">{value}</p>
      </div>
    </div>
  );
}

function TokenCardSkeleton() {
  return (
    <div className="animate-pulse rounded-2xl border border-white/[0.08] bg-black/[0.35] p-5">
      <div className="flex items-start gap-3">
        <div className="h-12 w-12 rounded-xl bg-white/10" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-32 rounded bg-white/10" />
          <div className="h-3 w-20 rounded bg-white/10" />
        </div>
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <div className="h-14 rounded-xl bg-white/10" />
        <div className="h-14 rounded-xl bg-white/10" />
        <div className="h-14 rounded-xl bg-white/10" />
        <div className="h-14 rounded-xl bg-white/10" />
      </div>
      <div className="mt-4 flex gap-2">
        <div className="h-6 w-16 rounded bg-white/10" />
        <div className="h-6 w-16 rounded bg-white/10" />
        <div className="h-6 w-16 rounded bg-white/10" />
      </div>
      <div className="mt-5 flex gap-2">
        <div className="h-8 w-24 rounded-xl bg-white/10" />
        <div className="h-8 w-24 rounded-xl bg-white/10" />
      </div>
    </div>
  );
}

export default function SuperAdminTokensPage() {
  const { t } = useWebsiteT();
  const [tokens, setTokens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editToken, setEditToken] = useState(null);
  const [deleteModal, setDeleteModal] = useState({
    open: false,
    tokenId: null,
  });

  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    const fetchTokens = async () => {
      try {
        const res = await fetch("/api/superadmin/tokens");
        const data = await res.json();

        if (data.success) {
          setTokens(data.data);
        }
      } catch (err) {
        console.error("Token fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchTokens();
  }, []);

  const statusLabel = (isActive) =>
    isActive ? t('superadmin.tokens.active') : t('superadmin.tokens.inactive');

  if (loading) {
    return (
      <div className="space-y-8">
        <AdminStatsRowSkeleton cards={4} />
        <div className="grid gap-4 lg:grid-cols-2">
          {[...Array(4)].map((_, i) => (
            <TokenCardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  const handleDelete = async () => {
    if (!deleteModal.tokenId) return;

    setDeleteLoading(true);

    try {
      const res = await fetch(`/api/superadmin/tokens/${deleteModal.tokenId}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (data.success) {
        setTokens((prev) =>
          prev.filter((t) => t._id !== deleteModal.tokenId)
        );

        setDeleteModal({ open: false, tokenId: null });
      }
    } catch (err) {
      console.error("Delete error:", err);
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleCreateClick = () => {
    setEditToken(null);
  };

  return (
    <div className="space-y-8">
      <div className="border-b border-white/[0.06] pb-6">
        <h1 className="text-xl font-semibold tracking-tight text-brand-heading sm:text-2xl">
          {t('superadmin.tokens.title')}
        </h1>
        <p className="mt-1 max-w-3xl text-sm text-brand-muted">{t('superadmin.tokens.subtitle')}</p>
      </div>

      <CreateTokenModal
        editToken={editToken}
        onCreateClick={handleCreateClick}
        onCreated={(newToken) => {
          setTokens((prev) => [...prev, newToken]);
        }}
        onUpdated={(updatedToken) => {
          setTokens((prev) =>
            prev.map((tok) =>
              tok._id === updatedToken._id ? updatedToken : tok
            )
          );
          setEditToken(null);
        }}
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatChip icon={Coins} label={t('superadmin.tokens.stats.ecosystemTokens')} value={t('superadmin.tokens.stats.ecosystemConfigured')} />
        <StatChip icon={Shield} label={t('superadmin.tokens.stats.compliance')} value={t('superadmin.tokens.stats.complianceValue')} />
        <StatChip icon={Zap} label={t('superadmin.tokens.stats.transferEngine')} value={t('superadmin.tokens.stats.transferEngineValue')} />
        <StatChip icon={Settings2} label={t('superadmin.tokens.stats.adminEdits')} value={t('superadmin.tokens.stats.adminEditsValue')} />
      </div>

      <div>
        <div className="grid gap-4 lg:grid-cols-2">
          {tokens.filter((tok) => tok.slug !== "usd").map((tok) => (
            <div
              key={tok._id || tok.slug}
              className={cn(
                'relative overflow-hidden rounded-2xl border bg-gradient-to-b from-black/[0.45] to-[#07080c] p-5 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)]'
              )}
            >
              <div
                className="pointer-events-none absolute inset-0 bg-gradient-to-br opacity-90"
                aria-hidden
              />

              <div className="relative flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex min-w-0 items-start gap-3">
                  <span
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-black/40 font-bold tabular-nums text-brand-heading shadow-inner"
                  >
                    {tok.symbol}
                  </span>

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-semibold tracking-tight text-brand-heading">
                        {tok.name}
                      </h3>

                      <span className="rounded-md border px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-[0.08em] text-brand-subtle bg-white/5 border-white/10">
                        {tok.slug}
                      </span>
                    </div>

                    <p className="mt-1 text-sm text-brand-muted">
                      {t('superadmin.tokens.ecosystemToken')}
                    </p>
                  </div>
                </div>

                <span
                  className={cn(
                    'inline-flex h-2.5 w-2.5 shrink-0 rounded-full ring-2 ring-white/10 sm:mt-2',
                    tok.isActive ? 'bg-emerald-500' : 'bg-red-500'
                  )}
                  title={statusLabel(tok.isActive)}
                />
              </div>

              <dl className="relative mt-5 grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-white/[0.06] bg-black/35 px-3 py-2.5">
                  <dt className="text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-brand-subtle">
                    {t('superadmin.tokens.usdPerToken')}
                  </dt>
                  <dd className="mt-1 font-mono text-sm tabular-nums text-brand-heading">
                    ${formatNumberSmart(parseFloat(tok.usdPerUnit || 0), { maxFractionDigits: 2 })}
                  </dd>
                </div>

                <div className="rounded-xl border border-white/[0.06] bg-black/35 px-3 py-2.5">
                  <dt className="text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-brand-subtle">
                    {t('superadmin.tokens.totalTokens')}
                  </dt>
                  <dd className="mt-1 font-mono text-sm tabular-nums text-brand-heading">
                    {tok.usdPerUnit && tok.usdPerUnit > 0 ? Math.round(1 / tok.usdPerUnit) : 0}
                  </dd>
                </div>

                <div className="rounded-xl border border-white/[0.06] bg-black/35 px-3 py-2.5">
                  <dt className="text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-brand-subtle">
                    {t('superadmin.tokens.sortOrder')}
                  </dt>
                  <dd className="mt-1 text-sm text-brand-muted">
                    {tok.sortOrder ?? 0}
                  </dd>
                </div>

                <div className="rounded-xl border border-white/[0.06] bg-black/35 px-3 py-2.5">
                  <dt className="text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-brand-subtle">
                    {t('superadmin.tokens.status')}
                  </dt>
                  <dd className="mt-1 text-sm text-brand-muted">
                    {statusLabel(tok.isActive)}
                  </dd>
                </div>
              </dl>

              <div className="relative mt-4 flex flex-wrap gap-2">
                <span className="rounded-lg border border-white/[0.08] bg-white/[0.04] px-2.5 py-1 text-[0.65rem] font-medium text-brand-subtle">
                  {t('superadmin.tokens.symbolTag', { symbol: tok.symbol })}
                </span>

                <span className="rounded-lg border border-white/[0.08] bg-white/[0.04] px-2.5 py-1 text-[0.65rem] font-medium text-brand-subtle">
                  {t('superadmin.tokens.slugTag', { slug: tok.slug })}
                </span>

                <span className="rounded-lg border border-white/[0.08] bg-white/[0.04] px-2.5 py-1 text-[0.65rem] font-medium text-brand-subtle">
                  {t('superadmin.tokens.statusTag', { status: statusLabel(tok.isActive) })}
                </span>
              </div>

              <div className="relative mt-5 flex flex-wrap gap-2 border-t border-white/[0.06] pt-4">
                <button
                  onClick={() => setEditToken(tok)}
                  className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-brand-heading hover:bg-white/10"
                >
                  {t('superadmin.tokens.editToken')}
                </button>

                <button
                  type="button"
                  className="rounded-xl border border-white/10 bg-red-500 px-4 py-2 text-xs font-semibold text-brand-heading hover:bg-red-600"
                  onClick={() => setDeleteModal({ open: true, tokenId: tok._id })}
                >
                  {t('superadmin.tokens.deleteToken')}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {deleteModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0b0c10] p-6 shadow-xl">
            <h2 className="text-lg font-semibold text-white">
              {t('superadmin.tokens.confirmDeleteTitle')}
            </h2>

            <p className="mt-2 text-sm text-white/60">
              {t('superadmin.tokens.confirmDeleteBody')}
            </p>

            <div className="mt-6 flex justify-end gap-3">
              <button
                disabled={deleteLoading}
                onClick={() => setDeleteModal({ open: false, tokenId: null })}
                className="rounded-lg border border-white/10 px-4 py-2 text-sm text-white/70 hover:bg-white/5"
              >
                {t('superadmin.common.cancel')}
              </button>

              <button
                onClick={handleDelete}
                disabled={deleteLoading}
                className="flex items-center justify-center gap-2 rounded-lg bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-600 disabled:opacity-60"
              >
                {deleteLoading && (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                )}
                {deleteLoading ? t('superadmin.tokens.deleting') : t('superadmin.common.delete')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
