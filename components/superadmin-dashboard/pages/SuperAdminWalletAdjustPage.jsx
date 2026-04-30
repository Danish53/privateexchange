'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Loader2, ArrowLeft, Plus, Minus, History } from 'lucide-react';
import { useAuth } from '@/components/auth-context';
import { cn } from '@/lib/utils';
import { PLATFORM_TOKEN_SEED } from '@/lib/tokenCatalog';
import { mergeAdminPermissions } from '@/lib/adminPermissions';

function formatDateTime(iso) {
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

function tokenBalanceFromRow(row, symbolUpper) {
  const sym = String(symbolUpper).toUpperCase();
  const t = row?.tokens?.find((x) => String(x.symbol).toUpperCase() === sym);
  return t?.balance ?? '—';
}

export default function SuperAdminWalletAdjustPage() {
  const params = useParams();
  const router = useRouter();
  const userId = typeof params?.userId === 'string' ? params.userId : params?.userId?.[0] || '';
  const { token, ready, user } = useAuth();
  const canAdjustWallets =
    user?.role === 'superadmin' || mergeAdminPermissions(user?.adminPermissions).walletsAdjust;

  const [adjustRow, setAdjustRow] = useState(null);
  const [loadErr, setLoadErr] = useState('');
  const [loadingWallet, setLoadingWallet] = useState(true);

  const [adjustToken, setAdjustToken] = useState('');
  const [adjustAmount, setAdjustAmount] = useState('');
  const [adjustDirection, setAdjustDirection] = useState('credit');
  const [adjustNote, setAdjustNote] = useState('');
  const [adjustSaving, setAdjustSaving] = useState(false);
  const [adjustErr, setAdjustErr] = useState('');
  const [memberHistory, setMemberHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [adjustSuccess, setAdjustSuccess] = useState('');
  const [activeTokens, setActiveTokens] = useState([]);
  const [loadingActiveTokens, setLoadingActiveTokens] = useState(false);

  const loadWallet = useCallback(async () => {
    if (!token || !userId) return;
    setLoadingWallet(true);
    setLoadErr('');
    try {
      const res = await fetch(`/api/superadmin/wallets?forUser=${encodeURIComponent(userId)}`, {
        cache: 'no-store',
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.ok) {
        setLoadErr(json.error || 'Could not load wallet.');
        setAdjustRow(null);
        return;
      }
      if (json.memberWallet === false) {
        setLoadErr(
          json.archived
            ? 'This user is archived; there is no member wallet to adjust.'
            : 'This account is not a member wallet (for example admin accounts).'
        );
        setAdjustRow(null);
        return;
      }
      if (!json.wallet) {
        setLoadErr('Could not load wallet.');
        setAdjustRow(null);
        return;
      }
      setAdjustRow(json.wallet);
      const first = json.wallet.tokens?.[0]?.symbol;
      // Use activeTokens if available, otherwise fallback to PLATFORM_TOKEN_SEED
      const defaultToken = activeTokens.length > 0
        ? activeTokens[0].symbol
        : PLATFORM_TOKEN_SEED[0].symbol;
      setAdjustToken(String(first || defaultToken).toUpperCase());
    } catch {
      setLoadErr('Network error.');
      setAdjustRow(null);
    } finally {
      setLoadingWallet(false);
    }
  }, [token, userId, activeTokens]);

  const loadMemberHistory = useCallback(async () => {
    if (!token || !userId) return;
    setHistoryLoading(true);
    try {
      const res = await fetch(
        `/api/superadmin/wallets/member-history?userId=${encodeURIComponent(userId)}&limit=50`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const json = await res.json().catch(() => ({}));
      if (res.ok && json.ok) {
        setMemberHistory(json.entries ?? []);
      } else {
        setMemberHistory([]);
      }
    } catch {
      setMemberHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  }, [token, userId]);

  useEffect(() => {
    if (!ready || !userId) return;
    void loadWallet();
  }, [ready, userId, loadWallet]);

  useEffect(() => {
    if (!ready || !userId || !adjustRow) return;
    void loadMemberHistory();
  }, [ready, userId, adjustRow, loadMemberHistory]);

  // Fetch active tokens from API
  useEffect(() => {
    const fetchActiveTokens = async () => {
      setLoadingActiveTokens(true);
      try {
        const res = await fetch('/api/superadmin/tokens');
        const data = await res.json();
        if (data.success && data.data.length > 0) {
          setActiveTokens(data.data);
          // Update adjustToken if not already set
          if (!adjustToken && data.data[0]?.symbol) {
            setAdjustToken(data.data[0].symbol.toUpperCase());
          }
        }
      } catch (err) {
        console.error('Failed to fetch active tokens:', err);
      } finally {
        setLoadingActiveTokens(false);
      }
    };
    fetchActiveTokens();
  }, []);

  const submitAdjust = useCallback(async () => {
    if (!token || !adjustRow || !adjustToken) return;
    const amt = Number(String(adjustAmount).replace(/,/g, ''));
    if (!Number.isFinite(amt) || amt <= 0) {
      setAdjustErr('Enter a valid positive amount.');
      return;
    }
    setAdjustErr('');
    setAdjustSaving(true);
    try {
      const res = await fetch('/api/superadmin/wallets/adjust', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          userId: adjustRow.walletId,
          token: adjustToken,
          direction: adjustDirection,
          amount: amt,
          note: adjustNote.trim(),
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.ok) {
        setAdjustErr(json.error || 'Could not apply adjustment.');
        return;
      }
      if (json.summary && adjustRow) {
        setAdjustRow((prev) =>
          prev
            ? {
                ...prev,
                balanceDisplay: json.summary.totalUsdFormatted,
                totalUsd: json.summary.totalUsd,
                tokens: json.summary.tokens,
              }
            : prev
        );
      }
      setAdjustAmount('');
      setAdjustNote('');
      setAdjustErr('');
      setAdjustSuccess('Adjustment saved. Balances and history are updated.');
      window.setTimeout(() => setAdjustSuccess(''), 5000);
      await loadMemberHistory();
      await loadWallet();
    } catch {
      setAdjustErr('Network error.');
    } finally {
      setAdjustSaving(false);
    }
  }, [
    token,
    adjustRow,
    adjustToken,
    adjustAmount,
    adjustDirection,
    adjustNote,
    loadWallet,
    loadMemberHistory,
  ]);

  useEffect(() => {
    if (!ready || !user) return;
    if (!canAdjustWallets) {
      router.replace('/dashboard/superadmin/wallets');
    }
  }, [ready, user, canAdjustWallets, router]);

  if (!userId) {
    return (
      <div className="rounded-xl border border-red-500/25 bg-red-500/[0.08] px-4 py-3 text-sm text-red-200/95">
        Missing wallet user id.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 border-b border-white/[0.06] pb-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link
            href="/dashboard/superadmin/wallets"
            className="mb-3 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-brand-accent hover:underline"
          >
            <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
            Back to wallets
          </Link>
          <h1 className="text-xl font-semibold tracking-tight text-brand-heading sm:text-2xl">
            Manage balances
          </h1>
          {adjustRow ? (
            <p className="mt-1 truncate text-sm text-brand-muted">{adjustRow.memberEmail}</p>
          ) : null}
        </div>
      </div>

      {loadingWallet ? (
        <div className="flex min-h-[200px] items-center justify-center py-16">
          <Loader2 className="h-9 w-9 animate-spin text-brand-accent/80" strokeWidth={1.5} aria-hidden />
        </div>
      ) : loadErr || !adjustRow ? (
        <div className="rounded-xl border border-red-500/25 bg-red-500/[0.08] px-4 py-3 text-sm text-red-200/95">
          {loadErr || 'Wallet not found.'}
        </div>
      ) : !canAdjustWallets ? null : (
        <div className="space-y-6">
          {adjustSuccess ? (
            <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/[0.1] px-4 py-3 text-sm text-emerald-100/95">
              {adjustSuccess}
            </div>
          ) : null}

          <div className="flex flex-wrap gap-2 rounded-xl border border-white/[0.06] bg-black/25 px-4 py-3">
            <span className="inline-flex items-center gap-1.5 rounded-md bg-white/[0.06] px-2 py-1 text-[0.65rem] font-semibold uppercase tracking-wide text-brand-subtle">
              <span className="tabular-nums text-brand-accent">1</span> Token
            </span>
            <span className="text-brand-subtle/50">→</span>
            <span className="inline-flex items-center gap-1.5 rounded-md bg-white/[0.06] px-2 py-1 text-[0.65rem] font-semibold uppercase tracking-wide text-brand-subtle">
              <span className="tabular-nums text-brand-accent">2</span> Add / remove
            </span>
            <span className="text-brand-subtle/50">→</span>
            <span className="inline-flex items-center gap-1.5 rounded-md bg-white/[0.06] px-2 py-1 text-[0.65rem] font-semibold uppercase tracking-wide text-brand-subtle">
              <span className="tabular-nums text-brand-accent">3</span> Amount
            </span>
          </div>

          <div className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-gradient-to-b from-black/[0.35] to-[#060708] p-5 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)] sm:p-6">
            <div
              className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_100%_80%_at_50%_0%,rgba(201,162,39,0.05),transparent_55%)]"
              aria-hidden
            />
            <div className="relative space-y-8">
              <section>
                <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-subtle">
                  Step 1 — Select token
                </h2>
                {loadingActiveTokens ? (
                  <div className="mt-3 flex min-h-[120px] items-center justify-center rounded-xl border border-white/[0.08] bg-black/25">
                    <Loader2 className="h-6 w-6 animate-spin text-brand-accent/80" strokeWidth={1.5} aria-hidden />
                  </div>
                ) : (
                  <div className="mt-3 grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-5">
                    {(activeTokens.length > 0 ? activeTokens : PLATFORM_TOKEN_SEED).map((t) => {
                      const sym = String(t.symbol).toUpperCase();
                      const selected = adjustToken === sym;
                      const bal = tokenBalanceFromRow(adjustRow, sym);
                      return (
                        <button
                          key={t.slug || t._id}
                          type="button"
                          onClick={() => {
                            setAdjustToken(sym);
                            setAdjustErr('');
                            setAdjustSuccess('');
                          }}
                          className={cn(
                            'relative flex flex-col rounded-xl border px-3 py-3.5 text-left transition-colors',
                            selected
                              ? 'border-brand-accent bg-[var(--brand-accent-soft)]/20 ring-2 ring-brand-accent/35'
                              : 'border-white/[0.08] bg-black/25 hover:border-white/[0.14] hover:bg-black/35'
                          )}
                        >
                          <span
                            className={cn(
                              'pointer-events-none absolute bottom-2.5 left-2 top-2.5 w-1 rounded-full',
                              t.bar || 'bg-gray-500'
                            )}
                            aria-hidden
                          />
                          <span className="pl-3 text-[0.65rem] font-semibold uppercase tracking-wide text-brand-subtle">
                            {t.symbol}
                          </span>
                          <span className="pl-3 mt-0.5 text-sm font-semibold leading-tight text-brand-heading">
                            {t.name}
                          </span>
                          <span className="pl-3 mt-2 border-t border-white/[0.06] pt-2 text-[0.65rem] font-medium uppercase tracking-wide text-brand-subtle">
                            Balance
                          </span>
                          <span className="pl-3 mt-0.5 font-mono text-sm font-semibold tabular-nums text-brand-heading">
                            {bal}
                          </span>
                          {selected ? (
                            <span className="pl-3 mt-1 text-[0.6rem] font-semibold uppercase tracking-wide text-brand-accent">
                              Selected
                            </span>
                          ) : (
                            <span className="pl-3 mt-1 text-[0.6rem] text-brand-subtle">Tap to select</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </section>

              <section>
                <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-subtle">
                  Step 2 — Credit or debit
                </h2>
                <div className="mt-3 grid max-w-lg grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setAdjustDirection('credit');
                      setAdjustErr('');
                      setAdjustSuccess('');
                    }}
                    className={cn(
                      'flex flex-col items-center gap-1.5 rounded-xl border px-3 py-3 text-center text-sm font-semibold transition-colors',
                      adjustDirection === 'credit'
                        ? 'border-emerald-500/40 bg-emerald-500/[0.12] text-emerald-100'
                        : 'border-white/[0.08] bg-black/25 text-brand-muted hover:border-white/[0.12]'
                    )}
                  >
                    <Plus className="h-5 w-5" strokeWidth={2} aria-hidden />
                    Credit
                    <span className="text-[0.65rem] font-normal text-brand-subtle">Add to wallet</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAdjustDirection('debit');
                      setAdjustErr('');
                      setAdjustSuccess('');
                    }}
                    className={cn(
                      'flex flex-col items-center gap-1.5 rounded-xl border px-3 py-3 text-center text-sm font-semibold transition-colors',
                      adjustDirection === 'debit'
                        ? 'border-rose-500/40 bg-rose-500/[0.12] text-rose-100'
                        : 'border-white/[0.08] bg-black/25 text-brand-muted hover:border-white/[0.12]'
                    )}
                  >
                    <Minus className="h-5 w-5" strokeWidth={2} aria-hidden />
                    Debit
                    <span className="text-[0.65rem] font-normal text-brand-subtle">Subtract</span>
                  </button>
                </div>
              </section>

              <section>
                <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-subtle">
                  Step 3 — Amount & note
                </h2>
                <p className="mt-1 text-xs text-brand-muted">
                  Applies to <span className="font-semibold text-brand-heading">{adjustToken}</span>
                </p>
                <div className="mt-3 grid max-w-lg gap-3">
                  <div>
                    <label className="auth-label text-xs" htmlFor="adj-page-amt">
                      Amount
                    </label>
                    <input
                      id="adj-page-amt"
                      type="number"
                      inputMode="decimal"
                      min="0"
                      step="any"
                      value={adjustAmount}
                      onChange={(e) => setAdjustAmount(e.target.value)}
                      placeholder="0.00"
                      className="auth-input mt-1.5 tabular-nums"
                    />
                  </div>
                  <div>
                    <label className="auth-label text-xs" htmlFor="adj-page-note">
                      Note (optional)
                    </label>
                    <input
                      id="adj-page-note"
                      type="text"
                      value={adjustNote}
                      onChange={(e) => setAdjustNote(e.target.value)}
                      placeholder="Shown on ledger / user history"
                      className="auth-input mt-1.5"
                    />
                  </div>
                </div>
              </section>

              {adjustErr ? (
                <div className="rounded-xl border border-red-500/25 bg-red-500/[0.08] px-4 py-3 text-sm text-red-200/95">
                  {adjustErr}
                </div>
              ) : null}

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => void submitAdjust()}
                  disabled={adjustSaving}
                  className="btn-primary inline-flex min-h-[3rem] min-w-[12rem] items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold disabled:opacity-50"
                >
                  {adjustSaving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} aria-hidden />
                      Applying…
                    </>
                  ) : (
                    <>Apply to {adjustToken}</>
                  )}
                </button>
              </div>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-black/[0.22] p-5 sm:p-6">
            <div className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-brand-accent/25 bg-[var(--brand-accent-soft)]/30 text-brand-accent">
                <History className="h-4 w-4" strokeWidth={2} aria-hidden />
              </span>
              <div>
                <h2 className="text-sm font-semibold text-brand-heading">Admin adjustment history</h2>
                <p className="text-xs text-brand-muted">
                  Credits and debits for this user (token, amount, balance after each change).
                </p>
              </div>
            </div>

            {historyLoading ? (
              <div className="mt-6 flex justify-center py-8">
                <Loader2 className="h-7 w-7 animate-spin text-brand-accent/80" strokeWidth={1.5} aria-hidden />
              </div>
            ) : memberHistory.length === 0 ? (
              <p className="mt-6 rounded-xl border border-dashed border-white/[0.1] bg-black/20 px-3 py-4 text-center text-sm text-brand-muted">
                No admin adjustments yet for this account.
              </p>
            ) : (
              <ul className="mt-6 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {memberHistory.map((h) => (
                  <li
                    key={h.id}
                    className="rounded-xl border border-white/[0.06] bg-black/35 px-3 py-3 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)]"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <time className="text-xs tabular-nums text-brand-subtle" dateTime={h.createdAt}>
                        {formatDateTime(h.createdAt)}
                      </time>
                      <span
                        className={cn(
                          'rounded-md px-2 py-0.5 text-[0.65rem] font-bold uppercase tracking-wide',
                          h.direction === 'credit'
                            ? 'bg-emerald-500/15 text-emerald-200/95'
                            : 'bg-rose-500/15 text-rose-200/95'
                        )}
                      >
                        {h.direction === 'credit' ? 'Credit' : 'Debit'}
                      </span>
                    </div>
                    <div className="mt-2 flex flex-wrap items-baseline justify-between gap-2">
                      <span className="text-sm font-semibold text-brand-heading">{h.token}</span>
                      <span
                        className={cn(
                          'font-mono text-sm font-semibold tabular-nums',
                          h.direction === 'credit' ? 'text-emerald-300/95' : 'text-rose-200/95'
                        )}
                      >
                        {h.signedLabel}
                      </span>
                    </div>
                    {h.balanceAfterFormatted ? (
                      <p className="mt-1.5 text-xs text-brand-muted">
                        Balance after ·{' '}
                        <span className="font-mono font-medium text-brand-heading">
                          {h.balanceAfterFormatted} {h.token}
                        </span>
                      </p>
                    ) : null}
                    {h.note ? (
                      <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-brand-subtle">{h.note}</p>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
