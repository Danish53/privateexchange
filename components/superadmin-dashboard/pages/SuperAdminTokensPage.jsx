'use client';

import {
  Coins,
  Info,
  Layers,
  Scale,
  Shield,
  Zap,
  ArrowRightLeft,
  Wallet,
  Settings2,
  Plus,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';
import CreateTokenModal from '../tokenmodal/CreateTokenModal';


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

      {/* HEADER */}
      <div className="flex items-start gap-3">
        <div className="h-12 w-12 rounded-xl bg-white/10" />

        <div className="flex-1 space-y-2">
          <div className="h-4 w-32 rounded bg-white/10" />
          <div className="h-3 w-20 rounded bg-white/10" />
        </div>
      </div>

      {/* GRID */}
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <div className="h-14 rounded-xl bg-white/10" />
        <div className="h-14 rounded-xl bg-white/10" />
        <div className="h-14 rounded-xl bg-white/10" />
        <div className="h-14 rounded-xl bg-white/10" />
      </div>

      {/* TAGS */}
      <div className="mt-4 flex gap-2">
        <div className="h-6 w-16 rounded bg-white/10" />
        <div className="h-6 w-16 rounded bg-white/10" />
        <div className="h-6 w-16 rounded bg-white/10" />
      </div>

      {/* BUTTONS */}
      <div className="mt-5 flex gap-2">
        <div className="h-8 w-24 rounded-xl bg-white/10" />
        <div className="h-8 w-24 rounded-xl bg-white/10" />
      </div>
    </div>
  );
}

