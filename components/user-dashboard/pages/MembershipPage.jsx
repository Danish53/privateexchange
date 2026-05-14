'use client';

import { useCallback, useEffect, useState } from 'react';
import { CheckCircle2, Crown, Shield, Sparkles, Wallet } from 'lucide-react';
import { useAuth } from '@/components/auth-context';
import { useUserWallet } from '@/components/user-dashboard/useUserWallet';
import { formatCurrencySmart, formatNumberSmart } from '@/lib/numberFormat';
import { cn } from '@/lib/utils';
import FeedbackMessage from '@/components/ui/FeedbackMessage';

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

function assignmentTypeLabel(type) {
  const t = String(type || '').toLowerCase();
  if (t === 'manual') return 'Manual assignment';
  if (t === 'automatic') return 'Automatic';
  return t || 'Assigned';
}

function formatTokenQty(n) {
  const x = Number(n);
  if (!Number.isFinite(x)) return '0';
  return formatNumberSmart(x, { maxFractionDigits: 8, minFractionDigits: 0 });
}

export default function MembershipPage() {
  const { token, ready, refreshUser } = useAuth();
  const {
    loading: walletLoading,
    error: walletError,
    tokens: walletTokens,
    portfolioUsd,
  } = useUserWallet();
  const [tiers, setTiers] = useState([]);
  const [assignment, setAssignment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!ready || !token) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/user/membership-overview', {
        cache: 'no-store',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) {
        setError(data.error || 'Could not load membership.');
        setTiers([]);
        setAssignment(null);
        return;
      }
      setTiers(Array.isArray(data.tiers) ? data.tiers : []);
      setAssignment(data.assignment && data.assignment.tierId ? data.assignment : null);
      if (typeof refreshUser === 'function') {
        try {
          await refreshUser();
        } catch {
          /* ignore */
        }
      }
    } catch {
      setError('Could not load membership.');
      setTiers([]);
      setAssignment(null);
    } finally {
      setLoading(false);
    }
  }, [ready, token, refreshUser]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!ready || !token || walletLoading) return;
    void load();
  }, [ready, token, walletLoading, load]);

  const assignedTierId = assignment?.tierId ? String(assignment.tierId) : null;

  return (
    <>
      <header className="mb-8 sm:mb-10">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-brand-subtle">Account</p>
            <h1 className="mt-1.5 text-2xl font-semibold tracking-[-0.03em] text-brand-heading sm:text-[1.75rem]">
              Membership
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-brand-muted">
              Plans configured on the platform. When your account is assigned a tier, it is highlighted below.
            </p>
          </div>
          {assignment ? (
            <div className="shrink-0 rounded-xl border border-white/[0.06] bg-black/[0.28] px-4 py-3 text-right">
              <p className="text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-brand-subtle">Your tier</p>
              <p className="mt-1 text-sm font-semibold text-brand-heading">{assignment.tierName || '—'}</p>
              {/* <p className="mt-0.5 text-xs text-brand-muted">{assignmentTypeLabel(assignment.assignmentType)}</p> */}
            </div>
          ) : (
            <p className="shrink-0 text-xs font-medium tabular-nums text-brand-subtle">Catalog · {tiers.length} tiers</p>
          )}
        </div>
      </header>

      <div className="space-y-8">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-2xl border border-white/[0.08] bg-black/[0.28] p-5 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)]">
            <div className="flex items-center gap-2 text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-brand-subtle">
              <Shield className="h-3.5 w-3.5 text-brand-accent" strokeWidth={2} aria-hidden />
              Tiers
            </div>
            <p className="mt-2 text-lg font-semibold tabular-nums text-brand-heading">{loading ? '—' : tiers.length}</p>
            <p className="mt-1 text-xs text-brand-muted">Published membership levels.</p>
          </div>
          <div className="rounded-2xl border border-brand-border-muted bg-black/[0.28] p-5 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)]">
            <div className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-brand-subtle">Total USD value</div>
            <p className="mt-2 text-lg font-semibold tabular-nums text-brand-heading">{formatCurrencySmart(portfolioUsd, 'USD')}</p>
          </div>
          <div className="rounded-2xl border border-brand-border-muted bg-black/[0.28] p-5 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)]">
            <div className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-brand-subtle">Currency</div>
            <p className="mt-2 text-lg font-semibold text-brand-heading">USD</p>
            <p className="mt-1 text-xs text-brand-muted">Minimum balance thresholds.</p>
          </div>
        </div>

        <FeedbackMessage tone="error" message={error} />

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
                When the team publishes tiers, they will show here with benefits and minimum balance in USD.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid items-start gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {tiers.map((tier, index) => {
              const isYours = assignedTierId && tier.id === assignedTierId;
              const hasAssignment = Boolean(assignedTierId);
              const isActive = Boolean(isYours);
              const isInactive = hasAssignment && !isYours;
              return (
                <article
                  key={tier.id}
                  aria-disabled={isInactive || undefined}
                  className={cn(
                    'group relative flex flex-col overflow-hidden rounded-2xl border shadow-[0_24px_48px_-28px_rgba(0,0,0,0.65),inset_0_1px_0_0_rgba(255,255,255,0.06)] transition-[transform,opacity,border-color,filter,box-shadow] duration-300 ease-out will-change-transform',
                    isActive &&
                      'z-[1] origin-top scale-[1.02] border-brand-accent sm:scale-[1.03] sm:border-2 sm:shadow-[0_0_0_1px_rgba(201,162,39,0.35),0_28px_60px_-22px_rgba(201,162,39,0.22),inset_0_1px_0_0_rgba(255,255,255,0.08)]',
                    isActive && 'ring-2 ring-brand-accent/40',
                    isInactive &&
                      'pointer-events-none border-white/[0.06] opacity-[0.5] saturate-[0.55] grayscale-[0.25]',
                    !isActive &&
                      !isInactive &&
                      'border-white/[0.1] hover:border-white/[0.14]'
                  )}
                >
                  <div
                    className={cn(
                      'pointer-events-none absolute inset-0 bg-gradient-to-br opacity-90',
                      isActive
                        ? 'from-[var(--brand-accent-soft)]/18 via-[#0c0d12] to-black'
                        : 'from-white/[0.06] via-[#0a0b0f] to-black/90'
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
                          'flex h-[3.75rem] w-[3.75rem] shrink-0 items-center justify-center rounded-2xl border shadow-lg transition-transform duration-300 text-brand-accent',
                          isActive
                            ? 'border-brand-accent/55 bg-gradient-to-br from-[var(--brand-accent-soft)]/45 to-black/60 group-hover:scale-[1.02]'
                            : 'border-white/[0.12] bg-gradient-to-br from-white/[0.12] to-black/55 group-hover:scale-[1.02]'
                        )}
                      >
                        <Crown className="h-8 w-8" strokeWidth={1.35} aria-hidden />
                      </span>
                      <div className="min-w-0 flex-1 pt-0.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <h2
                            className={cn(
                              'text-lg font-semibold tracking-tight sm:text-xl',
                              isInactive ? 'text-brand-muted' : 'text-brand-heading'
                            )}
                          >
                            {tier.name}
                          </h2>
                          {isYours ? (
                            <span className="inline-flex items-center gap-1 rounded-full border border-brand-accent/35 bg-black/40 px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wide text-brand-accent">
                              <Sparkles className="h-3 w-3" strokeWidth={2.5} aria-hidden />
                              Active
                            </span>
                          ) : !hasAssignment && index === 0 ? (
                            <span className="inline-flex items-center gap-1 rounded-full border border-white/[0.12] bg-black/35 px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wide text-brand-muted">
                              Entry
                            </span>
                          ) : null}
                        </div>
                        
                      </div>
                    </div>

                    <div
                      className={cn(
                        'relative mt-5 rounded-xl border p-4 sm:p-5',
                        isActive
                          ? 'border-brand-accent/30 bg-gradient-to-br from-black/55 to-[var(--brand-accent-soft)]/[0.1]'
                          : 'border-white/[0.1] bg-black/40'
                      )}
                    >
                      <p className="text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-brand-subtle">
                        Minimum balance
                      </p>
                      <p
                        className={cn(
                          'mt-1.5 break-words text-2xl font-bold leading-none tracking-tight tabular-nums sm:text-3xl',
                          isActive
                            ? 'bg-gradient-to-r from-amber-100 via-brand-accent to-amber-200/95 bg-clip-text text-transparent'
                            : isInactive
                              ? 'text-brand-muted'
                              : 'text-brand-heading'
                        )}
                      >
                        {formatCurrencySmart(tier.minValueUsd, 'USD')}
                      </p>
                    </div>

                    <div className="relative mt-4 flex flex-wrap gap-2">
                      <span
                        className={cn(
                          'inline-flex items-center rounded-full border px-3 py-1 text-[0.65rem] font-semibold',
                          isInactive
                            ? 'border-white/[0.06] bg-black/30 text-brand-subtle'
                            : 'border-white/[0.1] bg-black/40 text-brand-muted'
                        )}
                      >
                        {Array.isArray(tier.benefits) ? tier.benefits.length : 0}{' '}
                        {(tier.benefits || []).length === 1 ? 'benefit' : 'benefits'}
                      </span>
                    </div>

                    <ul
                      className={cn(
                        'relative mt-5 flex flex-1 flex-col gap-3 rounded-xl border p-4 sm:p-4',
                        isInactive ? 'border-white/[0.04] bg-black/20' : 'border-white/[0.06] bg-black/25'
                      )}
                    >
                      {(tier.benefits || []).map((b, i) => (
                        <li
                          key={`${tier.id}-${i}`}
                          className={cn(
                            'flex gap-3 text-sm leading-relaxed sm:text-[0.9375rem]',
                            isInactive ? 'text-brand-subtle' : 'text-brand-muted'
                          )}
                        >
                          <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border border-emerald-500/20 bg-emerald-500/[0.08]">
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" strokeWidth={2.25} aria-hidden />
                          </span>
                          <span
                            className={cn(
                              'min-w-0 pt-0.5 font-medium',
                              isInactive ? 'text-brand-muted' : 'text-brand-heading/95'
                            )}
                          >
                            {b}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </article>
              );
            })}
          </div>
        )}

      </div>
    </>
  );
}
