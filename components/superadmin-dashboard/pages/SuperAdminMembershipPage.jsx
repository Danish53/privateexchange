'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { CheckCircle2, Crown, Pencil, Plus, Shield, Sparkles, Trash2 } from 'lucide-react';
import { useAuth } from '@/components/auth-context';
import { formatCurrencySmart } from '@/lib/numberFormat';
import { cn } from '@/lib/utils';
import MembershipTierFeatures from '@/components/membership/MembershipTierFeatures';
import FeedbackMessage from '@/components/ui/FeedbackMessage';

function StatChip({ icon: Icon, label, value, hint }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-white/[0.08] bg-black/[0.28] px-4 py-3 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)]">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-white/[0.08] bg-gradient-to-b from-white/[0.06] to-black/40 text-brand-accent">
        <Icon className="h-[1.125rem] w-[1.125rem]" strokeWidth={2} aria-hidden />
      </span>
      <div>
        <p className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-brand-subtle">{label}</p>
        <p className="mt-0.5 text-sm font-semibold tabular-nums text-brand-heading">{value}</p>
        {hint ? <p className="mt-0.5 text-[0.65rem] text-brand-muted">{hint}</p> : null}
      </div>
    </div>
  );
}

function TierCardSkeleton() {
  return (
    <div className="animate-pulse overflow-hidden rounded-2xl border border-white/[0.08] bg-black/[0.35]">
      <div className="p-5 sm:p-6">
        <div className="flex gap-4">
          <div className="h-14 w-14 shrink-0 rounded-2xl bg-white/10" />
          <div className="flex-1 space-y-2 pt-1">
            <div className="h-5 w-36 rounded-lg bg-white/10" />
            <div className="h-3 w-24 rounded bg-white/[0.07]" />
          </div>
        </div>
        <div className="mt-5 rounded-xl border border-white/[0.06] bg-white/[0.04] p-4">
          <div className="h-3 w-28 rounded bg-white/[0.07]" />
          <div className="mt-3 h-10 w-40 rounded-lg bg-white/10" />
        </div>
      </div>
      <div className="border-t border-white/[0.06] bg-black/25 px-5 py-4 sm:px-6">
        <div className="space-y-2.5">
          <div className="h-3.5 w-full rounded bg-white/[0.06]" />
          <div className="h-3.5 w-[88%] rounded bg-white/[0.06]" />
        </div>
      </div>
    </div>
  );
}