export default function SuperAdminTokensPage() {
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

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-20 animate-pulse rounded-xl bg-white/10" />
          ))}
        </div>

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
        <h1 className="text-xl font-semibold tracking-tight text-brand-heading sm:text-2xl">Settings</h1>
        <p className="mt-1 max-w-3xl text-sm text-brand-muted">
          Global platform configuration and operational toggles.
        </p>
      </div>

      {/* <div className="relative overflow-hidden rounded-2xl border border-brand-accent/15 bg-gradient-to-br from-[var(--brand-accent-soft)]/22 via-black/20 to-[#060708] p-5 sm:p-6">
        <div className="flex gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-brand-accent/25 bg-black/30 text-brand-accent">
            <Info className="h-5 w-5" strokeWidth={2} aria-hidden />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-brand-heading">Design scope (requirements)</p>
            <p className="mt-1 text-sm leading-relaxed text-brand-muted">
              <strong className="font-medium text-brand-subtle">Token engine</strong> will support multi-token
              balances, internal value mapping, and rule-based usage. This screen is the control surface for{' '}
              <strong className="font-medium text-brand-subtle">create / edit</strong> token metadata, optional
              reference values, and per-token policies—without implying equity or profit distribution.
            </p>
          </div>
        </div>
      </div> */}


      {/* create token? */}

      <CreateTokenModal
        editToken={editToken}
        onCreateClick={handleCreateClick}
        onCreated={(newToken) => {
          setTokens((prev) => [...prev, newToken]);
        }}
        onUpdated={(updatedToken) => {
          setTokens((prev) =>
            prev.map((t) =>
              t._id === updatedToken._id ? updatedToken : t
            )
          );
          setEditToken(null);
        }}
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatChip icon={Coins} label="Ecosystem tokens" value="5 configured" />
        <StatChip icon={Shield} label="Compliance" value="Utility framing" />
        <StatChip icon={Zap} label="Transfer engine" value="Fee + VIP hooks" />
        <StatChip icon={Settings2} label="Admin edits" value="Audit-friendly" />
      </div>

      <div>

        <div className="grid gap-4 lg:grid-cols-2">
          {tokens.filter((t) => t.slug !== "usd").map((t, index) => (
            <div
              key={t._id || t.slug}
              className={cn(
                'relative overflow-hidden rounded-2xl border bg-gradient-to-b from-black/[0.45] to-[#07080c] p-5 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)]'
              )}
            >
              {/* Background gradient (dynamic optional) */}
              <div
                className="pointer-events-none absolute inset-0 bg-gradient-to-br opacity-90"
                aria-hidden
              />

              {/* Header */}
              <div className="relative flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex min-w-0 items-start gap-3">

                  {/* SYMBOL BOX */}
                  <span
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-black/40 font-bold tabular-nums text-brand-heading shadow-inner"
                  >
                    {t.symbol}
                  </span>

                  {/* NAME + SLUG */}
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-semibold tracking-tight text-brand-heading">
                        {t.name}
                      </h3>

                      <span className="rounded-md border px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-[0.08em] text-brand-subtle bg-white/5 border-white/10">
                        {t.slug}
                      </span>
                    </div>

                    <p className="mt-1 text-sm text-brand-muted">
                      Ecosystem Token
                    </p>
                  </div>
                </div>

                {/* STATUS DOT (active/inactive) */}
                <span
                  className={cn(
                    'inline-flex h-2.5 w-2.5 shrink-0 rounded-full ring-2 ring-white/10 sm:mt-2',
                    t.isActive ? 'bg-emerald-500' : 'bg-red-500'
                  )}
                  title={t.isActive ? "Active" : "Inactive"}
                />
              </div>

              {/* DETAILS GRID */}
              <dl className="relative mt-5 grid gap-3 sm:grid-cols-2">

                <div className="rounded-xl border border-white/[0.06] bg-black/35 px-3 py-2.5">
                  <dt className="text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-brand-subtle">
                    USD Per Token
                  </dt>
                  <dd className="mt-1 font-mono text-sm tabular-nums text-brand-heading">
                    ${parseFloat(t.usdPerUnit || 0).toFixed(4)}
                  </dd>
                </div>

                <div className="rounded-xl border border-white/[0.06] bg-black/35 px-3 py-2.5">
                  <dt className="text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-brand-subtle">
                    Total Tokens
                  </dt>
                  <dd className="mt-1 font-mono text-sm tabular-nums text-brand-heading">
                    {t.usdPerUnit && t.usdPerUnit > 0 ? Math.round(1 / t.usdPerUnit) : 0}
                  </dd>
                </div>

                <div className="rounded-xl border border-white/[0.06] bg-black/35 px-3 py-2.5">
                  <dt className="text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-brand-subtle">
                    Sort Order
                  </dt>
                  <dd className="mt-1 text-sm text-brand-muted">
                    {t.sortOrder ?? 0}
                  </dd>
                </div>

                <div className="rounded-xl border border-white/[0.06] bg-black/35 px-3 py-2.5">
                  <dt className="text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-brand-subtle">
                    Status
                  </dt>
                  <dd className="mt-1 text-sm text-brand-muted">
                    {t.isActive ? "Active" : "Inactive"}
                  </dd>
                </div>
              </dl>

              {/* TAGS */}
              <div className="relative mt-4 flex flex-wrap gap-2">
                <span className="rounded-lg border border-white/[0.08] bg-white/[0.04] px-2.5 py-1 text-[0.65rem] font-medium text-brand-subtle">
                  Symbol: {t.symbol}
                </span>

                <span className="rounded-lg border border-white/[0.08] bg-white/[0.04] px-2.5 py-1 text-[0.65rem] font-medium text-brand-subtle">
                  Slug: {t.slug}
                </span>

                <span className="rounded-lg border border-white/[0.08] bg-white/[0.04] px-2.5 py-1 text-[0.65rem] font-medium text-brand-subtle">
                  Status: {t.isActive ? "Active" : "Inactive"}
                </span>
              </div>

              {/* ACTIONS */}
              <div className="relative mt-5 flex flex-wrap gap-2 border-t border-white/[0.06] pt-4">
                <button
                  onClick={() => setEditToken(t)}
                  className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-brand-heading hover:bg-white/10"
                >
                  Edit token
                </button>

                <button
                  type="button"
                  className="rounded-xl border border-white/10 bg-red-500 px-4 py-2 text-xs font-semibold text-brand-heading hover:bg-red-600"
                  onClick={() => setDeleteModal({ open: true, tokenId: t._id })}
                >
                  Delete token
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* <div className="rounded-2xl border border-white/[0.08] bg-black/[0.22] p-5 sm:p-6">
        <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-brand-subtle">
          Rule categories (per proposal)
        </h2>
        <p className="mt-1 text-xs text-brand-muted">
          These rows map to backend modules later; visual structure only for now.
        </p>
        <ul className="mt-5 divide-y divide-white/[0.06] border border-white/[0.06] rounded-xl overflow-hidden">
          {RULE_ROWS.map((row) => (
            <li key={row.label} className="flex gap-4 bg-black/[0.2] px-4 py-4 sm:px-5">
              <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/[0.08] text-brand-accent">
                <row.icon className="h-4 w-4" strokeWidth={2} aria-hidden />
              </span>
              <div>
                <p className="text-sm font-semibold text-brand-heading">{row.label}</p>
                <p className="mt-1 text-sm leading-relaxed text-brand-muted">{row.detail}</p>
              </div>
            </li>
          ))}
        </ul>
      </div> */}
      {deleteModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">

          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0b0c10] p-6 shadow-xl">

            {/* HEADER */}
            <h2 className="text-lg font-semibold text-white">
              Confirm Delete
            </h2>

            <p className="mt-2 text-sm text-white/60">
              Are you sure you want to delete this token? This action cannot be undone.
            </p>

            {/* ACTIONS */}
            <div className="mt-6 flex justify-end gap-3">

              <button
                disabled={deleteLoading}
                onClick={() => setDeleteModal({ open: false, tokenId: null })}
                className="rounded-lg border border-white/10 px-4 py-2 text-sm text-white/70 hover:bg-white/5"
              >
                Cancel
              </button>

              <button
                onClick={handleDelete}
                disabled={deleteLoading}
                className="flex items-center justify-center gap-2 rounded-lg bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-600 disabled:opacity-60"
              >
                {deleteLoading && (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                )}
                {deleteLoading ? "Deleting..." : "Delete"}
              </button>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}