export default function SuperAdminMembershipPage() {
  const { token, ready } = useAuth();
  const [tiers, setTiers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  const loadTiers = useCallback(async () => {
    if (!ready || !token) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/superadmin/membership-tiers', {
        cache: 'no-store',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) {
        setError(data.error || 'Could not load membership tiers.');
        setTiers([]);
        return;
      }
      setTiers(Array.isArray(data.tiers) ? data.tiers : []);
    } catch {
      setError('Could not load membership tiers.');
      setTiers([]);
    } finally {
      setLoading(false);
    }
  }, [ready, token]);

  useEffect(() => {
    loadTiers();
  }, [loadTiers]);

  const confirmDelete = async () => {
    if (!deleteTarget?.id || !token) return;
    setDeleteBusy(true);
    setError('');
    try {
      const res = await fetch(`/api/superadmin/membership-tiers/${encodeURIComponent(deleteTarget.id)}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) {
        setError(data.error || 'Could not delete this tier.');
        return;
      }
      setDeleteTarget(null);
      await loadTiers();
    } catch {
      setError('Could not delete this tier.');
    } finally {
      setDeleteBusy(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="border-b border-white/[0.06] pb-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-brand-heading sm:text-2xl">Membership</h1>
            <p className="mt-1 max-w-2xl text-sm text-brand-muted">
              Define named tiers with a minimum balance in USD and the benefits users see. Tiers are ordered from
              lowest minimum upward.
            </p>
          </div>
          <Link
            href="/dashboard/superadmin/membership/new"
            className="btn-primary inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold"
          >
            <Plus className="h-4 w-4" strokeWidth={2} aria-hidden />
            Create membership
          </Link>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-2">
        <StatChip icon={Shield} label="Configured tiers" value={String(tiers.length)} hint="Published in this list" />
        {/* <StatChip
          icon={Crown}
          label="Benefit lines"
          value={String(benefitCount)}
          hint="Across all tiers"
        /> */}
        <StatChip
          icon={CheckCircle2}
          label="Currency"
          value="USD"
          hint="Minimum value per tier"
        />
      </div>

      <FeedbackMessage tone="error" message={error} />

      {deleteTarget ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" role="dialog" aria-modal="true" aria-labelledby="delete-tier-title">
          <div className="w-full max-w-md rounded-2xl border border-white/[0.1] bg-[#0b0c10] p-6 shadow-2xl">
            <h2 id="delete-tier-title" className="text-lg font-semibold text-brand-heading">
              Delete membership tier?
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-brand-muted">
              <span className="font-semibold text-brand-heading">{deleteTarget.name}</span> will be removed permanently.
              This cannot be undone.
            </p>
            <div className="mt-6 flex flex-wrap justify-end gap-2">
              <button
                type="button"
                disabled={deleteBusy}
                onClick={() => setDeleteTarget(null)}
                className="rounded-xl border border-white/[0.12] bg-black/30 px-4 py-2.5 text-sm font-semibold text-brand-heading transition hover:bg-white/[0.05] disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleteBusy}
                onClick={() => void confirmDelete()}
                className="rounded-xl border border-rose-500/40 bg-rose-500/15 px-4 py-2.5 text-sm font-semibold text-rose-100 transition hover:bg-rose-500/25 disabled:opacity-50"
              >
                {deleteBusy ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2].map((k) => (
            <TierCardSkeleton key={k} />
          ))}
        </div>
      ) : tiers.length === 0 ? (
        <div className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-gradient-to-br from-[var(--brand-accent-soft)]/10 via-[#0a0b0f] to-black/50 p-10 text-center shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)]">
          <div
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_0%,rgba(201,162,39,0.12),transparent_55%)]"
            aria-hidden
          />
          <div className="relative mx-auto max-w-md">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-brand-accent/25 bg-black/40 text-brand-accent">
              <Crown className="h-7 w-7" strokeWidth={1.5} aria-hidden />
            </span>
            <h2 className="mt-5 text-lg font-semibold text-brand-heading">No membership tiers yet</h2>
            <p className="mt-2 text-sm leading-relaxed text-brand-muted">
              Create your first tier with a name, minimum USD threshold, and a list of benefits users should expect.
            </p>
            <Link
              href="/dashboard/superadmin/membership/new"
              className="btn-primary mt-6 inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold"
            >
              <Plus className="h-4 w-4" strokeWidth={2} aria-hidden />
              Create membership
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {tiers.map((tier, index) => (
            <article
              key={tier.id}
              className={cn(
                'group relative flex flex-col overflow-hidden rounded-2xl border shadow-[0_24px_48px_-28px_rgba(0,0,0,0.65),inset_0_1px_0_0_rgba(255,255,255,0.06)] border-white/[0.1]'
              )}
            >
              <div
                className={cn(
                  'pointer-events-none absolute inset-0 bg-gradient-to-br opacity-90 from-white/[0.06] via-[#0a0b0f] to-black/90'
                )}
                aria-hidden
              />
              <div
                className="pointer-events-none absolute -right-16 -top-20 h-48 w-48 rounded-full bg-[radial-gradient(circle,rgba(201,162,39,0.14),transparent_68%)]"
                aria-hidden
              />

              <div className="relative flex flex-1 flex-col p-5 sm:p-6">
                <div className="flex items-start gap-4">
                  <span
                    className={cn(
                      'flex h-[3.75rem] w-[3.75rem] shrink-0 items-center justify-center rounded-2xl border shadow-lg transition-transform duration-300 group-hover:scale-[1.02] text-brand-accent border-white/[0.12] bg-gradient-to-br from-white/[0.12] to-black/55'
                    )}
                  >
                    <Crown className="h-8 w-8" strokeWidth={1.35} aria-hidden />
                  </span>
                  <div className="min-w-0 flex-1 pt-0.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-lg font-semibold tracking-tight text-brand-heading sm:text-xl">{tier.name}</h2>
                      {index === 0 ? (
                        <span className="inline-flex items-center gap-1 rounded-full border border-brand-accent/35 bg-black/40 px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wide text-brand-accent">
                          <Sparkles className="h-3 w-3" strokeWidth={2.5} aria-hidden />
                          Entry
                        </span>
                      ) : null}
                    </div>
                  </div>
                </div>

                <div className="relative mt-4 flex flex-wrap gap-2">
                  <Link
                    href={`/dashboard/superadmin/membership/${encodeURIComponent(tier.id)}/edit`}
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-white/[0.12] bg-black/35 px-3 py-2.5 text-sm font-semibold text-brand-heading transition hover:border-brand-accent/35 hover:bg-white/[0.04] sm:flex-none sm:px-4"
                  >
                    <Pencil className="h-4 w-4 shrink-0 text-brand-accent" strokeWidth={2} aria-hidden />
                    Edit
                  </Link>
                  <button
                    type="button"
                    onClick={() => setDeleteTarget({ id: tier.id, name: tier.name })}
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-rose-500/25 bg-rose-500/[0.08] px-3 py-2.5 text-sm font-semibold text-rose-100/95 transition hover:border-rose-500/40 hover:bg-rose-500/[0.14] sm:flex-none sm:px-4"
                  >
                    <Trash2 className="h-4 w-4 shrink-0" strokeWidth={2} aria-hidden />
                    Delete
                  </button>
                </div>

                <div
                  className={cn(
                    'relative mt-4 rounded-xl border p-4 sm:p-5 border-white/[0.1] bg-black/40'
                  )}
                >
                  <p className="text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-brand-subtle">
                    Minimum balance
                  </p>
                  <p
                    className={cn(
                      'mt-1.5 break-words text-2xl font-bold leading-none tracking-tight tabular-nums sm:text-3xl bg-gradient-to-r from-amber-100 via-brand-accent to-amber-200/95 bg-clip-text text-transparent'
                    )}
                  >
                    {formatCurrencySmart(tier.minValueUsd, 'USD')}
                  </p>
                </div>

                <MembershipTierFeatures tier={tier} title="Tier features" className="!mt-4" />

                <div className="relative mt-4 flex flex-wrap gap-2">
                  <span className="inline-flex items-center rounded-full border border-white/[0.1] bg-black/40 px-3 py-1 text-[0.65rem] font-semibold text-brand-muted">
                    {Array.isArray(tier.benefits) ? tier.benefits.length : 0}{' '}
                    {(tier.benefits || []).length === 1 ? 'benefit' : 'benefits'}
                  </span>
                </div>

                <ul className="relative mt-5 flex flex-1 flex-col gap-3 rounded-xl border border-white/[0.06] bg-black/25 p-4 sm:p-4">
                  {(tier.benefits || []).map((b, i) => (
                    <li
                      key={`${tier.id}-${i}`}
                      className="flex gap-3 text-sm leading-relaxed text-brand-muted sm:text-[0.9375rem]"
                    >
                      <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border border-emerald-500/20 bg-emerald-500/[0.08]">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" strokeWidth={2.25} aria-hidden />
                      </span>
                      <span className="min-w-0 pt-0.5 font-medium text-brand-heading/95">{b}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
